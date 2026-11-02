# Controlled production end-to-end test plan

2 November 2026. **Plan only. Nothing in this document has been executed.** No form is submitted, no email is sent and no booking is made until Martin authorizes a specific run in writing (section 9). It covers the release now live (`0e2ac5c`, `dpl_EHNNF84ssV4t1hbpkEwTiAnQwFFr`) and lists the extra checks to add after each Phase 2 stage.

## 1. Purpose

Prove, with real providers and Martin's own mailbox, the journeys that unit tests and mocks cannot: Transition application and program inquiry, the emails, the booking link, name and email prefill from the reference, a real booking with Zoom and Google, reschedule, cancellation, and clean-up.

## 2. Test identity

- **Visitor address:** a Gmail plus-alias, `martindubreuil13+mba-e2e-YYYYMMDD@gmail.com`. It lands in the same inbox but is a **separate lead**, so the existing lead for `martindubreuil13@gmail.com` (which already holds a community answer) is never modified, and all test rows are found by one exact address. If the plain address is preferred, say so; it changes the clean-up (section 8).
- **Name:** `MBA E2E Test`. **Message/answers** start with `[E2E TEST - ignore]` so any stray row is recognisable.
- **Where mail arrives:** inquiry owner notification at `martin@mindrasolutions.com`; applicant and visitor mail, booking confirmation and the owner booking notice at the Gmail inbox. Check both mailboxes.
- Marketing opt-in boxes stay **unchecked**. In the community pop-up choose **Not now**. In the analytics banner, decline unless testing analytics (section 6).

## 3. Pre-flight (read-only, before any submission)

1. Release checkout clean, on `0e2ac5c` (or the approved Phase 2 commit); production alias points at the expected deployment (`vercel alias ls`, `vercel inspect`).
2. Public booking intake ON and healthy: `/book/complementary-session` 200; `scripts/check-scheduling-health.mjs` healthy; recovery sweep and alert jobs recent. (Reconnect the Supabase connector first; it was down on 2 November.)
3. Baseline counts recorded read-only: leads, `program_applications`, `program_invitation_sends`, `sched_bookings`, email attempts, community answers; plus the latest Resend dashboard entries.
4. Martin picks the slot (suggest at least 48 hours ahead, on a day with nothing else booked) and is at the computer for the whole run. Total time about 40 minutes.
5. Confirm no other real customer booking is in progress.

## 4. Side-effect inventory (what each step really creates)

| Step | Real effects |
|---|---|
| E1 inquiry | owner email (mindrasolutions inbox), auto-reply to the alias, one `inquiry` conversion row |
| E2 Transition application | lead row, application row, invitation email, owner/applicant notices as configured |
| E3 booking | booking rows, Zoom meeting, Google event on the primary calendar (no guest invite), owner booking email, guest confirmation email, possible community answer |
| E4 reschedule | updated Zoom/Google, reschedule emails to both |
| E5 cancel | Zoom meeting and Google event deleted, cancellation emails to both |

Expected total email volume: roughly 8 to 10 messages across the two mailboxes. Anything beyond this list is a stop condition.

## 5. Scenarios against the live release

Record for each: pass or fail, time, screenshot, **message identifiers only** (never full email bodies in the report).

| # | Steps | Expected |
|---|---|---|
| E0 | Read-only: open `/transition`, `/lets-talk`, `/book/complementary-session` on desktop and phone width; click each booking button without submitting | 200; button reads "Book Your Complimentary Session"; URL is `/book/complementary-session` with a `source` value; form empty |
| E1 | Submit a program inquiry from a program page (alias, marker message) | Success screen with the booking button; owner email arrives; auto-reply arrives with the same button and link; link has `source=inquiry-<slug>`; **no reference and no prefill** (inquiries are not stored in this release: documents the known gap) |
| E2 | Submit the Transition application (alias) | Confirmation screen with the booking button; invitation email arrives and says 45-minute Zoom conversation; the invitation link carries `source=transition` and a `ref` |
| E3 | Open the link from the **email** | Name and email prefilled; `ref` disappears from the address bar; pick the slot; confirm | Confirmation page with Zoom link; guest email and owner email arrive; Google event shows Zoom link and no invitee; admin Bookings shows source `transition`; pop-up appears once after confirmation (choose Not now) |
| E4 | Reschedule from the manage link in the confirmation email | Same booking moves; one reschedule email each; Zoom and Google show the new time; admin shows `rescheduled` event |
| E5 | Cancel from the manage link | Status canceled; cancellation emails; Zoom meeting gone (404) and Google event removed; admin shows `canceled` |
| E6 | Read-only: open `/book/complementary-session?ref=<24 random characters>` | Normal empty booking page, no error, no prefill |
| E7 | Phone width walk-through of E2 to E3 on the real device (Safari), start to the confirmation screen | No overflow; buttons fully visible; pop-up readable |

Order: E0, E6, E1, E2, E3, E4, E5. E7 can be done during E2/E3 on the phone.

## 6. Additional checks per Phase 2 stage (added when that stage is approved)

- **After 2a (storage, exchange):** one inquiry stores exactly one row and sends exactly one owner email and one auto-reply; double-click and refresh-then-resubmit create no second row or email; the auto-reply link carries `#r=`, the form prefills, the fragment is removed before the page settles; with analytics consent granted in a private window, no request URL or GA `page_location` contains the reference; Vercel request logs show no reference for the new link format; Gmail and Resend click-tracking do not strip the fragment; erase endpoint removes the test inquiry's message; purge dry-run reports it as not yet due. Honeypot and limiter are verified by tests only (a live flood is not run).
- **After 2b (linking):** a booking made from the inquiry link and one from the Transition link each have a `booking_origins` row; a booking from a plain link has none; reschedule and cancel keep the single link.
- **After 2c (admin):** the lead timeline shows inquiry, auto-reply, booking, reschedule and cancellation in order; the Transition Booking column matches; the bookings drawer shows "Came from"; a booking with the same email but no reference appears only as "Probable".
- **Expiry (60 days)** cannot be waited out in production: it is verified by tests, and by one old application row only if Martin has one.

## 7. Monitoring and stop conditions

- Watch during the run: the minute recovery job, the alert job (an alert email during the test is not by itself a failure, but note it), Vercel runtime logs for non-200 and error-level lines on the booking routes.
- **Stop immediately** and report if: an email goes to any address other than Martin's two mailboxes; more than one Zoom meeting or Google event appears for the booking; a prefill shows another person's data; a reference appears in a log, an analytics request or a visible URL after load (Phase 2); the confirmation page does not show the Zoom link within five minutes; the health check turns unhealthy.
- Do not retry a failed step blindly. Diagnose first; never click "Retry sync" on an uncertain Zoom create (see `STAGE-E-OPERATIONS.md`).
- Emergency close of intake: promote the last intake-off build `dpl_3p7kX6cJ3NBok4uNcVwpBsqHvU1r` (older code, old Calendly links), or redeploy the current commit with intake off. Both need Martin's word.

## 8. Clean-up (each destructive step needs its own authorization)

1. **Cancel the booking through the product's cancel flow** (E5), not by deleting provider resources by hand. Verify Zoom 404 and no active Google event carrying the booking id.
2. Test rows (lead, application, invitation sends, inquiry): left in place by default. Removal, if wanted, is a targeted delete by the **exact alias address**, listed to Martin first with row counts. The append-only `consent_records` and the conversion/analytics rows by design remain; the test marker identifies them.
3. Remove the test emails from mailboxes if desired (Martin's own).
4. Final read-only counts compared to the baseline; difference must equal the inventory in section 4.

## 9. Authorization needed

To run, Martin states in writing: which scenarios (for example "E0 to E7"), the address (alias or plain), the chosen slot, and whether clean-up step 2 is authorized now or later. Anything not named is not run. This plan is separate from, and does not extend, any earlier approval.

## 10. Report format

Per scenario: result, evidence reference, deviations. Then: emails received (count and sender), provider resources created and removed (Zoom id, Google event id), database difference against baseline, logs reviewed, risks found, and clean-up status.
