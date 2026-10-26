# Website Intelligence: metric definitions

All ranges are UTC, half-open `[from, to)`. "Previous period" is the immediately preceding period of equal length. A percentage
change is shown only when the previous period has data; otherwise the admin says "no previous data". Rates that depend on a small
sample (fewer than 5 sessions on a page) are shown as `n<5`, not as a percentage.

**Cohort rule:** every metric is computed for the sessions that *started* in the range (their page views, events and outcome), so
numbers add up across views. A session that spans midnight belongs to the day it started.

| Metric | Definition | Known limits |
|---|---|---|
| **Session** | One per-tab analytics session. Starts with the first page view in a tab, ends after 30 minutes without activity (the next page view starts a new one). | A person with two tabs open has two sessions. Not a person. |
| **Unique visitors** | **Not measured.** | The site sets no cookie and stores no identifier that recognises a returning person (no IP, no IP/user-agent hash, no fingerprint), so a unique-visitor count cannot be produced honestly. The admin says so instead of showing a number. |
| **Page view** | A page load or in-site navigation to a public page. `/admin` and `/api` are never recorded. | Not recorded when GPC/DNT is set, JavaScript is off, or an ad blocker blocks `/api/wi`. |
| **Engaged session** | 10+ seconds of visible time, **or** 2+ page views, **or** a server-confirmed lead. | A convention, not a measurement of attention. |
| **Engagement time** | Time a page was visible in the foreground, summed across a session's pages. "Average" = total ÷ all sessions in range (including 0-second ones). | Sent when the tab is hidden or closed; a crashed tab or killed mobile browser can lose the final page. |
| **AI referral session** | Referrer host or UTM source matches the AI domain list (`wi_ai_referral_domains`, editable) or a known alias (e.g. `utm_source=chatgpt`). The evidence (`referrer:chatgpt.com`) is stored per session. | Many assistants/apps strip referrers; those visits are counted as direct/unknown, never guessed. A floor, not total AI-driven traffic. |
| **Lead (conversion)** | A submission the **server confirmed**: `/lets-talk` inquiry (after the email provider accepted the owner notification), guide/resource request (non-blocked), Business Idea Reality Check lead, Napkin join, program application. Recorded once per record (idempotent). | Linked to a session only if the visitor's browser sent its session id; otherwise counted as *unattributed* (no source/page journey). Never inferred from a click. |
| **Lead conversion rate** | Sessions with a confirmed lead ÷ all sessions. "—" when there are no sessions. | Session-based, not person-based. |
| **Associated leads (per page)** | Sessions that viewed the page and have a confirmed lead. "Landed" = the session began on the page. | Association, not cause: a lead is credited to every page the session viewed. |
| **Explored on** | Share of a page's sessions that viewed another page afterwards. | |
| **CTA clicks / starts** | Events recorded on the page: program/assessment/napkin CTAs, Calendly clicks; assessment, napkin or questionnaire starts. | Browser-reported. |
| **Booking-link click** | Any click on a `calendly.com` link. | A click is **not** a booking. Confirmed bookings are **not measured** (Calendly sends nothing back; a webhook, typically a paid Calendly feature, is not set up). |
| **Assessment completion** | Sessions with a completion event ÷ sessions with a start event. | Browser-reported. |

## Source classification (first match wins)
1. AI assistant (UTM source or referrer host on the AI list)
2. UTM source naming LinkedIn / Facebook / Instagram / Substack / other social, or `google`
3. Campaign traffic (any `utm_medium`/`utm_campaign`/unrecognised `utm_source`)
4. Referrer host: Google organic, other organic search, LinkedIn, Facebook, Instagram, Substack, other social, other referral (own host ignored)
5. Direct / unknown (no evidence). Never assumed to be AI or anything else.

**Attribution model (v1):** a session's *source* is how its first page view arrived; its *landing page* is its first page; a lead's
*converting page* is the page the form was submitted from. There is no cross-session first-touch because no persistent identifier
exists by design. Attribution shows association, not causation.

## Comparison with GA4
Expect differences: first-party counts run **lower** for visitors who send GPC/DNT or block `/api/wi`; GA4 uses cookies and can
recognise returning visitors across days, this system cannot (hence no unique-visitor metric); session boundaries differ (GA4: 30 min
idle or campaign change; here: per tab, 30 min idle); source classification differs (GA4 default channel groups vs. the list above);
bot filtering differs (here: user-agent patterns + no JavaScript + `webdriver`). Compare trends, not totals.
