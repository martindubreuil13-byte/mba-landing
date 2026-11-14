create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preview_text text not null,
  body_html text not null,
  body_text text not null,
  selected_count integer not null check (selected_count between 1 and 1000),
  exclusions jsonb not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  recipients jsonb not null check (jsonb_typeof(recipients) = 'array' and jsonb_array_length(recipients) between 1 and 25)
);
create table public.email_campaign_deliveries (
  campaign_id uuid not null references public.email_campaigns(id),
  lead_id uuid not null,
  email text not null,
  status text not null check (status in ('attempting','sent','failed','unknown','excluded')),
  reason text,
  provider_id text,
  updated_at timestamptz not null default now(),
  primary key (campaign_id, email)
);
alter table public.email_campaigns enable row level security;
alter table public.email_campaign_deliveries enable row level security;
revoke all on public.email_campaigns, public.email_campaign_deliveries from public, anon, authenticated;
grant select, insert, update on public.email_campaigns, public.email_campaign_deliveries to service_role;

create function public.suppress_newsletter_recipient(recipient_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  was_suppressed boolean;
  was_opted_in boolean;
  changed_at timestamptz := now();
begin
  select suppressed_at is not null, ongoing_content_opt_in into was_suppressed, was_opted_in
    from public.leads where id = recipient_id for update;
  if not found then return false; end if;
  if was_suppressed and not was_opted_in then return true; end if;
  update public.leads set ongoing_content_opt_in = false, ongoing_content_opt_out_at = changed_at,
    consent_requested_at = null, suppressed_at = coalesce(suppressed_at, changed_at),
    suppression_reason = coalesce(suppression_reason, 'newsletter_unsubscribe')
    where id = recipient_id;
  insert into public.consent_records (lead_id, action, wording_version, method, created_at)
    values (recipient_id, 'opt_out', 'unsubscribe-v1', 'unsubscribe_link', changed_at);
  return true;
end;
$$;
revoke all on function public.suppress_newsletter_recipient(uuid) from public, anon, authenticated;
grant execute on function public.suppress_newsletter_recipient(uuid) to service_role;
