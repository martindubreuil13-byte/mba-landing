import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { normalizeEmail } from "@/app/lib/leads/upsert";
import { decideConsent, requestOptIn, type ConsentEvidence } from "@/app/lib/leads/consent";
import { consentEvidenceText, type ConsentCopy } from "./consent-copy";
import { linkSessionEventsToLead, recordResourceEvent } from "./event-store";
import type { Lead, LeadStatus, Resource, ResourceRequest } from "./types";

/** A repeat request for the same resource inside this window re-uses the existing request. */
const REUSE_WINDOW_MINUTES = 10;

/** pending_confirmation: request recorded, marketing starts only after the reader confirms. */
export type ConsentOutcome = "pending_confirmation" | "existing" | "not_applied";

export type PrintableGuideRequest = {
  resource: Resource;
  /** e.g. "guide" — stored as the consent record's source type. */
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

export type PrintableGuideResult = {
  lead: Lead;
  request: ResourceRequest;
  leadCreated: boolean;
  consentOutcome: ConsentOutcome;
  /** True when an earlier identical request was re-used (no new row, no new email). */
  reused: boolean;
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

  // first_name is NOT NULL in the existing schema; this form collects email only.
  const { data, error } = await supabase
    .from("leads")
    .insert({ email, first_name: "", ongoing_content_opt_in: false, lead_status: "new", last_activity_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    // Unique-email race: another request created it first.
    const raced = await lookup();
    if (raced) return { lead: raced, created: false };
    throw new Error(`Failed to create lead: ${error.message}`);
  }
  return { lead: data as Lead, created: true };
}

/**
 * Lead status is relationship workflow only. A first touch is `new`; a repeat
 * touch promotes `new` to `engaged`. Anything further along (qualified,
 * contacted, converted, archived) is never moved by a download.
 */
export function nextLeadStatus(current: LeadStatus | undefined, isRepeatTouch: boolean): LeadStatus {
  const status = current ?? "new";
  return status === "new" && isRepeatTouch ? "engaged" : status;
}

export async function requestPrintableGuide(input: PrintableGuideRequest): Promise<PrintableGuideResult> {
  const supabase = getServiceClient();
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const found = await findOrCreateLead(email);
  const lead = found.lead;
  const leadCreated = found.created;

  // --- consent -----------------------------------------------------------
  const decision = decideConsent(lead);
  let consentOutcome: ConsentOutcome;

  if (decision === "request_confirmation") {
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
    // False only when a concurrent / very recent identical request already wrote the evidence row.
    await requestOptIn(lead.id, evidence);
    consentOutcome = "pending_confirmation";
  } else if (decision === "already_opted_in") {
    consentOutcome = "existing";
  } else {
    consentOutcome = "not_applied";
  }

  // --- re-use a very recent identical request -----------------------------
  const since = new Date(Date.now() - REUSE_WINDOW_MINUTES * 60_000).toISOString();
  const { data: recent } = await supabase
    .from("resource_requests")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("resource_id", input.resource.id)
    .eq("resource_action", "download")
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
    const { count: priorRequests } = await supabase
      .from("resource_requests")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id);

    const { data: inserted, error } = await supabase
      .from("resource_requests")
      .insert({
        lead_id: lead.id,
        resource_id: input.resource.id,
        resource_action: "download",
        opted_in_this_request: consentOutcome === "pending_confirmation",
        session_id: input.sessionId,
        cta_location: input.ctaLocation,
        source_page_url: input.pageUrl,
        delivery_status: "accepted",
        delivery_updated_at: now,
        source: input.attribution.source,
        medium: input.attribution.medium,
        campaign: input.attribution.campaign,
        referrer: input.attribution.referrer,
        utm_source: input.attribution.utm_source,
        utm_medium: input.attribution.utm_medium,
        utm_campaign: input.attribution.utm_campaign,
        utm_content: input.attribution.utm_content,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to record resource request: ${error.message}`);
    request = inserted as ResourceRequest;

    const isRepeatTouch = !leadCreated || (priorRequests ?? 0) > 0;
    await supabase
      .from("leads")
      .update({ lead_status: nextLeadStatus(lead.lead_status, isRepeatTouch), last_activity_at: now })
      .eq("id", lead.id);
  }

  // A double-click or retry re-uses the request and must not count as a second submission.
  if (!reused) await recordResourceEvent({
    name: "resource_form_submitted",
    resource: input.resource,
    sessionId: input.sessionId,
    leadId: lead.id,
    requestId: request.id,
    ctaLocation: input.ctaLocation,
    pageUrl: input.pageUrl,
    referrer: input.attribution.referrer,
    utmSource: input.attribution.utm_source,
    utmMedium: input.attribution.utm_medium,
    utmCampaign: input.attribution.utm_campaign,
    deviceType: input.deviceType,
    metadata: {
      consent: consentOutcome,
      wording_version: input.consent.id,
      lead_created: leadCreated,
      reused_request: reused,
    },
  });

  if (input.sessionId) await linkSessionEventsToLead(input.resource.id, input.sessionId, lead.id);

  return { lead, request, leadCreated, consentOutcome, reused };
}
