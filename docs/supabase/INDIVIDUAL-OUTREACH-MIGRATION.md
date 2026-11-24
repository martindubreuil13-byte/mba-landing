# Migration runbook: individual outreach (for approval)

`supabase/migrations/20261124040000_individual_outreach.sql`. **Not applied anywhere.** Nothing in this document has been run against production. Applying it needs Martin's explicit approval of this specific migration (AGENTS.md rule 3). Agents are blocked from running it.

Read [MIGRATION-HISTORY.md](MIGRATION-HISTORY.md) first. Its warning stands: do **not** use `supabase db push` or `supabase migration repair` against production.

## Approval request

| | |
|---|---|
| **Migration file** | `supabase/migrations/20261124040000_individual_outreach.sql` (on `feat/individual-outreach`, PR #11) |
| **Size / SHA-256 of the file** | 4,532 bytes / `9242928d20bfc87b3cd6ce5271fda1f81bd5b6b36ebab6570419a625b7102b25` |
| **Normalised SQL hash** (what production will record; layout and semicolons ignored) | `1d78c9c4015f1a55b0490e7e824ebe78` |
| **Target** | Supabase project **"The MBA"**, ref **`sbntzyivfhvogxiiysuh`**, organisation "Martin SaaS Lab" (as recorded in `docs/mba-scheduling/STAGE-A-COMPLETION.md` and `PRODUCTION-RELEASE-PREPARATION.md`, and as the default production ref in `app/lib/deployment.ts`). Confirm in the dashboard that this is the project behind modernbusinessarchitect.com before applying. |
| **Method** | Supabase MCP `apply_migration`, name `individual_outreach`, the whole file unmodified, one call (one transaction). Not `supabase db push`. Not the SQL editor. |
| **Changes** | one column with a default, one check constraint, one new table, one new function. Nothing dropped, rewritten or renamed. Details below. |
| **Effect on the live site** | None. See "Compatibility with the code that is deployed now". |
| **Verified so far** | in-memory Postgres; a real local Supabase stack (all 39 migrations replay on an empty database; 12 real-database tests including true concurrency); the runbook SQL itself. Not yet verified: production (by design: that is what the pre-checks and step 3 are for). |
| **What I am asking you to approve** | exactly the one action in step 2, against the project above, once, after you have done step 1. I will not run it; agents are blocked from doing so. |

### Compatibility with the code that is deployed now

I cannot read which commit production currently runs (the Vercel connector needs your sign-in), so this is argued from the code, which is the same for every recent commit of `main`, and tested:

- The only application code that touches `email_campaigns` is the campaign route (one `insert` that names its columns, and does not set `kind`, so it gets the default `'newsletter'`) and the history/details queries (explicit column lists, never `select *`). Nothing in the app uses a positional insert or `select *` on that table.
- In SQL, the only `select *` on it are the two functions `claim_email_campaign_batch` and `complete_email_campaign_batch`, which read into a `%rowtype` variable and then use named fields. **Tested**: in one long-lived database session (like a pooled connection) a newsletter is half-sent with those functions, the migration is applied, and the same session finishes that newsletter and starts another, with identical results (`outreach-db.test.mjs`).
- The new check applies only to rows with `kind = 'outreach'`, and every existing and new row from the deployed code is `'newsletter'`. Verified on a real database: a 60-recipient newsletter inserts and claims in batches of 25 exactly as before.
- The new table and function are never referenced by deployed code. They are closed to `anon` and `authenticated`.

So the migration can safely go **before** the code, and the code must **not** go before the migration (it reads `kind` and the drafts table; its Individual outreach tab would show "not available yet" and Campaign history labels would be missing, but the newsletter would still work).

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

Before the SQL below, in the Supabase dashboard (Database, Backups) confirm a recent automatic backup exists for the project and note its time. This is the recovery point of last resort and costs nothing.

```sql
-- Expect the newest recorded version to be 20261122081131 and nothing named individual_outreach.
select version, name from supabase_migrations.schema_migrations order by version desc limit 3;

-- Expect: all three true (nothing from this migration exists yet).
select to_regclass('public.email_outreach_drafts') is null as drafts_absent,
       not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'email_campaigns' and column_name = 'kind') as kind_absent,
       to_regprocedure('public.attach_outreach_review(uuid,uuid)') is null as function_absent;

-- Expect 0: no newsletter is being sent right now (the new constraint takes a brief exclusive lock on this table, so apply it between sends).
select count(*) as sending_now from public.email_campaigns where send_claim is not null and completed_at is null;

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

## If something fails: recovery

The migration is additive and runs as a single transaction, and the live site does not depend on it, so no failure here is an outage. Stop at the first unexpected result, change nothing further, and report the exact output.

| Situation | What it means | What to do |
|---|---|---|
| **A pre-check does not match** (a name already exists, the newest recorded version is not `20261122081131`, a campaign is sending) | production is not in the state this runbook assumes | **Do not apply.** Report. If a campaign is sending, wait until it finishes and repeat the pre-check. |
| **`apply_migration` returns an error** | the transaction was rolled back: **nothing changed**, and nothing was recorded | Run the pre-check again. All three "absent" values must be `true` and the counts unchanged. Send me the exact error text. Common causes are a lock wait while something held `email_campaigns` (simply retry once when idle) or a permission problem. Do not retry repeatedly. |
| **It reports success but step 3 shows a difference** | the migration did apply (it is recorded), but not as designed | **Do not merge or deploy.** Leave the objects in place: they are inert for the deployed code. Report the output. The fix is a *new* corrective migration (reviewed, approved and applied the same way), never an edit of this one in production. |
| **The recorded hash differs from `1d78c9c4015f1a55b0490e7e824ebe78`** | the text that was applied is not this file (for example it was trimmed or reformatted in transit) | Compare the applied objects with the file using the step 3 queries. If they are identical in effect, the unmerged repository file is changed to equal exactly what was applied (it is not on `main`), and the snapshot records that. If they differ, treat as the previous row. |
| **Step 3 passes but the staged build misbehaves later** | an application problem, not a database one | Promote the previous deployment (WORKFLOW.md section 7). It is compatible with the migrated database. The database does not need to change. |

**There is no one-line "undo".** The recorded migration can only be removed by `migration repair`, which is off limits for production, so the supported recovery is always *fix forward with a new migration*. If removing the objects were ever truly wanted (nothing individual has been sent, and you explicitly approve it), the SQL would be below, applied as a new, recorded migration, never run ad hoc:

```sql
drop function public.attach_outreach_review(uuid, uuid);
drop table public.email_outreach_drafts;
alter table public.email_campaigns drop constraint email_campaigns_outreach_single_recipient, drop column kind;
```

Dropping `kind` would lose which campaigns were individual. Backups are the recovery point for data, not for the schema.

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
- This feature's real-database test: **12 passed** (re-run 2026-11-24 after the review fixes below; repeated 5 times without a failure). Originally 10 passed, 0 failed, 0 skipped, including 12 simultaneous claims on one individual email (exactly one wins) and 8 rounds of a send racing a re-review of the same draft (never both sent).
- Whole suite with the local stack available: 1,658 passed, 1 failed, 18 skipped. The failure is the migration-history test (expected until the migration is recorded). The 18 skipped are the publications tests, which need `LOCAL_DB_IT=1`.
- Publications suite run with that opt-in: 17 passed, 1 failed. The failure ("a database failure after the upload rolls the new asset back") **also fails on untouched `origin/main`** in this environment and concerns a part of the code this change does not touch. It was not investigated.
- The verification SQL in this runbook was executed against the local database: it runs, and the recorded normalised hash is exactly `1d78c9c4015f1a55b0490e7e824ebe78`. The pre-check reads true/true/true on a database without the migration.

Cost: none beyond the local download and disk. A hosted Supabase branch would also work but is billed and is not needed.

### Review fixes found by the PR review (2026-11-24)

- **A wrong-recipient bug, found with a real database and fixed.** The contact lookup used a pattern match, and in PostgREST `*` is a wildcard, so an address containing `*` (legal in an email) matched a *different* contact (`a*b@…` found `axxb@…`) while the review displayed the typed address. Now: exact match first; a fallback for older rows with other capitalisation or stray spaces whose pattern can only match more, followed by an exact comparison in code; and the review shows, checks for recent sends, and sends to the contact's *stored* address. New real-database tests cover `_ % * +` addresses with lookalike twins and a padded, upper-case stored row.
- Draft deletion now recognises "already gone" by a typed error code rather than by matching message text.
- New same-session compatibility test (see "Compatibility" above).
- One intermittent failure was seen once in 5 full combined runs of the whole suite: the scheduling test "recovery after a real process kill" (it kills real processes and is timing-sensitive). It passed in the other 4 combined runs, in 3 isolated runs, and in 3 runs of the whole local-database project. It is outside this change and was not investigated.

