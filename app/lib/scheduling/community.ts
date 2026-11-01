/**
 * The optional community invitation shown once, after a booking is confirmed. Wording and version are stored with every
 * answer as consent evidence: change either string and the version MUST change (add a new entry, never edit an old one).
 *
 * An answer is recorded once per booking in sched_community_consents: the exact wording and its version, the guest's address, a timestamp
 * and the SOURCE. "Yes" is an explicit, affirmative, un-preselected opt-in and is evidence only: no mailing-list provider is connected, so
 * nothing is subscribed anywhere. Connecting one (and the site's confirmed opt-in) needs approval and is a separate step.
 */
export const COMMUNITY_SOURCE = "booking_confirmation";
export const SCHEDULING_COMMUNITY_VERSION = "scheduling-community-v1";
export const COMMUNITY_HEADING = "One more thing before you go.";
export const COMMUNITY_INTRO = "I’m building a community of people who are creating something of their own.";
export const COMMUNITY_QUESTION = "Would you like occasional emails with practical advice, business ideas, guides, and resources?";
export const COMMUNITY_DECLINE = "No, thanks";
export const COMMUNITY_JOIN = "Yes, count me in";
export const COMMUNITY_FOOTNOTE = "Entirely optional. Unsubscribe anytime. Your booking is confirmed regardless of your choice.";
export const COMMUNITY_WORDING = `${COMMUNITY_INTRO} ${COMMUNITY_QUESTION} — ${COMMUNITY_JOIN}\n${COMMUNITY_FOOTNOTE}`;

/**
 * When the invitation may be offered: the booking is confirmed, its Zoom details are ready, and no answer has been recorded yet ("shown" is not an
 * answer; yes, no and closing the window are). The server enforces the same rule when it records an answer (SchedulingService.recordCommunity).
 */
export const communityPromptDue = (b: { status: string; progress: string; community: string }) =>
  b.status === "confirmed" && b.progress === "ready" && (b.community === "unseen" || b.community === "shown");
