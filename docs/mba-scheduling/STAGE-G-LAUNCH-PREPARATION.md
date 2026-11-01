# MBA Scheduling — Stage G launch preparation

1 November 2026. Development handover from Codex, completed locally in the isolated release checkout (`release/mba-scheduling-production-prep`, base `1c85b8c`). **Nothing was committed, pushed, deployed or changed in production. Public intake remains OFF.** Publications, the three books and Transition were not touched.

## Incident: closed
An unauthorized local test created one real Zoom meeting, one real Google event and one real owner email on 1 November. Martin authorized deleting exactly the two resources; both were identified by their booking marker and ID, deleted without the application workflow and without any cancellation email, and independently verified absent. Ordinary local UI testing can no longer reach real providers (explicit `SCHEDULING_ALLOW_LIVE_DEV=true` is required outside production). Full account: `STAGE-G-INCIDENT-CLOSURE.md`.

## Business decisions now approved and implemented (1 November)
**Host time zone is Asia/Bangkok.** The code default (`DEFAULT_HOME_TIME_ZONE`) and the database default are Bangkok; migration `20261105100000_mba_scheduling_host_timezone.sql` replaces only the old untouched default (`America/Toronto`) in the settings row, leaving any zone chosen on purpose alone. Availability windows, breaks and days off are read on Bangkok's clock, and the admin screens, Google event time zone, Zoom meeting zone and the host's notices all take the same setting. Visitors keep seeing their own zone; times are stored as UTC instants and are not modified, so no historical appointment moves. Bangkok has no daylight saving, so windows never drift (tests cover Jan, Mar, Jul, Nov/Dec). The migration was applied twice to the local database and behaved as stated. **Note:** applying it to production re-reads any existing availability in Bangkok time; the only production meeting type is the inactive test offering.

**Community invitation: kept, final "Stay in the loop" wording, recorded in the Leads, with email verification where the site asks for it.**
- **Wording.** The approved text is installed word for word as version `scheduling-community-v2` (heading, the three paragraphs, "You can unsubscribe anytime.", **Yes, keep me in the loop** / **Not now**). Version 1 is preserved unchanged in `COMMUNITY_WORDING_HISTORY`, and every answer stores its exact accepted text and version, in the booking's own consent record and in the site's consent log. The pop-up, its timing and the Leads integration are unchanged. Transition's own wording was not touched.
- **When it appears.** Only for a fully confirmed booking with Zoom details ready; the server refuses an answer otherwise (409), for a canceled booking, and for an unknown reference.
- **Yes, outside the site's proof-required regions** (EEA, UK, Switzerland, Brazil, Quebec, unknown location is treated as proof-required): the click is the consent, recorded at once with its evidence. No email.
- **Yes, inside them, or a contact who unsubscribed before:** recorded as **pending verification**; marketing stays off. One **dedicated MBA community verification email** is sent to that address ("Please confirm your email address": its own text, privacy and unsubscribe links and one-click unsubscribe header; nothing promotional; it does not use or resemble the Transition template). The pop-up tells the visitor honestly to check their inbox and that nothing is sent until they confirm. If the email cannot be sent, the visitor is told to try again, the booking records no answer, and a retry sends exactly one.
- **The verification link.** Signed, with its own prefix (no other site token works here, and this one works nowhere else), bound to the one consent request, expiring in 14 days, and acted on only by a POST from the `/community/verify` page, so opening the link or a mail scanner's prefetch activates nothing. It has its effect **once**: using it again changes and writes nothing. It ends with a withdrawal: a link used after the contact withdrew does nothing, even if they later ask again (only the new request's link works). A suppressed contact is never touched and never emailed. On success the log gets an `email_confirmation` record tied to the original request, with the exact wording the visitor accepted.
- **Exports.** Pending and unverified contacts are excluded from the subscribers and shortlisted exports and show "Awaiting confirmation" in the report; they appear there as "Subscribed" only after verification. The report shows status, date and source ("booking confirmation invitation"), acquisition "Booking — community invitation".
- **Decline or "Not now"**, closing the window, or no answer: no contact created, no consent recorded, booking untouched. **Withdrawal:** the site's shared unsubscribe appends its own opt-out record (history kept) and the report shows "Unsubscribed"; a later "yes" is a new pending request that must be verified.
- No CRM, no mailing platform, no marketing email. The only new message is the one-off verification above.
- **Production needs nothing new for this:** it uses existing tables and existing secrets (`NAPKIN_UNSUBSCRIBE_SECRET` or the service key for signing, `EVIDENCE_HASH_SECRET`, `RESEND_API_KEY`, `SCHEDULING_EMAIL_FROM`). Confirm they exist before intake; they are not read here.

## Gate status

| # | Gate | Status |
|---|---|---|
| 1 | Canceled booking shows "Zoom pending" | **Fixed** (display only; stored history untouched) |
| 2 | Public endpoint abuse protection (E-04) | **Fixed to a launch-sufficient level**, with residual risks and decisions below |
| 3 | Email reliability (E-01) | **Two confirmed defects fixed**; one unavoidable residual |
| 4 | Recovery credentials | **Procedure and safe code support prepared**; nothing rotated; backup is Martin's action |
| 5 | Unattended monitoring | **Prepared** (two layers on Supabase); not activated; needs approvals below |
| 6 | Public booking configuration | **Reviewed**; host zone and community invitation (wording, consent, verification) decided and implemented; 10 decisions remain |

### 1. Canceled Zoom status
A canceled booking's Zoom link is not awaited: the list row, the agenda and the drawer no longer say "Zoom pending". The drawer now says "No meeting: removed with the cancellation" when sync is healthy. A failing cleanup still shows through the existing recovery label. One rule, `zoomAwaited` in `admin-views.ts` (confirmed and pending only). The stored provider-reference history is unchanged.

### 2. Abuse protection
Already present: per-IP limits (book 10/hour, community 30/hour, status 60/minute), idempotency, atomic overlap and daily caps, opaque references, aggregate-only public answers. Added:
- **Bounded bodies:** public POSTs are JSON only (415 otherwise), 16 KB cap checked on the declared length *and* while streaming (413), 1 KB for the community answer.
- **Cross-site refusal:** a state-changing public request that a browser marks cross-site, or whose Origin is another host, gets 403 before any limiter or handler runs.
- **Honeypot** on the booking form (`contactUrl`, hidden from people and assistive technology). A filled field gets a plain 400; nothing is created or sent.
- **Booking budget, fail closed:** after validation and before Google is queried or anything is sent, a new booking spends from 5 per recipient address per hour and 30 per hour overall. The recipient is keyed by a hash (no address in the limiter table). A repeat of an earlier idempotency key never spends budget. If the limiter cannot answer, booking is refused with 503 instead of running unmetered.
- **Availability queries:** per-IP 120→40 per minute, plus 300 per minute across everyone (protects Google quota; fails open); parameters length-checked; the range must lie within 2 days back and 400 days ahead (it was only "at most 70 days").
- **No customer data leakage:** tests assert the booking response, a refusal and the alert email contain no email, message, id, reference or credential.
The site's other forms already use a honeypot of the same kind; no bot-challenge service was introduced.
**Residual (decision 9):** email ownership is still not verified, so a determined person can still make the system send one confirmation to an address they do not own, at most 5 per address per hour. Vercel supplies the client IP header; limits are per IP.

### 3. Email reliability
Confirmed by test (a worker that dies after the provider accepted a message but before the ledger recorded it; the provider modelled on Resend's real 24-hour idempotency rules):
1. **Stuck retry loop.** If the retry's content differed (for example the Zoom link now exists), Resend refuses the reused key. The ledger never healed and the booking ended "needs attention" although the guest had the email. **Fix:** that refusal is read as "already accepted"; it is recorded as sent, *without* claiming the Zoom link was included, so the link still goes out separately once.
2. **Duplicate after 24 hours.** If the outcome of a send was unknown (timeout, 5xx, no answer) and recovery waited past the provider's window, the retry sent a second copy. **Fix:** an attempt whose outcome is unknown is marked so; once it is 20 hours old the system holds instead of resending and says so in the sync error ("check Resend, then use Resend confirmation"). A definite refusal (4xx) is still retried at any age.
Also: a ledger write that fails after the provider accepted is now recorded as an unknown outcome rather than a plain failure. The adapter now reads Resend's answer three ways: accepted, definitely refused, outcome unknown. No schema change and no key change.
**Unavoidable residual:** a worker killed in the milliseconds between the provider accepting and the ledger writing leaves no trace. A same-content retry is deduplicated by the provider; if recovery then takes longer than 24 hours, one duplicate is possible. The database still guarantees one accepted record per message.

### 4. Recovery credentials
See `STAGE-G-CREDENTIALS-RUNBOOK.md`. Code support added: recovery bearer overlap (`SCHEDULING_RECOVERY_SECRET_PREVIOUS`, validated at start-up) for a no-gap rotation; a stored Google credential is re-encrypted under the current key on first use (the old document claimed this happened on reconnect; it did not), never over a newer reconnection; `scripts/check-scheduling-keyring.mjs` validates the secrets offline and prints only fingerprints. **Not done:** the backup itself (Martin's step; the encryption key's only copy is the local staging file because Vercel's value is write-only), and no live secret was read or rotated.

### 5. Unattended monitoring
Two layers, both on Supabase, none depending on a Mac. See `PRODUCTION-ALERTING.sql` (review only).
- **Layer 1 (application):** a new route `/api/cron/scheduling-alert` (recovery bearer) is called every 5 minutes by a Supabase job. It checks heartbeat, Zoom and calendar scans, failed/overdue/cleanup/no-link bookings, uncertain Zoom creates and bounced guest email for appointments in the next 7 days. It emails martindubreuil13@gmail.com once when a problem appears or changes, again every 6 hours while it lasts, and once when it clears. A stalled worker is one alert, not three. Counts only: no guest details. Needs migration `20261105090000` (one tiny table).
- **Layer 2 (database only):** `sched_deadman_check()` emails through Resend directly from Postgres if the worker heartbeat is over 15 minutes old, so it works when Vercel or the application is down. Tested locally against the real `pg_cron`, `pg_net` and Vault versions (0 jobs/secrets left behind): quiet when fresh, one alert, no repeat, reminder after 6 hours, recovery notice, alert when never reported, loud failure with no secret, not executable by browser roles. It needs a **new Resend key restricted to "Sending access"** in a new Vault entry (free; needs approval; never the full-access key).
Honest limits: no paid service; both layers email the same single operator, so Martin must read that inbox; Layer 2's send is fire-and-forget (check `net._http_response`); alert delivery itself was only tested with mocks.

### 6. Public booking configuration review
Observed (local mock data, WebKit): mobile layout at 390 px and 320 px has no horizontal overflow; form fields are 16 px (no iOS zoom) and 49 px high; the confirmation page reads well; the 24-hour toggle (17 px tall) and time-zone select (23 px tall) are small touch targets (polish, not blocking). Timezones: guests are detected and can be changed; DST and guest-zone tests exist and pass. Chromium was not installed here, so only WebKit was run.

**Business decisions required from Martin (I did not invent rules):**
1. **Which meeting types go public.** None does today: the only production type is the inactive private test offering. Names, descriptions, durations, price labels. (Seed examples are samples, not offerings.)
2. ~~Host time zone~~ **Decided: Asia/Bangkok** (implemented, above).
3. **Weekly availability** per type: days, hours, breaks, days off.
4. **Booking horizon, minimum notice, slot interval, per-day cap, buffers** (buffer choices 0/15/30/45/60; default 30 after).
5. **Public or invitation-only** for each type; rotate any invitation code before use (the sample code is `private-preview`).
6. ~~Community invitation~~ **Decided and implemented**: final wording, consent in the Leads, email verification where the site asks for proof.
7. **Guest self-service.** Guests cannot cancel or reschedule themselves; they reply to the email. Accept for launch?
8. **Reminders.** None exist. Accept for launch?
9. **Email verification.** Confirm that the honeypot plus the budgets (5 per address and 30 per hour overall, 10 per IP) are enough, or add double opt-in or a bot challenge. Also the budget numbers themselves.
10. **A terms page** does not exist (not invented). Needed?
11. **Operator coverage.** Both contact addresses reach one person; response target undecided.
12. **Zoom host entitlement** for the durations you will offer (check in the Zoom account, no scope change).

## Exact files changed (git status against the base commit)
Modified (Stage G, all rounds): `app/admin/leads/page.tsx`; `app/api/scheduling/{book,community,slots}/route.ts`; `app/components/admin/scheduling/{Agenda,BookingDrawer,BookingsTable}.tsx`; `app/components/scheduling/{BookingExperience,CommunityModal}.tsx`; `app/lib/leads/admin-queries.ts` (additive: booking-origin contacts and a source label); `app/lib/scheduling/{admin-views,community,http-shared,http,integrations,providers,rate-limit,release-gates,repository,document-repository,seed,service,sync,types}.ts`; `app/lib/scheduling/adapters/{google-oauth,resend-email,supabase-repository}.ts`; older tests pinned to their original zone or updated for the new default: `buffers.test.ts`, `sync.test.ts`, `service.test.ts`, `admin-actions.test.ts`, `integration-routes.test.ts`, `admin-views.test.ts`, `contract.test.ts`, `adapters/adapters.test.ts`; `docs/mba-scheduling/production.env.example`.
New: `app/api/cron/scheduling-alert/route.ts`; `app/lib/scheduling/alerts.ts`; `app/lib/scheduling/adapters/{booking-budget,leads-consent}.ts`; `app/lib/community/verification.ts`; `app/api/community/verify/route.ts`; `app/community/verify/page.tsx`; `app/components/community/CommunityVerifyForm.tsx`; tests `abuse`, `alerts`, `community-leads`, `community-verification`, `credentials`, `email-reliability`, `host-timezone`; `scripts/check-scheduling-keyring.mjs`; two migrations (below); docs `PRODUCTION-ALERTING.sql`, `STAGE-G-CREDENTIALS-RUNBOOK.md`, `STAGE-G-INCIDENT-CLOSURE.md`, `STAGE-G-LAUNCH-PREPARATION.md`.
Publications and Transition source: untouched. Shared Leads code changed only additively (`admin-queries.ts`, the Leads list cell). The four pinned migrations and `RELEASE-MIGRATIONS.json` are untouched.

**New migrations (unapplied to production; applied twice to the local database):**
| File | SHA-256 |
|---|---|
| `20261105090000_mba_scheduling_alerting.sql` (alert state table) | `c863d5595a1216e56f45b1d78ac1f2529333c94b4663fb5b0acc0f33229cbc33` |
| `20261105100000_mba_scheduling_host_timezone.sql` (host zone default and the settings row) | `ef18838b1dd19d8e7c87e43f4461770bd84ad2235adf68a1740322b85e36de21` |

## Tests and builds
- TypeScript 0 errors; lint of all changed areas clean; `next build` succeeds.
- Full suite with the local database: **1,307 passed, 18 skipped, 0 failed** (release baseline 1,199 / 18). The earlier isolated Publications image-test timeout did not recur; Publications was not modified or reopened. Without a local-database settings file `supabase-service.test.ts` fails at collection (known audit item E-07).
- New since the first Stage G report: 7 host-timezone tests; 17 community-consent tests; **20 verification tests** (exact wording and preserved history; token forging, expiry and cross-token confusion; the pending flow; scanner-safe page; single use; withdrawal, re-request and suppression; export exclusion; email content; send failure and retry; the unchanged non-proof-required path); plus mode-guard tests. 35 protections have now been removed one at a time across Stage G; every removal makes a test fail, with one exception that is deliberate: the extra "suppressed" check in the new verification code is a second layer on top of the shared consent function, which refuses suppressed contacts on its own.

## Remaining launch gates (exact)
**Approvals only Martin can give (each is a separate approval; nothing below has been done):**
1. Review and freeze the release commit (not created).
2. Apply two additive migrations to production after a backup check: `20261105090000` (alert state table) and `20261105100000` (host zone Asia/Bangkok). No migration is needed for the community consent or verification.
3. Deploy the intake-closed build (operations on, intake off).
4. Activate the alert job (Layer 1 of `PRODUCTION-ALERTING.sql`); Layer 2 only if you approve a restricted sending-only Resend key.
5. A controlled production test with your own addresses: the booking lifecycle, the community answer on both paths, the verification email and link, and an unsubscribe. It sends real email and creates real resources, so it needs its own authorization and cleanup.
6. Finally, and only then, set `SCHEDULING_PUBLIC_INTAKE_ENABLED=true`.

**Work only Martin can do:**
7. Back up the encryption key per `STAGE-G-CREDENTIALS-RUNBOOK.md` (Vercel's value is write-only; the local staging file is the only copy).
8. Confirm the existing secrets the verification email and Leads evidence rely on are present in production (`NAPKIN_UNSUBSCRIBE_SECRET` or the service key, `EVIDENCE_HASH_SECRET`, `RESEND_API_KEY`, `SCHEDULING_EMAIL_FROM`).

**Business decisions still open (10):** which meeting types are public and their names, durations and labels; weekly availability; booking horizon, minimum notice, slot interval, daily cap and buffers; public versus invitation-only per type; guest self-service cancel/reschedule (none exists); reminders (none exist); whether the honeypot plus the booking budgets (5 per address and 30 per hour overall, 10 per IP) are enough or double opt-in or a bot challenge is wanted; a terms page; response target and who covers you; Zoom entitlement for the durations offered.

**Carried-forward gates now addressed, with residuals:** E-04 public abuse (budgets, bounded bodies, cross-site refusal, honeypot; residual: the booking address itself is still unverified); E-01 ambiguous email (two defects fixed; residual: a kill in the milliseconds between provider acceptance and the ledger write, then a recovery slower than 24 hours, can cause one duplicate); canceled "Zoom pending" label (fixed). Monitoring: prepared, not active, and both layers email one operator.

## Smallest safe deployment sequence (intake stays OFF until the last step)
1. **Approve the release commit** after review.
2. **Backup check, then migrations** `20261105090000` and `20261105100000`, in that order. Verify: `sched_alert_state` has RLS and no browser-role privileges; `home_time_zone` is `Asia/Bangkok`; existing bookings' `start_at` values are unchanged.
3. **Deploy** the intake-closed build. Verify: slots and booking still 404; `/api/cron/scheduling-alert` 401 without the bearer; health 200; `/community/verify` with no token says "not valid" and changes nothing; admin times show Bangkok; the canceled row no longer says "Zoom pending". Cross-origin POST 403, oversize body 413, hidden-field submission 400.
4. **Activate Layer 1 alerting**; observe three runs with no alert while healthy.
5. **Back up the key** (Martin).
6. **Create the real meeting type(s)** in the admin, inactive, with the rules Martin has decided (after the timezone migration, so availability is read in Bangkok).
7. **Controlled production test** (separately authorized, your own addresses): one booking through reschedule and cancel; the community answer once outside and once inside the proof-required list (use a country the test can simulate or a documented header); verify the email arrives, the link activates consent, the Leads report shows "Subscribed", the export includes it only after verification; unsubscribe and confirm "Unsubscribed". Delete the test resources and note the retained evidence.
8. **Open intake**: request approval to set `SCHEDULING_PUBLIC_INTAKE_ENABLED=true`, redeploy that exact configuration, check public availability without booking, and watch health and the alert job. Rollback is unchanged from the release preparation.
Optional, any time after step 4: Layer 2 (dead-man) alerting.
