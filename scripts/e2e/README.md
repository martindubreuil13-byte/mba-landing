# Local end-to-end checks (Transition consent)

Everything runs on this machine: a local Supabase stack, the app, and a local mock of the Resend API. No real email is sent, no real recipient is contacted, and OpenAI is never called (the qualification step falls back to REVIEW).

```
supabase start && supabase db reset          # applies every migration in supabase/migrations
node scripts/e2e/mock-resend.mjs &            # mock mail provider on 127.0.0.1:4010
scripts/e2e/start-local-server.sh production-mock &   # production policy, delivered to the mock
MODE=production-mock API_URL=... SERVICE_ROLE_KEY=... node scripts/e2e/transition-consent.mjs
MODE=production-mock node scripts/e2e/transition-ui.mjs      # needs playwright-core + Chrome (not repo deps)
# then restart with: scripts/e2e/start-local-server.sh preview-disabled   and run both scripts with MODE=preview-disabled
```

`API_URL` and `SERVICE_ROLE_KEY` come from `supabase status -o env`. `production-mock` expects the success behaviour (confirmation email queued, "check your inbox"); `preview-disabled` expects the truthful failure behaviour (email off outside production, "could not send").
