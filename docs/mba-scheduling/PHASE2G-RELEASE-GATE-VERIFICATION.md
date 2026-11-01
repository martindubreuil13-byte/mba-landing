# MBA Scheduling — Phase 2G release-gate verification

2026-10-31 · Targeted verification only. No comprehensive re-audit.

## Decision: CONDITIONAL — Specific action needed

**The three fixes pass; no targeted critical defect remains reproduced.** Next, prepare an **intake-off, operations-on release gate**: current code disables everything on Vercel. Acceptance: public booking pages/APIs remain unavailable; authenticated admin/OAuth/recovery work; unsigned webhooks fail. Once demonstrated, proceed directly to production configuration preparation. **Not customer go-live approval; no further broad audit recommended.**

## 1. Three targeted checks

| Gate | Result and independent evidence |
|---|---|
| Cleanup cannot delete an adopted authoritative meeting | **PASS.** Original interleaving now leaves an existing replacement; reverse-order adoption makes condemnation return `owned`. The new tombstone trigger prevents recording a condemned meeting. PostgreSQL contract tests exercise condemnation/adoption concurrency; interrupted cleanup remains recoverable. All sync-engine Zoom deletion calls use the condemnation path. |
| Ordinary Retry Sync cannot authorize another uncertain creation | **PASS.** The original empty-body admin retry no longer produces a second create. Repeated retries retain uncertainty. A separate resolution action requires the current attempt, a lease and either validated adoption or explicit duplicate-risk acknowledgment; rendered panel has no preselected acknowledgment. A human's “none exists” remains an acknowledged risk, not a claim of proven absence. |
| Missing/malformed Zoom fields cannot verify synchronization | **PASS.** Original null-field reproducer now returns unsuccessful sync. Focused tests cover identity, invalid/missing time and duration, adapter payloads and direct-read completion. Insufficient evidence remains unverified rather than becoming success. |

Executed: **37 Phase 2G tests, 64 database/process-kill tests and 10 independent adapted gate tests: all pass.** Unchanged reproducers: seven safeguards pass; three unsafe assertions fail as expected. Disposable database, all four migrations, mocked providers, no live provider keys. Evidence: `audit/phase2g/`; no broad suite rerun.

## 2. Process-kill flake

**Classification: INCONCLUSIVE historical cause; not a demonstrated booking-recovery defect.** The original failing child output was not retained, so the local-connection explanation is plausible but unproven. The harness retries any unclassified child exit once; a successful retry cannot establish the first failure's cause.

The process-kill file passed. With retries disabled **in the disposable copy**, both cleanup cases passed three repetitions: **6/6**. This does **not** warrant blocking preparation. Retain first-attempt stderr/exit code/kill-point state. Never retry away “finished without being killed” or incorrect recovery state.

## 3. Essential production prerequisites — status and exact actions

| Prerequisite | Verified status → action / acceptance |
|---|---|
| Google OAuth | No Scheduling Google client/secret/token-key variables in Vercel production; no hosted Scheduling tables. Development authorization is not production readiness. **Prepare the production client/HTTPS callback, confirm consent publishing status outside Testing, retain owner/primary-calendar restrictions and minimal scopes, configure encrypted credentials.** Acceptance: correct-owner connection, read-only availability and refresh after restart; no events required. Current Cloud-console publishing status was not independently observed. |
| Recovery cron | Hosted `pg_cron` **1.6.4** and `pg_net` **0.20.4** are available, neither installed. **Prepare minute invocation with scoped authentication and a bounded worker batch.** Acceptance: observed successful heartbeat, successful five-minute Zoom scan and queued repair on a subsequent invocation. Review pg_net queued-header visibility before selecting credentials. No extension/job was changed. |
| Resend | Production API-key metadata exists; read-only account queries confirm `mindrasolutions.com` verified. **No Scheduling delivery webhook exists**; the existing non-Scheduling webhook remains. Configure explicit sender `Martin Dubreuil <martin@mindrasolutions.com>`, approved reply-to and a separate signed Scheduling webhook/secret. Sender/reply-to production values were not decrypted. Acceptance: read-only configuration check and signed mocked delivery/retry handling; real sending needs separate authorization. |
| Monitoring | Admin “Needs attention,” uncertainty panel and heartbeat exist; outbound alerting does not. **Assign an owner/backup, review cadence and escalation runbook before intake.** Cover unresolved/approaching bookings, failed scans and recovery outages. A replacement Zoom meeting changes the link: require owner review and explicit confirmation resend to the guest before the appointment. Acceptance: an injected mock uncertainty is visible and the operator can resolve/escalate it without ordinary Retry authorizing creation. |

## 4. Safe release sequence and next step

Production remains the Publications restoration: `2e0f68b97a2723a3bbee6445e4ea8c67b6e66302`; remote main matches. **42 Publications and 67 Transition/Calendly paths match that baseline.** Three books remain published. Scheduling is uncommitted on the older `feat/mba-scheduling` checkout; do not deploy it wholesale.

**Exact next task:** assemble an isolated release from that production commit, selectively carry Scheduling/shared changes, and implement/test the intake-off gate above. Then rehearse migrations in order **20261101090000 → 20261102090000 → 20261103090000 → 20261104090000** on a production-schema copy. Keep a schema-compatible worker/admin rollback release; freeze intake and drain cleanup before disabling operations. Obtain authorization before hosted configuration or deployment.

Previously recorded E-01 email-ambiguity and E-04 public-abuse intake gates remain carried forward, not reopened or retested here. They still require closure or an explicitly restricted release scope before customers book. No production writes, commits, pushes, deployments, real appointments or emails occurred; existing source work was preserved.
