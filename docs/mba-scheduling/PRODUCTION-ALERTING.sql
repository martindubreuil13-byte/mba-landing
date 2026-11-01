-- REVIEW ONLY. Nothing here has been run on production. Execute on hosted production only with separate infrastructure approval.
-- Stage G unattended alerting for MBA Scheduling. Two independent layers, both running on Supabase, neither needing any person's computer.
--
-- Layer 1  (needs the application): every five minutes Supabase calls /api/cron/scheduling-alert, which evaluates health and emails the owner.
--          Uses the SAME Vault entry as the recovery sweep (mba_scheduling_recovery). Requires the 20261105090000 migration and the deployed route.
-- Layer 2  (needs only the database): a dead-man check. If the recovery worker's heartbeat is older than 15 minutes, Postgres itself emails the owner
--          through Resend. This is the only layer that still works when the application or Vercel is down.
--          It needs ONE new Vault entry, mba_scheduling_alert_resend: a Resend API key restricted to "Sending access" for mindrasolutions.com
--          (never the full-access production key). Creating that key and the Vault entry is a separate approval.
--
-- IMPORTANT (both layers): pg_net writes decrypted headers into its queue; roles able to use pg_net can read them while queued. Layer 1 sends the scoped recovery
-- bearer; Layer 2 sends the restricted Resend key. Neither is the site-wide CRON_SECRET, the service-role key or a full-access Resend key. Accept that boundary first.
-- Metadata-only checks afterwards (never SELECT queued request headers or decrypted secrets).

-- ================================================================================================== Layer 1: application alert route
do $$ begin
  if (select count(*) from vault.secrets where name = 'mba_scheduling_recovery') <> 1 then
    raise exception 'The mba_scheduling_recovery Vault entry must exist (it is created for the recovery sweep)';
  end if;
end $$;

select cron.schedule('mba-scheduling-alert', '*/5 * * * *', $job$
  select net.http_get(
    url := 'https://modernbusinessarchitect.com/api/cron/scheduling-alert',
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'mba_scheduling_recovery')),
    timeout_milliseconds := 25000
  );
$job$);

-- ================================================================================================== Layer 2: dead-man check, database only
-- BEGIN DEADMAN OBJECTS
create table if not exists public.sched_deadman_state (
  id boolean primary key default true check (id),
  alerting boolean not null default false,
  sent_at timestamptz
);
alter table public.sched_deadman_state enable row level security;
revoke all on public.sched_deadman_state from anon, authenticated;
grant all on public.sched_deadman_state to service_role;

create or replace function public.sched_deadman_check(p_api_url text default 'https://api.resend.com/emails')
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_beat timestamptz;
  v_state record;
  v_key text;
  v_stale boolean;
  v_kind text;
  v_bucket bigint := floor(extract(epoch from now()) / 21600);   -- six-hour period: the provider deduplicates a repeat inside it
begin
  select last_run_at into v_beat from public.sched_worker_heartbeat where id = true;
  v_stale := v_beat is null or v_beat < now() - interval '15 minutes';
  insert into public.sched_deadman_state (id) values (true) on conflict (id) do nothing;
  select alerting, sent_at into v_state from public.sched_deadman_state where id for update;

  if v_stale and (not v_state.alerting or v_state.sent_at is null or v_state.sent_at < now() - interval '6 hours') then v_kind := 'alert';
  elsif not v_stale and v_state.alerting then v_kind := 'recovered';
  else return 'quiet';
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'mba_scheduling_alert_resend';
  if v_key is null then raise exception 'Provision the mba_scheduling_alert_resend Vault entry first'; end if;

  perform net.http_post(
    url := p_api_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json', 'Idempotency-Key', 'sched-deadman/' || v_kind || '/' || v_bucket),
    body := jsonb_build_object(
      'from', 'Martin Dubreuil <martin@mindrasolutions.com>',
      'to', jsonb_build_array('martindubreuil13@gmail.com'),
      'subject', case v_kind when 'alert' then 'MBA Scheduling: the recovery worker has stopped' else 'MBA Scheduling: the recovery worker is running again' end,
      'text', case v_kind
        when 'alert' then 'The MBA Scheduling recovery worker has not reported for more than 15 minutes (last report: ' || coalesce(to_char(v_beat at time zone 'UTC', 'YYYY-MM-DD HH24:MI "UTC"'), 'never') || E').\n\nUntil it runs again nothing is synchronised, retried or cleaned up, and new Zoom meetings, calendar events and emails will not be sent.\n\nCheck the Vercel deployment and the Supabase job "mba-scheduling-sweep" (cron.job_run_details and net._http_response). This check runs inside the database, so it works even when the application is down. You will be reminded every six hours, and told once when it recovers.\n\nThis message contains no guest details.'
        else 'The MBA Scheduling recovery worker is reporting again (' || to_char(v_beat at time zone 'UTC', 'YYYY-MM-DD HH24:MI "UTC"') || E').\n\nNothing further is needed.' end),
    timeout_milliseconds := 10000);

  update public.sched_deadman_state set alerting = (v_kind = 'alert'), sent_at = now() where id;
  return v_kind;
end
$fn$;
revoke all on function public.sched_deadman_check(text) from public, anon, authenticated, service_role;
-- END DEADMAN OBJECTS

select cron.schedule('mba-scheduling-deadman', '*/5 * * * *', $job$ select public.sched_deadman_check(); $job$);

-- Metadata-only checks:
select jobname, schedule, active from cron.job where jobname in ('mba-scheduling-alert', 'mba-scheduling-deadman');
-- Delivery of the alert request itself: select status_code, error_msg, created from net._http_response order by created desc limit 5;   (never the request headers)
-- To stop alerting (for example while deliberately taking Scheduling down for maintenance):
--   select cron.unschedule('mba-scheduling-alert'); select cron.unschedule('mba-scheduling-deadman');
