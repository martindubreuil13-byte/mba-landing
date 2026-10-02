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

---

# Release record: member-access v1.2 — COMPLETE (2026-10-02)

| Item | Result |
|---|---|
| Approval | Owner operational approval (not external legal certification); copy in `copy-v1.2.md` unchanged |
| PR | #4, squash-merged; squash commit `8ea11f1802e5064d2368f6d1b389b196b6e6ca31` (reviewed head `4291244`, first commit `ee13ab8`) |
| Pre-merge test run (final pushed commit) | tsc, eslint, unit 271/271, build; guide API 189/189; email-failure API 44/44 and browser 24/24; shared regression 19/19; browser 67/67; preview safeguards (all modes incl. production-database refusal) and preview browser 7/7; Transition API 39/39 + browser 17/17; migration script (identical tables, 3/3 backfilled, rollback equals snapshot) |
| Migration | `20261003090000_resource_member_access.sql` applied once, in one transaction, before the merge. Production history: 12 migrations. Pre/post md5 of leads, consent_records, resource_events, program_applications and of every `resource_requests` column except the new one: **identical**. 12 of 12 existing requests backfilled to their own `requested_at`; 0 locked; partial index present; no email sent |
| Restore protection | Supabase daily physical backups (newest 2026-10-01 10:57Z, i.e. before recent activity); the change is additive, existing columns untouched, rollback SQL in `migration.md` |
| Deployment | Normal Git production deployment `dpl_8ZGbDSD4eKWjfjQ2gerpuBvD8v7C` (READY) on `mba-site`; `modernbusinessarchitect.com` serves it (`/rejoin` exists only in this build). `mba-landing` also built the commit; it has no custom domain and no effect on the production domain. No CLI deploy, no promotion |
| Preview isolation | Preview environments hold the production Supabase variables, but the production-database guard (tested: `prod-database` mode, all checks pass) refuses data access and email policy blocks sends outside production |

## Controlled production test (one new `+alias`, left unsubscribed as audit evidence)

All passed: guide readable without email; CTA/form describe the free-member benefit; submit returned only `{"success":true,"state":"check_inbox"}`; no PDF URL in API response, HTML, client state or confirmation email; confirmation email delivered with the approved wording; GET `/confirm` changed nothing; the button POST activated membership once, wrote linked `opt_in` evidence, unlocked the request, started the PDF download and sent the durable email; replay (twice) added no consent, unlock, confirmed event or email; a confirmed member asking again (after the 10-minute window) got the same neutral response and a signed-link email without reconfirmation; unsubscribe worked and both the signed and the request-id links still downloaded; the standard form on the unsubscribed address returned the same neutral response, sent nothing and changed nothing; `/rejoin` returned the identical response for the test address and for a non-existent address (no lead created), sent a confirmation email and left the address pending until confirmed (then cancelled via unsubscribe); attribution (UTM) persisted on the request; every email `delivered` per the Resend webhook; an Oct 1 test link issued before the release still downloads; the two genuine October 2 pending leads and all program applications are md5-identical to before and received nothing; production logs show no errors and no 4xx/5xx.

## Notes (non-blocking)

- **Served PDF.** Production serves `Build-the-Bridge-First-FINAL.pdf` (415,804 bytes), byte-identical to that file in `Lead Magnets/`. The 462,621-byte `…-FINAL-corrected.pdf` used in local tests has never been uploaded. Decide whether the corrected edition should replace the stored file (a storage swap, not a code change).
- **Analytics-integrity warning in Admin.** Controlled-test sessions made with headless Chrome are ignored by the bot filter for page views/clicks, but their server-side requests are recorded, so the 30-day Admin view shows a (correct) integrity warning and `—` for the two session rates until those 3 sessions age out. Real visitor sessions are unaffected.
- **Admin screens were reconciled from the database** with the documented definitions; no signed-in production Admin session was available.
- **Transition delivery status** stays `queued` in Admin — see `follow-up-transition-delivery-status.md` (separate, non-blocking).
