create table public.api_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0
);

alter table public.api_rate_limits enable row level security;
-- No public policies: only ever touched via the service-role client
-- (mirrors leads/resources/assessments), which bypasses RLS entirely.

-- Atomic fixed-window rate limiter: a single UPSERT statement, so
-- concurrent requests for the same key can't race each other into both
-- being counted as "first in a new window".
create or replace function public.rate_limit_check(p_key text, p_window_seconds integer, p_limit integer)
returns boolean
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into api_rate_limits (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set count = case
          when api_rate_limits.window_start <= v_now - make_interval(secs => p_window_seconds)
            then 1
          else api_rate_limits.count + 1
        end,
        window_start = case
          when api_rate_limits.window_start <= v_now - make_interval(secs => p_window_seconds)
            then v_now
          else api_rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;
;
