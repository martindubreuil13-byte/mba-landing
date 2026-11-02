import { appBaseUrl } from "@/app/lib/resources/base-url";

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
type Origin = BookingOrigin | `inquiry-${string}`;

/** The query string: an origin tag and, for a Transition applicant, their opaque `booking_ref`. Nothing personal is ever added. */
function query(ref?: string | null, origin?: Origin): string {
  const q = new URLSearchParams();
  if (origin) q.set("source", origin);
  if (ref) q.set("ref", ref);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * The introductory-booking link for emails and API responses, optionally tagged with where it was offered and, for a Transition applicant, with
 * their opaque `booking_ref`. The ref is a random token that carries no personal data: the booking page uses it only to prefill that visitor's own
 * name and email, and no name, email or answer is ever put in a URL. With neither argument this is the plain shared link.
 */
export function introBookingUrl(ref?: string | null, origin?: Origin): string {
  return `${appBaseUrl()}${INTRO_BOOKING_PATH}${query(ref, origin)}`;
}

/** The same link as a site-relative path, for buttons on this website (so it works on every deployment). */
export function introBookingPath(ref?: string | null, origin?: Origin): string {
  return `${INTRO_BOOKING_PATH}${query(ref, origin)}`;
}
