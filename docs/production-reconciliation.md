# Production reconciliation: Transition baseline

Why this exists: on 2026-10-01 two CLI production deployments (11:03Z and 11:17Z) were uploaded from a dirty working tree on a feature branch. They shipped the **Corporate to Entrepreneur Transition Funnel V1** (intended) together with unfinished, unapproved work for the Build the Bridge First resource pilot. `main` did not match production, so the next Git-triggered production deploy would have removed the Transition Funnel. This change makes `main` carry exactly what should be live.

## What production ran (verified by content hash)

The tracked source of the 11:17Z deployment is byte-identical to commit `22b9e35` (tagged `prod-cli-live-2026-10-01T1117Z`), plus 14 untracked scratch and CLI files and minus two `.gitignore` files. All 14 Transition files are byte-identical to that commit.

## What this baseline keeps and drops

| Kept | Dropped (stays on `feature/resource-lead-capture-pilot`) |
|---|---|
| Corporate Transition Funnel V1 (14 files, unchanged) | Guide viewer, guide capture form, success state, guide content and config |
| Shared consent foundation: `consent.ts`, signed confirmation tokens, evidence hashing, `/confirm`, `/unsubscribe`, `/api/confirm`, `/api/unsubscribe`, central opt-out for the legacy Napkin link, consent-aware admin lead statuses | Guide events, funnel, analytics, `resource_events` usage |
| Safety infrastructure (final, tested): fail-closed environment detection, central email policy client, production-database guard, noindex and analytics gating for non-production, environment-aware links | Guide delivery email, download tracking, webhook, `/api/resources/printable-guide` |
| `AdminShell` with the **Programs** link | Admin **Guides** area and tab |
| `/privacy` exactly as on `main` | The guide-specific privacy draft (it was marked for legal review and must not be live) |
| | `docs/resource-lead-capture/`, screenshots and e2e artefacts |

The public resource page `/resources/<slug>` and the download route are back to their `main` versions, so `build-the-bridge-first` returns to the gated request form.

## Migrations: nothing new is applied

Production already has all ten migrations, with a schema identical to the repository. The baseline change adds no new migration (the later confirmation change adds one additive migration, below). It only makes the repository history match production:

- Restores `20260929084610_add_resource_archived_and_pmb_status.sql` (recorded in production's history; it had been deleted from the branch).
- Makes `20260929120000_add_resource_archived_and_pmb_status.sql` idempotent (drops the named constraint before adding it), so a fresh database applies the whole sequence. Production already ran it and is unaffected.
- Keeps `20261001120000_resource_events_and_consent_records.sql` and `20261001160000_program_applications.sql` (both applied in production). The first creates guide analytics tables that remain in the database, unused, until the pilot is approved.

Verified: `supabase db reset` applies all 10 migrations in order on a fresh database, and the resulting migration list equals production's.

## Privacy status

`/privacy` is the `main` version. It does **not** describe the Corporate Transition application form, the AI-assisted qualification (OpenAI) of applications, application answers, or the confirmed-opt-in consent model. That disclosure still requires review and approval and is **not** part of this change.

## Transition marketing-consent confirmation (second change)

Problem found in production: the Transition form recorded a pending marketing request but nothing ever sent the confirmation email, so a ticked box stayed pending forever, while the page implied the visitor was on the shortlist.

Correction (stacked on the baseline):

- A shared, non-feature-specific confirmation email (`app/lib/leads/confirmation-email.ts`): signed 30-day confirm link, unsubscribe link and one-click header, sender identification, postal address when `MAILING_ADDRESS` is set, and the statement that nothing is sent unless the recipient confirms.
- New Transition wording `corporate-transition-shortlist-v2` (label and footnote are stored verbatim as the consent wording and shown from the same constants). The v1 wording is superseded.
- The apply route sends exactly one confirmation email, only for a new request: not for an unticked box, an already-subscribed lead, a suppressed lead, a repeat within ten minutes, or an idempotent retry.
- The page says "check your inbox" only when the email was queued, and says plainly that it could not be sent when it was refused. The application is accepted either way.
- Delivery state is stored in two new additive columns (migration `20261002090000_program_applications_consent_email.sql`): `consent_email_status` (default `not_sent`) and `consent_email_error`. Existing rows read `not_sent`, which is true.
- The admin application page shows the applicant's live consent status and the confirmation-email state.
- Consent evidence for Transition now uses the foundation's keyed hash (`hashEvidence`) instead of an unsalted SHA-256.
- **No backfill:** applicants who ticked the box before this change remain pending and are not emailed. Any one-off confirmation email to them needs separate explicit approval.

## Transition email system (routing and design)

Business mail no longer uses `ADMIN_EMAIL` (which only controls admin sign-in). Required production variables before merging PR #2:

| Variable | Value | Used for |
|---|---|---|
| `PROGRAM_ADMIN_EMAIL` | `martin@mindrasolutions.com` | To: of the internal application notification (Reply-To = the applicant) |
| `PROGRAM_REPLY_TO` | `martin@mindrasolutions.com` | Reply-To of applicant acknowledgement, confirmation request and manual response |
| `PROGRAM_EMAIL_FROM` (optional) | default `Martin Dubreuil <martin@mindrasolutions.com>` | From |

Missing `PROGRAM_ADMIN_EMAIL`: no internal notification is sent, the application records `admin_notification_status = failed`, and nothing falls back to `ADMIN_EMAIL`. Missing `PROGRAM_REPLY_TO`: customer emails go without a Reply-To header, so replies reach the From mailbox.

All customer-facing Transition emails (REVIEW / INVITE / NOT_FIT acknowledgements, manual response, confirmation request) share one table-based shell (`app/lib/programs/email-shell.ts`); the internal notification uses the same shell with an internal eyebrow and no customer footer. The manual response preserves Martin's text exactly; the scheduling button appears only for a valid https URL passed as data. Previews: `docs/transition-email-previews/`.
