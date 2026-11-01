-- MBA Scheduling, Phase 2E: audit remediation (P1-02 .. P1-04) and the approved customer-experience features.
-- ADDITIVE and ordered AFTER 20261101090000_mba_scheduling.sql. NOT applied to any hosted database by this change; applied to the LOCAL stack only.
-- It replaces five functions of the first migration (their signatures change) and adds columns; it removes no table and no data.
--
--   * Worker ownership (P1-03). A lease used to be a bare timestamp: after it expired a second worker could take the booking while the first
--     was still running, and the first could then release or overwrite the second's work. A claim is now a random token (the fencing token):
--       sched_claim_sync      hands out a NEW token for every successful claim
--       sched_renew_sync      extends the lease only for the current token holder
--       sched_finish_sync     records the outcome only for the current token holder ('lost' otherwise; nothing changes)
--       sched_upsert_ref_fenced   records an external reference only for the current token holder, in the same transaction as the ownership check
--     A worker that was replaced can therefore not clear, overwrite or "complete" anything.
--   * Ambiguous Zoom creation (P1-02). A reference remembers that a create call was started and whether earlier ones ended with an unknown outcome
--     (create_intent_at, create_unknown), so recovery looks for the meeting by its marker before it ever creates another one.
--   * Webhook inbox (P1-04). A delivery is claimed (processing), then marked processed or failed. A failed or abandoned delivery is
--     claimable again by the provider's retry; only a PROCESSED delivery is treated as a replay.
--   * Community consent evidence records its source; owner notification kinds are allowed in the email ledger.

-- ------------------------------------------------------------------------------------------------ columns

alter table public.sched_bookings add column if not exists sync_claim uuid;

alter table public.sched_external_refs add column if not exists create_intent_at timestamptz;
alter table public.sched_external_refs add column if not exists create_unknown integer not null default 0;

alter table public.sched_community_consents add column if not exists source text not null default 'booking_confirmation';

alter table public.sched_email_attempts drop constraint if exists sched_email_attempts_kind_check;
alter table public.sched_email_attempts add constraint sched_email_attempts_kind_check
  check (kind in ('confirmation', 'confirmation_resend', 'reschedule', 'cancellation', 'zoom_details', 'owner_new_booking', 'owner_rescheduled', 'owner_canceled'));

-- ------------------------------------------------------------------------------------------------ fenced sync ownership

drop function if exists public.sched_claim_sync(uuid, timestamptz, integer);
drop function if exists public.sched_finish_sync(uuid, text, integer, timestamptz, text, integer, timestamptz);
drop function if exists public.sched_renew_sync(uuid, uuid, timestamptz, integer);
drop function if exists public.sched_finish_sync(uuid, uuid, text, integer, timestamptz, text, integer, timestamptz);
drop function if exists public.sched_claim_sync(uuid, timestamptz, integer);
drop function if exists public.sched_upsert_ref_fenced(uuid, uuid, jsonb);
drop function if exists public.sched_invalidate_refs(uuid, timestamptz);
drop function if exists public.sched_webhook_begin(text, text, timestamptz, integer);
drop function if exists public.sched_webhook_finish(text, text, boolean, text, timestamptz);

-- Takes the booking's lease unless another worker holds an unexpired one. Returns the NEW claim token, or null.
create function public.sched_claim_sync(p_id uuid, p_now timestamptz, p_lock_seconds integer) returns uuid
language plpgsql set search_path = public as $$
declare v_claim uuid := gen_random_uuid();
begin
  update public.sched_bookings set sync_locked_until = p_now + make_interval(secs => p_lock_seconds), sync_claim = v_claim
   where id = p_id and (sync_locked_until is null or sync_locked_until <= p_now);
  if not found then return null; end if;
  return v_claim;
end $$;

-- Extends the lease, but only for the worker that still owns the claim. False means it was replaced (or released): stop.
create function public.sched_renew_sync(p_id uuid, p_claim uuid, p_now timestamptz, p_lock_seconds integer) returns boolean
language plpgsql set search_path = public as $$
begin
  update public.sched_bookings set sync_locked_until = p_now + make_interval(secs => p_lock_seconds)
   where id = p_id and sync_claim = p_claim;
  return found;
end $$;

-- Records a worker's outcome. With a claim, nothing at all happens unless the caller still owns it ('lost'). Without a claim (administrator
-- retry, reconciliation) the status is set but another worker's lease is left alone. With a version guard, a booking that moved on while the
-- worker ran is put back in the queue instead of being marked done ('superseded').
create function public.sched_finish_sync(p_id uuid, p_claim uuid, p_status text, p_attempts integer, p_next timestamptz, p_error text, p_version integer, p_now timestamptz) returns text
language plpgsql set search_path = public as $$
declare b public.sched_bookings;
begin
  select * into b from public.sched_bookings where id = p_id for update;
  if not found then return 'missing'; end if;
  if p_claim is not null and b.sync_claim is distinct from p_claim then return 'lost'; end if;
  if p_version is not null and b.version <> p_version then
    update public.sched_bookings set sync_status = 'pending', sync_attempts = 0, sync_next_attempt_at = p_now, sync_last_error = null,
           sync_locked_until = case when p_claim is not null then null else sync_locked_until end,
           sync_claim = case when p_claim is not null then null else sync_claim end
     where id = p_id;
    return 'superseded';
  end if;
  update public.sched_bookings set sync_status = p_status, sync_attempts = p_attempts, sync_next_attempt_at = p_next, sync_last_error = p_error,
         sync_locked_until = case when p_claim is not null then null else sync_locked_until end,
         sync_claim = case when p_claim is not null then null else sync_claim end
   where id = p_id;
  return 'applied';
end $$;

-- Writes one external reference, but only for the current claim holder, in the same transaction as the ownership check.
create function public.sched_upsert_ref_fenced(p_id uuid, p_claim uuid, p jsonb) returns text
language plpgsql set search_path = public as $$
declare b public.sched_bookings;
begin
  select * into b from public.sched_bookings where id = p_id for update;
  if not found then return 'missing'; end if;
  if b.sync_claim is distinct from p_claim then return 'lost'; end if;
  begin
    insert into public.sched_external_refs (booking_id, provider, external_id, url, status, synced_version, content_key, etag, attempts, last_error, updated_at, create_intent_at, create_unknown)
    values (p_id, p->>'provider', p->>'external_id', p->>'url', p->>'status', coalesce((p->>'synced_version')::integer, 0), p->>'content_key', p->>'etag',
            coalesce((p->>'attempts')::integer, 0), p->>'last_error', coalesce((p->>'updated_at')::timestamptz, now()), nullif(p->>'create_intent_at', '')::timestamptz, coalesce((p->>'create_unknown')::integer, 0))
    on conflict (booking_id, provider) do update set
      external_id = excluded.external_id, url = excluded.url, status = excluded.status, synced_version = excluded.synced_version, content_key = excluded.content_key,
      etag = excluded.etag, attempts = excluded.attempts, last_error = excluded.last_error, updated_at = excluded.updated_at,
      create_intent_at = excluded.create_intent_at, create_unknown = excluded.create_unknown;
  exception when unique_violation then raise exception 'conflict' using errcode = 'SC005';
  end;
  return 'applied';
end $$;

-- A replaced worker that finished an external call anyway asks for the booking to be checked again: every recorded reference is marked
-- "needs to be re-applied" and an idle booking is queued. Unfenced on purpose: it can only ever cause MORE verification, never less.
create function public.sched_invalidate_refs(p_id uuid, p_now timestamptz) returns void
language plpgsql set search_path = public as $$
begin
  update public.sched_external_refs set content_key = null where booking_id = p_id and status = 'synced';
  update public.sched_bookings set sync_status = 'pending', sync_attempts = 0, sync_next_attempt_at = p_now, sync_last_error = null
   where id = p_id and sync_status = 'ok';
end $$;

-- ------------------------------------------------------------------------------------------------ webhook inbox

alter table public.sched_webhook_events add column if not exists status text not null default 'processed' check (status in ('processing', 'processed', 'failed'));
alter table public.sched_webhook_events alter column status set default 'processing';
alter table public.sched_webhook_events add column if not exists claimed_at timestamptz;
alter table public.sched_webhook_events add column if not exists attempts integer not null default 1;
alter table public.sched_webhook_events add column if not exists processed_at timestamptz;
alter table public.sched_webhook_events add column if not exists last_error text;

drop function if exists public.sched_seen_webhook(text, text, timestamptz);

-- Claims a verified delivery for processing. 'new' / 'retry': this caller must process it. 'duplicate': it was already processed, do nothing.
-- 'busy': another caller holds an unexpired claim. A failed delivery, or one whose claim expired (a crash), is claimable again.
create function public.sched_webhook_begin(p_provider text, p_key text, p_now timestamptz, p_lease_seconds integer) returns text
language plpgsql set search_path = public as $$
declare r public.sched_webhook_events;
begin
  delete from public.sched_webhook_events where (status = 'processed' and seen_at < p_now - interval '2 days') or (status <> 'processed' and seen_at < p_now - interval '7 days');
  insert into public.sched_webhook_events (provider, event_key, seen_at, status, claimed_at, attempts) values (p_provider, p_key, p_now, 'processing', p_now, 1) on conflict do nothing;
  if found then return 'new'; end if;
  select * into r from public.sched_webhook_events where provider = p_provider and event_key = p_key for update;
  if r.status = 'processed' then return 'duplicate'; end if;
  if r.status = 'failed' or r.claimed_at is null or r.claimed_at <= p_now - make_interval(secs => p_lease_seconds) then
    update public.sched_webhook_events set status = 'processing', claimed_at = p_now, attempts = attempts + 1 where provider = p_provider and event_key = p_key;
    return 'retry';
  end if;
  return 'busy';
end $$;

create function public.sched_webhook_finish(p_provider text, p_key text, p_ok boolean, p_error text, p_now timestamptz) returns void
language plpgsql set search_path = public as $$
begin
  update public.sched_webhook_events
     set status = case when p_ok then 'processed' else 'failed' end, processed_at = case when p_ok then p_now else null end, last_error = case when p_ok then null else left(p_error, 300) end
   where provider = p_provider and event_key = p_key;
end $$;

-- ------------------------------------------------------------------------------------------------ community consent evidence

create or replace function public.sched_set_community(p_reference text, p_state text, p jsonb) returns text
language plpgsql set search_path = public as $$
declare b record;
begin
  select id, community_state into b from public.sched_bookings where reference = p_reference for update;
  if not found then raise exception 'not_found' using errcode = 'SC004'; end if;
  if p_state = 'shown' then
    if b.community_state = 'unseen' then update public.sched_bookings set community_state = 'shown', community_at = (p->>'at')::timestamptz where id = b.id; return 'shown'; end if;
    return b.community_state;
  end if;
  if b.community_state not in ('unseen', 'shown') then return b.community_state; end if;  -- answered once; later clicks change nothing
  update public.sched_bookings set community_state = p_state, community_at = (p->>'at')::timestamptz where id = b.id;
  insert into public.sched_community_consents (booking_id, choice, wording_version, wording, email, source, created_at)
  values (b.id, p_state, p->>'wording_version', p->>'wording', p->>'email', coalesce(nullif(p->>'source', ''), 'booking_confirmation'), (p->>'at')::timestamptz);
  return p_state;
end $$;

-- ------------------------------------------------------------------------------------------------ access control (service role only, like everything else here)

do $$
declare f text;
begin
  foreach f in array array['sched_claim_sync(uuid, timestamptz, integer)', 'sched_renew_sync(uuid, uuid, timestamptz, integer)',
                           'sched_finish_sync(uuid, uuid, text, integer, timestamptz, text, integer, timestamptz)', 'sched_upsert_ref_fenced(uuid, uuid, jsonb)',
                           'sched_invalidate_refs(uuid, timestamptz)', 'sched_webhook_begin(text, text, timestamptz, integer)',
                           'sched_webhook_finish(text, text, boolean, text, timestamptz)', 'sched_set_community(text, text, jsonb)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
