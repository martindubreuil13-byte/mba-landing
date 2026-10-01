# Production rollout checklist (nothing below has been done)

Nothing was deployed, migrated or sent to real leads. Production Supabase was only read (resource row and counts). All testing used a local Supabase stack (Docker, free; no billed branch) plus Resend sink addresses and one earlier send to the admin inbox.

Legend: ✅ done in code / verified locally · 🟡 drafted, needs your or counsel's decision · ⬜ yours to do (needs accounts, DNS or production access).

## Your sequence

| # | Step | Status |
|---|---|---|
| 1 | Review the additive migration `supabase/migrations/20261001120000_resource_events_and_consent_records.sql` (adds 2 tables + columns; backfills `legacy` consent rows from existing timestamps, inventing nothing; edited before ever being applied to include confirmed opt-in) | ⬜ review |
| 2 | Review the intentional PDF-to-HTML differences: `content-comparison.md` lists them (page-4 table order, hidden table captions, three column labels, "page N" links, top-CTA copy). The doubled-word typos are no longer a difference (see 3) | ⬜ review |
| 3 | Correct and replace the PDF | ✅ corrected file `Lead Magnets/Build-the-Bridge-First-FINAL-corrected.pdf` (original untouched; text diff = the two doubled words; pages 2–8 pixel-identical; stray footer image on pages 1 and 9 also removed; local download test re-run byte for byte against it). ⬜ Upload it in Admin → Resources for the production resource |
| 4 | Confirmed opt-in for community marketing | ✅ built and tested (see README §5) |
| 5 | Privacy policy + legal review | 🟡 `/privacy` rewritten ("Online guides and printable editions", processors named, analytics and withdrawal explained); marked `LEGAL REVIEW REQUIRED` in the file. Also review the form wording `resource-guide-consent-v1.1` |
| 6 | `MAILING_ADDRESS` | ⬜ you provide a business address; set the env var (shown in the email footer only when set; never hard-coded) |
| 7 | Verify the sender domain | ⬜ Verify `modernbusinessarchitect.com` in Resend, add SPF/DKIM, check DMARC alignment, send test messages to Gmail / Outlook / iCloud, then set `RESOURCE_EMAIL_FROM="Martin Dubreuil <martin@modernbusinessarchitect.com>"` (reply-to is currently `martin@mindrasolutions.com`; align it then). I have not touched Resend or DNS |
| 8 | Resend webhook | ✅ endpoint built: signature-verified, repeat events idempotent (tested), out-of-order safe. ⬜ In Resend add `https://<production-host>/api/webhooks/resend` for sent, delivered, bounced, failed, suppressed, complained and set `RESEND_WEBHOOK_SECRET` |
| 9 | Rerun shared-flow regression | ✅ `e2e/e2e-shared.mjs` 19/19 locally. ⬜ Rerun against the preview |
| 10 | Commit on a dedicated branch | ✅ branch `feature/resource-lead-capture-pilot`, local only, not pushed |
| 11–12 | Preview deployment + manual test | ⬜ Preview safeguards are built and verified (see `preview-safeguards.md`: noindex, no GA, email off by default / admin-only, environment-aware links, production database refused). A preview needs its own isolated Supabase project; until then it is intentionally non-functional. **Blocker for creating that project: the duplicate migration described in `preview-safeguards.md` §6** |
| 13 | Apply the production migration | ⬜ after a backup / restore point |
| 14 | Deploy | ⬜ |
| 15–16 | One controlled production submission with your email; check lead, consent (`pending` then `opted_in` after you click confirm), events, download and email states in Admin → Guides | ⬜ |
| 17 | Monitor failures and conversion before converting another guide | ⬜ |

## Environment variables to set
`RESEND_WEBHOOK_SECRET`, `RESOURCE_EMAIL_FROM`, `MAILING_ADDRESS`; recommended stable values for `EVIDENCE_HASH_SECRET` and `NAPKIN_UNSUBSCRIBE_SECRET` (both fall back to the service key; set them so hashes and links survive a key rotation). Leave `APP_BASE_URL` unset in production.

## Known gaps and decisions
- **Napkin's join** still writes only the live flag (its own explicit-join model), not `consent_records`; its opt-out already uses the shared evidence log. Until Napkin consent is migrated, do not claim all resource consent is centrally auditable.
- **Suppressed + Napkin join:** the Napkin submission records `marketing_consent = true` while the lead stays suppressed (intended); the submission flag is therefore not proof of an active subscription. Read lead status instead.
- **Google Analytics:** the site loads GA4 sitewide but `/privacy` does not mention it. Outside this pilot; worth including in the legal review.
- **Retention:** no automated purge yet. Suggested: delete `resource_events` older than 24 months; keep `consent_records` for as long as the lead exists.
- **Metrics:** "Browser sessions" are per browser tab, not unique visitors or people (the admin says so; a durable anonymous id would be needed for "estimated unique visitors"). Visitors sending Global Privacy Control / Do Not Track send no events. Download starts count endpoint hits and can include email-scanner hits. Rates can exceed 100% in odd cases (opt-in with no recorded view). "Sign-up → confirmed" lags, so recent periods read low.
- **Delivery webhooks cannot reach localhost:** verified with signed simulated payloads; real provider status was read back through Resend's API for the sink addresses.
- **Removing test infrastructure:** `supabase stop` (add `--no-backup` to discard the local data). Nothing billed.

## Controlled inbox test (confirmed opt-in): 2026-10-01, local app + local database
One email to the authorised admin address only (`e2e/inbox-test.mjs`; screenshots `inbox-*.png`). **27/27 checks passed.**

| # | Check | Result |
|---|---|---|
| 1 | Subject "Your guide is ready: Build the Bridge First"; sender "Martin Dubreuil <martin@mindrasolutions.com>"; preheader "Your printable copy of Build The Bridge First, ready to download."; sender identification, Privacy Policy, Unsubscribe and plain-text version present; renders cleanly at 700 px and 390 px. Resend reports `delivered` | Pass |
| 2 | Download link from the email serves the corrected PDF as an attachment (byte-identical) | Pass |
| 3 | "Yes, confirm my email" opens `/confirm` with a button; opening it did not confirm | Pass |
| 4 | Before the click: admin Leads shows "Awaiting confirmation"; guide page shows consent "Pending"; not in the subscribers export | Pass |
| 5 | After the click: marketing active; history = `opt_in_requested` then `opt_in` (`email_confirmation`) pointing at the request, same wording / source / CTA, hashed device evidence | Pass |
| 6 | Lead appears in the subscribers export; funnel "Confirmed community members" 11 → 12; lead row shows "Opted in" | Pass |
| 7 | Replaying the link (page click and direct POST) says "already confirmed"; no extra consent record or confirmed event | Pass |
| 8 | Unsubscribe from the email's link: page does not unsubscribe on open; button unsubscribes; history kept with an `opt_out` row; lead leaves the export; guide link still works; the old confirm link then returns 409 and does not reactivate | Pass |
| 9 | One request and one email created; Resend's log for the test window lists only the admin address; no other lead created | Pass |

Caveats: the test drove the email's own links (taken from Resend's stored copy of the message) with a headless browser, so the links in the real inbox message are now used up (confirmed, then unsubscribed). I did not see the message in the Gmail inbox itself: Resend reports it delivered, but inbox vs spam placement and Gmail's own rendering are unchecked. That is what the Gmail / Outlook / iCloud tests in step 7 are for. The links point at `localhost:3000` (local `APP_BASE_URL`); production emails will use the real domain.
