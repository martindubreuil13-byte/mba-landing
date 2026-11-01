# MBA Scheduling — Stage B Configuration Status

31 October 2026. **PARTIAL — safe configuration completed; Google prerequisite blocked. Not ready to deploy.**

## 1. Google OAuth

With explicit owner approval, created **MBA Scheduling Production**, project ID `unique-caldron-513311-j2`, separate from development. Google confirmed successful project creation. No billing account was linked, paid services enabled, or development project settings changed.

Owner confirmed acceptance of the Google API Services User Data Policy. Google then displayed **OAuth configuration created!**. Branding is saved with app name MBA Scheduling, support/developer contact martindubreuil13@gmail.com, homepage https://modernbusinessarchitect.com, privacy https://modernbusinessarchitect.com/privacy and authorized domain modernbusinessarchitect.com. No terms URL or logo was invented.

Created **MBA Scheduling Production Web**, a dedicated Web application client, after explicit action-time owner approval. It has exactly one redirect URI https://modernbusinessarchitect.com/api/admin/scheduling/google/callback, no JavaScript origins or localhost callback. New ID and secret were securely captured, stored in permission-600 gitignored staging and provisioned as Vercel Production-only Secrets; metadata verified. Temporary credential transfer file was removed. No development Google credentials/token/key were copied into production.

Saved precisely four scopes: calendar.freebusy, calendar.events.owned, openid and userinfo.email (equivalent to the application's email scope). No profile, full Calendar, Gmail or Contacts scopes selected. Google reports **Data access changes saved!**.

After explicit owner approval of API terms/enablement and publishing, **Google Calendar API is Enabled** and OAuth audience is **External / In production**. Google’s automatic branding verification passed and verified branding was published: “Your branding has been verified and is being shown to users.” No billing account linked or paid service enabled.

The Testing status responsible for seven-day refresh-token expiry has been removed for future authorizations. No production authorization/token exists yet; complete fresh consent, read-only availability and encrypted storage/refresh checks after approved callback deployment. The development authorization remains unchanged.

Verification Center still states data access is not verified because calendar.events.owned is sensitive. **Prepare for verification** is available but has not been opened/submitted. Review requirements and the owner-only OAuth verification exemption before claiming production readiness; do not submit invented evidence or expand scopes. See [Google exceptions](https://support.google.com/cloud/answer/13464323?hl=en).

Production authorization/read-only availability and encrypted-storage/refresh checks must follow deployment of the approved OAuth callback with operations enabled and intake closed. Current deployed code is unchanged; unauthenticated callback requests return middleware 401, which does not prove a usable callback exists. No development refresh token or encryption key was copied into production.

## 2. Zoom

Read-only revalidation succeeded: S2S token HTTP 200 and configured host meeting-list HTTP 200. Existing five granular meeting scopes remain list/read/create/update/delete; no scope expansion. Configured host equals martindubreuil13@gmail.com, never the alias me. Source ownership checks reject resources belonging to another host.

The authenticated Zoom profile shows this account can host **up to 30 hours with 100 participants**, suitable for the Scheduling duration limit (480 minutes). The host-profile API returned HTTP 400 with existing permissions; no user-read scope was added. License entitlement was confirmed through the portal instead. Exact billing plan name was not separately inspected.

Approved existing Zoom credentials and explicit host are provisioned only in Vercel Production. Development credentials/configuration are unchanged. The same account/app is used; no rotation, new app, meeting or Zoom webhook was created. A Zoom deletion webhook/signing secret remains a separate post-deployment configuration.

## 3. Resend

Read-only API confirms mindrasolutions.com verified, sending enabled, DKIM and both SPF records verified. Intended sender **Martin Dubreuil <martin@mindrasolutions.com>**, reply-to **martin@mindrasolutions.com** are explicitly provisioned. This verifies domain authorization and intended configuration, not mailbox deliverability (no email sent).

Existing production RESEND_API_KEY and existing enabled /api/webhooks/resend endpoint were preserved. New Scheduling webhook is **not created/activated**, because its application endpoint is not deployed. Prepared endpoint/events are recorded in the configuration plan. At the post-deployment stage, create the separate webhook, store its provider-issued secret as SCHEDULING_RESEND_WEBHOOK_SECRET (Production Secret), then validate deployment/signature handling before activation. Do not reuse the existing webhook secret or invent a signing secret.

Signature verification uses Svix id/timestamp/raw-body HMAC, timing-safe comparison and a five-minute age window; failed deliveries remain retryable through the existing claim ledger. Focused signature tests passed locally. No live webhook delivery, replay or email was generated. See [Resend webhook creation](https://resend.com/docs/api-reference/webhooks/create-webhook).

## 4. Supabase recovery

Production recheck: 14 Scheduling tables, all 14 with RLS, zero browser table grants, zero bookings and three published books. Stage A schema remains installed. Vault exists; no mba_scheduling_recovery secret exists. pg_cron/pg_net remain uninstalled.

A distinct random recovery credential is now securely staged and stored in Vercel Production. Vault provisioning is **pending**, not claimed complete: provision the same secret through a protected mechanism without placing plaintext in SQL/query history. No extensions, jobs or Vault records were changed.

Existing PRODUCTION-RECOVERY.sql remains review-only: named minute job, dedicated bearer (never CRON_SECRET/service-role key), one-booking batch, five-minute Zoom and fifteen-minute conflict scans when invoked. Do not execute it before deployment and endpoint verification. pg_net queued headers expose the scoped bearer to authorized database roles; this documented trust boundary must be accepted before infrastructure activation. Health endpoint/admin monitoring and a named backup operator/SLA remain required before customer intake.

## 5. Production environment

**19 new Scheduling-only variables** provisioned as Production Secrets in confirmed mba-site project prj_XDFxc5oBVQXeqC29VsGSmPNKms1P. Metadata recheck confirms all 19 are Production-only/sensitive; all pre-existing environment entries retain their IDs, targets and update timestamps.

- Operations OFF; public intake OFF.
- Supabase/live Google/live Zoom/Resend modes explicitly selected, pending credential completion.
- Canonical callback, guest-calendar invitations OFF, approved sender/reply-to and key version set.
- Distinct 32-byte AES production token key and independent recovery secret generated; Zoom account/client/secret/host set.
- Google client ID/secret now provisioned. Provider-issued Resend secret and optional Zoom webhook secret remain absent.
- No prototype, mock, preview or test-email flags provisioned. Production runtime rejects these modes; hosted preview operations fail closed.

A permission-600, gitignored local secure staging file retains the newly generated secrets for controlled provisioning. It contains actual secrets and must not be attached to reports or committed. An independently secured recovery backup of the encryption key is still an operational requirement.

Focused tests: **24/24 passed**, exit 0 on the authorized rerun. First run also passed assertions but could not write its cache under the filesystem sandbox. No broad audit was reopened.

## 6. Preservation and approval needed

Original development configuration SHA-256 unchanged. Protected Publications, Transition, central Calendly link and existing provider webhook paths show no diff from production baseline. Public /privacy, /publications and /transition return HTTP 200. Production alias remains dpl_EgbDJyDwJdofN3shCZTQ6yckehJG. Environment provisioning does not alter that existing deployment.

No deployment, cron activation, public intake, appointment, Google event, Zoom meeting, email, subscription, commit, push or merge occurred.

**Immediate next action:** resume the bounded review of remaining sensitive-scope verification requirements/owner-only exemption and finish Stage B reporting. Production Calendar authorization remains post-deployment. Hand Google-required consent/account approval to the owner. Stop if Google requires new permissions, billing or unanticipated account changes.

**Next separately authorized stage:** freeze/review the isolated release and deploy the intake-closed Scheduling application to the confirmed mba-site project. Approval must explicitly cover the release commit/push/deployment/promotion and whether operations may be enabled for OAuth/admin with intake still false. No deployment approval is implied by this report. After endpoint verification, separately authorize Google connection/read-only acceptance, Vault/cron and webhook activation. Customer intake and live lifecycle/email tests remain separate approvals.

## Usage pause checkpoint

Stopped at owner-requested usage threshold: latest tool reports 4% remaining (96% used). No further production/account actions after that check. Resume after reset. Current Safari verification-center page is project unique-caldron-513311-j2, branding verified, data-access unverified, Prepare for verification button available. All previous Stage B boundaries remain in force.


## Resume checkpoint — 1 November 2026

**Stage B account configuration complete; end-to-end Google acceptance remains pending Stage C deployment. Stage B as requested (including live read-only Calendar verification) is not fully complete.**

Read this report and PRODUCTION-RELEASE-PREPARATION.md before taking action. Reused the existing MBA Scheduling Production project `unique-caldron-513311-j2`; no duplicate project was created. Live Google Console under martindubreuil13@gmail.com confirms External / In production, 0 users / 100 user cap, and verified branding. The verification preparation summary confirms exactly calendar.freebusy, calendar.events.owned, userinfo.email and openid. The existing application pins martindubreuil13@gmail.com and primary calendar. No configuration or scope changes were needed.

Opened Prepare for verification only to inspect prerequisites, then canceled without submitting. Google lists missing scope justification and demo video for full sensitive-scope verification. No evidence was invented or submitted. Google's documented personal-use exemption allows fewer than 100 users without mandatory verification, with an unverified-app warning. This appears applicable to the explicitly owner-only Calendar connection; it is not a claim of Google approval or completed data-access verification. If OAuth access expands beyond this owner-only use, reassess eligibility and complete verification where required.

Sources checked 1 November 2026:
- https://support.google.com/cloud/answer/13464323?hl=en
- https://developers.google.com/identity/protocols/oauth2#expiration

In production removes the Testing-specific seven-day refresh-token limitation for fresh authorizations; it does not guarantee tokens never expire. No production consent/token exists: the live console shows zero authorized users. Read-only Calendar availability, encrypted token storage and refresh after restart are **not verified**. The approved production callback is not yet deployed, and operations remain off per the existing report. Under the no-deployment restriction, do not add temporary redirects, use another client/development token, or bypass the application's consent/state/storage flow. No Google consent was initiated in this resume.

**Exact next approval requested for Stage C:** authorize review/freeze and commit of the isolated release in mba-scheduling-release, push of the reviewed release branch, and creation of a Production-target deployment in Vercel mba-site (`prj_XDFxc5oBVQXeqC29VsGSmPNKms1P`) without domain assignment. Explicitly authorize operations=true with public intake=false for protected admin/OAuth validation. Promotion of the exact tested deployment to modernbusinessarchitect.com requires subsequent approval. After an approved deployed callback is reachable, resume the already requested owner consent and read-only primary-calendar/encrypted-storage/refresh acceptance checks. No public intake, cron/recovery activation, webhook activation, real appointments, provider resources or email is included.

No deployment, migration, production environment mutation, billing/service change, OAuth grant, Calendar write, appointment, email, cron activation, commit, push or merge occurred during this resume. The prior report records **19** new Scheduling Production settings, superseding the earlier count of 17; environment values were not re-audited in this bounded resume. Zoom, Resend and Supabase work was preserved.
