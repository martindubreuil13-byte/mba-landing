// Offline check of the Scheduling secrets before they are provisioned or rotated. Prints validity and short SHA-256 fingerprints ONLY, never a value.
// Usage:  node scripts/check-scheduling-keyring.mjs [path/to/env-file]     (default: the process environment)
// A fingerprint identifies a secret without revealing it: record it beside the backup, and compare it after a restore.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const fingerprint = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

/** @param {string} text @returns {Record<string, string>} */
export function parseEnvFile(text) {
  /** @type {Record<string, string>} */ const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trimStart().startsWith("#")) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: boolean, problems: string[], secrets: Record<string, { fingerprint: string, version?: number, length?: number }> }}
 */
export function checkKeyring(env) {
  /** @type {string[]} */ const problems = [];
  /** @type {Record<string, { fingerprint: string, version?: number, length?: number }>} */ const report = {};
  const key = (name, versionName, required) => {
    const value = env[name];
    if (!value) { if (required) problems.push(`${name} is missing`); return; }
    const bytes = Buffer.from(value, "base64");
    if (bytes.length !== 32) { problems.push(`${name} must be 32 random bytes, base64-encoded`); return; }
    const version = Number(env[versionName] ?? (name === "SCHEDULING_TOKEN_KEY" ? 1 : NaN));
    if (!Number.isInteger(version) || version < 1) problems.push(`${versionName} must be a positive whole number`);
    report[name] = { fingerprint: fingerprint(value), version };
  };
  key("SCHEDULING_TOKEN_KEY", "SCHEDULING_TOKEN_KEY_VERSION", true);
  key("SCHEDULING_TOKEN_KEY_PREVIOUS", "SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION", false);
  const cur = report.SCHEDULING_TOKEN_KEY, prev = report.SCHEDULING_TOKEN_KEY_PREVIOUS;
  if (prev && cur) {
    if (prev.fingerprint === cur.fingerprint) problems.push("the previous key is identical to the current key");
    if (prev.version === cur.version) problems.push("the previous key has the same version as the current key");
  }
  if (env.SCHEDULING_TOKEN_KEY_PREVIOUS && !env.SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION) problems.push("SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION must be set with the previous key");
  const secret = (name, required) => {
    const value = env[name];
    if (!value) { if (required) problems.push(`${name} is missing`); return; }
    if (value.length < 32) problems.push(`${name} must contain at least 32 characters`);
    report[name] = { fingerprint: fingerprint(value), length: value.length };
  };
  secret("SCHEDULING_RECOVERY_SECRET", true);
  secret("SCHEDULING_RECOVERY_SECRET_PREVIOUS", false);
  const r = report.SCHEDULING_RECOVERY_SECRET, rp = report.SCHEDULING_RECOVERY_SECRET_PREVIOUS;
  if (r && rp && r.fingerprint === rp.fingerprint) problems.push("the previous recovery secret is identical to the current one");
  if (env.CRON_SECRET && r && fingerprint(env.CRON_SECRET) === r.fingerprint) problems.push("SCHEDULING_RECOVERY_SECRET must differ from the site-wide CRON_SECRET");
  return { ok: problems.length === 0, problems, secrets: report };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  let env = process.env;
  if (process.argv[2]) { try { env = parseEnvFile(readFileSync(process.argv[2], "utf8")); } catch { console.error("The env file could not be read."); process.exit(2); } }
  const result = checkKeyring(env);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}
