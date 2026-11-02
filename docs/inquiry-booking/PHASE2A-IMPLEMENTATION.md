# Phase 2a: stored inquiries and protected booking references

2 November 2026. Branch `feat/phase2a-inquiries`. **Built and tested locally. Not deployed, migration not applied to production, every switch off.** The production system is unchanged until Martin approves the release steps in section 6.

Decisions applied (Martin, 2 November): J thresholds (5/hour per client, 3/day per address, 60/hour global as a log-only signal), K (stale references may still link a booking in 2b; they never pre-fill), L (failed owner e-mails stay visible in admin; retention policy applies), M (minimal read-only Inquiries list), N (fragment links, scoped exchange, existing links keep working), O (fail closed).

## 1. What changed

| Area | Change |
|---|---|
| Database | One new table, `program_inquiries` ([migration](../../supabase/migrations/20261106090000_program_inquiries.sql)). No existing table is altered. |
| `/api/qualify` | With `PROGRAM_INQUIRY_STORE_ENABLED`: the inquiry is saved first, then the owner is notified once, then the visitor is answered once. With it off: byte-for-byte the previous behaviour (verified by test: no database, no limiter, no token, no provider options, same response). |
| Abuse protection | Hidden field, signed form-age token (2 s to 24 h), same-site check, 64 KB cap, 5/hour per client, 3 new inquiries/day per address, 60/hour global as a log warning only. |
| Booking links | With `BOOKING_REF_EXCHANGE_ENABLED`: the reference is in the URL fragment (`#r=...`) for Transition links and the inquiry reply. Off: the original `&ref=` form. The page understands both. |
| Booking page | An inline script (runs before hydration and before any analytics) moves `#r=` into memory and removes it and any `?ref=` from the address bar and history entry. The page then makes one `POST /api/scheduling/booking-context` (reference in the body) to fill the visitor's own name and e-mail into empty fields. |
| Pre-fill | Now expires 60 days after the reference was issued (inquiry: received; application: later of submission and latest accepted invitation e-mail). Expired, unknown and malformed references behave identically (empty form). Booking is never blocked. |
| Retention | Daily cron `/api/cron/inquiry-retention` (second entry in `vercel.json`). Blanks messages older than `INQUIRY_RETENTION_MONTHS` (default and maximum 24, clamped). Reports only until `PROGRAM_INQUIRY_PURGE_ENABLED`. |
| Erasure | `POST /api/admin/inquiries/erase` (administrator, same-site): by inquiry id or by e-mail address. Leaves the lead and consent history to the existing tools. |
| Admin | New read-only page `/admin/inquiries` and nav link. Failed notifications are shown as "Delivery failed" with the provider's reason. |

## 2. Switches (all off unless exactly `true`)

| Variable | Effect when `true` |
|---|---|
| `PROGRAM_INQUIRY_STORE_ENABLED` | Stored-inquiry path of `/api/qualify`; challenge endpoint; pre-fill reads inquiries |
| `BOOKING_REF_EXCHANGE_ENABLED` | Fragment links; `booking-context` endpoint answers; the inquiry success screen and reply carry the reference |
| `PROGRAM_INQUIRY_PURGE_ENABLED` | The cron actually blanks expired messages |
| `INQUIRY_RETENTION_MONTHS` (optional) | 1 to 24, default 24 |
| `INQUIRY_FORM_SECRET` (optional) | Signing secret; falls back to `NAPKIN_UNSUBSCRIBE_SECRET`, then the service key, with a label of its own |

The saved Vercel project variables still hold the Stage B scheduling values, so every deployment must continue to repeat the standing scheduling overrides; these new switches are runtime-only (`-e`, no `-b` needed).

## 3. Behaviour guarantees (each has a test)

- **Durable or nothing.** The row is committed before anything is sent. If it cannot be saved (database down, lead cannot be created, claim fails) nothing is sent, no conversion is counted, and the visitor gets a retryable 503. A saved row with no accepted owner e-mail is never reported as success.
- **Existing failure behaviour kept (A).** Owner e-mail not accepted: the visitor sees the same error as today (502/503 and the same wording); the row stays, is marked failed with the reason, appears in admin, and a retry sends again.
- **No duplicates.** One conditional UPDATE decides who sends the owner notification; the provider key is `inq-owner-<id>-<failures>` (a crash between "provider accepted" and "recorded" re-uses the key); the visitor reply is claimed once and never retried; a repeat of an accepted inquiry returns success and sends nothing; identical simultaneous requests give one row and one e-mail (also proven on real Postgres with 12 parallel claims); content with no key is de-duplicated within ten minutes; corrected words on a retry replace the unsent text and never an accepted one.
- **People.** The lead is created without marketing consent; an existing lead's name, country and opt-in are never changed by a public form.
- **References.** 144-bit random; fragment form never reaches servers, logs or Referer; never logged (a test scans log output and source); exchange is POST-body, `no-store`, rate limited, same-site, JSON-only, 1 KB cap, 404 while off, identical answers for unknown/expired/malformed.

## 4. Migration and rollback

**Migration:** `supabase/migrations/20261106090000_program_inquiries.sql`: creates `public.program_inquiries` with a foreign key to `leads`, unique indexes on `booking_ref` and `idempotency_key`, check constraints on statuses, an updated-at trigger, row-level security **enabled with no policies** (service role only). Idempotent (`if not exists`, `drop trigger if exists`). Nothing is read or written by code while the switches are off, and the previous release ignores the table, so it can be applied before or after the deploy.

**Rehearsed on the local database:** applied twice without error; duplicate key, duplicate reference, bad status and missing lead are all refused; `anon` and `authenticated` read nothing and cannot insert; trigger updates `updated_at`. The test rows were removed afterwards.

**Production steps (separate approval required):** verify the project is `sbntzyivfhvogxiiysuh` and a recent backup exists; apply the file; insert the `schema_migrations` row as in Stage G; verify the table exists with RLS on and zero rows.

**Rollback:**
1. Remove the three switches and redeploy (or promote the previous deployment): behaviour is exactly the previous release. Stored rows stay and cost nothing.
2. Fragment links already e-mailed still work on the previous build (an empty form; booking is unaffected).
3. Dropping the table (`drop table if exists public.program_inquiries;`) is possible only while Phase 2b's `booking_origins` does not exist and only if the stored inquiries are not needed. It is not part of a normal rollback.

## 5. Security findings

1. **Proxy and spoofing (verified on production, read-only GETs).** The existing limiter works behind the proxy (a burst of 60 requests: 41 served, 19 refused with 429). Sixty requests that each claimed a different address in `x-forwarded-for` were all counted as one client (40 served, 20 refused), so the platform discards a forged value. The new helper uses the **last** entry of that header (the one the proxy wrote), so it is right under that behaviour and also if a proxy ever appended instead of replacing. `x-vercel-forwarded-for` and `x-real-ip` are fallbacks that were not testable from outside (no echo endpoint); they are used only when the forwarded chain is absent. With no usable address the per-client limit is skipped instead of putting everyone in one bucket.
   - The site's shared `getClientIp` (used by the booking limits) reads the **first** entry. That is safe today only because of the proxy behaviour above. Recommendation, separate change: use the same helper there.
   - The probe made about 170 harmless 400 responses on the availability endpoint and briefly filled this machine's own bucket.
2. **Analytics.** `ga.ts` sends `page_location` with `window.location.search`; a legacy `?ref=` can therefore reach GA for consenting visitors unless it is removed first. The inline script now removes it before hydration; fragments are not part of the reported address. No error-reporting or session-replay package is installed (asserted by test).
3. **Logs.** Fragment references never reach request logs. Legacy `?ref=` links already e-mailed are visible in platform request logs for as long as those e-mails are used; accepted, and expiry limits the window.
4. **Residual exposure of the fragment.** A browser's own history database may keep the original URL, depending on the browser, even though the history entry is rewritten. If e-mail click tracking is enabled at Resend, Resend stores the link (with the reference) on its side. Both to be checked in the end-to-end test.
5. **Limiter fails open** (kept, by design, so a limiter outage cannot block real inquiries). Persistence still cannot be bypassed because storage is required. Left open: a determined attacker with many addresses can still cause about five auto-replies per hour per client to strangers; the per-client and token controls bound it.
6. **Global threshold is a signal, not a control.** Watch Vercel logs for `INQUIRY VOLUME`, `INQUIRY NOT STORED`, `INQUIRY NOT DELIVERED`, `INQUIRY LIMIT`.
7. **Pre-fill discloses a name and e-mail to whoever holds the reference.** Unguessable, rate limited, expires at 60 days, uniform answers. No other field can leave the adapter.
8. **A pre-existing weakness fixed on this path:** the shared lead upsert would let any form rename a lead; inquiries use a path that never does.
9. **Signing secret.** Falls back to existing server secrets when `INQUIRY_FORM_SECRET` is unset (the site already does this for its other signed tokens). A dedicated secret is optional.

## 6. Release steps (nothing below has been done)

1. Approve and apply the migration (section 4).
2. Deploy the branch commit with all switches **off** and the standing overrides, intake ON; verify the live inquiry, Transition and booking pages behave as before and `/admin/inquiries` shows "No inquiries have been saved yet" or "not available" before step 1.
3. Update the privacy notice (draft below) in the same release or immediately before activation.
4. Activate together, in one deployment: `PROGRAM_INQUIRY_STORE_ENABLED=true`, `BOOKING_REF_EXCHANGE_ENABLED=true`, `PROGRAM_INQUIRY_PURGE_ENABLED=true`.
5. Run the controlled end-to-end test (`PRODUCTION-E2E-TEST-PLAN.md`, section 6 "After 2a") with Martin's authorization.
6. Rollback at any step: remove the switches and redeploy.

**Draft addition to the privacy notice** (not applied; wording and legal fit for Martin to confirm):
> When you send a message through the inquiry form, the site now saves your name, e-mail address, the program you chose, your message and the page you came from, so that Martin can reply and keep a record. Messages are kept for up to 24 months and then removed; your name and the fact that you wrote stay on record. Sending a message does not subscribe you to anything. You can ask for your messages to be deleted at any time (see "Getting in touch"). The confirmation e-mail and the booking link you receive contain a private reference that lets the booking page fill in your own name and e-mail for 60 days; it contains no personal information.

## 7. Verification (local)

- **Whole suite:** 1,449 passed, 18 skipped (the same 18 as before), including the real-Postgres suites with the loopback settings linked only for the run and removed afterwards. New: 85 tests in `app/lib/inquiries/*`, `app/api/qualify/stored.test.ts`; the real-Postgres file `app/lib/inquiries/local-db.test.ts` (7 tests, added to the one-file-at-a-time project).
- **Type check, lint, production build:** clean.
- **Mutation checks:** 31 deliberate breakages (claim guard, idempotency lookup, auto-reply claim, honeypot, token, both limits, address helper, expiry, retention clamp and cutoff, lead rename, global threshold, expiry oracle, logging a reference, same-site on erase, fragment links, legacy strip, RLS policy, switch defaults, fail-closed, stale claim, provider key, exchange and purge switches, pre-fill switch, accepted-text overwrite, re-sent-invitation window, cross-site post). 30 caught at once; the first one that survived (overwriting accepted text) exposed a missing test, which was added and then caught. One mutant ("always attempt the send path") is equivalent: the atomic claim already refuses an accepted row, so the extra guard is defence in depth, not a separate protection.
- **Not done, by instruction:** no real inquiry, e-mail, booking or Zoom/Google call; no production migration, switch or deployment.

## 8. Remaining operational risks

- **Fail closed means a database outage now stops inquiries** while the switch is on (the owner would also see no e-mail). Turning the switch off restores the earlier behaviour in minutes.
- **A second cron** is added to `vercel.json`; confirm the plan allows it before deploying (it uses the existing `CRON_SECRET`). It cannot delete anything until the purge switch is on, and the first expiry is 24 months away.
- **No alert on volume or failures** beyond log lines; the scheduling alert job does not watch inquiries. Failed notifications are visible on `/admin/inquiries`.
- **Phase 2b is required for linking** a booking to its inquiry; until then references only pre-fill.
- Stale-reference linking (K) is designed but belongs to 2b; in 2a an expired reference is dropped by the browser after the exchange.
- The calendar forward-navigation fix (G) is separate and not included.
- Admin list shows the latest 200 inquiries and no filters (minimal by request).
