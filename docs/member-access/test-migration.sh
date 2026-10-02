#!/bin/bash
# Local-only proof for migration 20261003090000_resource_member_access.sql:
# builds a production-like pre-migration state, applies the migration FILE, and compares before/after.
# Needs the local Supabase stack (supabase start). NEVER point this at a real project.
set -e
export PGPASSWORD=postgres
cd "$(dirname "$0")/../.."
P() { psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }
MIG=supabase/migrations/20261003090000_resource_member_access.sql

echo "== 1. return to the pre-migration state (this is also the documented rollback)"
P -q -c "truncate resource_events, consent_records, resource_requests, leads cascade; drop index if exists public.resource_requests_locked_idx; alter table public.resource_requests drop column if exists benefit_fulfilled_at; delete from supabase_migrations.schema_migrations where version='20261003090000';"

echo "== 2. production-like data: one pending lead (v1.1 request, link already issued), one member, one more pending"
P -q <<'SQL'
insert into resources (id, title, slug, short_description, resource_type, file_path, file_name, published)
  values ('aaaaaaaa-0000-0000-0000-000000000001','Build The Bridge First','build-the-bridge-first-mig','x','Guide','p/x.pdf','x.pdf',true) on conflict (slug) do nothing;
insert into leads (id,email,first_name,ongoing_content_opt_in,ongoing_content_opt_in_at,consent_requested_at,lead_status) values
 ('bbbbbbbb-0000-0000-0000-000000000001','a-pending@example.test','',false,null,now()-interval '1 day','new'),
 ('bbbbbbbb-0000-0000-0000-000000000002','b-member@example.test','',true,now()-interval '3 days',null,'new'),
 ('bbbbbbbb-0000-0000-0000-000000000003','c-pending@example.test','',false,null,now()-interval '5 hours','new');
insert into resource_requests (id, lead_id, resource_id, requested_at, opted_in_this_request, delivery_status, download_count)
  select ('cccccccc-0000-0000-0000-00000000000'||n)::uuid, ('bbbbbbbb-0000-0000-0000-00000000000'||n)::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid, now()-interval '1 day', n<>2, 'delivered', n-1 from generate_series(1,3) n;
insert into consent_records (lead_id, action, wording_version, method, source_resource_id, created_at) values
 ('bbbbbbbb-0000-0000-0000-000000000001','opt_in_requested','resource-guide-consent-v1.1','button_disclosure','aaaaaaaa-0000-0000-0000-000000000001', now()-interval '1 day'),
 ('bbbbbbbb-0000-0000-0000-000000000003','opt_in_requested','resource-guide-consent-v1.1','button_disclosure','aaaaaaaa-0000-0000-0000-000000000001', now()-interval '5 hours');
insert into resource_events (event_name, resource_id, resource_slug, resource_type, lead_id, request_id) values
 ('resource_form_submitted','aaaaaaaa-0000-0000-0000-000000000001','build-the-bridge-first-mig','Guide','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001');
SQL

snap() { P -At -c "
 select 'leads',count(*),md5(string_agg(l::text,'|' order by id)) from leads l union all
 select 'consent_records',count(*),md5(string_agg(c::text,'|' order by id)) from consent_records c union all
 select 'resource_events',count(*),md5(string_agg(e::text,'|' order by id)) from resource_events e union all
 select 'resources',count(*),md5(string_agg(x::text,'|' order by id)) from resources x union all
 select 'program_applications',count(*),md5(coalesce(string_agg(p::text,'|' order by id),'')) from program_applications p union all
 select 'resource_requests (all columns)',count(*),md5(string_agg(to_jsonb(r)::text,'|' order by id)) from resource_requests r"; }
snap > /tmp/mig-pre.txt

echo "== 3. apply the migration FILE exactly as written"
P -q -f "$MIG"
snap > /tmp/mig-post.txt
echo "-- tables that must be byte-identical before/after:"
diff <(grep -v "resource_requests" /tmp/mig-pre.txt) <(grep -v "resource_requests" /tmp/mig-post.txt) && echo "leads, consent_records, resource_events, resources, program_applications: IDENTICAL"
echo "-- backfill: every pre-existing request is unlocked at its own request time:"
P -At -c "select count(*) filter (where benefit_fulfilled_at = requested_at) || ' of ' || count(*) || ' requests backfilled to requested_at; ' || count(*) filter (where benefit_fulfilled_at is null) || ' still locked' from resource_requests"
echo "-- the schema change:"
P -At -c "select column_name||' '||data_type||' nullable='||is_nullable||' default='||coalesce(column_default,'none') from information_schema.columns where table_name='resource_requests' and column_name='benefit_fulfilled_at'"
P -At -c "select indexdef from pg_indexes where indexname='resource_requests_locked_idx'"

echo "== 4. rollback"
P -q -c "drop index if exists public.resource_requests_locked_idx; alter table public.resource_requests drop column if exists benefit_fulfilled_at;"
snap > /tmp/mig-rolled.txt
diff /tmp/mig-pre.txt /tmp/mig-rolled.txt && echo "after rollback every table (incl. resource_requests) equals the pre-migration snapshot"

echo "== 5. re-apply so the local DB ends in the migrated state"
P -q -f "$MIG"
P -q -c "insert into supabase_migrations.schema_migrations (version,name) values ('20261003090000','resource_member_access') on conflict do nothing"
echo done
