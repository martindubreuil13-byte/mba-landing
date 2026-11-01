-- MBA Scheduling: production persistence.
-- ADDITIVE: new tables and functions only (prefix sched_). It reads one existing table (consent_records) through an optional foreign key
-- and changes nothing that exists. NOT applied to any hosted database by this change; review it, then apply it deliberately.
--
-- What the database guarantees (so no application bug or race can break it):
--   * two confirmed bookings can never be closer than their buffers allow, across ALL meeting types (exclusion constraint on a padded time range)
--   * a booking request is created at most once per idempotency key (unique key + a request fingerprint)
--   * the per-day cap of a meeting type cannot be exceeded by concurrent requests (advisory lock + count in one transaction)
--   * booking writes are serialised by an advisory lock, so concurrent conflicting requests never deadlock
--   * one Google event and one Zoom meeting per booking, and no external id shared between bookings (unique indexes)
--   * each email kind is accepted at most once per booking version (partial unique index)
--   * nothing here is readable or writable by the browser roles: RLS is on, no policies exist, privileges are revoked.
--     The application reaches it only with the server-side service role, behind the admin check or the public booking API.
--
-- Error codes raised by the functions (SQLSTATE): SC001 slot_unavailable, SC002 day_full, SC003 idempotency_conflict, SC004 not_found, SC005 conflict.

-- ------------------------------------------------------------------------------------------------ configuration

create table if not exists public.sched_settings (
  id boolean primary key default true check (id),
  home_time_zone text not null default 'America/Toronto',
  -- prototype switches; unused in production
  simulate_google_outage boolean not null default false,
  simulate_zoom_failure boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.sched_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.sched_meeting_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('confirmed', 'admin', 'api')),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 600),
  duration_minutes integer not null check (duration_minutes between 10 and 480),
  format text not null default 'zoom' check (format = 'zoom'),
  price_label text,
  visibility text not null check (visibility in ('public', 'invitation')),
  invite_code text,
  -- weekly windows, breaks, days off, date overrides and the booking window, in the administrator's home zone
  availability jsonb not null,
  min_notice_hours integer not null default 0 check (min_notice_hours between 0 and 720),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes in (0, 15, 30, 45, 60)),
  buffer_after_minutes integer not null default 30 check (buffer_after_minutes in (0, 15, 30, 45, 60)),
  max_per_day integer check (max_per_day is null or max_per_day between 1 and 50),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes between 5 and 240),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility <> 'invitation' or invite_code is not null)
);
drop trigger if exists sched_meeting_types_set_updated_at on public.sched_meeting_types;
create trigger sched_meeting_types_set_updated_at before update on public.sched_meeting_types for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------------------------ bookings

create table if not exists public.sched_bookings (
  id uuid primary key default gen_random_uuid(),
  -- the opaque 144-bit token that is the ONLY identifier in a public URL
  reference text not null unique,
  meeting_type_id uuid not null references public.sched_meeting_types(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  -- the buffers in force when it was booked: later edits to the meeting type never move an existing booking
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes in (0, 15, 30, 45, 60)),
  buffer_after_minutes integer not null default 30 check (buffer_after_minutes in (0, 15, 30, 45, 60)),
  -- start - buffer_before .. end + buffer_after, maintained by trigger (a generated column cannot be used: timestamptz arithmetic is not immutable)
  blocked_range tstzrange not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'canceled')),
  -- bumped on every reschedule and cancellation; Zoom, Google and email are synchronised per version
  version integer not null default 1,
  source text,
  community_state text not null default 'unseen' check (community_state in ('unseen', 'shown', 'declined', 'joined', 'dismissed')),
  community_at timestamptz,
  idempotency_key text not null unique,
  request_hash text,
  -- synchronisation queue state (see app/lib/scheduling/sync.ts)
  sync_status text not null default 'pending' check (sync_status in ('ok', 'pending', 'failed')),
  sync_attempts integer not null default 0,
  sync_next_attempt_at timestamptz,
  sync_last_error text,
  sync_locked_until timestamptz,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  canceled_at timestamptz,
  check (end_at > start_at),
  -- THE double-booking guarantee. Padded ranges overlap exactly when the gap is smaller than the two buffers between them.
  constraint sched_bookings_no_overlap exclude using gist (blocked_range with &&) where (status = 'confirmed')
);
create index if not exists sched_bookings_start_idx on public.sched_bookings (start_at);
create index if not exists sched_bookings_type_start_idx on public.sched_bookings (meeting_type_id, start_at) where status = 'confirmed';
create index if not exists sched_bookings_sync_idx on public.sched_bookings (sync_next_attempt_at) where sync_status = 'pending';

create or replace function public.sched_bookings_before_write() returns trigger language plpgsql as $$
begin
  new.blocked_range := tstzrange(
    new.start_at - make_interval(mins => new.buffer_before_minutes),
    new.end_at + make_interval(mins => new.buffer_after_minutes), '[)');
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists sched_bookings_range on public.sched_bookings;
create trigger sched_bookings_range before insert or update of start_at, end_at, buffer_before_minutes, buffer_after_minutes on public.sched_bookings
  for each row execute function public.sched_bookings_before_write();

create table if not exists public.sched_attendees (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.sched_bookings(id) on delete cascade,
  role text not null default 'guest' check (role in ('guest')),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 200),
  message text not null default '',
  time_zone text not null,
  created_at timestamptz not null default now(),
  unique (booking_id, role)
);
create index if not exists sched_attendees_email_idx on public.sched_attendees (lower(email));

-- booking history
create table if not exists public.sched_booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.sched_bookings(id) on delete cascade,
  kind text not null check (kind in ('created', 'rescheduled', 'canceled', 'confirmation_resent', 'calendar_conflict')),
  detail text not null default '',
  actor text not null default 'system',
  created_at timestamptz not null default now()
);
create index if not exists sched_booking_events_booking_idx on public.sched_booking_events (booking_id, id);
alter table public.sched_booking_events drop constraint if exists sched_booking_events_kind_check;
alter table public.sched_booking_events add constraint sched_booking_events_kind_check check (kind in ('created', 'rescheduled', 'canceled', 'confirmation_resent', 'calendar_conflict'));

-- administrator activity feed
create table if not exists public.sched_activity (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  summary text not null,
  booking_id uuid references public.sched_bookings(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists sched_activity_created_idx on public.sched_activity (created_at desc);

-- ------------------------------------------------------------------------------------------------ external systems

-- one row per (booking, provider): the Google Calendar event and the Zoom meeting that belong to the booking
create table if not exists public.sched_external_refs (
  booking_id uuid not null references public.sched_bookings(id) on delete cascade,
  provider text not null check (provider in ('google', 'zoom')),
  external_id text,
  url text,
  status text not null default 'pending' check (status in ('pending', 'synced', 'failed', 'deleted')),
  -- the booking version this object reflects, and a key for what it currently shows (version + Zoom link)
  synced_version integer not null default 0,
  content_key text,
  etag text,
  attempts integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now(),
  primary key (booking_id, provider)
);
-- an external object can belong to only one booking: no duplicate Zoom meetings or Google events
create unique index if not exists sched_external_refs_external_idx on public.sched_external_refs (provider, external_id) where external_id is not null;

create table if not exists public.sched_email_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.sched_bookings(id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'confirmation_resend', 'reschedule', 'cancellation', 'zoom_details')),
  version integer not null,
  to_email text not null,
  status text not null check (status in ('accepted', 'failed')),
  provider_message_id text,
  error text,
  included_zoom boolean not null default false,
  idempotency_key text not null,
  -- final outcome, set only from the signed Resend webhook
  delivery_status text check (delivery_status is null or delivery_status in ('delivered', 'bounced', 'failed')),
  delivery_updated_at timestamptz,
  attempted_at timestamptz not null default now()
);
-- each kind is accepted once per booking version, whatever races or retries happen. (A manual resend may repeat.)
create unique index if not exists sched_email_once_idx on public.sched_email_attempts (booking_id, kind, version) where status = 'accepted' and kind <> 'confirmation_resend';
create index if not exists sched_email_provider_idx on public.sched_email_attempts (provider_message_id) where provider_message_id is not null;

-- community invitation answers: evidence, plus a reference to the site's consent record once that library is wired in
create table if not exists public.sched_community_consents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.sched_bookings(id) on delete cascade,
  consent_record_id uuid references public.consent_records(id) on delete set null,
  choice text not null check (choice in ('joined', 'declined', 'dismissed')),
  wording_version text not null,
  wording text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------------------------ Google connection (secrets)

-- Single administrator, single connection. The refresh token is stored ONLY encrypted by the application (AES-256-GCM, key from the
-- environment, never in the database): a database dump alone reveals nothing usable.
create table if not exists public.sched_google_connection (
  id boolean primary key default true check (id),
  status text not null check (status in ('connected', 'needs_reauth', 'revoked')),
  google_account_email text,
  scopes text[] not null default '{}',
  calendar_id text not null default 'primary',
  refresh_token_enc text,
  key_version integer not null default 1,
  last_error text,
  connected_at timestamptz,
  last_refreshed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- short-lived OAuth "state" records: CSRF protection and the PKCE verifier. Single use.
create table if not exists public.sched_oauth_states (
  state_hash text primary key,
  code_verifier_enc text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

-- ------------------------------------------------------------------------------------------------ atomic operations

create or replace function public.sched_create_booking(p jsonb) returns jsonb
language plpgsql set search_path = public as $$
declare
  v_existing public.sched_bookings;
  v_id uuid;
  v_type uuid := (p->>'meeting_type_id')::uuid;
  v_max integer := nullif(p->>'max_per_day', '')::integer;
begin
  -- Serialise booking writes. A single host has a trickle of bookings, so this costs nothing, and it makes concurrent conflicting requests
  -- resolve deterministically (one wins, the rest get slot_unavailable) instead of deadlocking inside the exclusion constraint.
  -- The constraint itself remains the backstop for any write that does not go through these functions.
  perform pg_advisory_xact_lock(7243001);
  -- 1. idempotency: the same key returns the same booking, a different request under that key is refused
  select * into v_existing from public.sched_bookings where idempotency_key = p->>'idempotency_key';
  if found then
    if v_existing.request_hash is distinct from p->>'request_hash' then raise exception 'idempotency_conflict' using errcode = 'SC003'; end if;
    return jsonb_build_object('id', v_existing.id, 'replay', true);
  end if;

  -- 2. per-day cap: serialise requests for the same meeting type and day, then count
  if v_max is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_type::text || '|' || (p->>'day_start'), 0));
    if (select count(*) from public.sched_bookings
         where meeting_type_id = v_type and status = 'confirmed'
           and start_at >= (p->>'day_start')::timestamptz and start_at < (p->>'day_end')::timestamptz) >= v_max then
      raise exception 'day_full' using errcode = 'SC002';
    end if;
  end if;

  -- 3. the booking. The exclusion constraint is the overlap + buffer check, across every meeting type.
  begin
    insert into public.sched_bookings (reference, meeting_type_id, start_at, end_at, buffer_before_minutes, buffer_after_minutes, source, idempotency_key, request_hash, demo, created_at)
    values (p->>'reference', v_type, (p->>'start_at')::timestamptz, (p->>'end_at')::timestamptz,
            (p->>'buffer_before_minutes')::integer, (p->>'buffer_after_minutes')::integer, nullif(p->>'source', ''),
            p->>'idempotency_key', p->>'request_hash', coalesce((p->>'demo')::boolean, false), coalesce((p->>'created_at')::timestamptz, now()))
    returning id into v_id;
  exception
    when exclusion_violation then raise exception 'slot_unavailable' using errcode = 'SC001';
    when unique_violation then
      -- a concurrent request with the same idempotency key won the race
      select * into v_existing from public.sched_bookings where idempotency_key = p->>'idempotency_key';
      if found then
        if v_existing.request_hash is distinct from p->>'request_hash' then raise exception 'idempotency_conflict' using errcode = 'SC003'; end if;
        return jsonb_build_object('id', v_existing.id, 'replay', true);
      end if;
      raise;
  end;

  insert into public.sched_attendees (booking_id, name, email, message, time_zone)
  values (v_id, p->>'guest_name', p->>'guest_email', coalesce(p->>'guest_message', ''), p->>'guest_time_zone');
  insert into public.sched_booking_events (booking_id, kind, detail, actor)
  values (v_id, 'created', case when coalesce((p->>'demo')::boolean, false) then 'Seeded sample booking' else 'Booked online' end, 'guest');
  return jsonb_build_object('id', v_id, 'replay', false);
end $$;

create or replace function public.sched_reschedule_booking(p_id uuid, p jsonb) returns jsonb
language plpgsql set search_path = public as $$
declare
  b public.sched_bookings;
  v_max integer := nullif(p->>'max_per_day', '')::integer;
  v_prev timestamptz;
begin
  -- Serialise booking writes. A single host has a trickle of bookings, so this costs nothing, and it makes concurrent conflicting requests
  -- resolve deterministically (one wins, the rest get slot_unavailable) instead of deadlocking inside the exclusion constraint.
  -- The constraint itself remains the backstop for any write that does not go through these functions.
  perform pg_advisory_xact_lock(7243001);
  select * into b from public.sched_bookings where id = p_id for update;
  if not found then raise exception 'not_found' using errcode = 'SC004'; end if;
  if b.status = 'canceled' then raise exception 'conflict' using errcode = 'SC005'; end if;
  if v_max is not null then
    perform pg_advisory_xact_lock(hashtextextended(b.meeting_type_id::text || '|' || (p->>'day_start'), 0));
    if (select count(*) from public.sched_bookings
         where meeting_type_id = b.meeting_type_id and status = 'confirmed' and id <> p_id
           and start_at >= (p->>'day_start')::timestamptz and start_at < (p->>'day_end')::timestamptz) >= v_max then
      raise exception 'day_full' using errcode = 'SC002';
    end if;
  end if;
  v_prev := b.start_at;
  begin
    update public.sched_bookings
       set start_at = (p->>'start_at')::timestamptz, end_at = (p->>'end_at')::timestamptz, version = version + 1,
           sync_status = 'pending', sync_attempts = 0, sync_next_attempt_at = coalesce((p->>'at')::timestamptz, now()), sync_last_error = null
     where id = p_id;
  exception when exclusion_violation then raise exception 'slot_unavailable' using errcode = 'SC001';
  end;
  insert into public.sched_booking_events (booking_id, kind, detail, actor) values (p_id, 'rescheduled', 'Moved from ' || to_char(v_prev at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') || ' by ' || coalesce(p->>'actor', 'the administrator'), coalesce(p->>'actor', 'admin'));
  return jsonb_build_object('id', p_id);
end $$;

create or replace function public.sched_cancel_booking(p_id uuid, p jsonb) returns jsonb
language plpgsql set search_path = public as $$
declare b public.sched_bookings;
begin
  -- Serialise booking writes. A single host has a trickle of bookings, so this costs nothing, and it makes concurrent conflicting requests
  -- resolve deterministically (one wins, the rest get slot_unavailable) instead of deadlocking inside the exclusion constraint.
  -- The constraint itself remains the backstop for any write that does not go through these functions.
  perform pg_advisory_xact_lock(7243001);
  select * into b from public.sched_bookings where id = p_id for update;
  if not found then raise exception 'not_found' using errcode = 'SC004'; end if;
  if b.status = 'canceled' then return jsonb_build_object('id', p_id, 'changed', false); end if;
  update public.sched_bookings
     set status = 'canceled', canceled_at = coalesce((p->>'at')::timestamptz, now()), version = version + 1,
         sync_status = 'pending', sync_attempts = 0, sync_next_attempt_at = coalesce((p->>'at')::timestamptz, now()), sync_last_error = null
   where id = p_id;
  insert into public.sched_booking_events (booking_id, kind, detail, actor) values (p_id, 'canceled', 'Canceled by ' || coalesce(p->>'actor', 'the administrator'), coalesce(p->>'actor', 'admin'));
  return jsonb_build_object('id', p_id, 'changed', true);
end $$;

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
  insert into public.sched_community_consents (booking_id, choice, wording_version, wording, email, created_at)
  values (b.id, p_state, p->>'wording_version', p->>'wording', p->>'email', (p->>'at')::timestamptz);
  return p_state;
end $$;

-- Takes a booking's sync lock unless another worker holds it. Returns whether this caller got it.
create or replace function public.sched_claim_sync(p_id uuid, p_now timestamptz, p_lock_seconds integer) returns boolean
language plpgsql set search_path = public as $$
begin
  update public.sched_bookings set sync_locked_until = p_now + make_interval(secs => p_lock_seconds)
   where id = p_id and (sync_locked_until is null or sync_locked_until <= p_now);
  return found;
end $$;

-- Bookings whose external state is due another attempt, claimed so concurrent workers never take the same one.
create or replace function public.sched_list_due_sync(p_now timestamptz, p_limit integer) returns setof uuid
language sql set search_path = public as $$
  select id from public.sched_bookings
   where sync_status = 'pending' and coalesce(sync_next_attempt_at, p_now) <= p_now and (sync_locked_until is null or sync_locked_until <= p_now)
   order by coalesce(sync_next_attempt_at, created_at) limit greatest(p_limit, 0)
$$;

-- ------------------------------------------------------------------------------------------------ background execution

-- Release a booking's sync lock and record the outcome, but only if the booking is still at the version the worker was syncing.
-- If a cancel or reschedule landed while the worker held the lock, the outcome describes a stale version: instead of recording it, the
-- booking goes straight back in the queue as due now, and the worker (or the next sweep) runs another pass. This is what stops a
-- worker holding an old copy of a booking from marking it "ok" over a newer change, or leaving an event for a canceled booking behind.
create or replace function public.sched_finish_sync(p_id uuid, p_status text, p_attempts integer, p_next timestamptz, p_error text, p_version integer, p_now timestamptz) returns text
language plpgsql set search_path = public as $$
declare b public.sched_bookings;
begin
  select * into b from public.sched_bookings where id = p_id for update;
  if not found then return 'missing'; end if;
  if p_version is not null and b.version <> p_version then
    update public.sched_bookings set sync_status = 'pending', sync_attempts = 0, sync_next_attempt_at = p_now, sync_last_error = null, sync_locked_until = null where id = p_id;
    return 'superseded';
  end if;
  update public.sched_bookings set sync_status = p_status, sync_attempts = p_attempts, sync_next_attempt_at = p_next, sync_last_error = p_error, sync_locked_until = null where id = p_id;
  return 'applied';
end $$;

-- Replay ledger for inbound webhooks: a signed request is honoured once. The signature check bounds a replay to a few minutes; this closes it.
create table if not exists public.sched_webhook_events (
  provider text not null,
  event_key text not null,
  seen_at timestamptz not null default now(),
  primary key (provider, event_key)
);
create index if not exists sched_webhook_events_seen_idx on public.sched_webhook_events (seen_at);

-- True the first time a (provider, key) is seen, false for every repeat. Old entries are purged on the way (far beyond the signature window).
create or replace function public.sched_seen_webhook(p_provider text, p_key text, p_now timestamptz) returns boolean
language plpgsql set search_path = public as $$
begin
  delete from public.sched_webhook_events where seen_at < p_now - interval '2 days';
  insert into public.sched_webhook_events (provider, event_key, seen_at) values (p_provider, p_key, p_now) on conflict do nothing;
  return found;
end $$;

-- The recovery worker's pulse: written at the end of every sweep, so the admin can see that recovery is actually running.
create table if not exists public.sched_worker_heartbeat (
  id boolean primary key default true check (id),
  last_run_at timestamptz not null,
  last_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------------------------ access control

do $$
declare t text;
begin
  foreach t in array array['sched_settings', 'sched_meeting_types', 'sched_bookings', 'sched_attendees', 'sched_booking_events', 'sched_activity',
                           'sched_external_refs', 'sched_email_attempts', 'sched_community_consents', 'sched_google_connection', 'sched_oauth_states', 'sched_webhook_events', 'sched_worker_heartbeat'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
revoke all on sequence public.sched_booking_events_id_seq from anon, authenticated;
grant usage, select on sequence public.sched_booking_events_id_seq to service_role;

do $$
declare f text;
begin
  foreach f in array array['sched_create_booking(jsonb)', 'sched_reschedule_booking(uuid, jsonb)', 'sched_cancel_booking(uuid, jsonb)', 'sched_set_community(text, text, jsonb)',
                           'sched_claim_sync(uuid, timestamptz, integer)', 'sched_list_due_sync(timestamptz, integer)',
                           'sched_finish_sync(uuid, text, integer, timestamptz, text, integer, timestamptz)', 'sched_seen_webhook(text, text, timestamptz)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
-- Intentionally no policies on any table: the browser roles can do nothing here. Access is server-only through service_role.

notify pgrst, 'reload schema';
