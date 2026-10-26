-- Website Intelligence: database rollback. Removes ONLY wi_* objects; no other table, function or row depends on them.
-- IRREVERSIBLE for the analytics data: export anything you want to keep first (see deployment-checklist.md).
-- Roll the application back FIRST (or at the same time): the new code writes to these tables and fails soft, but its admin pages need them.
-- Tested by docs/website-intelligence/test-migration.sh (apply -> rollback -> re-apply).
begin;
  -- 3. benchmarks
  drop table if exists public.wi_benchmark_results;
  drop table if exists public.wi_benchmark_questions;
  -- 2. reports
  drop function if exists public.wi_ai_referrals(timestamptz, timestamptz, boolean);
  drop function if exists public.wi_conversions(timestamptz, timestamptz, boolean, text[], text[], text[], text[]);
  drop function if exists public.wi_content(timestamptz, timestamptz, boolean, text[], text[]);
  drop function if exists public.wi_traffic(timestamptz, timestamptz, boolean);
  drop function if exists public.wi_overview(timestamptz, timestamptz, boolean, text);
  -- 1. core
  drop function if exists public.wi_maintenance(timestamptz);
  drop function if exists public.wi_record_conversion(jsonb);
  drop function if exists public.wi_ingest(jsonb);
  drop table if exists public.wi_events;
  drop table if exists public.wi_pageviews;
  drop table if exists public.wi_sessions;
  drop table if exists public.wi_ai_referral_domains;
  -- this feature's own rate-limit rows in the existing shared table (harmless to keep; removed for a clean state)
  delete from public.api_rate_limits where key like 'wi:%';
commit;
