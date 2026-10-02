# Member access for lead magnets

> **Useful for everyone. More useful for members.**

Every lead magnet can have two layers. Build the Bridge First is the first implementation; nothing in the code is specific to it.

| Layer | Who | Needs | Example (Build the Bridge First) |
|---|---|---|---|
| **Public** | anyone | no email, login or consent | the complete guide, readable online |
| **Free-member** | people who **confirmed** membership | the confirmation **POST** | the printable PDF (and, later: workbooks, saved or emailed reports, bundles) |

The member benefit is described to the visitor **before** an email is asked for. The public layer is never presented as incomplete.

## The one configuration object

`app/lib/resources/config.ts` → `ResourceConfig.access` (type `ResourceAccessConfig`):

| Field | Purpose |
|---|---|
| `consentCopyId` | versioned form wording in `consent-copy.ts` (heading, member-benefit intro, button, note, disclosure) |
| `publicLayer` | what anyone gets (kind + summary) |
| `memberBenefit` | what members unlock (kind `asset-download`, label, summary) |
| `activeMembersReceiveByEmail` | confirmed members who ask again get the benefit **by email**, never on screen |
| `checkInbox` | the one neutral state shown after the form (identical for every outcome) |
| `confirmationEmail` | subject, preview, heading, paragraphs, button, ignore-note |
| `confirmationPage` | `/confirm` copy for this resource (explanation, button, done state, download button) |
| `analytics.benefitLabel` | the benefit's name in Admin |

Plus the existing `cta` copy, `email` (delivery email) and the `resources` row (the file). **A new guide = one config entry + its content + a `resources` row.** No new routes, consent logic or email templates.

## Standard states

| Who submits the form | What happens (server side) | What the visitor sees |
|---|---|---|
| anonymous, never submits | public layer only | the online guide |
| **new** address | creates a *locked* membership request + `opt_in_requested` (marketing OFF) + **confirmation email** (no download link in it) | "Check your inbox" |
| **pending** address (asked before, not confirmed) | re-sends the confirmation within rate limits (10-minute de-dupe; 3 per address/hour) | "Check your inbox" |
| **confirmed member** | records an *unlocked* request, **emails** a signed download link; no new consent, no re-confirmation | "Check your inbox" |
| **unsubscribed** | nothing: no email, no request, no consent change; an internal `resource_membership_blocked` event | "Check your inbox" |
| **suppressed** (e.g. spam complaint) | same as unsubscribed | "Check your inbox" |

The response body is always `{"success": true, "state": "check_inbox"}` (only an email *provider failure* is reported, as an error). It never contains a URL, token, request id or anything that distinguishes the cases.

**Confirmation** (`/confirm?token=…`, signed `c1` token, 30 days):
- **GET** only explains (what confirming unlocks) and offers a button. It writes nothing.
- **POST** `/api/confirm` activates membership (`confirmOptIn`), unlocks every locked request this person has for the resource (conditional update ⇒ exactly once under replay or concurrency), emails the durable link **once**, and returns the signed link so the confirming browser starts the download.
- Replay returns `already_confirmed` plus the same benefit, and sends nothing.

**Unsubscribed people** come back only through `/rejoin` (`POST /api/membership/rejoin`, wording `membership-rejoin-v1.0`). It never creates a lead, never touches active, pending or suppressed addresses, answers identically for every address, and only *requests* a confirmation email.

**Downloads** (`/api/resources/download?token=…`):
- *Signed* `d1.<requestId>.<resourceId>.<expiry>.<hmac>` (365 days): scoped to one request and one resource; the request must be unlocked.
- *Legacy* bare request id (issued before this release): unchanged rules. Every request that existed at release is backfilled as unlocked, so issued links keep working. A locked request is refused with no hint.
- Unsubscribing never revokes an unlocked request.

## Analytics (Admin → Guides)

Rates compare the **same unit** on both sides and are never capped. When the numerator is not a subset of the denominator, or there is no denominator, the rate is **—** and an **analytics-integrity warning** is shown. Definitions are printed in Admin next to each number.

Sessions: view → CTA click → membership request. Requests: membership requests → confirmed. Members: confirmed → benefit unlocked. Requests: unlocked → downloaded. Also: public views, guide starts/completions, pending confirmations, confirmed members, benefits unlocked (by confirmation / by existing member), downloads, delivery failures, unsubscribed/suppressed since requesting, ignored attempts.

Attribution (source, medium, referrer, UTM) is copied onto the **request**; if the submitting page had none, the session's first page-view event fills it. Events remain the detailed source of truth.

## Where things live

`config.ts` · `consent-copy.ts` · `member-access.ts` (service) · `membership-email.ts` + `email-layout.ts` (confirmation and rejoin emails) · `delivery-email.ts` (benefit email, tracked sender) · `download-token.ts` · `confirmation-context.ts` · `funnel.ts` + `admin-analytics.ts` · `app/api/resources/member-access`, `…/download`, `app/api/confirm`, `app/api/membership/rejoin` · `app/rejoin`, `app/confirm`.

**Status: member-access v1.2 is live in production (see the release record in rollout-plan.md).**

See also: [copy-v1.2.md](copy-v1.2.md) (all wording; owner-approved for production, not an external legal certification), [migration.md](migration.md), [rollout-plan.md](rollout-plan.md), [conversion-checklist.md](conversion-checklist.md), [follow-up-transition-delivery-status.md](follow-up-transition-delivery-status.md).
