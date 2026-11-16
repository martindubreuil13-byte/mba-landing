# Supabase migration history

Status as of 2026-11-16. Read this before touching `supabase/migrations/` or running any Supabase CLI command against production.

## What was reconciled (git only)

Production recorded 37 applied migrations; `main` tracked 35 files. The differences were administrative: the SQL was identical, but 12 files carried different version stamps than the rows production recorded (those migrations were applied through the Supabase MCP `apply_migration`, which stamps the time of application), and two migrations recorded in production had no file.

- **12 files renamed to production's version, content unchanged (git reports 100% similarity):**

  | Old file version | Production version | Name |
  |---|---|---|
  | 20261029090000 | 20261029101433 | publications |
  | 20261113100000 | 20261113085811 | relationship_workspace |
  | 20261114120000 | 20261114055550 | newsletter_test_quota |
  | 20261114140000 | 20261114060832 | contact_tags |
  | 20261114150000 | 20261114062138 | contact_lifecycle |
  | 20261114160000 | 20261114080233 | contact_profile |
  | 20261114170000 | 20261114094546 | email_saved_audiences |
  | 20261114180000 | 20261114095857 | email_campaigns |
  | 20261114190000 | 20261114103350 | campaign_consent_exceptions |
  | 20261114200000 | 20261114105325 | campaign_reuse |
  | 20261114210000 | 20261114110457 | campaign_intelligence |
  | 20261114220000 | 20261114121156 | manual_email_preferences |

  Relative order is unchanged. Older documents may still mention the old file names (`docs/admin-prototype/RELEASE.md`, `docs/publications/README.md`, `docs/mba-scheduling/release-evidence/`); they are point-in-time records and were left as they were.
- **2 files recovered from production's records**, with the recorded version and byte-identical SQL (checked by size and MD5 against the stored statement):
  - `20261101034852_mba_scheduling_stage_e_recovery_components.sql` (881 bytes): enables `pg_cron` and `pg_net` and creates a temporary function, `sched_stage_e_provision_recovery`, used once to store the recovery bearer in Vault.
  - `20261101035116_mba_scheduling_stage_e_remove_provisioning_bridge.sql` (90 bytes): drops that function.

  The SQL contains no credentials: the function takes the secret as a parameter and the Vault entry is referred to by name only. The files have no trailing newline because the stored statement has none.

## Known deviations the files cannot show

1. **`20260929120000_add_resource_archived_and_pmb_status.sql` is not what production ran.** On 2026-10-01 the file was edited (it now drops the named constraint before re-adding it, plus comments) so that a fresh database can apply it after `20260929084610`, which creates the same constraint. Production recorded the original, shorter text. The net schema effect is the same. See `docs/production-reconciliation.md`.
2. **Five migrations have no stored SQL in production's records:** `20261002090000_program_applications_consent_email`, `20261003090000_resource_member_access`, `20261026090000_website_intelligence`, `20261026090100_website_intelligence_reports`, `20261026090200_website_intelligence_benchmarks`. Production cannot confirm what text was applied. On 2026-11-16 every table, column, function, index and trigger these files create was found to exist in production, but definitions (column types, defaults, constraints, function bodies, grants) were **not** compared. Treat them as unverified at the definition level.
3. **State that exists in production but is not created by any migration file:**
   - pg_cron job `mba-scheduling-sweep` (every minute) calls `https://modernbusinessarchitect.com/api/cron/scheduling-sync` with a bearer read from Vault. Defined in `docs/mba-scheduling/PRODUCTION-RECOVERY.sql`.
   - pg_cron job `mba-scheduling-alert` (every 5 minutes) calls `/api/cron/scheduling-alert` the same way. Defined in `docs/mba-scheduling/PRODUCTION-ALERTING.sql`.
   - The Vault entry `mba_scheduling_recovery`. It holds a secret, so it is intentionally not in git; it is provisioned and rotated per `docs/mba-scheduling/STAGE-G-CREDENTIALS-RUNBOOK.md`. The recovered migration above only created the one-off function that stored it, so replaying the files into an empty database produces neither the secret nor the two jobs.
   - The cron job commands were read from production, not compared with the SQL in those docs.

## Limits of what has been verified

- The comparison checks **recorded SQL text** against the files (layout and semicolons ignored; whitespace inside string literals is also ignored). It does not read the live schema.
- The object-existence check covered tables, columns, functions, indexes, triggers, extensions and one storage policy. It did not cover grants, row-level-security settings beyond a count, constraints, defaults or function bodies.
- **Nothing here shows how the Supabase CLI will behave** with this history. Matching version numbers is necessary but is not evidence that `supabase db push` or `supabase migration list` is safe or a no-op. Do not run `supabase db push` or `supabase migration repair` against production until that has been validated. The checkout used for this work was not linked to a project, and `supabase/config.toml` carries a local `project_id` (`mba-site`), not the remote project reference.
- A fresh replay of all 37 files has not been run, so it is not known that they build a database equivalent to production.

## Verification script

`node scripts/verify-migration-history.mjs` (also `npm run verify:migrations`) compares the files with `docs/supabase/production-migration-records.json`. It is read-only, makes no connection and writes nothing. It fails on a missing file, a version or name mismatch, an unrecognised file name (the CLI skips those), a duplicated version, SQL that differs from the stored SQL, or a record with no stored SQL that is not acknowledged in the snapshot. A new file with no record is reported as pending (an error with `--strict`). It is exercised by `scripts/verify-migration-history.test.ts` in CI.

After a migration is applied in production, refresh the snapshot with this read-only query and update `docs/supabase/production-migration-records.json` (version, name, `statementCount`, `normalizedMd5`):

```sql
select version, name,
       coalesce(array_length(statements, 1), 0) as statement_count,
       md5(regexp_replace(replace(array_to_string(statements, ''), ';', ''), '\s+', '', 'g')) as normalized_md5
from supabase_migrations.schema_migrations
order by version;
```
