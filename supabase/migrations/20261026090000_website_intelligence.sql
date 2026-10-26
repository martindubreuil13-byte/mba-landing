-- Website Intelligence v1: first-party, cookieless analytics.
-- Additive only: creates new wi_* tables/functions, touches no existing table. Service-role access only (RLS on, no policies).
-- No visitor identifier of any kind is stored: no IP, no IP/user-agent hash, no cookie id. The only identifier is the random
-- per-tab session id the browser generates and discards when the tab closes (or after 30 minutes idle).
-- Rollback: see the bottom of this file (and docs/website-intelligence/README.md).

-- ---------------------------------------------------------------------------------------------------------------
-- Sessions: one row per short-lived, per-tab session id. NOT a person.
-- ---------------------------------------------------------------------------------------------------------------
create table public.wi_sessions (
  id              text primary key check (char_length(id) between 16 and 64),
  -- Which deployment wrote the row. Production reports only ever read 'production' rows, even if a misconfigured
  -- non-production deployment somehow reached this database.
  environment     text not null default 'production' check (environment in ('production', 'preview', 'development')),
  started_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  landing_path    text not null,
  last_path       text,
  -- Raw attribution inputs are kept so classification can be revised. Referrer is origin + path only (no query).
  referrer        text,
  referrer_host   text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  source_category text not null default 'direct',
  source_detail   text,
  ai_platform     text,
  source_evidence text,
  device          text,
  browser         text,
  country         text check (country is null or char_length(country) = 2),
  page_count      integer not null default 0,
  event_count     integer not null default 0,
  engaged_ms      bigint not null default 0,
  converted       boolean not null default false,
  first_conversion text,
  converted_at    timestamptz
);
create index wi_sessions_started_idx on public.wi_sessions (started_at desc);
create index wi_sessions_source_idx on public.wi_sessions (source_category, started_at desc);
create index wi_sessions_landing_idx on public.wi_sessions (landing_path, started_at desc);
create index wi_sessions_ai_idx on public.wi_sessions (started_at desc) where ai_platform is not null;
create index wi_sessions_converted_idx on public.wi_sessions (started_at desc) where converted;

create table public.wi_pageviews (
  id          bigint generated always as identity primary key,
  session_id  text not null references public.wi_sessions (id) on delete cascade,
  view_id     text not null check (char_length(view_id) between 8 and 64),
  seq         integer not null default 0,
  path        text not null,
  title       text,
  occurred_at timestamptz not null default now(),
  engaged_ms  integer not null default 0,
  unique (session_id, view_id)
);
create index wi_pageviews_time_idx on public.wi_pageviews (occurred_at desc);
create index wi_pageviews_path_idx on public.wi_pageviews (path, occurred_at desc);

create table public.wi_events (
  id              bigint generated always as identity primary key,
  -- Null for a server-confirmed conversion whose visitor sent no session id (GPC/DNT, blocked script): still counted.
  session_id      text references public.wi_sessions (id) on delete cascade,
  environment     text not null default 'production' check (environment in ('production', 'preview', 'development')),
  event_id        text not null check (char_length(event_id) between 8 and 120),
  name            text not null,
  path            text,
  occurred_at     timestamptz not null default now(),
  props           jsonb not null default '{}'::jsonb,
  origin          text not null default 'browser' check (origin in ('browser', 'server')),
  -- Only the server may set these: a conversion is something the server confirmed, never a browser claim.
  is_conversion   boolean not null default false,
  conversion_kind text,
  -- Reference to the system of record (e.g. leads / program_applications). Never any personal data.
  ref_table       text,
  ref_id          text,
  unique (session_id, event_id)
);
create index wi_events_time_idx on public.wi_events (occurred_at desc);
create index wi_events_name_idx on public.wi_events (name, occurred_at desc);
create index wi_events_session_idx on public.wi_events (session_id, occurred_at);
create index wi_events_conv_idx on public.wi_events (occurred_at desc) where is_conversion;
-- Idempotency for server-confirmed events (a retried request or a double submit records one conversion).
create unique index wi_events_server_uq on public.wi_events (event_id) where origin = 'server';

-- Configurable list of AI assistant referral domains (host equals or is a subdomain of `domain`).
create table public.wi_ai_referral_domains (
  domain   text primary key check (domain = lower(domain)),
  platform text not null,
  active   boolean not null default true,
  note     text
);
insert into public.wi_ai_referral_domains (domain, platform, note) values
  ('chatgpt.com',            'ChatGPT',           'ChatGPT also appends utm_source=chatgpt.com to links it opens'),
  ('chat.openai.com',        'ChatGPT',           'legacy host'),
  ('claude.ai',              'Claude',            null),
  ('perplexity.ai',          'Perplexity',        null),
  ('gemini.google.com',      'Gemini',            null),
  ('bard.google.com',        'Gemini',            'legacy host'),
  ('copilot.microsoft.com',  'Microsoft Copilot', null),
  ('copilot.cloud.microsoft','Microsoft Copilot', null),
  ('edgeservices.bing.com',  'Microsoft Copilot', 'Copilot in Edge'),
  ('chat.deepseek.com',      'DeepSeek',          null),
  ('grok.com',               'Grok',              null),
  ('meta.ai',                'Meta AI',           null),
  ('you.com',                'You.com',           null),
  ('phind.com',              'Phind',             null),
  ('poe.com',                'Poe',               null),
  ('chat.mistral.ai',        'Le Chat (Mistral)', null),
  ('duck.ai',                'Duck.ai',           null);

alter table public.wi_sessions enable row level security;
alter table public.wi_pageviews enable row level security;
alter table public.wi_events enable row level security;
alter table public.wi_ai_referral_domains enable row level security;
-- No policies: only the service-role client (server code) can read or write.

-- ---------------------------------------------------------------------------------------------------------------
-- Ingest: one atomic, idempotent call per beacon. Safe to retry: sessions, page views and events are de-duplicated.
-- Caps per session (200 page views, 500 events) bound spam. Timestamps are server time minus the client-reported age.
-- Browser events can NEVER be conversions: that flag is only ever set by wi_record_conversion (server-confirmed).
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.wi_ingest(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  s        jsonb := p->'session';
  v_sid    text  := p->'session'->>'id';
  v_env    text  := coalesce(p->'session'->>'environment', 'production');
  v_pc     integer;
  v_ec     integer;
  v_new_pv integer := 0;
  v_new_ev integer := 0;
begin
  insert into wi_sessions (id, environment, landing_path, last_path, referrer, referrer_host,
    utm_source, utm_medium, utm_campaign, utm_content, source_category, source_detail, ai_platform, source_evidence,
    device, browser, country)
  values (v_sid, v_env, s->>'landing_path', s->>'landing_path',
    s->>'referrer', s->>'referrer_host', s->>'utm_source', s->>'utm_medium', s->>'utm_campaign', s->>'utm_content',
    coalesce(s->>'source_category', 'direct'), s->>'source_detail', s->>'ai_platform', s->>'source_evidence',
    s->>'device', s->>'browser', s->>'country')
  on conflict (id) do nothing;

  select page_count, event_count into v_pc, v_ec from wi_sessions where id = v_sid;

  with ins as (
    insert into wi_pageviews (session_id, view_id, seq, path, title, occurred_at)
    select v_sid, x.view_id, coalesce(x.seq, 0), x.path, x.title,
           now() - make_interval(secs => least(greatest(coalesce(x.age_ms, 0), 0), 1800000) / 1000.0)
    from jsonb_to_recordset(coalesce(p->'pageviews', '[]'::jsonb)) as x(view_id text, seq integer, path text, title text, age_ms integer)
    order by x.seq
    limit greatest(0, 200 - v_pc)
    on conflict (session_id, view_id) do nothing
    returning 1
  ) select count(*) into v_new_pv from ins;

  update wi_pageviews pv
     set engaged_ms = l.ms
    from (select view_id, least(greatest(ms, 0), 1800000) as ms
            from jsonb_to_recordset(coalesce(p->'leaves', '[]'::jsonb)) as l(view_id text, ms integer)) l
   where pv.session_id = v_sid and pv.view_id = l.view_id and l.ms > pv.engaged_ms;

  with ins as (
    insert into wi_events (session_id, environment, event_id, name, path, occurred_at, props, origin)
    select v_sid, v_env, x.event_id, x.name, x.path,
           now() - make_interval(secs => least(greatest(coalesce(x.age_ms, 0), 0), 1800000) / 1000.0),
           coalesce(x.props, '{}'::jsonb), 'browser'
    from jsonb_to_recordset(coalesce(p->'events', '[]'::jsonb))
         as x(event_id text, name text, path text, age_ms integer, props jsonb)
    limit greatest(0, 500 - v_ec)
    on conflict (session_id, event_id) do nothing
    returning 1
  ) select count(*) into v_new_ev from ins;

  update wi_sessions set
      last_seen_at = now(),
      page_count   = page_count + v_new_pv,
      event_count  = event_count + v_new_ev,
      last_path    = coalesce((select pv.path from wi_pageviews pv where pv.session_id = v_sid order by pv.seq desc, pv.id desc limit 1), last_path),
      engaged_ms   = (select coalesce(sum(pv.engaged_ms), 0) from wi_pageviews pv where pv.session_id = v_sid)
   where id = v_sid;

  return jsonb_build_object('pageviews', v_new_pv, 'events', v_new_ev);
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Server-confirmed conversion. Called by the server AFTER the system of record accepted the submission.
-- p: { event_id (idempotency key), name, kind, path, sid (optional), ref_table, ref_id, props, environment }
-- A known session is marked converted; otherwise the conversion is still recorded, unattributed (session_id null).
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.wi_record_conversion(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_sid  text;
  v_new  integer;
begin
  select id into v_sid from wi_sessions where id = p->>'sid';

  with ins as (
    insert into wi_events (session_id, environment, event_id, name, path, props, origin, is_conversion, conversion_kind, ref_table, ref_id)
    values (v_sid, coalesce(p->>'environment', 'production'), p->>'event_id', p->>'name', p->>'path',
            coalesce(p->'props', '{}'::jsonb), 'server', true, p->>'kind', p->>'ref_table', p->>'ref_id')
    on conflict (event_id) where origin = 'server' do nothing
    returning 1
  ) select count(*) into v_new from ins;

  if v_new > 0 and v_sid is not null then
    update wi_sessions set
        converted = true,
        first_conversion = coalesce(first_conversion, p->>'kind'),
        converted_at = coalesce(converted_at, now()),
        event_count = event_count + 1
     where id = v_sid;
  end if;
  return jsonb_build_object('recorded', v_new > 0, 'attributed', v_sid is not null);
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Retention. Run once a day by /api/cron/intelligence-maintenance (Vercel Hobby supports daily crons).
--   * page views + events older than 13 months are deleted; whole sessions older than 25 months
--   * this feature's own rate-limit keys older than a day are removed
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.wi_maintenance(p_now timestamptz default now())
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_pv integer; v_ev integer; v_sess integer; v_rl integer;
begin
  delete from wi_pageviews where occurred_at < p_now - interval '13 months'; get diagnostics v_pv = row_count;
  delete from wi_events    where occurred_at < p_now - interval '13 months'; get diagnostics v_ev = row_count;
  delete from wi_sessions  where started_at  < p_now - interval '25 months'; get diagnostics v_sess = row_count;
  delete from api_rate_limits where key like 'wi:%' and window_start < p_now - interval '1 day'; get diagnostics v_rl = row_count;
  return jsonb_build_object('pageviews_deleted', v_pv, 'events_deleted', v_ev, 'sessions_deleted', v_sess, 'rate_limit_keys_deleted', v_rl);
end;
$$;

revoke all on function public.wi_ingest(jsonb) from public, anon, authenticated;
revoke all on function public.wi_record_conversion(jsonb) from public, anon, authenticated;
revoke all on function public.wi_maintenance(timestamptz) from public, anon, authenticated;
grant execute on function public.wi_ingest(jsonb) to service_role;
grant execute on function public.wi_record_conversion(jsonb) to service_role;
grant execute on function public.wi_maintenance(timestamptz) to service_role;

-- ROLLBACK (drops only Website Intelligence objects; nothing else depends on them):
--   drop function if exists public.wi_maintenance(timestamptz);
--   drop function if exists public.wi_record_conversion(jsonb);
--   drop function if exists public.wi_ingest(jsonb);
--   drop table if exists public.wi_events, public.wi_pageviews, public.wi_sessions, public.wi_ai_referral_domains;
