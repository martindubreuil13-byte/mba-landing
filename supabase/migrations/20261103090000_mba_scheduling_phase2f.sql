-- MBA Scheduling, Phase 2F: targeted fixes from the independent Phase 2E re-audit.
-- ADDITIVE and ordered AFTER 20261102090000_mba_scheduling_phase2e.sql. NOT applied to any hosted database; applied to the LOCAL stack only. Re-runnable.
-- It replaces two functions of the previous migration (their signatures change) and adds two columns and one function. Nothing is removed from any table.
--
--   * RE-03 Webhook completion is fenced. A claim now carries a token; only the holder of the CURRENT token can mark the delivery processed or
--     failed. Success is terminal: a late failure (or a late success) from a replaced worker changes nothing.
--   * RE-04 Owner notifications are tied to genuine transitions. The first time owner notifications are switched on, the moment is recorded
--     durably (sched_settings.owner_notify_since); only transitions that happened at or after it can ever produce an owner message, so enabling the
--     feature, or an administrator's "Retry sync", can never announce history.

alter table public.sched_webhook_events add column if not exists claim_token uuid;
alter table public.sched_settings add column if not exists owner_notify_since timestamptz;

drop function if exists public.sched_webhook_begin(text, text, timestamptz, integer);
drop function if exists public.sched_webhook_finish(text, text, boolean, text, timestamptz);
drop function if exists public.sched_webhook_finish(text, text, uuid, boolean, text, timestamptz);
drop function if exists public.sched_activate_owner_notifications(timestamptz);

-- Claims a verified delivery. Returns {state, token}. 'new' / 'retry': the caller must process it and finish it WITH the token. 'duplicate': it was
-- already processed (terminal), do nothing. 'busy': another caller holds an unexpired claim. A failed delivery, or one whose claim lapsed (a crash),
-- is claimable again, and every claim gets a NEW token so the previous holder can no longer complete it.
create function public.sched_webhook_begin(p_provider text, p_key text, p_now timestamptz, p_lease_seconds integer) returns jsonb
language plpgsql set search_path = public as $$
declare r public.sched_webhook_events; v_token uuid := gen_random_uuid();
begin
  delete from public.sched_webhook_events where (status = 'processed' and seen_at < p_now - interval '2 days') or (status <> 'processed' and seen_at < p_now - interval '7 days');
  insert into public.sched_webhook_events (provider, event_key, seen_at, status, claimed_at, attempts, claim_token) values (p_provider, p_key, p_now, 'processing', p_now, 1, v_token) on conflict do nothing;
  if found then return jsonb_build_object('state', 'new', 'token', v_token); end if;
  select * into r from public.sched_webhook_events where provider = p_provider and event_key = p_key for update;
  if r.status = 'processed' then return jsonb_build_object('state', 'duplicate', 'token', null); end if;
  if r.status = 'failed' or r.claimed_at is null or r.claimed_at <= p_now - make_interval(secs => p_lease_seconds) then
    update public.sched_webhook_events set status = 'processing', claimed_at = p_now, attempts = attempts + 1, claim_token = v_token where provider = p_provider and event_key = p_key;
    return jsonb_build_object('state', 'retry', 'token', v_token);
  end if;
  return jsonb_build_object('state', 'busy', 'token', null);
end $$;

-- Completes a claim, but only for the CURRENT token and only while the delivery is still being processed. Returns 'applied' or 'stale' (nothing changed).
create function public.sched_webhook_finish(p_provider text, p_key text, p_token uuid, p_ok boolean, p_error text, p_now timestamptz) returns text
language plpgsql set search_path = public as $$
begin
  update public.sched_webhook_events
     set status = case when p_ok then 'processed' else 'failed' end, processed_at = case when p_ok then p_now else null end,
         last_error = case when p_ok then null else left(p_error, 300) end, claim_token = null
   where provider = p_provider and event_key = p_key and status = 'processing' and claim_token = p_token;
  if found then return 'applied'; end if;
  return 'stale';
end $$;

-- Records, once, the moment owner notifications were first switched on, and returns it. Later calls return the same moment.
create function public.sched_activate_owner_notifications(p_now timestamptz) returns timestamptz
language plpgsql set search_path = public as $$
declare v timestamptz;
begin
  update public.sched_settings set owner_notify_since = coalesce(owner_notify_since, p_now) where id returning owner_notify_since into v;
  return v;
end $$;

do $$
declare f text;
begin
  foreach f in array array['sched_webhook_begin(text, text, timestamptz, integer)', 'sched_webhook_finish(text, text, uuid, boolean, text, timestamptz)', 'sched_activate_owner_notifications(timestamptz)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
