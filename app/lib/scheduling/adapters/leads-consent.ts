import "server-only";
import { consentRequiredFor } from "@/app/lib/consent/regions";
import { decideConsent, recordExplicitOptIn, requestOptIn, type ConsentEvidence } from "@/app/lib/leads/consent";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { normalizeEmail, upsertLeadPreservingOptIn } from "@/app/lib/leads/upsert";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { Lead } from "@/app/lib/resources/types";
import { COMMUNITY_SOURCE_TYPE, latestCommunityRequestId, sendCommunityVerificationEmail, type VerificationSender } from "@/app/lib/community/verification";
import { COMMUNITY_SOURCE, COMMUNITY_WORDING, SCHEDULING_COMMUNITY_VERSION, type CommunityConsentPort, type CommunityConsentResult, type CommunityVisitor } from "../community";

/**
 * Connects the post-booking community invitation to the site's existing Leads and consent records (the same ones the guides and the Transition
 * invitation use). It is consent COLLECTION for future communications, not a subscription: no mailing platform is involved and nothing is sent.
 *
 *  - An existing contact (the email is the unique key) is reused and never renamed or duplicated; a new one is created with only a first name and email.
 *  - Consent evidence is the site's append-only log (wording version and exact text, time, source, keyed hashes of the device), so the Leads report shows
 *    the contact, its status and where the consent came from, and a later unsubscribe appends its own record (history is never edited).
 *  - Where the site's policy asks for proof of the address (the EEA, UK, Switzerland, Brazil, Quebec, or an unknown location) the click is recorded as a
 *    pending request, not as active consent, and ONE dedicated verification email is sent (app/lib/community/verification.ts); consent becomes active only when
 *    its link is used. Someone who unsubscribed earlier is never silently re-subscribed either: their click is a pending request that they must verify.
 *    If that email cannot be sent the visitor is told to try again (nothing else is affected), and nothing is claimed as sent.
 */
/** The `source_type` written to the consent log; the Leads report reads it to show where a contact came from. */
const SCHEDULING_CONSENT_SOURCE_TYPE = COMMUNITY_SOURCE_TYPE;
const firstNameOf = (guestName: string) => guestName.trim().split(/\s+/)[0] || "Guest";

async function findLead(email: string): Promise<Lead | null> {
  const { data, error } = await getServiceClient().from("leads").select("*").eq("email", email).maybeSingle();
  if (error) throw new Error(`Failed to look up lead: ${error.message}`);
  return (data as Lead | null) ?? null;
}

/** The existing contact, untouched, or a new one. Two simultaneous first answers from the same address end up with one record. */
async function contactFor(guestName: string, email: string): Promise<Lead> {
  const existing = await findLead(email);
  if (existing) return existing;
  try { return await upsertLeadPreservingOptIn({ first_name: firstNameOf(guestName), email, country: null, ongoing_content_opt_in: false }); }
  catch (e) { const raced = await findLead(email); if (raced) return raced; throw e; }
}

export function createLeadsConsent(sendVerification: VerificationSender = sendCommunityVerificationEmail): CommunityConsentPort {
  return {
  async join({ guestName, email, visitor }: { guestName: string; email: string; visitor: CommunityVisitor }): Promise<CommunityConsentResult> {
    const lead = await contactFor(guestName, normalizeEmail(email));
    const decision = decideConsent(lead);
    if (decision === "blocked_suppressed") return "not_applied";
    if (decision === "already_opted_in") return "already_opted_in";   // the original consent and its evidence stay as they are

    const evidence: ConsentEvidence = {
      wordingVersion: SCHEDULING_COMMUNITY_VERSION, wordingText: COMMUNITY_WORDING, method: "button_disclosure",
      sourceType: SCHEDULING_CONSENT_SOURCE_TYPE, sourceUrl: "/book", ctaLocation: COMMUNITY_SOURCE,
      ipHash: hashEvidence(visitor.ip), userAgentHash: hashEvidence(visitor.userAgent),
    };
    if (!consentRequiredFor(visitor.country, visitor.region)) {
      const result = await recordExplicitOptIn(lead.id, evidence);
      if (result === "opted_in") return "opted_in";
      if (result === "already_opted_in") return "already_opted_in";
      if (result === "blocked_suppressed") return "not_applied";
      // blocked_unsubscribed: they left before, so this click is only a request.
    }
    await requestOptIn(lead.id, evidence);
    const requestId = await latestCommunityRequestId(lead.id);
    if (!requestId) throw new Error("The consent request could not be found after it was recorded.");
    const sent = await sendVerification({ to: lead.email, leadId: lead.id, requestId, firstName: lead.first_name });
    if (!sent.ok) throw new Error(`The verification email could not be sent: ${sent.error ?? "unknown error"}`);
    return "pending_verification";
  },
  };
}

/** The production wiring: the real verification email. Tests build their own with a recording sender. */
export const leadsConsent: CommunityConsentPort = createLeadsConsent();
