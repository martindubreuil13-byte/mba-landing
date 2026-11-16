alter table public.email_campaigns add column intelligence_started_at timestamptz;
create table public.campaign_provider_events (
  event_id text primary key,
  campaign_id uuid not null references public.email_campaigns(id),
  lead_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null
);
create index on public.campaign_provider_events(campaign_id);
create table public.campaign_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id),
  recipient_key uuid not null,
  destination text not null,
  created_at timestamptz not null default now(),
  observed integer not null default 0,
  suspected integer not null default 0
);
create index on public.campaign_links(campaign_id);
create table public.campaign_bookings (
  booking_id uuid primary key references public.sched_bookings(id),
  link_id uuid not null references public.campaign_links(id)
);
create index on public.campaign_bookings(link_id);

alter table public.campaign_provider_events enable row level security;
alter table public.campaign_links enable row level security;
alter table public.campaign_bookings enable row level security;
revoke all on public.campaign_provider_events, public.campaign_links, public.campaign_bookings from public, anon, authenticated;
grant select, insert, update on public.campaign_provider_events, public.campaign_links, public.campaign_bookings to service_role;

create function public.record_campaign_provider_event(message_id text, external_id text, kind text, event_time timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare delivery public.email_campaign_deliveries%rowtype;
begin
  select * into delivery from public.email_campaign_deliveries where provider_id = message_id;
  if not found then return false; end if;
  insert into public.campaign_provider_events values (external_id, delivery.campaign_id, delivery.lead_id, kind, event_time)
    on conflict (event_id) do nothing;
  if found and kind in ('email.bounced', 'email.complained', 'email.suppressed') then
    update public.email_campaign_deliveries set provider_block = kind
      where campaign_id = delivery.campaign_id and email = delivery.email;
  end if;
  return true;
end;
$$;

create function public.record_campaign_click(link uuid, scanner boolean)
returns void language sql security invoker set search_path = '' as $$
  update public.campaign_links set observed = observed + (not scanner)::int,
    suspected = suspected + scanner::int where id = link;
$$;

create function public.attribute_campaign_booking(booking_ref text, link uuid)
returns void language sql security invoker set search_path = '' as $$
  insert into public.campaign_bookings (booking_id, link_id)
  select b.id, l.id from public.sched_bookings b
  join public.sched_meeting_types m on m.id = b.meeting_type_id
  join public.campaign_links l on l.id = link
  where b.reference = booking_ref and m.slug = 'complementary-session'
    and l.observed > 0 and l.created_at > now() - interval '30 days'
  on conflict (booking_id) do nothing;
$$;

create function public.campaign_engagement(campaign uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'clicks', coalesce(sum(observed), 0),
    'unique', count(distinct recipient_key) filter (where observed > 0),
    'suspected', coalesce(sum(suspected), 0),
    'bookings', (select count(*) from public.campaign_bookings b join public.campaign_links l on l.id = b.link_id where l.campaign_id = campaign),
    'destinations', coalesce((select jsonb_agg(to_jsonb(d) order by d.clicks desc) from (
      select destination, sum(observed) as clicks, count(distinct recipient_key) filter (where observed > 0) as unique_clicks
      from public.campaign_links where campaign_id = campaign group by destination
    ) d), '[]'::jsonb)
  ) from public.campaign_links where campaign_id = campaign;
$$;

revoke all on function public.record_campaign_provider_event(text,text,text,timestamptz), public.record_campaign_click(uuid,boolean),
  public.attribute_campaign_booking(text,uuid), public.campaign_engagement(uuid) from public, anon, authenticated;
grant execute on function public.record_campaign_provider_event(text,text,text,timestamptz), public.record_campaign_click(uuid,boolean),
  public.attribute_campaign_booking(text,uuid), public.campaign_engagement(uuid) to service_role;
