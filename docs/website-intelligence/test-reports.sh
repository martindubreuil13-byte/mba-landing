#!/bin/bash
# Verifies the Website Intelligence report functions against SYNTHETIC rows in the LOCAL database, with known answers.
# Rows use ids starting "r-" and are deleted afterwards. Needs `supabase start` and the migrations applied.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=supabase_db_mba-site
q() { docker exec -i $DB psql -U postgres -v ON_ERROR_STOP=1 -q -t -A "$@"; }
fail() { echo "FAIL: $*"; q -c "delete from wi_events where event_id like 'r-%' or session_id like 'r-%'; delete from wi_sessions where id like 'r-%';" >/dev/null; exit 1; }
eq() { [ "$2" = "$3" ] || fail "$1: expected '$3' got '$2'"; echo "ok  $1"; }
q -c "delete from wi_events where event_id like 'r-%' or session_id like 'r-%'; delete from wi_sessions where id like 'r-%';" >/dev/null

# 6 sessions today (s4 viewed 2 pages) (UTC): 
#  s1 chatgpt AI, landed /answers/a, then /work (engaged 30s) , clicked CTA on /work, lead confirmed
#  s2 google, landed /answers/a only (3s)
#  s3 linkedin, landed /answers/b, then /answers/a, 2 pages
#  s4 direct, landed /work, started assessment on /resources/business-idea-reality-check
#  s5 PREVIEW environment session (must be excluded when p_prod)
#  s6 google, landed /answers/a (3s)
q >/dev/null <<'SQL'
insert into wi_sessions (id, environment, landing_path, source_category, ai_platform, source_evidence, page_count, engaged_ms) values
 ('r-s1-aaaaaaaaaaaaaaaa','production','/answers/a','ai_assistant','ChatGPT','referrer:chatgpt.com',2,30000),
 ('r-s2-aaaaaaaaaaaaaaaa','production','/answers/a','google_organic',null,'referrer:google.com',1,3000),
 ('r-s3-aaaaaaaaaaaaaaaa','production','/answers/b','linkedin',null,'utm_source:linkedin',2,8000),
 ('r-s4-aaaaaaaaaaaaaaaa','production','/work','direct',null,null,2,2000),
 ('r-s5-aaaaaaaaaaaaaaaa','preview','/answers/a','direct',null,null,1,1000),
 ('r-s6-aaaaaaaaaaaaaaaa','production','/answers/a','google_organic',null,'referrer:google.com',1,3000);
insert into wi_pageviews (session_id, view_id, seq, path, title, engaged_ms) values
 ('r-s1-aaaaaaaaaaaaaaaa','view-s1-1',1,'/answers/a','Answer A | The Modern Business Architect',12000),
 ('r-s1-aaaaaaaaaaaaaaaa','view-s1-2',2,'/work','Work | The Modern Business Architect',18000),
 ('r-s2-aaaaaaaaaaaaaaaa','view-s2-1',1,'/answers/a','Answer A | The Modern Business Architect',3000),
 ('r-s3-aaaaaaaaaaaaaaaa','view-s3-1',1,'/answers/b','Answer B | The Modern Business Architect',5000),
 ('r-s3-aaaaaaaaaaaaaaaa','view-s3-2',2,'/answers/a','Answer A | The Modern Business Architect',3000),
 ('r-s4-aaaaaaaaaaaaaaaa','view-s4-1',1,'/work','Work | The Modern Business Architect',2000),
 ('r-s4-aaaaaaaaaaaaaaaa','view-s4-2',2,'/resources/business-idea-reality-check','Business Idea Reality Check | The Modern Business Architect',0),
 ('r-s5-aaaaaaaaaaaaaaaa','view-s5-1',1,'/answers/a','Answer A | The Modern Business Architect',1000),
 ('r-s6-aaaaaaaaaaaaaaaa','view-s6-1',1,'/answers/a','Answer A | The Modern Business Architect',3000);
insert into wi_events (session_id, event_id, name, path) values
 ('r-s1-aaaaaaaaaaaaaaaa','r-evt-cta-1','program_cta_click','/work'),
 ('r-s1-aaaaaaaaaaaaaaaa','r-evt-book-1','booking_link_click','/work'),
 ('r-s4-aaaaaaaaaaaaaaaa','r-evt-start-1','assessment_started','/resources/business-idea-reality-check'),
 ('r-s3-aaaaaaaaaaaaaaaa','r-evt-cta-2','assessment_cta_clicked','/answers/a');
SQL
# a confirmed lead in s1, and one unattributed lead (visitor sent no session id), one in a preview session
q -c "select wi_record_conversion('{\"event_id\":\"r-conv-1\",\"name\":\"inquiry_submitted\",\"kind\":\"inquiry\",\"sid\":\"r-s1-aaaaaaaaaaaaaaaa\",\"path\":\"/lets-talk\",\"environment\":\"production\"}')" >/dev/null
q -c "select wi_record_conversion('{\"event_id\":\"r-conv-2\",\"name\":\"guide_requested\",\"kind\":\"guide_request\",\"path\":\"/resources/x\",\"environment\":\"production\"}')" >/dev/null
q -c "select wi_record_conversion('{\"event_id\":\"r-conv-3\",\"name\":\"inquiry_submitted\",\"kind\":\"inquiry\",\"sid\":\"r-s5-aaaaaaaaaaaaaaaa\",\"environment\":\"preview\"}')" >/dev/null

R="now() - interval '1 day', now() + interval '1 day'"
CTA="array['program_cta_click','assessment_cta_clicked','booking_link_click']"
J() { q -c "select $1"; }

# Overview (production scope)
eq "overview sessions (preview excluded)" "$(J "wi_overview($R, true)->>'sessions'")" "5"
eq "overview pageviews"                   "$(J "wi_overview($R, true)->>'pageviews'")" "8"
eq "overview engaged sessions (>=10s or >=2 pv or converted)" "$(J "wi_overview($R, true)->>'engaged_sessions'")" "3"
eq "overview AI sessions"                 "$(J "wi_overview($R, true)->>'ai_sessions'")" "1"
eq "overview lead conversions (1 attributed + 1 unattributed; preview excluded)" "$(J "wi_overview($R, true)->>'lead_conversions'")" "2"
eq "overview converting sessions"         "$(J "wi_overview($R, true)->>'converting_sessions'")" "1"
eq "non-production scope sees the preview row" "$(J "wi_overview($R, false)->>'sessions'")" "6"

# Content
C="wi_content($R, true, $CTA, array['assessment_started'])"
eq "content: views of /answers/a"          "$(J "(select (x->>'views') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "4"
eq "content: sessions of /answers/a"       "$(J "(select (x->>'sessions') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "4"
eq "content: landing sessions of /answers/a" "$(J "(select (x->>'landing_sessions') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "3"
eq "content: latest title"                 "$(J "(select (x->>'title') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "Answer A | The Modern Business Architect"
eq "content: continued (s1 went on to /work)" "$(J "(select (x->>'continued_sessions') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "1"
eq "content: associated leads on /answers/a" "$(J "(select (x->>'assisted_leads') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "1"
eq "content: landing leads on /answers/a"  "$(J "(select (x->>'landing_leads') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "1"
eq "content: CTA events counted on the page they happened" "$(J "(select (x->>'cta_clicks') from jsonb_array_elements($C) x where x->>'path'='/work')")" "2"
eq "content: assessment starts"            "$(J "(select (x->>'starts') from jsonb_array_elements($C) x where x->>'path'='/resources/business-idea-reality-check')")" "1"
eq "content: top source of /answers/a"     "$(J "(select (x->'sources'->0->>'key') from jsonb_array_elements($C) x where x->>'path'='/answers/a')")" "google_organic"
eq "content: preview page view excluded"   "$(J "jsonb_array_length($C)")" "4"

# Conversions
V="wi_conversions($R, true, $CTA, array['assessment_started'], array['assessment_completed'], array['booking_link_click'])"
eq "conversions: total leads"              "$(J "$V->>'total_leads'")" "2"
eq "conversions: attributed leads"         "$(J "$V->>'attributed_leads'")" "1"
eq "conversions: by source includes unattributed" "$(J "(select count(*) from jsonb_array_elements($V->'by_source') x where x->>'key'='unattributed')")" "1"
eq "conversions: sessions with CTA click"  "$(J "$V->>'sessions_with_cta'")" "2"
eq "conversions: booking clicks (clicks, never bookings)" "$(J "$V->>'booking_clicks'")" "1"
eq "conversions: sessions with assessment start" "$(J "$V->>'sessions_with_start'")" "1"
eq "conversions: completion events (none recorded)" "$(J "$V->>'sessions_with_complete'")" "0"

# AI referrals
A="wi_ai_referrals($R, true)"
eq "ai: sessions"                          "$(J "$A->>'ai_sessions'")" "1"
eq "ai: platform"                          "$(J "$A->'platforms'->0->>'key'")" "ChatGPT"
eq "ai: converting"                        "$(J "$A->'platforms'->0->>'conversions'")" "1"
eq "ai: evidence kept"                     "$(J "$A->'evidence'->0->>'evidence'")" "referrer:chatgpt.com"

q -c "delete from wi_events where event_id like 'r-%' or session_id like 'r-%'; delete from wi_sessions where id like 'r-%';" >/dev/null
echo "ALL REPORT CHECKS PASSED"
