# Publications (local review build)

Status: recovery release prepared on 2026-10-31. Publications was initially deployed from uncommitted source on 2026-10-29 (`dpl_4eJbQLp7wgRrUXWkjmb8d9R3wbvM`), then omitted by the October 30 deployments. This branch restores the feature on top of production Transition commit `be03b65` and records the source in Git. Scheduling remains excluded. The existing production migration and the three published book records require no changes.

Validation: 697 automated tests pass; 18 database integration tests skipped. TypeScript and targeted ESLint pass. Local production build succeeds. The public catalogue, book pages, covers, sitemap, and protected admin routes must be checked against the release before it is promoted. No book is currently selected as featured, so the homepage feature remains absent by design.

## What it is
`/publications` (catalogue) and `/publications/[slug]` (detail), a homepage feature, and an admin area at `/admin/publications`
(list, add, edit, saved-content preview). Independent of Resources (`resources` table, gated downloads, leads) which is untouched.

## Data
- Migration: `supabase/migrations/20261029090000_publications.sql` (additive). Table `publications`, RLS on with no anon/authenticated
  access, two service-role-only RPCs (`set_featured_publication`, `reorder_publications`), private bucket `publication-assets`.
- Public cover derivatives live in the existing public `resource-covers` bucket under `publications/<id>/<version>/` and exist only while a
  title is published. Originals (metadata-stripped re-encodes) stay private.
- `revision` is bumped by the database on every change to a title (not by pure re-ordering); every admin write sends the revision it saw.

## Local run
Local credentials live in the gitignored `.env.development.local`, which overrides the production values in `.env.local` for `next dev`
(local Supabase on 127.0.0.1:54321, no Resend/OpenAI keys). `npx next dev -p 3000`.

## Tests
- `npx vitest run` (unit + static guards).
- Real local database: `set -a; source .env.development.local; set +a; LOCAL_DB_IT=1 npx vitest run app/lib/publications/queries.local-db.test.ts`
  (constraints, RPCs, RLS, storage, rollback; localhost only; synthetic fixtures removed afterwards).
- HTTP end to end against a running local server: `node docs/publications/e2e/http-e2e.mjs`.

## Deployment record
The additive migration was applied through Supabase MCP as `publications`. RLS and denied anon/authenticated access were verified; the private bucket is private and the catalogue starts empty. The release was uploaded from a clean temporary source copy with no local environment files, built by Vercel using its existing production environment, then promoted. `sharp` is a declared dependency; new titles need no code change.
4. Cover uploads are capped at 3.8 MB per file (platform body limit is 4.5 MB).

The sitemap uses an explicit `/sitemap.xml` rewrite to `/api/sitemap` because the generated dotted dynamic route returned a platform 404. Its data lives in `app/sitemap-data.ts`; the response is XML, has no cache, and is production-only. Final verification: 581 automated tests pass (18 local database tests skipped in this release pass); TypeScript and the Vercel production build pass. Live checks confirm catalogue/login, unpublished 404s and unauthorized API 401.
