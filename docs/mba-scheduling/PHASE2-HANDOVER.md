# MBA Scheduling: Phase 2A technical handover (for Codex)

Branch `feat/mba-scheduling`. Status: **built and tested with mocks and against LOCAL Supabase only. No real Google, Zoom, Resend or production database was touched. Nothing is committed, migrated in production, or deployed.** Your job is to connect the real accounts and go live, in the order below. Stop and ask Martin before spending money or sending real email.

## 0. What exists now

| Concern | Where | State |
|---|---|---|
| Buffers (0/15/30/45/60, default 30 after) | `availability.ts`, `service.ts`, `constants.ts`, admin form | done, enforced in engine **and** database |
| Persistence | `supabase/migrations/20261101090000_mba_scheduling.sql`, `adapters/supabase-repository.ts` | done; applied to **local** DB only |
| Repository seam | `repository.ts` (interface), `document-repository.ts` (prototype), contract tests | done; both pass one contract |
| Google Calendar | `adapters/google-oauth.ts`, `google-calendar.ts`, `supabase-connection.ts`, `token-vault.ts` | done against a fake `fetch`; **never run against Google** |
| Zoom | `adapters/zoom.ts` | done against a fake `fetch`; **never run against Zoom** |
| Email | `adapters/resend-email.ts` (existing shell + `createResend`), `notifications.ts` | done; never sent |
| Sync / recovery | `sync.ts`, `/api/cron/scheduling-sync` | done, tested |
| Webhooks | `/api/webhooks/scheduling/{zoom,google,resend}` | done, signature-verified |
| Rate limiting | `rate-limit.ts` on `/api/scheduling/{book,slots,community,replay}` | done |
| Wiring | `integrations.ts` (switches), `instance.ts` | defaults to mocks; live is opt-in per integration |

Everything is behind `schedulingPrototypeEnabled()` (off on Vercel always). **That guard is the go-live switch** (section 8).

## 1. Architecture in one paragraph

Postgres is the authority for rules and records and is written first, atomically. Double bookings are prevented by a database **exclusion constraint** on a padded time range (`start - buffer_before .. end + buffer_after`) over confirmed bookings of **every** meeting type, so two meetings can never be closer than their buffers allow whatever the application does. Idempotency is a unique key plus a request fingerprint; the per-day cap is an advisory-locked count in one transaction. Google Calendar is the external availability source (free/busy, read live; our own events are subtracted so a booking never blocks itself). After the database write, `BookingSync.run(bookingId)` brings Zoom, the Google event and the email up to date. It is idempotent (deterministic Google event id; Zoom meeting found by a marker in its agenda before creating; one accepted email per booking/kind/version enforced by a unique index), runs inline for the happy path, and the cron endpoint retries failures with backoff (1m, 5m, 30m, 2h, 12h; gives up after 8, then waits for a human "Retry now").

## 2. Verify before connecting anything

```bash
npx vitest run app/lib/scheduling      # 240 tests; the Postgres suites run when local Supabase is up
npx tsc --noEmit -p . && npx eslint app/lib/scheduling app/api app/components
```
Local database (never production): `supabase status`, apply with `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20261101090000_mba_scheduling.sql` (re-runnable). The DB tests refuse to run against a non-loopback URL.

## 3. Supabase (do first)

1. Review `20261101090000_mba_scheduling.sql`. It is additive (11 `sched_*` tables, 6 functions); it references `consent_records(id)` and `set_updated_at()`. Run Supabase **security advisors** after applying.
2. Apply to the **production** project **before** deploying code that sets `SCHEDULING_BACKEND=supabase`. Martin approves this step explicitly.
3. RLS is on for all tables with **no policies** and privileges revoked from `anon`/`authenticated`; only the service role reaches them. Confirm with the contract test `gives the browser roles no access at all`.
4. Env (Production only): `SCHEDULING_BACKEND=supabase` (uses the existing `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Preview/Development must keep pointing at the isolated project (the existing `assertDatabaseAllowed` guard applies).
5. Create the meeting types (Discovery, Assessment, Private) through the admin Meeting types screen (or SQL). Set the home time zone (`sched_settings.home_time_zone`, default `America/Toronto`).

## 4. Google Calendar (account and permissions)

**Account:** the Google account that owns the calendar Calendly currently reads. Authorisation is interactive and must be done by Martin (consent screen) or with Martin present.

**Google Cloud project**
1. Create a project (e.g. `mba-scheduling`). Enable **Google Calendar API**.
2. **OAuth consent screen**: app name "MBA Scheduling", support/developer email, authorised domain `modernbusinessarchitect.com`. Scopes (exactly these; do not add more):
   - `https://www.googleapis.com/auth/calendar.freebusy` (read free/busy)
   - `https://www.googleapis.com/auth/calendar.events.owned` (create/update/delete events on owned calendars; application restricted to primary)
   - `openid`, `email` (identify the connected account)
3. **Publishing status must be "In production".** In "Testing" Google expires refresh tokens after 7 days, which would silently break scheduling weekly. An unverified app with sensitive scopes shows a warning screen but works for a single owner; verification is only needed beyond the 100-user cap. Confirm current Google policy before relying on this.
4. **Credentials > OAuth client ID > Web application.** Authorised redirect URIs: `https://<production-domain>/api/admin/scheduling/google/callback` and, for testing, `http://localhost:3000/api/admin/scheduling/google/callback`. The code builds the redirect from `APP_BASE_URL` unless `SCHEDULING_GOOGLE_REDIRECT_URI` is set; they must match exactly.

**Environment (Production):**
```
SCHEDULING_GOOGLE=live
SCHEDULING_GOOGLE_CLIENT_ID=...   SCHEDULING_GOOGLE_CLIENT_SECRET=...
SCHEDULING_TOKEN_KEY=$(openssl rand -base64 32)     # mark Sensitive in Vercel; back it up in the password manager
SCHEDULING_BACKEND=supabase
```
**Connect:** sign in to `/admin/scheduling/integrations`, press **Connect Google Calendar**, grant both calendar permissions (the code refuses a grant missing either, or one without a refresh token). Reconnect/Disconnect from the same page.

**Security corrections:** Google requires a successful authenticated Google UserInfo response with nonempty `sub`, `email_verified=true`, and email `martindubreuil13@gmail.com` before saving credentials. Saved connections must match that owner, `primary`, and the required owned-event scope before any token is used. Calendar overrides other than `primary` are rejected. Zoom reads meeting details and checks `host_email` (for configured email) or `host_id` (for configured ID) before update/delete; unverified ownership fails closed. Its Integrations status now runs a token/read-only host-access check and reports `connected` or `connection_failed`, rather than inferring connectivity from variables. Provider and vault modules explicitly import `server-only`.

**Development setup:** Use a separate project/client and only `http://localhost:3000/api/admin/scheduling/google/callback`. External Testing consent is acceptable during local development but refresh credentials expire after seven days; production publishing/verification is a separate release decision. Keep `SCHEDULING_EMAIL=simulated` and `PREVIEW_EMAIL_ENABLED=false`. No booking test is authorized yet.

**Behaviour to know:** the connected calendar is `primary`. Events are created with a deterministic id, `sendUpdates=none` (Google does not email the guest; our branded email does; set `SCHEDULING_GOOGLE_INVITE_GUEST=true` to also invite). A 401 refreshes once; a dead credential (`invalid_grant`, revoked, password change) marks the connection **needs_reauth**, stops retrying, blocks new bookings with a calm "temporarily unavailable", and shows "Reconnect". Outages/429/5xx retry with backoff then fail closed. Push notifications (`events.watch`) are **not** created by this code; the endpoint exists and verifies `X-Goog-Channel-Token` (`SCHEDULING_GOOGLE_CHANNEL_TOKEN`) for Phase 2B.

## 5. Zoom (account and permissions)

**Account:** Martin's Zoom account. Previously verified: Martin has Zoom Workplace Pro with a licensed 100-participant, 30-hour host allowance. Basic hosts have a 40-minute limit, including 1:1 meetings. **Do not purchase anything**; report the limit.

1. Zoom App Marketplace > Develop > Build App > **Server-to-Server OAuth** (not OAuth, not JWT). Needs account-owner/admin (role "can manage apps").
2. App credentials: **Account ID**, **Client ID**, **Client Secret**.
3. **Scopes** (granular; confirm exact names in the app's Scopes tab): create meeting (`meeting:write:meeting:admin`), update meeting (`meeting:update:meeting:admin`), delete meeting (`meeting:delete:meeting:admin`), list meetings (`meeting:read:list_meetings:admin`), read meeting (`meeting:read:meeting:admin`). The code calls: `POST /users/{host}/meetings`, `GET /users/{host}/meetings?type=upcoming`, `PATCH /meetings/{id}`, `DELETE /meetings/{id}`.
4. **The host:** `SCHEDULING_ZOOM_USER_ID` = the host's Zoom user id or email. **Required**: with S2S OAuth the alias `me` is invalid, so the client refuses to start without it.
5. Optional **Event Subscriptions**: endpoint `https://<production-domain>/api/webhooks/scheduling/zoom`, event **Meeting > Meeting has been deleted**; copy the app's **Secret Token** into `SCHEDULING_ZOOM_WEBHOOK_SECRET`; press Validate (the endpoint answers the challenge). If the host deletes a meeting by hand, the booking stands and a new meeting is created; resend the confirmation to share the new link.
6. Activate the app. Env: `SCHEDULING_ZOOM=live`, `SCHEDULING_ZOOM_ACCOUNT_ID`, `..._CLIENT_ID`, `..._CLIENT_SECRET`, `..._USER_ID`.

Meetings are created as scheduled (type 2), UTC start, waiting room on, marker `mba-booking:<bookingId>` in the agenda (used to avoid duplicates after a lost response).

## 6. Email (Resend)

The sender domain `mindrasolutions.com` was verified earlier (DKIM, SPF, tracking off) for the Transition flow. Booking emails use the same `createResend()` policy client and the same branded shell; transactional only (no unsubscribe, no tracking, no marketing).

1. Env: `SCHEDULING_EMAIL=resend` (and optionally `SCHEDULING_EMAIL_FROM`, `SCHEDULING_EMAIL_REPLY_TO`).
2. Register a **second** Resend webhook to `https://<production-domain>/api/webhooks/scheduling/resend` (events: delivered, bounced, failed/delivery_delayed; **not** opened/clicked), put its `whsec_...` in `SCHEDULING_RESEND_WEBHOOK_SECRET`. If the Resend plan limits webhooks, instead add a scheduling branch to the existing route (it is deliberately untouched).
3. Non-production environments keep the existing email policy: nothing is delivered except to the admin allow-list.
4. Do **not** send a real email without Martin's go-ahead. Test with the admin address only.

## 7. The retry worker

`GET /api/cron/scheduling-sync` with `Authorization: Bearer $CRON_SECRET` runs every due retry (idempotent, concurrency-safe: bookings are claimed with a lock). It is **not** in `vercel.json`: Hobby cron is at most daily. Options, cheapest first: (a) a GitHub Actions schedule (every 5 min) calling the URL with the secret; (b) Supabase `pg_cron` + `pg_net` calling it; (c) a daily `vercel.json` cron as a backstop only. Inline sync handles the happy path, so this is for recovery.

## 8. Going live (the explicit switch)

1. Replace `schedulingPrototypeEnabled` in `app/lib/scheduling/prototype.ts` with a production flag (e.g. `SCHEDULING_ENABLED=true`) that is **allowed on Vercel**; keep `VERCEL`-off for anything prototype-only. The preview (`/scheduling-preview`) must stay development-only (`preview.ts`, unchanged).
2. Remove the "Local prototype" banner (`app/book/layout.tsx`) and the prototype notices on the confirmation page; replace simulated copy.
3. Community invitation: replace the simulation with the site's consent library (`recordExplicitOptIn` / `requestOptIn` per `consentRequiredFor(region)`), storing the `consent_record_id` in `sched_community_consents`. Wording version is `scheduling-community-v1`.
4. Link each program/CTA to `/book/<type>`; Transition keeps Calendly until Martin decides.
5. Add the Google/Zoom/Resend/Supabase env vars to **Production only**.

## 9. Runbooks

- **Google needs reconnecting** (banner on Integrations, bookings show "temporarily unavailable"): Integrations > Reconnect. Existing bookings are unaffected; the sync worker retries Google writes afterwards.
- **Zoom or Google outage:** nothing to do. Bookings stand, the guest is told the Zoom link will follow, retries run with backoff; "Zoom details" is emailed once the link exists.
- **A booking shows "Gave up":** fix the cause, open the booking, press **Retry now** (or `POST /api/admin/scheduling/bookings/{id}/retry-sync`).
- **Suspect a duplicate:** `select provider, external_id, count(*) from sched_external_refs group by 1,2 having count(*)>1` (the unique index makes this impossible); `select booking_id, kind, version, count(*) from sched_email_attempts where status='accepted' and kind<>'confirmation_resend' group by 1,2,3 having count(*)>1` (likewise).
- **Rotate `SCHEDULING_TOKEN_KEY`:** set the new key + version, keep the old as `..._PREVIOUS` (+ `_PREVIOUS_VERSION`); the stored token still decrypts and is re-encrypted on the next reconnect (`TokenVault.needsRotation`). If the key is lost, reconnect Google.
- **Restore:** all state is in Postgres; Google events and Zoom meetings are recreated by the sync worker from the booking records.

## 10. Known gaps (decide with Martin)

Google push channel creation/renewal and reconciliation of events edited in Google; visitor self-service cancel/reschedule and `.ics`; reminders; multiple calendars (only `primary`); admin pagination for very large booking histories; the rate limiter fails open if its own database call fails (consistent with the site); per-booking guest invitation by Google is off by default; Zoom licensing limits; consent library integration (section 8.3).

## 11. Security notes for review

Secrets: refresh token encrypted AES-256-GCM with the purpose as AAD (cannot be swapped between columns); OAuth `state` hashed, 10 minutes, single-use via `DELETE ... RETURNING`; PKCE; granted scopes verified; client secret and tokens never logged or returned (tests assert it); `describeIntegrations` returns names of missing variables, never values. Webhooks: constant-time HMAC with 5-minute replay window (Zoom, Resend), shared-token check (Google); all refuse when unconfigured. Public booking URLs carry only a 144-bit token; the confirmation page exposes a first name only. Static tests (`isolation.test.ts`) fail if providers leak out of `adapters/`, if any code builds its own database or email client, if credentials appear in code, or if the Transition flow is imported.
