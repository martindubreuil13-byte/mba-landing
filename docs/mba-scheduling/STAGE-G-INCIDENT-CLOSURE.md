# Stage G incident closure report

1 November 2026. **Closed.** Cleanup was performed under Martin's explicit authorization, limited to the two resources created by an unauthorized local test. Nothing else was touched. No commit, push, deployment or change to public booking.

## What happened
A local development server in the release checkout loaded the live-development configuration, and a test booking submitted through it created a real Zoom meeting, a real Google Calendar event and one real owner-notification email (booking `68b09f13-4e16-4c46-a908-aed0ca3d0b9a`, Tuesday 3 November 2026, 13:00–13:30 Asia/Bangkok). The guest email went to an `example.test` address and was simulated. Production was never involved; the database was the local Supabase stack.

## Identification (before any deletion)
Searched through the approved accounts, read-only first.

| Resource | Evidence that it is the incident's, and only it |
|---|---|
| Zoom meeting `86332821033` | Exactly **one** upcoming meeting on the configured host carried the exact agenda `mba-booking:68b09f13-4e16-4c46-a908-aed0ca3d0b9a`. Topic "Discovery Conversation: Local Mobile Tester", start 2026-11-03 06:00Z, 30 minutes, timezone Asia/Bangkok, host matched the configured host. |
| Google event `mbac1183d6f447672b86841123d3efd9` | Exactly **one** event on martindubreuil13@gmail.com's primary calendar carried the private property `mbaBookingId = 68b09f13-…`. Same title, 13:00–13:30 +07:00, created and organized by that account, location was the Zoom link. |
| Ambiguity check | The calendar had one other event that morning (04:00–09:00Z). It carries no booking ID and belongs to someone else; it was not touched. |

Deletion was never based on time alone. The deletion script re-read each resource immediately beforehand and **refused** unless the marker (Zoom) or booking ID (Google) matched.

## Deletion
- Zoom: DELETE returned 204. Calendar-event deletion used `sendUpdates=none` (the event had no attendees): Google returned 204.
- No application cancel workflow was used. **No cancellation email was sent.** The one owner email already delivered when the booking was created cannot be recalled; it is the only email the incident produced.

## Independent verification (fresh reads afterwards)
- Zoom: `GET /meetings/86332821033` → **404**; listing the host's upcoming meetings: **0** with the marker.
- Google: **0 active** events carrying the booking ID. (Google retains a "cancelled" tombstone, as in Stage F.) The unrelated neighbouring event was still present: the window went from 2 events to 1 only because of the deletion.
- No new booking was created after the incident (checked in the local database).
- Production bookings, customer data and other appointments: not accessed or changed.

## Local record
The local row for that booking was already marked canceled with a plain SQL update (no provider call) so it stops disturbing local test suites; its stored provider references had been overwritten with mock ones by a later mock-only test run, which is why the real IDs were found by marker instead.

## Why it cannot happen again (ordinary UI testing)
**Cause:** a development env file that sets Google, Zoom and email to "live" was enough to make `next dev` use the real providers, and email "test mode" delivers real mail to the owner's own address.

**Fix (in the release code, `readModes` in `integrations.ts`):** outside production every provider is a **mock** unless the process is started with the explicit variable `SCHEDULING_ALLOW_LIVE_DEV=true`. A development env file full of live settings and credentials is no longer enough. In production the explicit settings still decide, unchanged.

**Proof:**
- Tests: a development env file with every live setting and credential present yields `google: mock, zoom: mock, email: simulated`; the opt-in must be exactly `true`; building the whole service from such a file gives no Google client, no stored connection and a simulated email provider.
- Reproduction of the incident setup: with the same live-development env file linked into the release checkout and a dev server started, the booking page banner read **"Local prototype · simulated calendar, Zoom and email"**. I only read the page; I submitted nothing. The server was stopped and the link removed.
- The env file is not linked into the release checkout now, and no server is running.

**Two limits to know:**
1. This protection exists in the release checkout. The original `mba-site` checkout (branch `feat/mba-scheduling`) does not have it yet, so `next dev` there with its `.env.development.local` can still reach the real providers. Until the release code replaces it, read the banner first and never submit a booking while it says "live".
2. To use live providers deliberately in development, put `SCHEDULING_ALLOW_LIVE_DEV=true` on the command line for that one run, never in a file.

A memory note recording the rule is saved for future sessions.
