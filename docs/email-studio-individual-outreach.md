# Email Studio: individual outreach and saved audiences

Adds a second mode to Email Studio, **Individual outreach** (one email to one person), beside the weekly newsletter, and makes saved audiences easy to create and update. Branch `feat/individual-outreach`. Not deployed.

## How individual outreach works

1. **Recipient.** Type an address and an optional name, or search Contacts and pick someone. Nothing is subscribed to the newsletter.
2. **Write.** The same editor, colours, branded template and desktop/mobile preview as the newsletter. Send Test works as before.
3. **Drafts.** Any number of separate drafts, each with its own recipient, subject and message. Save, reopen, edit and delete them. Unsaved changes are flagged, and opening another draft asks first.
4. **Review and send.** "Review and send" saves the draft, then shows the sender, the exact recipient, the contact's email status, the subject and the rendered email. Sending needs one explicit press, once.
5. **Result.** The outcome is shown in place (accepted, rejected, excluded, or unconfirmed). "Compose next email" gives a blank form without reloading; "Copy this message into a new draft" reuses the text for someone else.
6. **History.** The send appears in Campaign history, labelled *Individual* with the recipient. Delivery, bounce and complaint events are recorded as for any campaign.

### When a send does not go as planned

Your text is never discarded after an unsuccessful send.

| What happened | What you see | Your text |
|---|---|---|
| Sent | "Sent. The email provider accepted this email." | "Compose next email" or "Copy this message into a new draft". The draft is deleted; the send record in history holds everything. |
| Provider rejected it, or the contact became ineligible after review | "…was not sent" with the reason | "Reopen as a new draft" keeps the **same recipient and text** as an unsaved draft. Escape does the same, it does not discard. Review again before anything is sent. |
| The send never started (for example the 30-minute review expired) | "Nothing was sent" | Back to editing; the saved draft is untouched. |
| The result could not be read back | "The result could not be confirmed. The email may or may not have gone out." (never "nothing was sent") | Back to editing, or reopen as a new draft. If the email did go out, the server refuses to review or save that draft again and the text is kept as a new unsaved draft. |
| The draft was sent or deleted in another window | A notice that it was already sent | The text stays in the form as a new unsaved draft. It cannot be sent again from the old draft. |

From **Campaign history**, an individual send has "Reuse as new draft" (also on its details page): it opens Individual outreach with the same recipient, subject and text, unsaved, so an old send is always recoverable.

### Safety checks (all reused, none loosened)

| Check | Behaviour |
|---|---|
| Unsubscribed, suppressed, bounced or complained | Blocked. No override, even with evidence. |
| Archived contact | Blocked until restored in Contacts. |
| No recorded marketing permission (any new address, and most cold contacts) | Needs a documented basis, reason and evidence (the same rule and form as newsletter exceptions), saved with the send, plus a tick to acknowledge. |
| Recheck at send time | Eligibility is checked again at the moment of sending. |
| Unsubscribe | Every email carries a personalised unsubscribe link and `List-Unsubscribe` headers. Unsubscribing records the normal opt-out. |
| Duplicates | One live review per draft, enforced in the database (`attach_outreach_review`): re-reviewing a draft voids its older unsent review, and once a review has been sent the draft is finished, even with two browser tabs open and a send racing a re-review. On top of that: one send per review (atomic claim, never replayed), a once-only Resend idempotency key, single-flight buttons, a draft that is deleted after a send attempt, and a confirmation when an *individual* email already went to that address in the last 30 days. |
| Environment | Real sending only works in production, exactly like the newsletter. This work sends nothing from anywhere else. |

A reviewed individual email is a **one-recipient campaign**, so the confirmed send goes through the existing `/api/admin/email/campaigns` route unchanged. The new `/api/admin/email/outreach` route only saves drafts, reviews and reports results. It never calls Resend.

### Things worth knowing

- **A contact is created when the review opens**, for an address that is not already a contact. It is created with no subscription and no consent record (like an inquiry's contact). If you close the review without sending, that contact remains in Contacts, unsubscribed-by-default.
- Drafts hold the recipient's address and name until sent or deleted. Delete drafts you no longer need.
- Links in outreach emails are rewritten for click tracking, like newsletter links.
- A review expires after 30 minutes (existing rule). Re-open the review if it does.
- Replies go to the sender address (Martin Dubreuil), as for every email from this system.

## Saved audiences

The picker now has a labelled **Saved audiences** section:

- **Create audience from current filters** (name it; the filters it will save are shown in words).
- **Load an audience**; the page says whether the filters on screen match the saved ones.
- **Update "X" with current filters** (new): enabled when the filters changed; confirms with the new filters in words.
- **Save as a new audience**, **Rename**, **Delete** (confirmed).

The server action gained one operation, `update` (search text and tags of an existing audience).

## Database change (migration required)

`supabase/migrations/20261124040000_individual_outreach.sql`, additive only:

- `email_campaigns.kind` (`'newsletter'` default, or `'outreach'`), plus a check that an outreach campaign has exactly one recipient. Existing rows become `'newsletter'`; nothing else about them changes.
- New table `email_outreach_drafts` (row security on, service role only).
- New function `attach_outreach_review(draft, review)`: the one-live-review-per-draft rule above. Service role only.
- Nothing is dropped or rewritten, and the existing claim and completion functions are untouched.

The exact apply, verify and record procedure, with read-only SQL for each step and the expected results, is in [supabase/INDIVIDUAL-OUTREACH-MIGRATION.md](supabase/INDIVIDUAL-OUTREACH-MIGRATION.md), together with how to validate the real database flow in an isolated local environment first.

**Order matters.** Apply the migration to production **before** the code is merged and deployed (the new code reads `kind` and the drafts table). CI enforces this: `scripts/verify-migration-history.test.ts` requires every migration file to be in `docs/supabase/production-migration-records.json`, so it fails until the migration is applied in production and the snapshot refreshed.

1. Martin approves and applies this one migration to production (agents are blocked from doing so; see WORKFLOW.md section 8).
2. Refresh `docs/supabase/production-migration-records.json` with the read-only query in `docs/supabase/MIGRATION-HISTORY.md` and commit it.
3. CI turns green; then merge, stage, verify and promote as usual.

If the migration is missing when the code runs, Email Studio shows "Individual outreach is not available yet" for that tab and Campaign history would fail to load; the newsletter composer itself is unaffected. That is why the order above matters.

## What was and was not tested

Tested in CI: the migration's SQL in an in-memory Postgres (one-recipient rule, single claim, the attach function's voiding and refusal, drafts constraints, permissions); the server logic with mocks (review decisions, contact creation without subscription, recent-send lookup, draft rules, error codes); the existing send route with an individual campaign (one send, unsubscribe link, idempotency key, refusal of a second send, recheck at send time); the tolerant history lookup.

Tested outside CI: the real components in a browser against a stand-in server (modes, drafts, review, evidence, blocked, recent-send, double click, compose next, audiences, phone width, and every failure and recovery path above).

Tested on a real local Supabase stack (2026-11-24): `app/lib/email-outreach/local-db.test.ts`, 12 of 12 passing, including true concurrency (simultaneous claims; a send racing a re-review). It skips itself unless a loopback-only stack is running. See `supabase/INDIVIDUAL-OUTREACH-MIGRATION.md` for how to run it and the results.

Not tested: a real send, and the live admin session. Do a staged-build check of Email Studio before promoting.
