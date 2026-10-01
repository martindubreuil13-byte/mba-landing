# How assessments plug into this architecture

The pilot built the shared foundations; a guide is just the first *resource action* ("download") on top of them. Nothing here is guide-specific.

| Layer | Shared piece | What an assessment adds |
|---|---|---|
| Lead | `leads` (one row per email, `lead_status`, `last_activity_at`, `suppressed_at`) | Nothing. It already links assessments through `assessments.lead_id`. |
| Consent | `consent_records` (append-only) + `requestOptIn` / `confirmOptIn` / `applyOptOut` in `app/lib/leads/consent.ts` | A new consent-copy version for the result gate, `source_type = "assessment"`. |
| Events | `resource_events` (any `resource_id`, anonymous or identified) | Event names are already generic: `resource_page_view`, `resource_form_submitted`, `resource_delivery_*`. Add `resource_assessment_started` / `_completed` to `app/lib/resources/events.ts`; they use the same table, dedupe and admin funnel. |
| Requests | `resource_requests.resource_action` (default `download`) | Use `assessment_result` for "result requested". Delivery columns (`delivery_status`, provider id) apply unchanged. |
| Delivery | `sendDeliveryEmail`, webhook, state machine | A second email template key beside `guide-delivery` that renders the result instead of a PDF link. |
| Admin | `/admin/guides` funnel from events | Starts, completions, opt-ins, result-delivery status come from the same event names with an assessment config entry. |

Flow: visitor completes the assessment (anonymous `assessments` row, existing) → result calculated → email + disclosure + explicit button (same consent model) → `requestPrintableGuide`-style function creates/updates the lead, appends consent, links `assessments.lead_id`, records `resource_form_submitted` → result shown and/or emailed → delivery status tracked by the webhook.

The existing Business Idea Reality Check and Napkin flows are untouched. Napkin's join does not yet write `consent_records` (its opt-out does, via the shared function); migrating it is a follow-up.
