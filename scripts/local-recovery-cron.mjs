#!/usr/bin/env node
/**
 * LOCAL ONLY: runs the scheduling recovery sweep from inside the local Supabase database, exactly the way production would
 * (pg_cron every minute -> pg_net HTTP GET -> /api/cron/scheduling-sync with a Bearer secret read from the Vault).
 *
 *   node scripts/local-recovery-cron.mjs install   enable pg_cron, store a throwaway secret in the local Vault, schedule the job
 *   node scripts/local-recovery-cron.mjs status    the job, its last runs and the last HTTP answers (never the secret)
 *   node scripts/local-recovery-cron.mjs remove    unschedule the job and delete the secret
 *
 * The secret is generated into `.env.local-cron` (git-ignored by `.env*`, mode 600). Start the dev server with it:
 *   set -a; . ./.env.local-cron; set +a; npm run dev -- --hostname 127.0.0.1
 * Refuses to touch anything but a loopback database. It is not part of any migration and configures nothing in production.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const JOB = "mba-scheduling-sweep-local", SECRET_NAME = "scheduling_cron_secret_local";
const TARGET = process.env.LOCAL_SWEEP_URL ?? "http://host.docker.internal:3000/api/cron/scheduling-sync";   // the container reaches the host's loopback through host.docker.internal
const secretFile = join(root, ".env.local-cron");
const fail = (m) => { console.error(`FAIL  ${m}`); process.exit(1); };
const ok = (m) => console.log(`PASS  ${m}`);

if (!["127.0.0.1", "localhost"].includes(new URL(DB).hostname)) fail("Refusing: the database URL is not loopback. This script only configures the LOCAL stack.");
const sql = (text, args = ["-At"]) => execFileSync("psql", [DB, "-v", "ON_ERROR_STOP=1", "-q", ...args, "-f", "-"], { input: text }).toString().trim();   // SQL (and any secret in it) goes through stdin, not argv

const cmd = process.argv[2];
if (cmd === "install") {
  let secret = existsSync(secretFile) ? readFileSync(secretFile, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] : null;
  if (!secret) { secret = `local-${randomBytes(24).toString("base64url")}`; writeFileSync(secretFile, `CRON_SECRET=${secret}\n`, { mode: 0o600 }); chmodSync(secretFile, 0o600); }
  sql("create extension if not exists pg_cron;");
  sql(`select vault.create_secret('${secret}', '${SECRET_NAME}') where not exists (select 1 from vault.secrets where name = '${SECRET_NAME}');
       select vault.update_secret(id, '${secret}') from vault.secrets where name = '${SECRET_NAME}';`);
  sql(`select cron.unschedule(jobid) from cron.job where jobname = '${JOB}';
       select cron.schedule('${JOB}', '* * * * *', $$ select net.http_get(url := '${TARGET}', headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = '${SECRET_NAME}')), timeout_milliseconds := 55000) $$);`);
  ok(`scheduled "${JOB}" every minute -> ${TARGET}`);
  ok("the secret is in the local Vault and in .env.local-cron (git-ignored, mode 600); start the dev server with that file loaded");
} else if (cmd === "remove") {
  sql(`select cron.unschedule(jobid) from cron.job where jobname = '${JOB}'; delete from vault.secrets where name = '${SECRET_NAME}';`);
  ok("job unscheduled and secret removed from the local Vault (.env.local-cron is left for you to delete)");
} else if (cmd === "status") {
  console.log(sql(`select 'job', jobname, schedule, active from cron.job where jobname = '${JOB}';`, ["-At", "-F", " | "]) || "no job scheduled");
  console.log("--- last runs"); console.log(sql(`select d.status, to_char(d.start_time at time zone 'UTC','HH24:MI:SS') as started_utc, left(coalesce(d.return_message,''), 60) from cron.job_run_details d join cron.job j using (jobid) where j.jobname = '${JOB}' order by d.start_time desc limit 5;`, ["-At", "-F", " | "]) || "(none yet)");
  console.log("--- last HTTP answers"); console.log(sql(`select status_code, to_char(created at time zone 'UTC','HH24:MI:SS') as at_utc, left(coalesce(error_msg,''), 60) from net._http_response order by created desc limit 5;`, ["-At", "-F", " | "]) || "(none yet)");
} else fail("usage: local-recovery-cron.mjs install | status | remove");
