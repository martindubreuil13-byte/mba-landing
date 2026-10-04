import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { Lead } from "@/app/lib/resources/types";

/**
 * Single source of truth for marketing consent across every surface.
 *
 * CONFIRMED OPT-IN. A form submission records an `opt_in_requested` evidence
 * row and marks the lead `pending`; marketing stays OFF. Only when the
 * recipient confirms from the link in the email does `ongoing_content_opt_in`
 * become true (with an `opt_in` row, method `email_confirmation`, pointing back
 * at the request). Unconfirmed addresses are therefore never in the marketing
 * set, which every export / audience query reads from `ongoing_content_opt_in`.
 *
 *  - `leads.ongoing_content_opt_in` stays the live flag the rest of the app reads.
 *  - `consent_records` is the append-only evidence log; nothing is ever edited.
 *  - Consent STATUS is derived here, never stored twice, so it cannot drift.
 */

export type ConsentStatus = "pending" | "opted_in" | "opted_out" | "suppressed";

type ConsentFields = Pick<
  Lead,
  "ongoing_content_opt_in" | "ongoing_content_opt_in_at" | "ongoing_content_opt_out_at" | "suppressed_at" | "consent_requested_at"
>;

export function consentStatusOf(lead: ConsentFields): ConsentStatus {
  if (lead.suppressed_at) return "suppressed";
  if (lead.ongoing_content_opt_in) return "opted_in";
  const requested = lead.consent_requested_at;
  const out = lead.ongoing_content_opt_out_at;
  if (requested && (!out || requested > out)) return "pending";
  if (lead.ongoing_content_opt_in_at || out) return "opted_out";
  return "pending";
}

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
  pending: "Pending",
  opted_in: "Opted in",
  opted_out: "Opted out",
  suppressed: "Suppressed",
};

export type ConsentDecision = "request_confirmation" | "already_opted_in" | "blocked_suppressed";

/**
 * What an explicit opt-in action should do to this lead:
 *  - active subscriber  -> keep the ORIGINAL consent; nothing new is recorded
 *  - pending / opted out -> record the request and wait for email confirmation
 *    (history is preserved in consent_records; opt_out_at stays in place)
 *  - suppressed (spam complaint) -> never reactivated by a form
 */
export function decideConsent(lead: ConsentFields): ConsentDecision {
  const status = consentStatusOf(lead);
  if (status === "suppressed") return "blocked_suppressed";
  if (status === "opted_in") return "already_opted_in";
  return "request_confirmation";
}

export type ConsentEvidence = {
  wordingVersion: string;
  wordingText: string | null;
  method: "button_disclosure" | "checkbox" | "email_confirmation" | "unsubscribe_link" | "spam_complaint" | "legacy";
  sourceType?: string | null;
  sourceResourceId?: string | null;
  sourceUrl?: string | null;
  ctaLocation?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
  relatedRecordId?: string | null;
};

type ConsentAction = "opt_in_requested" | "opt_in" | "opt_out";

function evidenceRow(leadId: string, action: ConsentAction, e: ConsentEvidence, createdAt: string) {
  return {
    lead_id: leadId,
    action,
    wording_version: e.wordingVersion,
    wording_text: e.wordingText,
    method: e.method,
    source_type: e.sourceType ?? null,
    source_resource_id: e.sourceResourceId ?? null,
    source_url: e.sourceUrl ?? null,
    cta_location: e.ctaLocation ?? null,
    ip_hash: e.ipHash ?? null,
    user_agent_hash: e.userAgentHash ?? null,
    related_record_id: e.relatedRecordId ?? null,
    created_at: createdAt,
  };
}

/** A repeat request inside this window does not write a second `opt_in_requested` row. */
const REQUEST_DEDUPE_MINUTES = 10;

/**
 * Records an explicit opt-in REQUEST (marketing stays off until confirmed).
 * The `consent_requested_at` stamp is updated conditionally, so two concurrent
 * submissions produce ONE evidence row. Returns false if another request won.
 */
export async function requestOptIn(leadId: string, evidence: ConsentEvidence): Promise<boolean> {
  const supabase = getServiceClient();
  const now = new Date();
  const stale = new Date(now.getTime() - REQUEST_DEDUPE_MINUTES * 60_000).toISOString();

  const { data: claimed, error } = await supabase
    .from("leads")
    .update({ consent_requested_at: now.toISOString() })
    .eq("id", leadId)
    .eq("ongoing_content_opt_in", false)
    .is("suppressed_at", null)
    .or(`consent_requested_at.is.null,consent_requested_at.lt.${stale}`)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Failed to record opt-in request: ${error.message}`);
  if (!claimed) return false;

  const { error: recordError } = await supabase.from("consent_records").insert(evidenceRow(leadId, "opt_in_requested", evidence, now.toISOString()));
  if (recordError) throw new Error(`Failed to write consent record: ${recordError.message}`);
  return true;
}

export type ConfirmResult =
  | { status: "confirmed"; sourceResourceId: string | null; recordId: string }
  | { status: "already_confirmed" | "not_pending" | "suppressed" | "not_found" };

/**
 * Activates marketing after the recipient confirms. The wording, source and CTA
 * come from the original request (that is what they agreed to); the confirming
 * device's hashed IP / user agent are stored as the confirmation evidence.
 */
export async function confirmOptIn(leadId: string, device: { ipHash: string | null; userAgentHash: string | null }): Promise<ConfirmResult> {
  const supabase = getServiceClient();
  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  if (!lead) return { status: "not_found" };

  const status = consentStatusOf(lead as Lead);
  if (status === "suppressed") return { status: "suppressed" };
  if (status === "opted_in") return { status: "already_confirmed" };
  if (status !== "pending" || !lead.consent_requested_at) return { status: "not_pending" };

  const { data: requested } = await supabase
    .from("consent_records")
    .select("*")
    .eq("lead_id", leadId)
    .eq("action", "opt_in_requested")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!requested) return { status: "not_pending" };

  const now = new Date().toISOString();
  const { data: flipped, error: flipError } = await supabase
    .from("leads")
    .update({ ongoing_content_opt_in: true, ongoing_content_opt_in_at: now })
    .eq("id", leadId)
    .eq("ongoing_content_opt_in", false)
    .is("suppressed_at", null)
    .select("id")
    .maybeSingle();
  if (flipError) throw new Error(`Failed to confirm opt-in: ${flipError.message}`);
  if (!flipped) return { status: "already_confirmed" };

  const { data: record, error: recordError } = await supabase
    .from("consent_records")
    .insert(
      evidenceRow(
        leadId,
        "opt_in",
        {
          wordingVersion: requested.wording_version,
          wordingText: requested.wording_text,
          method: "email_confirmation",
          sourceType: requested.source_type,
          sourceResourceId: requested.source_resource_id,
          sourceUrl: requested.source_url,
          ctaLocation: requested.cta_location,
          ipHash: device.ipHash,
          userAgentHash: device.userAgentHash,
          relatedRecordId: requested.id,
        },
        now
      )
    )
    .select("id")
    .single();
  if (recordError) throw new Error(`Failed to write consent record: ${recordError.message}`);

  return { status: "confirmed", sourceResourceId: requested.source_resource_id, recordId: record.id };
}

export type ExplicitOptInResult = "opted_in" | "already_opted_in" | "blocked_suppressed";

/**
 * Records an explicit, affirmative opt-in made by clicking a clearly worded button on a resource form
 * (single step: no confirmation email). It:
 *  - activates marketing consent and stamps ongoing_content_opt_in_at, clearing any pending confirmation request;
 *  - appends an `opt_in` evidence row (wording version + exact text, source resource, page, hashed device);
 *  - NEVER reactivates a suppressed lead (spam complaint) and never rewrites an existing active opt-in,
 *    so the original consent evidence is preserved;
 *  - undoes the flag change if the evidence row cannot be written, so there is never consent without a record.
 * A previously unsubscribed lead who clicks the explicit button is re-subscribed; the earlier opt-out record stays.
 */
export async function recordExplicitOptIn(leadId: string, evidence: ConsentEvidence): Promise<ExplicitOptInResult> {
  const supabase = getServiceClient();
  const { data: before, error: loadError } = await supabase
    .from("leads")
    .select("ongoing_content_opt_in, ongoing_content_opt_in_at, consent_requested_at, suppressed_at")
    .eq("id", leadId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load lead: ${loadError.message}`);
  if (!before) throw new Error("Failed to record opt-in: lead not found");
  if (before.suppressed_at) return "blocked_suppressed";
  if (before.ongoing_content_opt_in) return "already_opted_in";

  const now = new Date().toISOString();
  const { data: flipped, error: flipError } = await supabase
    .from("leads")
    .update({ ongoing_content_opt_in: true, ongoing_content_opt_in_at: now, consent_requested_at: null })
    .eq("id", leadId)
    .eq("ongoing_content_opt_in", false)
    .is("suppressed_at", null)
    .select("id")
    .maybeSingle();
  if (flipError) throw new Error(`Failed to record opt-in: ${flipError.message}`);
  if (!flipped) return "already_opted_in"; // a concurrent request won; its evidence row exists

  const { error: recordError } = await supabase.from("consent_records").insert(evidenceRow(leadId, "opt_in", evidence, now));
  if (recordError) {
    await supabase
      .from("leads")
      .update({
        ongoing_content_opt_in: false,
        ongoing_content_opt_in_at: before.ongoing_content_opt_in_at,
        consent_requested_at: before.consent_requested_at,
      })
      .eq("id", leadId);
    throw new Error(`Failed to write consent record: ${recordError.message}`);
  }
  return "opted_in";
}

export type OptOutResult = "updated" | "already_opted_out" | "not_found";

/**
 * The ONE unsubscribe implementation (neutral /unsubscribe route, legacy
 * Napkin link, spam-complaint webhook). Preserves history: it flips the live
 * flag, stamps opt_out_at and appends an opt_out record. It also cancels a
 * pending (unconfirmed) request, so an old confirmation link stops working.
 */
export async function applyOptOut(
  leadId: string,
  evidence: Pick<ConsentEvidence, "method" | "wordingVersion"> & Partial<ConsentEvidence>,
  options: { suppress?: string } = {}
): Promise<OptOutResult> {
  const supabase = getServiceClient();
  const { data: lead, error: lookupError } = await supabase
    .from("leads")
    .select("id, ongoing_content_opt_in, suppressed_at, consent_requested_at, ongoing_content_opt_out_at")
    .eq("id", leadId)
    .maybeSingle();
  if (lookupError) throw new Error(`Failed to load lead: ${lookupError.message}`);
  if (!lead) return "not_found";

  const now = new Date().toISOString();
  const suppressionFields = options.suppress && !lead.suppressed_at ? { suppressed_at: now, suppression_reason: options.suppress } : {};
  const pending = !lead.ongoing_content_opt_in && !!lead.consent_requested_at && (!lead.ongoing_content_opt_out_at || lead.consent_requested_at > lead.ongoing_content_opt_out_at);

  if (!lead.ongoing_content_opt_in && !pending) {
    if (Object.keys(suppressionFields).length > 0) await supabase.from("leads").update(suppressionFields).eq("id", leadId);
    return "already_opted_out";
  }

  const { data: flipped, error } = await supabase
    .from("leads")
    .update({ ongoing_content_opt_in: false, ongoing_content_opt_out_at: now, consent_requested_at: null, ...suppressionFields })
    .eq("id", leadId)
    .or("ongoing_content_opt_in.eq.true,consent_requested_at.not.is.null")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Failed to unsubscribe lead: ${error.message}`);
  if (!flipped) return "already_opted_out";

  const { error: recordError } = await supabase.from("consent_records").insert(evidenceRow(leadId, "opt_out", { wordingText: null, ...evidence }, now));
  if (recordError) throw new Error(`Failed to write opt-out record: ${recordError.message}`);

  return "updated";
}
