# Production deployment checklist: Website Intelligence + GA4 consent

**Status: nothing below has been done.** Branch `feat/website-intelligence` is pushed; no PR is merged, no migration applied, no production setting changed.
Production database state was inspected read-only on 2026-10-26: it is up to date through migration `20261003090000_resource_member_access`, `api_rate_limits` exists,
and no `wi_*` object exists. **Only the three Website Intelligence migrations are pending**, so nothing else can ride along.

Order matters: **decisions → GA admin → database → environment → deploy → verify.**

## A. Decisions and approvals (before anything else)
- [ ] You approve deployment in writing.
- [ ] Counsel (or you) has worked through **`legal-review.md`** (the consent region list, geolocation, banner wording, absence of a server-side consent record, the first-party analytics assumption) and read the new "Website analytics" section of `/privacy`. The region list is an assumption, not a compliance determination.
- [ ] You accept the visible changes: a consent banner for visitors in the EEA/UK/Switzerland/Brazil/Quebec or of unknown location; an "Analytics preferences" control in the footer and on `/privacy`.
- [ ] Optional, recommended: record a **baseline** now (PageSpeed Insights for `/` and one answer page) to compare after deployment.

## B. GA4 admin settings (Google Analytics property; no deploy needed; do before the release so the first data is clean)
- [ ] **Enhanced measurement → untick "Page changes based on browser history events"** (prevents duplicate page views). Path: Admin → Data streams → web stream → Enhanced measurement → ⚙.
- [ ] Data retention: event data **2 months** (max 14).
- [ ] Google signals **off**; data-sharing settings **off** (or consciously chosen); no Ads/other products linked; data processing amendment accepted.
- [ ] Reporting time zone **UTC** (matches Website Intelligence's day boundaries).
- Why these matter: the privacy notice says advertising features are off and describes retention as "the period set in the site's Google Analytics account".

## C. Database (Supabase project `sbntzyivfhvogxiiysuh`, "The MBA", ca-central-1)
Additive, service-role only, touches no existing table (proved by `docs/website-intelligence/test-migration.sh`).
1. [ ] **Restore point:** note the latest daily backup time in Supabase → Database → Backups (or take a manual schema+data dump). A restore is not expected to be needed.
2. [ ] **Re-confirm pending state** (should list nothing newer than `20261003090000`, and no `wi_*` tables): Supabase → Database → Migrations, or SQL: `select version from supabase_migrations.schema_migrations order by 1 desc limit 3;`
3. [ ] **Apply in this order**, each file once, each as one step (SQL editor, `supabase db push` after `supabase link`, or the Supabase MCP `apply_migration`):
   1. `supabase/migrations/20261026090000_website_intelligence.sql` (tables, ingest, conversion, retention)
   2. `supabase/migrations/20261026090100_website_intelligence_reports.sql` (report functions)
   3. `supabase/migrations/20261026090200_website_intelligence_benchmarks.sql` (benchmark tables)
4. [ ] **Verify:** 6 `wi_*` tables and 8 `wi_*` functions exist; RLS is on for all six tables:
   `select count(*) from information_schema.tables where table_schema='public' and table_name like 'wi\_%';` → 6 ·
   `select count(*) from pg_proc where proname like 'wi\_%';` → 8 ·
   `select relname from pg_class where relname like 'wi\_%' and relkind='r' and not relrowsecurity;` → no rows.
5. [ ] **Verify the public key is powerless** (read-only probes with the site's public anon key; no writes): `GET /rest/v1/wi_sessions?select=*` → `[]`; `POST /rest/v1/rpc/wi_overview` → 401/403.
6. [ ] Run Supabase **security advisors** (Dashboard → Advisors, or MCP `get_advisors`) and confirm no new finding for `wi_*`.

Migrating **before** deploying is safe: nothing reads the tables until the new code runs. (Deploying before migrating is also safe, since collection and conversion recording fail soft, but the admin pages would error until migrated.)

## D. Environment (Vercel → Project → Settings → Environment Variables)
- [ ] **`CRON_SECRET`** (Production only): a long random value, e.g. `openssl rand -hex 32`. Vercel Cron sends it automatically as `Authorization: Bearer …`. Without it the daily retention job returns 401 and **retention does not run** (data simply accumulates).
- [ ] No other new variable is required. `ADMIN_EMAIL`, Supabase keys and email keys are existing.
- [x] **Preview isolation: RESOLVED (2026-10-26).** Finding: the Vercel *Preview* scope held `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` on the same records as Production, i.e. the production project and its service-role key, held back only by the code guard. Fix: each of those three records was edited so its scope is **Production only** (Vercel API `PATCH` of the target list; the values were not touched). `vercel env rm … preview` must **not** be used for this: the CLI deletes the whole record, which would delete Production's copy. Verified: Preview now has no Supabase variable; every other record and the three records' values/types are unchanged; a fresh preview of this branch (built after the change) refuses database work (beacon 202; admin fails closed, 500 instead of the former explanatory 503) and production data is unchanged (`api_rate_limits` 341 rows, 0 `wi:` rows; 47 leads; 621 resource events). Effect on previews: builds and public pages are unaffected; anything that needs the database (admin, `/resources` listing, analytics) fails closed on previews, as before. **If a preview ever needs a database, give Preview an isolated Supabase project; never reuse production.** To undo the scope change (not recommended): `PATCH /v9/projects/mba-site/env/<id>` with `{"target":["preview","production"]}` for ids `bLSh85sM3AjJ5wvw`, `RTE9jVdkShlSn23Z`, `lsFw7HtMCTsw9CtZ`. FYI, not changed: `OPENAI_API_KEY` and `ADMIN_EMAIL` are still shared by Preview and Production (no database access; the OpenAI key is a cost exposure), and a second Vercel project, `mba-landing`, also builds this repo (it holds only `RESEND_API_KEY`, no Supabase credentials, so it cannot reach the database).
- [ ] Plan check: the cron in `vercel.json` is **once a day** (`17 3 * * *`), valid on the Hobby plan (timing within the hour).

## E. Deploy
- [ ] Open the pull request `feat/website-intelligence` → `main`, review the diff, merge (this is what triggers the production deployment through the existing Git integration; no manual `vercel --prod` is needed).
- [ ] Watch the Vercel deployment finish; confirm Vercel → Cron Jobs lists `/api/cron/intelligence-maintenance`.

## F. Verify in production (first hour)
Public site
- [ ] Home, `/work`, one answer page load normally; no console errors; footer shows **Analytics preferences** (not on the home page, which has no footer).
- [ ] From a normal location outside the consent regions: no banner; DevTools → Application → Cookies shows `_ga` after load; Google Analytics Realtime shows your visit.
- [ ] From a connection that looks EEA/UK (VPN or a testing service; you cannot spoof the edge headers from a browser): the banner appears; **before** clicking Allow there is **no `_ga` cookie** and no `googletagmanager` request in the Network tab; after Allow both appear; after Decline neither.
- [ ] With Global Privacy Control on (e.g. Brave or DuckDuckGo browser, or the GPC extension): no banner, no `_ga`, and nothing posted to `/api/wi`.
- [ ] `GET https://<site>/api/consent/region` returns `{"required":true|false}` only.
- [ ] GA4 Realtime: click 3 links; exactly **3** `page_view` events (not 6), confirming the Enhanced-measurement setting.
Website Intelligence
- [ ] Signed in as admin, `/admin/intelligence` loads (Overview, Traffic, Content, Journeys, Conversions, AI Visibility). Initially empty states, never invented numbers.
- [ ] Browse 3 public pages in a private window; after about a minute they appear (source "Direct / unknown" or your referrer; the session in Journeys). Your own signed-in browsing does **not** appear, and `/admin` hits do not appear in GA4 Realtime.
- [ ] Submit one real test inquiry on `/lets-talk`: the email arrives and **Conversions** shows 1 confirmed lead (linked to the session if you were not sending GPC).
- [ ] Booking link: click a Calendly link; **Conversions** shows a booking-link click and **no** booking.
- [ ] Vercel → Logs: no repeated "Website Intelligence … failed" errors.
- [ ] Run the cron once by hand to prove the secret: `curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/intelligence-maintenance` → `{"ok":true,…}` (deletes only data past retention; nothing yet). Without the header it must return 401.
- [ ] PageSpeed Insights for `/` and an answer page: no regression against the baseline (expected: unchanged).

## G. First 30–60 days
- [ ] Follow `ga4-comparison.md` weekly (ratios, shares, known-traffic test). Decide about GA4 afterwards.
- [ ] Check storage growth in Supabase after week 1 (expect megabytes, not gigabytes); the collector caps beacons at 5,000/hour and 40,000/day.
- [ ] Re-confirm the privacy notice whenever the consent regions, GA4 settings or either analytics tool changes.

## H. Rollback
Pick the smallest step that fixes the problem.
| Situation | Action |
|---|---|
| Site or admin misbehaving after the deploy | **Vercel → Deployments → previous production deployment → Instant Rollback** (no rebuild). Tracker, banner, cron and admin pages disappear. Database untouched. **Caveat:** the previous code loads GA4 for everyone with no consent step (the old behaviour); if the problem is unrelated to consent, prefer a forward fix so consent is not lost |
| Analytics data is wrong but the site is fine | Leave the code; fix forward; or truncate the data: `truncate wi_events, wi_pageviews, wi_sessions cascade;` (does not touch leads, requests or any other table) |
| Retention job failing | Harmless; data just accumulates. Fix `CRON_SECRET` or run the function by hand: `select wi_maintenance();` |
| Remove the feature entirely | 1) roll the application back (above), then 2) **export anything you want to keep** (e.g. `\copy (select * from wi_sessions) to ...` or Supabase table export), then 3) run **`docs/website-intelligence/rollback.sql`** (one transaction; drops only `wi_*` objects and this feature's `wi:%` rate-limit rows). Tested: apply → rollback → re-apply |
| A GA4 setting change caused a problem | Re-tick the setting in GA4; none of them affects the site or the database |
| Lead forms | Never at risk: conversion recording is wrapped so a failure cannot affect a submission (tested), and rolling back needs no data change |
