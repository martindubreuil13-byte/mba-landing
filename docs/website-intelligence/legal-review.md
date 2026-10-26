# Assumptions that need legal review before production

**Nothing in this repository is legal advice, and nothing here is guaranteed to be compliant in any jurisdiction.** The consent mechanism is a
reasonable, conservative engineering design. The points below are the assumptions it rests on. They should be confirmed (or changed) by someone qualified
for the places this site's visitors are, **before launch**. Each says where to change it.

## 1. The consent region list
`app/lib/consent/regions.ts`: opt-in is required for the EEA, UK, Switzerland, Brazil, Quebec, and visitors of unknown location; everywhere else Google Analytics
runs unless the visitor declines or sends a privacy signal.
- **It is a starting list, not a determination.** It was chosen from general knowledge of opt-in regimes, not from a legal analysis of this business or its audience.
- **Other places may require opt-in or other measures** (examples to ask about, not conclusions: other countries with ePrivacy-style or consent-based laws, individual US states, Australia, India, South Korea, Japan, Turkey, South Africa). Add them to the constants if needed.
- **The business's own location and legal structure were not assumed.** The code decides by where the *visitor* is. Whether additional rules apply because of where the business or its processors are established is a question for counsel.
- **"Opt-out everywhere else" is itself an assumption**: that running Google Analytics with a notice, a way to decline, and respect for privacy signals is acceptable in those places.

## 2. How the visitor's location is determined
- From the hosting edge's country/region headers (`x-vercel-ip-country`, `x-vercel-ip-country-region`). These are IP-geolocation estimates: VPNs, mobile carriers and roaming make them wrong for some visitors, in either direction.
- Quebec is detected only through the region header; a Canadian visitor with **no** region information is treated as requiring consent (conservative), but a visitor wrongly placed in another province is not.
- Unknown or malformed location is treated as "consent required". The code does not decide which law applies to a specific person.

## 3. Whether consent is the right basis, and whether the banner is sufficient
- The banner asks one question (Google Analytics, a single purpose) with equal-weight Allow and Decline buttons and a link to the notice. Whether that wording, granularity and layout meet the standard in each jurisdiction (e.g. information required before consent, equal prominence, no pre-ticked choices) is for counsel to confirm.
- Consent is re-asked after 12 months (`CONSENT_MAX_AGE_MS` in `app/lib/consent/policy.ts`). Whether that interval is appropriate is a judgement call.
- Withdrawal is as easy as giving consent (same control, on every public page).

## 4. Proof of consent
- The choice is stored **only in the visitor's browser** (`localStorage`). **No server-side record of consent is kept.** If a regulation or counsel requires the site to be able to demonstrate who consented, to what, and when, that does not exist and would need to be built. This is the most likely gap.

## 5. Google Analytics itself
- Cookie lifetime, data retention in the property, data-sharing settings, Google signals, advertising features, the data processing amendment, and international transfers of analytics data depend on the **GA4 property settings and Google's terms**, not on this code. The owner is handling the property settings separately; counsel should confirm the transfer and processor position.
- The privacy notice says advertising features are off. The code disables them (Consent Mode denies ad storage and personalization; Google signals and ad personalization signals are off), but the statement is only true of the property once its settings are confirmed.

- **Withdrawal timing.** Declining sets Google's disable flag immediately and no later activity is sent (verified repeatedly). A hit that `gtag.js` had *already queued* a moment before the visitor withdrew (typically their last page view) can still be delivered within about a second; the code cannot recall it. Counsel may want to know this exists.

## 6. The first-party analytics (Website Intelligence)
- It is designed to avoid identifying anyone (no cookie, no localStorage, no IP, no persistent or cross-day identifier, per-tab `sessionStorage` only, GPC/DNT respected, short retention) and **it does not ask for consent**. That it falls outside consent requirements in each jurisdiction (including rules on accessing a device's storage, which can cover `sessionStorage`) is an assumption, and a judgement for counsel. If counsel disagrees, the simplest change is to put it behind the same decision as Google Analytics (it already stops for privacy signals).
- Leads from visitors with no session id are still counted (unattributed); counsel may want to confirm this is acceptable.

## 7. The privacy notice
- `/privacy` describes what the code does today, including the regions in which consent is asked for. **It describes behaviour; it does not claim the behaviour is sufficient for any law.** It does not name a controller, legal bases, data-subject rights beyond contact details, or retention for Google Analytics, because those require facts only the owner and counsel hold. If any of the above changes, the notice must change with it.

## 8. What to do
1. Give counsel this file, `ga4-coexistence.md`, the live `/privacy` page and the banner (a screenshot is enough).
2. Record the outcome: edit `regions.ts` (countries), `policy.ts` (re-ask interval), the banner/notice copy, or build the server-side consent record if required.
3. Re-run `docs/website-intelligence/e2e/consent-e2e.mjs` and `consent-pages-e2e.mjs` after any change.
