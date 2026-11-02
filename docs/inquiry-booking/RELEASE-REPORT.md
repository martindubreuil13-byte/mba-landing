# Inquiry and booking release: consolidated report

2 November 2026. Branch `feat/phase2-complete`. Replaces the separate 2a / 2b / 2c plans. **Built and tested locally. Nothing is deployed, no production migration is applied, the one switch is off.** This is for approval.

## 1. What was built

1. **Saved inquiries and an admin list.** A program inquiry is saved before you are told about it. One list at `/admin/inquiries` ("Inquiries & applications") shows every inquiry and every Corporate Transition application, newest first: who, what they are interested in, whether you were told (or the invitation went out), the booking status, and the message. A failed notification is shown in red with the reason. A Delete button removes an inquiry.
2. **Bookings linked to where they came from.** When someone follows the link in their email (or the button on the success screen), the booking page fills in their own name and email and remembers which inquiry or application they came from. The booking, once made, is linked to it.
3. **One view of status.** Booking status is never copied: it is read from the booking each time, so it shows booked, a new time ("rescheduled"), or canceled by itself. A booking made with the same email but without the link is shown as "Possibly booked ... not linked", never as fact. The Transition list and detail pages now show the same live booking status in place of the old "Calendly: Not connected".
4. **Calendar fix.** "Next month" stops at the last month the server will answer (about 13 months), so the "Choose dates in the coming months" error can no longer be reached.
5. **Calendly removed from the customer experience.** The privacy page no longer says bookings happen on Calendly; the admin conversions wording and the booking-link click counter now refer to the booking page. A test fails if Calendly text reappears on any customer-facing page or email. The dormant Calendly webhook code stays as history.
6. **Privacy, expiry, basic protection.**
   - Privacy page: new "Booking a conversation" and "Sending a message" sections (what is saved, 24-month message retention, 60-day link expiry, no subscription from sending).
   - Links: the reference travels in the URL fragment, which never reaches servers or logs; the page removes it from the address bar before any analytics runs; older `?ref=` links still work. It is never logged. Pre-fill expires after 60 days (the booking itself is never blocked; an old link still links the booking to its inquiry).
   - Protection on the inquiry form: hidden trap field, a short-lived signed token, same-site check, size cap, 5 submissions per hour per visitor, 3 new inquiries per day per email address; a volume of more than 60 an hour only writes a log line.
   - No saved row means no notification: if the database cannot save, nothing is sent and the visitor is asked to retry. If your notification email fails the visitor sees the same error as today and the saved inquiry is marked "Delivery failed" for you.
   - Retries and double clicks never create a second inquiry or a second email.
   - Messages older than 24 months are blanked daily (the person and the fact of contact stay). `INQUIRY_RETENTION_MONTHS` can lower this, never raise it.

**One switch** turns it all on: `PROGRAM_INQUIRY_STORE_ENABLED=true`. Off (the default) the site behaves exactly as today, apart from the always-safe items (calendar fix, privacy text, admin pages, 60-day expiry of Transition pre-fill).

## 2. Unresolved or not done

- **Not tested against real providers** by instruction: real emails, Zoom, Google, Resend click-tracking (if on, Resend would store the link; check once in the live test), and how Gmail and Resend treat a link with `#...` (the test exercises it).
- **Fail closed:** while the switch is on, a database outage stops new inquiries. Turning the switch off restores the old behaviour.
- **No alerting for inquiries.** Failures show in the admin list and in Vercel logs (`INQUIRY NOT STORED`, `INQUIRY NOT DELIVERED`, `INQUIRY VOLUME`).
- **Admin list is plain:** newest 200, no search or filters. Inquiries from before activation were never saved and cannot be added. Bookings made before activation show only as email-match hints.
- **Guests cannot change or cancel on the site**; as before, you do it in `/admin/scheduling/bookings` (the privacy text says to contact you).
- **Second cron** (`vercel.json`): confirm your Vercel plan allows two daily crons before deploying. It uses the existing `CRON_SECRET`.
- **Shared limiter** (`getClientIp`, used by booking limits) trusts the first forwarded address. Verified safe on Vercel today (the platform replaces forged values); recommended to switch to the new helper in a separate change.
- Unchanged earlier items: no separate backup of the encryption key; the independent "app is down" alert is not active; Stage C-F documents remain uncommitted.

## 3. Automated test results

- **Whole suite:** 1,471 passed, 18 skipped (the same 18 as before), 108 files, including the suites that run against a real local Postgres (linked only for the run, removed afterwards). Before this work: 1,364.
- **Type check, lint, production build:** clean. New routes build: `/admin/inquiries`, `/api/qualify/challenge`, `/api/scheduling/booking-context`, `/api/cron/inquiry-retention`, `/api/admin/inquiries/erase`.
- **Real Postgres checks (local only):** 12 simultaneous claims give one winner; simultaneous identical inserts give one row; the browser roles read and write nothing; a second origin for a booking changes nothing; status follows reschedule and cancel; erasing an inquiry keeps the booking and its link row; deleting a booking removes its link row. The migration was applied twice (idempotent) and its constraints rehearsed in a rolled-back transaction.
- **End-to-end with every outside party faked:** inquiry, reply with link, exchange, booking with context, link row, admin list "Booked", "(rescheduled)", "Canceled". Nothing real was called.
- **Mutation checks:** 49 deliberate breakages of the protections (claims, idempotency, limits, token, address helper, expiry, retention, context signature and expiry, stale-link behaviour, link-on-replay, status headline, hint, picker, route and page plumbing, migration delete rules, privacy and Calendly wording, switch behaviour). All caught except two equivalent ones (a repeat request is already stopped before it could be linked twice; an "always attempt the send" guard that the atomic claim makes redundant).

## 4. Database migration

One file, `supabase/migrations/20261106090000_program_inquiries.sql`, **additive and idempotent**, two new tables, nothing existing is altered:
- `program_inquiries` (the saved inquiries and their email states).
- `booking_origins` (one row per booking: which inquiry or application it came from; no reference is stored).
Both have row-level security with no policies (server only). Erasing an inquiry or application clears the origin and keeps the booking.

To apply (needs your approval): confirm project `sbntzyivfhvogxiiysuh` and a recent backup, run the file, add the `schema_migrations` row (as in Stage G), check both tables exist with RLS on and zero rows. It can be applied before or after the deploy; the previous release ignores it.

## 5. Deployment and rollback plan

**Deploy (after your approval):**
1. Apply the migration (section 4).
2. From a clean `git archive` of the release commit, deploy with the standing scheduling overrides (intake **ON**) and add `-e PROGRAM_INQUIRY_STORE_ENABLED=true`. Read-only smoke checks (no submissions): pages 200, `/admin/inquiries` loads, calendar stops paging, privacy page. Promote.
3. You run the single test in `END-TO-END-TEST.md`.

(If you prefer two steps, deploy first without the switch, check, then redeploy with it.)

**Rollback (minutes, no data work):**
- Switch off: redeploy the same commit without `PROGRAM_INQUIRY_STORE_ENABLED`. Inquiries go back to email-only; new links return to `?ref=`; saved rows stay untouched and harmless.
- Full rollback: promote the previous deployment `dpl_EHNNF84ssV4t1hbpkEwTiAnQwFFr`. The migration may stay; the previous code ignores both tables.
- Links already emailed with `#...` work on the previous build as an empty form; booking is unaffected.
- Dropping the tables is never part of a rollback.

## 6. Single end-to-end test

See [END-TO-END-TEST.md](END-TO-END-TEST.md): about 30 minutes, once, with a plus-address.
