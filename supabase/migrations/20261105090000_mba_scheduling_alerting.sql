-- MBA Scheduling, Stage G: unattended alerting. One row remembers what the owner was last told, so a standing problem is announced once (and
-- re-announced every six hours while it lasts) instead of every five minutes, and recovery is announced once. Additive; service role only.
create table if not exists public.sched_alert_state (
  id boolean primary key default true check (id),
  signature text not null default '',
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.sched_alert_state enable row level security;
revoke all on public.sched_alert_state from anon, authenticated;
grant all on public.sched_alert_state to service_role;
-- Intentionally no policies: the browser roles can do nothing here.

notify pgrst, 'reload schema';
