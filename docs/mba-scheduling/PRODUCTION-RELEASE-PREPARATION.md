# MBA Scheduling — production release preparation

Prepared 2026-10-31. **Local release preparation complete; production is unchanged. Public intake remains closed.** This is the release runbook, not a reopening of the completed Phase 2G audit.

## Release identity and isolation

- Checkout: `/Users/martin/Documents/The Modern Business Architect (MBA)/mba-scheduling-release`.
- Local branch: `release/mba-scheduling-production-prep`, based on production/main `2e0f68b97a2723a3bbee6445e4ea8c67b6e66302`.
- The original `mba-site` checkout remains on `feat/mba-scheduling` at `be03b65`; its pre-existing files and uncommitted work were preserved. No commit, push, merge or deployment occurred. The release changes are intentionally uncommitted for review.
- Production alias: `modernbusinessarchitect.com`; Vercel project **mba-site**, `prj_XDFxc5oBVQXeqC29VsGSmPNKms1P`; current deployment `dpl_EgbDJyDwJdofN3shCZTQ6yckehJG`.
- Publications and Transition/Calendly files remain byte-identical to the production baseline (42 and 67 compared paths). Hosted Supabase still has three published books and zero Scheduling tables. No Publications migration or content is part of this release.
- Shared changes are limited to the Scheduling navigation entry, widget exclusion on booking/preview pages, typed email-policy purpose, the optional environment argument in the existing canonical base-URL helper, OAuth development-log redaction, local-state ignores/env examples and TypeScript audit-evidence exclusion. Production email behavior for existing Transition/resource/program callers stays unchanged. Package files match the production baseline.
- `RELEASE-SOURCE-MANIFEST.json` identifies selected source files; `RELEASE-MIGRATIONS.json` pins the four migration hashes; `release-evidence/` contains verification and preservation results. Do not replace the current site with the dirty original branch.

## Implemented release controls

`SCHEDULING_OPERATIONS_ENABLED` defaults **false**. Set it true only in Production after the schema/configuration stage. It enables existing authenticated admin/OAuth routes, signature-checked webhooks, authenticated recovery and health. It does not open new booking intake.

`SCHEDULING_PUBLIC_INTAKE_ENABLED` defaults **false** and requires operations enabled. It controls meeting-type pages, slots, booking creation and community intake. Existing opaque-reference confirmation/status access remains available while operations run, so an intake freeze does not strand existing appointments. Hosted previews remain disabled regardless of flags. The local sign-in-free preview stays mock-only and cannot operate on Vercel.

Production service construction refuses file/mock/simulated providers, local prototype/test flags, a missing/short dedicated recovery secret, an incorrect Google callback, unapproved sender/reply-to and Google invitation emailing. Explicit live/Supabase modes are mandatory. Production prototype reset/replay and simulation actions are denied. Real owner notifications retain the approved recipient restriction.

Recovery uses **SCHEDULING_RECOVERY_SECRET**, separate from the existing site-wide CRON_SECRET. The production worker never falls back to the global secret. The initial serial batch is one due booking per invocation; reconciliation remains five-minute Zoom / fifteen-minute conflict scans when the minute worker is invoked. Provider deadlines/60-second function limit still apply; a large/slow scan can exceed the invocation and must be monitored before increasing volume. No claim of guaranteed scan completion under arbitrary load is made.

`GET /api/cron/scheduling-health` is read-only and uses the scoped recovery credential. It returns aggregate counts and freshness checks only: 200 when heartbeat/scans are fresh and there are no failed, overdue, approaching-without-link or canceled-cleanup cases; 503 otherwise. It sends no alert itself. `scripts/check-scheduling-health.mjs` exposes only aggregate status, uses the credential from the process environment and exits nonzero on failure.

## Current integration readiness

| Integration | Independently checked now | Remaining approved configuration |
|---|---|---|
| Google Calendar | Google Cloud project **MBA Scheduling Development** is **External / Testing**; Publish is disabled pending branding. Home page, privacy link and authorized domains are unset. Production has no Scheduling Google/client/vault-key environment entries. | Use a separate production Google project/client so localhost development remains intact. Prepare branding name “MBA Scheduling”, homepage `https://modernbusinessarchitect.com`, privacy `https://modernbusinessarchitect.com/privacy`, authorized domain `modernbusinessarchitect.com`, support/developer contact `martindubreuil13@gmail.com`. There is no verified `/terms` page; do not invent one. Verify domain ownership/Google requirements, enable Calendar API if needed, set production callback exactly `https://modernbusinessarchitect.com/api/admin/scheduling/google/callback`, and publish outside Testing only after approval. Connect only `martindubreuil13@gmail.com` / primary calendar. |
| Zoom | Existing S2S token issuance and designated-host read both return 200. Exactly five granular meeting permissions: list, read, create, update and delete; explicit host configured. No meeting created. | Provision these reviewed account/client/secret/host settings in Production scope; retain host ownership checks. Confirm host duration/license entitlement in the account before opening the configured meeting durations; do not expand scopes just for that check. Configure deletion webhook only with its own signing token. |
| Resend | Existing production API key is present; `mindrasolutions.com` is verified. No Scheduling delivery webhook exists. Existing non-Scheduling webhook unchanged. | Preserve production RESEND_API_KEY. Explicit sender **Martin Dubreuil <martin@mindrasolutions.com>**, reply-to **martin@mindrasolutions.com**. After approved deployment, add a separate webhook at `/api/webhooks/scheduling/resend`, selecting delivered/bounced/failed events, and provision its secret as SCHEDULING_RESEND_WEBHOOK_SECRET. Do not reuse/replace the existing webhook secret. No test email in this preparation. |
| Supabase/recovery | **Martin SaaS Lab Pro**; project `sbntzyivfhvogxiiysuh` (“The MBA”) ACTIVE_HEALTHY, Postgres 17.6. Available pg_cron 1.6.4 / pg_net 0.20.4, neither installed; Vault installed. Minute cron is feasible without a new paid service. | Apply the four approved migrations, then separately approve extensions/Vault/job creation. Confirm a current restorable backup first; no backup upgrade or PITR purchase is authorized. Backup timestamp/restore readiness has not yet been independently confirmed. |

Google scopes remain `calendar.freebusy`, `calendar.events.owned`, `openid`, `email`; no full Calendar/Gmail/contact access. Testing Calendar authorizations expire after seven days: [Google audience policy](https://support.google.com/cloud/answer/15549945?hl=en). Production Calendar scope requirements: [Google scope reference](https://developers.google.com/workspace/calendar/api/auth). Keep the generated 32-byte base64 SCHEDULING_TOKEN_KEY and its version in protected production secrets and a separate secure recovery backup; never copy the development Google token/key into production.

No real keys were generated or copied into this release. `production.env.example` contains reviewed non-secret values and blank credential fields, not a file ready for bulk upload. Preserve all unrelated existing environment entries. Do not set development flags, SCHEDULING_OWNER_EMAIL or a noncanonical APP_BASE_URL.

## Approval-separated migration and deployment sequence

### A — First production-changing stage: Scheduling schema only

Approval requested **only** for the four migrations on `sbntzyivfhvogxiiysuh`, after verifying backup and current schema. No environment changes, extensions, cron, deployment, bookings or email under this approval.

1. Recheck alias/main identity, three published books, zero Scheduling tables, existing `consent_records(id)` and `set_updated_at()` dependencies, and confirm a restorable backup/restore process. Stop if the baseline differs or no recovery point is available.
2. Compare migration file hashes to `RELEASE-MIGRATIONS.json`. Apply using migration history tracking in this order, transactionally per file; stop at the first error:
   - `20261101090000_mba_scheduling.sql`
   - `20261102090000_mba_scheduling_phase2e.sql`
   - `20261103090000_mba_scheduling_phase2f.sql`
   - `20261104090000_mba_scheduling_phase2g.sql`
3. Verify 14 Scheduling tables with RLS, zero anon/authenticated table privileges, 15 operational RPCs service-role-only/invoker, trigger-only function exceptions unchanged, and all migration-history entries recorded. Recheck Publications count and ordinary website reads. No meeting types/bookings need creating.
4. If any migration fails, retain already applied additive schema, keep Scheduling off and investigate that failure; do not run down-migrations or rerun an earlier migration after a later one.

Rehearsal succeeded in a disposable local database using the hosted consent-table column shape and trigger dependency, not a complete production backup restore. All four files applied; synthetic unrelated Publications/Calendly rows remained intact. All 14 tables deny browser access. Production schema itself was not changed.

### B — Account and environment stage (separate approval)

Approve the production Google project/client/branding/publishing changes and protected Vercel Production variable provisioning before performing them. No subscription/billing changes. Generate distinct production encryption/recovery secrets securely; provision reviewed Zoom credentials and sender/reply-to; preserve existing site keys. Start with operations=false and intake=false. Google authorization/storage requires approval after the operational callback is deployed. A provider account security/consent step is handed to the owner when required.

### C — Deploy an intake-closed release (separate approval)

Review and freeze a release commit before any push/deploy. The branch is currently local/uncommitted. Verify the intended **mba-site** project; another Vercel project named mba-landing also exists for this repository, so do not rely on an uncontrolled main push. No project Git settings were changed. The ignored local `.vercel/project.json` pins mba-site; it contains identifiers only.

Stage a reviewed production-target deployment without domain assignment, explicitly keeping intake=false. Deployment itself requires approval even without aliases. Validate protected administration and the public website first, then obtain approval to promote the exact tested deployment. Vercel Production variable changes require a new deployment; they do not change an already-running deployment. Preserve a schema-compatible operations-capable rollback build before allowing real appointments.

When credentials/schema exist, enable operations=true with intake=false on an approved deployment. Connect the approved Google owner and verify encrypted storage, primary-calendar availability and refresh after restart using read-only checks. Do not create external events/meetings or send emails.

### D — Recovery, webhooks and monitoring (separate approval)

Approve production pg_cron/pg_net enablement, one scoped Vault entry and the named minute job from `PRODUCTION-RECOVERY.sql`; separately approve provider webhook creation and the resulting environment-secret deployment. Keep intake=false. Resend/Zoom/Google webhook handlers continue refusing unconfigured or unsigned calls.

**Security choice:** pg_net queues decrypted HTTP headers. Vault protects at rest but does not conceal queued bearer headers from roles able to use pg_net. Use only the dedicated recovery credential, never the site-wide CRON_SECRET or service-role key. Confirm/accept the actual role exposure before enabling the job; an unresolved trust boundary blocks this configuration, not the website. [Supabase queued-header guidance](https://supabase.com/kb/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net), [Cron documentation](https://supabase.com/docs/guides/cron).

Observe at least three consecutive minute invocations and two successful five-minute Zoom scans, with a successful conflict scan. SQL cron success proves dispatch, not HTTP/booking success: verify net HTTP status and application timestamps. `/api/cron/scheduling-health` must return 200 afterward. Use a separately approved mocked/sandbox booking demonstration for recovery effects; production preflight remains read-only. No live lifecycle test is included in these stages.

## Monitoring and smoke checklist

- Owner: Martin; name a backup and review/response SLA before intake. Until an existing monitor can execute the read-only health script, use an explicit operator check each operating day and before every upcoming appointment; this is not unattended alerting. Do not buy a monitoring service. Any automated page/notification destination needs separate authorization.
- Inspect Needs attention, failed/uncertain creates, canceled cleanup, scan freshness, approaching appointments without links and undelivered owner/guest messages. Monitor nonzero health status as well as heartbeat age. Retain first child-exit diagnostics in test failures; never hide product-state failures behind retries.
- For uncertain Zoom: use the exact marker/attempt shown, configured host, every relevant page and past meetings. Ordinary “Check Zoom again” cannot create; use explicit adoption or acknowledged resolution only. Log operator decision. An empty search is not proof of absence.
- If an authoritative meeting is replaced, its link changes. Review the guest-facing confirmation and deliberately resend the new details before the appointment; do not assume the original per-version email is resent automatically.
- Public smoke: homepage, all three Publications and their covers/download behavior, existing Transition/Calendly route and admin Publications remain unchanged. Booking form/slots/create stay 404; existing-reference confirmation/status remain available with operations on. No development preview/reset/replay in production.
- Security/operations smoke: unauthenticated admin 401/redirect; authenticated admin/OAuth accessible; invalid recovery bearer 401; unsigned webhooks 401 (503 until secret configured); scoped recovery accepted; health aggregate-only; no secret-bearing URLs/logs/assets. Read-only availability/host check; no sends or resources.

## Explicit go-live procedure — separate final approval

Do not open intake as part of configuration/deployment approval. Carry forward the existing E-01 ambiguous-email and E-04 public-abuse launch gates (or a deliberately approved restricted intake scope), monitoring ownership and documented conflict/volume limits. These are not re-audited here. Complete the separately authorized controlled lifecycle/email test before customer go-live.

After all acceptance criteria pass, request explicit approval to set **only** SCHEDULING_PUBLIC_INTAKE_ENABLED=true in Production and deploy/promote that reviewed configuration. Keep operations=true, strict live modes and all local/test flags absent. Test public availability without submitting a booking; any booking test needs its own authorization. Record exact deployment/time and monitor health/queue.

## Rollback

1. Freeze **new intake**, keeping operations=true, by an approved redeployment with SCHEDULING_PUBLIC_INTAKE_ENABLED=false. Environment rollback is not instantaneous. An approved admin can additionally deactivate affected meeting types while that deployment is prepared.
2. Retain confirmation/status, authenticated admin, webhooks and minute recovery until every pending create/update/cancellation/uncertainty and tombstone is resolved. Reconcile provider resources and notify guests about changed links under explicit send authorization.
3. Roll back application changes to the preserved **schema-compatible operations-capable** release. Never run the old Phase 2E/F code against changed RPC signatures. Keep all Scheduling tables, ledgers, references and encrypted tokens; do not reverse migrations by deleting booking data.
4. Only with zero outstanding work may the cron be unscheduled and operations disabled. The Publications-only deployment `2e0f68b` is a valid website fallback **before any real bookings**, but would stop Scheduling recovery after bookings exist. Do not use it blindly as the active-appointments rollback. Leave additive schema in place.
5. Preserve current site cron, CRON_SECRET, non-Scheduling webhooks, Publications storage/books and Transition/Calendly throughout. OAuth revocation/key rotation is a separate approved incident action, not an automatic rollback step.

## Verification completed in this preparation

- Full isolated release suite: **1,199 passed, 18 skipped**; focused release/isolation/email/Phase 2G checks: 91 passed. TypeScript and optimized production build pass. Existing Publications/Transition unit tests are included.
- Compiled local production-mode smoke with operations/intake off: book page, slots, create, sign-in-free preview, preview API and health all return 404 without accessing integrations.
- Tests used disposable PostgreSQL and mock providers. Zoom token/host and Resend account queries were read-only. No production data/configuration, Google publishing state, remote Git ref or deployed code was changed.
- Local checkout identifiers, manifests and evidence contain no actual production credentials. Original working-tree preservation and release-source comparison are recorded in `release-evidence/isolation.json`.
