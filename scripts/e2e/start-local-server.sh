#!/bin/bash
# Starts the app against the LOCAL Supabase stack and the LOCAL mock Resend. Nothing leaves the machine.
#   production-mock   production email policy, delivered to the mock (expects success behaviour)
#   preview-disabled  non-production: email is off by default (expects the truthful "not sent" behaviour)
# Needs: `supabase start` running, `node scripts/e2e/mock-resend.mjs` running.
set -e
MODE="${1:?mode: production-mock | preview-disabled}"
cd "$(dirname "$0")/../.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|SERVICE_ROLE_KEY|ANON_KEY)' | sed 's/^/export /')"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export APP_BASE_URL="http://localhost:${PORT:-3000}"
# A dummy key and a local base URL: even if every guard failed, mail could only reach the local mock.
export RESEND_API_KEY="re_local_mock_key" RESEND_BASE_URL="http://127.0.0.1:4010"
# Empty = "not configured": the qualification step throws locally and falls back to REVIEW, with no OpenAI call.
export OPENAI_API_KEY=""
export ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-admin-placeholder@example.test}"
unset APP_ENV VERCEL VERCEL_ENV PREVIEW_EMAIL_ENABLED PREVIEW_EMAIL_ALLOWLIST
case "$MODE" in
  production-mock)  export APP_ENV=production ;;
  preview-disabled) export APP_ENV=preview ;;
  *) echo "unknown mode $MODE"; exit 1 ;;
esac
exec npx next dev -p "${PORT:-3000}"
