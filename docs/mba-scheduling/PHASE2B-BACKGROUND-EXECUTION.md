# MBA Scheduling: Phase 2B (background execution, recovery, local admin access)

Branch `feat/mba-scheduling`. Everything here is local and uncommitted. Verified against mock Google / Zoom / email and the LOCAL Supabase stack only. No real Google event, Zoom meeting or email was created in this phase. Nothing was deployed, committed, or applied to production.

## 1. Local admin access

**What was wrong.** The local admin is a throwaway Supabase Auth user (`ADMIN_EMAIL` in `.env.development.local`, currently an `@example.test` address). Its password lived only in a shell variable (`LOCAL_ADMIN_PASSWORD`, per the older resource-lead-capture docs). Nothing stored it, so any new shell, session or agent had no way to sign in. During the live integration test the password was reset to a throwaway value and the only copy was deleted, which left no usable credential at all.

**What was not wrong.** The local auth service was healthy (HTTP 200 in about 6 ms), the proxy and session code were correct, and sign-in works in both Chromium and WebKit (Safari's engine), on `localhost` and `127.0.0.1`.

**The Safari timeout.** Not reproduced, and not proven. Evidence gathered:
- The dev server was bound to `127.0.0.1` only while `localhost` resolves to `::1` first. curl and WebKit both fall back correctly, so this is a plausible contributor for a real Safari but not a demonstrated cause.
- An earlier dev-server log shows local Supabase was down at one point (`ECONNREFUSED 127.0.0.1:54321`), and the admin proxy awaits `supabase.auth.getUser()` on every `/admin/*` request with **no timeout**. That is a real hang risk whenever the auth service is unreachable. It is production code (`proxy.ts`), so it was left alone; adding a short fail-closed timeout there is a recommended follow-up.
- Cold Turbopack compiles took 2 to 6 seconds on first visits, which feels like a hang in a browser.
- A long-running dev server serves stale compiled output after edits (observed again this phase). Restart it after code changes.

**The fix (no authentication bypass).** `scripts/local-admin.mjs`:

```
node scripts/local-admin.mjs
```

It refuses to run unless the Supabase URL is loopback, refuses if the development `ADMIN_EMAIL` equals the production one, makes sure the throwaway local user exists, signs in through the normal password grant to prove it works, and keeps the password in `.env.local-admin` (git-ignored by `.env*`, mode 600). It never prints a password or token. Open that file yourself to read the password. It is idempotent: a second run only confirms.

**Verified in the browser** (Chromium and WebKit): real sign-in form, Scheduling overview, Bookings, Integrations, with no hydration errors. One real bug was found and fixed on the way: the Integrations page rendered a `<div>` (the toast container) inside a `<span>` inside a `<p>`, which made React report a hydration mismatch whenever Google was connected (the mock-mode smoke tests never rendered that branch). The wrapper is now a `<div>` with the same classes.

## 2. What changed (the flow)

Before: `POST /api/scheduling/book` waited for Zoom, Google and email (5.6 s measured live; reschedule 6.4 s; cancel 3.7 s).

Now:

1. Validate, check the slot against Google free/busy and our confirmed bookings (as before).
2. **One atomic database write** (exclusion constraint on the padded time range across all meeting types, idempotency key, per-day cap). The booking is saved and queued (`sync_status = pending`) in the same transaction.
3. The response returns immediately. Nothing external has happened yet.
4. Next's `after()` starts `BookingSync.run(bookingId)`: Zoom, then Google, then email, each idempotent.
5. The confirmation page polls `GET /api/scheduling/booking/<reference>` every 3 s (then 10 s, for at most 5 minutes) while the link is missing. A poll also starts the sync if it is due and nobody holds it.
6. A sweep (`GET /api/cron/scheduling-sync`) re-queues anything inconsistent and runs everything due. It is what finishes work if the function was killed.

Guest-visible states (copy only; layout and design untouched):

| State | When | What the guest sees |
|---|---|---|
| ready | Zoom link exists | the link, and the original confirmation sentence |
| preparing | saved, first attempt not finished | "Your time is reserved. We're preparing your calendar invitation and Zoom link now; this page will update in a moment." Zoom row: "Preparing your Zoom link…" |
| delayed | an attempt failed, being retried | "…taking longer than usual… We'll email it as soon as it's ready" |

No state promises a link that does not exist. A simulation notice is shown only when something is actually simulated (previously a "no Zoom meeting exists, no email sent" line showed always, which is false with live Zoom). The booking page banner also names what is live or simulated.

## 3. Execution options compared

Assumes the site runs on Vercel, with Supabase for data. **Confirm your Vercel plan and current limits before relying on the numbers below; they are from general knowledge, not from your account.**

| Option | Cost | Reliability | Limits and notes |
|---|---|---|---|
| **A. `after()` in the booking request** (Next 16, runs on Vercel via waitUntil) | free | Good for the happy path. If the function is killed or times out, the work is lost for that attempt. | Bounded by the route's `maxDuration` (set to 60 s on the book, admin and cron routes). Needs a safety net. |
| **B. Confirmation-page poll nudge** | free | Covers a killed `after()` while the guest is on the page (about 3 s). Useless once they leave. | Rate limited (60/min/client). Built. |
| **C. Vercel Cron** | free on Hobby, but Hobby cron is at most daily; sub-daily needs Pro | Platform-native, but a daily cadence makes the 1 m / 5 m / 30 m backoff meaningless | Fine only as a once-a-day backstop. Adding an entry to `vercel.json` changes production behaviour, so it was not done. |
| **D. Supabase `pg_cron` + `pg_net` calling the sweep URL every minute** | free (extensions are available on all plans; the project must be running, and free projects pause after inactivity) | Independent of Vercel and of any visitor. The database that already holds the queue triggers the sweep. | Needs `CRON_SECRET` in Supabase Vault and the production URL. Needs a production migration/setup approved by you. Not run here. |
| E. GitHub Actions schedule | free for public repos; private repos have a monthly minutes quota that a 1-minute-billed run every 5 minutes would exceed | Best effort, often delayed; 5-minute minimum | Not recommended as the primary. |
| F. A queue (Upstash QStash, Inngest, Vercel Queues) | free tiers exist, usage-priced beyond them | Strongest delivery guarantees | New vendor, new secrets and signature verification, more to operate for a one-person booking volume. Not justified yet. |

### Recommendation

**A + B + D**, in that order of speed:

1. `after()` does the work immediately (about 1 to 6 s after the guest sees the page).
2. If it was killed, the open confirmation page restarts it within about 3 s (B).
3. If the guest left, `pg_cron` calls the sweep within a minute (D), including bookings whose lock was left by a dead worker (locks expire after 5 minutes).
4. Optionally add a daily Vercel Cron as an independent last resort (C).

It adds no new vendor and no cost. The queue (F) is the upgrade path if volume or delivery guarantees ever demand it; the design already supports it (the sync is a single idempotent `run(bookingId)`).

**Until D is set up, recovery from a killed function depends on B (guest still on the page) or on the admin pressing "Retry now".** Set D up before the first real booking.

`pg_cron` setup (NOT run; try on a non-production project first):

```sql
-- Database > Extensions: enable pg_cron and pg_net. Store the same value as the app's CRON_SECRET once:
select vault.create_secret('<CRON_SECRET value>', 'scheduling_cron_secret');
select cron.schedule('mba-scheduling-sweep', '* * * * *', $$
  select net.http_get(
    url := 'https://<production-domain>/api/cron/scheduling-sync',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'scheduling_cron_secret')),
    timeout_milliseconds := 55000);
$$);
```

Manual run any time: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/scheduling-sync`.

`SCHEDULING_SYNC=inline` switches off the background hook (everything runs before the response, as in Phase 2A). The cron route, scripts and tests always run inline.

## 4. How each requirement is met

| Requirement | Mechanism | Proven by |
|---|---|---|
| Save and protect the booking atomically before any external call | one RPC transaction; exclusion constraint on `blocked_range` across all types; the external work is derived from the saved row | contract + service tests on real Postgres |
| Never a double booking | the constraint is the backstop for any write path, plus a global advisory lock in the write functions | 6 and 12 simultaneous bookers on Postgres (Phase 2A), still green |
| Accurate pending state, no premature link | `PublicBooking.progress` is derived from the stored Zoom reference and sync state; the link is shown only when it exists | service tests, browser run (preparing, delayed, recovered) |
| Duplicate requests | idempotency key + request hash; replays never create or send anything; racing workers are serialised by a per-booking lock | duplicate tests, both backends |
| Cancel / reschedule correctness | version number per change; every external object and email is tracked per version | existing + new tests |
| Cancel or reschedule **during** a sync | see below | race tests (both backends); mutation-checked |

**The race fixed in this phase.** Before, the SQL for cancel and reschedule cleared the sync lock, and a worker's "done" was recorded unconditionally. A cancel landing mid-sync could therefore start a second concurrent worker, and the first (holding a stale copy) could create a Google event or Zoom meeting for a canceled booking and then mark itself `ok`, leaving an orphan nobody would clean up. Now: the lock is kept; before each external step the worker re-reads the booking's version and stops if it moved; and `sched_finish_sync` records an outcome only if the booking is still at the version the worker handled. Otherwise the booking goes straight back to "pending, due now" and the worker runs another pass (up to 4). The tests hold Zoom's create call open, change the booking, drain the changer's own background task while the lock is held, and assert the result with no other help. A mutant with the guards removed fails those tests.

Other recovery guarantees:
- A Zoom meeting created but never recorded (crash between the call and the database write) is found by its marker in the meeting agenda, reused on retry, and deleted on cancel.
- A reschedule before the first confirmation email goes out sends one confirmation of the new time, not a "rescheduled" notice for a change the guest never saw.
- An event added to Google after the slot was offered is flagged in Recent activity (`calendar_conflict`) when the event is first created; the booking stands. Detection is best effort and only at creation (see risks).
- `reconcile` re-queues confirmed bookings whose Zoom / Google / confirmation email disagree with the record although they say "ok", and canceled bookings whose external objects were not deleted.
- Webhooks: Zoom (HMAC with a 5-minute window), Resend (Svix signature) and Google (channel token) are verified first; a verified delivery is then honoured **once** (`sched_webhook_events`, purged after 2 days), so a replay inside the window changes nothing.

## 5. Tests

- `background.test.ts` (new, 17 scenarios, run against the document store **and** real local Postgres): immediate return and honest pending state; background completion; duplicates and racing workers; cancel before / during a sync; reschedule during a sync; Google failure and backoff recovery; Zoom failure, "delayed" state and follow-up email; a killed function and a dead worker's lock; a crash between the Zoom call and the database write (with and without a following cancel); reconciliation; external conflict; unreadable calendar refuses the booking and writes nothing; inline fallback; polling nudge; request time independent of provider latency (a 700 ms Zoom and Google do not slow the booking request).
- `contract.test.ts` (+2): the lock is kept across cancel and reschedule and a stale outcome is "superseded"; the webhook ledger (one winner among six concurrent deliveries, purge).
- `integration-routes.test.ts` (+6): webhook replay for Zoom, Google, Resend; tampered and stale requests still refused; the public status endpoint exposes no email, message, surname or internal id, is rate limited, and is off outside the prototype switch.
- `vitest.workspace.ts` (new): the three files that share the local database run one file at a time in their own project (the sweep is deliberately global, so two files sweeping at once steal each other's bookings); everything else stays parallel. Five consecutive full runs were stable.
- Browser, Chromium and WebKit (16/16 each) against a dev server with Google and Zoom forced to mock: real booking form (357 to 824 ms to the confirmation page), the three guest states with screenshots, the open page recovering by itself without a reload, cancel while the sync was pending leaving no references and only a cancellation email, admin sign-in and pages.

## 6. Remaining reliability risks

1. **No scheduled sweep exists yet** (option D is documented, not set up). Until it is, a killed function is recovered only by the open page or "Retry now".
2. **Google "Testing" consent expires refresh tokens after 7 days.** An expired token puts the connection in `needs_reauth`: new bookings are refused ("temporarily unavailable") and syncs stop until you reconnect. Fine for development; production needs a decision on publishing status.
3. **Conflicts are detected only at booking time, at reschedule time and once at event creation.** Nothing watches the calendar afterwards (no Google push channel yet), so an event you add later is not noticed until you look.
4. **Free/busy exact-match subtraction.** Our own events are subtracted from Google's busy list by exact interval. If Google merges an adjacent external event with ours into one block, our own slot's neighbours could be blocked; with the default 30-minute buffer this is mostly masked. Unverified against live data.
5. **Lock duration is 5 minutes and `after()` is limited to 60 s.** A killed function holds its booking's lock for up to 5 minutes before the sweep can pick it up. Provider calls retry with their own bounded backoff inside a pass; a pass longer than the lock could overlap a second worker (safe because everything is idempotent and guarded, but wasteful).
6. **`reconcile` reads all bookings each sweep.** Fine for hundreds; move the check into SQL if volume ever grows to thousands.
7. **Admin proxy has no timeout on its auth call** (section 1). If Supabase Auth is unreachable, `/admin/*` can hang instead of redirecting.
8. **The Integrations page makes a live Zoom call (token + one read) on every load**, about 2 to 4 s. Consider caching the status for a minute.
9. **Vercel plan facts are unverified** (cron frequency, function duration). Check before relying on option C or on `maxDuration`.
10. **Real email, real webhooks and a public URL have never been exercised.** Local development cannot receive Resend, Zoom or Google webhooks.

## 7. Before real email testing

1. **Decide how a non-production test email is permitted.** The site's existing email policy (`email-policy.ts`) sends from non-production environments only if `PREVIEW_EMAIL_ENABLED=true` and `PREVIEW_EMAIL_ALLOWLIST` contains **only** the process's `ADMIN_EMAIL`. Locally `ADMIN_EMAIL` is the `@example.test` throwaway, which cannot receive mail, so a real test to martindubreuil13@gmail.com is currently impossible by design. Options: (a) run a one-off server with `ADMIN_EMAIL=martindubreuil13@gmail.com`, `PREVIEW_EMAIL_ENABLED=true`, `PREVIEW_EMAIL_ALLOWLIST=martindubreuil13@gmail.com`, `SCHEDULING_EMAIL=resend`, and a local Supabase auth user for that address (it is a local database, separate from production; `local-admin.mjs` deliberately refuses that equality today and would need an explicit override); or (b) test from a Vercel Preview configured the same way. This changes a safety rule, so it needs your explicit approval.
2. **Resend sender.** Confirm `SCHEDULING_EMAIL_FROM` (default `Martin Dubreuil <martin@mindrasolutions.com>`) is a verified sending domain with SPF, DKIM and DMARC, and decide the reply-to.
3. **Webhook.** A second Resend webhook for `/api/webhooks/scheduling/resend` (own signing secret, `SCHEDULING_RESEND_WEBHOOK_SECRET`) needs a public HTTPS URL, so delivery and bounce tracking can only be tested on a deployed preview, not on localhost.
4. **Sweep running** (section 3, option D), so a failed send is retried rather than waiting for "Retry now".
5. **One test only**, to the allowlisted address, with `SCHEDULING_GOOGLE_INVITE_GUEST=false` (Google sends nothing; only our branded email). Verify the branded rendering in a real mail client (the previews in `docs/` are not a substitute), the Zoom button, and that the message carries no marketing content or unsubscribe link (transactional only).
6. **Return to `SCHEDULING_EMAIL=simulated`** afterwards and confirm no further sends.
7. Not required now but worth deciding: whether the guest also gets a Google invitation (default off), and the exact cancellation and reschedule wording.
