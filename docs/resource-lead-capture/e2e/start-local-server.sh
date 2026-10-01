#!/bin/bash
# Starts the app against the LOCAL Supabase stack and the LOCAL mock Resend, in one of these modes:
#   production-mock       APP_ENV=production policy, email "enabled" (to the mock; nothing leaves the machine)
#   preview-disabled      preview, email off by default
#   preview-enabled       preview, email on for ADMIN_EMAIL only
#   preview-misconfigured preview, allowlist wrongly contains another address (must stay off)
#   prod-database         preview pointed at the PRODUCTION project URL with a fake key (must refuse, no network use)
# Needs: supabase running locally, `node mock-resend.mjs` running, ADMIN_EMAIL set in the environment.
set -e
MODE="${1:?mode}"
cd "$(dirname "$0")/../../.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|SERVICE_ROLE_KEY|ANON_KEY)' | sed 's/^/export /')"
: "${ADMIN_EMAIL:?set ADMIN_EMAIL (the authorised admin address)}"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export APP_BASE_URL="http://localhost:${PORT:-3000}"
# Even if every guard failed, mail could only reach the local mock, and the key is a dummy.
export RESEND_API_KEY="re_local_mock_key" RESEND_BASE_URL="http://127.0.0.1:4010" RESEND_WEBHOOK_SECRET="whsec_$(printf 'local-webhook-secret-for-tests' | base64)"   # fixed, public, local-only test value that e2e.mjs signs with
[ "${NO_KEY:-}" = "1" ] && export RESEND_API_KEY=""   # NO_KEY=1: simulate an unconfigured email provider
unset APP_ENV VERCEL VERCEL_ENV PREVIEW_EMAIL_ENABLED PREVIEW_EMAIL_ALLOWLIST
case "$MODE" in
  production-mock)       export APP_ENV=production ;;
  preview-disabled)      export APP_ENV=preview ;;
  preview-enabled)       export APP_ENV=preview PREVIEW_EMAIL_ENABLED=true PREVIEW_EMAIL_ALLOWLIST="$ADMIN_EMAIL" ;;
  preview-misconfigured) export APP_ENV=preview PREVIEW_EMAIL_ENABLED=true PREVIEW_EMAIL_ALLOWLIST="$ADMIN_EMAIL,someone-else@example.com" ;;
  prod-database)         export APP_ENV=preview NEXT_PUBLIC_SUPABASE_URL="https://sbntzyivfhvogxiiysuh.supabase.co" SUPABASE_SERVICE_ROLE_KEY="fake-key-for-guard-test-not-a-credential" NEXT_PUBLIC_SUPABASE_ANON_KEY="fake-anon-for-guard-test" ;;
  *) echo "unknown mode $MODE"; exit 1 ;;
esac
exec npx next dev -p "${PORT:-3000}"
