# MBA Scheduling: local prototype (Phase 1, 1.1 and 2A)

## Phase 2C: recovery automation, email safeguard, production readiness

See [PHASE2C-READINESS.md](./PHASE2C-READINESS.md): the real-process-kill recovery tests, the `pg_cron` finding, the development-only email safeguard, and the production readiness assessment (environment, migrations, Google / Zoom / Resend, deployment sequence, rollback). `recovery-cron.sql` is a production template and is not executed by anything.

## Phase 2B: background execution and recovery

A booking request now returns as soon as the booking is saved. Zoom, the Google event and the email run afterwards, and the confirmation page shows an honest "preparing" state until the Zoom link exists. See [PHASE2B-BACKGROUND-EXECUTION.md](./PHASE2B-BACKGROUND-EXECUTION.md) for the design, the options compared, the recommendation, recovery procedures and what must happen before real email. Local admin access: `node scripts/local-admin.mjs` (see the same document).

## Phase 2A: ready for real integrations (still all mocked)

Built and tested with mock providers and against **local** Supabase only. Nothing live is connected, nothing is migrated in production. The full technical handover (exact Google and Zoom configuration, scopes, credentials, connection steps, runbooks) is in **[PHASE2-HANDOVER.md](PHASE2-HANDOVER.md)**.

- **Buffers:** 0 / 15 / 30 / 45 / 60 minutes before and after each meeting type (new types default to 0 before, 30 after), enforced against every other meeting type and Google busy time, snapshotted on each booking, shown in the Meeting types screen. The database enforces the same rule with an exclusion constraint, so it holds even if the application is bypassed.
- **Supabase:** `supabase/migrations/20261101090000_mba_scheduling.sql` (11 `sched_*` tables, atomic functions, RLS with no browser access). `SupabaseRepository` and the prototype's file repository pass one shared contract suite, including real concurrency on local Postgres.
- **Google Calendar:** OAuth 2.0 + PKCE with single-use state, encrypted refresh token, free/busy, idempotent events, reconnect on expired credentials. **Zoom:** Server-to-Server OAuth, duplicate-proof meeting creation, update and delete. **Email:** the existing branded Resend shell, transactional only.
- **Sync and recovery:** after the database write, one idempotent routine updates Zoom, Google and email; failures retry with backoff and never lose a booking; the Integrations screen and each booking's "Retry now" show state. Webhooks (Zoom, Google, Resend) are signature-verified; public booking endpoints are rate limited.
- **Switches:** `SCHEDULING_BACKEND`, `SCHEDULING_GOOGLE`, `SCHEDULING_ZOOM`, `SCHEDULING_EMAIL`. All default to the prototype; each real integration needs its explicit switch and complete configuration (see `.env.example`).


Status: **local prototype on branch `feat/mba-scheduling`. Not committed, not deployed.** Simulated Google Calendar, Zoom and email; no database.

## Phase 1.1: what changed

**Public booking** redesigned toward a quiet, architectural look: ivory ground, hairline rules instead of boxes, light-weight display type, small tracked capitals, oxblood used sparingly. A sticky editorial column on the left (title, rule, description, spec list); on the right a numbered step indicator, a roomy month calendar (available days carry a small oxblood mark, the chosen day a thin ring) and times as ruled rows rather than boxed buttons. Details and confirmation use the same spec-sheet layout. On phones the next step moves to a bottom bar. All booking, time-zone and daylight-saving logic is unchanged (the 93 scheduling unit tests still pass).

**Admin preview** at `/scheduling-preview`: the real scheduling admin with no sign-in, **development only**. It renders the very same views and components as `/admin/scheduling`, wired to `/api/scheduling-preview/*`, which share one action dispatcher (`app/lib/scheduling/admin-actions.ts`) with the real admin API, so the two cannot drift apart.

**Admin refined** for usability over metrics: the Overview leads with *Next up* and an agenda grouped by day (no KPI tiles); every booking, wherever you find it (agenda, calendar, list), opens one drawer with Reschedule as the primary action, Resend, Copy link and a two-step Cancel; the calendar can jump to the next booking; bookings are searchable; meeting-type forms show everyday fields first and tuck notice/buffers/daily limit under "Booking rules"; simulations, the outbox and reset sit in a collapsed "Prototype tools".

### How the preview is made impossible in production
It answers 404 unless **all** of these hold (`app/lib/scheduling/preview.ts`): `NODE_ENV === "development"` (so never a build, `next start` or a test), not on Vercel (`VERCEL` / `VERCEL_ENV` unset), `APP_ENV` not production/preview, and the request `Host` is loopback (localhost, 127.0.0.1, ::1; a LAN address or a domain name gets 404). Its route handlers, pages and layout import no admin session, no Supabase and no `/api/admin` code (a static test enforces it), so it can neither bypass nor weaken `/admin` authentication, and it only reads and writes the simulated prototype data. The real admin is unchanged: `/admin/scheduling` still requires the signed-in admin (proxy + `requireAdmin`), and `/api/admin/scheduling/*` still answers 401 without a session.

For convenience `/book/*` and `/admin/scheduling` are now also enabled automatically under `next dev` (no env flag needed); a production build still needs `SCHEDULING_PROTOTYPE=true`, and nothing runs on Vercel.

## Run it

```bash
# 1. Your dev server (hot reload). RESTART it once after pulling these changes (Ctrl+C, then):
npm run dev
#    -> /book/*, /scheduling-preview and /admin/scheduling work with no environment flag.
# 2. A self-contained production-mode build on its own port (public pages + real admin; the preview is 404 here by design):
set -a; source .env.development.local; set +a
SCHEDULING_PROTOTYPE=true npx next build && SCHEDULING_PROTOTYPE=true npx next start -p 3200
```

Prototype data lives in `.prototype-data/scheduling.json` (git-ignored; shared by both servers). Delete it, or use **Prototype tools, Reset sample data** on the Overview, to start over.

| What | Dev server (npm run dev) | Production-mode build |
|---|---|---|
| Discovery booking page | http://localhost:3000/book/discovery-conversation | http://localhost:3200/book/discovery-conversation |
| Assessment booking page | http://localhost:3000/book/business-architecture-assessment | http://localhost:3200/book/business-architecture-assessment |
| Private session (invitation-only) | http://localhost:3000/book/private-architecture-session?invite=private-preview | same path on :3200 |
| Sample confirmation + community modal | http://localhost:3000/book/confirmed/demo-confirmation | http://localhost:3200/book/confirmed/demo-confirmation |
| **Admin preview, no sign-in** | **http://localhost:3000/scheduling-preview** | 404 (development only) |
| Real admin (needs sign-in) | http://localhost:3000/admin/scheduling | http://localhost:3200/admin/scheduling |

The sample confirmation can replay the community invitation (link at the bottom). A real booking ends on its own confirmation URL, `/book/confirmed/<opaque 144-bit token>`.

## What exists

**Public**: `/book/[meetingType]` (month calendar, times in the visitor's detected zone with a zone picker and 12/24h toggle, details, confirmation), `/book/confirmed/[reference]`, the one-time community modal. Visitors only ever receive start times and the public fields of one meeting type.

**Admin** (`/admin/scheduling`): Overview (upcoming, today, meeting types, canceled, activity, simulated outbox, prototype controls), Calendar (day / week / month), Bookings (filter, details, Reschedule, Resend confirmation, Copy booking link, Cancel), Meeting types (create / edit: name, description, duration, format, price label, visibility + invite code, notice, buffers, daily cap, slot spacing, link), Availability per type (weekly hours, breaks, days off, date overrides, booking window, home time zone, live "what visitors can book" preview).

**Prototype controls**: simulate a Google Calendar outage; simulate a Zoom failure; reset sample data.

## Architecture (concerns kept apart)

| Concern | Where |
|---|---|
| Time zones (IANA, DST) | `app/lib/scheduling/timezone.ts` |
| Availability rules engine (pure) | `availability.ts` |
| Meeting-type configuration + booking rules | `service.ts` (`SchedulingService`) |
| Booking records / persistence | `store.ts` (interface, memory), `file-store.ts` (prototype JSON file), `seed.ts` |
| Google Calendar | `providers.ts` (`CalendarProvider`, mock) |
| Zoom | `providers.ts` (`ZoomProvider`, mock) |
| Email | `notifications.ts` (composes messages into a simulated outbox; no email client is imported) |
| Community consent | `community.ts` (wording + version) + `SchedulingService.recordCommunity` (simulated) |
| Wiring | `instance.ts` (the only file that chooses concrete collaborators) |
| Switch | `prototype.ts`; HTTP plumbing `http.ts` |
| UI | `app/components/scheduling` (public), `app/components/admin/scheduling` (admin) |

### Time zones and DST
Rules are wall-clock times in the administrator's **home zone**; every working window is converted to real instants date by date, so 9:30 stays 9:30 local across DST while UTC moves. Bookings are stored as UTC ISO instants plus the guest's IANA zone. Nonexistent local times (spring forward) move forward by the gap; ambiguous ones (fall back) take the first occurrence ("compatible" rule); a window spanning a transition keeps its true length. Formatting is hand-written, not locale-based, so server and browser render identical text.

### Reliability behaviour implemented (and tested)
- Slot re-checked at confirmation against calendar + all confirmed bookings (all meeting types), with each event's own buffers.
- Serialised read-check-write (`store.mutate`): five simultaneous requests for one slot produce one booking.
- Idempotency key per booking attempt: retries and concurrent duplicates return the same booking and send one message; reusing a key for a different booking is refused.
- Calendar outage: availability hidden and bookings refused (fail closed, retryable 503). Zoom failure: booking kept, link "pending", logged.
- Cancel is idempotent and frees the slot; reschedule validates the new slot (the booking's own time counts as free) and keeps history.
- Public URLs carry only an opaque token; confirmation shows first name only; invite codes never reach visitors.

## Known prototype limitations
- **Not a real double-booking guarantee across servers.** The lock is in one Node process over one file. Phase 2 needs a database transaction + exclusion constraint.
- Google, Zoom and email are mocks: no invitation or `.ics`, no real Zoom link, no message sent. The Zoom link is `https://example.com/simulated-zoom/<id>`.
- Community consent is simulated: it records an answer with wording and version, subscribes nobody, and does **not** apply the site's regional consent rules (`app/lib/consent`). Phase 2 must route through that library.
- No visitor-side cancel/reschedule (admin only); no rate limiting or bot protection on `/api/scheduling/*`; no payments; Zoom is the only format.
- The mock calendar's busy times are deterministic pretend commitments.
- Admin actions rely on the existing admin session (SameSite cookies); there is no separate CSRF token.
- Single administrator and a single home zone.
- Verified in Chrome (Playwright) at desktop and 390 px width. **Safari was not machine-tested** (no WebKit driver installed); the APIs used (Intl, `<input type="date|time">`, `crypto.randomUUID` with fallback) are supported in current Safari.

## Phase 2 proposal

1. **Supabase persistence.** Tables: `meeting_types`, `availability_rules` (or JSONB on the type), `bookings` (`start_at`/`end_at timestamptz`, `guest_tz`, `status`, `reference`, `idempotency_key unique`, `source`, Zoom/Google ids), `booking_events`, `outbox`, `scheduling_settings`. Exclusion constraint on `tstzrange(start_at - buffer, end_at + buffer) WITH &&` for confirmed bookings (btree_gist) so double bookings are impossible at the database; `SchedulingStore.mutate` becomes an RPC/transaction. RLS on, service-role access only, as for the existing `program_*` tables. Implement `SchedulingStore` over Supabase and swap it in `instance.ts`; nothing above it changes.
2. **Google Calendar.** OAuth (server-side refresh token, encrypted), `freeBusy` for availability and conflicts across selected calendars, write an event per booking (attendee = guest, so Google sends the calendar invitation), update/delete on reschedule/cancel, push-notification channel or periodic sync to notice outside edits. Keep the fail-closed behaviour on outage; cache `freeBusy` briefly.
3. **Zoom.** Server-to-Server OAuth app; create the meeting after the slot is reserved, store id + join URL, update on reschedule, delete on cancel. On failure keep the booking, retry from a queue, email the link when it exists (already modelled as `zoom.status = "pending"`).
4. **Email.** Send through the existing policy-checked client (`app/lib/email-client.ts`) with the existing branded shell, plain-text part, no tracking pixels, idempotency keys per message, delivery status from the existing Resend webhook, transactional only. `notifications.ts` already produces the content.
5. **Community consent.** Replace the simulation with `recordExplicitOptIn` / `requestOptIn` according to `consentRequiredFor(region)`, store wording + version (`scheduling-community-v1`) as consent evidence, keep the choice independent of the booking.
6. **Cutover.** Per-program links (e.g. Transition) switch from Calendly to `/book/...` behind a flag; the booking `source` carries the program; the existing Website Intelligence conversion hooks fire from the confirmed booking. Visitor self-service cancel/reschedule via a tokenised link; rate limiting and bot protection on the public API; `.ics` attachments; reminders.

## Where Codex's help is most useful
- Review the exclusion-constraint design and the transaction boundaries (the part the prototype can only simulate).
- Google OAuth token storage/rotation and webhook/channel renewal; Zoom S2S app setup and error taxonomy.
- Independent DST audit: extend `timezone.test.ts` with zones that have unusual transitions (Lord Howe, Morocco/Ramadan, zones with historical rule changes) and adversarial inputs.
- Accessibility pass on the calendar grid (arrow-key navigation, screen-reader announcements) and the focus handling in both modals.
- Security review of the public API surface (abuse, enumeration of references, invite-code handling).
