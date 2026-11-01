# MBA Scheduling — recovery credentials: backup and rotation

Prepared 1 November 2026 (Stage G). **Procedure only. No production secret was read, copied, rotated or replaced in preparing it.** The two local staging files (`.env.scheduling-production.local`, `.env.scheduling-stage-e.local`) hold real secrets; they were not opened. Every command below is run by Martin, on a machine he controls, never by an assistant and never in a chat.

## What exists, where it lives, and what losing it costs

| Secret | Lives in | If lost | Backup |
|---|---|---|---|
| `SCHEDULING_TOKEN_KEY` (+ `_VERSION`) | Vercel Production (sensitive: **write-only, cannot be read back**) and the local mode-600 staging file | The stored Google credential can no longer be read. The connection flips to "needs reconnection" and Google writes stop until Martin reconnects in Integrations (about five minutes). **No booking, email or Zoom data is lost.** | **Required.** Vercel will not show it again, so the staging file is the only copy. |
| `SCHEDULING_RECOVERY_SECRET` | Vercel Production, Supabase Vault entry `mba_scheduling_recovery`, staging file | The minute recovery job and health check answer 401. Replace it in both places (below). | Recommended (replaceable). |
| `SCHEDULING_GOOGLE_CLIENT_SECRET`, `SCHEDULING_ZOOM_CLIENT_SECRET`, `SCHEDULING_RESEND_WEBHOOK_SECRET` | Vercel Production, staging file | Regenerate at Google, Zoom or Resend and set the new value. | Optional. |
| Restricted Resend key for the dead-man alert (`mba_scheduling_alert_resend`) | Supabase Vault only (once approved and created) | Create another restricted key. | No. |

`SCHEDULING_TOKEN_KEY` encrypts only the Google refresh token and the short-lived sign-in verifiers. Booking data is not encrypted with it, so losing it is an inconvenience, not a data loss. A **wrong** key is worse than a missing one in one respect: the first refresh with it marks the connection "needs reconnection", and that status stays after the configuration is corrected (reconnect again).

## Backup (do this before any rotation, and once now)

1. **Check the staging file offline and record fingerprints.** The check prints validity and 12-character SHA-256 fingerprints only, never a value:
   `node scripts/check-scheduling-keyring.mjs .env.scheduling-production.local`
   Write the fingerprints in the password-manager note below. They let you prove later that a restored copy is the right one.
2. **Make an encrypted copy** (the passphrase is typed at the prompt, so it is not in shell history):
   `umask 077 && openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -in .env.scheduling-production.local -out scheduling-secrets-YYYYMMDD.enc`
3. **Store it in two independent places.** The passphrase and the fingerprints go in the password manager (a secure note named "MBA Scheduling secrets"). The `.enc` file goes on a second medium that is not the Mac's own disk (an encrypted USB drive kept elsewhere, or a private cloud folder). The passphrase must never sit next to the file.
4. **Prove it restores.** In a new empty folder: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in scheduling-secrets-YYYYMMDD.enc -out restored.env`, run the check on `restored.env`, compare the fingerprints, then `rm -P restored.env`.
5. Repeat after every rotation. Keep a retired encryption key for as long as any database backup that still holds a credential encrypted with it exists (Supabase retention, at least 30 days).

Never put these values in the repository, an email, a screenshot, a ticket, a chat with any assistant, or `vercel env pull` output left on disk.

## Rotation: the encryption key (planned, or after suspected exposure)

Do it at a quiet time with no appointment in the next hour. The application already supports a key ring: current key plus one previous key, and a stored credential is re-encrypted under the current key the first time it is used afterwards (Stage G). Nothing needs to be re-entered at Google.

1. Back up (above). Generate the new key to a file, not the screen: `umask 077 && openssl rand -base64 32 > new.key`.
2. In a copy of the staging file set `SCHEDULING_TOKEN_KEY=<new>`, `SCHEDULING_TOKEN_KEY_VERSION=<n+1>`, `SCHEDULING_TOKEN_KEY_PREVIOUS=<old>`, `SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION=<n>`. Run the check on it. It must report `ok: true` with two different keys and versions.
3. Set the same four variables in Vercel Production and deploy (variable changes need a new deployment).
4. Verify: Integrations still says connected. Within about an hour the first token refresh happens; confirm read-only that the stored version moved: `select key_version from public.sched_google_connection;` shows `n+1`.
5. Remove the two `PREVIOUS` variables from Vercel and redeploy. Update and re-backup the staging file. Keep the retired key in the backup (step 5 above).
6. **If the key itself leaked together with a database copy**, rotation is not enough: also disconnect and reconnect Google (this revokes and replaces the real secret, the refresh token).

If the Integrations page shows "needs reconnection" after a rotation, the key ring was wrong at the time of the first refresh. Fix the configuration, then reconnect in Integrations.

## Rotation: the recovery secret (no gap)

Requires the Stage G build to be deployed (it accepts a previous secret during the switch).

1. Generate at least 32 characters: `umask 077 && openssl rand -base64 48 | tr -d '/+=\n' > new.secret`.
2. Vercel Production: `SCHEDULING_RECOVERY_SECRET=<new>`, `SCHEDULING_RECOVERY_SECRET_PREVIOUS=<old>`. Deploy. The application now accepts both.
3. Replace the Supabase Vault entry `mba_scheduling_recovery` with the new value **in the dashboard's Vault page** (not in the SQL editor, so the secret does not enter query history). The minute job and the alert job read it on every run.
4. Observe three consecutive successful minute runs (`net._http_response` status 200, application heartbeat fresh) and `node --env-file=<staging file> scripts/check-scheduling-health.mjs` returning healthy with the **new** secret.
5. Remove `SCHEDULING_RECOVERY_SECRET_PREVIOUS` and redeploy. Confirm the old value now gets 401. Update the staging file, re-backup.
6. Never substitute the site-wide `CRON_SECRET` or a service-role key. The offline check flags a recovery secret equal to `CRON_SECRET`, so run it on the staging file before provisioning.

pg_net holds the bearer in its queue while a call is pending; if any role with pg_net access might have been compromised, rotate immediately using this procedure.

## Other credentials

Regenerate in the provider's console (Google client secret, Zoom client secret, Resend webhook signing secret), set the new value in Vercel Production, deploy, then confirm one signed webhook or one read-only API check. Do not rotate the existing site-wide Resend API key or `CRON_SECRET` as part of Scheduling.

## What was verified in Stage G (no real secret involved)

Tests use random local values: the recovery bearer accepts the previous secret only while one is configured, never a short or empty one, and a previous secret alone opens nothing; production start-up refuses a short or duplicate previous secret; a stored credential under a retired key is re-encrypted on first use and a reconnection made at the same moment is never overwritten; the offline check reports fingerprints only and flags missing, short, duplicate, wrongly versioned or `CRON_SECRET`-equal secrets.
