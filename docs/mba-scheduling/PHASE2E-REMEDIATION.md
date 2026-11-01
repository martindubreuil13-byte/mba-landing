# MBA Scheduling, Phase 2E: P1 remediation and approved customer-experience features

Date: 2026-10-31. Local only, uncommitted, on `feat/mba-scheduling`. Answers `PHASE2D-INDEPENDENT-AUDIT.md`. Nothing in this phase touched a real Google Calendar, Zoom account or Resend delivery, a production database, Publications or the Transition/Calendly flow.

**Superseded in part by `PHASE2F-REMEDIATION.md`** (the 180-second Zoom wait, webhook completion, owner-notice eligibility and the configurable owner address were all changed after the independent re-audit).

Where this document disagrees with `PHASE2B-BACKGROUND-EXECUTION.md` or `PHASE2C-READINESS.md`, this one is current. In particular: the sync "lock" is now a fenced claim, the webhook "replay ledger" is now an inbox, Zoom creation is no longer retried inside the adapter, and the community invitation records real (but unconnected) consent evidence rather than a simulation.

## A. Audit remediation

| | Root cause | Fix | Where |
|---|---|---|---|
| **P1-1** preview reaches live integrations | `/api/scheduling-preview` and the preview pages called `getScheduling()`, the same singleton the authenticated admin uses. A loopback `Host` was the only gate. | The preview has its **own service** built from fixed parts: a JSON file of its own (`.prototype-data/scheduling-preview.json`), the mock Google, the mock Zoom and the simulated email. It never reads `SCHEDULING_*` switches and imports no live adapter, Supabase client, `instance.ts` or admin session (a test enforces this over the whole preview namespace). In addition a state-changing preview request must be same-origin (`Origin` must equal `Host`, `Sec-Fetch-Site` not cross-site) and JSON. | `preview-instance.ts` (new), `preview-route.ts`, `preview-page.ts`, `app/api/scheduling-preview/[...path]/route.ts` |
| **P1-2** duplicate Zoom meetings after a lost answer | The generic HTTP loop retried a `POST /meetings` after a network error or 5xx. | A create is classified: only a rejection that proves nothing was created (401 with a fresh token, 429) is retried. A network error, timeout (every request now has a 15 s deadline), 5xx or an unusable success raises `ZoomAmbiguousError` and is **never** retried. The sync engine records the **intent to create before calling Zoom** (`create_intent_at`), then reconciles: look for the meeting by its marker (all matches, every page); wait out Zoom's listing delay (180 s) before trusting "none found"; after a second unknown outcome, **stop creating and ask a person** ("Retry sync" clears it). Cancel removes **every** meeting with the marker. | `adapters/zoom.ts`, `providers.ts`, `sync.ts` (`zoomStep`) |
| **P1-3** expiring lease, no owner | A claim was a timestamp. A replaced worker could complete, release the newer worker's lease and write references. | Every claim returns a **random fencing token**. Before each external call the worker renews its lease with it; every reference write and the final outcome are made **by the database, in the same transaction as the ownership check**; a replaced worker gets `lost` and changes nothing. If it had already finished an external call: a surplus Zoom meeting is deleted when the database proves it surplus, a Google event for a canceled booking is deleted again, and otherwise every recorded reference is marked stale and the booking re-queued (`invalidateRefs`). A rate-limited **duplicate scan** (`scanZoom`, every 15 min with the sweep) removes any surplus marked meeting of a booking *we know* and never touches a meeting whose booking this database does not know (another environment may share the host). | migration `20261102090000`, `sync.ts`, both repositories |
| **P1-4** webhook retry loss | The replay ledger recorded the delivery *before* the effect ran. | An **inbox**: a verified delivery is claimed (`processing`, 120 s lease), then marked `processed` or `failed`. A failed or abandoned delivery is claimable again by the provider's retry; only a processed one is a replay; a concurrent holder gets 503. Signature and timestamp checks are unchanged and run first. Zoom's key is the hash of the body (a retry carries a new timestamp/signature). The Google route uses the same inbox. | `repository.ts`, both repositories, `service.handleWebhook`, three webhook routes |

### Independent reproducer results

Codex's `docs/mba-scheduling/audit/independent-audit.test.ts` (unchanged) was run before and after:

| Codex reproducer | Before (2026-10-31, at Phase 2D) | After |
|---|---|---|
| P1 preview invokes the live-configured service | passes = defect present (200, `cancelBooking` called) | **fails = defect gone** (403; handler not called) |
| P1 Zoom retries an ambiguous create | defect present (2 creates) | defect gone (1 create, `ZoomAmbiguousError`) |
| P1 expired lease, duplicate Zoom, orphan after cancel | defect present (2 meetings; 1 orphan) | defect gone (1 meeting; 0 after cancel) |
| P1 Zoom webhook retry lost | defect present (retry = duplicate, effect ran once) | defect gone (retry runs the effect; 3rd delivery = duplicate) |
| P2 Resend webhook retry lost (same root cause as P1-4) | defect present | defect gone |
| P2 email send-before-persist, contained conflict, admin text/plain | defect present | **still present, not in scope** |

These assert the *unsafe* behaviour, so they now fail on purpose. They are excluded from the normal run and kept as evidence: `AUDIT_REPRODUCERS=1 npx vitest run --project audit-original`. The same scenarios asserting the **safe** outcome, plus adversarial variants, are in `app/lib/scheduling/remediation.test.ts` (48 tests).

Mutation check of the new suite: removing each fix in turn (unfenced reference writes; no ownership check; blind create retry; webhook claimed forever; no settle wait) makes the matching tests fail. This exposed one gap (the window between the ownership check and the write), now covered by a "stale view" test.

An end-to-end check of P1-1 on a real running server: every live switch on (dummy credentials, so nothing real was reachable), the real local database holding a probe booking. Preview cancel/reschedule/resend/retry were answered from the preview's own data (404 "not found"), `reset` reset only the preview file, the probe booking was unchanged, the real admin API answered 401 without a session, and the log shows no provider traffic.

### Remaining risks (stated, not solved)

- **Zoom cannot be made exactly-once.** It has no idempotency key and its meeting list is not documented as immediately consistent. The design makes a duplicate unlikely (intent record, marker search, 180 s settle window, two-strike stop) and self-healing (duplicate scan, every 15 minutes). A duplicate meeting can still exist for up to that interval. It cannot create an unbounded number. A host with more than 1,500 upcoming meetings makes the search throw ("too many"), which safely stalls syncing rather than guessing.
- **A zombie's external write cannot be prevented, only detected and repaired.** A replaced worker can still land one Google/Zoom write; the database refuses to record it, and compensation or the next sweep repairs it (typically within a minute, not instantly).
- **Email sending is still send-then-record** (audit E-01, P2, unchanged). Provider idempotency (24 h) plus the unique accepted row bound it; a crash plus a delay beyond 24 h can still double-send.
- Webhook effects must stay idempotent (they are). A `processing` claim that outlives its lease is retried, so an effect that is slow *and* non-idempotent would run twice.
- Audit P2s E-02 .. E-07 and release gates 1-8 are untouched (see section C).

## B. Approved features

### Community opt-in modal

- **Appears** only for a **confirmed** booking whose **Zoom details are ready** and for which **no answer has been recorded** (`communityPromptDue`). During "preparing"/"delayed" nothing shows and nothing is recorded. The server enforces the same rule (409 for a canceled booking or before the link exists).
- **Choices:** "Yes, count me in", "No, thanks" (equal weight, nothing pre-selected, focus starts on decline), a visible "Not now", the X, Escape and a click outside. Yes and No are answers; Not now/X/Escape/outside record `dismissed`, which is **not consent**. The booking is identical whatever is chosen.
- **Stored** (`sched_community_consents`, one row per booking, written once by the database function): choice, the exact wording and its version, the guest's address, the timestamp and the **source** (`booking_confirmation`; new column). Later requests change nothing, so there is no repeat prompt after a decision. An opened-but-unanswered invitation (`shown`) may be offered again; an answered or dismissed one never.
- **Copy** no longer claims anything about subscribing: "Thank you. We've noted your yes. Your booking is not affected."
- **No mailing-list provider is connected, and nobody is subscribed.** This is consent *evidence only*. Before any marketing email, "Yes" must be connected to the site's lead/consent system (which uses confirmed opt-in) with approval. The wording says "Unsubscribe anytime"; that must be true when emails exist.
- The existing visual design is kept (same palette, type, motion, reduced-motion handling, focus trap).

### Owner notifications

- Three **separate** messages to `martindubreuil13@gmail.com` (`owner-address.ts`; override `SCHEDULING_OWNER_EMAIL`; the only place the address is written for booking mail): new booking, reschedule, cancellation. Separate template (`composeOwnerEmail`) in the *internal* email frame ("MBA Scheduling": no guest signature, no "you booked" footer, no unsubscribe). Reply-To is the guest.
- **Content:** guest, email, meeting, time in the host's zone and the guest's, Zoom link (with an "Open Zoom meeting" button for https links), the guest's message, a link to the bookings screen. **Reschedule shows both the previous and the new time** (the previous time is the one the owner was last told, from the booking history; two quick reschedules produce one message). **Cancellation** shows the appointment that was canceled and by whom. Each is composed from one booking, so it cannot mention another guest; guest text is HTML-escaped and cannot add header lines to a subject.
- **When:** the first message waits for the Zoom link, and goes without it ("Link pending") once Zoom has failed twice. Nothing else delays it.
- **Independent tracking and retry:** its own `owner_*` kinds in `sched_email_attempts` (unique per booking, kind and version), its own provider idempotency key, its own backoff (1 m, 5 m, 30 m, 2 h), at most 5 attempts, then one activity entry. A failing owner message never marks the booking unhealthy or "delayed"; a failing guest message never blocks the owner's.
- **No duplicates:** repeated passes, a sweep and eight concurrent workers produce one message per kind and version (tested).
- **Safeguards unchanged:** same provider, same policy. Outside production the only real delivery is the development test mode to the single hard-coded test address; every other recipient is simulated; outside test mode the standard policy blocks the owner address and the failure is recorded. **Google guest invitations stay off** (asserted in tests).

### Test evidence

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| Full vitest run, two consecutive runs | **1108 passed**, 18 skipped (pre-existing), 0 failed, both runs. Baseline was 1051; net +57 (mainly `remediation.test.ts` with 48 tests, plus fencing/inbox/intent contract tests that run against both repositories, 2 real-SIGKILL webhook tests, 2 owner dry-runs through the real policy, 1 admin-status test; a few older tests were rewritten for the new contracts) |
| Local PostgreSQL | contract suite run against `SupabaseRepository` and `DocumentRepository`; 6 real-SIGKILL recovery tests; all pass |
| Database permissions | 12 `sched_*` functions executable by `service_role` only (anon/authenticated denied), all invoker, RLS on 13/13 tables |
| `next build` | succeeds |
| ESLint | no issue in any scheduling code. Project total is 43 problems vs the 42 baseline; the extra error and warning are in Codex's own `audit/independent-audit.test.ts` |
| Browser (Chromium and WebKit) | 19/19 each: no invitation while Zoom is failing; opens when the link is ready; nothing pre-selected; yes/no/not now/Escape recorded correctly; no re-prompt after reload; owner notice in the simulated outbox without the guest's private link; phone width fits |
| Browser, preview | works without sign-in on its own data; real data file byte-identical; cross-origin, cross-site and non-JSON requests refused |

## Files

New: `supabase/migrations/20261102090000_mba_scheduling_phase2e.sql`, `app/lib/scheduling/{preview-instance,owner-address,remediation.test}.ts`, this document.
Changed (scheduling only): `types, repository, document-repository, adapters/supabase-repository, providers, adapters/zoom, adapters/google-calendar (request deadline), adapters/resend-email, sync, service, notifications, community, constants, admin-views, integrations, preview-route, preview-page, testing/{file-mocks,kill-child}`; routes `webhooks/scheduling/{zoom,resend,google}`, `scheduling-preview/[...path]`; `CommunityModal.tsx`, `ConfirmationView.tsx`; tests `contract, kill, background, adapters, service, preview, email-test-mode, admin-views`; `vitest.workspace.ts`; `.env.example` (`SCHEDULING_OWNER_EMAIL`).
No change to Publications, Transition, the consent library, or any other shared file (the tracked-file list equals the one before this phase).

## Migration

`20261102090000_mba_scheduling_phase2e.sql`, **applied to the local database only**, re-runnable. Apply after `20261101090000`. Adds `sched_bookings.sync_claim`, `sched_external_refs.{create_intent_at, create_unknown}`, `sched_community_consents.source`, the webhook inbox columns, owner email kinds; **drops and recreates** `sched_claim_sync` and `sched_finish_sync` (new signatures), drops `sched_seen_webhook`, adds `sched_renew_sync`, `sched_upsert_ref_fenced`, `sched_invalidate_refs`, `sched_webhook_begin`, `sched_webhook_finish`, and replaces `sched_set_community`. No table or data is removed. Neither migration is in production; applying both in order on a fresh database is the supported path.

## C. Remaining launch blockers

Unchanged by this phase, still from the audit: P2 E-01 (send-then-record email), E-02 (contained calendar conflicts invisible), E-03 (admin mutations accept cross-origin text/plain), E-04 (public abuse controls: fail-open limiter, no body-size limit, no recipient budget, no bot control), E-05 (fair paging of the 200-booking scans), E-06 (health labels), E-07 (suite does not skip cleanly without a database); and release gates 1-8 (production enablement flag separate from the Vercel hard-off, admin/OAuth/webhooks reachable while intake is off, a correct rollback runbook, production Google OAuth (not Testing), pg_cron/pg_net installation and observed minute recovery, a signed Resend delivery webhook, a release built on remote main `2e0f68b`, an approved production lifecycle test).

New from this phase: connect community consent to the site's confirmed opt-in (approval needed); decide whether owner notifications should also cover bookings that existed before they were switched on (a manual "Retry sync" on an old canceled booking would send its cancellation notice); Zoom duplicate scan assumes the Zoom host's meeting list is complete under 1,500 upcoming meetings.
