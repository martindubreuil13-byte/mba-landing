# MBA Scheduling, Phase 2F: targeted remediation of the independent Phase 2E re-audit

Date: 2026-10-31. Local only, uncommitted, on `feat/mba-scheduling`. Answers `PHASE2E-INDEPENDENT-REAUDIT.md` (RE-01 .. RE-05). No features were added, no interface redesigned. No real Google, Zoom or Resend activity, no production change, no commit/push/deploy, no new service. Publications and Transition are untouched.

Where this document disagrees with `PHASE2E-REMEDIATION.md`, this one is current.

## 1. Root cause and fix for each finding

### RE-01 (P1): a stale Zoom update leaves Zoom at the wrong time while the database says "ok"

**Root cause.** The fence stops a replaced worker from *recording* anything, but a request already in flight still changes Zoom afterwards. Google had a compensation for this (mark the references stale after a lost write); the two Zoom writes (update, and adoption of a found meeting) did not, and nothing ever compared Zoom's actual content with the booking. `reconcile()` reads only database state and the duplicate scan only counted meetings, so one meeting at the wrong time looked healthy.

**Fix.** No lock or token can stop an in-flight request, so the design is *detect and repair*, in three layers:
1. **Read-back before success** (`verifyZoom`). Before a pass may report success it reads the meeting back from Zoom (new `ZoomProvider.getMeeting`) and compares start and length with the booking's *current* version. A mismatch is corrected once and re-read; if it still does not match, the pass fails and retries instead of reporting "ok". A meeting that no longer exists is reset and recreated (a known deletion, so creating is safe).
2. **Compensation on every lost write** (`putZoomWrite`). A replaced worker whose Zoom update or adoption completes after it lost ownership marks every recorded reference stale and queues the booking (`invalidateRefs`), exactly as Google already did. This runs for the update path and for the marker-adoption path.
3. **Periodic external validation that does not depend on any worker surviving** (`scanZoom`, now every 5 minutes). It lists the host's marked meetings, which already carry start time and length, and compares each *recorded* meeting with its booking. A difference marks the references stale and re-queues the booking so the next pass corrects Zoom. This covers a worker that died right after its write, which no compensation can.

### RE-02 (P1 blocker): absence after 180 seconds was treated as permission to create

**Root cause.** The first policy treated "the marker search found nothing for 180 seconds" as evidence the meeting did not exist, then created again. Zoom's list is not documented as immediately consistent, so elapsed time proves nothing. Cancellation used the same assumption and recorded Zoom `deleted` while a hidden meeting could exist.

**Fix: durable uncertain-outcome handling; elapsed time never resolves it.**
- The intent to create is recorded before the call (unchanged). If the outcome is unknown (timeout, lost answer, 5xx, unusable success, or a crash that left the intent), **automatic creation stops for that booking, permanently**. There is no timeout after which it creates.
- Recovery keeps *looking* by marker for 5 minutes (`ZOOM_REVIEW_AFTER_SECONDS`, which is only a deadline for **asking a person**, never evidence). If the meeting shows up, in a pass or later through the scan, it is **adopted**. Otherwise the booking goes to a manual-reconciliation state: Zoom reference `failed`, sync `failed`, an activity entry that names the marker to search for, and it appears in the admin "Needs attention" list.
- **Cancellation never declares the booking clean while a create is unresolved.** It goes to the same manual state ("Zoom may still hold a meeting for this canceled booking"). When the meeting is eventually listed, the scan re-queues the cancel pass, which deletes it. A cancellation with no earlier create at all is cleaned normally.
- Only **Retry sync** (a person who looked in Zoom) clears the intent and allows another create. If they were wrong and a duplicate appears later, the duplicate scan removes the surplus.
- The scan now also hands a **late-listed meeting** back to a normal pass (confirmed booking: adopt; canceled booking: delete). The old two-strike counter is gone: one unknown outcome is enough to stop.
- Multi-page behaviour: the adapter returns every duplicate on every page and fails closed (throws) rather than guess when the host has more than 1,500 upcoming meetings.

### RE-03 (P2): a stale webhook worker's completion reopened a processed delivery

**Root cause.** `finishWebhook` was unconditional: no claim identity, no terminal-state guard.

**Fix.** Every claim returns a fresh **token**. Completion is accepted only for the current token and only while the delivery is `processing`; success is terminal. A replaced worker's late failure *or* late success returns `stale` and changes nothing. A failed delivery by the *current* owner is still retryable; a crashed one is reclaimed after the lease. Same behaviour in the document repository and in PostgreSQL (`sched_webhook_begin` / `sched_webhook_finish`, migration `20261103090000`).

### RE-04 (P2): a retry announced an old cancellation to the owner

**Root cause.** Eligibility was derived from the booking's *current status* (`canceled` and no `owner_canceled` row), so any re-sync of any old canceled booking looked like a missing notice.

**Fix.** Owner notices follow genuine **transitions**, judged against a durable baseline. The first time owner notifications are used, the moment is recorded once (`sched_settings.owner_notify_since`, via `activateOwnerNotifications`) and never moves. The service records it *before* it records any transition, so every transition made while the feature is on is later than it. Eligibility then uses the transition's own recorded time:
- cancellation: the booking's `canceled` event must be at or after the baseline;
- new booking: the booking must have been created at or after it (a booking made before is never announced as new);
- reschedule: announced only if a reschedule happened after the baseline, against the version that was current at the baseline.

No fake "delivered" rows are written for history. A legitimate cancellation (or one of an older booking, canceled after the switch-on) is still announced exactly once, and an administrator's retry afterwards adds nothing. Guest and owner records, retries and backoff remain separate.

### RE-05 (P2): the owner recipient was configurable

**Fix.** The approved address is the only possible owner recipient and is written in one file. The `SCHEDULING_OWNER_EMAIL` override is gone: a deployment that sets it to a *different* address **refuses to start** (loud, not silently redirected and not silently simulated); the same address or none is fine. Three independent refusals back it up: the service constructor, the sync engine's owner step, and the Resend provider (an `owner_*` message to anything else is rejected, even outside test mode). A guest's address can only become the Reply-To. Changing the address is a reviewed code change to `owner-address.ts` and the tests that pin it.

## 2. Original reproducer results, before and after

Codex's `audit/phase2e/independent-reaudit.test.ts` (unchanged evidence; it asserts the *unsafe* outcome) was run before any change and after. Run on demand with `AUDIT_REPRODUCERS=1 npx vitest run --project audit-original`.

| Re-audit reproducer | Before | After (assertion that held the defect now fails) |
|---|---|---|
| RE-01 stale Zoom update wins | passes, defect present (Zoom 11:00, reference `v3`, sync ok, nothing queued) | fails at `expected null to be 'v3'`: Zoom is still momentarily 11:00 (an in-flight write cannot be prevented) but the reference is stale, the booking is queued, and the next pass restores 12:00 |
| RE-02 listing lag creates a second meeting | passes, defect present (2 meetings) | fails `expected 1 to be 2`: one meeting |
| RE-02 cancellation reports clean | passes, defect present (`deleted` with a live meeting) | fails `expected 'failed' to be 'deleted'`: not clean; surfaced |
| RE-03 late failure reopens a processed delivery | passes, defect present (effect ran 3 times) | fails `expected 'duplicate' to be 'processed'`: terminal |
| RE-04 retry sends a historical cancellation | passes, defect present (1 `owner_canceled`) | fails: owner notice for an old booking is not produced (the harness also tries an unapproved address, which is now refused) |
| RE-05 owner address configurable | passes, defect present | fails: the configuration is refused with an explicit error |

The first-audit file (eight reproducers) behaves as after Phase 2E: the four P1 ones and the Resend one fail (defect gone); the three P2 ones (E-01 email, E-02 contained conflict, E-03 admin text/plain) still pass because they are out of scope here.

## 3. New adversarial regression tests

`app/lib/scheduling/phase2f.test.ts` (34 tests), plus changes to `kill.test.ts`, `contract.test.ts` (both repositories), `remediation.test.ts` and `admin-views.test.ts`.

- **RE-01:** the re-audit's exact scenario (stall in `updateMeeting`, lease expiry, reschedule, replacement completes, stale update lands); stale write landing *before* the worker finishes (read-back repairs it); uncorrectable Zoom (never reports success); meeting deleted in Zoom (recreated); stale adoption by marker search; late update after a cancel (nothing resurrected); stale content found by the scan with no surviving worker; wrong length; unknown meetings never touched; **real SIGKILL right after a Zoom update was applied** while the booking moved on twice.
- **RE-02:** the re-audit's exact scenario then 1 hour, 1 day: still one create; cancel not clean; durable across a restart; only Retry sync allows another create (and the list is checked first); a definite refusal leaves no uncertainty; adoption after the deadline; multi-page duplicates; fail-closed past the page cap; **real SIGKILL after a create while Zoom does not list it, swept for 200 simulated hours: one create, one meeting, adopted when listed**.
- **RE-03:** the exact stale-failure scenario; the reverse order (late success); eight simultaneous deliveries; failure then retry; crash then lease expiry; on **both repositories** (including real PostgreSQL), and two real-kill webhook tests.
- **RE-04:** the exact scenario; old confirmed booking; legitimate cancellation announced once and not repeated by retries; booking made before and canceled after the switch-on; reschedule after the switch-on with previous time; baseline shared by another process; guest delivery unaffected; baseline recorded once under concurrency (both repositories).
- **RE-05:** resolver, startup refusal, service refusal, provider refusal (including a list of recipients), guest address only as Reply-To, and a structural test that the variable is read in one file and the address is written in one file.

**Mutation checks.** Each fix was reverted in turn and the matching tests failed: lost Zoom write not requesting re-verification (2 tests fail); no read-back (3); scan not comparing content (2); creation allowed after the deadline (6); cancel declaring clean (2); scan not handing back a late-listed meeting (3); webhook completion unfenced (1); owner baseline ignored for cancellations (1) and for new bookings (3); owner address configurable (1); service accepting any address (1). The working tree was restored and re-verified identical after each batch.

## 4. Remaining risks that cannot be eliminated

- **A stale Zoom write is detected and repaired, not prevented.** Between the moment it lands and the repair, Zoom's own record of the meeting time is wrong. The repair is immediate if the stale worker is still alive (it requests re-verification), otherwise it waits for the scan (every 5 minutes **when the recovery cron runs; the production cron is not configured**) plus one pass. The join link, the guest's email and the Google event were already correct; the exposure is Zoom's displayed time and reminders. If the worker died *and* nothing runs the scan, the error persists.
- **Uncertain creates cost availability.** A timeout or crash during a Zoom create now leaves the booking without a Zoom link until the meeting is listed or a person acts. That is the intended trade (no duplicate, no false "clean"), but it needs an operational owner: the admin "Needs attention" list shows it; alerting is not built. "Retry sync" relies on a person checking Zoom correctly; a wrong "none exists" yields a duplicate that the scan later removes.
- The Zoom list is an assumption-bearing API: a host with more than 1,500 upcoming meetings makes the search and the scan fail closed (booking sync stalls rather than guesses). Only `upcoming` meetings are listed.
- **Webhook effects must stay idempotent.** A claim older than 120 s may be taken over while the first worker is still running; the fence stops it completing, not its effect.
- **Owner baseline is per database, by recorded timestamps.** A server with a clock far behind could stamp a transition just before the baseline and have its notice suppressed (fails safe: no notice, never a historical flood). Email remains send-then-record (audit E-01, unchanged).
- Not changed and still open from earlier audits: E-01 .. E-07 (E-04 public abuse was promoted by the re-audit to a launch blocker for unrestricted intake), release gates 1-8, the community P2 follow-ups, the Google production OAuth state, `pg_cron`/`pg_net` setup. The third migration is local only; applying all three in order on a fresh database is the supported path; re-running an earlier migration after a later one is not.

## 5. Final verification

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors. `docs/mba-scheduling/audit` is now excluded from the project type-check (the re-audit evidence imports a constant this phase deliberately removed; it is also excluded from the normal test run) |
| Full vitest run, two consecutive runs | **1147 passed**, 18 skipped (pre-existing), 0 failed, both runs (1108 before this phase) |
| Local PostgreSQL | all contract tests against `SupabaseRepository` and `DocumentRepository`, background, and 8 real-SIGKILL tests: 115 passed |
| Database permissions | all 13 `sched_*` functions executable by `service_role` only, all invoker; the three new ones checked explicitly |
| Migration | `20261103090000_mba_scheduling_phase2f.sql` applied twice locally without error |
| `next build` | succeeds |
| ESLint | no issue in any scheduling source, component or route. Whole project: 60 problems (2 errors) versus the 42 baseline; **all 18 extra are in Codex's two audit evidence files** (`audit/independent-audit.test.ts`, `audit/phase2e/independent-reaudit.test.ts`), which were left untouched |
| Browser | not re-run: no UI or route-visible behaviour changed in this phase (the Phase 2E browser results stand) |
| Local state | owner-notification baseline in the local database is null again (a contract test had left it set; it now restores it); no cron job; no webhook rows; Google connection row intact; no dev server left running |

## Files

New: `supabase/migrations/20261103090000_mba_scheduling_phase2f.sql`, `app/lib/scheduling/phase2f.test.ts`, this document.
Changed: `sync.ts`, `service.ts`, `owner-address.ts`, `repository.ts`, `document-repository.ts`, `adapters/supabase-repository.ts`, `adapters/zoom.ts`, `adapters/resend-email.ts`, `providers.ts`, `types.ts`, `testing/{file-mocks,kill-child}.ts`; tests `kill, contract, remediation`; `vitest.workspace.ts`, `tsconfig.json` (audit folder excluded), `.env.example`, `PHASE2E-REMEDIATION.md` (pointer). Publications, Transition and every other shared file are unchanged.

## 6. Ready for independent Codex verification?

Yes, for the five findings: each has the re-audit's own scenario reproduced before and fixed after, adversarial variants, a mutation check, and (for RE-01, RE-02, RE-03) real process-kill tests. Please verify in particular: (a) that a stale Zoom write landing after a replacement completed is always either corrected in the same pass or queued, and that the scan covers the dead-worker case; (b) that no path creates a Zoom meeting while a create is unresolved except Retry sync; (c) the webhook token fence in PostgreSQL under concurrency; (d) that the owner baseline cannot be advanced or bypassed by a retry, a restart or a second process.

This is not a statement that the system is ready for customers: the remaining launch blockers in section 4 and in the earlier audits still stand.
