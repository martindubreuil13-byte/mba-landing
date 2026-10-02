/**
 * Shared resource-event vocabulary (client + server). One event model for every
 * resource type — guides now, surveys / assessments / tools later.
 *
 * Metric meanings (also shown in the admin):
 *  - resource_page_view        resource page loaded (once per session per 30 min)
 *  - resource_read_started     the visitor scrolled the guide's first section into view
 *  - resource_read_completed   the visitor reached the final section after >= 60 s on
 *                              the guide. A proxy for reading, not proof of it.
 *  - resource_cta_clicked      any printable-guide / download CTA was clicked
 *  - resource_form_opened      the email form was shown
 *  - resource_form_submitted   SERVER-ONLY: a valid request was stored
 *  - resource_opt_in_confirmed SERVER-ONLY: the reader confirmed their email; marketing is now active
 *  - resource_benefit_fulfilled SERVER-ONLY: the member benefit was unlocked for a request (metadata.via = confirmation | existing_member)
 *  - resource_membership_blocked SERVER-ONLY: a form submission was NOT acted on because the address is unsubscribed or
 *                              suppressed (metadata.reason). Never shown to the visitor.
 *  - resource_download_started SERVER-ONLY: the download endpoint was hit
 *  - resource_delivery_*       SERVER-ONLY: email state changes (see delivery-status.ts)
 */
export const RESOURCE_EVENT_NAMES = [
  "resource_page_view",
  "resource_read_started",
  "resource_read_completed",
  "resource_cta_clicked",
  "resource_form_opened",
  "resource_form_submitted",
  "resource_opt_in_confirmed",
  "resource_benefit_fulfilled",
  "resource_membership_blocked",
  "resource_download_started",
  "resource_delivery_queued",
  "resource_delivery_sent",
  "resource_delivery_delivered",
  "resource_delivery_bounced",
  "resource_delivery_failed",
] as const;

export type ResourceEventName = (typeof RESOURCE_EVENT_NAMES)[number];

/** The only events a browser may report. Everything else is written server-side. */
export const CLIENT_EVENT_NAMES = [
  "resource_page_view",
  "resource_read_started",
  "resource_read_completed",
  "resource_cta_clicked",
  "resource_form_opened",
] as const satisfies readonly ResourceEventName[];

export type ClientEventName = (typeof CLIENT_EVENT_NAMES)[number];

export const CTA_LOCATIONS = ["top", "mid-guide", "end"] as const;
export type CtaLocation = (typeof CTA_LOCATIONS)[number];

/** Seconds a visitor must have spent on the guide before "completed" can fire. */
export const READ_COMPLETED_MIN_SECONDS = 60;

export const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
