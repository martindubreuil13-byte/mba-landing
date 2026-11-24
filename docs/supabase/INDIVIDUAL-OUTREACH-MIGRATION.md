# Migration runbook: individual outreach (for approval)

`supabase/migrations/20261124040000_individual_outreach.sql`. **Not applied anywhere.** Nothing in this document has been run against production. Applying it needs Martin's explicit approval of this specific migration (AGENTS.md rule 3). Agents are blocked from running it.

Read [MIGRATION-HISTORY.md](MIGRATION-HISTORY.md) first. Its warning stands: do **not** use `supabase db push` or `supabase migration repair` against production.

## What it changes (additive only)

| Object | Change |
|---|---|
| `public.email_campaigns` | new column `kind text not null default 'newsletter'` (`'newsletter'` or `'outreach'`); new check `email_campaigns_outreach_single_recipient` (an outreach campaign has exactly one recipient) |
| `public.email_outreach_drafts` | **new table** for saved drafts. Row-level security on; all access revoked from `public`, `anon`, `authenticated`; select/insert/update/delete granted to `service_role` only |
| `public.attach_outreach_review(uuid, uuid)` | **new function**: atomically makes a review the draft's only live review (voids an older unsent one; refuses once one was sent). `execute` revoked from `public`, `anon`, `authenticated`; granted to `service_role` |

It does **not** drop, rewrite or rename anything, and does not touch `claim_email_campaign_batch`, `complete_email_campaign_batch`, any other function, any policy, or any existing row's data. Existing campaigns become `kind = 'newsletter'` (the default), which is what they are.

**Compatibility.** The currently deployed code ignores the new column, table and function, and the column has a default, so the live site keeps working unchanged after the migration and before the new code is deployed. That is why the migration goes first, and why the rollback of the *code* never requires rolling back the database.

**Locking.** `add column ... default` with a constant is metadata-only. The new check constraint scans `email_campaigns` once while holding a short exclusive lock. The pre-check below counts the rows (expected to be small).

## Before approving: validate in an isolated environment

See [Validating the real database flow in isolation](#validating-the-real-database-flow-in-isolation). Recommended gate: the local-database test passes against a disposable local stack.

## Procedure

### 1. Read-only pre-checks (production)

```sql
-- Expect the newest recorded version to be 20261122081131 and nothing named individual_outreach.
select version, name from supabase_migrations.schema_migrations order by version desc limit 3;

-- Expect: all three true (nothing from this migration exists yet).
select to_regclass('public.email_outreach_drafts') is null as drafts_absent,
       not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'email_campaigns' and column_name = 'kind') as kind_absent,
       to_regprocedure('public.attach_outreach_review(uuid,uuid)') is null as function_absent;

-- Baseline to compare after: row counts only, no data.
select count(*) as campaigns, count(*) filter (where completed_at is not null) as completed from public.email_campaigns;
select count(*) as deliveries from public.email_campaign_deliveries;
```

### 2. Apply (Martin, or as Martin directs)

Use the Supabase MCP `apply_migration`, the route earlier migrations took, with:

- **name:** `individual_outreach`
- **query:** the **entire, unmodified** contents of the file, comments included, in a single call (the repo's verifier compares the stored text, so do not trim, reformat or split it).

It runs as one transaction: it applies completely or not at all. Do **not** paste the SQL into the dashboard SQL editor instead: that runs the SQL but records no migration, which breaks the history check.

`apply_migration` stamps **the time of application** as the version, so the recorded version will differ from `20261124040000` (see step 4).

### 3. Read-only verification (production)

```sql
-- (a) It was recorded, with the exact SQL. Expect one new row and normalized_md5 = 1d78c9c4015f1a55b0490e7e824ebe78 (the invariant).
--     statement_count is 1 when applied through apply_migration (as for the earlier migrations); the local CLI splits the same file into 10.
select version, name,
       coalesce(array_length(statements, 1), 0) as statement_count,
       md5(regexp_replace(replace(array_to_string(statements, ''), ';', ''), '\s+', '', 'g')) as normalized_md5
from supabase_migrations.schema_migrations where name = 'individual_outreach';

-- (b) The objects exist as designed.
select column_name, data_type, column_default, is_nullable from information_schema.columns
 where table_schema = 'public' and table_name = 'email_campaigns' and column_name = 'kind';           -- text, 'newsletter'::text, NO
select conname from pg_constraint where conrelid = 'public.email_campaigns'::regclass
   and conname in ('email_campaigns_kind_check', 'email_campaigns_outreach_single_recipient');         -- both rows
select relrowsecurity from pg_class where oid = 'public.email_outreach_drafts'::regclass;               -- true

-- (c) Access is closed to everyone but the service role. Expect: false, false, true, true.
select has_table_privilege('anon', 'public.email_outreach_drafts', 'select')                          as anon_reads_drafts,
       has_function_privilege('anon', 'public.attach_outreach_review(uuid,uuid)', 'execute')           as anon_runs_attach,
       has_table_privilege('service_role', 'public.email_outreach_drafts', 'insert')                   as service_writes_drafts,
       has_function_privilege('service_role', 'public.attach_outreach_review(uuid,uuid)', 'execute')   as service_runs_attach;

-- (d) Newsletter data and machinery untouched. Expect: same counts as the pre-check; every campaign newsletter; both functions still present.
select kind, count(*) from public.email_campaigns group by kind;                                         -- newsletter only
select count(*) as campaigns from public.email_campaigns;
select count(*) as deliveries from public.email_campaign_deliveries;
select proname from pg_proc where pronamespace = 'public'::regnamespace
   and proname in ('claim_email_campaign_batch', 'complete_email_campaign_batch', 'attach_outreach_review') order by 1;   -- three rows
```

If any expectation is not met, stop and report: do not continue to step 4.

### 4. Record it in the repository (on `feat/individual-outreach`)

1. If the recorded version differs from `20261124040000`, rename the file to the recorded version (`git mv supabase/migrations/20261124040000_individual_outreach.sql supabase/migrations/<recorded-version>_individual_outreach.sql`). The content must not change (as was done for twelve earlier migrations).
2. Add the record to `docs/supabase/production-migration-records.json` (`version`, `name`, `statementCount`, `normalizedMd5`) and refresh `capturedAt`, using the query in MIGRATION-HISTORY.md.
3. `node scripts/verify-migration-history.mjs --strict` must pass, then `SCHEDULING_DB_TESTS=0 npm test`: the migration-history test, red until now, goes green.
4. The local-database test and the in-memory SQL test refer to the migration by its file name: update the file name in `app/lib/email-outreach/outreach-db.test.mjs` if it was renamed.
5. Commit. Pushing is a separate approval.

### 5. Then, as usual (each its own approval)

Push, PR and CI → merge to `main` (staged production-target build; check `autoAssignCustomDomains` is `false` before and after) → verify the **staged** build without sending anything → promote. Staged-build checks specific to this change: Email Studio loads; the Newsletter composer, saved audiences and Campaign history behave as before; the Individual outreach tab loads and shows "No saved drafts" (which proves access to the new table); no email is sent.

## Rollback

- **Code:** promote the previous deployment (WORKFLOW.md section 7). It is compatible with the migrated database, so nothing else is required.
- **Database:** none needed, and not recommended. The changes are additive and inert for old code. Removing them would leave the migration recorded in `schema_migrations`, which then needs `migration repair` (off limits). If it were ever truly necessary and nothing had been sent, fix forward with a *new* migration that drops the objects, applied the same way with the same approval.

## Validating the real database flow in isolation

What has been proven so far, and what has not:

| Check | Proves | Status |
|---|---|---|
| In-memory Postgres (PGlite) runs the migration's real SQL | constraints, the one-recipient rule, single claim, the attach function (including voiding and refusing), permissions | **passes** in CI |
| Mocked route and helper tests | the decisions and wording around the database | **passes** in CI |
| Browser run against a stand-in server | the interface in every state | **passes** (not part of CI) |
| `app/lib/email-outreach/local-db.test.ts` on a local Supabase stack | the same SQL through real PostgREST (embedded selects, error codes) and **true concurrency** (12 simultaneous claims, 8 rounds of a send racing a re-review), contacts, recent sends, the review route end to end, and that the newsletter history queries still run | **10 of 10 pass** (2026-11-24, isolated stack; repeated 6 times without a failure; fails 3 of 10 when the function is deliberately weakened, so it can detect the original bug) |
| A real send | Resend and the production-only send route | **cannot be done in isolation**; only a production-mode run can, and none is planned |

### Running it (safe by construction)

**Do not run `supabase db reset` in the repository.** The repository's `supabase/config.toml` names its local stack `mba-site`, and that name (and its database volume) is shared by every checkout of this project on the machine. A reset there destroys whatever local data that stack holds. On 2026-11-24 the existing `mba-site` stack was an old partial one (12 migrations, no campaign tables). Use a **separate, throwaway stack** instead:

```bash
W=/tmp/mba-outreach-stack                       # anywhere outside the repository
mkdir -p $W/supabase/migrations
cp supabase/migrations/*.sql $W/supabase/migrations/
cp supabase/config.toml $W/supabase/config.toml
# In $W/supabase/config.toml change ONLY:
#   project_id = "mba-outreach-validate"          (own containers and volume; nothing shared)
#   every port 543xx -> 555xx                      (api 55521, db 55522, shadow 55520, studio 55523, inbucket 55524, analytics 55527, pooler 55529)
#   enabled = false for [studio], [inbucket], [edge_runtime], [analytics], [db.seed]   (not needed; saves downloads)

DO_NOT_TRACK=1 supabase start --workdir $W       # applies every migration on first boot; pulls any missing images
DO_NOT_TRACK=1 supabase db reset --local --workdir $W   # optional: explicit rebuild; --local targets only this stack
DO_NOT_TRACK=1 supabase status --workdir $W -o env      # API_URL (http://127.0.0.1:55521), ANON_KEY, SERVICE_ROLE_KEY
```

Confirm the target before any reset: `supabase status --workdir $W` must show `127.0.0.1:555xx`, the containers are named `supabase_*_mba-outreach-validate`, and `supabase/.temp/project-ref` must not exist in the repository (that file would mean the checkout is linked to a hosted project; it was absent).

Create `.env.development.local` (git-ignored) with **only** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (the local JWT keys from `status -o env`, not the newer `sb_*` keys). Do **not** copy an env file from any other checkout and do **not** set `RESEND_API_KEY` or any provider key. (An earlier `.env.development.local` held live Google, Zoom and Resend settings and caused the 2026-11-01 incident.) The test helper refuses any URL that is not `127.0.0.1` or `localhost`, and the app refuses to run a non-production deployment against the production database. Delete the file when finished: while it exists, a plain `npm test` also runs the local-database suites and `npm run dev` points at the local stack.

```bash
npx vitest run --project local-db app/lib/email-outreach/local-db.test.ts   # this feature
npx vitest run                                                               # everything, with the local suites enabled
(set -a; source .env.development.local; set +a; LOCAL_DB_IT=1 npx vitest run app/lib/publications/queries.local-db.test.ts)   # the publications suite has its own opt-in
DO_NOT_TRACK=1 supabase stop --workdir $W                                    # stop the stack (it binds 0.0.0.0 with well-known default keys); add --no-backup to also delete its data
```

### Results on 2026-11-24

- **Full replay of all 39 migration files on an empty database: no failure**, including this migration and the recovered `pg_cron`/`pg_net` ones. This history had never been replayed from scratch before.
- This feature's real-database test: **10 passed, 0 failed, 0 skipped**, including 12 simultaneous claims on one individual email (exactly one wins) and 8 rounds of a send racing a re-review of the same draft (never both sent).
- Whole suite with the local stack available: 1,658 passed, 1 failed, 18 skipped. The failure is the migration-history test (expected until the migration is recorded). The 18 skipped are the publications tests, which need `LOCAL_DB_IT=1`.
- Publications suite run with that opt-in: 17 passed, 1 failed. The failure ("a database failure after the upload rolls the new asset back") **also fails on untouched `origin/main`** in this environment and concerns a part of the code this change does not touch. It was not investigated.
- The verification SQL in this runbook was executed against the local database: it runs, and the recorded normalised hash is exactly `1d78c9c4015f1a55b0490e7e824ebe78`. The pre-check reads true/true/true on a database without the migration.

Cost: none beyond the local download and disk. A hosted Supabase branch would also work but is billed and is not needed.
