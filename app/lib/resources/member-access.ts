import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { normalizeEmail } from "@/app/lib/leads/upsert";
import { consentStatusOf, requestOptIn, type ConsentEvidence } from "@/app/lib/leads/consent";
import { getResourceConfig } from "./config";
import { consentEvidenceText, type ConsentCopy } from "./consent-copy";
import { createDownloadToken } from "./download-token";
import { beginNewDelivery, sendDeliveryEmail } from "./delivery-email";
import { linkSessionEventsToLead, recordResourceEvent } from "./event-store";
import { sendMembershipConfirmationEmail, sendRejoinConfirmationEmail } from "./membership-email";
import type { Lead, LeadStatus, Resource, ResourceRequest } from "./types";

/**
 * The generic "public layer + free-member layer" service. It knows nothing about any particular guide: everything
 * resource-specific (copy, consent wording, emails, the file) comes from ResourceConfig.access and the resources row.
 *
 *   new / pending  -> a LOCKED membership request + a confirmation email. No download URL exists yet.
 *   confirmed      -> the benefit is emailed (never shown on screen: typing a member's address must unlock nothing).
 *   unsubscribed / suppressed -> nothing is sent or changed; the caller shows the same neutral screen.
 *   confirmation POST (see fulfillMemberBenefit) -> unlocks the locked requests and delivers the benefit.
 */

/** A repeat request for the same resource inside this window re-uses the existing request (no second email). */
const REUSE_WINDOW_MINUTES = 10;

export type AccessAction = "send_confirmation" | "send_delivery" | "blocked_unsubscribed" | "blocked_suppressed";

/** Pure: what a standard resource form submission does for a lead in this state. */
export function decideAccessAction(lead: Pick<Lead, "ongoing_content_opt_in" | "ongoing_content_opt_in_at" | "ongoing_content_opt_out_at" | "suppressed_at" | "consent_requested_at">): AccessAction {
  const status = consentStatusOf(lead);
  if (status === "suppressed") return "blocked_suppressed";
  if (status === "opted_in") return "send_delivery";
  if (status === "opted_out") return "blocked_unsubscribed";
  return "send_confirmation";
}

export type MemberAccessRequest = {
  resource: Resource;
  sourceType: string;
  email: string;
  consent: ConsentCopy;
  sessionId: string | null;
  ctaLocation: string;
  pageUrl: string | null;
  attribution: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    referrer: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
  };
  evidence: { ipHash: string | null; userAgentHash: string | null };
  deviceType: string;
};

export type MemberAccessResult = {
  action: AccessAction;
  /** The email that was attempted: queued / failed, or none (blocked, or a re-used recent request). */
  email: "queued" | "failed" | "not_sent";
  /** Internal use only (events, tests). It is never put in a response. */
  requestId: string | null;
  leadId: string;
};

async function findOrCreateLead(email: string): Promise<{ lead: Lead; created: boolean }> {
  const supabase = getServiceClient();
  const lookup = async () => {
    const { data, error } = await supabase.from("leads").select("*").eq("email", email).maybeSingle();
    if (error) throw new Error(`Failed to look up lead: ${error.message}`);
    return data as Lead | null;
  };
  const existing = await lookup();
  if (existing) return { lead: existing, created: false };

  // first_name is NOT NULL in the existing schema; these forms collect email only.
  const { data, error } = await supabase
    .from("leads")
    .insert({ email, first_name: "", ongoing_content_opt_in: false, lead_status: "new", last_activity_at: new Date().toISOString() })
    .select()
    .single();
  if (error) {
    const raced = await lookup();
    if (raced) return { lead: raced, created: false };
    throw new Error(`Failed to create lead: ${error.message}`);
  }
  return { lead: data as Lead, created: true };
}

/**
 * Lead status is relationship workflow only. A first touch is `new`; a repeat touch promotes `new` to `engaged`.
 * Anything further along is never moved by a request.
 */
export function nextLeadStatus(current: LeadStatus | undefined, isRepeatTouch: boolean): LeadStatus {
  const status = current ?? "new";
  return status === "new" && isRepeatTouch ? "engaged" : status;
}

type Attribution = MemberAccessRequest["attribution"];

/**
 * Attribution is copied onto the request so request-level reporting never depends on joining the event stream.
 * When the submitting page view carried none (e.g. a return visit in a new tab), the first attributed event of
 * the same session fills the gap. The events stay the detailed source of truth.
 */
export async function resolveAttribution(resourceId: string, sessionId: string | null, given: Attribution): Promise<Attribution> {
  const hasAny = Boolean(given.referrer || given.utm_source || given.utm_medium || given.utm_campaign || (given.source && given.source !== "direct"));
  if (hasAny || !sessionId) return given;
  const { data } = await getServiceClient()
    .from("resource_events")
    .select("referrer, utm_source, utm_medium, utm_campaign")
    .eq("resource_id", resourceId)
    .eq("session_id", sessionId)
    .eq("event_name", "resource_page_view")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data || (!data.referrer && !data.utm_source)) return given;
  return {
    ...given,
    referrer: data.referrer ?? given.referrer,
    source: data.utm_source ?? given.source,
    medium: data.utm_medium ?? given.medium,
    campaign: data.utm_campaign ?? given.campaign,
  };
}

async function insertRequest(args: { input: MemberAccessRequest; lead: Lead; leadCreated: boolean; fulfilled: boolean; optedInThisRequest: boolean; attribution: Attribution }): Promise<ResourceRequest> {
  const supabase = getServiceClient();
  const { input, lead, attribution } = args;
  const now = new Date().toISOString();
  const { count: priorRequests } = await supabase.from("resource_requests").select("id", { count: "exact", head: true }).eq("lead_id", lead.id);

  const { data: inserted, error } = await supabase
    .from("resource_requests")
    .insert({
      lead_id: lead.id,
      resource_id: input.resource.id,
      resource_action: "download",
      opted_in_this_request: args.optedInThisRequest,
      session_id: input.sessionId,
      cta_location: input.ctaLocation,
      source_page_url: input.pageUrl,
      delivery_status: "accepted",
      delivery_updated_at: now,
      benefit_fulfilled_at: args.fulfilled ? now : null,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      referrer: attribution.referrer,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to record resource request: ${error.message}`);

  const isRepeatTouch = !args.leadCreated || (priorRequests ?? 0) > 0;
  await supabase.from("leads").update({ lead_status: nextLeadStatus(lead.lead_status, isRepeatTouch), last_activity_at: now }).eq("id", lead.id);
  return inserted as ResourceRequest;
}

export async function requestMemberAccess(input: MemberAccessRequest): Promise<MemberAccessResult> {
  const supabase = getServiceClient();
  const config = getResourceConfig(input.resource.slug);
  if (!config) throw new Error("Resource has no member-access configuration.");

  const { lead, created: leadCreated } = await findOrCreateLead(normalizeEmail(input.email));
  const action = decideAccessAction(lead);

  // --- not acted on: unsubscribed or suppressed. No request, no consent change, no email. ---------------------
  if (action === "blocked_unsubscribed" || action === "blocked_suppressed") {
    await recordResourceEvent({
      name: "resource_membership_blocked",
      resource: input.resource,
      sessionId: input.sessionId,
      ctaLocation: input.ctaLocation,
      pageUrl: input.pageUrl,
      deviceType: input.deviceType,
      metadata: { reason: action === "blocked_suppressed" ? "suppressed" : "unsubscribed" },
    });
    return { action, email: "not_sent", requestId: null, leadId: lead.id };
  }

  const attribution = await resolveAttribution(input.resource.id, input.sessionId, input.attribution);
  const since = new Date(Date.now() - REUSE_WINDOW_MINUTES * 60_000).toISOString();

  if (action === "send_confirmation") {
    const evidence: ConsentEvidence = {
      wordingVersion: input.consent.id,
      wordingText: consentEvidenceText(input.consent),
      method: input.consent.method,
      sourceType: input.sourceType,
      sourceResourceId: input.resource.id,
      sourceUrl: input.pageUrl,
      ctaLocation: input.ctaLocation,
      ipHash: input.evidence.ipHash,
      userAgentHash: input.evidence.userAgentHash,
    };
    // Returns false when a concurrent / very recent identical request already wrote the evidence row.
    await requestOptIn(lead.id, evidence);

    // Re-use a very recent LOCKED request (double click, retry); an older one starts a fresh request + email.
    const { data: recent } = await supabase
      .from("resource_requests")
      .select("*")
      .eq("lead_id", lead.id)
      .eq("resource_id", input.resource.id)
      .is("benefit_fulfilled_at", null)
      .gte("requested_at", since)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let request: ResourceRequest;
    let reused = false;
    if (recent) {
      request = recent as ResourceRequest;
      reused = true;
    } else {
      request = await insertRequest({ input, lead, leadCreated, fulfilled: false, optedInThisRequest: true, attribution });
      await recordResourceEvent({
        name: "resource_form_submitted",
        resource: input.resource,
        sessionId: input.sessionId,
        leadId: lead.id,
        requestId: request.id,
        ctaLocation: input.ctaLocation,
        pageUrl: input.pageUrl,
        referrer: attribution.referrer,
        utmSource: attribution.utm_source ?? attribution.source,
        utmMedium: attribution.utm_medium ?? attribution.medium,
        utmCampaign: attribution.utm_campaign ?? attribution.campaign,
        deviceType: input.deviceType,
        metadata: { consent: "pending_confirmation", wording_version: input.consent.id, lead_created: leadCreated },
      });
    }
    if (input.sessionId) await linkSessionEventsToLead(input.resource.id, input.sessionId, lead.id);

    // Send unless an earlier email for this very request is already on its way (failed ones are retried).
    const previous = request.delivery_status ?? "not_tracked";
    const earlierEmailNeverWent = reused && (previous === "failed" || previous === "not_tracked");
    if (reused && !earlierEmailNeverWent) return { action, email: "not_sent", requestId: request.id, leadId: lead.id };
    if (earlierEmailNeverWent) await beginNewDelivery(request.id);
    const sent = await sendMembershipConfirmationEmail({ to: input.email, config, resource: input.resource, requestId: request.id, leadId: lead.id, retry: earlierEmailNeverWent });
    return { action, email: sent.status, requestId: request.id, leadId: lead.id };
  }

  // --- confirmed member: email the benefit (never on screen) -------------------------------------------------
  const { data: recentMember } = await supabase
    .from("resource_requests")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("resource_id", input.resource.id)
    .not("benefit_fulfilled_at", "is", null)
    .gte("requested_at", since)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let request: ResourceRequest;
  let reused = false;
  if (recentMember) {
    request = recentMember as ResourceRequest;
    reused = true;
  } else {
    request = await insertRequest({ input, lead, leadCreated, fulfilled: true, optedInThisRequest: false, attribution });
    await recordResourceEvent({
      name: "resource_form_submitted",
      resource: input.resource,
      sessionId: input.sessionId,
      leadId: lead.id,
      requestId: request.id,
      ctaLocation: input.ctaLocation,
      pageUrl: input.pageUrl,
      referrer: attribution.referrer,
      utmSource: attribution.utm_source ?? attribution.source,
      utmMedium: attribution.utm_medium ?? attribution.medium,
      utmCampaign: attribution.utm_campaign ?? attribution.campaign,
      deviceType: input.deviceType,
      metadata: { consent: "existing", wording_version: input.consent.id, lead_created: false },
    });
    await recordResourceEvent({ name: "resource_benefit_fulfilled", resource: input.resource, sessionId: input.sessionId, leadId: lead.id, requestId: request.id, metadata: { via: "existing_member" } });
  }
  if (input.sessionId) await linkSessionEventsToLead(input.resource.id, input.sessionId, lead.id);

  const previous = request.delivery_status ?? "not_tracked";
  const earlierEmailNeverWent = reused && (previous === "failed" || previous === "not_tracked");
  if (reused && !earlierEmailNeverWent) return { action, email: "not_sent", requestId: request.id, leadId: lead.id };
  if (earlierEmailNeverWent) await beginNewDelivery(request.id);
  const sent = await sendDeliveryEmail({ to: input.email, config, resource: input.resource, requestId: request.id, leadId: lead.id, consent: "active", retry: earlierEmailNeverWent });
  return { action, email: sent.status, requestId: request.id, leadId: lead.id };
}

// ---------------------------------------------------------------------------------------------------------------
// Confirmation POST -> unlock
// ---------------------------------------------------------------------------------------------------------------

export type BenefitResult = {
  /** Relative URL of the signed download, for the confirming browser. Only ever returned after confirmation. */
  downloadUrl: string | null;
  label: string | null;
  /** Locked requests unlocked by THIS call (0 on a replay). */
  newlyFulfilled: number;
  deliveryEmail: "queued" | "failed" | "not_sent";
};

export const benefitDownloadUrl = (request: Pick<ResourceRequest, "id" | "resource_id">, via = "confirm") =>
  `/api/resources/download?token=${encodeURIComponent(createDownloadToken(request.id, request.resource_id))}&via=${via}`;

/**
 * Idempotent. Unlocks every locked request this lead has for the resource (conditional update, so concurrent or
 * replayed confirmations unlock each request exactly once), then emails the durable link once, only if something
 * was newly unlocked. Always returns the signed link of the latest unlocked request for the confirming browser.
 */
export async function fulfillMemberBenefit(leadId: string, resourceId: string, via: "confirmation" = "confirmation"): Promise<BenefitResult | null> {
  const supabase = getServiceClient();
  const { data: resource } = await supabase.from("resources").select("*").eq("id", resourceId).maybeSingle();
  const config = resource ? getResourceConfig((resource as Resource).slug) : null;
  if (!resource || !config) return null;

  const now = new Date().toISOString();
  const { data: unlocked, error } = await supabase
    .from("resource_requests")
    .update({ benefit_fulfilled_at: now })
    .eq("lead_id", leadId)
    .eq("resource_id", resourceId)
    .is("benefit_fulfilled_at", null)
    .select("*");
  if (error) throw new Error(`Failed to unlock member benefit: ${error.message}`);
  const newly = (unlocked ?? []) as ResourceRequest[];

  for (const r of newly) {
    await recordResourceEvent({ name: "resource_benefit_fulfilled", resource: resource as Resource, sessionId: r.session_id ?? null, leadId, requestId: r.id, metadata: { via } });
  }

  let latest: ResourceRequest | null = newly.sort((a, b) => b.requested_at.localeCompare(a.requested_at))[0] ?? null;
  if (!latest) {
    const { data } = await supabase.from("resource_requests").select("*").eq("lead_id", leadId).eq("resource_id", resourceId).not("benefit_fulfilled_at", "is", null).order("requested_at", { ascending: false }).limit(1).maybeSingle();
    latest = (data as ResourceRequest | null) ?? null;
  }
  if (!latest) return { downloadUrl: null, label: config.access.memberBenefit.label, newlyFulfilled: 0, deliveryEmail: "not_sent" };

  let deliveryEmail: BenefitResult["deliveryEmail"] = "not_sent";
  if (newly.length > 0) {
    const { data: lead } = await supabase.from("leads").select("email").eq("id", leadId).maybeSingle();
    if (lead?.email) {
      await beginNewDelivery(latest.id);
      const sent = await sendDeliveryEmail({ to: lead.email, config, resource: resource as Resource, requestId: latest.id, leadId, consent: "active" });
      deliveryEmail = sent.status;
    }
  }
  return { downloadUrl: benefitDownloadUrl(latest), label: config.access.memberBenefit.label, newlyFulfilled: newly.length, deliveryEmail };
}

// ---------------------------------------------------------------------------------------------------------------
// Explicit rejoin
// ---------------------------------------------------------------------------------------------------------------

export type RejoinOutcome = "confirmation_sent" | "email_failed" | "no_action";

/**
 * The ONLY way an unsubscribed address can come back. It never creates a lead, never touches a suppressed or active
 * or pending address, and the caller shows the same neutral screen for every outcome.
 */
export async function requestRejoin(args: { email: string; consent: ConsentCopy; evidence: { ipHash: string | null; userAgentHash: string | null }; pageUrl: string | null }): Promise<RejoinOutcome> {
  const supabase = getServiceClient();
  const email = normalizeEmail(args.email);
  const { data: lead, error } = await supabase.from("leads").select("*").eq("email", email).maybeSingle();
  if (error) throw new Error(`Failed to look up lead: ${error.message}`);
  if (!lead) return "no_action";
  if (consentStatusOf(lead as Lead) !== "opted_out") return "no_action";

  const claimed = await requestOptIn(lead.id, {
    wordingVersion: args.consent.id,
    wordingText: consentEvidenceText(args.consent),
    method: args.consent.method,
    sourceType: "rejoin",
    sourceResourceId: null,
    sourceUrl: args.pageUrl,
    ctaLocation: null,
    ipHash: args.evidence.ipHash,
    userAgentHash: args.evidence.userAgentHash,
  });
  if (!claimed) return "no_action"; // a request was just made: its email is already on its way
  const sent = await sendRejoinConfirmationEmail({ to: email, leadId: lead.id });
  return sent.ok ? "confirmation_sent" : "email_failed";
}
