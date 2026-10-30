# Transition takeover audit — 30 October 2026

Branch: `feat/transition-booking-flow`. Base: `cce6667`. All changes remain uncommitted. No push, production migration, deployment, production email or real Calendly booking was performed.

## Calendly account and cost

Inspected the signed-in Martin Dubreuil account in Safari. The account menu explicitly says **Free Plan**. Integrations & apps displays **Upgrade to the Standard plan to access this feature**. No upgrade was selected, no credential was created, no subscription was registered, and no signing key was configured.

Calendly's current official documentation says ordinary API access exists on Free, while webhooks require a paid subscription: https://developer.calendly.com/docs/getting-started/frequently-asked-questions and https://calendly.com/help/webhooks-overview . API availability alone does not make webhook subscriptions available. A signing key authenticates a subscription; it does not bypass the plan restriction.

The existing event URL is correct. Safari shows the event named **30 Minute Meeting**, configured for **45 minutes**, on Zoom. The Transition invitation no longer promises 30 minutes; calendar settings and shared duration constants used by other pages were preserved. Decide separately whether the actual event should be 30 or 45 minutes.

**Release configuration:** leave `CALENDLY_WEBHOOK_SIGNING_KEY` unset. Admin reports **Not connected**, and the receiver returns 503. Clicking the booking link never marks an application Booked. Calendly's calendar is the reliable no-cost source of truth for bookings/cancellations/reschedules. No automatic alternative was configured or claimed reliable. Free API polling may be possible, but needs its own credential, pagination, reconciliation, scheduler and cost verification before recommendation.

## Independent implementation review and fixes

- No screening path or OpenAI call remains in new application submission. Required validation, honeypot and rate limiting remain. Historical assessments/statuses are preserved.
- Screen and invitation use the same opaque per-application booking reference. The separate receipt token restores confirmation via POST/sessionStorage, without putting contact data or the token in the URL. The response contains no contact details or application ID.
- Application submission creates no marketing consent. The optional community buttons are separate. Regional confirmation logic and region constants are unchanged: EEA, UK, Switzerland, Brazil, Quebec, unknown country and Canada with unknown province require inbox confirmation. Previously unsubscribed addresses require confirmation; suppressed addresses stay suppressed; existing active consent is preserved. These are engineering rules, not a legal compliance certification.
- Fixed invitation logging: reserve a durable pending row before contacting the provider. A primary key derived from application/attempt and a partial unique index permit one pending attempt. Database read/reservation failure sends nothing. Known provider refusal becomes Failed. Network uncertainty or an accepted send whose result cannot be saved stays Pending and blocks another send until checked with the provider. Provider acceptance is not proof of inbox delivery. Do not automatically release stale pending attempts; reconcile them against the provider first.
- Added an opaque attempt tag so a signed Resend callback arriving before the send response can update the reserved row. Database lookup errors are raised so the provider can retry rather than acknowledging a lost update.
- Fixed misleading internal/consent email wording that asserted a booking invitation had been sent even when it failed. The visitor failure message now says the email could not be confirmed, while preserving the booking button.
- Fixed privacy copy that described Calendly callbacks as already active. It now explicitly states booking tracking is disconnected. Exact final diff against the base commit is in `privacy-review.diff`. Only the Transition section changes: remove new AI screening language, retain historical-assessment disclosure, explain transactional invitation, opaque reference and disconnected Calendly tracking, and describe optional community choice/regional confirmation.
- No tracking pixel was added and no provider tracking setting was changed. Earlier Claude notes claim Resend open/click tracking was disabled and sender authentication verified; this audit did not independently re-open the live Resend dashboard. Check those settings read-only before release.

## Verification and scope

Results are recorded in the final chat readiness report. The original 692-test claim was independently reproduced (18 Publications database tests skipped). Five additional regression cases cover reservation failure, overlapping sends, unresolved pending attempts, SDK network-error results and early signed delivery callbacks.

17 additional API/database checks ran against local Supabase and a local Resend stand-in, with disposable `.test` applicants. They verify immediate booking access, no AI assessment, correct opaque correlation, identical invitation link, durable message ID, retry and concurrent-submission deduplication, receipt restoration without personal data, consent separation, regional confirmation, exact evidence metadata, provider refusal, disconnected Calendly and no real bookings. Local Postgres additionally verified the one-pending constraint, RLS enabled with no browser policies, and zero anonymous-visible invitation/booking rows. Migration replay was checked inside a rolled-back transaction before updating only the local test schema.

Safari was independently used through the full local form: unemployed applicant, required empty-answer error, one-character answers, contact step without marketing checkbox, confirmation/booking link, unchanged link after refresh, and community decline with booking still present. The booking link was not opened. This does not claim a fresh 38-check browser run or a real Calendly round-trip. Claude's 38-check script was found in a temporary scratch directory; one assertion is hardcoded true, and its Calendly events are simulated. The checked-in older `scripts/e2e/transition-*` scripts still target the previous checkbox flow and should not be used as evidence for this release.

A file-hash baseline was recorded before edits. All Publications files, navigation, homepage, SEO, sitemap, package files and regional consent constants are unchanged by this takeover. There was no earlier trusted file-hash snapshot with which to prove Claude's historical preservation claim. `transition-only-files.json` identifies an isolated candidate over `cce6667` that excludes Publications. Two changed sitemap tests (`architecture-guards.test.ts`, `service-programs/catalog.test.ts`) belong to Publications and are explicitly excluded. Never stage the entire dirty checkout or all migrations.

## Dormant webhook limitations

The existing signed-event tests cover application-ref correlation, duplicate deliveries, cancellation and rescheduling from known invitees, but the receiver is **not approved for activation**. It has documented out-of-order-event limitations, read/modify/write races, and a cancellation retry can skip summary repair after a prior summary-write failure. Signing-key presence alone also does not prove a live subscription is healthy. These require repair and real provider verification before any future activation. They do not affect this disconnected release. No free-plan workaround was used to pretend bookings were verified.

## Production sequence — approval required first

1. Approve the Transition-only change, exact privacy diff, and disconnected booking tracking. Keep the unrelated Publications work out of staging and out of migration execution. Review the pending-attempt operational behavior; uncertain sends require provider reconciliation before retry.
2. Recheck production sender/reply-to/admin routing, Resend domain authentication, open/click tracking off, and the existing signed Resend delivery webhook. Do not send test production emails yet.
3. Apply only `20261030090000_transition_booking_flow.sql` to production after approval. Check historical rows and server-only table access. Do not run an unscoped migration push.
4. Commit/push only the reviewed Transition scope, then deploy after approval. Keep the Calendly signing key unset. Confirm admin says Not connected rather than Pending/Booked.
5. After separate authorization for live testing, verify a single applicant invitation and its provider delivery outcome. No real booking or production test email is authorized by this audit.

No production action is authorized merely by the existence of this report.

## Final verification results

| Check | Result |
|---|---|
| Original checkout before fixes | 692 passed, 18 skipped |
| Final Transition-only candidate over `cce6667` | **600 / 600 passed**, 59 files |
| Final Transition-only production build | **Passed** (Next 16.2.0, webpack; includes TypeScript check) |
| Final whole-checkout tests | 696 passed, 1 unrelated Publications image-processing timeout, 18 skipped; reproduced with lower parallelism |
| Standalone TypeScript check | Passed |
| Local API/email/database checks on final code | **17 / 17 passed**, no production services |
| Real Postgres constraint and RLS checks | Passed; test inserts rolled back |
| Lint | Pre-existing error in `app/components/PageStructuredData.tsx:28` and 41 warnings. Three added `prefer-const` diagnostics were fixed; both affected files lint clean. |
| Whitespace/diff check | Passed |
| Preservation | No Publications, homepage, navigation, SEO, sitemap, package or regional consent files changed by this takeover |

The latest local API evidence-count check initially failed because the audit harness used a correlated subquery referring to the outer `lead_id`, accidentally counting other applicants' evidence. Correcting it to select `leads.id` gave 17/17 passes. Stored application evidence was correct; no consent-rule change was made.

**Readiness:** the Transition-only direct-booking change is ready for release approval with Calendly tracking disconnected and the existing unrelated lint/test issues disclosed. The entire dirty checkout is not an approved release scope. The dormant Calendly receiver is not ready for future activation without the repairs above. Production sender/dashboard settings and a live delivery test remain unverified by this takeover.

Final lint-only cleanup changed variable declarations in the signed delivery handler; the affected delivery regression checks and lint were rerun. No behavior or consent-rule change was involved.
