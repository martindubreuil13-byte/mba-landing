import "server-only";
import { consentRequiredFor } from "@/app/lib/consent/regions";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { decideConsent, recordExplicitOptIn, requestOptIn, type ConsentEvidence } from "@/app/lib/leads/consent";
import { sendConsentConfirmationEmail } from "@/app/lib/leads/confirmation-email";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { Lead } from "@/app/lib/resources/types";
import { COMMUNITY_CONSENT_VERSION, COMMUNITY_FOOTNOTE, COMMUNITY_WORDING } from "./corporate-transition";

/**
 * The optional community invitation shown after the application is submitted. It is deliberately separate from the
 * application: nothing in the questionnaire, the submission or the booking email can create marketing consent.
 *
 *  - "No, thanks" records only the applicant's answer on the application. The lead's consent is untouched.
 *  - "Yes, count me in" is an explicit, affirmative, unambiguous click on a button whose wording is stored, with its version,
 *    a timestamp, the source and a hashed device fingerprint (the same evidence as every other form).
 *
 * SINGLE STEP vs CONFIRMED. One click is a valid consent record, but it does not prove the person owns the email address they typed,
 * and some regimes expect that proof. Where the visitor's location is in the site's existing opt-in list (the EEA, UK, Switzerland, Brazil,
 * Quebec, or unknown: app/lib/consent/regions.ts) the click is recorded as a REQUEST and the existing confirmation email completes it, exactly
 * as for the resource guides. Everywhere else the click is the consent and no marketing confirmation email is sent. The list is an
 * engineering assumption, not a legal determination; counsel should confirm it (see docs/transition-booking-flow/README.md).
 * Anyone who previously unsubscribed is always taken through confirmation, never silently re-subscribed.
 */
export type CommunityState = "declined" | "joined" | "confirmation_sent" | "confirmation_failed" | "not_applied";

const SETTLED: ReadonlySet<string> = new Set(["joined", "confirmation_sent", "not_applied"]);

export type Visitor = { ip: string; userAgent: string | null; country: string | null; region: string | null };

export function communityNeedsConfirmation(visitor: Pick<Visitor, "country" | "region">): boolean {
  return consentRequiredFor(visitor.country, visitor.region);
}

export async function chooseCommunity(application: { id: string; lead_id: string; community_choice?: string | null; answers: { firstName: string; email: string } }, choice: "join" | "decline", visitor: Visitor): Promise<CommunityState> {
  const current = application.community_choice ?? null;
  // A repeated click, a double submit or a replay changes nothing and sends nothing.
  if (current && SETTLED.has(current)) return current as CommunityState;
  if (choice === "decline") return save(application.id, "declined");

  const db = getServiceClient();
  const { data: lead, error } = await db.from("leads").select("*").eq("id", application.lead_id).maybeSingle();
  if (error || !lead) throw new Error("Could not load the applicant.");

  const decision = decideConsent(lead as Lead);
  if (decision === "blocked_suppressed") return save(application.id, "not_applied");
  if (decision === "already_opted_in") return save(application.id, "joined"); // original consent is kept; nothing new is recorded

  const evidence: ConsentEvidence = {
    wordingVersion: COMMUNITY_CONSENT_VERSION, wordingText: `${COMMUNITY_WORDING}\n${COMMUNITY_FOOTNOTE}`, method: "button_disclosure",
    sourceType: "program_application", sourceUrl: "/transition", ctaLocation: "application_confirmation",
    ipHash: hashEvidence(visitor.ip), userAgentHash: hashEvidence(visitor.userAgent),
  };

  if (!communityNeedsConfirmation(visitor)) {
    const result = await recordExplicitOptIn(application.lead_id, evidence);
    if (result === "opted_in" || result === "already_opted_in") return save(application.id, "joined");
    if (result === "blocked_suppressed") return save(application.id, "not_applied");
    // blocked_unsubscribed: they left before, so this click is a request that must be confirmed from their inbox.
  }

  // A request may already be on record (a retry, or another form moments ago). That is not proof an email went out, so this
  // click always sends its own confirmation; the only dedupe is this application's own settled state, checked above.
  await requestOptIn(application.lead_id, evidence);
  const sent = await sendConsentConfirmationEmail({ to: application.answers.email, leadId: application.lead_id, firstName: application.answers.firstName });
  if (!sent.ok) console.error("Transition community confirmation email failed:", sent.error);
  return save(application.id, sent.ok ? "confirmation_sent" : "confirmation_failed");
}

async function save(applicationId: string, state: CommunityState): Promise<CommunityState> {
  const { error } = await getServiceClient().from("program_applications").update({ community_choice: state, community_choice_at: new Date().toISOString() }).eq("id", applicationId);
  if (error) throw new Error(error.message);
  return state;
}
