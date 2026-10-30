/**
 * The ONE place the public introductory-booking link lives. Every email template, button and page that sends
 * someone to book a first conversation reads it from here, so changing the event is a one-line edit.
 *
 * Account: calendly.com/martindubreuil13 (the consolidated account). The event's duration and calendar
 * conflict settings are managed in Calendly itself, not in this repository.
 * A static test fails the build if a calendly.com URL appears anywhere else in the app.
 */
export const INTRO_BOOKING_URL = "https://calendly.com/martindubreuil13/30min";

/** What the copy promises. Keep in step with the event's actual length in Calendly. */
export const INTRO_BOOKING_MINUTES = 30;

/**
 * The introductory-booking link for ONE Transition applicant. The opaque `ref` travels as Calendly's `utm_content`
 * and comes back in the booking webhook's `tracking` object, which is how a booking is matched to its application.
 * It is random and carries no personal data; name and email are deliberately NOT prefilled into the URL.
 * With no ref this is the plain shared link.
 */
export function introBookingUrl(ref?: string | null): string {
  if (!ref) return INTRO_BOOKING_URL;
  const url = new URL(INTRO_BOOKING_URL);
  url.searchParams.set("utm_source", "mba_transition");
  url.searchParams.set("utm_medium", "application");
  url.searchParams.set("utm_content", ref);
  return url.toString();
}
