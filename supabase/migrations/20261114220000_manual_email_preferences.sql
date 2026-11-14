create table public.contact_email_preference_audit (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  admin_id uuid not null,
  email text not null,
  action text not null check (action in ('subscribe','unsubscribe','exception','remove')),
  details jsonb not null,
  created_at timestamptz not null default clock_timestamp()
);
create index on public.contact_email_preference_audit(lead_id, created_at desc);
alter table public.contact_email_preference_audit enable row level security;
revoke all on public.contact_email_preference_audit from public, anon, authenticated;
grant select, insert on public.contact_email_preference_audit to service_role;

create function public.record_contact_email_preference(target uuid, actor uuid, expected_email text, operation text, details jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  contact public.leads%rowtype;
  recorded_at timestamptz := clock_timestamp();
begin
  select * into contact from public.leads where id = target for update;
  if not found or contact.email <> expected_email or contact.contact_archived_at is not null then return false; end if;
  if operation in ('subscribe','exception') and (
    contact.suppressed_at is not null or contact.ongoing_content_opt_out_at is not null
    or exists (select 1 from public.consent_records where lead_id = target and action = 'opt_out')
    or exists (select 1 from public.newsletter_delivery_blocks(array[target]))
  ) then return false; end if;
  if operation = 'subscribe' then
    if contact.contact_email_changed_at is not null and (details->>'receivedAt')::date <= (contact.contact_email_changed_at at time zone 'UTC')::date then
      return false;
    end if;
    update public.leads set ongoing_content_opt_in = true, ongoing_content_opt_in_at = recorded_at, consent_requested_at = null where id = target;
    insert into public.consent_records (lead_id, action, wording_version, wording_text, method, source_type, created_at)
      values (target, 'opt_in', 'manual-offline-v1', details->>'evidence', 'legacy', 'admin_offline', recorded_at);
  elsif operation = 'unsubscribe' then
    update public.leads set ongoing_content_opt_in = false, ongoing_content_opt_out_at = coalesce(ongoing_content_opt_out_at, recorded_at),
      consent_requested_at = null where id = target;
    insert into public.consent_records (lead_id, action, wording_version, method, source_type, created_at)
      values (target, 'opt_out', 'manual-admin-v1', 'legacy', 'admin_manual', recorded_at);
  end if;
  insert into public.contact_email_preference_audit(lead_id, admin_id, email, action, details, created_at)
    values (target, actor, contact.email, operation, details, recorded_at);
  return true;
end;
$$;
revoke all on function public.record_contact_email_preference(uuid,uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_contact_email_preference(uuid,uuid,text,text,jsonb) to service_role;
