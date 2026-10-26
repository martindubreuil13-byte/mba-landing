# GA4 alongside Website Intelligence: pre-deployment audit

Decision (2026-10-26): **GA4 is retained** as an independent reference while Website Intelligence (WI) is validated. Nothing about GA4's
loading was changed in code. This document records what was verified, what was found, and what is recommended. It is not legal advice.

## 1. Can both run at once without duplicates inside either system?

Method: production-mode build (`APP_ENV=production`, so the real GA4 tag is included), real Google `gtag.js` executing in Chromium, every
outbound GA4 request **captured and aborted** (nothing reached the live GA4 property), WI writing to an isolated local database.

| Check | Result |
|---|---|
| One GA4 tag, one `config` call, one tracker | Yes (built HTML contains one of each) |
| **WI** page views vs real navigations (load, 3 link clicks, back, forward = 6) | **6 recorded: exact.** No duplicates in production mode; none in dev mode either |
| **WI** custom events (one `assessment_started` click) | 1 recorded: exact |
| WI retries / double beacons | Idempotent by (session, view id / event id); a retried or duplicated beacon changes nothing |
| **GA4** page views for the same 6 navigations | **10 sent: duplicated** |
| Why | The site makes 6 manual `page_view` calls (verified in `dataLayer`). GA4's *Enhanced measurement → "Page changes based on browser history events"* additionally fires one automatic `page_view` per client-side navigation. `send_page_view: false` only disables the initial automatic one |
| GA4 custom events | Not duplicated (`assessment_started`: 1) |
| Cross-contamination | None: the two systems share only the `trackEvent()` call sites; each event is delivered once to each system. WI ignores GA's `page_view` bridge call by design |

**Action required (GA admin, no code change, no effect on WI):** *Admin → Data streams → web stream → Enhanced measurement → ⚙ → untick "Page changes
based on browser history events".* Until done, GA4 page views and views/session are inflated and cannot be compared with WI. This automatic event also
sends the raw page URL, bypassing the code that strips ID-like path segments.

**Also found (GA4 side):** the site sends `/admin/...` page views to GA4 (WI never records admin pages). Exclude them in GA4 reports with a
`Page path does not begin with /admin` filter or an internal-traffic filter. Excluding them in code is a one-line change to `AnalyticsPageview.tsx`
that has *not* been made, because it alters GA4 data collection; say if you want it.

## 2. GA4 consent and privacy configuration (as the site actually behaves)

Measured on the production build, with GPC / DNT on and off:

| Fact | Measured |
|---|---|
| When it loads | Every public page in production, after hydration; never on previews or locally |
| Consent gating | **None** (no banner, no Consent Mode defaults: GA4 starts with storage granted) |
| Cookies | `_ga`, `_ga_<id>`: first-party, 400-day lifetime (Chrome cap; Safari shortens it) |
| Identifier | Persistent random client id (`cid`) recognising a returning browser |
| Also sent to Google | page URL + title, referrer, language, screen size, browser/UA client hints; IP is used by Google for approximate location (Google states GA4 does not log or store IPs) |
| **Global Privacy Control / Do Not Track** | **Ignored: GA4 still sets cookies and sends hits.** WI sends nothing under either signal |
| Custom event parameters | A few non-identifying values (e.g. program number, assessment `overall_score`, `interpretation_category`); no form text, no emails |
| Privacy notice (before this change) | **GA4 not mentioned at all** |

Settings that cannot be seen from the code and **must be checked in the GA4 admin before deployment**: event data retention (default 2 months; maximum 14), Google
signals (recommend off), ad personalization (recommend off), data-sharing settings (recommend all off), data-processing terms accepted, and that no advertising
products are linked.

### Recommended approach (simplest compliant, least public-UX change)
Context: the business entity is established in Tallinn, Estonia; `_ga` cookies are not strictly necessary, so EU/EEA ePrivacy rules (as implemented in
Estonia) and GDPR generally require **prior consent** for them for visitors in the EEA, and a notice that matches practice. Counsel should confirm.

1. **Now, no UX change, before deployment:** disable the history-event page views (above); set retention to 2 months; turn off Google signals and ad
   personalization; confirm data-sharing is off; exclude `/admin` from GA4 reporting. The privacy notice now discloses GA4 accurately (done).
2. **Decision needed (recommended): a region-aware consent gate.** Only visitors in the EEA, UK and Switzerland (country from the existing edge header
   `x-vercel-ip-country`) would see a small consent banner, and GA4 would start in Consent Mode v2 `denied` for them (no cookies, no identifier) until they accept.
   Everyone else sees no change. Treat a GPC or DNT signal as "denied" everywhere, which matches how WI already behaves. This is the smallest change that
   gets consent where the law is strictest. Cost: a banner for EEA visitors, and GA4 will under-count that audience (see the comparison guide).
3. **Alternatives:** (a) a banner for everyone: simplest rule, more visible UX change; (b) Consent Mode "denied" with no banner: removes the cookies but
   GA4 still receives hits and modelled data would make it useless as an independent reference; (c) keep as is: not recommended for EEA visitors.
4. **WI needs no banner under the proposed design:** no cookie, no local storage, no persistent or cross-day identifier, per-tab sessionStorage only,
   GPC/DNT honoured, short retention. That is the profile regulators describe for narrowly-scoped first-party audience measurement, but it is a judgement for
   counsel rather than a guarantee.

If the consent gate is built, update the notice's GA4 paragraph (it currently states plainly that GA4 runs for all visitors and ignores GPC/DNT).

## 3. Does GA4 materially affect page performance?

Method: production build, real `gtag.js` (collection hits aborted), 6 cold loads per cell, variants interleaved in random order, median reported; desktop and
a throttled mobile profile (4× CPU slowdown, 150 ms / 9 Mbps). TBT = time over 50 ms blocking the main thread after first paint. Lab numbers on a local server: no CDN or real-user variance.

| Profile · page | Variant | FCP ms | LCP ms | TBT ms | CLS | Script KB (transfer) |
|---|---|---|---|---|---|---|
| Desktop · home | neither | 56 | 984 | 0 | 0 | 221 |
| | WI only | 48 | 984 | 0 | 0 | 221 |
| | GA4 only | 62 | 996 | 0 | 0 | 398 |
| | both | 46 | 984 | 0 | 0 | 398 |
| Desktop · answer | neither | 60 | 92 | 0 | 0 | 227 |
| | WI only | 66 | 112 | 0 | 0 | 227 |
| | GA4 only | 58 | 110 | 0 | 0 | 404 |
| | both | 50 | 100 | 0 | 0 | 404 |
| Mobile · home | neither | 422 | 2752 | 16 | 0 | 198 |
| | WI only | 418 | 2748 | 16 | 0 | 198 |
| | GA4 only | 420 | 2764 | 40 | 0 | 375 |
| | both | 414 | 2750 | 39 | 0 | 375 |
| Mobile · answer | neither | 432 | 1418 | 18 | 0 | 191 |
| | WI only | 440 | 1022 | 16 | 0 | 191 |
| | GA4 only | 434 | 1076 | 39 | 0 | 368 |
| | both | 432 | 1432 | 42 | 0 | 368 |

Conclusions:
- **Website Intelligence: no measurable effect.** Differences are within run-to-run noise; its code is about 1.6 KB gzipped, sent as one small beacon after 2 s or on tab hide, never blocking render or navigation.
- **GA4: no material effect on FCP, LCP or CLS** (all differences within noise; one mobile cell moved 400 ms in a *non-GA4* variant, showing the noise floor). It **adds about 177 KB of transfer** (~+80 % script bytes) loaded after interactive, and **about 20–25 ms more main-thread blocking on a 4×-slowed mobile CPU** (16 → ~40 ms, still far below the 200 ms "good" TBT threshold).
- Not measured: INP and real-user field data. If Core Web Vitals field data (Search Console / CrUX) is available, check it after deployment rather than assume.

## 4. Comparing the two systems
See `ga4-comparison.md` (setup, where to read each metric, expected differences and direction, channel mapping, weekly procedure, acceptance thresholds).

## Pre-deployment checklist for GA4
- [ ] GA admin: untick "Page changes based on browser history events"
- [ ] GA admin: retention 2 months; Google signals off; ad personalization off; data-sharing off; DPA accepted
- [ ] GA4 reports: exclude `/admin` (filter) from comparison views
- [ ] Decide the consent approach (recommendation 2 above) and have counsel confirm the privacy notice wording
- [ ] After deployment: known-traffic test (see comparison guide)
