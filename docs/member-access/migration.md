# Migration `20261003090000_resource_member_access.sql` (proposed, NOT applied to production)

Tested locally with `docs/member-access/test-migration.sh` (builds a production-like pre-migration state, applies the file, compares before/after, rolls back, re-applies).

## Exactly what it does

| Item | Detail |
|---|---|
| Column | `resource_requests.benefit_fulfilled_at timestamptz` — nullable, no default. `NULL` = locked (membership request awaiting confirmation); set = benefit unlocked |
| Index | `resource_requests_locked_idx` on `(lead_id, resource_id) WHERE benefit_fulfilled_at IS NULL` (partial; finds a person's locked requests when they confirm) |
| Constraints | none added |
| Backfill | `UPDATE resource_requests SET benefit_fulfilled_at = requested_at WHERE benefit_fulfilled_at IS NULL` |

## Does it rewrite production data?

Only the **new** column, on existing `resource_requests` rows (about a dozen in production, all of which were handed their download immediately under consent v1.0/v1.1). The backfill is what keeps every previously issued link working. Verified locally: leads, consent_records, resource_events, resources and program_applications are **byte-identical** before and after (md5 of every row); `resource_requests` differs only by the new column. **No email is sent, no consent value is read or changed, no lead is reclassified.**

## v1.1 requests after the migration

- Their download links (bare request id) keep working: backfilled as unlocked.
- Pending v1.1 leads (e.g. people who requested the guide and have not confirmed) are **not contacted or reclassified**. If they press the confirm link from their original email, they are confirmed with their original v1.1 wording and are shown their existing download; nothing new is sent (verified: e2e `J1`–`J4`).
- Consent wording `resource-guide-consent-v1.1` stays in the table untouched; v1.2 is a new entry.

## Rollback

```sql
drop index if exists public.resource_requests_locked_idx;
alter table public.resource_requests drop column if exists benefit_fulfilled_at;
```
Verified: after this, every table (including `resource_requests`) equals the pre-migration snapshot. **Roll the application back at the same time** (or first): code from this branch selects/updates `benefit_fulfilled_at` and would error without the column. The previous application version does not reference the column, so *migrating first, then deploying* is safe, and *rolling back code first* is safe.

## Deployment order

1. Take a restore point (daily physical backups exist; note they predate recent activity) and capture the pre-state counts.
2. Apply the migration (additive, takes a brief lock on a ~12-row table).
3. Deploy the application via the normal Git production deployment.
4. Verify (see `rollout-plan.md`).
