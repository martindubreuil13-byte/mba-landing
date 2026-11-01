# MBA Scheduling: Phase 2C (recovery automation, email safeguard, production readiness)

Branch `feat/mba-scheduling`, local only, uncommitted. Mocks and local Supabase only. **No real email was sent. No real Google event or Zoom meeting was created. Nothing was committed, pushed, deployed or applied to production.** Read with [PHASE2B-BACKGROUND-EXECUTION.md](./PHASE2B-BACKGROUND-EXECUTION.md).

## 1. Environment and integrations (as found today)

| Item | State |
|---|---|
| Local Supabase (Postgres 17.6, auth, REST) | healthy |
| Local admin sign-in | works (`node scripts/local-admin.mjs`, password in git-ignored `.env.local-admin`); Chromium and WebKit verified |
| Zoom (Server-to-Server) | **connected**: token issued, read-only host access verified on the live Integrations page |
| Google Calendar | **NOT connected: the stored authorization is gone.** See below. |
| Email | simulated |

**Google: what happened.** The singleton `sched_google_connection` row (the encrypted refresh token Codex authorized) was deleted. The cause was my own Phase 2A contract test, which ran `delete ... where id = true` on that table to test its constraints. Every full test run against the local database wiped the real row, and I ran the suite many times last session. The test is fixed (it now never deletes or alters an existing row; proven with a sentinel row), and the new tests that write the recovery pulse save and restore any real value. **Restoring it needs you:** open `/admin/scheduling/integrations`, press **Connect Google Calendar** and grant both permissions. That creates no calendar event. (Development consent is in "Testing" mode: the authorization expires after 7 days and will need renewing.)

## 2. Recovery: what was built and proven

Already in Phase 2B: booking saved atomically first; `after()` background sync; confirmation-page polling; locks; version guards against cancel and reschedule races; marker-based Zoom de-duplication; reconciliation; bounded retries. New in 2C:

| Requirement | Implementation |
|---|---|
| Independent recovery every minute | `pg_cron` → `pg_net` → `GET /api/cron/scheduling-sync` with a Bearer secret read from the Vault. `scripts/local-recovery-cron.mjs install | status | remove` (local, loopback only); production template `recovery-cron.sql` (not executed anywhere). |
| Recoverable after the process dies | A **real SIGKILL** test (`kill.test.ts`): a child process runs the real sync against local Postgres and is killed (a) right after Zoom created the meeting but before it was recorded, (b) right after the Google event was written but before it was recorded. The sweep, after the dead worker's lock expires, finishes the booking: same Zoom meeting found by its marker, same event reused, one email, no duplicates. |
| Concurrent workers | Two sweeps at once after a kill: one completes it, one finds it claimed or runs a no-op; still one meeting, one event, one email. |
| Cancel during sync, no orphans | Cancel while the worker is dead: the sweep removes the unrecorded Zoom meeting (found by marker) and the event; only a cancellation email. Cancel and reschedule mid-run are guarded in the database (`sched_finish_sync`). |
| Bounded, observable, recoverable retries | 8 attempts with 1 m / 5 m / 30 m / 2 h / 12 h backoff, then "gave up". Visible per booking (attempt, next try, last error), "Retry now", and a pulse of every sweep. |
| Conflicts not silently ignored | Flagged on the booking's own history **and** in Recent activity: at event creation, and by a rate-limited (15 min) free/busy scan that catches conflicts added later. Handles Google merging adjacent events; a failed scan retries on the next sweep; a bad timestamp cannot switch scanning off. The booking stands, the admin decides. |
| Failed bookings visible with a meaningful status | Bookings list: recovery label under each status (Syncing, Retrying · attempt N, Waiting for the recovery worker, Needs attention · gave up, Calendar conflict), a "Needs attention" tab and an Overview block (both appear only when something needs attention), drawer wording per state with the last error and Retry now. Canceled bookings whose cleanup failed are flagged too. |
| Recovery worker visible | Integrations page "Recovery worker": Running / Not running (no sweep for 5 minutes) / Not seen yet, with the last sweep's summary. |

### Does local Supabase support the proposed `pg_cron` setup? Yes.
`pg_cron` 1.6.4 is available (installed with `create extension pg_cron`; `shared_preload_libraries` already includes it), `pg_net` 0.20.4 and the Vault are present, on Postgres 17.6. From inside the database container, `pg_net` reaches a server on the Mac through `host.docker.internal`. **Verified end to end:** a booking written with no background task (the state left by a function that dies right after the save) was completed by the minute-by-minute job on its own, without any manual call: job ran at 12:12:00, HTTP 200, booking `ok`, Zoom and Google references synced, one confirmation email, pulse recorded. The job was then removed.

### Can it run reliably every minute in production? Probably, with conditions to confirm.
- It needs the Supabase project to be running (not paused), `pg_cron` and `pg_net` enabled, and the production URL reachable from Supabase. **Confirm your Supabase plan**: free projects can pause after inactivity, which would silence the job. If production is on a plan that can pause, either upgrade or rely on the alternative below.
- `pg_net` is asynchronous with a retained response log; a slow sweep (over 55 s) is cut off and simply continues next minute. Everything is idempotent.
- It is a single point of silent failure, which is why the Recovery worker row exists: a dead sweep shows "Not running" within five minutes.
- **Alternative if it cannot be relied on:** a daily Vercel Cron as a last-resort backstop plus the existing polling and "Retry now"; or an external scheduler (a queue such as Upstash QStash) later. I do **not** recommend GitHub Actions as the primary (5-minute minimum, best effort, minutes quota for private repos). No paid infrastructure is introduced by this design.
- **While the local cron job is installed it sweeps every due booking in the local database every minute, including test bookings.** It is removed by default; install it only for a deliberate demonstration.

## 3. Email safeguard (built and tested with mocks; **no real email sent**)

Existing rule (unchanged): outside production, email is off unless `PREVIEW_EMAIL_ENABLED=true` and the allowlist contains only `ADMIN_EMAIL`. Locally `ADMIN_EMAIL` is an `@example.test` throwaway, so a real test to martindubreuil13@gmail.com was impossible by design.

**The exception** (`app/lib/email-policy.ts`, 39 added lines; `email-client.ts` +1 optional parameter): all of the following must hold or it does nothing.
1. `SCHEDULING_EMAIL_TEST_MODE=true`, an explicit local flag (put it in `.env.development.local` or the shell only).
2. The process is `next dev` (`NODE_ENV=development`): not a build, not `next start`, not tests.
3. Not on Vercel at all (`VERCEL` and `VERCEL_ENV` unset, whatever their values), and classified "development" (never preview or production).
4. The caller declares the purpose `scheduling-transactional`. Only the booking Resend provider does; the Transition and resource flows do not, so they are evaluated by the unchanged rules and stay blocked even with the flag on.
5. Exactly one recipient in total (no cc or bcc), equal to `martindubreuil13@gmail.com`, which is a constant in code and cannot be repointed from the environment.
6. The booking provider additionally refuses anything that is not one of the five booking message kinds with a booking id, and any `to` that is not one plain address. No marketing path exists.

In test mode a booking for any other guest is **simulated, never sent** (recorded as accepted with a `suppressed_` id, no retries, shown in the admin outbox), so a public visitor can never cause a real send to an arbitrary address. The guest page says so. Production: the flag is ignored and delivery is exactly as before (tested: production still sends to anyone, unsimulated). Tests: 20 in `email-test-mode.test.ts` through the real policy and real client with the Resend package mocked, plus four mutants (drop the purpose, Vercel, `NODE_ENV` or one-recipient condition) each caught, and static guards that the flag, the purpose and the address cannot spread. The dry run composes all three messages to the test address: branded shell, no unsubscribe link, guest-zone date and time, Zoom button on confirmation and reschedule only, distinct subjects, idempotency keys per kind and version.

**What the approved test needs (nothing below has been done):**
- In `.env.development.local`: `SCHEDULING_EMAIL=resend`, `SCHEDULING_EMAIL_TEST_MODE=true`, and a Resend API key. `next dev` would currently load the key in `.env.local`, which is the production key. **Decision for you:** use that, or create a separate sending-only development key in Resend (recommended).
- A verified sender (`SCHEDULING_EMAIL_FROM`, default `Martin Dubreuil <martin@mindrasolutions.com>`; confirm SPF, DKIM, DMARC for `mindrasolutions.com`).
- Google reconnected if the test should also create a real calendar event and Zoom meeting; otherwise run with Google and Zoom mocked (the email then carries a simulated link). A real Zoom meeting and Google event for the test booking need your separate approval.
- Delivery status cannot be tested locally: Resend's webhook needs a public HTTPS URL. Check delivery in the Resend dashboard and the mailbox.

## 4. Verification

| Check | Result |
|---|---|
| Tests | **1051 passed**, 18 skipped (one pre-existing skipped file); three consecutive full runs stable |
| New or extended this phase | admin view logic (8), conflict scan, pulse, stuck and bounded-retry scenarios (document store **and** Postgres, 48 in `background.test.ts`), real process-kill recovery (4), heartbeat contract (both repositories), guest DST (5), email safeguard (20) |
| Mutation checks | race guards, duplicate protection, conflict scan, retry bound, and each email-safeguard condition: all caught |
| TypeScript | clean |
| Lint | whole app 42 problems (1 error, 41 warnings): **identical to the baseline**; none in files I wrote |
| Production build | succeeds, new routes present |
| Browser (Chromium and WebKit, mock providers) | guest flow 16/16 each (booking form, preparing / delayed / recovered with live polling, cancel during pending); admin states 8/8 each (attention block and tab, recovery labels, drawer, Retry now, Recovery worker running and not running) |
| Pre-existing, unchanged | `PageStructuredData.tsx` any-type error and 41 warnings; the shared admin proxy has no timeout on its auth call |

Real defects found and fixed this phase: the Google connection wipe by my own test (above); an HTML nesting bug that caused hydration errors on the Integrations page; a future-dated scan timestamp that could disable conflict scanning; a failed scan consuming its 15-minute window; a child process that raced its own kill; and the earlier Phase 2B race where a cancel during a sync could leave an orphan.

## 5. Production readiness assessment

### Not yet possible or not yet done
- **The go-live switch is still off.** `schedulingPrototypeEnabled()` is false on Vercel unconditionally, so nothing scheduling-related is reachable in production. A production flag (for example `SCHEDULING_ENABLED`) and removal of the "Local prototype" copy are required changes, not made here.
- **Community invitation is still simulated** and must be wired to the site's consent library before real guests see it (handover section 8.3).
- **Guests cannot cancel or reschedule themselves** and there is no `.ics`; the email says to reply. Admin-only for now.
- **Mixed uncommitted work.** Scheduling, Publications and Transition-related edits share files (`AdminShell.tsx`, `.gitignore`, `.env.example`, `next.config.ts`, `package.json`, tests). Scheduling's own edits to shared files are small (an admin nav link, `/book/` excluded from the Pick My Brain widget, ignore rules, the two shared email files). **They must be separated into their own commits with `git add -p` and reviewed hunk by hunk.** I could not tell from here how Publications reached production, so base the scheduling change on whatever production currently runs.

### Production environment (Production scope only; names, never values)
`SCHEDULING_ENABLED` (new), `SCHEDULING_BACKEND=supabase`; `SCHEDULING_GOOGLE=live`, `SCHEDULING_GOOGLE_CLIENT_ID`, `_CLIENT_SECRET`, `_REDIRECT_URI` (the production callback URL), `SCHEDULING_TOKEN_KEY` (+ `_VERSION`; back it up, losing it means reconnecting Google), `SCHEDULING_GOOGLE_INVITE_GUEST=false`; `SCHEDULING_ZOOM=live`, `SCHEDULING_ZOOM_ACCOUNT_ID`, `_CLIENT_ID`, `_CLIENT_SECRET`, `_USER_ID`, optional `_WEBHOOK_SECRET`; `SCHEDULING_EMAIL=resend`, `SCHEDULING_EMAIL_FROM`, `SCHEDULING_EMAIL_REPLY_TO`, `SCHEDULING_RESEND_WEBHOOK_SECRET`; existing `RESEND_API_KEY`, `APP_BASE_URL`; `CRON_SECRET` (the same variable the existing intelligence cron uses). **Never set `SCHEDULING_EMAIL_TEST_MODE`, `SCHEDULING_PROTOTYPE`, or any `PREVIEW_EMAIL_*` in a hosted environment.** Vercel Preview holds no Supabase credentials by design, so scheduling cannot be exercised end to end in a Preview; plan the first real exercise in production behind the flag.

### Supabase
One additive migration, `20261101090000_mba_scheduling.sql` (13 `sched_*` tables, 9 functions including one trigger function, RLS on with no policies, browser roles revoked). It references `consent_records(id)` and `set_updated_at()`, which must exist in production; check before applying. It was edited several times during development and is unapplied in production, so the final file is applied once. Then, separately and by hand, `recovery-cron.sql` (not a migration, because it needs the production URL and a secret). Run the Supabase security advisors afterwards.

### Google OAuth
A **separate production OAuth client** (the development client only allows the localhost redirect), production redirect URI, consent screen with the real domain, scopes exactly `calendar.freebusy` and `calendar.events.owned` plus identity. The publishing status must be **In production**; in "Testing" refresh tokens expire after 7 days and new bookings would be refused until reconnected. Unverified-app warnings and the verification threshold need a decision. Only the designated account and the `primary` calendar are accepted by the code.

### Zoom
Reuse or create a Server-to-Server app for production with the five granular scopes; `SCHEDULING_ZOOM_USER_ID` is required (no `me`). Confirm the host's licence (Workplace Pro: 30 h, 100 participants; Basic: 40-minute limit). The optional meeting-deleted webhook needs the public URL and its secret token.

### Resend
Verified sending domain; a second webhook for `/api/webhooks/scheduling/resend`. Booking emails stay transactional. Review the production key's scope.

### Remaining security and operational risks
Admin proxy has no auth timeout (pre-existing, shared); the rate limiter fails open on its own database error (consistent with the site); `reconcile` reads all bookings each sweep; the Integrations page makes a live Zoom call per load (about 3 s); the guest's email address is not verified (a typo sends a confirmation to a stranger); events added to Google that exactly match a booking's time are indistinguishable from it; `after()` and cron durations depend on the Vercel and Supabase plans, which I could not verify.

### Safe deployment sequence
1. Your approvals (this document's section 6).
2. Split the scheduling work into its own commits on a branch based on what production runs; review every shared-file hunk; confirm no Publications or Transition file differs from production.
3. Deploy with `SCHEDULING_ENABLED` unset (every scheduling route returns 404); smoke-test Publications, Transition and Calendly on the live site.
4. Apply the migration to production; run the advisors.
5. Set the Production environment variables; redeploy (still flagged off).
6. Connect Google and Zoom in the production admin (Integrations page).
7. Run `recovery-cron.sql`; confirm "Recovery worker: Running".
8. Turn the flag on. Make **one** controlled real booking (with your approval of the exact test): confirm event, meeting, email, reschedule, cancel, cleanup.
9. Only then link a call to action to `/book/<type>`. Transition keeps Calendly until you decide otherwise.

### Rollback
Unset `SCHEDULING_ENABLED` (routes 404 immediately, no deploy needed beyond the variable change); `select cron.unschedule('mba-scheduling-sweep')`; disconnect Google on the Integrations page. Cancel any real bookings in the admin first so their Zoom meetings and calendar events are removed. The tables are additive and can stay; they are dropped only if no real booking exists. Publications, Transition and Calendly are never in the rollback path because the scheduling code does not touch them.

### Protecting Publications and Transition
The migration only adds tables; no existing table or function is altered. The only shared runtime files changed are `email-policy.ts` and `email-client.ts` (backward-compatible: an optional parameter, and a branch reachable only with the scheduling purpose in local development), covered by the existing 13 email tests passing unchanged plus 20 new ones. The scheduling routes, pages and cron are new paths. The existing Transition booking flow, Calendly and the Publications code were not edited by this work.

## 6. Approvals needed
See the report that accompanies this document.
