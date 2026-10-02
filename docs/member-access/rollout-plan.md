# Rollout plan (nothing here has been done)

Approvals (all granted by the owner; operational approval, not external legal certification): (1) v1.2 copy + privacy text (`copy-v1.2.md`), (2) the migration, (3) the decision to change a live flow: the PDF no longer downloads at once and unlocks only after confirmation.

1. Review `copy-v1.2.md` and the `/privacy` section; edit wording if needed (wording lives in `consent-copy.ts` / `config.ts`).
2. Restore point + pre-state snapshot (row counts of leads, consent_records, resource_requests, resource_events, program_applications).
3. Apply `20261003090000` to production (additive; see `migration.md`). Verify: column and index exist, 0 locked rows, counts unchanged, `list_migrations` shows the new version.
4. Merge the PR; normal Git production deployment on `mba-site` only. No CLI deploy, no promotion.
5. Read-only checks: the guide page is readable and has no download link; `/confirm` and `/rejoin` render; old issued links still redirect to storage (use a known test request); `/api/resources/download` with a bare id of a *new* locked request is refused.
6. Controlled test with one authorised test address (a `+alias` of the owner's inbox, not a real lead): form → "Check your inbox" with no download; confirmation email delivered; GET `/confirm` changes nothing; button POST confirms, unlocks, starts the PDF and sends the durable link; replay is harmless; asking again as a member emails the link and changes nothing on screen; unsubscribe, then the standard form does nothing, `/rejoin` sends a confirmation; Admin shows consistent counts and no integrity warning; Resend shows delivered.
7. Logs: no new errors. Resend webhook still delivering (the confirmation email and the benefit email are tracked separately on the request).
8. Do **not** contact, reconfirm or reclassify existing pending leads.

Rollback: see `migration.md` (code and schema together).

Operational notes: the form's per-address and per-connection rate limits are shared by all states (so they cannot be used to tell states apart). Typing a member's address does not unlock anything on screen; the benefit goes to their inbox.
