/**
 * The optional community invitation shown once, after a booking is confirmed. Wording and version are stored with every answer as consent
 * evidence: change any string and the version MUST change (add a new entry to COMMUNITY_WORDING_HISTORY, never edit an old one).
 *
 * An answer is recorded once per booking in sched_community_consents (exact wording and version, the guest's address, a timestamp, the SOURCE). A
 * "yes" is an explicit, affirmative, un-preselected choice. In the site's Leads records it becomes active consent immediately for a visitor outside the
 * site's proof-required regions, and a PENDING request (activated only by verifying the address, see app/lib/community/verification.ts) inside them.
 * No mailing platform is connected and nothing is subscribed or sent by recording it.
 */
export const COMMUNITY_SOURCE = "booking_confirmation";

/** The wording each version showed, exactly. Appended to, never edited: the stored evidence of an old answer must keep matching what the visitor saw. */
export const COMMUNITY_WORDING_HISTORY = {
  "scheduling-community-v1": {
    text: "I’m building a community of people who are creating something of their own. Would you like occasional emails with practical advice, business ideas, guides, and resources? — Yes, count me in\nEntirely optional. Unsubscribe anytime. Your booking is confirmed regardless of your choice.",
  },
  "scheduling-community-v2": {
    text: [
      "Stay in the loop.",
      "I'm building a community of entrepreneurs, founders and people who believe business can be done differently.",
      "Want to receive occasional emails from The Modern Business Architect with practical ideas, resources, events and opportunities?",
      "No daily motivational nonsense. Just things worth sharing.",
      "You can unsubscribe anytime.",
      "Yes, keep me in the loop",
      "Not now",
    ].join("\n\n"),
  },
} as const;

/** The approved "Stay in the loop" wording (supplied by Martin, 1 November 2026). Version 2. */
export const SCHEDULING_COMMUNITY_VERSION = "scheduling-community-v2";
export const COMMUNITY_HEADING = "Stay in the loop.";
export const COMMUNITY_INTRO = "I'm building a community of entrepreneurs, founders and people who believe business can be done differently.";
export const COMMUNITY_QUESTION = "Want to receive occasional emails from The Modern Business Architect with practical ideas, resources, events and opportunities?";
export const COMMUNITY_NOTE = "No daily motivational nonsense. Just things worth sharing.";
export const COMMUNITY_FOOTNOTE = "You can unsubscribe anytime.";
export const COMMUNITY_JOIN = "Yes, keep me in the loop";
export const COMMUNITY_DECLINE = "Not now";
/** The exact text shown to the visitor (every line, both choices), stored with each answer. */
export const COMMUNITY_WORDING = COMMUNITY_WORDING_HISTORY[SCHEDULING_COMMUNITY_VERSION].text;

/**
 * When the invitation may be offered: the booking is confirmed, its Zoom details are ready, and no answer has been recorded yet ("shown" is not an
 * answer; yes, no and closing the window are). The server enforces the same rule when it records an answer (SchedulingService.recordCommunity).
 */
export const communityPromptDue = (b: { status: string; progress: string; community: string }) =>
  b.status === "confirmed" && b.progress === "ready" && (b.community === "unseen" || b.community === "shown");

/**
 * What the booking system asks of the site's lead and consent records. The service knows only this shape; the real implementation lives in
 * adapters/leads-consent.ts. Only an explicit "yes" ever reaches it: a decline, a dismissal or no answer creates no lead and no consent.
 *
 *  - opted_in:             the site's consent flag is on, with its evidence (wording version and text, timestamp, source, hashed device).
 *  - already_opted_in:     the contact had consented before; that original consent is kept and nothing new is written.
 *  - pending_verification: the visitor is in a place where the site's own policy wants proof of the address (see app/lib/consent/regions.ts), or had
 *                          unsubscribed earlier. The click is recorded as a REQUEST (consent is NOT active) and a dedicated verification email is sent;
 *                          consent becomes active only when its link is used (app/lib/community/verification.ts).
 *  - not_applied:          the contact is suppressed (a spam complaint); nothing is recorded.
 */
export type CommunityVisitor = { ip: string | null; userAgent: string | null; country: string | null; region: string | null };
export type CommunityConsentResult = "opted_in" | "already_opted_in" | "pending_verification" | "not_applied";
export type CommunityConsentPort = {
  join(input: { guestName: string; email: string; visitor: CommunityVisitor }): Promise<CommunityConsentResult>;
};
