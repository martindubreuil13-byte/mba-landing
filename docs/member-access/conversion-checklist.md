# Converting another resource to the member-access model

Do these **one resource at a time, after the pilot is approved.** Nothing else has been converted.

1. **Public online experience.** What can anyone use with no email? (full guide online, on-screen tool, basic assessment result, educational page). It must be useful on its own and never described as incomplete.
2. **Confirmed-member benefit.** What is clearly *more* useful? (PDF, editable workbook/template, saved or emailed or personalised report, bundle). Say it on the page before the email field.
3. **Fulfilment method.** Today: `asset-download` (a file in the `resource-files` bucket, delivered by signed link). A saved/emailed/generated report needs its own fulfilment kind (add it to `ResourceAccessConfig.memberBenefit.kind` and to `fulfillMemberBenefit`), never a new route.
4. **Consent version.** Add a new entry to `consent-copy.ts` (never edit a published one) and point `access.consentCopyId` at it.
5. **Analytics events.** Reuse the shared `resource_*` events; add `access.analytics.benefitLabel`. Pages must record `resource_page_view`, CTA/form events (client) and nothing else by hand: the service records request, unlock, confirm, delivery and download.
6. **Email templates.** Fill `access.confirmationEmail` and `access.confirmationPage`; the delivery email comes from `config.email`. No new template code.
7. **Legacy-link compatibility.** Existing gated links (bare request ids) must keep working: the migration backfills requests that already exist; check the resource's old download route and any emails already sent.

Also: add the `resources` row/file, the guide content under `app/lib/resources/guides`, a CTA set, and run `member-access.mjs` against it.

## Existing resources: which fit

| Resource | Type | Public layer | Member benefit | Fit / what is needed |
|---|---|---|---|---|
| Build the Bridge First | Guide | full guide online | printable PDF | **done (pilot)** |
| You Have a Business Idea — Now What? (`the-business-architects-frame`) | Guide (PDF only today) | needs an online edition | printable PDF | fits once the guide text exists online (content work); today it uses the legacy form |
| You Want to Start a Business. Now Find One. | Field guide (PDF only) | needs an online edition | printable PDF | same as above |
| The Customer Architecture Map | Worksheet (PDF) | on-screen preview / how-to | editable worksheet | good fit; needs a public preview and an editable-file asset |
| Napkin Principle | Interactive tool | the full on-screen result | emailed/saved breakdown | fits the tool pattern; its current join flow records consent via its own checkbox and must move to the confirmed model (and the legacy unsubscribe path already shares `applyOptOut`) |
| Business Idea Reality Check | AI-assisted assessment | a useful on-screen summary | detailed saved/emailed report | fits, but needs an *assessment* fulfilment kind and care with OpenAI processing; do not erase completed work if the visitor declines |

Legacy resources keep using `/api/resources/request` until converted; the download route only gates resources that have an `access` config.
