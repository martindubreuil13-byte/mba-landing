-- Website Intelligence v1: read-only reporting functions (service_role only). Aggregation happens in the database so the
-- admin never pulls raw rows. Ranges are [p_from, p_to) in UTC.
--
-- Every function takes p_prod: when true (production deployments) ONLY rows written by a production deployment are read, so
-- preview / development rows can never appear in production reports even if they somehow reached the same database.
--
-- Cohort rule: every metric is computed for the sessions that STARTED in the range (their page views, events and outcome),
-- so numbers add up across views. A session that spans midnight belongs to the day it started.
--
-- Definitions (also shown in the admin; see docs/website-intelligence/metrics.md):
--   session         one per-tab analytics session (30 min idle timeout). NOT a person. There is no visitor metric: nothing
--                   identifies a returning person, by design.
--   engaged session >= 10 s of visible time, OR >= 2 page views, OR a server-confirmed conversion.
--   engagement time visible time on page, summed per session; average = total / all sessions in range.
--   conversion      a server-confirmed lead event (wi_record_conversion). Never a booking-link click.

-- Overview ---------------------------------------------------------------------------------------------------------
create or replace function public.wi_overview(
  p_from timestamptz, p_to timestamptz, p_prod boolean default false,
  p_content_regex text default '^/(answers|thinking|cases|resources)/.+'
) returns jsonb
language sql stable set search_path = public
as $$
with s as (
  select * from wi_sessions where started_at >= p_from and started_at < p_to and (not p_prod or environment = 'production')
),
pv as (select p.* from wi_pageviews p join s on s.id = p.session_id),
conv as (
  select e.* from wi_events e
   where e.is_conversion and e.occurred_at >= p_from and e.occurred_at < p_to and (not p_prod or e.environment = 'production')
),
days as (
  select g::date as day from generate_series((p_from at time zone 'utc')::date, ((p_to - interval '1 microsecond') at time zone 'utc')::date, interval '1 day') g
),
trend as (
  select d.day, coalesce(a.sessions, 0) as sessions, coalesce(b.views, 0) as pageviews,
         coalesce(a.ai, 0) as ai_sessions, coalesce(c.n, 0) as conversions
    from days d
    left join (select (started_at at time zone 'utc')::date as day, count(*) as sessions, count(*) filter (where ai_platform is not null) as ai from s group by 1) a on a.day = d.day
    left join (select (p.occurred_at at time zone 'utc')::date as day, count(*) as views from pv p group by 1) b on b.day = d.day
    left join (select (occurred_at at time zone 'utc')::date as day, count(*) as n from conv group by 1) c on c.day = d.day
),
sources as (
  select source_category as key, count(*) as sessions,
         count(*) filter (where engaged_ms >= 10000 or page_count >= 2 or converted) as engaged,
         count(*) filter (where converted) as conversions
    from s group by 1 order by 2 desc limit 5
),
landing as (
  select landing_path as key, count(*) as sessions,
         count(*) filter (where engaged_ms >= 10000 or page_count >= 2 or converted) as engaged,
         count(*) filter (where converted) as conversions
    from s group by 1 order by 2 desc, 1 limit 5
),
content as (
  select p.path as key, count(*) as views, count(distinct p.session_id) as sessions,
         coalesce(round(avg(p.engaged_ms) filter (where p.engaged_ms > 0)), 0) as avg_engaged_ms,
         count(distinct p.session_id) filter (where ss.converted) as converting_sessions
    from pv p join s ss on ss.id = p.session_id
   where p.path ~ p_content_regex
   group by 1 order by 5 desc, 2 desc, 1 limit 5
)
select jsonb_build_object(
  'sessions',           (select count(*) from s),
  'pageviews',          (select count(*) from pv),
  'engaged_sessions',   (select count(*) from s where engaged_ms >= 10000 or page_count >= 2 or converted),
  'engaged_ms_total',   (select coalesce(sum(engaged_ms), 0) from s),
  'ai_sessions',        (select count(*) from s where ai_platform is not null),
  'lead_conversions',   (select count(*) from conv),
  'converting_sessions',(select count(*) from s where converted),
  'trend',              (select coalesce(jsonb_agg(to_jsonb(t) order by t.day), '[]') from trend t),
  'top_sources',        (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from sources x),
  'top_landing',        (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from landing x),
  'top_content',        (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from content x)
);
$$;

-- Traffic ----------------------------------------------------------------------------------------------------------
create or replace function public.wi_traffic(p_from timestamptz, p_to timestamptz, p_prod boolean default false)
returns jsonb
language sql stable set search_path = public
as $$
with s as (select * from wi_sessions where started_at >= p_from and started_at < p_to and (not p_prod or environment = 'production'))
select jsonb_build_object(
  'total_sessions', (select count(*) from s),
  'sources', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select source_category as key, count(*) as sessions,
             count(*) filter (where engaged_ms >= 10000 or page_count >= 2 or converted) as engaged,
             coalesce(sum(engaged_ms), 0) as engaged_ms, count(*) filter (where converted) as conversions
        from s group by 1 order by 2 desc limit 15) x),
  'source_details', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select source_category as category, coalesce(ai_platform, source_detail) as key, count(*) as sessions,
             min(source_evidence) as evidence
        from s where source_category <> 'direct' group by 1, 2 order by 3 desc limit 15) x),
  'referrers', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select referrer_host as key, count(*) as sessions from s where referrer_host is not null group by 1 order by 2 desc limit 15) x),
  'campaigns', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select coalesce(utm_source, '(none)') as source, coalesce(utm_medium, '(none)') as medium, coalesce(utm_campaign, '(none)') as campaign,
             count(*) as sessions, count(*) filter (where converted) as conversions
        from s where utm_source is not null or utm_medium is not null or utm_campaign is not null
       group by 1, 2, 3 order by 4 desc limit 15) x),
  'devices', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (select coalesce(device, 'unknown') as key, count(*) as sessions from s group by 1 order by 2 desc) x),
  'browsers', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (select coalesce(browser, 'unknown') as key, count(*) as sessions from s group by 1 order by 2 desc limit 8) x),
  'countries', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (select coalesce(country, 'unknown') as key, count(*) as sessions from s group by 1 order by 2 desc limit 15) x),
  'landing', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select landing_path as key, count(*) as sessions,
             count(*) filter (where engaged_ms >= 10000 or page_count >= 2 or converted) as engaged,
             count(*) filter (where converted) as conversions
        from s group by 1 order by 2 desc, 1 limit 15) x)
);
$$;

-- Content ----------------------------------------------------------------------------------------------------------
-- One row per page seen by sessions that started in range. Categories are applied by the app (it owns the route taxonomy).
--   views / sessions        page views and distinct sessions that viewed the page
--   landing_sessions        sessions that BEGAN on the page
--   continued_sessions      sessions that viewed another page after this one ("encourages further exploration")
--   cta_clicks, starts      events recorded ON this page (event names passed in so the app owns the vocabulary)
--   assisted_leads          sessions that viewed the page AND later/also produced a server-confirmed lead (association only)
--   landing_leads           sessions that landed on the page and produced a lead
create or replace function public.wi_content(
  p_from timestamptz, p_to timestamptz, p_prod boolean default false,
  p_cta_events text[] default '{}', p_start_events text[] default '{}'
) returns jsonb
language sql stable set search_path = public
as $$
with s as (select * from wi_sessions where started_at >= p_from and started_at < p_to and (not p_prod or environment = 'production')),
pv as (
  select p.*, s.source_category, s.converted, s.landing_path,
         max(p.seq) over (partition by p.session_id) as last_seq
    from wi_pageviews p join s on s.id = p.session_id
),
per_page as (
  select path,
         (array_agg(title order by occurred_at desc) filter (where title is not null))[1] as title,
         count(*) as views,
         count(distinct session_id) as sessions,
         count(distinct session_id) filter (where landing_path = path) as landing_sessions,
         coalesce(round(avg(engaged_ms) filter (where engaged_ms > 0)), 0) as avg_engaged_ms,
         count(distinct session_id) filter (where seq < last_seq) as continued_sessions,
         count(distinct session_id) filter (where converted) as assisted_leads,
         count(distinct session_id) filter (where converted and landing_path = path) as landing_leads
    from pv group by path
),
src as (
  select path, source_category as key, count(distinct session_id) as n,
         row_number() over (partition by path order by count(distinct session_id) desc, source_category) as rn
    from pv group by path, source_category
),
ev as (
  select e.path,
         count(*) filter (where e.name = any (p_cta_events)) as cta_clicks,
         count(*) filter (where e.name = any (p_start_events)) as starts
    from wi_events e join s on s.id = e.session_id
   where e.path is not null group by e.path
)
select coalesce(jsonb_agg(jsonb_build_object(
  'path', pp.path, 'title', pp.title, 'views', pp.views, 'sessions', pp.sessions, 'landing_sessions', pp.landing_sessions,
  'avg_engaged_ms', pp.avg_engaged_ms, 'continued_sessions', pp.continued_sessions,
  'assisted_leads', pp.assisted_leads, 'landing_leads', pp.landing_leads,
  'cta_clicks', coalesce(ev.cta_clicks, 0), 'starts', coalesce(ev.starts, 0),
  'sources', (select coalesce(jsonb_agg(jsonb_build_object('key', k.key, 'sessions', k.n) order by k.rn), '[]') from src k where k.path = pp.path and k.rn <= 3)
) order by pp.views desc, pp.path), '[]')
from per_page pp left join ev on ev.path = pp.path;
$$;

-- Conversions ------------------------------------------------------------------------------------------------------
create or replace function public.wi_conversions(
  p_from timestamptz, p_to timestamptz, p_prod boolean default false,
  p_cta_events text[] default '{}', p_start_events text[] default '{}', p_complete_events text[] default '{}',
  p_booking_events text[] default '{}'
) returns jsonb
language sql stable set search_path = public
as $$
with s as (select * from wi_sessions where started_at >= p_from and started_at < p_to and (not p_prod or environment = 'production')),
conv as (
  select e.*, s.source_category, s.landing_path, s.ai_platform
    from wi_events e left join wi_sessions s on s.id = e.session_id
   where e.is_conversion and e.occurred_at >= p_from and e.occurred_at < p_to and (not p_prod or e.environment = 'production')
),
sev as (select e.session_id, e.name from wi_events e join s on s.id = e.session_id),
days as (
  select g::date as day from generate_series((p_from at time zone 'utc')::date, ((p_to - interval '1 microsecond') at time zone 'utc')::date, interval '1 day') g
)
select jsonb_build_object(
  'sessions', (select count(*) from s),
  'engaged_sessions', (select count(*) from s where engaged_ms >= 10000 or page_count >= 2 or converted),
  'total_leads', (select count(*) from conv),
  'attributed_leads', (select count(*) from conv where session_id is not null),
  'converting_sessions', (select count(*) from s where converted),
  'by_kind', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (select conversion_kind as key, count(*) as n from conv group by 1 order by 2 desc) x),
  'by_source', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select coalesce(source_category, 'unattributed') as key, count(*) as n from conv group by 1 order by 2 desc) x),
  'by_landing', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select coalesce(landing_path, '(unattributed)') as key, count(*) as n from conv group by 1 order by 2 desc, 1 limit 15) x),
  'by_converting_page', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select coalesce(path, '(unknown)') as key, count(*) as n from conv group by 1 order by 2 desc, 1 limit 15) x),
  'trend', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'n', coalesce(c.n, 0)) order by d.day), '[]')
              from days d left join (select (occurred_at at time zone 'utc')::date as day, count(*) as n from conv group by 1) c on c.day = d.day),
  'sessions_with_cta',      (select count(distinct session_id) from sev where name = any (p_cta_events)),
  'sessions_with_start',    (select count(distinct session_id) from sev where name = any (p_start_events)),
  'sessions_with_complete', (select count(distinct session_id) from sev where name = any (p_complete_events)),
  'booking_clicks',         (select count(*) from sev where name = any (p_booking_events)),
  'sessions_with_booking_click', (select count(distinct session_id) from sev where name = any (p_booking_events))
);
$$;

-- AI visibility (referrals only; crawler activity is not measured) -------------------------------------------------
create or replace function public.wi_ai_referrals(p_from timestamptz, p_to timestamptz, p_prod boolean default false)
returns jsonb
language sql stable set search_path = public
as $$
with s as (
  select * from wi_sessions where started_at >= p_from and started_at < p_to and (not p_prod or environment = 'production')
),
ai as (select * from s where ai_platform is not null),
days as (
  select g::date as day from generate_series((p_from at time zone 'utc')::date, ((p_to - interval '1 microsecond') at time zone 'utc')::date, interval '1 day') g
)
select jsonb_build_object(
  'total_sessions', (select count(*) from s),
  'ai_sessions', (select count(*) from ai),
  'platforms', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select ai_platform as key, count(*) as sessions,
             count(*) filter (where engaged_ms >= 10000 or page_count >= 2 or converted) as engaged,
             coalesce(sum(engaged_ms), 0) as engaged_ms, count(*) filter (where converted) as conversions
        from ai group by 1 order by 2 desc) x),
  'landing', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select landing_path as key, count(*) as sessions, count(*) filter (where converted) as conversions
        from ai group by 1 order by 2 desc, 1 limit 15) x),
  'evidence', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from (
      select ai_platform as platform, source_evidence as evidence, count(*) as sessions
        from ai group by 1, 2 order by 3 desc limit 20) x),
  'trend', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'n', coalesce(c.n, 0)) order by d.day), '[]')
              from days d left join (select (started_at at time zone 'utc')::date as day, count(*) as n from ai group by 1) c on c.day = d.day)
);
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'wi_overview(timestamptz, timestamptz, boolean, text)',
    'wi_traffic(timestamptz, timestamptz, boolean)',
    'wi_content(timestamptz, timestamptz, boolean, text[], text[])',
    'wi_conversions(timestamptz, timestamptz, boolean, text[], text[], text[], text[])',
    'wi_ai_referrals(timestamptz, timestamptz, boolean)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ROLLBACK:
--   drop function if exists public.wi_ai_referrals(timestamptz, timestamptz, boolean);
--   drop function if exists public.wi_conversions(timestamptz, timestamptz, boolean, text[], text[], text[], text[]);
--   drop function if exists public.wi_content(timestamptz, timestamptz, boolean, text[], text[]);
--   drop function if exists public.wi_traffic(timestamptz, timestamptz, boolean);
--   drop function if exists public.wi_overview(timestamptz, timestamptz, boolean, text);
