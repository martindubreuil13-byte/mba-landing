> **Superseded for implementation detail by [RELEASE-REPORT.md](RELEASE-REPORT.md)** (one switch instead of three; one release instead of three stages; no purge switch).

# Phase 2 architecture proposal (v2): inquiries, booking links and one admin view

Version 2, 2 November 2026. v1 is preserved in git history (`dde2a45`). **Proposal only. Nothing here is implemented, migrated or deployed.** Written against production commit `0e2ac5c`. Each stage (2a, 2b, 2c) needs its own approval; every database migration needs a further explicit approval after the target project and backup are verified, as in Stage G.

## 1. Decisions recorded (Martin, 2 November 2026)

| | Decision | How it is applied |
|---|---|---|
| A | Keep the existing owner-email failure and safe-retry behaviour | Visitor sees an error when the owner email is not accepted; retry is safe and never duplicates (see 4.2). |
| B | Separate `program_inquiries` table | Section 4.1. |
| C | Configurable retention, 24-month maximum, with a deletion mechanism and privacy requirements considered | Section 4.5. |
| D | Booking-reference prefill expires after 60 days; expiry must never block ordinary booking | Section 5.3. |
| E | Legacy Calendly columns stay dormant | Never written, never read by new code. |
| F | Probable email matches are read-only hints, never automatic links | Section 6. |
| G | Calendar forward-navigation fixed separately | **Removed from this proposal.** Gets its own small change request. |
| H | Order 2a, then 2b, then 2c, each separately approved | Section 7. |

Additional requirements and where they are met: accepted inquiry durably persisted (4.2), no duplicate rows or emails on retry (4.2), abuse protection (4.3), reference protection against analytics, lookup and logging (5.2), status derived from authoritative booking records (6.2), flags default off with rollback compatibility (7, 8).

## 2. Verified starting point

- **Inquiry:** `/api/qualify` validates, emails the owner (`martin@mindrasolutions.com` unless `INQUIRY_NOTIFY_EMAIL` is set), emails the visitor, stores nothing, and has no limiter or idempotency.
- **Transition application:** `program_applications` with `booking_ref` and `receipt_token` (18 random bytes each, base64url, 24 characters), person in `leads`, invitation sends in `program_invitation_sends`.
- **Booking:** `sched_bookings.status` is only `confirmed` or `canceled`. **A reschedule updates the same row** (`sched_reschedule_booking` bumps `version` and writes a `rescheduled` event). A link to the booking id therefore survives rescheduling and cancellation. There is no stored "completed" state.
- **Prefill today:** `inquiryPrefill` reads `program_applications.answers` by `booking_ref` with **no age limit** and returns `{name, email}`. The page strips `ref` from the address bar in a client effect (`BookingExperience.tsx:41`).
- **Limiter today:** the site's `checkRateLimit` (Postgres upsert, keyed on client IP from `x-forwarded-for`), **fails open**, and its own comment calls it "a cost-control guard, not a security boundary". The booking endpoints use it with `RATES` (book 10/hour, per-recipient 5/hour, global 30/hour).
- **Analytics:** GA4 is consent-gated, page views are manual, and `ga.ts:118` sends `page_location` **including `window.location.search`**. The first-party analytics and attribution read only named `utm_*` parameters.
- **Headers:** no `Referrer-Policy` is configured, so the browser default applies (cross-site requests receive the origin only).
- **Crons:** `vercel.json` has one cron (`intelligence-maintenance`, daily).

## 3. Contradictions found, and how each is resolved

| # | Conflict | Resolution |
|---|---|---|
| C1 | v1 said persistence "fails open" (send the email even if the database write fails). Your requirement says a successfully accepted inquiry must be durably persisted. | **Fail closed when the flag is on.** Success is returned only after the row is committed **and** the owner email is accepted. If the write fails, send nothing, return a retryable error (503). Trade-off: a database outage now blocks inquiries, where today it would not. Turning the flag off restores the old behaviour. |
| C2 | v1 put ref expiry in 2b, but prefill from inquiries ships in 2a. | Expiry moves to **2a**, and applies to the existing application prefill too (code only, no migration). |
| C3 | v1 put erasure tooling in the 2c admin UI, but data starts accumulating in 2a. | 2a ships the purge job and an admin-authenticated erase endpoint plus runbook (no UI). The admin button comes in 2c. |
| C4 | v1 said "best-effort" for the `ref` in the URL. That does not meet the analytics and logging requirement: GA sends `search` in `page_location`, the strip runs in a later client effect with no ordering guarantee, and the platform's request log normally records the full URL (to confirm in the log viewer). | New links carry the reference in the **URL fragment**, which browsers never send to servers (section 5.2). Legacy `?ref=` links already in inboxes keep working. |
| C5 | A cookie would be the other way to hide the reference, but the site is deliberately cookieless. | No cookie. Fragment plus a one-time exchange request instead. |
| C6 | "Prevent duplicate emails on retry" versus decision A (retry re-sends when the owner email failed). | A per-inquiry state machine: retry re-sends **only** if the owner email was not accepted. See 4.2. |
| C7 | The existing limiter fails open and keys on IP. Failing open is acceptable for cost control but weak as "abuse protection"; a hard global cap would let an attacker block real inquiries. | Layered, no single point of denial. See 4.3. IP use is the site's existing limiter practice; confirm it is acceptable for this endpoint (decision J). |
| C8 | v1's `booking_origins` required exactly one of `application_id` / `inquiry_id`, but erasing an inquiry or lead must not delete the booking. | Foreign keys are `on delete set null` and the check is "at most one", with `origin_type` kept. A booking whose origin was erased shows "origin removed". |
| C9 | Decision D versus linking: should a stale reference still link a booking to its origin? | Expiry removes **prefill (disclosure)** only. A stale but valid reference may still **link** (it discloses nothing). This is my interpretation; a stricter reading is decision K. |
| C10 | Failed inquiries (owner email not accepted) are told "not sent" yet would be stored. | Keep the row for safe retry, mark `undelivered`, show it in admin, and blank its message after 30 days unless it was later accepted (decision L). |
| C11 | Clients with cached JavaScript send no idempotency key. | The server accepts a missing key and derives one from email, message and a 10-minute window. |
| C12 | 60-day expiry measured from the first send would break a Transition invitation re-sent from admin on day 90. | Applications: measured from the latest accepted `program_invitation_sends` row. Inquiries: from `created_at`. No new column on `program_applications`. |
| C13 | The shared `upsertLeadPreservingOptIn` overwrites an existing lead's `first_name` with whatever a form supplies. With public inquiries, anyone could rename a lead by typing its email. | Inquiries use a create-or-touch path that **never overwrites** an existing lead's name or country. |

## 4. Stage 2a: persist inquiries, protect references

### 4.1 Table (additive migration, needs approval)

`public.program_inquiries`: `id`, `lead_id → leads(id)`, `program_slug`, `full_name`, `situation`, `message`, `attribution jsonb`, `booking_ref` (unique, same generator as applications), `idempotency_key` (unique), `content_hash`, `owner_status` (`pending | accepted | failed`), `auto_reply_status` (`pending | accepted | failed | blocked`), provider message ids, error text, `delivered_at`, `message_purged_at`, `created_at`, `updated_at`. RLS enabled, no browser policies, service role only. No columns added to any existing table.

### 4.2 Behaviour (flag `PROGRAM_INQUIRY_STORE_ENABLED`, default off)

1. Validate and apply the limiter (4.3).
2. Create-or-touch the lead (`ongoing_content_opt_in` stays false; an inquiry is not marketing consent; C13).
3. Insert or fetch the inquiry by `idempotency_key`. If the write fails: return 503, send nothing (C1).
4. **Claim the owner send** with a conditional update (`pending/failed → sending`) so two simultaneous retries cannot both send. Send with a provider idempotency key derived from the inquiry id and attempt kind. Record the outcome.
5. Owner not accepted: return the existing error (A); row stays `failed`. A retry with the same key re-sends. Owner accepted: send the auto-reply once; its failure never fails the request.
6. A retry whose first attempt already succeeded (lost response) returns success and sends **nothing**. Auto-reply is likewise sent at most once.
7. The booking link in the auto-reply and success screen uses the inquiry's reference (5.2) with `source=inquiry-<slug>`.

`/api/qualify` response shape stays unchanged for the flag-off path and for clients. The lets-talk form adds a per-submit key; double-clicks and back/forward resubmits reuse it.

### 4.3 Abuse protection (layered)

1. **Honeypot field** and a **signed form-age token** (rejects submissions faster than a human, or older than a day). Silent success-look-alike rejection.
2. **Per-client** limit (suggest 5/hour) and **per-recipient email** limit (suggest 3/day, protects third parties from auto-reply spam), on the existing limiter.
3. **Global soft ceiling** (suggest 60/hour) that returns "please try again shortly" plus the direct contact address, and raises the existing alert path. It rejects rather than silently drops, and is set high enough that the limiter, not an attacker, is not the likeliest cause of lost inquiries.
4. Strict validation already present; message capped at 5,000 characters; body size cap like the booking routes; same-site check like `assertSameSite`.
5. Optional edge layer: a Vercel Firewall rate rule on the endpoint (dashboard action, not code).

The limiter's fail-open behaviour is kept so that a limiter outage never blocks a real inquiry; the persistence requirement (C1) still holds. Every layer gets a mutation check (section 9).

### 4.4 Privacy

Inquiry text becomes stored personal data: update the privacy notice and the legal-assumptions list before activation. The owner notification email remains in the mailbox and Resend logs, which this retention does not cover (state this in the notice review). Admin-only visibility. Existing Transition `answers` have no retention rule today; out of scope, noted as a gap.

### 4.5 Retention and deletion (decision C)

- `INQUIRY_RETENTION_MONTHS`: default 24, **clamped to 1–24** in code so it cannot be raised past the maximum by mistake. Applied at purge time from `created_at`, so changing it applies to existing rows.
- Daily job (a second Vercel cron entry, bearer-authenticated like the existing one; flag `PROGRAM_INQUIRY_PURGE_ENABLED`, supports dry-run): blanks `message` and `situation`, sets `message_purged_at`; keeps the lead, program, timestamps and statuses. Batch-limited and idempotent. Never touches `consent_records` (append-only by design).
- Erasure on request: admin-authenticated `POST` endpoint plus runbook SQL, available from 2a, deleting the inquiry row (and the lead only when nothing else references it). Booking links survive as "origin removed" (C8).
- The purge flag must be enabled in the same step that enables storage, or the activation checklist records a dated exception.

## 5. Stage 2b: link bookings to their origin

### 5.1 Table (additive migration, depends on 2a)

`public.booking_origins`: `booking_id` (pk, → `sched_bookings`), `origin_type` (`application | inquiry`), `application_id` / `inquiry_id` (`on delete set null`, at most one set), `lead_id` (`on delete set null`), `linked_at`, `matched_by` (`context`). **No reference is stored.** Written by a new scheduling port `bookingOrigin` (adapter in `app/lib/scheduling/adapters/`), after the booking commits; a failure is logged (without personal data) and never fails or delays the booking. Flag `BOOKING_ORIGIN_LINKING_ENABLED`.

### 5.2 Protecting references (flag `BOOKING_REF_EXCHANGE_ENABLED`, ships in 2a)

- **New links** use `…/book/complementary-session?source=…#r=<ref>`. Fragments are not sent to the server, not in request logs, not in `Referer`. A tiny inline script removes the fragment before hydration, and therefore before any consented GA page view is sent.
- The page POSTs the reference **in the body** to a new `booking-context` endpoint. The response is `{ prefill: {name, email} | null, context }`, where `context` is a signed, two-hour token holding only the origin id and expiry (no personal data). The booking request carries `context`; the server verifies it and (2b) writes the link. The raw reference is never kept in page state, URL, storage or later requests.
- **Unauthorized lookup:** references are 144 bits of randomness, the endpoint is rate-limited, `no-store`, and returns the same shape for unknown, expired and malformed references (no existence oracle).
- **Logging:** references and contexts never appear in logs or events; a test scans captured log output. The audit tables store origin ids only.
- **Analytics:** a browser test with analytics consent granted checks every outbound request URL and the GA `page_location` for the reference.
- **Legacy `?ref=` links** (emails already sent by `0e2ac5c`) keep working: handled server-side as today with expiry, then redirected (303) to the clean URL. This leaves their reference in request logs for the life of those emails; accepted, since the number is tiny.
- The signing secret is a new production secret (`BOOKING_CONTEXT_SECRET`); if not set the code derives one from the existing server key as other site tokens do. Setting it is a production change and needs approval.

### 5.3 Expiry (decision D)

Prefill is offered only while the reference is under 60 days old (C12). An expired, unknown or malformed reference gives a normal, empty booking form with no error and no notice that a reference existed. Linking behaviour for a stale-but-valid reference: C9 / decision K.

## 6. Stage 2c: one view in admin

### 6.1 Shape

Lead detail (`/admin/leads/[id]`) becomes the timeline: inquiry or application received, auto-reply / invitation with delivery outcome, booking, community choice. The Transition table's "Calendly: Not connected" column becomes a live Booking column. New Inquiries list (filters by program and status). The booking drawer gets a "Came from" line. Erase action (calls the 2a endpoint).

### 6.2 Status is derived, never stored

A single pure mapping reads the authoritative records:

| Shown | Source |
|---|---|
| Received / Undelivered | inquiry or application row and `owner_status` |
| Invited | `program_invitation_sends` (and auto-reply status for inquiries) |
| Booked: date | `sched_bookings.status = 'confirmed'` and its **current** `start_at` (so a reschedule shows the new time automatically) |
| Canceled | `sched_bookings.status = 'canceled'` |
| Time passed | confirmed and `end_at` in the past. There is no stored "completed" or "attended" state, so the label does not claim one. |
| Rescheduled / sync problems | `sched_booking_events` and `sync_status`, shown as annotations |

If a booking has several links over time (a person books, cancels and books again), the timeline shows each booking; the headline status uses the latest non-canceled booking. Legacy Calendly columns are not read (E). Read-only queries go through a scheduling read adapter so the isolation tests still hold.

### 6.3 Probable matches (decision F)

Bookings with no origin link whose attendee email equals a lead's email are shown as "Probable: same email" on the lead and the booking. Read-only, never written, never used for status headlines; admin only.

## 7. Staged rollout

| Stage | Contents | Migration | Flags (all default off) |
|---|---|---|---|
| 2a | `program_inquiries`; storage, retry safety, limiter, honeypot; create-or-touch lead; reference exchange and fragment links; prefill from inquiries; prefill expiry; purge cron; erase endpoint | 1 table | `PROGRAM_INQUIRY_STORE_ENABLED`, `PROGRAM_INQUIRY_PURGE_ENABLED`, `BOOKING_REF_EXCHANGE_ENABLED` |
| 2b | `booking_origins`, `bookingOrigin` port, context verified at booking | 1 table (needs 2a's table) | `BOOKING_ORIGIN_LINKING_ENABLED` |
| 2c | Journey module, timeline, Booking column, Inquiries list, drawer line, erase button | none | none (admin-only) |

Each deployment repeats the standing overrides with intake ON and uses the verified release-checkout process. After 2a the stored inquiries have no admin screen until 2c; the erase endpoint and the owner email cover the gap (option: pull the read-only Inquiries list into 2a).

## 8. Migration and rollout risks

1. **Ordering:** the 2b migration has a foreign key to the 2a table, so 2b can never be applied first, and the 2a table must never be dropped once 2b exists. Rollback is by flag, not by dropping.
2. **Code rollback with tables present** is safe: both tables are additive and `0e2ac5c` ignores them. Links already emailed with `#r=` simply give an empty form on the old build; booking is unaffected.
3. **Purge job and rollback:** the cron route disappears with an older build, so a rollback pauses purging. The activation checklist records when it was last verified to run.
4. **Row-level security:** both tables must ship with RLS enabled and no policies; the migration test asserts anon and authenticated roles cannot read them.
5. **Lead side effects:** inquirers become rows in `leads` with no source marker. They appear in `/admin/leads` and in lead counts and dashboards (a metric shift). Marketing exports and consent flows already require `ongoing_content_opt_in`, and Transition already creates leads this way, but a pre-activation check must confirm no sender mails every non-suppressed lead and that the member-access layer never treats an unconfirmed lead as a member.
6. **Idempotency scope:** provider idempotency keys expire after a day; the database state machine is the real guard, so a retry later than that still cannot double-send.
7. **Limiter coupling:** the limiter's table is shared with the booking endpoints; inquiry limits use their own key names so inquiry traffic cannot consume booking budget.
8. **Production migration:** applied only on approval, after verifying project `sbntzyivfhvogxiiysuh` and a recent backup, with `schema_migrations` rows, as in Stage G. Both migrations are rehearsed on the local Supabase stack first.
9. **Cron addition** changes `vercel.json`; the cron count and plan limits must be checked before 2a.
10. **Secrets:** `BOOKING_CONTEXT_SECRET` (optional) and the existing cron bearer are the only configuration touching production.
11. **Existing data:** no backfill. Past inquiries were never stored; existing bookings have no origin. A one-time read-only email-match report may be produced on request.
12. **Metrics:** the Phase 2 "inquiry" conversion event is already recorded on owner-email acceptance; storage must not add a second event.

## 9. Testing (no live providers)

- Retry matrix: same key twice; owner failure then success; success with lost response; concurrent duplicate; missing key; double-click. Assert row count and send count each time.
- Persistence failure returns 503 and sends nothing; flag off reproduces `0e2ac5c` behaviour exactly (response shapes included).
- Limiter and honeypot rejections; third-party protection via the per-recipient cap.
- Reference: fragment links; legacy query links with redirect; expiry at 59/60/61 days; expired reference still allows booking; unknown vs expired give identical responses; no reference in captured logs, events or audit rows; browser test of every outbound URL with analytics consent granted.
- Linking: valid context links, tampered or expired context is ignored, failed link never fails the booking, reschedule and cancel keep one link and the derived status follows.
- Retention: clamp, dry-run, idempotent batches, consent records untouched, erase endpoint requires admin.
- Mutation checks removing each protection (key, claim, state check, honeypot, limiter, RLS, clamp, signature check, at-most-one constraint) and confirming a test fails.
- Migration rehearsal and RLS probe on the local stack; whole suite and build before every deploy.

## 10. Open items for Martin

- **J.** Confirm the inquiry endpoint may use the existing IP-keyed limiter (the site already stores these transient keys), and the suggested numbers (5/hour per client, 3/day per email, 60/hour global).
- **K.** Should a stale (over 60 days) but valid reference still link the booking to its origin (recommended), or be ignored entirely?
- **L.** For inquiries whose owner email never succeeded: keep visible in admin and blank the message after 30 days (recommended), or blank immediately?
- **M.** Add the read-only Inquiries list to 2a so stored inquiries are visible straight away, or wait for 2c?
- **N.** Approve fragment-based links and the exchange request (C4/C5), including the extra request on page load.
- **O.** Approve the fail-closed behaviour in C1 (an outage of the database blocks new inquiries while the flag is on).
