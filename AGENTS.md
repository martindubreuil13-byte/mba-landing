<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Shared development rules (Claude Code and Codex)

These apply to every agent working in this repository. Procedure: [docs/WORKFLOW.md](docs/WORKFLOW.md). Release and rollback detail: [DEPLOY.md](DEPLOY.md).

1. **GitHub `main` is the single authoritative baseline.** It is not necessarily what production runs: check the live Vercel deployment before any release decision.
2. **Never develop on `main`.** Run `git fetch origin`, then branch from the latest `origin/main`: `git switch --no-track -c <type>/<short-name> origin/main`. Never push to `main`.
3. **Never deploy, promote, roll back, merge, or change a production database without Martin's explicit approval for that specific action.** That includes the Vercel CLI and dashboard, `supabase db push`, `migration repair`, the Supabase MCP tools and direct SQL. An approval covers one action, not later ones.
4. **Pushing a branch is a stop point.** Show the diff and validation results first, then wait for approval.
5. **Never use an archived or legacy workspace as a source or a place to deploy.** That means `_archive/`, `_recovery-*`, `mba-scheduling-release`, the old Codex CRM baseline (`mba-crm-baseline`) and any directory not cloned from `origin/main`. Do not run `vercel`, `supabase`, or `npm run dev` there. Read from them only when Martin asks.
6. **Never copy production secrets into development.** No production values in source, docs, tests, logs, commits, preview or local env files. Do not run `vercel env pull` or `vercel pull` for production. Local and preview use isolated services (see [docs/preview-safeguards.md](docs/preview-safeguards.md)). `.env.example` holds placeholders only.
7. **Preserve existing functionality.** Do not remove or rewrite behaviour you were not asked to change. A change is not done until CI passes: `npm run release:check`, `SCHEDULING_DB_TESTS=0 npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
8. **Report faithfully.** If a check fails or was skipped, say so with the output.

A push to `main` creates a production-target Vercel build that stays staged only while the project setting `autoAssignCustomDomains` is `false`. Check it before and after every release ([docs/WORKFLOW.md](docs/WORKFLOW.md#6-staged-vercel-deployments-and-explicit-promotion)).

`.claude/settings.json` blocks the most dangerous commands for Claude Code. That is a procedural safeguard, not access control, and the production-write blocks are temporary: the goal is explicitly approved migrations and deployments run through a controlled procedure. The per-action approval stays either way. GitHub and Vercel permissions are the real enforcement. Do not work around a blocked command: ask Martin.

