-- REVIEW ONLY: execute on hosted production ONLY with separate migration/infrastructure approval.
-- Supabase Pro / Postgres 17. Existing site cron and CRON_SECRET remain unchanged.
-- SCHEDULING_RECOVERY_SECRET must first be securely provisioned in Vercel Production and
-- in Supabase Vault as mba_scheduling_recovery. Do not paste the secret into this file or query history.
-- IMPORTANT: pg_net writes decrypted headers into its queue; roles able to use pg_net can read
-- the scoped token while queued. Review/accept that platform boundary before enabling this job.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Refuse to schedule unless exactly one scoped Vault entry exists.
do $$ begin
  if (select count(*) from vault.secrets where name = 'mba_scheduling_recovery') <> 1 then
    raise exception 'Provision exactly one mba_scheduling_recovery Vault entry before scheduling';
  end if;
end $$;

select cron.schedule('mba-scheduling-sweep', '* * * * *', $job$
  select net.http_get(
    url := 'https://modernbusinessarchitect.com/api/cron/scheduling-sync',
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'mba_scheduling_recovery')),
    timeout_milliseconds := 55000
  );
$job$);

-- Metadata-only checks (never SELECT queued request headers or decrypted secrets):
select jobname, schedule, active from cron.job where jobname = 'mba-scheduling-sweep';
-- cron.job_run_details proves SQL dispatch, NOT HTTP or booking success.
-- Observe net._http_response status_code/error_msg and application heartbeat/scan timestamps.
-- Deactivation, ONLY after intake freeze and confirmed cleanup/drain:
-- select cron.unschedule('mba-scheduling-sweep');
-- Preserve Vault secret until rollback/recovery no longer needs it; do not delete booking tables.
