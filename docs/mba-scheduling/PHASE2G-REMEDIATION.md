# MBA Scheduling, Phase 2G: Zoom resource ownership and reconciliation corrections

Date: 2026-10-31. Local only, uncommitted, on `feat/mba-scheduling`. Answers `PHASE2F-INDEPENDENT-VERIFICATION.md` (F-01, F-02, F-03; these close the remaining parts of RE-01 and RE-02). Nothing else in scheduling was changed. No real Google, Zoom or Resend activity, no production change, no commit/push/deploy, no new customer-facing feature. Publications and Transition are untouched.

Where this document disagrees with `PHASE2F-REMEDIATION.md`, this one is current.

## 1. Root causes

**F-01 (P1): a stale cleanup deleted a meeting that recovery had just adopted.** Deletion was a bare "ask Zoom to delete this id", decided from a read that could be arbitrarily old. Nothing in the database said "this meeting is now the booking's", so a cleanup that picked a duplicate as surplus could still delete it after recovery had adopted it. Two further gaps made the result invisible: the periodic scan only looked at meetings it saw in a list (an empty list never questioned a recorded meeting that was missing), and the sync's own completion check treated "no meeting found" in a list as normal.

**F-02 (P1): an ordinary Retry authorised another create.** `retrySync` carried the comment "if you clicked Retry, you looked", and cleared the unresolved-create marker. The drawer reinforced it ("Not created: gave up. Fix the cause, then Retry now"). Retrying a known failure and resolving an uncertain creation were the same button.

**F-03 (P2): missing Zoom fields counted as verification.** The read-back compared start time and length only when Zoom reported them; a null (missing or malformed field) compared equal. A response that said nothing therefore "verified" a meeting that was actually at the wrong time.

## 2. The unified rules for a Zoom meeting

One model for every operation. The authoritative meeting of a booking is the **recorded, synced** Zoom reference, and the database is the only place that decides ownership.

| Operation | Rule |
|---|---|
| **Create** | Only when no earlier create is unresolved. The intent is recorded before the call. A create with an unknown outcome makes the booking *uncertain*; automatic creation then stops (unchanged from Phase 2F). |
| **Adopt** | Only a meeting that carries the booking's marker and has **not been condemned**. It is recorded with the fenced write; the database refuses to record a condemned meeting (trigger), however the write arrives. |
| **Update** | Only the recorded meeting, by id. After a write, the pass reads it back and only a **verified match** completes it (section 3). |
| **Reconcile an uncertain outcome** | Never by waiting, never by an empty list. Automatic: the meeting turns up (pass or scan) and is adopted. Otherwise a person decides, through a separate action (below). |
| **Cancel** | Every meeting carrying the marker, the recorded one, and any pending deletion are removed with the delete rule below. A booking is never declared clean while a create is unresolved. |
| **Delete (any reason)** | **Only through `deleteSurplus`: condemn, then delete, then mark.** The database *condemns* the meeting first and refuses ("owned") if it is the authoritative meeting of a confirmed booking or belongs to another booking. Condemning and recording take the same row lock, so they cannot interleave: whichever is first wins, and the other is refused. A condemned meeting can never be recorded again. If the deleter dies after condemning, the tombstone stays `pending` and the next scan finishes it. |
| **Orphans** | The scan removes surplus only through the same rule, and never touches a meeting whose booking this database does not know. |

This is what "an outdated cleanup decision must never override a newer adoption" means in practice: the decision is **revalidated by the database at the moment of deleting**, atomically with the adoption.

## 3. The fixes

**F-01 / RE-01 and RE-02 end to end.**
- `sched_zoom_tombstones` plus `sched_zoom_condemn` / `sched_zoom_condemn_done` and a trigger on `sched_external_refs` (migration `20261104090000_mba_scheduling_phase2g.sql`, local only, re-runnable). Mirrored in the document repository.
- Every deletion in the sync engine (adoption extras, cancellation, replaced-worker cleanup, scan) goes through `deleteSurplus`. Condemned meetings are filtered out of every marker search.
- The scan now (1) finishes pending tombstones, (2) judges every *recorded* meeting against Zoom's evidence, and (3) reads **by id** every confirmed upcoming booking's recorded meeting that the list did not show. A list is never proof of absence: a meeting Zoom still returns is fine (list lag); one Zoom says is gone is queued for repair as a *known* deletion (the only case in which a new create is safe); a failed read concludes nothing.
- Codex's interleaving now ends with a real, verified meeting recorded for the booking. In the other order (adoption first) the paused cleanup is refused and stands down.

**F-02: two separate actions.**
- **Retry sync** (`retry-sync`) clears the give-up state of *known* failures and runs. If an earlier create is unresolved it only looks again (adopting the meeting if it is listed) and otherwise leaves the uncertainty untouched. It cannot create. It does not repeat the "needs a person" request.
- **Resolve uncertain creation** (`resolve-zoom`), a separate, deliberate admin action, bound to the attempt shown (`intentAt`; a newer attempt makes it refuse):
  - *Adopt*: the administrator found the meeting in Zoom and gives its number. It must exist for the configured host, must not carry another booking's marker, must not be condemned or attached to another booking. It becomes the booking's meeting and is then checked like any other.
  - *None exists*: the administrator searched Zoom, found none, and ticks an explicit acknowledgement of the duplicate risk. It is refused if the list shows a meeting for the booking now. The system does not infer absence; the decision is the administrator's, and it is recorded in the activity feed with the marker and the attempt time.
  - Both take the booking's lease first (they cannot race a running worker), write with the lease's token, and refuse a second concurrent resolution.
- **Admin wording.** For an uncertain creation the drawer no longer says "Not created: gave up". It says "Zoom creation outcome unknown: Zoom may already have created it", shows the attempt time and the exact marker to search for, labels the safe action "Check Zoom again", and shows the resolution panel (nothing pre-ticked; "Allow a new meeting" disabled until the acknowledgement).

**F-03: strict verification.** Zoom's answer is classified, never defaulted:
- **verified match**: the answer is about the expected meeting *and* start time *and* length are both reported *and* both equal the booking's. The only result that may complete a pass.
- **verified mismatch**: a reported field differs. The pass corrects it once and re-reads.
- **insufficient evidence**: wrong or empty identity, or a missing/malformed/non-positive field. Re-read once; if still insufficient the pass fails ("cannot be verified"), the references are marked stale, and the booking stays unsynchronised. No blind repair is sent.
- **API failure**: the call throws; the pass fails with the error.
The adapter turns missing or malformed fields into nulls (never defaults), and the scan applies the same rule, completing an incomplete list entry with a direct read.

## 4. Codex's original reproducers

`audit/phase2f/independent-verification.test.ts`, unchanged evidence (it asserts the unsafe outcome; run with `AUDIT_REPRODUCERS=1 npx vitest run --project audit-original`):

| Reproducer | Before | After |
|---|---|---|
| UNSAFE: ordinary manual retry creates a second meeting | passes: defect present (2 creates, 2 meetings) | fails `expected 1 to be 2`: one create, one meeting |
| UNSAFE: stale cleanup deletes the adopted meeting, sync ok | passes: defect present (no meeting, sync ok) | fails: the booking's recorded meeting is a *different, existing* one; the condemned duplicate is gone |
| UNSAFE: unknown read-back fields count as verified | passes: defect present (pass ok at 15:00) | fails `expected false to be true`: the pass is not ok |
| RE-01 .. RE-05 safeguards, scan cadence, dead-writer repair (7 tests) | pass | pass |

The earlier audit files behave as before (the Phase 2D/2E/2F defect assertions fail where fixed; E-01 email, E-02 contained conflicts and E-03 admin text/plain still reproduce and are out of scope).

## 5. New adversarial tests

`app/lib/scheduling/phase2g.test.ts` (37 tests), plus `contract.test.ts` (both repositories, including real PostgreSQL concurrency) and `kill.test.ts` (real SIGKILL).

- **Cleanup racing with adoption:** Codex's exact interleaving; the reverse order (decision before condemnation); the database refusing to condemn the authoritative meeting or to record a condemned one; another booking's meeting; a cleanup whose delete fails after condemning (never adopted meanwhile; finished by the next scan); 20 randomised condemn-versus-record races on PostgreSQL and the document store; the unfenced write path under the same rule.
- **Cancellation racing with adoption** (the stalled adopter cannot resurrect or record it) and **with a paused surplus cleanup**.
- **Multiple concurrent recovery workers:** six scans, two maintenance sweeps and two direct passes over three duplicates (the recorded meeting survives, every duplicate goes); five concurrent passes with the recorded meeting gone (exactly one replacement).
- **Delayed Zoom listing:** the recorded meeting hidden from the list but readable by id (no action, no create); gone by id (repair); unreachable (no conclusion).
- **Ordinary Retry and repeated manual retries:** Codex's exact empty-body request; five retries hours and days apart; a retry that adopts a listed meeting; a plain retry of a *known* failure still works.
- **Resolution workflow:** acknowledgement required; stale attempt refused; refused while the list shows a meeting; adoption refused for non-meeting numbers, unknown meetings, another booking's marker, a condemned meeting and a meeting attached to another booking; refused while a worker holds the lease; three simultaneous resolutions, one wins; a second uncertain create needs a new decision; resolving on a canceled booking.
- **What the administrator sees:** the row carries the uncertainty and the marker; the panel's wording, pre-ticked state and disabled button (rendered); the drawer source.
- **Missing or partial Zoom responses:** field-by-field classification (match, mismatch, insufficient); null fields; wrong identity; half-empty and malformed answers; re-read once; no blind repair; API failure; the scan's direct-read completion; the HTTP adapter with missing, malformed and non-positive fields, a body without an identity, another host, and 404.
- **Stale updates after rescheduling:** the Phase 2F scenario still ends at the latest time.
- **Worker termination during reconciliation (real PostgreSQL, real SIGKILL):** a cleanup killed after condemning and before Zoom deleted (the recorded meeting then vanishes: the condemned duplicate is not adopted, a replacement is created, the next scan finishes the deletion); the same kill with a healthy recorded meeting. The Phase 2F kill tests still pass.

**Mutation checks.** 19 protections were removed one at a time and the matching tests failed each time: deletion without condemning (3 tests fail); condemned meetings adoptable again (2); the document repository recording a condemned meeting (1); condemn ignoring ownership (3); the scan ignoring unlisted recorded meetings (1); a plain retry clearing the uncertainty (4); resolution ignoring the attempt (2); resolution without the lease (2); no acknowledgement (1); no fresh list check (1); no marker check (1); the old "gave up" wording (1); null fields counted as a match (5); identity unchecked (2); insufficient treated as ok (3); the scan treating insufficient as healthy (1); the adapter defaulting a missing length (3). Two **database-level** mutations were also checked (the trigger dropped; `sched_zoom_condemn` altered to ignore ownership): the PostgreSQL contract test failed both times. The tree was restored and verified identical after each batch.

## 6. Remaining limitations that cannot be eliminated

- **Zoom has no idempotency key and its meeting list is not documented as consistent.** The design never *relies* on the list: it reads by id where an id is known, adopts what it finds, and hands an unresolvable create to a person. A person's "none exists" is a deliberate risk, not a guarantee; a wrong answer creates a duplicate that the scan later removes.
- **A request already in flight cannot be recalled.** A stale update can still land after the last read-back. It is detected (compensation if its worker is alive; the 5-minute scan otherwise) and repaired, not prevented. Until then Zoom's displayed time and reminders may be wrong.
- **Condemned does not mean already gone.** A condemned meeting can exist in Zoom until a scan finishes the deletion; it is harmless (never adopted, never recorded).
- **A recreated meeting has a new join link.** If the authoritative meeting is lost and a replacement is created, guests who already received the old link are not automatically told (the confirmation e-mail is sent once per version; the existing "resend confirmation" action exists for this).
- **The administrator's decision cannot be verified by the system**, and the activity entry says "an administrator" because the admin action layer does not carry the signed-in identity.
- **Coverage limits:** Zoom is only listed for `upcoming` meetings (a past, uncertain meeting needs manual investigation) and fails closed above 1,500; the unlisted-recorded-meeting check covers the first 200 upcoming bookings (audit E-05); the scan runs every 5 minutes **only when the recovery cron runs, and the production cron is not configured**. Alerting for "needs a person", failed scans and approaching appointments without a link is not built: a runbook and monitoring remain launch prerequisites.
- **Webhook effects must stay idempotent** and the audit's E-01 (send-then-record e-mail), E-02, E-03, E-04 (public abuse), E-05, E-06 and the release gates are unchanged and still open.
- Four migrations now apply in order (`...1101`, `...1102`, `...1103`, `...1104`); old application code is not a safe rollback target on the migrated schema, and re-running an earlier migration after a later one is not supported.

## 7. Final verification

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| Full vitest run, two consecutive runs | **1188 passed**, 18 skipped (pre-existing), 0 failed (1147 before this phase); see the note on one earlier intermittent failure below |
| Local PostgreSQL project | 119 tests (contract on both repositories, background, 10 real-SIGKILL tests) |
| Database | all 15 operational `sched_*` functions are service-role only and invoker (the two new ones checked explicitly; the trigger-only functions keep PUBLIC execute as before); the new table has RLS and no browser-role privileges (14 of 14 tables); migration applied twice cleanly |
| `next build` | succeeds |
| ESLint | no issue in any scheduling source, component, route or test. Whole project: the 18 extra problems over the 42 baseline are all in Codex's audit evidence files, as before |
| Browser | not re-run; the only UI change is the admin drawer's wording and a new panel, which is covered by a rendered-markup test, not a browser run |
| Local state | owner baseline null; no tombstones; no cron job; no servers; Google connection intact |

**One intermittent failure, not explained.** During development one real-kill test (the cleanup killed after condemning) failed in a full run and once more in roughly 55 isolated runs: the child process ended by itself instead of being killed, and at that time the child's output was not captured, so the cause is **not proven**. A crash of the child (for example a dropped local connection under load) is the most likely explanation; "the scan found nothing to clean up" would be a real failure and would print a different line. The assertion now reports the child's output, and the harness restarts the child once if it crashed but never if the scan reports it finished. Since then: 44 further isolated runs, 15 consecutive runs of the whole local-PostgreSQL project (one of them under extra CPU load from a production build), and the two final full-suite runs all passed. Please treat it as an open, low-rate test-infrastructure flake until your own runs say otherwise; it is not known to affect product behaviour.

## 8. Ready for independent verification?

Yes, for F-01, F-02 and F-03, with the stated limits. Please verify in particular: (a) that no code path deletes a Zoom meeting without going through `deleteSurplus`, and that `sched_zoom_condemn` and the trigger are race-free under PostgreSQL concurrency; (b) that nothing except `resolveUncertainZoom` can clear an unresolved create (including `onExternalDeleted`, webhooks and the admin dispatcher); (c) that no pass can complete on anything other than a verified match, including the adoption and scan paths; (d) the drawer wording and the resolution panel as an operator would use them.

This is not a statement that the system is ready for customers: the open items in section 6 and in the earlier audits still stand.
