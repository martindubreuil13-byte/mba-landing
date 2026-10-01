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

Production already has all ten migrations, with a schema identical to the repository. This branch adds no new migration. It only makes the repository history match production:

- Restores `20260929084610_add_resource_archived_and_pmb_status.sql` (recorded in production's history; it had been deleted from the branch).
- Makes `20260929120000_add_resource_archived_and_pmb_status.sql` idempotent (drops the named constraint before adding it), so a fresh database applies the whole sequence. Production already ran it and is unaffected.
- Keeps `20261001120000_resource_events_and_consent_records.sql` and `20261001160000_program_applications.sql` (both applied in production). The first creates guide analytics tables that remain in the database, unused, until the pilot is approved.

Verified: `supabase db reset` applies all 10 migrations in order on a fresh database, and the resulting migration list equals production's.

## Privacy status

`/privacy` is the `main` version. It does **not** describe the Corporate Transition application form, the AI-assisted qualification (OpenAI) of applications, application answers, or the confirmed-opt-in consent model. That disclosure still requires review and approval and is **not** part of this change.
