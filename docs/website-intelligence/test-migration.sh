#!/bin/bash
# Tests the Website Intelligence migrations against the LOCAL Supabase database (never a remote one):
#   1. migrations apply to a database that already has the production schema
#   2. nothing outside wi_* changes (row counts of every pre-existing table are identical before/after)
#   3. docs/website-intelligence/rollback.sql removes every wi_* object cleanly, and re-applying works
#   4. wi_maintenance deletes beyond retention and nothing else; no table holds any visitor/IP/hash column
#   5. production-scope reports (p_prod) never see preview/development rows; server conversions are idempotent and browser events can never convert
# Needs: `supabase start` (Docker). Usage: docs/website-intelligence/test-migration.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=supabase_db_mba-site
psql_() { docker exec -i $DB psql -U postgres -v ON_ERROR_STOP=1 -q -t -A "$@"; }
M1=supabase/migrations/20261026090000_website_intelligence.sql
M2=supabase/migrations/20261026090100_website_intelligence_reports.sql
M3=supabase/migrations/20261026090200_website_intelligence_benchmarks.sql
snapshot() { psql_ -c "select string_agg(relname||'='||n_live_tup, ',' order by relname) from pg_stat_user_tables where relname not like 'wi\_%'" ; }
count() { psql_ -c "select count(*) from information_schema.tables where table_name like 'wi\_%' union all select count(*) from pg_proc where proname like 'wi\_%'" | tr '\n' ' '; }
fail() { echo "FAIL: $*"; exit 1; }

rollback() { psql_ < docs/website-intelligence/rollback.sql >/dev/null; }
rollback
psql_ -c "analyze" >/dev/null 2>&1
BEFORE=$(snapshot)
[ "$(count)" = "0 0 " ] || fail "wi objects remain after rollback: $(count)"

psql_ < $M1 >/dev/null; psql_ < $M2 >/dev/null; psql_ < $M3 >/dev/null
psql_ -c "analyze" >/dev/null 2>&1
[ "$(snapshot)" = "$BEFORE" ] || fail "pre-existing tables changed"
echo "ok  apply: only wi_* objects added; existing tables unchanged ($(count))"

rollback; [ "$(count)" = "0 0 " ] || fail "rollback incomplete"; echo "ok  rollback: clean"
psql_ < $M1 >/dev/null; psql_ < $M2 >/dev/null; psql_ < $M3 >/dev/null; echo "ok  re-apply"

# 4. no visitor-identifying column anywhere in the wi_* schema
BAD=$(psql_ -c "select count(*) from information_schema.columns where table_name like 'wi\\_%' and column_name ~* '(visitor|^ip|ip_|hash|fingerprint|user_agent|cookie)'")
[ "$BAD" = "0" ] || fail "wi_* tables contain a visitor/IP/hash-like column"
echo "ok  schema: no visitor, IP, hash, fingerprint or cookie column"

# Retention with synthetic LOCAL data (deleted afterwards)
psql_ >/dev/null <<'SQL'
insert into wi_sessions (id, started_at, landing_path) values
 ('t-old-session-aaaaaaaa', now() - interval '26 months', '/'),
 ('t-recent-session-aaaaa', now() - interval '2 days', '/');
insert into wi_pageviews (session_id, view_id, path, occurred_at) values
 ('t-old-session-aaaaaaaa', 'view-old-1', '/', now() - interval '26 months'),
 ('t-recent-session-aaaaa', 'view-new-1', '/', now() - interval '2 days'),
 ('t-recent-session-aaaaa', 'view-14mo-1', '/', now() - interval '14 months');
insert into api_rate_limits (key, window_start, count) values ('wi:s:t-old', now() - interval '3 days', 5), ('wi:s:t-new', now(), 5), ('other:key', now() - interval '3 days', 5);
SQL
psql_ -c "select wi_maintenance()" >/dev/null
[ "$(psql_ -c "select count(*) from wi_sessions where id = 't-old-session-aaaaaaaa'")" = "0" ] || fail "26-month-old session not deleted"
[ "$(psql_ -c "select count(*) from wi_pageviews where view_id in ('view-new-1')")" = "1" ] || fail "recent page view wrongly deleted"
[ "$(psql_ -c "select count(*) from wi_pageviews where view_id = 'view-14mo-1'")" = "0" ] || fail "14-month-old page view not deleted"
[ "$(psql_ -c "select count(*) from api_rate_limits where key = 'wi:s:t-old'")" = "0" ] || fail "stale wi rate-limit key kept"
[ "$(psql_ -c "select count(*) from api_rate_limits where key in ('wi:s:t-new','other:key')")" = "2" ] || fail "maintenance touched unrelated rate-limit keys"
echo "ok  maintenance: deletes beyond retention only; leaves other tables and fresh keys alone"

# 5. production-scope isolation + conversions
psql_ >/dev/null <<'SQL'
select wi_ingest('{"session":{"id":"t-prod-session-aaaaaaa","environment":"production","landing_path":"/a"},"pageviews":[{"view_id":"view-prod-1","seq":1,"path":"/a"}],"events":[{"event_id":"evt-prod-1","name":"assessment_lead_captured"}]}');
select wi_ingest('{"session":{"id":"t-prev-session-aaaaaaa","environment":"preview","landing_path":"/b"},"pageviews":[{"view_id":"view-prev-1","seq":1,"path":"/b"}]}');
SQL
J='from, to'
[ "$(psql_ -c "select wi_overview(now()-interval '1 day', now()+interval '1 day', true)->>'sessions'")" = "1" ] || fail "production report saw a preview row"
[ "$(psql_ -c "select wi_overview(now()-interval '1 day', now()+interval '1 day', false)->>'sessions'")" = "2" ] || fail "non-production report should see both"
# a browser event can never be a conversion
[ "$(psql_ -c "select count(*) from wi_events where event_id = 'evt-prod-1' and is_conversion")" = "0" ] || fail "browser event became a conversion"
# server conversion: attributed, idempotent, and unattributed when the session is unknown
for i in 1 2; do psql_ -c "select wi_record_conversion('{\"event_id\":\"inquiry:t1\",\"name\":\"inquiry_submitted\",\"kind\":\"inquiry\",\"sid\":\"t-prod-session-aaaaaaa\",\"environment\":\"production\"}')" >/dev/null; done
psql_ -c "select wi_record_conversion('{\"event_id\":\"inquiry:t2\",\"name\":\"inquiry_submitted\",\"kind\":\"inquiry\",\"sid\":\"does-not-exist-xxxxxxx\",\"environment\":\"production\"}')" >/dev/null
[ "$(psql_ -c "select count(*) from wi_events where event_id = 'inquiry:t1'")" = "1" ] || fail "server conversion not idempotent"
[ "$(psql_ -c "select converted::text from wi_sessions where id = 't-prod-session-aaaaaaa'")" = "true" ] || fail "session not marked converted"
[ "$(psql_ -c "select (wi_overview(now()-interval '1 day', now()+interval '1 day', true)->>'lead_conversions')||'/'||(wi_overview(now()-interval '1 day', now()+interval '1 day', true)->>'converting_sessions')")" = "2/1" ] || fail "lead conversions should be 2 (1 attributed + 1 unattributed), converting sessions 1"
echo "ok  production scope excludes preview rows; browser events never convert; server conversions idempotent, attributed or unattributed"

psql_ -c "delete from wi_events where event_id like 'inquiry:t%'; delete from wi_sessions where id like 't-%'; delete from api_rate_limits where key in ('wi:s:t-new','other:key');" >/dev/null
echo "ALL MIGRATION CHECKS PASSED"
