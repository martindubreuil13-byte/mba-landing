# MBA Scheduling development connections — 2026-10-30

Google and Zoom are connected for LOCAL development only. No real appointment, Google event, Zoom meeting, invitation, or Resend email was created. No production change, deployment, commit or push was performed.

## Configuration

- Google project: **MBA Scheduling Development**, ID `sincere-charmer-513211-r5`. Google Calendar API enabled.
- OAuth client: **MBA Scheduling Local Development**, Web application; sole redirect `http://localhost:3000/api/admin/scheduling/google/callback`; no JavaScript origins.
- Consent: External / Testing; sole test user `martindubreuil13@gmail.com`. Scopes: `calendar.freebusy`, `calendar.events.owned`, `openid`, email (Google canonicalizes email as `userinfo.email`). Development refresh authorization expires after seven days in Testing; reconnect when needed. Production publishing is a separate decision.
- Google owner verified from authenticated Google UserInfo (`sub`, verified email) before saving. Only the designated email and `primary` calendar are accepted. Refresh token and PKCE verifier encrypted using AES-256-GCM. Local browser roles cannot SELECT either secret table; RLS enabled.
- Zoom app: **MBA Scheduling Development**, internal Server-to-Server OAuth, activated. Existing apps unchanged. Configured host: `martindubreuil13@gmail.com`.
- Exactly five Zoom scopes: `meeting:write:meeting:admin`, `meeting:read:meeting:admin`, `meeting:read:list_meetings:admin`, `meeting:update:meeting:admin`, `meeting:delete:meeting:admin`. Account-level capabilities are constrained to the configured host by application code; ownership must be verified before update/delete.
- Secrets reside in ignored `.env.development.local`, file permission 0600. A Google credential export in Downloads also has permission 0600. No secret values belong in this handover.
- Local modes: Supabase / Google live / Zoom live / email simulated. Preview email disabled; server started with empty Resend and OpenAI keys, bound to 127.0.0.1:3000. Production `.env.local` was not changed.
- No new Google, Zoom or Resend webhooks were registered. Development localhost is not a public webhook receiver.

## Verification

- 257 scheduling tests passed (13 files), including regression cases for scope narrowing, wrong/unverified/unavailable identity, saved-connection tampering, non-primary calendar rejection, and Zoom meeting ownership rejection/acceptance.
- TypeScript and focused lint passed; `git diff --check` passed.
- Actual Google adapter decrypted the saved credential, refreshed its access token and read primary-calendar free/busy. The probe permitted only token exchange and free/busy, with provider mutations explicitly rejected.
- Zoom issued an access token containing exactly the five intended scopes. Read-only listing of the configured host's meetings succeeded.
- Authenticated Integrations page returned HTTP 200 and showed Google connected and Zoom authentication verified. Email remained simulated.
- No configured secret values appeared in authenticated admin HTML, generated browser assets, or the development log. OAuth callback query logging is suppressed so authorization codes are not logged.
- Local scheduling bookings: zero. Three Phase 2 default meeting types and their availability are now configured in local Supabase: 30-minute Discovery, 60-minute Assessment, and 90-minute invitation-only Private session. Existing home time zone America/Toronto retained. File prototype and sample bookings preserved and not imported. Public Discovery and Assessment pages return 200, and live availability endpoints return slots. Email remains simulated.

## Before the controlled booking test

1. Review the now-configured LOCAL meeting types and availability. Confirm Toronto home time zone, duration and buffers before authorizing a real test.
2. Obtain Martin's approval for one real Google event/Zoom meeting and the exact test recipient. Keep all other recipients blocked; enable Resend only under a deliberate test allowlist if sending is approved.
3. Book one slot, verify provider IDs, join link, calendar event, collision prevention and branded delivery. Retry the same request to verify no duplicate.
4. Reschedule and cancel the test through supported local admin actions, verify provider changes and cleanup; do not assume external edits reconcile automatically (Phase 2A gap).
5. Return email to simulated and keep production/Transition/Calendly unchanged.

## Security changes

Google scopes/identity validation and primary-calendar enforcement; explicit server-only provider/vault boundaries; Zoom ownership checks; real read-only Zoom status checks; accurate local status notice; development OAuth callback log suppression. Unrelated Publications and Transition implementation was not edited.
