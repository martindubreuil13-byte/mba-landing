# Phase 2 architecture proposal: inquiries, bookings and one admin view

2 November 2026. **Proposal only. Nothing in this document is implemented, migrated or deployed.** It is written against production commit `0e2ac5c`. Every change below needs Martin's review first; each numbered stage needs its own approval, and every database migration needs a separate explicit approval.

## 1. Where things stand today

| Area | What exists | The gap |
|---|---|---|
| Transition application | Saved in `program_applications` (answers, attribution, opaque `booking_ref` and `receipt_token`, idempotency key), person upserted into `leads`, invitation emails tracked in `program_invitation_sends` with signed delivery outcomes. | None for storage. |
| Program inquiry (`/lets-talk`, `/api/qualify`) | Validates, emails the owner, emails the visitor an auto-reply. **Stores nothing.** Success means the owner email was accepted. | The inquiry exists only in Martin's mailbox. No lead, no history, no reference, no way to see it in admin, no abuse limiter on the endpoint. |
| Booking | `sched_bookings` (+ `sched_attendees`, `sched_booking_events`). Has a `source` text (e.g. `transition`, `inquiry-<slug>`, `answers`) and the attendee email. | No foreign key or record of which application or inquiry produced the booking. The booking page can prefill name and email from an application `ref`, but the ref is not saved with the booking. |
| Legacy Calendly tables | `program_bookings`, `program_applications.booking_status / booked_at / meeting_at`. The webhook is dormant. | The Transition admin table has a "Calendly" column that always reads "Not connected". |
| Admin | `/admin/leads`, `/admin/programs/corporate-transition`, `/admin/scheduling/bookings` are three separate views. | Nobody can see "this person applied, was invited, booked Tuesday" in one place. |

Constraints that shape every option: the scheduling module may touch the database only through adapters in `app/lib/scheduling/adapters/` (enforced by isolation tests); no personal data in URLs; consent is recorded separately from the form that collected the data; the site is cookieless and stores no IP or IP hash; public booking intake stays ON throughout.

## 2. Principles

1. **Additive only.** New table(s) and columns; nothing dropped or rewritten. Old Calendly-era tables stay as they are.
2. **One person, one lead.** People remain canonical in `leads` (unique on email). Inquiries, applications and bookings hang off the lead.
3. **Opaque references, never personal data in a link.** The existing `ref` pattern (16–64 random URL-safe characters) is reused.
4. **Never lose an inquiry.** Persistence must not make the existing email path less reliable.
5. **Derive, don't duplicate, status.** One timeline computed from the source records; no second copy that can drift.
6. **Feature-flagged, independently reversible stages.**

## 3. Part 1: persist program inquiries as leads

### Options

| | A. Reuse `program_applications` | B. New `program_inquiries` table (recommended) |
|---|---|---|
| Fit | Applications have Transition-specific constraints (`ai_route`, `status` in INVITED/UNDER_REVIEW/…, invitation ledger). An inquiry is a free-text message with an optional program. | Matches the real shape: person, optional program, situation, message, attribution. |
| Side effects | Inquiries would appear in the Transition admin table and need its statuses. Constraints would need loosening. | Transition code and admin untouched. |
| Cost | Fewer tables. | One table plus a read path in admin (needed anyway for Part 3). |

**Recommendation: B.**

### Proposed `public.program_inquiries` (additive migration, needs approval)

- `id uuid pk`, `lead_id uuid not null → leads(id)`, `program_slug text null` (resolved from the catalog server-side, as today), `situation text`, `message text`, `full_name text`, `attribution jsonb`.
- `booking_ref text unique` (opaque, generated server-side, used in the booking link), `idempotency_key text unique`.
- `owner_notification_status`, `auto_reply_status` (`pending | accepted | failed | blocked`), provider message ids, error text. Same vocabulary as the Transition ledger so the admin can show both alike.
- `created_at`, `updated_at`. RLS enabled, no browser policies (service role only), like `program_applications`.

### Behaviour

- `/api/qualify` order: validate → upsert lead (`ongoing_content_opt_in: false`; an inquiry is **not** marketing consent) → insert inquiry (idempotent) → owner email → auto-reply → update statuses. `leads.first_name` is the first token of the name; the full name stays on the inquiry.
- **Persistence fails open.** If the database write fails, the owner email is still sent and the failure is logged. The owner notification stays the delivery that decides success, exactly as now.
- **Retry safety.** The client sends a per-submit idempotency key; a retry after an email failure reuses the stored row instead of duplicating it. (Decision A below: keep today's "show failure when the owner email fails".)
- **Booking link.** The auto-reply and success screen link carries `ref=<inquiry booking_ref>` plus `source=inquiry-<slug>`. The existing prefill adapter gains a second lookup (`program_inquiries`) and still returns only `{name, email}`.
- **Abuse.** Once the endpoint writes rows it needs a limiter and honeypot (it has neither today). Must fit the no-IP, cookieless constraint, so likely a global/short-window cap plus honeypot rather than per-IP. To be designed in the implementation stage and tested with mutation checks.
- **Privacy.** Update the privacy notice (inquiry text is now stored). Propose a retention period for message text (Decision C). Admin-only visibility.
- **Backfill.** Past inquiries were never stored, so they cannot be reconstructed. Martin may add the few that matter by hand later; not part of this work.

## 4. Part 2: link completed bookings to their origin

### Options

| | A. Columns on `sched_bookings` | B. Link table `booking_origins` (recommended) | C. Match by email at read time only |
|---|---|---|---|
| Scheduling schema | Modified | Untouched | Untouched |
| Accuracy | Exact | Exact (when a ref is present) | Guess: wrong when someone books with a different email |
| Isolation rule | Needs scheduling-internal change | New port + adapter, same pattern as `inquiryPrefill` | None needed |
| Risk | Larger blast radius in the booking transaction | Small, can fail without blocking a booking | None, but weak |

**Recommendation: B for exact links, plus C as a read-only "probable match" hint in admin** (never written, shown as a suggestion).

### Proposed `public.booking_origins`

- `booking_id uuid pk → sched_bookings(id)` (one origin per booking), `origin_type` (`application | inquiry`), `application_id` / `inquiry_id` (exactly one set, enforced by a check constraint), `lead_id`, `linked_at`, `matched_by` (`ref`).

### Behaviour

- The booking page already receives `ref`; today the client strips it from the address bar. Phase 2 keeps it in page state and submits it with the booking request **in the body, not the URL**.
- A new injected port `bookingOrigin` (adapter in `app/lib/scheduling/adapters/`) validates the ref by lookup in `program_applications` / `program_inquiries` and writes the link **after** the booking commits. If the lookup or insert fails the booking still succeeds (logged, flagged for admin); a link is never a reason to refuse a customer.
- A ref that matches nothing is ignored silently (no oracle for guessing).
- **Ref lifetime.** Today a ref works for prefill indefinitely. Propose an expiry window (Decision D) so an old forwarded email cannot prefill or attach later.
- A ref attaches a booking to someone else's record only if the ref leaked; refs are random and only ever sent to the person concerned. Worst case is a wrong row in the admin timeline, never a data disclosure.
- **Legacy columns.** Do **not** write `program_applications.booking_status / booked_at / meeting_at` in Phase 2 (that would create a second source of truth). The admin reads the live link instead. Those columns stay dormant. (Decision E.)
- **Backfill.** Existing bookings have no ref and are not linked. Any pre-existing bookings can be matched once by email in a read-only report for Martin to confirm; no automatic backfill.
- **Reschedule / cancel.** The link is to the booking, so status changes flow through automatically via the derived view.

## 5. Part 3: inquiry and booking status together in admin

### Shape

- **Lead detail (`/admin/leads/[id]`) becomes the timeline**: inquiry or application received → auto-reply / invitation (accepted, delivered, bounced) → booking (scheduled for …, canceled, rescheduled, completed) → community choice. Each row links to its own admin page.
- **Transition table**: the "Calendly: Not connected" column is replaced by a live **Booking** column (date and status, or "Not booked").
- **New "Inquiries" list** beside Transition (same layout, filter by program, status chips for notification/auto-reply/booking).
- **Booking drawer** (`/admin/scheduling/bookings`) gets a "Came from" line linking to the originating inquiry or application.
- **One vocabulary**: Received → Invited → Booked → Canceled/Rescheduled → Completed, mapped from the real source statuses in a single pure function with tests, so the three screens cannot disagree.

### Data access

Read-only queries behind a small `app/lib/lead-journey/` module that joins `leads`, inquiries, applications, invitation sends, `booking_origins` and bookings. Scheduling tables are read only through a scheduling read adapter, preserving the isolation tests. No denormalized status column. Admin pages are already authenticated; nothing new is public.

## 6. Staged rollout (each stage separately approved)

| Stage | Content | Migration | Flag | Rollback |
|---|---|---|---|---|
| 2a | `program_inquiries`, `/api/qualify` persistence, abuse limiter, ref in inquiry links, prefill from inquiries | Yes (1 table) | `PROGRAM_INQUIRY_STORE_ENABLED`, default off | Flag off; email path unchanged; table stays |
| 2b | `booking_origins`, `bookingOrigin` port, ref submitted in body, ref expiry | Yes (1 table) | `BOOKING_ORIGIN_LINKING_ENABLED`, default off | Flag off; bookings unaffected |
| 2c | Journey module, lead timeline, Transition Booking column, Inquiries list, booking drawer line | None | none (admin-only) | Redeploy previous commit |

Every deployment repeats the standing overrides with public intake ON and uses the verified release-checkout process. Migrations are applied only on Martin's explicit approval, after verifying the target project and taking a backup, as in Stage G.

## 7. Testing plan (no live providers)

- Unit and route tests with the fake database: idempotent retry, persistence failure still sends the owner email, duplicate lead handling, suppressed leads never re-opted-in, response shapes unchanged when the flag is off.
- Mutation checks: remove the idempotency key, the fail-open path, the ref validation, the exactly-one-origin constraint, and the limiter, and confirm a test fails each time.
- Booking: a booking with a valid ref is linked; a wrong or expired ref is ignored and the booking still succeeds; a failing link insert never fails the booking; the ref is never in a URL or log line.
- Isolation tests extended so the new adapter is the only scheduling-side database access.
- Admin: status-mapping table tests; rendered-markup checks on mobile width.
- Migrations rehearsed on the local Supabase stack only. No real inquiry, email, Zoom or Google event is created at any point without separate approval.

## 8. Risks and open points

- Inquiry text is now stored: needs the privacy notice and a retention decision before 2a ships.
- `/api/qualify` currently has no abuse protection; persistence raises the stakes, so the limiter is part of 2a, not optional.
- The ref is briefly visible in the address bar until the page strips it (analytics could capture the page URL). Best-effort today; 2b can reduce it by exchanging the ref for server-held state on first load.
- Calendar paging beyond about 13 months returns a 400 ("Choose dates in the coming months. Try again."). Separate small fix (limit forward navigation to the booking window); not part of Phase 2 unless Martin wants it bundled.
- The monitoring alert job only detects problems while the app is up; the independent dead-man check (Layer 2) is still not active.
- The encryption key has no separate backup (accepted risk, unchanged).

## 9. Decisions needed from Martin

- **A. Inquiry failure behaviour.** Keep today's rule (show an error when the owner email fails, keep the stored row, safe retry) or accept the inquiry as received and retry the email in the background? *Recommended: keep today's rule.*
- **B. Table choice.** New `program_inquiries` (recommended) vs reuse `program_applications`.
- **C. Retention.** How long to keep inquiry message text (suggest 24 months, then blank the message and keep the lead and the fact of contact).
- **D. Ref lifetime.** Suggest 60 days for prefill and linking.
- **E. Legacy Calendly columns.** Leave dormant (recommended) or keep them in sync.
- **F. Email-match hint.** Show "probable match" for bookings without a ref (recommended) or show nothing.
- **G. Bundle the calendar-paging fix** into 2c, or ship it on its own.
- **H. Order.** 2a → 2b → 2c as above, or deliver the admin view first on top of what already exists (Transition applications only).
