# Phase 2E independent re-audit

Date: 2026-10-31. Scope: current uncommitted working tree on `feat/mba-scheduling`, HEAD `be03b656773d94fe200be8a3b129aa3efa690d0b`.

## 1. Verdict: FAIL for customer go-live

Phase 2E materially improves isolation, worker ownership and webhook retry handling. Nevertheless, a stale worker can leave Zoom at the wrong appointment time indefinitely while the database says synchronization is successful. Zoom's fixed settling interval still permits duplicate creation and premature cancellation cleanup. Owner notification behavior fails two explicit requirements. No P0 was demonstrated.

The next phase should be a narrowly scoped correction and independent verification phase, followed by production preparation with intake disabled. Do not enable real customer bookings yet. This audit made no implementation fixes, real provider writes, production changes, commits, pushes or merges.

## 2. Independent evidence and limits

Read Phase 2D, Phase 2E and Phase 2C reports and inspected the corresponding implementation. Developer reports were treated as claims.

- Full existing suite: **1,108 passed, 18 skipped**, independently run in an isolated source copy with a newly created disposable PostgreSQL database, separate PostgREST and no live Google/Zoom/Resend credentials. All provider side effects were mocked, including process-kill tests.
- Original eight TypeScript reproducers run unchanged: **five fail, three still pass**. They assert unsafe behavior, so a failure alone is not proof of remediation. The preview now returns 403; Zoom throws `ZoomAmbiguousError` after one create; the old lease scenario no longer leaves its duplicate. The two old webhook fixtures implement the removed `acceptWebhook` interface and now return errors: these two failures are harness incompatibility, not proof that retries work. Independently executed the new signed-route regression tests and additional webhook race tests instead.
- Six additional adversarial evidence tests: **six passed**, intentionally asserting newly demonstrated unsafe outcomes. These prove defects rather than compliance. Evidence file: `audit/phase2e/independent-reaudit.test.ts`.
- Independent SQL: ten identical requests produce one booking; twelve overlapping requests produce one success and eleven refusals; four requests at daily cap two produce two successes and two refusals. Stale worker finish returns `lost`, stale renew returns false, and a third claimant cannot steal the newer lease. Eight simultaneous affirmative consent writes produce exactly one evidence row.
- Both migrations apply in order on a fresh database with minimal existing `consent_records`/`set_updated_at` dependencies; Phase 2E reapplies successfully. This is not a restored production-schema rehearsal.
- TypeScript and optimized production build pass in the isolated copy. Explicit database-disabled collection still fails as E-07 predicted.
- Compared hashes of 926 pre-existing source/reference files: zero changed by the audit. A bounded scan of 1,016 source/build files found none of the actual configured secret values. Ignored credential files were excluded from evidence; this is not an assurance about all historical logs.
- No new real emails, Google events, Zoom meetings or bookings were created. No live-provider lifecycle or browser automation was performed in this re-audit. UI findings combine code inspection, service tests and independent SQL; Claude's browser screenshots/results were not independently reproduced.

Evidence and logs are under `audit/phase2e/`. To repeat the extra evidence tests, copy that test file into `app/lib/scheduling/phase2e-independent.test.ts` **in a disposable source copy only**, then run `npx vitest run --project unit app/lib/scheduling/phase2e-independent.test.ts --cache=false`. Its aliases resolve from the repository root. Do not point the full suite at the working development database: global maintenance tests can process unrelated rows.

## 3. Status of the original P1 findings

| Original finding | Re-audit status | Independent conclusion |
|---|---|---|
| P1-01: unauthenticated preview reaches live service | **Closed for reviewed paths** | Separate preview file store and fixed mock adapters; no live service/Supabase imports. Foreign-origin/plain-text mutation refused. Signed-in admin and live service remain separate. Passing preview regression tests include Vercel/non-development denial. |
| P1-02: HTTP create retries ambiguous Zoom outcomes | **Original adapter defect closed; end-to-end safety incomplete** | One POST on network error, timeout, unusable success or 5xx. Persisted intent and marker lookup work within the assumed listing window. RE-02 proves that 180 seconds is not an absence guarantee. |
| P1-03: expired lease allows stale database ownership | **Database defect closed; external-write defect remains P1** | Claims and fenced reference/finish writes resist stale tokens in SQL and repository tests. RE-01 proves that stale Zoom writes are not repaired as stale Google writes are. |
| P1-04: delivery marked seen before effect | **Original transient-retry defect closed; overlapping completion incomplete** | Signed Zoom/Resend tests reproduce failure/retry/success/replay and busy responses. RE-03 proves an unfenced late completion can reopen an already processed event. |

## 4. New and residual defects

### RE-01 — P1: stale Zoom update silently wins over a newer reschedule

Location: `app/lib/scheduling/sync.ts:230-232`, also adoption/update at `:243-247`.

Independent sequence: synchronize 10:00; reschedule to 11:00; hold that worker inside `updateMeeting`; advance the clock 301 seconds; reschedule to 12:00 and let a replacement worker finish; release the old update. Zoom ends at **11:00**, booking and reference remain **12:00 / version 3**, and sync is **ok**. `reconcile()` queues nothing and `scanZoom()` removes nothing. There is only one meeting, so duplicate cleanup cannot repair its stale content.

The rejected database write prevents reference corruption but does not undo the external write. The Google path invalidates references after this situation; the Zoom update/adoption paths do not. Renewing immediately before a call cannot prevent process suspension after the check or an in-flight provider write. A process crash after the external write also prevents compensation from running.

Required: detect/repair stale Zoom writes in both update paths, and provide periodic external-state validation independent of a worker surviving to invalidate references. Test late update after reschedule and cancellation, stale marker-search results, replacement during ownership checks, and process death after the external write. Do not claim exactly-once or current external content solely from fenced database success.

### RE-02 — P1 release blocker: absence after 180 seconds is treated as permission to create

Location: `sync.ts:251-265`; cancellation at `:208-217`; duplicate scan at `:383` onward.

Independent mock delayed marker visibility beyond 180 seconds after a committed create with a lost response. At 181 seconds the next pass creates a second meeting. A successful second create resets uncertainty; the two-unknown-outcome stop does not prevent this case. Cancellation similarly records Zoom `deleted` after the interval while the hidden meeting still exists.

When listing later exposes the meetings, a direct duplicate scan removes the extra/canceled meeting in the reproducer. That is useful eventual cleanup, not bounded cleanup: production cron is absent, the scan is throttled to 15 minutes, provider listing/deletion can fail, and over five pages/1,500 meetings the adapter refuses the entire scan. The page cap correctly fails closed rather than creating from a partial list, but then recovery cannot progress automatically.

This residual risk is **not accepted for customer launch** without an explicit safer uncertainty policy. Keep unresolved creates/cancellations pending or route them to human review rather than asserting absence from elapsed time. A time-based re-create would need an explicitly approved residual-risk policy plus observed recovery, not an undocumented consistency assumption. Test multi-page duplicates and eventual cleanup with delayed listings and crashes.

### RE-03 — P2, required before launch: stale webhook completion reopens processed delivery

Location: Phase 2E migration `sched_webhook_finish`, lines 147-152; `document-repository.ts:240`; `service.ts:400-408`.

A claims event; after 121 seconds B reclaims it and finishes successfully; A then fails and unconditionally writes `failed`. A third delivery runs the effect again. Reproduced through `handleWebhook` and directly in PostgreSQL. Completion has no claim token/generation and no processed-state guard. Thus “successful deliveries cannot be replayed” is not fully true under overlap. Existing effects are intended to be idempotent, limiting impact; this test does not demonstrate an unsigned-request bypass or actual duplicate external creation.

Required: fence webhook completion with a claim generation/token; stale success/failure must not replace current ownership or terminal success. Test both completion orders and late failures after successful processing.

### RE-04 — P2, explicit acceptance failure: retry sends historical owner cancellation

Location: `sync.ts:429` (`ownerKindFor`) and `service.ts:368` (`retrySync`).

Independent sequence: create/sync/cancel while owner notifications are absent, advance 40 days, construct service with owner notifications enabled, then retry synchronization. One `owner_canceled` message is sent to the mock outbox. There is no activation cutoff, historical baseline or requirement that the owner was previously told about the booking. This directly fails the requested old-canceled-booking restriction.

Required: define activation/event eligibility and suppress historical catch-up without manufacturing fake successful deliveries. Preserve independent owner/guest records and retries. Add the exact old-booking reproducer as a safe regression test.

### RE-05 — P2, explicit acceptance failure: owner recipient is not restricted

Location: `owner-address.ts:7-8`, wired through `integrations.ts:95`.

The default is `martindubreuil13@gmail.com`, but `SCHEDULING_OWNER_EMAIL=different@example.test` returns and uses that other address. Independently asserted through the resolver. This is operator configuration, not guest-controlled input, and development test-mode suppression remains effective. However, production delivery is unrestricted, so the implementation does not enforce the requested recipient restriction.

Required: reject any owner destination other than the approved address, or obtain explicit approval for configurable recipients. Do not silently simulate production recipient mistakes.

## 5. Community and notification verification

**Community: qualified pass for the reviewed consent-only scope.** `communityPromptDue` requires confirmed + ready + unseen/shown; the service refuses pending-Zoom and canceled bookings. The modal has separate equal-style Yes/No buttons, no preselected option and initial focus on decline. Escape, close, backdrop and Not now record `dismissed`, never `joined`. Service tests confirm terminal decisions prevent prompting and record exact wording/version/email/source/timestamp. SQL row locking gives one record under eight concurrent affirmative submissions. No mailing-list provider or subscription call is connected; a yes stores evidence only. No subscription was authorized or performed.

Limits: dismiss persistence errors are swallowed, so a network failure can cause a later re-prompt; “shown” is deliberately not a decision. Readiness currently means Zoom ready, not verified Google synchronization or successful guest email delivery. If “full confirmation” is intended to require all three, tighten that contract before release. Readiness/status are checked before the consent RPC rather than revalidated inside its booking lock; a concurrent cancellation can cross that boundary. These are P2 follow-ups, not evidence of implicit subscription. Before any marketing integration, implement the site's approved consent/confirmation and withdrawal flow.

**Owner notifications: functional core passes; feature acceptance fails RE-04/05.** Independently executed tests cover new/reschedule/cancel content, previous/new times, guest details, escaped message content, header-line defense, HTTPS Zoom button, separate kinds/idempotency keys, independent owner/guest failure states, bounded owner retries, repeated sweeps and eight concurrent workers. Owner reply-to is the validated plain guest address. No real delivery occurred.

Retries are not an unlimited exactly-once guarantee: send-then-record ambiguity (E-01) applies to owner messages too. Guest/owner version changes can still cross an in-flight external send. The hardcoded development test recipient, single-address checks, scheduling-only purpose and Vercel/production exclusion tests pass; production's normal unrestricted policy remains unchanged.

## 6. E-01 through E-07, ranked by customer impact

| Rank | Finding | Reassessment and launch condition |
|---|---|---|
| 1 | E-04 public abuse | **Promote to P1 launch blocker for unrestricted public intake.** Fail-open per-IP limits, no bounded body read, no recipient/global booking-email budget and unverified recipient ownership allow reservation/email abuse. No forwarding-header spoof exploit was demonstrated. Add bounded requests, independent capacity/recipient/global budgets and proportionate bot/ownership controls; define limiter-outage behavior. |
| 2 | E-01 duplicate email | **P2, required mitigation before launch.** Original lost-record/25-hour reproducer still passes. Unique accepted rows occur after send and cannot undo delivery. Persist ambiguity and review/reconcile outside the provider window instead of blind resend; apply to owner and guest messages. Resend documents [24-hour key retention](https://resend.com/changelog/idempotency-keys). |
| 3 | E-02 contained conflicts | **P2, conditionally acceptable documented limit.** Original reproducer still passes: a foreign event wholly inside an own event disappears in merged free/busy. Must not advertise complete conflict detection. For automatic protection, use event identity/content; otherwise approve an operational review policy and show the limit. |
| 4 | E-05 scan starvation | **P2, volume-dependent blocker.** Same first 200 eligible bookings are scanned; no fair cursor. Accept only with enforced low-volume bounds/monitoring; otherwise fair pagination and a beyond-200 sentinel test are needed. Zoom's five-page cap separately fails closed and needs a supported-volume plan. |
| 5 | E-06 health labels | **P2; operational preflight is mandatory.** Stored Google connection / present Resend key are not proof of operational production integrations. Zoom now has per-request deadlines. Do not accept labels as OAuth, sender, webhook or worker readiness. |
| 6 | E-03 admin Origin/JSON | **P2 defense in depth.** Original authenticated wrapper still accepts cross-origin text/plain JSON in the mocked route test. Add the preview/Publications-style origin/fetch-metadata and JSON controls. This does not independently prove browser cookie/SameSite bypass. |
| 7 | E-07 database-disabled tests | **P3 tooling defect.** Independently reproduced null `.url` failure during collection with `SCHEDULING_DB_TESTS=0`. Guard client construction; do not mistake collection failure for disabled tests passing. |

## 7. Deployment safety and migrations

Production was independently read again through Vercel: `modernbusinessarchitect.com` points to READY deployment `dpl_EgbDJyDwJdofN3shCZTQ6yckehJG`, Git main **`2e0f68b97a2723a3bbee6445e4ea8c67b6e66302`**, the Publications restoration. Remote main matches. Remote scheduling branch was not returned by `ls-remote`; local scheduling HEAD remains `be03b65`, and all Scheduling implementation/migrations are untracked. Local main `3050559` and cached origin/main `cce6667` are stale.

Compared production Git objects with the audited copy: **42 non-documentation Publications paths and 67 Transition/Calendly-named paths match exactly**. This is a bounded path comparison, not a full functional browser test. Shared files still need reviewed integration: AdminShell, email client/policy, navigation/home, SEO/sitemap, package files, Next config and environment examples. A blanket deployment of the old branch or replacement of the dirty tree is unsafe. No file was reverted or staged.

Read-only hosted Supabase query: **zero scheduling tables, three publication records, pg_cron absent, pg_net absent**. Neither scheduling migration is deployed. The failed first metadata query referenced a non-existent Publications `status` column; it made no changes. The corrected query used only counts and installed-extension flags.

The migrations are compatible **together**, fresh and with Phase 2E reapplied in the disposable database. All 13 scheduling tables have RLS and no browser-role table privileges. All twelve operational RPCs are invoker functions and deny browser EXECUTE; the trigger-only function retains PUBLIC execute, without demonstrated table-access escalation. Phase 2E changes/removes RPC signatures: **old application code is not a safe rollback target on the migrated schema**. Rehearse the actual hosted schema, execute migrations transactionally, verify permissions after deployment, and retain a release compatible with both migrations. Re-running the base migration after Phase 2E was not tested or approved.

Production currently hard-disables Scheduling on Vercel regardless of flags. `vercel.json` contains no scheduling job; the worker endpoint allows 60 seconds and processes a serial batch. Add distinct public-intake and operational gates; configure minute recovery and a request-time work budget, with heartbeat/stalled-work alerts. Supabase documents [Cron](https://supabase.com/docs/guides/cron) and [pg_net HTTP scheduling](https://supabase.com/docs/guides/database/extensions/pg_net), so infrastructure is feasible, not configured or proven here. Before carrying a bearer secret through pg_net, review its [queued-header visibility constraint](https://supabase.com/kb/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net); Vault does not hide the decrypted queued header. Prefer a narrowly scoped recovery credential and review the actual roles/exposure. No extension, job or credential was changed.

Production OAuth/client/redirect and publishing status still need account-level verification. Phase 2C describes a localhost development client in Testing; [Google documents seven-day refresh-token expiry](https://developers.google.com/identity/protocols/oauth2) for external Testing apps requesting Calendar scopes. No new account-console verification was performed. Recheck Zoom host permissions/ownership and duration entitlement, Resend sender/reply-to and signed delivery webhook, and production health from read-only operations before any controlled live test.

## 8. Required sequence and next phase

1. Fix RE-01 and add external-state recovery that survives worker death. Resolve RE-02's unknown-outcome policy. Rerun the exact independent reproducers plus stale-update/adoption/cancellation/crash cases.
2. Fence webhook completion (RE-03); suppress historical owner catch-up and enforce the approved recipient (RE-04/05). Preserve separate guest/owner retries. Convert evidence assertions into safe regression expectations in the implementation suite.
3. Address public intake abuse and ambiguous email recovery. Explicitly approve the contained-calendar-conflict limitation or implement event-level detection. Set enforced volume limits or fair scan paging. Harden admin mutations and truthful health reporting.
4. Assemble a future isolated release **from verified production main 2e0f68b**, selectively applying Scheduling and reviewed shared-file changes. Preserve Publications migration/content and Transition/Calendly. Do not merge/deploy the dirty old branch wholesale.
5. Rehearse both migrations and permission checks on a production-schema copy. Deploy operational routes with **public intake off**, configure production OAuth/provider/webhook/recovery credentials securely, observe minute recovery, and test worker budget/alerts. These are future authorized release actions, not actions performed by this audit.
6. Rollback plan: freeze new intake first; keep compatible worker/admin/webhooks running until pending sync/cleanup and cancellation drain. Preserve tables, ledgers, consent and resource references. Keep a schema-compatible operational release available. Returning to the Publications-only commit preserves the website but disables recovery; it is not a safe immediate rollback with outstanding appointments. Never undo migrations by dropping booking data.
7. Obtain review approval of this report and fixes; then perform a separately authorized controlled live lifecycle/email test. Public customer intake remains blocked until the above safety gates pass.

**Recommendation:** proceed to a remediation-and-release-preparation phase, not deployment or additional live appointments. Community evidence can remain local; owner notification acceptance is incomplete. No implementation change is authorized by this report itself.
