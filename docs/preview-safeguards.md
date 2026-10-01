# Preview safeguards

Outside production the application protects itself: a preview or local run cannot be indexed, cannot count in production analytics, cannot email real people, cannot hand out links to the production site and cannot touch the production database. Variable names and placeholders: [`.env.example`](../.env.example). Nothing in this repository contains a real value.

## How the app decides "production" (fails closed)

`app/lib/deployment.ts`. **`NODE_ENV=production` never makes anything production** (local builds, `next start` and preview servers all run with it).

| Where it runs | Production only if | Otherwise |
|---|---|---|
| Vercel (`VERCEL` or `VERCEL_ENV` set) | `VERCEL_ENV === "production"` | preview (a missing or unknown value is a preview) |
| Anywhere else | `APP_ENV === "production"` set explicitly | `APP_ENV=preview` is preview; anything else is development |

`APP_ENV` is ignored on Vercel. Production on Vercel needs no configuration.

## What is restricted outside production

| Safeguard | Behaviour outside production | Where |
|---|---|---|
| No indexing | `X-Robots-Tag: noindex, nofollow` on every route; robots meta; `robots.txt` disallows all; empty sitemap | `next.config.ts`, `layout.tsx`, `seo.ts`, `robots.ts`, `sitemap.ts` |
| No analytics | Google Analytics is not loaded | `layout.tsx` |
| Email off by default | A message is sent only if `PREVIEW_EMAIL_ENABLED=true` and `PREVIEW_EMAIL_ALLOWLIST` is set, and the allowlist contains only `ADMIN_EMAIL`. Any other entry keeps email off | `email-policy.ts`, `email-client.ts` |
| Environment-aware links | Links in emails and API responses use `APP_BASE_URL`, else the deployment's own `VERCEL_URL`, else localhost; never the production domain | `deployment.ts`, `base-url.ts` |
| Production database refused | A non-production deployment configured with the production Supabase project fails before any read or write (server, admin session, proxy and browser client) | `service.ts`, `admin-session.ts`, `proxy.ts`, `browser.ts` |

Every email goes through `createResend()` (`app/lib/email-client.ts`), so a blocked message never reaches the provider. Static tests (`app/lib/architecture-guards.test.ts`) fail if code constructs Resend or a Supabase client outside the guarded files, uses the production domain in API or library code, or loads GA outside production.

## Preview environment variables

| Variable | Preview value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | an **isolated** Supabase project, never production |
| `ADMIN_EMAIL` | the authorised admin address |
| `RESEND_API_KEY` | optional; leave unset to guarantee nothing is sent |
| `PREVIEW_EMAIL_ENABLED` / `PREVIEW_EMAIL_ALLOWLIST` | unset (default off), or `true` plus the `ADMIN_EMAIL` address |
| `APP_BASE_URL` | optional; defaults to the deployment's `VERCEL_URL` |
| `APP_ENV` | do not set on Vercel |
