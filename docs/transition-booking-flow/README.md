# Transition: direct-booking flow

Status: **implemented and verified locally. Not committed, not migrated in production, not deployed.**

Codex takeover audit (30 October 2026): see `CODEX-AUDIT.md` for independently verified results, the Free-plan Calendly limitation, scoped release files, and corrections to earlier claims. That audit supersedes the connection and delivery notes below where they differ.

Principle: every valid applicant is saved and immediately offered a booking link. No screening, no rejection, no manual approval.

## What changed

| Area | Before | Now |
|---|---|---|
| Submission | AI classification → INVITE / REVIEW / NOT_FIT → different email and screen | Validate → save → send one booking invitation → show the booking screen. OpenAI is never called (`classify.ts` deleted). |
| Status | `INVITED` / `UNDER_REVIEW` / `NOT_FIT` | New applications are `INVITED`, then `BOOKED` only when Calendly says so. Historical rows keep their status and assessment. |
| Confirmation screen | Route-dependent | One screen: `APPLICATION RECEIVED / Good. Let's talk.`, the booking button, then a separate community invitation. |
| Marketing | Checkbox inside the questionnaire | Removed. Optional two-button invitation after submit (see Consent). |
| Email | Route-dependent acknowledgement | One transactional invitation, `Let's have a conversation`, same Calendly event as the screen. |
| Admin | Route / status / booking columns | Name, Country, Submitted, Invitation, Calendly, Meeting date, plus attempts and a Resend button. |

## Visitor flow

`/transition` → questionnaire (checkbox gone, wording unchanged except the two lines that implied screening: the intro button now reads "Let's talk", and the "limited number of people" sentence is replaced) → `POST /api/programs/corporate-transition/apply` → confirmation.

* The booking button shows immediately and never depends on the email. If the invitation could not be sent the page says so ("I wasn't able to send the booking email just now, but you don't need it") and points to `/lets-talk` instead of "reply to my email".
* **Refresh safety:** the response includes an opaque `receiptToken` kept in `sessionStorage` (never in a URL). A refresh calls `POST …/receipt`, which returns only the booking link, whether the email went out and the community choice. No name, email, answers or application id ever reach the browser.
* The booking link is `calendly.com/martindubreuil13/30min` (still defined only in `app/lib/booking.ts`) plus `utm_source=mba_transition&utm_medium=application&utm_content=<booking_ref>`. `booking_ref` is random, carries no personal data, and is a different value from `receipt_token` (Calendly sees one, never the other).

## Database (one additive migration)

`supabase/migrations/20261030090000_transition_booking_flow.sql`: nothing dropped, nothing rewritten.

* `program_applications`: `ai_route` and `ai_confidence` become nullable (their CHECKs still apply to any value present); new `booking_ref`, `receipt_token` (partial unique indexes), `community_choice`, `community_choice_at`, `meeting_at`.
* `program_invitation_sends` (new): every attempt to email the invitation: `kind` (`initial` = first *successful* send, `resend`), `status` (`accepted`/`failed`), provider message id, error, final `delivery_status` from the Resend webhook, timestamp.
* `program_bookings` (new): one row per Calendly invitee (unique), written only from verified webhook events.
* RLS enabled on both new tables, no browser policies (server/service role only).

Validated on the local Postgres in a rolled-back transaction: a historical-style row survives unchanged; AI-less rows insert; bad enum values, duplicate refs/tokens/invitees are rejected; cascades behave; re-running the file is a no-op.

**Production:** after explicit approval, apply ONLY this reviewed Transition SQL file **before** deploying the code. Do not run an unscoped `supabase db push`: this checkout also contains an unrelated, unapplied Publications migration. The new code writes the new columns; the old code is unaffected by them.

## Invitation email

* Sent through the existing Resend integration (`createResend`, the shared `email-shell`), From `PROGRAM_EMAIL_FROM`, Reply-To `PROGRAM_REPLY_TO` (both already set in Production).
* Subject and body are exactly as approved; plain-text part included; one oxblood button `BOOK YOUR CONVERSATION`; transactional footer only (Privacy), no unsubscribe or community content.
* **No open-tracking pixel, and no link rewriting:** verified at the provider: `mindrasolutions.com` has `open_tracking: false` and `click_tracking: false`. The HTML contains no `<img>`.
* **Duplicates:** only the request that created the application sends; a retry with the same idempotency key returns the same receipt and sends nothing; the Resend call carries an idempotency key `transition-invite/<applicationId>/<attemptNumber>` so a repeated attempt is deduplicated by the provider, while a genuine later resend gets a new key. A race on the same key resolves to one application.
* **Recording:** every attempt is a row (accepted with message id, or failed with the reason). The signed Resend webhook (already configured for `email.delivered/bounced/failed/complained`) now also updates these rows; a bounce flips the admin to **Failed**, and a complaint suppresses the address like every other email. The resource-email path is unchanged.
* **Sender authentication (read-only check):** `mindrasolutions.com` is *verified* in Resend (DKIM, SPF); the return-path subdomain `send.mindrasolutions.com` has its SES MX/SPF records. DMARC is `p=none` (monitoring only). No DNS or Resend setting was changed.

## Admin

List: Name, Country, Submitted (UTC, labelled), Invitation (`Pending / Sent / Failed / Resent`), Calendly (`Pending / Booked`, or `Not connected`), Meeting date. Detail keeps all answers, attribution and notifications and adds the attempt log, the Resend button and the booking history. Historical applications show "Earlier flow", keep their stored assessment (under "Earlier assessment (historical)") and their response form.

Invitation state is derived from the attempt log, so a failed send can never read as successful: Sent = first accepted send; Resent = a later accepted one; Failed = nothing accepted and kept (refused, or bounced). The Resend button appears only for an `INVITED`, not-yet-booked application. No automated reminders exist.

## Calendly tracking

Receiver: `POST /api/webhooks/calendly`. Verifies Calendly's `Calendly-Webhook-Signature` (HMAC-SHA256 of `t.body`, 5-minute tolerance); refuses everything with 503 until `CALENDLY_WEBHOOK_SIGNING_KEY` is set.

* Matching: `payload.tracking.utm_content` = `booking_ref`. A reschedule is matched through `old_invitee` if Calendly drops the tracking. Bookings made from other pages carry no ref and are ignored (stored nowhere).
* One row per invitee URI, so repeated deliveries change nothing; a late `created` never revives a cancelled invitee. Cancel → back to "Pending"; reschedule → the old invitee is marked rescheduled and the meeting date moves to the new one.
* A click on the booking link never marks anything booked.

**Plan limitation (not verifiable from here):** there is no Calendly credential in the repository, Vercel or the local environment, so the plan and the subscription could not be inspected. Calendly offers webhook subscriptions on paid plans only (Standard and above, to my knowledge: please confirm on the account). Until a subscription exists the admin shows **Not connected**, never "Pending" and never "Booked".

### Steps to connect (needs your approval and a Calendly API token; nothing was done)

1. Confirm the plan includes webhooks. Create a Personal Access Token (Calendly → Integrations → API & Webhooks).
2. Generate a signing key: `openssl rand -hex 32`. Store it in Vercel (Production) as `CALENDLY_WEBHOOK_SIGNING_KEY`, redeploy.
3. Create the subscription (user scope covers the personal 30-minute event):
   ```
   curl -X POST https://api.calendly.com/webhook_subscriptions \
     -H "Authorization: Bearer $CALENDLY_TOKEN" -H "Content-Type: application/json" \
     -d '{"url":"https://modernbusinessarchitect.com/api/webhooks/calendly",
          "events":["invitee.created","invitee.canceled"],
          "organization":"<org uri>","user":"<user uri>","scope":"user",
          "signing_key":"<the same key>"}'
   ```
   (`GET /users/me` returns both URIs.)
4. Make one test booking with a test application; confirm it shows Booked with the meeting time, then cancel it and confirm it returns to Pending.

**If the plan has no webhooks:** the smallest viable alternative is a manual "Mark as booked" control on the application detail page (date/time entered by hand from the Calendly notification email), labelled "Entered manually". Not built: it was not asked for and would show a different kind of truth.

Out-of-order delivery caveat: a cancellation for an invitee this site has not yet recorded cannot be matched (Calendly cancellation payloads carry no tracking), so it is ignored. Calendly delivers in order in practice; if it ever did not, a later `created` for an already-cancelled invitee would show Booked until corrected.

## Consent (the optional community invitation)

Wording, version and buttons are fixed in `corporate-transition.ts` (`transition-community-v1`). Nothing is preselected; completing the application creates no consent. "No, thanks" records only the answer on the application. "Yes, count me in" is an explicit click and records timestamp, source (`program_application`, `/transition`, `application_confirmation`), the exact wording shown, and the hashed IP/user agent: the same `consent_records` evidence as every other form. Already-subscribed leads are not rewritten; suppressed (spam-complaint) leads are never subscribed; previously unsubscribed leads are never silently re-subscribed. The choice is its own request, so a failure cannot touch the booking.

**Single step vs confirmation: the constraint to be aware of.** A single click is a valid, provable consent *record*, but it does not prove the person owns the address they typed, and some regimes expect that proof (notably German practice, and the site already treats the EEA, UK, Switzerland, Brazil and Quebec as opt-in jurisdictions). So the code follows the site's existing region list (`app/lib/consent/regions.ts`, from the `x-vercel-ip-country` header):

* **Everywhere else (e.g. US, Canada outside Quebec):** the click is the consent; no marketing confirmation email is sent, as requested.
* **EEA / UK / Switzerland / Brazil / Quebec / unknown location:** the click is recorded as a *request* and the existing confirmation email (reworded to match this flow) completes it; marketing starts only after the recipient confirms.

That region list is an engineering assumption, not a legal determination, and is the same one used for analytics consent. Have counsel confirm it, and confirm whether single-step is acceptable for your audience (to be deliberate about the trade-off: widening single-step to everyone is one line in `communityNeedsConfirmation`; I have not done it). The privacy notice was rewritten to match (it previously described the checkbox and the OpenAI assessment, both now untrue): please read that text, it is a legal statement.

## Not changed

Website Intelligence (conversion still recorded once per new application, by reference only), lead creation and attribution, rate limiting, honeypot, validation (including the earlier "Please answer this question." rule), admin authentication, resource emails and their webhook, the manual response form for historical applications, unsubscribe, every other Calendly link, the Publications work.

## Tests

`npx vitest run`, `npx tsc --noEmit`, `npx eslint`, `npm run build`, plus a real-browser run (`docs/transition-booking-flow/screens/`) against the local stack with a local stand-in for Resend (no real email possible). See the implementation report for results.
