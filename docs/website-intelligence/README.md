# Website Intelligence v1

First-party, cookieless analytics inside the existing admin (`/admin/intelligence`). **Status: development complete, local only.
Nothing is committed, deployed or applied to production; a consolidated technical + privacy review is required first.**

Views: Overview · Traffic · Content · Journeys (+ session detail) · Conversions · AI Visibility (+ benchmarks).

## What it deliberately does NOT do
- **No visitor identifier of any kind.** No cookie, no localStorage, no persistent ID, no IP stored, no IP/user-agent hash, no fingerprint,
  no secret for hashing. Hence **no unique-visitor metric** (the admin shows "Not measured" with the reason). Everything counts sessions.
- No crawler metrics (explicit "Not available" state, with what would make it measurable). `proxy.ts` is unchanged and still only guards `/admin`.
- No automated AI benchmarking; no paid service; no change to GA4.

## Architecture
```
browser: per-tab session (sessionStorage), honours GPC/DNT, skips webdriver/admin/api pages
  └─ batched beacon (sendBeacon / fetch keepalive) ─▶ POST /api/wi
        zod validation + 8 KB cap → drop bots/AI crawlers/admin cookie → rate limit (session id + one global bucket; reuses api_rate_limits)
        → classify source (+ editable AI domain list) → rpc wi_ingest (one atomic, idempotent call; tags the row with the deployment environment)
lead forms ─▶ existing API routes ─▶ (after the system of record accepted the submission) rpc wi_record_conversion
admin pages (requireAdmin + proxy.ts, unchanged) ─▶ read-only rpc wi_overview / wi_traffic / wi_content / wi_conversions / wi_ai_referrals
Vercel Cron, daily ─▶ /api/cron/intelligence-maintenance (Bearer CRON_SECRET) ─▶ rpc wi_maintenance (retention)
```
Reused: Supabase service client + production-database guard, `rate_limit_check`, admin auth, existing `trackEvent()` call sites (about 40
events mirrored first-party), GPC/DNT check, `AdminShell` and the admin visual language. **New dependencies: none.**

## Browser storage (accurate description)
One `sessionStorage` key, `mba_wi`, per tab, cleared by the browser when the tab closes:
`{ id, last, seq, entry: { ref, us, um, uc, ut, land } }` — a random id (`w` + UUID), last-activity time, a page counter, and how the
session began (referrer origin + path with no query, the four UTM values, landing path). No personal data. After 30 minutes idle the next
page view starts a new session with a new id. Nothing is sent when the browser sends Global Privacy Control or Do Not Track, when the
browser reports automation (`navigator.webdriver`), or for `/admin` and `/api` pages. (The site's pre-existing `mba_first_touch` and
`mba_resource_session` sessionStorage keys are separate and unchanged.) Storage can be blocked: then a session lasts one page load.

## Data model (migrations in `supabase/migrations/`, in order)
1. `20261026090000_website_intelligence.sql` — `wi_sessions`, `wi_pageviews`, `wi_events`, `wi_ai_referral_domains`; `wi_ingest`, `wi_record_conversion`, `wi_maintenance`
2. `20261026090100_website_intelligence_reports.sql` — `wi_overview`, `wi_traffic`, `wi_content`, `wi_conversions`, `wi_ai_referrals`
3. `20261026090200_website_intelligence_benchmarks.sql` — `wi_benchmark_questions`, `wi_benchmark_results` (manual records only)

RLS on, no policies, function execute revoked from anon/authenticated: service role only. Additive: no existing table is touched.
No `wi_*` column can hold a visitor/IP/hash value (asserted by `test-migration.sh`).

## Preview / development isolation
1. Every Supabase access goes through `getServiceClient()`, whose existing guard **throws if a non-production deployment is configured with the
   production project**. The collector, the conversion recorder and the admin reports all use it, so a preview or local build pointed at production
   records nothing (it answers 202 and never builds a client). Tested without mocks of the guard: `isolation.test.ts`.
2. Defence in depth: each row is tagged with the writing deployment (`environment`: production / preview / development), set server-side, never
   by the browser. Production deployments call every report with `p_prod = true`, which reads **only** `environment = 'production'` rows, so any
   non-production row that somehow reached the database is excluded from production reports (asserted in `test-reports.sh`).
3. Not counted anywhere: automated user agents and known AI crawlers, `navigator.webdriver` browsers, a request carrying a Supabase auth cookie
   (the signed-in admin), `/admin` and `/api` paths.
4. Local/preview testing is only valid against isolated infrastructure. This work was run against the local Docker Supabase stack with a mock
   email provider, from a copy of the source that excludes `.env.local`.

## Conversions: what is "server-confirmed"
Recorded after the system of record accepted the submission, through `recordConversion()` (never throws, never blocks the visitor, no personal data):
`/lets-talk` (after the email provider accepted the owner notification; a blocked/rejected send records nothing), guide requests (not blocked/unsubscribed
addresses), Business Idea Reality Check lead, Napkin join, program application. Idempotent per record. Leads from visitors with GPC/DNT/blocked scripts are
counted as *unattributed*. Browser events can never be conversions (enforced in SQL and tested).

## Retention (daily cron)
Page views + events 13 months; sessions 25 months; this feature's own rate-limit keys 1 day. Vercel Hobby allows one cron run per day (timing within
the hour; verified in Vercel docs on 2026-10-26); `vercel.json` schedules `17 3 * * *`. Needs `CRON_SECRET` in Production, else the endpoint refuses all calls.

## Privacy notes
`/privacy` has a "Website analytics" section that discloses **both** systems. **GA4 is retained** as an independent reference during validation (decision 2026-10-26) and is now
**consent-aware**: it loads only after a decision (privacy signals respected; opt-in for the EEA/UK/Switzerland/Brazil/Quebec and unknown locations; opt-out elsewhere; always
withdrawable), never tracks admin activity, and keeps its manual page views and URL redaction. **Website Intelligence is independent of that choice.** Details, the required GA4 admin
settings (including the Enhanced-measurement setting that must be off), performance and the checklist are in `ga4-coexistence.md`; how to compare the two is in `ga4-comparison.md`.
Cookieless does not by itself remove every obligation; counsel should confirm the notice and the region list.

## Cost
No new paid service. Storage is small (a session ≈ 0.5 KB, a page view ≈ 0.2 KB). Each page view adds a beacon, two rate-limit upserts and one RPC.

## Testing
- `npx vitest run` — 484 tests (about 110 new for Website Intelligence): classification, payload validation, session expiry, collector, isolation, conversions, content table, journey timeline, benchmarks, ranges, cron auth.
- `docs/website-intelligence/test-migration.sh` — apply / rollback / re-apply on the local DB, schema has no visitor/IP/hash column, retention, production-scope isolation, conversion idempotency.
- `docs/website-intelligence/test-security.sh` — the public (anon) key can read, write and call nothing in `wi_*`.
- `docs/website-intelligence/test-reports.sh` — every report function against synthetic rows with known answers (including preview-row exclusion).
- Real-browser run (Chromium vs local app + local DB + mock email): AI/LinkedIn/Google/direct sources, multi-page journeys, engagement time, a real `/lets-talk`
  submission recorded as one server-confirmed lead linked to its session, a GPC visitor's submission counted unattributed, booking-link click recorded as a non-conversion, nothing typed stored,
  admin browsing not counted, GPC/webdriver excluded, all new pages free of horizontal overflow at 390 px.

## Deployment
NOT performed. Follow `deployment-checklist.md` (decisions → GA admin → database → `CRON_SECRET` → deploy → verify → rollback).

## Further documents
`deployment-checklist.md` (**production steps, verification and rollback**) · `legal-review.md` (**assumptions that need legal review**) · `rollback.sql` · `metrics.md` (definitions) · `security-review.md` · `ga4-coexistence.md` (GA4 audit, consent mechanism, GA admin settings) · `ga4-comparison.md` (how to compare).

## Known limitations
Sessions, not people; GPC/DNT/ad-blocked visitors are invisible to attribution (their leads are still counted); AI referrals are a floor; last-page engagement can
be lost on crashes; UTC days; confirmed bookings and crawler activity are not measurable; no cross-session or cross-device attribution; the global rate limit can be
exhausted by a flood (analytics would drop, the site would not).
