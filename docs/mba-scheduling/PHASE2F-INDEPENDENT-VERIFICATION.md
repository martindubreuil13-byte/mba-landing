# MBA Scheduling — Phase 2F independent verification

Date: 2026-10-31 (Asia/Bangkok). Audited local branch: `feat/mba-scheduling`; HEAD `be03b656773d94fe200be8a3b129aa3efa690d0b`, with uncommitted Scheduling changes. Read the Phase 2D audit, Phase 2E independent re-audit and Phase 2F remediation report; inspected implementation and independently executed tests.

## 1. Verdict: FAIL

**Do not approve customer go-live or deployment of this implementation.** Three fixes pass independent verification; the original stale-write and uncertain-create scenarios improve materially, but end-to-end safety remains incomplete. Two new P1 counterexamples were reproduced: an ordinary admin retry bypasses uncertain-create protection, and stale cleanup can delete a newly adopted meeting while leaving synchronization marked successful. No P0 was demonstrated.

Proceed only to targeted local correction and verification, with intake kept disabled. Read-only production planning can continue. No implementation fix, commit, push, merge, deployment, real provider write or production mutation was performed by this audit.

## 2. Evidence and test results

| Check | Independent result |
|---|---|
| Full existing suite | **1,147 passed, 18 skipped** in a disposable database/source copy, matching the reported count. |
| Original audit reproducers, unchanged | **11 failed, 3 passed**, across 14 tests. These assert unsafe behavior; their failures require interpretation, not automatic acceptance. |
| New independent adversarial tests | **10 passed**: seven assert safeguards; three deliberately assert unsafe behavior and prove findings F-01 through F-03. |
| Independent PostgreSQL concurrency | Booking idempotency, overlap/cap enforcement, worker claim fencing, webhook ownership and baseline concurrency pass. |
| Migrations | All three apply in order; Phase 2F reapplied twice after populated test records, with all scheduling-row digests unchanged. |
| TypeScript / optimized build | Pass in isolated source copy. |
| Database-disabled collection | Still fails on null `.url` in `supabase-service.test.ts:25` (E-07). |
| Preservation / bounded secret scan | Zero changes to 941 pre-existing source/reference files; 1,031 source/build files scanned with no matches to configured secret values. |

Evidence is saved under `docs/mba-scheduling/audit/phase2f/`, including test source, SQL script/results and logs. The new evidence file mixes safe assertions and explicitly named `UNSAFE` assertions; a green result does not mean all requirements pass. To reproduce, copy `independent-verification.test.ts` into `app/lib/scheduling/phase2f-independent.test.ts` **in a disposable source copy**, then run `npx vitest run --project unit app/lib/scheduling/phase2f-independent.test.ts --cache=false`.

The full suite ran against `mba_phase2f_audit_20261031`, with separate local REST/proxy ports and mocked providers. Only local database credentials were copied; no live Google, Zoom or Resend keys were available to the test/build copy. Existing real development records were not used for writes. The audit database, REST container, proxy and temporary credential files were removed after testing.

Limits: no browser interaction, live-provider consistency test or new real message/event/meeting was performed. UI recovery findings are source inspection plus service/admin-dispatch tests. Full-suite process-kill tests really terminate child processes, but external state is file-backed simulation, not Zoom/Google. TypeScript excludes historical audit evidence per the current project configuration; the fresh independent test was compiled in the isolated app directory.

### Interpreting the original reproducers

The Phase 2E stale-time assertion now fails because the reference becomes stale and repair is queued. Delayed-listing and uncertain-cancellation assertions fail because no second automatic create occurs and cancellation remains unresolved. The webhook assertion receives `duplicate`; recipient override is rejected. The old historical-cancellation harness uses an unapproved owner address and now throws before reaching eligibility, so I separately reproduced it with the approved address: no owner notification occurs.

The Phase 2D webhook harnesses still implement the removed `acceptWebhook` interface: their errors do not prove remediation. Current signed-route tests, independent service tests and direct PostgreSQL fencing checks supply that evidence. The three unchanged unsafe assertions still passing are E-01 email duplication, E-02 contained conflicts and E-03 authenticated cross-origin/plain-text mutation acceptance.

## 3. Verification of RE-01 through RE-05

| Finding | Status | Evidence and remaining condition |
|---|---|---|
| **RE-01: stale Zoom writes** | **Original scenario passes; end-to-end incomplete** | Independently stalled the 11:00 update, advanced beyond the lease, rescheduled twice to 13:00, completed the replacement, then released the stale write. It invalidates references/queues repair; the next pass restores 13:00. Independent external-state tampering without compensation is also detected/repaired. Existing tests cover stale adoption, wrong duration, uncorrectable writes, cancellation and SIGKILL after update. F-01 can still leave a missing meeting marked healthy; F-03 accepts unknown read-back fields. |
| **RE-02: uncertain creation** | **Automatic path passes; manual-recovery requirement fails** | At 1, 25 and 200 simulated hours, automatic runs/maintenance create only once. Uncertainty becomes failed/manual attention, persists across service restarts in executed tests, and concurrent scans can requeue/adopt a late-listed meeting. Cancellation does not declare an unresolved create clean. But F-02 shows an ordinary empty-body admin retry authorizes another create, without an explicit verification step. |
| **RE-03: processed webhook terminality** | **PASS for completion semantics** | Independent service late-failure test returns duplicate afterward. PostgreSQL: A claims, B reclaims and succeeds, late A completion returns stale; subsequent begin returns duplicate. Eight concurrent begin calls yield one new claim and seven busy. Full suite covers reverse completion order, failures, both repositories and killed workers. Effects can still overlap after lease expiry and must remain idempotent. |
| **RE-04: historical owner cancellation** | **PASS within documented clock/baseline assumptions** | Create/sync/cancel with notifications absent, advance 40 days, enable the approved owner recipient, retry: no owner email kind. Full suite independently executes genuine post-activation cancellation/reschedule and repeat-retry cases. Concurrent SQL activation calls all return one durable baseline, unchanged by migration reapplication. |
| **RE-05: owner recipient restriction** | **PASS for reviewed entry points** | Wrong resolver configuration and wrong service recipient throw. Executed provider tests also reject owner messages to other/list recipients outside test mode; guest address remains Reply-To. Approved destination is `martindubreuil13@gmail.com`; configuration cannot redirect it. No real emails sent. |

RE-04 uses application timestamps, not an independently synchronized distributed clock. Transitions exactly equal to the baseline are eligible (`>=`); clock skew/boundary behavior remains documented. Tests substantiate ordinary historical suppression and concurrency, not a universal ordering guarantee across arbitrarily skewed servers.

## 4. New findings

### F-01 — P1: cleanup deletes the current meeting after recovery adopts it

**Locations:** `app/lib/scheduling/sync.ts:470-488` (`scanZoom`), `:168-183` (`reconcile`).

Independently reproduced this interleaving:

1. Booking is synchronized to meeting A; another marked meeting B exists. This requires an existing duplicate, such as one left by an ambiguous/manual retry.
2. Cleanup reads A as the recorded winner and selects B as surplus. Pause it before deleting B.
3. A is removed externally. Two normal synchronization passes observe A missing, then find/adopt B. The reference points to B and sync is `ok`.
4. Release cleanup: it deletes B using its earlier decision. No meeting remains; the reference still points to B and sync stays `ok`.
5. A further Zoom scan and database reconciliation queue nothing. The scan only iterates meetings it sees; a now-empty list never validates the missing recorded ID. Database reconciliation sees current-looking references and assumes success.

This is a stale cleanup decision racing with recovery, not a claim that all concurrent scans create duplicates. The separate concurrent late-adoption test passes. The failed case can leave the customer/host with no functioning current meeting and no automatic repair, even with repeated maintenance. It invalidates a broad “up to date” guarantee.

**Required:** coordinate deletion/adoption through per-booking ownership or explicit deletion state, revalidate decisions, and make periodic validation inspect expected recorded meetings that are absent from a list. Rechecking once before a network write alone still leaves a check/write gap; include post-delete invalidation/reconciliation and crash recovery. Add this exact interleaving and a killed-cleanup variant to safe regression tests. Absence from a delayed list must trigger a direct known-ID read or uncertain state, not an automatic new create.

### F-02 — P1: normal Retry now bypasses durable create uncertainty

**Locations:** `service.ts:373-380`; `admin-actions.ts:28`; `app/components/admin/scheduling/BookingDrawer.tsx:77-82`.

Independent test: mocked Zoom commits a create but loses the response and returns no marker matches. The booking has durable uncertainty and one remote meeting. Invoke the actual admin dispatcher with POST `bookings/<id>/retry-sync` and **an empty body**. It returns 200, clears the intent and creates a second meeting. No elapsed-time wait, explicit absence verification, warning acknowledgment or reconciled meeting ID is required.

The service comment assumes that clicking Retry means the operator already checked. The drawer instead labels the uncertain failed state **“Not created: gave up. Fix the cause, then Retry now.”** and offers a one-click action. That is misleading: creation may have succeeded. The activity feed contains a marker/check instruction, which is useful but does not make the retry an explicit, verified recovery action.

**Required:** ordinary retry must preserve unresolved create intent. Provide a distinct authenticated reconciliation action, bound to the current intent/generation, with an explicit duplicate-risk warning and recorded operator decision. Prefer adoption of a verified host-owned meeting ID. Any exceptional authorization to create anew must be deliberate and auditable, not implied by a generic retry. Prevent retries from clearing an active worker's intent outside ownership control. Correct the admin wording to “creation outcome unknown,” with marker, attempt time and safe next actions. An empty list alone is not proof of absence.

This does not negate the successful automatic-creation fix; it fails the mission's separate manual-retry safety requirement.

### F-03 — P2: unknown Zoom fields count as successful verification

**Locations:** `sync.ts:76-77` (`zoomShows`), `adapters/zoom.ts:29-32` (`stateOf`).

The adapter maps missing/invalid start time or missing duration to null; the comparison treats null as matching. Independent test puts Zoom at 15:00 while the booking is 10:00, then returns null for both read-back fields: the pass reports `ok`. This is a simulated incomplete provider response, not evidence that real Zoom currently omits these fields for this host.

**Required before relying on read-back for launch:** distinguish verified from unknown, validate required scheduled-meeting fields, and retry/flag incomplete responses. Missing data should not prove current appointment content. Include malformed and partially missing provider payloads in adapter/service tests.

## 5. Recovery, frequency and operational gaps

**Verified behavior:** first maintenance invocation scans Zoom; another at 299,999 ms does not; at 300,000 ms it scans again. Frequency is five minutes **when maintenance is called**. A scan that queues a booking occurs after `runDue`, so ordinary repair may require the next maintenance invocation. With a healthy minute trigger, the detection/repair bound is roughly the scan interval plus a tick and provider time, not instantaneous. Concurrent maintenance can independently decide a scan is due; no exclusive scanner ownership was found.

Uncertain creation is stored durably and escalates into `failed`, “Needs attention,” and a `zoom_review` activity containing the marker. This is better than silently declaring success. However, the five-minute review threshold is evaluated when a pass runs, not by a separate timer; backoff or a missing worker can delay escalation. Once failed, normal due-work selection stops; later visibility can cause the scan to requeue it. If the provider listing never reveals it, the operator must act.

**A runbook and monitoring are launch prerequisites.** Assign an operational owner, response time and backup. Alert for failed/uncertain bookings, approaching appointment without usable link, canceled bookings with unresolved resources, stale worker heartbeat, failed/overdue Zoom scans, page-cap exhaustion and undelivered owner/guest notices. A recently recorded heartbeat alone does not prove successful scans: errors can yield `ran:false` while maintenance still records a pulse. No outbound alerting was implemented or tested here.

Human investigation should use the configured Zoom host, exact booking marker, creation attempt timestamp and booking time; inspect all applicable pages and verify a candidate's host/ID/details before adoption. No current UI workflow independently establishes that a hidden meeting does not exist. The runbook must not instruct an operator to equate one empty search with verified absence. Past/ended uncertain meetings need separate investigation: the adapter scans only `upcoming`. More than 1,500 upcoming meetings fails closed and needs an escalation path.

A stale write can still land after the replacement's final read-back. If its worker dies before invalidating references, the database may temporarily say `ok` until a successful periodic scan. That exposure is inherent to the current eventual-repair design and affects Zoom's displayed time/reminders. It becomes an acceptable documented limitation only with working external validation, bounded recovery, alerts and explicit approval; F-01 currently prevents accepting that bound.

## 6. Database and migration verification

Fresh supported order independently applied:

1. `20261101090000_mba_scheduling.sql`
2. `20261102090000_mba_scheduling_phase2e.sql`
3. `20261103090000_mba_scheduling_phase2f.sql`

The disposable database supplied minimal pre-existing `consent_records(id)` and `set_updated_at()` dependencies. Following populated concurrency tests and owner/webhook state, Phase 2F was applied twice more. Digests of **every scheduling table's rows** stayed identical. Added columns/defaults and replacement functions do not by themselves erase existing booking records. This is not a rehearsal against a restored production schema or evidence that rerunning older migrations after newer ones is safe.

Independent results: ten same-key calls produce one booking; twelve overlapping calls produce one booking/eleven refusals; four disjoint requests with cap two produce two bookings/two refusals. Eight worker claims yield one owner; a replaced owner's finish is `lost`, renewal false. Eight webhook claims yield one new/seven busy; late completion after takeover cannot replace processed success. Eight different activation requests agree on one baseline.

All **13 tables** have RLS. Anon/authenticated have no checked table privileges or EXECUTE on any of the **13 operational RPCs**; those functions are invoker and grant service-role execution. The additional trigger-only function retains PUBLIC execution, as in the prior audits; no direct data-access escalation was demonstrated. Claude's statement that all `sched_*` functions are service-only needs that trigger exception.

Deploy migration replacements transactionally and verify permissions afterward. Phase 2F changes webhook RPC return/completion signatures; Phase 2E also changes worker signatures. Old application workers are not a safe compatibility/rollback assumption. Drain/coordinate workers and retain a schema-compatible operational release. No hosted migration was applied.

## 7. E-01 through E-07 classification

| Finding | Classification | Required mitigation / disposition |
|---|---|---|
| **E-01 email duplication** | **Launch blocker** | Still send-then-record; old accepted-record-loss/25-hour reproducer passes. Provider dedupe is finite; unique DB acceptance occurs after send. Persist/reconcile ambiguous delivery, stop blind retries beyond provider retention and require review when unresolved. Apply to owner and guest. This is a release gate; it does not imply a new P1 security exploit. |
| **E-02 contained calendar conflicts** | **Acceptable with documented mitigation** | Original reproducer still passes. A foreign event contained within an own event is invisible in merged free/busy. Explicitly approve/disclose this limitation and an owner review/resolution process; do not promise comprehensive detection. If that promise is required, event-level identity inspection becomes a launch gate. |
| **E-03 admin Origin/JSON** | **Acceptable with documented mitigation** | Authenticated mocked wrapper still accepts foreign-origin text/plain JSON. Existing admin authentication/cookie protections limit the demonstrated scope; no actual browser cookie bypass was proven. Retain restrictive cookie policy and controlled admin access; prefer adding same-origin/fetch-metadata/JSON checks before release. |
| **E-04 public abuse** | **Launch blocker (P1 for unrestricted intake)** | Fail-open per-IP control, unbounded body parsing, no independent recipient/global capacity budget or ownership/bot control remain. Bound bodies and resource/email budgets; define outage behavior and proportionate abuse controls before public booking opens. No Vercel forwarding-header spoof exploit is claimed. |
| **E-05 scan fairness** | **Acceptable with documented mitigation at enforced low volume** | Reconcile/conflict paths still select the first 200. Require enforced volume thresholds and monitoring, or implement fair paging before exceeding them. The new host-wide Zoom scan does not fix those two prefixes; its separate page cap must also be monitored. |
| **E-06 health labels** | **Launch blocker for readiness sign-off** | Presence/configuration labels cannot replace read-only production preflight and successful recovery-scan observation. Distinguish configured/authenticated/operational. Add independent alerting; API deadlines alone do not establish health. |
| **E-07 no-database collection** | **Post-launch improvement (P3)** | Null `.url` collection failure independently reproduced. Guard client construction. Keep CI's isolated-database setup explicit until corrected. |

These are classification decisions for release scope, not claims that Phase 2F was intended to fix E-01 through E-07. Conditional mitigations require an actual documented owner/limit/policy; they are not blanket waivers.

## 8. Release isolation and production prerequisites

Read-only Vercel verification: production `modernbusinessarchitect.com` remains READY deployment `dpl_EgbDJyDwJdofN3shCZTQ6yckehJG`, Git **`2e0f68b97a2723a3bbee6445e4ea8c67b6e66302`**, the Publications restoration. Remote main matches; no remote scheduling branch was returned. Local main/cached origin references remain stale; Scheduling code and its migrations remain untracked in the dirty local branch.

Compared current source against production Git objects: **42 non-documentation Publications paths and 67 Transition/Calendly-named paths match exactly**. These bounded path comparisons preserve strong isolation evidence, not a full public-site functional test. Shared files still require selective review: email client/policy, AdminShell, navigation/home, SEO/sitemap, package/Next configuration and environment documentation. Phase 2F also changes TypeScript exclusions/workspace behavior. Do not deploy this old dirty branch wholesale.

Read-only hosted Supabase: **zero Scheduling tables, three published books, pg_cron absent, pg_net absent**. Public Scheduling still hard-disables on Vercel; production recovery is not configured. Future release must start from verified production main, selectively apply Scheduling plus necessary reviewed shared-file changes, and preserve Publications data/migration and Transition/Calendly wiring.

Before production preparation can be signed off:

1. Correct F-01/F-02 and validate incomplete-provider handling F-03. Run the exact independent interleavings, including worker/scan death and cancellation; convert unsafe assertions to safe regression expectations.
2. Close E-01/E-04 gates; assign actual limits/policies for E-02/E-03/E-05; implement operational preflight/monitoring/runbook for E-06 and uncertainty recovery.
3. Prepare separate public-intake and operational gates. Rehearse all three migrations on a production-schema copy and review schema-compatible rollout/rollback; preserve worker/admin/webhooks while intake is frozen and cleanup drains.
4. Configure production OAuth/client/publishing status, Zoom host access, Resend sender/reply-to and signed webhook, minute recovery, scoped recovery authentication, worker time budgets and alerts under separate authorization. Reuse the earlier audits' Google Testing-token and queued-header security checks rather than assuming local credentials are production-ready.
5. Observe actual minute recovery and successful external-validation scans with intake off. Only after review and separate authorization perform a controlled live lifecycle/email test. This audit did not authorize or perform one.

**Next-phase recommendation:** targeted local recovery-safety corrections, then independent re-verification. Do not proceed to customer bookings or deployment approval on the strength of the passing ordinary suite.
