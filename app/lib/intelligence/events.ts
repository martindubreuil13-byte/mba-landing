/**
 * The event vocabulary Website Intelligence reports on. These are the names the site already fires through trackEvent()
 * (plus `booking_link_click`, recorded by the tracker for any Calendly link). One place, so the SQL reports, the admin and
 * the tests agree. Names that are not listed are still stored; they just do not feed a named metric.
 */
/** Interactions that send a visitor towards a next step. */
export const CTA_EVENTS = [
  "program_cta_click",
  "assessment_cta_clicked",
  "napkin_cta_clicked",
  "transition_calendly_clicked",
  "booking_link_click",
] as const;

/** A visitor began an assessment-style flow. */
export const START_EVENTS = ["assessment_started", "napkin_started", "transition_questionnaire_started"] as const;

/** Browser-reported completion of those flows (the server-confirmed record is the lead conversion, below). */
export const COMPLETE_EVENTS = ["assessment_completed", "napkin_completed", "transition_questionnaire_completed"] as const;

/** A click on a booking link. A click is NOT a booking; confirmed bookings are not measurable (no Calendly webhook). */
export const BOOKING_CLICK_EVENTS = ["booking_link_click"] as const;

/**
 * Server-confirmed conversions: recorded by the server only after the system of record accepted the submission.
 * `kind` is stored on the event; the label is for the admin.
 */
export const CONVERSION_KINDS = {
  inquiry: "Inquiry (/lets-talk)",
  guide_request: "Guide / resource request",
  assessment_lead: "Business Idea Reality Check lead",
  napkin_join: "Napkin Principle join",
  program_application: "Program application",
} as const;
export type ConversionKind = keyof typeof CONVERSION_KINDS;
export const conversionLabel = (kind: string) => (CONVERSION_KINDS as Record<string, string>)[kind] ?? kind;
