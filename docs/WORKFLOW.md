# Development workflow

How changes get from an idea to production safely. The short rules are in [AGENTS.md](../AGENTS.md); this is the procedure. Release specifics (route manifest, flags, domain mapping) are in [DEPLOY.md](../DEPLOY.md).

Why these rules exist: production once ran code that was not on `main` (CLI deployments from a dirty working tree, see [production-reconciliation.md](production-reconciliation.md)), and a push to `main` once replaced a release that had never been merged. `main` is now the single baseline, and nothing reaches production except through the steps below.

> **Procedural safeguards, not access control.** `.claude/settings.json` stops Claude Code from running the riskiest commands, and this document tells Codex the same rules. Neither stops a person, another tool, or a differently phrased command. The real controls are GitHub branch protection and Vercel/Supabase permissions (see [Recommended platform settings](#recommended-platform-settings)).

> **The production-write blocks are temporary.** Today the Claude Code rules *deny* agent-run production deployments, promotions, production migrations and similar commands because the controlled way to run them does not exist yet. That is a stopgap, not the goal. The intended workflow lets an explicitly approved database migration or deployment run through a **controlled execution path**: a reviewed, documented, repeatable procedure (a script or pipeline) that runs only the approved action against the approved target, with before/after checks and a recorded result. Two things are permanent and do not depend on the deny rules: the **explicit per-action approval**, and the **verification and record-keeping** around it. See [Retiring the temporary restrictions](#retiring-the-temporary-restrictions).

## 1. Starting a new task

```bash
cd <your own workspace>            # see section 2
git fetch origin
git status                         # must be clean; if not, stop and find out why
git switch --no-track -c <type>/<short-name> origin/main
npm ci                             # only if package-lock.json changed
```

- Always branch from the latest `origin/main`, never from another feature branch or a local `main`.
- `--no-track` keeps a bare `git push` from pointing at `origin/main`.
- Never commit on `main`. If you find yourself on it, switch to a new branch before editing.
- Keep a task to one branch and one pull request. Unrelated fixes get their own branch.
- Read the existing code and nearby docs first. Preserve existing behaviour unless the task changes it.

## 2. Separate Claude and Codex workspaces

Each agent works in its own directory so uncommitted files, local env files and branches never mix.

| Workspace | Used by | Notes |
|---|---|---|
| `mba-site` (primary checkout) | Claude Code | Clone of GitHub `main` |
| A second clone or `git worktree` of the same repository, for example `mba-site-codex` | Codex | Created from `origin/main`; run `npm ci` in it |

- Two agents never edit the same working tree or the same branch at the same time. Hand work over through a pushed branch, not a shared directory.
- Make a workspace by cloning (`git clone https://github.com/martindubreuil13-byte/mba-landing.git <dir>`) or with `git worktree add <dir> -b <branch> origin/main`. Clones isolate ignored files best.
- Do **not** run `vercel link` in a development workspace. A `.vercel` link to the production project is what makes a stray CLI command dangerous.
- Archived and legacy directories are not workspaces. See [section 9](#9-secrets-and-archived-work).

## 3. Branch naming and pull requests

**Branch names:** `<type>/<short-kebab-description>`, where type is one of `feat`, `fix`, `chore`, `docs`, `test`, `edit` (content edits). Examples already in the repository: `feat/answer-too-old-to-start`, `chore/migration-history-reconciliation`. A tool may add its own prefix (for example `codex/`).

**Commits:** small, one purpose each, message says why. No secrets, no generated or local files (`.env*`, `.next`, `.vercel`).

**Before opening a PR**, run the same checks CI runs ([section 4](#4-required-ci-checks)) and fix failures. Do not open a PR with known failures.

**Pull request** (opened from the branch into `main`; pushing a branch needs Martin's approval, see AGENTS.md):

- What changed and why, in plain language.
- How it was verified, with real output for any failure or skipped step.
- Whether it touches migrations, environment variables, cron, routes or admin navigation.
- Deployment impact and how to roll it back.
- No claim of "tested" for anything that was not run.

## 4. Required CI checks

Defined in `.github/workflows/release-checks.yml` (job `verify`, runs on every push and pull request). All must pass:

| Check | Command |
|---|---|
| Release guard (required routes and admin tabs present) | `node scripts/check-release.mjs` |
| Tests (database tests off) | `SCHEDULING_DB_TESTS=0 npm test` |
| Types | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Production build | `npm run build` |

Locally, also run `npm run release:check` before a release. It needs full Git history, a clean tree, and a branch that contains `origin/main`. `npm test` already runs the migration-history check (`scripts/verify-migration-history.test.ts`); run `npm run verify:migrations` directly when you touch `supabase/migrations/`.

A change with a red check is not mergeable. Do not weaken or skip a check to get it green; fix the cause or ask.

## 5. Merge approval

- Only Martin approves a merge, and approves each one. An agent never merges, never enables auto-merge, and never pushes to `main`.
- Merge only when: CI is green, the diff has been reviewed, the branch contains the latest `origin/main`, and any migration or environment-variable change is called out in the PR.
- Merging does not deploy or promote. Those are separate approvals ([section 6](#6-staged-vercel-deployments-and-explicit-promotion)).
- After a merge, delete the branch on GitHub and locally. Update your next task from `origin/main` again.

## 6. Staged Vercel deployments and explicit promotion

### How staging works (verified)

The Vercel project is linked to the GitHub repository with `main` as its production branch. **Every push to `main` creates a production-target build.** Because the project setting **`autoAssignCustomDomains` is `false`**, that build is **staged**: it is built and ready but not assigned to the custom domain, and the live site does not change. This has been verified: recent pushes to `main` produced staged production-target deployments while the live deployment stayed the same. Promotion to the domain is a separate, explicit act.

Consequences:

- **A merge to `main` is the start of a release, not the end of a review.** It always produces a production-target build (built with production flags, so the release guard in `scripts/check-release.mjs` applies).
- **The whole protection depends on one setting.** If `autoAssignCustomDomains` were `true`, the same merge would go live immediately.

### The `autoAssignCustomDomains` check (required, before and after)

Read the project's `autoAssignCustomDomains` value (Vercel project settings, or a read-only API/CLI read) and record it:

1. **Before every merge to `main`:** it must be `false`. If it is `true` or cannot be read, do not merge; tell Martin.
2. **After the merge, once the staged build is ready:** confirm it is still `false`, the new deployment is staged (not assigned to the domain), and the live deployment is unchanged.
3. **After every promotion:** promotion may re-enable the setting (see [DEPLOY.md](../DEPLOY.md)). Set it back to `false`, then confirm.
4. **After any change to the Vercel project** (domains, Git settings, team or project transfer): check it again.

### Release steps

1. **Check what is live first.** In Vercel, find the deployment the canonical domain points to and its source commit. Do not assume it is the tip of `main`. If the live commit is unknown or is not an ancestor of the candidate, reconcile before shipping.
2. **Stage.** Merge the approved PR (with the `autoAssignCustomDomains` checks above). The resulting production-target build of `main` is the staged build. Confirm the domain mappings did not move.
3. **Verify the staged build** (Publications, article pages, booking page, admin sign-in, webhook and cron authentication). Do not make a real booking or send real mail. Use a separate flag-off staging build for rehearsal if needed; do not change the live deployment's state.
4. **Ask for approval to promote**, naming the commit, the deployment ID, the previous known-good deployment, and the checks done.
5. **Promote** only after Martin says yes. Then re-check `autoAssignCustomDomains` and confirm the canonical domain points at the promoted deployment.
6. **Record** commit, deployment ID, previous known-good deployment, flag state, the `autoAssignCustomDomains` value before and after, and checks.

Rules that do not bend:

- Production deployments come from the reviewed commit on `origin/main`, never from a working tree, a feature branch, the legacy release checkout or an archived workspace. A CLI deploy from an uncommitted tree is how production once diverged from `main`.
- Preview deployments of feature branches are fine and use isolated services only ([preview-safeguards.md](preview-safeguards.md)).
- Production flags live in saved Vercel project settings, not command-line overrides.
- Today an agent does not run `vercel deploy`, `--prod`, `promote`, `rollback`, `alias` or `env` write commands (blocked by the temporary rules). The approval to promote or roll back is given in this conversation and carried out by Martin, until a controlled execution path exists.

## 7. Rollback

Roll back to the last **schema-compatible** known-good deployment. Do not drop tables or reset credentials.

1. Identify the previous known-good deployment from the release record (or Vercel's deployment history). Confirm the database schema is compatible with its code.
2. Ask Martin to approve the rollback, then promote or roll back to that deployment in Vercel.
3. Re-disable automatic custom-domain assignment and verify the canonical domain mapping.
4. Check recovery after the incident: the scheduling recovery heartbeat, provider connections, webhooks, queued work and failed events. A restored page does not prove missed events recovered.
5. In Git, fix forward with a branch and PR, or revert with `git revert` in a PR. Never force-push or rewrite `main`. Reconcile the rolled-back source into `main` before the next release.

## 8. Database migration controls

Production is a live Supabase project. History and open issues: [supabase/MIGRATION-HISTORY.md](supabase/MIGRATION-HISTORY.md). Read it before touching `supabase/migrations/`.

- Migrations are files in `supabase/migrations/` named `<timestamp>_<name>.sql`, made in a feature branch and reviewed in the PR. Prefer **additive** changes (new tables, nullable columns) that old and new code both tolerate, so code can roll back without a schema rollback.
- Never edit a migration that has already been applied in production. Add a new one. Never drop tables or columns in the same release that stops using them.
- Test against a **local disposable** database only: `supabase start`, then `supabase db reset` (local). Database integration tests use a disposable local database, never production.
- Run `npm run verify:migrations`. After a migration is applied in production, refresh `docs/supabase/production-migration-records.json` as described in the migration history doc.
- **Applying to production requires Martin's explicit approval of that specific migration.** For now (temporary, see the note at the top) agents are blocked from running `supabase db push`, `migration repair`, `db reset --linked`, `migration up --linked`, `functions deploy`, `secrets set`, the Supabase MCP `apply_migration`, or SQL clients against the production database, so Martin runs an approved migration or directs how. The target is a controlled execution path: a reviewed procedure that applies only the approved migration files to the approved project, with a before/after check of the migration history and schema and a recorded result. Until the Supabase CLI's behaviour against this history has been validated for production (the migration history doc explains what is and is not proven), `db push` and `migration repair` stay off limits.
- The production project is never used for tests, experiments or previews. The application itself refuses to run a non-production deployment against it.
- Read-only inspection of production (for example the verification query in the migration history doc) still needs Martin's approval for that query. Never export production data to a workspace.

## 9. Secrets and archived work

**Secrets**

- Real values live only in the hosting dashboards, per environment. `.env.example` has placeholders and variable names only.
- Production secrets never go into source, docs, tests, logs, commit messages, PRs, preview environments or local env files.
- Local development uses an isolated Supabase project and `RESEND_API_KEY` unset or the preview email allowlist ([preview-safeguards.md](preview-safeguards.md)). Do not copy env files from another checkout, and do not run `vercel env pull` or `vercel pull` for production.
- A local `.env.local` that holds live provider credentials can send real email and write real data from `next dev`. Check what a local env file points at before running the dev server.
- If a secret is exposed, tell Martin immediately; rotate it per [mba-scheduling/STAGE-G-CREDENTIALS-RUNBOOK.md](mba-scheduling/STAGE-G-CREDENTIALS-RUNBOOK.md). Do not just delete the file.

**Archived work**

- `_archive/mba-site-dirty-20261116` and `_recovery-20261116` sit next to this checkout. The archive holds local env files with **production credentials** and a `.vercel` link to the production project. Its own README says: do not deploy, commit, push or clean from it.
- **`mba-scheduling-release` is a legacy workspace.** It was the release checkout for the scheduling build. Everything in its Git history is contained in `main`, and its `.vercel` folder links it to the production Vercel project, which makes it a standing deploy surface. It must **never** be used for a production deployment, promotion, or any `vercel` command. Its `.vercel` link is the reason.
- **The old Codex CRM baseline (`mba-crm-baseline`, in Codex's workspace) is a legacy workspace.** It was the source production ran before GitHub `main` carried it, and it has no GitHub remote. Its history is contained in `main`. It must **never** be used for a production deployment. Codex works in a fresh workspace made from `origin/main` ([section 2](#2-separate-claude-and-codex-workspaces)).
- Any other directory not cloned from `origin/main` (for example the earlier landing checkout) is also reference-only: never a deployment source, a place to run `vercel` or `supabase`, or a source of env files.
- Because they are reference-only, these workspaces are also the wrong place to start new work. Start from [section 1](#1-starting-a-new-task) in a clean checkout.
- To reuse something from archived work, copy the specific reviewed files into a feature branch and review them in the PR. Do not copy `.env*` or `.vercel`.
- Nothing archived is deleted, reset or cleaned until Martin has reviewed it.

## Recommended platform settings

These are the real enforcement. They are **not configured by this change**; Martin decides.

- GitHub `main`: require a pull request, require the `verify` check to pass, block force pushes and deletion, and (if wanted) restrict who can merge.
- Vercel: keep automatic custom-domain assignment off; restrict production deploy and promote rights; keep production environment variables visible only to the production environment.
- Supabase: use separate projects (or branches) for development and production, and keep production credentials out of agent environments.

## What the Claude Code rules cover

`.claude/settings.json` has `deny` rules (blocked outright, and a denied MCP tool is hidden from the agent) and `ask` rules (always prompt, even if a user-level setting allows the command).

| Area | Denied | Prompts (`ask`) |
|---|---|---|
| Git | pushes to `main` in every form (`main`, `:main`, `+main`, `HEAD:refs/heads/main`, `git -C … push`), `--all`, `--mirror` | every `git push` |
| GitHub | `gh pr merge`, `gh repo edit`, `gh repo delete` | every `gh api` call |
| Vercel CLI | deploy, redeploy, promote, rollback, alias, rm/remove, `--prod`, `--target`, `--prebuilt`, bare `vercel`, production `env pull`/`pull`, any `npx vercel` | `vercel env *`, `vercel link` |
| Supabase CLI (and `npx supabase`) | `db push`, `db reset --linked/--db-url`, `migration repair`, `migration up --linked/--db-url`, `functions deploy`, `secrets set/unset`, `projects delete` | `db dump`, `db pull`, anything with `--linked` or `--db-url`, `projects *` |
| SQL clients | `psql`, `pg_dump`, `pg_restore` aimed at `supabase.co` or `supabase.com` | |
| MCP tools | Supabase `apply_migration`, `deploy_edge_function`, `create_edge_function_secret`, `merge_branch`, `reset_branch`, `delete_branch`, `pause_project`; Vercel `deploy_to_vercel` | other MCP tools prompt by default |
| Secrets | reading `.env`, `.env.local*`, `.env.*.local`, `.env.production*`, `.env.development*`, `.vercel/.env*` (`.env.example` stays readable) | |

Not blocked, so local development and testing keep working: tests, lint, build, `npm run dev`, `git` commits and merges on a feature branch, local `supabase start`/`status`/`db reset`/`migration up`/`migration new`, local `psql` on `127.0.0.1`, read-only `vercel ls`/`inspect`, `git push` of a feature branch (after approval).

**Limitations.** The rules match command text, so they are easy to get around by accident or on purpose:

- Not covered: `bash -c '…'` or `sh -c '…'` wrapping, an absolute path to a binary, another launcher (`pnpm dlx`, `bunx`, `node_modules/.bin/…`), `git -c …` forms, a plain `git push` or a commit while standing on `main`, `git merge` into `main`, a database URL held in an environment variable (`psql "$DATABASE_URL"`), and the host given through `PGHOST`.
- Reading an env file is blocked but writing one is not. Claude can create or edit `.env.local`; it cannot read it back.
- Only Claude Code reads this file. Codex does not, so for Codex these rules are instructions only.
- A Vercel MCP tool other than `deploy_to_vercel` that writes would not be covered.
- If a legitimate command is blocked, ask Martin. Do not rewrite the command to slip past the rule.

The rules were tested against the real Claude Code permission engine in a sandbox with logging stub programs instead of the real tools. Re-run that kind of test when you change them.

## Retiring the temporary restrictions

The deny rules for production writes (deployments, promotion, production migrations) exist because no controlled way to run them yet. Relax a specific rule only when its replacement exists, in this order of preference:

1. **Platform enforcement is in place:** GitHub protection on `main`, scoped Vercel and Supabase permissions, and separate development and production credentials ([Recommended platform settings](#recommended-platform-settings)).
2. **A controlled execution path exists for that action:** a reviewed, versioned procedure (script or pipeline) that does only the approved thing to the approved target, checks state before and after, and records the result. For migrations this includes validating how the Supabase CLI behaves against this repository's history. For deployments it includes the `autoAssignCustomDomains` checks above.
3. **The approval is explicit and per action,** given by Martin for a named change, commit or deployment, and recorded with the result.

When a rule is relaxed, change it from `deny` to `ask` for that specific command, not to a blanket allow, and update this document in the same pull request. Approval stays mandatory even after the deny rule is gone.

## Codex development rules

The trusted Codex project configuration can load [.codex/rules/mba-development.rules](../.codex/rules/mba-development.rules). Review the file before trusting the project. The rules prompt for feature pushes and sensitive GitHub commands, and block common release, database, and secret-file commands in development.

These are command-prefix checks, not access control. Alternative argument orders, scripts, APIs, browser actions, and connectors may be outside their coverage. Do not work around a blocked command. Keep production credentials and write-capable provider access out of the development session, retain GitHub's required PR and CI rules, and use a separately authorized release session for production actions. Keep this checkout unlinked from Vercel.
