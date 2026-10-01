# Converting the next downloadable guide

Everything below is data and configuration; no new components, tables or routes are needed.

1. **Resource row.** The guide must already exist in Admin → Resources as published, with its PDF and cover uploaded (this is how every resource works today).
2. **Content.** Copy `app/lib/resources/guides/build-the-bridge-first.ts` to `<slug>.ts` and replace the content. Sections are `cover`, `standard` (intro + aside + exercise + output), `brief`, `invitation`. Exercise blocks available: `choice-grid`, `fields`, `choice-row`, `matrix`, `cards`, `quadrants`, `note`. Register it in `app/lib/resources/guides/index.ts`. Give each section the id `page-N`.
3. **Config.** Add one entry to `app/lib/resources/config.ts`: `slug`, `kind`, `consentCopyId`, `printableName`, `timeRequired`, `midCtaAfterSectionId` (the section whose exercise comes first), the three CTA texts and the delivery email copy.
4. **Consent wording.** Reuse `resource-guide-consent-v1.1` (confirmed opt-in; v1.0 is retained only as history). To change wording or move to a checkbox, add a NEW entry in `app/lib/resources/consent-copy.ts` (never edit a published one) and point the config at it.
5. **Verify.** Run the page-by-page comparison (see `content-comparison.md` for the method), submit once with a Resend test address (`delivered+x@resend.dev`), and confirm the guide appears under Admin → Guides.

Nothing else changes: events, consent records, delivery tracking, unsubscribe and the admin view are shared. Resources without an entry keep the existing request form.
