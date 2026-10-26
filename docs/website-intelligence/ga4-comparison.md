# Comparing GA4 with Website Intelligence

Decision: GA4 stays, as an independent reference, while Website Intelligence (WI) is validated. They answer similar questions with
different methods, so they will never match exactly. The goal is not equality; it is to confirm that **WI is a stable, explainable
fraction of GA4 and moves with it**. Read this before drawing any conclusion from a gap.

## Before comparing: one GA4 admin setting is required
GA4 adds **an extra `page_view` on client-side navigations** unless a stream setting is turned off (measured: the site made 6 manual page-view calls and GA4
received 10). Cause: *Enhanced measurement → "Page changes based on browser history events"* fires in addition to the site's own `page_view`. Until it is off,
**GA4 page views and views-per-session are inflated and cannot be compared**. Fix (GA admin, no code change, no effect on WI): *Admin → Data streams → (web stream) →
Enhanced measurement → ⚙ → untick "Page changes based on browser history events".* Verify in Realtime (3 link clicks must show 3 page views, not 6; see
`ga4-coexistence.md`). Record the date and compare only data after it.

**Admin traffic:** after this release GA4 no longer receives `/admin` activity (blocked at the source). Data collected before the release may still contain it: keep a
`Page path does not begin with /admin` filter on saved comparison reports, and start comparing from the release date.

**Consent:** GA4 now only measures visitors who are allowed to be measured (see below), whereas WI measures everyone except visitors sending GPC/DNT. This is the largest
expected difference and it is by design.

## Setup that makes the numbers comparable
| Setting | WI | GA4 – make it match |
|---|---|---|
| Day boundary | UTC | Set the property time zone to **UTC** (Admin → Property → Reporting time zone) or compare whole weeks, where the boundary matters little |
| Date range | Same dates | Same dates; wait **48 h** before trusting a day (GA4 processes late) |
| Pages | `/admin`, `/api` never recorded | Filter out `/admin` (above) |
| Scope | Public site | Same property only |
| Thresholds | none | Use standard reports (not Explorations) for small numbers: Explorations can apply data thresholds/sampling |

## Where to read each metric
| Question | WI | GA4 |
|---|---|---|
| Sessions | Overview → *Sessions* | Reports → Acquisition → *Traffic acquisition* (Sessions column) |
| Page views | Overview → *Page views* | Reports → Engagement → *Pages and screens* (Views) |
| Sessions by source | Traffic → *Channels* | Traffic acquisition → *Session default channel group* (and *Session source / medium*) |
| Landing pages | Traffic → *Landing pages* | Reports → Engagement → *Landing page* |
| Engagement | *Engaged sessions* (10 s / 2 pages / lead) | *Engaged sessions* (10 s / 2 page views / conversion) — **same definition**, different clock |
| Leads | Conversions → *Total leads* (server-confirmed) | Mark nothing; count the event `assessment_lead_captured`, `napkin_joined`, `transition_questionnaire_completed` (browser-reported) or compare against the Leads admin — the database is the truth |
| Visitors | **Not measured** | *Users* — GA4 only; do not expect a WI equivalent |

## Expected differences (and which way they point)
| Metric | Expected relation | Why |
|---|---|---|
| **Sessions** | Direction depends on audience mix (see the consent rows) | Both lose ad-blocker users but different lists block each; GA4 is also silent for anyone who has not allowed it. GA4 cookies join several tabs/visits into one session, WI starts one session **per tab** and ends it at 30 min idle, which *raises* WI's count when people open several tabs. Because GA4 now loses non-consenting visitors in the consent regions, compare **by country group** (GA4 country report vs WI Traffic → Countries) before reading the totals. |
| **Page views** | WI **lower** than GA4 (after the history-event fix: close) | Same blocking effect. Before the fix GA4 is **higher** by up to ~1.5–2× on pages reached by links. |
| **Views per session** | Similar | Both blocked populations affect numerator and denominator alike |
| **Engagement time** | WI **lower**, GA4 not comparable 1:1 | WI sums visible time and may lose the last page on a crashed tab; GA4 uses its own engagement clock |
| **Direct / unknown share** | Similar, WI slightly lower | Both put referrer-less visits in direct; GA4 also applies campaign carry-over across a visitor's earlier sessions, WI only knows the current session |
| **Organic search / social / referral** | Similar shares; names differ | Channel rules differ: GA4's default channel groups vs WI's categories (below) |
| **AI assistants** | WI shows them; GA4 does not | GA4 has no AI channel: ChatGPT/Perplexity/etc. appear as *Referral* (or `chatgpt.com / (not set)`) — look them up by *Session source*. WI also reads `utm_source=chatgpt.com`. Both miss assistants that strip referrers (they land in Direct). |
| **Bots** | Both filter; neither is perfect | WI: user-agent patterns, no-JavaScript, `webdriver`. GA4: IAB bot list + JavaScript requirement. Expect small, mostly unexplained differences. |
| **Visitors in EEA / UK / Switzerland / Brazil / Quebec, or with unknown location** | WI **higher** than GA4 for this audience | GA4 starts only after the visitor presses *Allow* (typically a minority). WI needs no choice. Expect GA4 to under-count these regions heavily, and to be nearly complete elsewhere |
| **Visitors sending GPC / DNT** | Both silent | GA4 and WI both stay off for them (they used to appear in GA4; they no longer do) |
| **Visitors who decline** (opt-out regions) | WI counts them, GA4 does not | |

## Channel mapping (GA4 default channel group → WI category)
| GA4 | WI |
|---|---|
| Direct | Direct / unknown |
| Organic Search (Google) | Google organic |
| Organic Search (other) | Other organic search |
| Organic Social (LinkedIn / Facebook / Instagram / Substack*) | LinkedIn / Facebook / Instagram / Substack / Other social |
| Referral (chatgpt.com, claude.ai, perplexity.ai, gemini.google.com, copilot.microsoft.com…) | **AI assistant** |
| Referral (everything else) | Other referral |
| Email, Paid, Display, Affiliate, Cross-network, Unassigned (UTM-driven) | Campaign |

\* GA4 only treats Substack as social if it is in its social-source list; otherwise it is Referral. Compare by **source name**, not group, for
these two.

## Procedure (weekly, for 4–8 weeks)
1. Fix GA4 (above) and note the date. Start comparing from the next full UTC week.
2. For each of the last 7 days export **sessions** and **page views** from both systems (GA4 after the 48 h delay).
3. Compute the daily ratio `WI ÷ GA4` for sessions and for page views, and the correlation of the two daily series.
4. Compare channel **shares** (percent of sessions) rather than counts: Direct, Google organic, LinkedIn, AI assistants, Other referral.
5. Run the **known-traffic test** once a week: in a fresh private window with no extensions, from a US-looking connection (or after pressing *Allow*), open 5 specific pages in a fixed order from a
   LinkedIn UTM link (`?utm_source=linkedin&utm_medium=social&utm_campaign=wi-check`), then check both tools next day: GA4 should show 1 session / 5 views
   for that campaign; WI should show 1 session / 5 views for LinkedIn → this tests attribution and counting end to end. Repeat once with GPC enabled
   (WI must record nothing; GA4 still records).
6. Log results in a simple table (date, GA4 sessions, WI sessions, ratio, GA4 views, WI views, ratio, notes).

## When to be satisfied, and when to investigate
- **Satisfied:** daily correlation ≥ 0.9 for sessions and page views; the WI ÷ GA4 ratio is stable (roughly ±15 % week to week); channel shares agree within a few percentage points (excluding AI assistants, which only WI separates); the known-traffic test passes.
- **Investigate:** the ratio drifts or jumps (a deploy, a blocker list, a consent change, or a collection fault); WI far *above* GA4 (multi-tab effect or GA4 blocked by a new browser feature); one channel's share diverges (classification rule or referrer handling); sessions agree but page views do not (history-event setting, or a client-navigation bug).
- **Not evidence of a fault:** a steady, explainable gap that follows the audience's country mix; no WI unique-visitor figure; GA4 lagging by a day.

## Using the comparison to decide about GA4
After 30–60 days, if the ratios are stable and explainable, WI is validated for **sessions, page views, sources, content performance, journeys and
server-confirmed leads**. GA4 would still offer what WI deliberately does not: user counts across days, retention/cohorts, demographics and Google-ecosystem
integrations (Search Console, Ads). Decide whether those are worth keeping given GA4's consent and privacy cost (see `ga4-coexistence.md`).
