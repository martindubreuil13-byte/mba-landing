import { appBaseUrl } from "@/app/lib/resources/base-url";
import { refExchangeEnabled } from "@/app/lib/inquiries/config";

/**
 * The ONE place the public introductory-booking link lives. Every email template, button and page that sends
 * someone to book a first conversation reads it from here, so changing the offer is a one-line edit.
 *
 * It is the complimentary session of the website's own booking system (Zoom, availability, confirmation email, reminders,
 * rescheduling and cancellation all live there). The earlier Calendly event is retired as a destination; its webhook code is
 * kept, dormant, so history is not lost.
 *
 * Absolute links (for emails) are built AT CALL TIME from the environment-aware base URL (appBaseUrl), like every other operational link:
 * production gets the canonical domain, a preview or local run links to itself, and never hands out a link that lands on production.
 */
export const INTRO_BOOKING_PATH = "/book/complementary-session";

/** What the copy promises. It must equal the meeting type's duration (the 45-minute Complementary Session). */
export const INTRO_BOOKING_MINUTES = 45;

/** Where the booking started, shown to the administrator beside each booking. Short, fixed vocabulary: never free text from a visitor. */
export type BookingOrigin = "transition" | "inquiry" | "answers";
export type Origin = BookingOrigin | `inquiry-${string}`;

/**
 * The part of the link after the path: an origin tag and, for someone who came from an application or inquiry, their opaque reference. Nothing personal is ever added.
 *
 * With PROGRAM_INQUIRY_STORE_ENABLED the reference travels in the URL FRAGMENT (`#r=...`). Browsers never send a fragment to a server, so it is absent from
 * request logs and Referer headers, and the booking page removes it from the address bar before any script can report the page. Without the switch it is the
 * original `&ref=` query parameter, which the booking page still understands in both cases (links already sent keep working).
 */
function linkSuffix(ref?: string | null, origin?: Origin): string {
  const q = new URLSearchParams();
  if (origin) q.set("source", origin);
  const fragment = ref && refExchangeEnabled();
  if (ref && !fragment) q.set("ref", ref);
  const s = q.toString();
  return `${s ? `?${s}` : ""}${fragment ? `#r=${encodeURIComponent(ref)}` : ""}`;
}

/**
 * The introductory-booking link for emails and API responses, optionally tagged with where it was offered and, for a Transition applicant, with
 * their opaque `booking_ref`. The ref is a random token that carries no personal data: the booking page uses it only to prefill that visitor's own
 * name and email, and no name, email or answer is ever put in a URL. With neither argument this is the plain shared link.
 */
export function introBookingUrl(ref?: string | null, origin?: Origin): string {
  return `${appBaseUrl()}${INTRO_BOOKING_PATH}${linkSuffix(ref, origin)}`;
}

/** The same link as a site-relative path, for buttons on this website (so it works on every deployment). */
export function introBookingPath(ref?: string | null, origin?: Origin): string {
  return `${INTRO_BOOKING_PATH}${linkSuffix(ref, origin)}`;
}

/** Browser-side variant for a reference the server already decided to hand out in fragment form (the server's switches are not visible to the browser). */
export function introBookingPathWithFragmentRef(ref: string, origin?: Origin): string {
  const q = new URLSearchParams();
  if (origin) q.set("source", origin);
  const s = q.toString();
  return `${INTRO_BOOKING_PATH}${s ? `?${s}` : ""}#r=${encodeURIComponent(ref)}`;
}
