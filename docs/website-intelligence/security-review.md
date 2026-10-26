# Website Intelligence: pre-deployment security review

Scope: every file added or changed for Website Intelligence (collector, conversion hooks, admin pages, server actions, cron, SQL functions,
migrations, client tracker). Method: the `security-review` checklist (input validation, authn/authz, crypto/secrets, injection/XSS, data
exposure), by reading the final code and running the executable checks listed below. Findings that are pure DoS / rate-limit / hardening
concerns were excluded by the checklist, but the abuse bounds that matter for this system are listed under "Hardening applied".

## Result: no high- or medium-severity vulnerability identified

| Area | What was checked | Outcome |
|---|---|---|
| **Public write surface** (`POST /api/wi`) | Body parsed with zod, 8 KB cap, strict shapes; paths/referrers/props sanitised; all values reach Postgres as one `jsonb` argument to `wi_ingest` (no string-built SQL anywhere); event names, ids and sizes constrained by schema and by table CHECK constraints | No injection path |
| **Stored XSS** | Page titles, paths, referrers and event props are attacker-influenced (any visitor can send them). They are rendered only as React text children; no `dangerouslySetInnerHTML`, no `href`/`src` built from stored values in the admin UI (grep-verified); benchmark `cited_urls` are filtered to http(s) and rendered as text | None |
| **Public Supabase key** (ships to every browser) | `docs/website-intelligence/test-security.sh`: anon cannot read, insert, update or delete any `wi_*` table, and gets 401 on every `wi_*` function (RLS on, no policies, `EXECUTE` revoked from `public, anon, authenticated`) | Passes |
| **Admin authorisation** | Every `/admin/intelligence/*` page calls `requireAdmin()` and sits behind the unchanged `proxy.ts` matcher; every benchmark Server Action re-calls `requireAdmin()` itself; session ids and record ids are regex-validated before reaching a query; `ilike` input has wildcards escaped | No bypass found |
| **CSRF** | Server Actions use Next's built-in Origin check; `/api/wi` additionally drops beacons whose `Origin` is another site | OK |
| **Cron endpoint** | Bearer secret compared with `timingSafeEqual`; refuses every call when `CRON_SECRET` is unset | OK |
| **Conversion forging** | The browser can never mark an event as a conversion (SQL ignores any such flag; tested). Conversions are written only by server routes after the system of record accepted the submission. The `x-wi-sid` header is validated and only links to a session that already exists; session ids are unguessable | Not forgeable from the browser |
| **Data exposure** | No IP, no IP/UA hash, no cookie id, no form values; email-like prop values are dropped; the conversion record carries an opaque reference but the Journeys view deliberately never shows it, so an anonymous session is never linked to a lead record; logs contain error messages only | OK |
| **Secrets / client bundle** | No secret in any new file; `client.ts` and `analytics.ts` import no server module; the service-role client is used only in server-only modules | OK |
| **Environment isolation** | Existing production-database guard applies to every new Supabase access; rows tagged with the writing environment; production reports read production rows only (`isolation.test.ts`, `test-reports.sh`) | OK |
| **Untouched** | `proxy.ts`, `app/lib/supabase/*`, `next.config.ts` have no diff; GA4 loading is unchanged | OK |

## Hardening applied during this review
- Cross-site `Origin` check on the collector (other websites cannot inject data through a visitor's browser).
- Constant-time comparison for the cron bearer secret.
- Global abuse bounds that cap how fast an unauthenticated attacker could grow the database (per session 90/min; 5,000/hour and 40,000/day overall, about 40 MB/day worst case). When exceeded, analytics drop and the site is unaffected. Raise the constants in `ingest.ts` if the site outgrows them.

## Residual, accepted risks (low; documented, not vulnerabilities)
- **Analytics integrity:** the collector is public by design, so a determined actor can inject fake page views or forge an AI referrer in their own session (referrers are client-reported). They cannot create conversions, read data, or affect the site. Treat very small counts with caution.
- **Reflected admin message:** the benchmark pages echo a short status message from the query string as plain text (no HTML), so a crafted link could display misleading text to a signed-in admin. No script execution or data access.
- **`x-vercel-ip-country`:** trusted for country-level geography; it is set by the platform, and forged values only affect data quality.
- **Server secret hygiene:** none is needed for analytics any more (no hashing secret exists). `CRON_SECRET` must be set in Production and kept server-side.

## How to re-run the evidence
`npx vitest run` · `docs/website-intelligence/test-security.sh` · `docs/website-intelligence/test-migration.sh` · `docs/website-intelligence/test-reports.sh` (all against the local Docker Supabase; none touch a remote project).
