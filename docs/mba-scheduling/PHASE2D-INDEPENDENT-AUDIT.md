# MBA Scheduling — Phase 2D independent audit

Date: 2026-10-31 (Asia/Bangkok). Auditor: Codex. Scope: current uncommitted scheduling implementation, database isolation, synchronization, email safety, provider evidence and release readiness.

## 1. Verdict: FAIL for customer go-live

The ordinary lifecycle works, but independently reproduced security and consistency defects invalidate the broad “no duplicates / no orphans / safe concurrent workers” guarantee. Keep customer intake disabled. No P0 production compromise was found; the current live site does not expose Scheduling. Four implementation findings below are P1. Production configuration and the rollout/rollback design also remain blocking gates.

The original **1,051 tests pass**, with 18 skipped, when reproduced in a disposable local database. **Eight additional audit tests reproduce unsafe behavior**, giving 1,059 passing assertions overall. Those eight deliberately assert the defects; green results are evidence of the findings, not evidence that they are fixed. TypeScript passes. The isolated local production build also succeeds; no production environment or deployment was exercised.

### Evidence boundaries

- Read PHASE2C-READINESS.md, PHASE2B-BACKGROUND-EXECUTION.md and the handover/development-connection notes. No standalone Phase 2D report was supplied in this conversation or found in the repository; only the user's summary of Claude's claims was available.
- No real bookings, Google events, Zoom meetings or emails were created by this audit. Provider requests were restricted to token exchanges and read-only queries.
- Production was inspected read-only. No commit, push, merge, deployment, production migration, key rotation or subscription change occurred.
- Tests ran in `/private/tmp/mba-phase2d-independent-audit`, with a disposable database `mba_phase2d_audit_20261031`, its own local REST gateway and mocked external providers. The ordinary local app's data was not used for writes. This avoids existing global-sweep tests acting on real development bookings.
- Known-resource checks and provider delivery receipts substantiate a test lifecycle; they cannot prove absence of every unrecorded orphan or actual human inbox receipt.

## 2. P1 findings requiring correction

### P1-01 — Sign-in-free preview reaches live local integrations

**Locations:** `app/api/scheduling-preview/[...path]/route.ts:9`, `app/lib/scheduling/preview-route.ts:9`, `app/lib/scheduling/preview.ts:21`, `app/lib/scheduling/instance.ts`.

The preview wrapper checks development mode and a loopback Host, but never checks that storage is file-only or that providers are mocked. Its handler calls the same `getScheduling()` singleton as authenticated admin routes. With the actual local Supabase/live-Google/live-Zoom configuration, unauthenticated preview actions can therefore cancel, reschedule, retry synchronization, resend confirmations or reset state through privileged application code. Preview pages likewise use the shared service. Comments claiming “simulated data only” are false.

**Reproduction:** with all live-mode switches set and a mock shared service, an unauthenticated text/plain POST to `/api/scheduling-preview/bookings/audit-booking/cancel` returns 200 and invokes `cancelBooking`. No real cancellation was attempted. Current Vercel production remains protected by the hard off-switch; this is a live-credential development vulnerability, not a demonstrated public production exploit. A loopback Host header is not authentication; browser cross-origin local-network protections vary and were not relied on or bypassed in this audit.

**Required fix:** make preview use a physically separate fixed mock/file service, or refuse every preview page/API unless all provider and storage modes are demonstrably simulated. Add origin/content-type protections too. Test with production-like local modes and require 404/no handler invocation. Do not widen the production flag to accidentally expose this namespace.

### P1-02 — Zoom adapter blindly retries non-idempotent meeting creation

**Location:** `app/lib/scheduling/adapters/zoom.ts:47` (generic retry loop), `:86` (`createMeeting`).

The generic HTTP client retries POST on network failures and 5xx without returning to `BookingSync`'s marker lookup. If Zoom commits the first meeting and its response is lost, the adapter sends the create POST again and can create another meeting. Only the final returned meeting ID is persisted. Marker lookup before the overall operation does not protect the retries inside it.

**Reproduction:** injected HTTP provider commits a simulated meeting and throws on its first create; its second request succeeds. One `ZoomClient.createMeeting()` call performs **two** creates. This is an ordinary ambiguous-response failure; it does not require a five-minute lease expiry.

**Required fix:** distinguish safe retryable reads/updates from ambiguous creates. Persist creation intent, stop blind POST retries, reconcile the marker after uncertainty, and escalate unresolved ambiguity instead of creating again. State any remaining provider-level exactly-once limitation honestly. Verify cleanup of all matching resources, not just the most recently saved reference.

### P1-03 — Expiring sync leases have no owner/fencing token

**Locations:** `app/lib/scheduling/sync.ts:21`, `:43`; migration `20261101090000_mba_scheduling.sql:350` and `:372`; `app/lib/scheduling/document-repository.ts:181`.

A claim is a timestamp, not an ownership token. After 300 seconds a second worker can claim the booking while the first is still executing. `finishSync` checks only booking version and clears whichever lock is present; an old worker can release the newer worker's lease. Provider fetches have no explicit abort deadline, and every write is not conditioned on lease ownership. A version guard is insufficient when both workers handle the same version.

**Independent evidence:** (1) PostgreSQL: worker A claims; B claims at +301 seconds; A's old finish returns `applied`; C can immediately claim during B's intended lease. (2) In-memory service: hold A's Zoom create, advance clock +301 seconds, complete B, then release A. Two meetings exist; canceling the booking leaves **one orphan**.

**Required fix:** use unique claim IDs/fencing generations, guarded completion/reference writes and renewal where justified. Bound each provider request and the total pass below the execution budget; do not rely on request timeout to undo a remote mutation. Reconcile ambiguous side effects as in P1-02. Add tests where an old worker resumes after a replacement claim and after cancellation. PostgreSQL and document contracts must agree.

### P1-04 — Webhook replay ledger commits before processing succeeds

**Locations:** `app/api/webhooks/scheduling/zoom/route.ts:23`, `app/api/webhooks/scheduling/resend/route.ts:22`, `sched_seen_webhook` in the migration.

Both handlers mark the delivery seen before applying its effect. If processing throws, the response is 500, but a legitimate retry is then acknowledged as a duplicate without retrying the failed effect. Zoom meeting-deleted recovery can be lost; Resend delivery/bounce status has the same defect. The reconciliation sweep checks stored reference/version state, not remote existence, so it is not a reliable replacement for a lost Zoom deletion notification.

**Reproduction:** valid signed Zoom and Resend requests, transient failure in the handler after ledger acceptance, then retry the identical delivery. First response: 500. Retry: 200 `duplicate:true`. Effect handler executes once, not twice. The signatures themselves were valid and were not bypassed.

**Required fix:** use an inbox with processing/completed states and retryable claims, or commit the ledger acknowledgment and state mutation transactionally. A crash between claim and processing must be reclaimable. Preserve authentication and successful-delivery replay suppression. Resend status-only impact is P2; loss of the Zoom recovery action makes the shared pattern P1 here.

## 3. Other defects and limitations

| ID | Severity | Evidence and action |
|---|---|---|
| E-01 | P2 | **Email exactly-once is bounded, not guaranteed.** `sync.ts:280` sends before persisting the accepted attempt. The partial unique database index runs after the external effect. An accepted send followed by a failed database write can send again after Resend's 24-hour idempotency retention expires. The audit models that crash and delayed recovery and observes two sends but one accepted database row. Persist an immutable outbound intent/payload before sending, track ambiguity, reconcile provider receipt evidence where possible, and require manual review outside the provider's deduplication window. Do not blindly change keys. |
| E-02 | P2 | **Contained calendar conflicts are invisible.** `sync.ts:245`/`:255` discards busy blocks contained in the union of own bookings. A foreign event wholly inside the booking produces the same merged free/busy interval as the booking alone, so it is ignored. The documented limitation is broader than “identical event times.” Reproduced with a merged own-plus-contained-foreign interval. Use event-level identity/properties if detecting these conflicts is a requirement; otherwise disclose the detection limit. |
| E-03 | P2 | **Admin mutations lack origin/JSON enforcement.** `http.ts:22` authenticates but does not enforce Origin/fetch metadata or content type; `http-shared.ts:22` accepts JSON in text/plain. The authenticated wrapper accepts a cross-origin text/plain mutation in a route test. This is defense-in-depth evidence, not proof that browser SameSite cookies can be bypassed. Add same-origin/fetch-metadata checks and JSON-only bodies, with appropriate handling for OAuth GET callbacks. Publications already has a stronger pattern. |
| E-04 | P2 | **Public abuse controls are limited.** Per-IP booking limits (10/hour), atomic overlap/caps and opaque references are useful, but the limiter fails open, bodies are read before size validation, email ownership is not verified, and no recipient/global abuse budget or bot challenge is present. A public request can reserve capacity and trigger a transactional message to an unverified address. Introduce bounded body sizes, recipient/host capacity budgets and a proportionate bot/verification control. Vercel overwrites forwarding headers, so arbitrary X-Forwarded-For spoofing was NOT claimed as a demonstrated Vercel exploit. |
| E-05 | P2 | **Reconciliation/conflict scans can starve later bookings.** `sync.ts:98` and `:248` select the same first 200 eligible records each time; there is no cursor/last-checked rotation. At larger volume, records after that prefix can remain unchecked. This is code-inspection evidence, not a load-test result. Page fairly with durable cursors or select oldest-unchecked work. |
| E-06 | P2 | **Health labels are weaker than integration health.** Google “connected” is based on the stored row; Resend “configured” checks key presence. Neither label alone proves a usable token, verified sender, delivery webhook or working recovery path. Require actual read-only preflight checks and distinguish configured/authenticated/operational. Provider fetch deadlines and the pre-existing shared admin-auth timeout also need attention. |
| E-07 | P3 | **No-local-database suite does not skip cleanly.** `supabase-service.test.ts:24` enters a skipped describe callback but still dereferences `local!.url` at line 25. With database tests disabled the suite fails during collection. Fixed-environment full tests pass; move client construction into a guarded hook. |

Additional deployment hygiene: rotate the published prototype invitation code before any real invitation-only offering; disable/hide simulated community joining until integrated with the existing consent system. Google channel-token acknowledgment currently does not reconcile external edits, and no Google channel was established by this audit.

## 4. Independently verified safeguards and claims

### Database and security

- All **13 local scheduling tables** have RLS enabled, zero policies, and no SELECT/INSERT/UPDATE/DELETE privileges for anon/authenticated.
- All **eight operational scheduling RPCs** deny EXECUTE to anon/authenticated and grant it to service_role; they are security-invoker. The ninth function is a trigger function, also invoker. Its public EXECUTE privilege is not a demonstrated data-access escalation because it is trigger-only and underlying tables remain denied.
- Actual SET ROLE checks in the disposable database deny reading the Google secret table and invoking the claim RPC for both browser roles.
- A fresh migration applies successfully in a disposable database with minimal pre-existing `consent_records(id)` and `set_updated_at()` dependencies. This is not a production migration approval or a full copy of production schema.
- Independent SQL concurrency: ten identical idempotency requests produce one row; twelve conflicting requests produce one success and eleven slot refusals; four disjoint same-day requests at cap two produce two successes and two cap refusals.
- The complete existing suites reproduce cancellation/reschedule races, partial provider failures, eight-attempt exhaustion, delayed recovery and process termination after simulated Google/Zoom side effects. These passing scenarios do not cover away the P1 counterexamples.
- Public references use 18 random bytes (144 bits); status projection excludes email/message/internal booking ID. Admin cancellation/rescheduling routes require an admin, apart from the preview bypass above. Service-role/vault modules are server-only. OAuth uses hashed one-use state, PKCE, encrypted refresh tokens, verified owner identity and a primary-calendar restriction.
- Scanned **1,099 source/browser-asset/log files** for the actual configured secret values: zero matches in checked files. This is a bounded scan, not a guarantee about all historical logs or third-party retention.

### Email and actual provider evidence

- Existing development email/isolation tests independently pass: local-only scheduling purpose, exact test recipient, single address, cc/bcc rejection, marketing refusal and Vercel/production isolation. Production's existing unrestricted delivery behavior is intentionally unchanged; the development exception does not activate there.
- Transactional rendering escapes content through the shared renderer, shows guest-zone times, uses HTTPS-only Zoom links, omits the Zoom button from cancellation and includes no marketing opt-in inference. Actual visual email-client rendering was not re-tested by sending.
- Read-only Resend queries show the three real test messages—confirmation, reschedule and cancellation—each with `last_event=delivered`. Local history has six accepted attempts overall, including simulated attempts; “six accepted” does not mean six real sends. A provider delivery event does not prove the user opened or read a message.
- Google encrypted credential refresh succeeds with the expected two Calendar scopes plus identity, and the expected owner/primary calendar. Historical provider references checked in local records are deleted/canceled on the providers. Zoom's host-meeting list contains zero MBA-marker meetings and no further page. This supports the recorded cleanup claim, not a universal absence-of-orphans proof.
- Zoom token contains exactly the five recorded granular meeting scopes; read-only meeting listing succeeds. Update/delete perform host ownership checks. The host-profile query is unavailable with these narrow scopes, so the host's paid license and meeting-duration entitlement remain unverified; do not add broader scopes just to satisfy this audit.
- `mindrasolutions.com` is verified. The separate development key and file permissions were established in Phase 2C; no key was created or changed during this audit. No scheduling-specific Resend webhook is configured.

## 5. Production deployment and configuration risks

### Verified deployed and Git state

| Item | Actual state |
|---|---|
| Domain | https://modernbusinessarchitect.com |
| Production deployment | `dpl_EgbDJyDwJdofN3shCZTQ6yckehJG`, READY |
| Production and remote main commit | `2e0f68b97a2723a3bbee6445e4ea8c67b6e66302` (Publications restoration with current Transition flow) |
| Current local branch / HEAD | `feat/mba-scheduling` / `be03b656773d94fe200be8a3b129aa3efa690d0b` |
| Local main | `3050559`; local cached origin/main is stale (`cce6667`). Actual remote head was read with ls-remote, without fetching into this checkout. |
| Local feat/publications | `a7f0d44`; no remote branch of that name or feat/mba-scheduling was found. |
| Scheduling work | Uncommitted/untracked, including migration, routes, adapters, tests, cron tooling and shared-file changes. |
| Production scheduling schema | `sched_bookings` absent. `consent_records` and `set_updated_at()` dependencies exist. |
| Production environment metadata | No `SCHEDULING_*` variables configured. Existing production Supabase/Resend/cron variables exist. Preview has no Supabase credentials. Values were not decrypted or printed. |

Publications catalogue and a book page return 200; all three catalogue links are present. Scheduling public page/API return 404. Transition returns 200. Thirty-one Transition/program/booking source files match production exactly. The initial Transition HTML does not expose the later Calendly CTA; no real form submission was made to exercise it. The production-matching source retains the Calendly configuration.

Compared with the Publications-restoration commit, 55 restored files match the current checkout byte-for-byte. Remaining differences are the admin Scheduling navigation hunk, development OAuth logging in next.config.ts, and an outdated Publications release README. The original source snapshot stayed unchanged throughout the audit, apart from the newly delivered report/evidence files.

**Do not deploy the local branch HEAD or commit only the new Scheduling directories on top of it.** That base lacks committed Publications. Doing so can reproduce the recent production regression. Local paths showing as untracked does not mean they are absent from remote main.

### Infrastructure and mandatory release gates

1. **Off-switch is not a production feature flag.** `prototype.ts:10` always returns false on Vercel and never reads `SCHEDULING_ENABLED`. Setting that variable cannot enable the feature. A reviewed production enablement design is still required.
2. **Separate public intake from management/recovery.** The proposed “all routes 404 while off, then connect Google in admin and verify cron before turning on” sequence is impossible with a single common gate. Keep authenticated admin/OAuth, signed webhooks and authorized recovery accessible while customer intake remains disabled. Preview stays permanently development/mock-only.
3. **Rollback instructions are unsafe/inaccurate as written.** Changing Vercel environment variables does not mutate an existing deployment; a new deployment is needed unless a runtime flag service is explicitly implemented. Turning off every route, unscheduling cron or disconnecting Google while cleanup is pending strands external resources. Cancellation returning does not itself prove asynchronous cleanup has finished.
4. **Google production OAuth is not ready.** The configured client is documented as development-only with a localhost redirect and External/Testing consent. This audit verified local credential operation, not Google Cloud production-console state. Configure and verify the production redirect/client and publishing status before release. Google documents seven-day refresh-token expiry for external Testing apps with Calendar scopes.
5. **Supabase is Pro, not Free.** The organization reports `plan=pro`; paid projects are not automatically paused for inactivity. This resolves the speculative Free-plan inactivity blocker in Phase 2C. `pg_cron` 1.6.4 and `pg_net` 0.20.4 are available but not installed in production; Vault is installed. Scheduling tables and recovery job remain unapplied/unconfigured. Test real HTTP responses and heartbeat after approved setup.
6. **Vercel team is Hobby.** Its native cron cannot provide one-minute scheduling. Supabase cron is the viable existing-service option. The code explicitly sets maxDuration=60 on synchronization endpoints regardless of larger Fluid defaults; a 25-booking serial sweep has no elapsed-time budget. Confirm active runtime settings and budget work so slow calls cannot consume the entire pass.
7. **Resend production webhook and health checks are missing.** Register a separate signed delivery/bounce endpoint after fixing P1-04, preserve existing Resources/Transition webhook behavior, and verify sender/reply-to/SPF/DKIM/DMARC and production credentials. Do not deploy local test flags/keys.
8. **Product readiness:** implement actual consent flow or remove community joining; confirm available meeting types, invitations, home time zone, buffers and host license. Guest self-service and .ics are absent; reply-to-admin management can be an explicit accepted MVP limit, not a hidden promise.

## 6. Corrective actions, in priority order

1. Fix preview/live-service isolation immediately; do not perform more real local tests through preview routes.
2. Fix Zoom ambiguous-create retries and add durable ownership/fencing to workers. Bound provider/worker execution and test old-worker resumption and cleanup.
3. Make webhook processing transactionally retryable. Test process termination both before and after each durable acknowledgment.
4. Replace absolute email-once claims with an immutable outbox/ambiguity strategy honoring the provider's deduplication window; address contained-event conflict detection and fair scan pagination.
5. Add origin/content-type/body-size controls and proportionate public abuse protection; preserve admin authentication and provider signature checks.
6. Design independent public-intake, management/recovery and preview gates. Correct the environment-change and rollback runbook before a production rollout.
7. Prepare an isolated release **based on remote main `2e0f68b`**, after preserving this entire pending checkout. Port only Scheduling paths and reviewed scheduling-specific shared-file hunks. Keep Publications, its sitemap rewrite, sharp dependency, home components and SEO additions; leave Transition/Calendly untouched. Do not copy the stale local release README over the production record. No Git changes were made by the audit.
8. Only after review/approval: stage production with public intake disabled, smoke-test Publications and Transition, apply the additive scheduling migration once, provision production OAuth/provider variables, connect via protected admin, register webhooks, install and observe minute recovery, and run one explicitly approved lifecycle test before exposing a customer CTA.

## 7. Go-live recommendation and rollback

**NO GO until all P1 findings and release gates are addressed and independently re-tested.** A passing happy-path lifecycle and 1,051 green tests are insufficient in light of the reproduced failures.

Release acceptance must include: no live-provider access from preview; ambiguous Zoom-create recovery without duplicates; stale workers unable to clear newer leases or write stale references; retryable signed webhook effects; bounded queue recovery independent of the guest page; documented mail ambiguity handling; production OAuth tokens not subject to seven-day Testing expiry; configured signed delivery tracking; honest community behavior; and zero Publications/Transition regressions from a production-main-based release.

For rollback, first close **public intake only** using the reviewed operational switch. Keep authenticated management, callbacks and the worker available. Preserve database records, encryption keys and provider references. Complete/cancel affected bookings only under approval, wait for cleanup and notifications to reach a known terminal state, and verify provider deletion before stopping the worker or disconnecting credentials. Retain additive tables. Application rollback must target the Publications-safe `2e0f68b` baseline (or a later verified baseline), not the stale local main; account for any queued work that the old app cannot process.

## 8. Reproduction and evidence

- `audit/independent-audit.test.ts`: eight deterministic mocked reproductions. It intentionally verifies current unsafe behavior. After corrections, replace those assertions with expected safeguards.
- `audit/database-adversarial.py`: isolated SQL concurrency, permission and stale-lease reproduction; targets only the named disposable local audit database.
- `audit/database-results.json`, `audit/provider-read-results.json`, `audit/secret-scan.json` and test/build logs: sanitized evidence.
- To run the mocked reproducer from a prepared copy of this repository: `SCHEDULING_DB_TESTS=0 npx vitest run --cache=false docs/mba-scheduling/audit/independent-audit.test.ts`. If the repository's workspace config also collects unrelated suites, select this file explicitly; it contains no live provider credentials.
- Full independent validation: 1,051 existing tests plus eight defect reproducers passed (1,059 total), 18 skipped; TypeScript and isolated Next.js production build passed. The portable saved reproducer was separately re-run: eight assertions passed. The build used no live integration configuration.
- Existing PostgreSQL tests should run against a disposable stack, not a developer database containing real connections/bookings. The audit used an isolated gateway and no real provider credentials for the full suite. The old skipped-suite collection error is separately documented above.

### Primary documentation checked

- [Google OAuth refresh-token expiry](https://developers.google.com/identity/protocols/oauth2)
- [Resend idempotency retention](https://resend.com/changelog/idempotency-keys)
- [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Vercel cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel environment-variable deployment behavior](https://vercel.com/docs/environment-variables)
- [Vercel forwarding-header behavior](https://vercel.com/docs/headers/request-headers)

These sources support platform behavior only. They do not replace the account-specific observations or authorize configuration changes.
