-- MBA Scheduling, Phase 2G: Zoom resource ownership (independent Phase 2F verification, F-01).
-- ADDITIVE and ordered AFTER 20261103090000_mba_scheduling_phase2f.sql. NOT applied to any hosted database; applied to the LOCAL stack only. Re-runnable.
--
-- THE OWNERSHIP RULE. A Zoom meeting may be deleted only after the database has CONDEMNED it, and condemning is refused while the meeting is the
-- booking's authoritative (recorded, synced) meeting. Condemning and recording share one lock (the booking row), so they cannot interleave:
--   * if a worker records a meeting first, a cleanup that wanted to delete it is refused ('owned') and stands down;
--   * if a cleanup condemns a meeting first, no worker can record it afterwards (a trigger refuses), so a deletion decided earlier can never
--     remove a meeting that was adopted later.
-- A condemned meeting stays condemned (its row is the durable "delete this" intent), so a cleanup that dies after condemning is finished by the next scan.

create table if not exists public.sched_zoom_tombstones (
  external_id text primary key,
  booking_id uuid not null references public.sched_bookings(id) on delete cascade,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'deleted')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists sched_zoom_tombstones_pending_idx on public.sched_zoom_tombstones (created_at) where status = 'pending';
alter table public.sched_zoom_tombstones enable row level security;
revoke all on public.sched_zoom_tombstones from anon, authenticated;
grant all on public.sched_zoom_tombstones to service_role;

drop function if exists public.sched_zoom_condemn(uuid, text, text);
drop function if exists public.sched_zoom_condemn_done(text);

-- Returns 'condemned' (also when it already was: deleting twice is fine), 'owned' (it is the authoritative meeting of a confirmed booking, or of another
-- booking: do not delete), or 'missing' (no such booking).
create function public.sched_zoom_condemn(p_booking uuid, p_external text, p_reason text) returns text
language plpgsql set search_path = public as $$
declare b public.sched_bookings;
begin
  select * into b from public.sched_bookings where id = p_booking for update;
  if not found then return 'missing'; end if;
  if exists (select 1 from public.sched_external_refs r where r.provider = 'zoom' and r.external_id = p_external and r.status = 'synced'
             and (r.booking_id <> p_booking or b.status = 'confirmed')) then
    return 'owned';
  end if;
  insert into public.sched_zoom_tombstones (external_id, booking_id, reason) values (p_external, p_booking, left(coalesce(p_reason, ''), 200)) on conflict (external_id) do nothing;
  return 'condemned';
end $$;

create function public.sched_zoom_condemn_done(p_external text) returns void
language plpgsql set search_path = public as $$
begin
  update public.sched_zoom_tombstones set status = 'deleted', deleted_at = now() where external_id = p_external and status = 'pending';
end $$;

-- No path may record a condemned meeting as a booking's synced meeting. The trigger takes the booking's row lock first, so it is serialised with
-- sched_zoom_condemn even for writes that do not go through the fenced function.
create or replace function public.sched_refs_refuse_condemned() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.provider = 'zoom' and new.external_id is not null and new.status = 'synced' then
    perform 1 from public.sched_bookings where id = new.booking_id for update;
    if exists (select 1 from public.sched_zoom_tombstones t where t.external_id = new.external_id) then
      raise exception 'condemned' using errcode = 'SC006';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists sched_refs_no_condemned on public.sched_external_refs;
create trigger sched_refs_no_condemned before insert or update on public.sched_external_refs for each row execute function public.sched_refs_refuse_condemned();

do $$
declare f text;
begin
  foreach f in array array['sched_zoom_condemn(uuid, text, text)', 'sched_zoom_condemn_done(text)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
