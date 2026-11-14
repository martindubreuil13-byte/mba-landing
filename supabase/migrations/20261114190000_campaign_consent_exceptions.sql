alter table public.email_campaigns add column exceptions_acknowledged_by uuid,
  add column has_consent_exceptions boolean generated always as (jsonb_path_exists(recipients, '$[*].exception')) stored;
alter table public.email_campaign_deliveries add column provider_block text
  check (provider_block in ('email.bounced', 'email.complained', 'email.suppressed'));
create index email_campaign_delivery_provider_idx on public.email_campaign_deliveries(provider_id) where provider_id is not null;

create function public.newsletter_delivery_blocks(contact_ids uuid[])
returns table (lead_id uuid)
language sql stable security invoker set search_path = '' as $$
  select l.id from public.leads l where l.id = any(contact_ids) and (
    exists (select 1 from public.resource_requests r where r.lead_id = l.id and r.delivery_status = 'bounced')
    or exists (select 1 from public.program_applications a join public.program_invitation_sends i on i.application_id = a.id
               where a.lead_id = l.id and i.delivery_status = 'bounced')
    or exists (select 1 from public.sched_email_attempts s where lower(btrim(s.to_email)) = lower(btrim(l.email)) and s.delivery_status = 'bounced')
    or exists (select 1 from public.email_campaign_deliveries d where d.provider_block is not null
               and (d.lead_id = l.id or d.email = lower(btrim(l.email))))
  );
$$;
revoke all on function public.newsletter_delivery_blocks(uuid[]) from public, anon, authenticated;
grant execute on function public.newsletter_delivery_blocks(uuid[]) to service_role;
