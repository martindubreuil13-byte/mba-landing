#!/bin/bash
# Proves the PUBLIC (anon) Supabase key cannot read, write or call anything in Website Intelligence, against the LOCAL stack.
# The anon key ships to every browser (NEXT_PUBLIC_SUPABASE_ANON_KEY), so it must be powerless here. Needs `supabase start`.
set -euo pipefail
cd "$(dirname "$0")/../.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)' | sed 's/^/export /')"
PSQL() { docker exec -i supabase_db_mba-site psql -U postgres -q -t -A "$@"; }
fail() { echo "FAIL: $*"; PSQL -c "delete from wi_sessions where id like 'sec-%'" >/dev/null; exit 1; }
PSQL -c "select wi_ingest('{\"session\":{\"id\":\"sec-test-session-aaaaaaa\",\"landing_path\":\"/\"},\"pageviews\":[{\"view_id\":\"view-sec-1\",\"seq\":1,\"path\":\"/\"}]}')" >/dev/null
A=(-H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json")
S=(-H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY")
[ "$(curl -s "${S[@]}" "$API_URL/rest/v1/wi_sessions?select=id")" != "[]" ] || fail "control: the service role should see the seeded row"
for t in wi_sessions wi_pageviews wi_events wi_ai_referral_domains wi_benchmark_questions wi_benchmark_results; do
  [ "$(curl -s "${A[@]}" "$API_URL/rest/v1/$t?select=*")" = "[]" ] || fail "anon can read $t"
done
echo "ok  anon reads nothing from any wi_* table"
code=$(curl -s -o /dev/null -w '%{http_code}' "${A[@]}" -X POST "$API_URL/rest/v1/wi_sessions" -d '{"id":"sec-attack-session-aaaaa","landing_path":"/"}')
[[ "$code" =~ ^(401|403)$ ]] || fail "anon insert returned $code"
code=$(curl -s -o /dev/null -w '%{http_code}' "${A[@]}" -X PATCH "$API_URL/rest/v1/wi_sessions?id=eq.sec-test-session-aaaaaaa" -d '{"converted":true}')
[ "$(PSQL -c "select converted from wi_sessions where id='sec-test-session-aaaaaaa'")" = "f" ] || fail "anon changed a row"
code=$(curl -s -o /dev/null -w '%{http_code}' "${A[@]}" -X DELETE "$API_URL/rest/v1/wi_sessions?id=eq.sec-test-session-aaaaaaa")
[ "$(PSQL -c "select count(*) from wi_sessions where id='sec-test-session-aaaaaaa'")" = "1" ] || fail "anon deleted a row"
echo "ok  anon cannot insert, update or delete"
for fn in 'wi_ingest|{"p":{"session":{"id":"sec-attack-session-bbbbb","landing_path":"/"}}}' 'wi_record_conversion|{"p":{"event_id":"sec-attack"}}' 'wi_maintenance|{}' 'wi_overview|{"p_from":"2026-01-01","p_to":"2027-01-01"}' 'wi_traffic|{"p_from":"2026-01-01","p_to":"2027-01-01"}' 'wi_content|{"p_from":"2026-01-01","p_to":"2027-01-01"}' 'wi_conversions|{"p_from":"2026-01-01","p_to":"2027-01-01"}' 'wi_ai_referrals|{"p_from":"2026-01-01","p_to":"2027-01-01"}'; do
  name="${fn%%|*}"; body="${fn#*|}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "${A[@]}" -X POST "$API_URL/rest/v1/rpc/$name" -d "$body")
  [[ "$code" =~ ^(401|403)$ ]] || fail "anon could call $name (HTTP $code)"
done
echo "ok  anon cannot execute any wi_* function"
[ "$(PSQL -c "select count(*) from wi_sessions where id like 'sec-attack%'")" = "0" ] || fail "attacker created rows"
PSQL -c "delete from wi_sessions where id like 'sec-%'" >/dev/null
echo "ALL SECURITY CHECKS PASSED"
