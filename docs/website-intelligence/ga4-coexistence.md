# GA4 alongside Website Intelligence

Decision (2026-10-26): **GA4 is retained** as an independent reference while Website Intelligence (WI) is validated. This document records what was
verified, what changed in the code, and the settings that must be applied in the GA admin. It is not legal advice.

## 1. Duplicate collection: findings and fixes

| Question | Result |
|---|---|
| Does **WI** record any event twice? | No. Verified end to end in a production-mode build: 6 navigations recorded as 6 page views, 1 click as 1 event. Beacons are idempotent per (session, view id / event id) |
| Does the **site** send GA4 any event twice? | No. Each navigation produces one manual `page_view` (de-duplicated per path); each `trackEvent` reaches GA4 once and WI once; WI deliberately ignores the `page_view` bridge call |
| Does **GA4 itself** add duplicates? | **Yes, until a GA admin setting is changed.** The web stream's *Enhanced measurement → "Page changes based on browser history events"* fires an automatic `page_view` on every client-side navigation, next to the site's manual one (measured: 6 manual calls, 10 events received). That automatic event also carries the raw URL, bypassing the code that redacts ID-like path segments |

### Required GA admin setting (not changeable from code)
**GA4 Admin → Data collection and modification → Data streams → (the web stream) → Enhanced measurement → ⚙ (gear) → untick _"Page changes based on browser history events"_ → Save.**
Leave the other enhanced-measurement items as you prefer; only this one duplicates the site's manual `page_view`.

**How to verify it worked** (2 minutes, after the change and after deployment): open the site in a normal window (outside the EEA/UK/CH/BR/Quebec, or after clicking *Allow*),
and in GA4 open *Reports → Realtime* (or *Admin → DebugView* with the GA Debugger extension). Click 3 links in the site's navigation. Realtime must show **3 more
`page_view` events**, one per page, **not 6**. If it shows 6, the setting is still on.

### Preserved by the code
Manual `page_view` with `send_page_view: false`; the redaction of UUID-shaped path segments (`/result/<uuid>` → `/result/:id`) in `page_path` and `page_location`;
UTMs and the query string in `page_location` (needed for GA4 acquisition reports). Covered by `app/lib/consent/ga.test.ts`.

## 2. What changed in the code: GA4 is now consent-aware and never tracks admin

Previously GA4 was written into the server-rendered HTML and ran for everyone, unconditionally. Now **no GA4 code or reference is in the HTML at all**
(verified); `app/lib/consent/ga.ts` loads `gtag.js` only after a decision.

| Rule | Behaviour |
|---|---|
| **Privacy signals** | If the browser sends Global Privacy Control or Do Not Track, GA4 never runs and the visitor is not asked. This overrides any earlier "Allow" |
| **Where consent is required** | Visitors in the EEA, UK, Switzerland, Brazil and Quebec, **or whose location cannot be determined**, are asked first. Nothing is requested from Google and no cookie is set until they press *Allow* |
| **Elsewhere** | GA4 runs unless the visitor declines (or sends a signal). *Analytics preferences* is always available |
| **Choice** | Stored in `localStorage` key `mba_analytics_consent` (choice + time), 12 months, then asked again. Only the choice is stored; blocked storage means the question is asked on each visit |
| **Withdrawal** | Footer button and a button on `/privacy`, same banner component. *Decline* sets Google's `ga-disable` flag, denies analytics storage, and deletes `_ga` / `_ga_*` cookies on every domain level |
| **Consent Mode** | `ad_storage`, `ad_user_data`, `ad_personalization` always `denied`; `analytics_storage` granted only after permission, before `config` (so no pre-consent ping). `allow_google_signals` and `allow_ad_personalization_signals` are `false` in the config |
| **Admin, at the source** | GA4 does not start on any `/admin` page or while a Supabase admin session cookie is present; if a visitor with GA4 running navigates into `/admin`, Google's disable flag switches on (so not even enhanced-measurement events leave the browser) and switches off again on return |
| **Previews / local** | Unchanged: GA4 and the banner exist only in production builds |
| **Website Intelligence** | **Independent of this decision.** Governed only by GPC/DNT (and the server-side admin/bot filters). Verified: declining or ignoring the banner leaves WI recording |

Where is the visitor? Decided by the hosting edge's country/region headers via `GET /api/consent/region`, which returns only `{ "required": true|false }`, stores and logs nothing.
The rule depends on **where the visitor is, not where the business is established** (which the code does not assume). The country list is a conservative starting point in
`app/lib/consent/regions.ts`; it is an assumption, not a compliance determination (see `legal-review.md`); have counsel confirm it, then edit the two constants.

### Accessibility of the banner
A labelled region (`role="region"`, `aria-labelledby`), announced politely when it appears, never stealing focus; fully keyboard operable (Tab order Allow → Decline); when opened
from the footer it takes focus, Escape closes it, and focus returns to the control that opened it; both buttons are identical in size and style, at least 44 px tall; visible focus
outlines; no animation; non-blocking (the page stays usable); contrast of ink on ivory far above 4.5:1; no layout shift (CLS 0.000 measured).

## 3. GA4 admin settings to apply or verify before deployment
These live in the GA property and cannot be checked from the repository.
| Setting | Recommended |
|---|---|
| Enhanced measurement → page changes based on browser history events | **Off** (section 1) |
| Admin → Data collection → Data retention → event data | 2 months (maximum 14); aggregate reports are unaffected |
| Google signals data collection | Off |
| Data sharing settings (Google products & services, modelling, technical support, account specialists) | All off unless you want them |
| Ads linking (Google Ads, DV360…) | None linked |
| Data processing amendment | Accepted |
| Reporting time zone | UTC, to make day boundaries match Website Intelligence |
| Filter for `/admin` | No longer needed for new data; keep a `Page path does not begin with /admin` filter on saved reports to hide admin hits collected before this change |

The privacy notice states that advertising features are off. That is true of the code; it is only true of the property once the settings above are confirmed.

## 4. Performance
Measured twice on production builds with the real `gtag.js` (all outgoing GA hits aborted), 5–6 cold loads per cell, median:
- **Website Intelligence:** no measurable effect (about 1.6 KB gzipped, one beacon after 2 s or on tab hide).
- **GA4:** no material effect on FCP, LCP or CLS. It adds about 177 KB of script transfer after load and about 20–25 ms more main-thread blocking on a 4×-slowed mobile CPU (≈16 → ≈40 ms; "good" TBT is under 200 ms).
- **Consent mechanism:** an undecided EEA visitor loads no GA4 at all (about 170 KB less); the banner is fixed-position with CLS 0.000; the region check is one tiny request.
- Not measured: INP and field data. Check Search Console / CrUX after deployment.

## 5. Comparing the two systems
See `ga4-comparison.md`. Note the consequence of consent: from deployment on, GA4 only sees EEA/UK/CH/BR/Quebec visitors who press *Allow*, so for that audience WI will exceed GA4.

## 6. Checklist (GA4)
- [ ] GA admin: history-event page views **off**, and verified in Realtime (section 1)
- [ ] GA admin: retention, signals, data sharing, ads linking, DPA, time zone (section 3)
- [ ] Counsel confirms the consent regions and the privacy-notice wording
- [ ] After deployment: from an EEA-looking and a US-looking browser, confirm banner/no banner, no `_ga` cookie before *Allow* (DevTools → Application → Cookies), and Realtime counts
