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
