#!/usr/bin/env node
/**
 * Restore (or create) the LOCAL development admin account and prove it can sign in. Never prints a password or token.
 *
 *   node scripts/local-admin.mjs
 *
 * It is real authentication, not a bypass: it only makes sure the throwaway admin user exists in the LOCAL Supabase auth service
 * with a password you can read, then signs in through the normal password grant to confirm it works. It refuses to run against
 * anything but a loopback Supabase, and never touches the production admin identity.
 *
 * Password source, in order: LOCAL_ADMIN_PASSWORD (environment) -> `.env.local-admin` (git-ignored, mode 600) -> a new random
 * one, which is then written to `.env.local-admin`. Open that file yourself to sign in at /admin; nothing here prints it.
 */
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parse = (path) => {
  const o = {};
  if (!existsSync(path)) return o;
  for (const l of readFileSync(path, "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
  return o;
};
const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exit(1); };
const ok = (msg) => console.log(`PASS  ${msg}`);

const dev = parse(join(root, ".env.development.local"));
const prod = parse(join(root, ".env.local"));
const url = dev.NEXT_PUBLIC_SUPABASE_URL, anon = dev.NEXT_PUBLIC_SUPABASE_ANON_KEY, service = dev.SUPABASE_SERVICE_ROLE_KEY, email = dev.ADMIN_EMAIL;
if (!url || !anon || !service || !email) fail(".env.development.local must define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and ADMIN_EMAIL.");

let host; try { host = new URL(url).hostname; } catch { fail("NEXT_PUBLIC_SUPABASE_URL is not a URL."); }
if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(host)) fail("Refusing: the Supabase URL is not loopback. This script only manages the LOCAL development admin.");
if (prod.ADMIN_EMAIL && prod.ADMIN_EMAIL.toLowerCase() === email.toLowerCase()) fail("Refusing: the development ADMIN_EMAIL equals the production one. Use a separate local identity (for example martin.local@example.test).");

const passwordFile = join(root, ".env.local-admin");
const stored = parse(passwordFile).LOCAL_ADMIN_PASSWORD;
let password = process.env.LOCAL_ADMIN_PASSWORD || stored;
let source = process.env.LOCAL_ADMIN_PASSWORD ? "environment" : stored ? ".env.local-admin" : "generated";
if (!password) password = `la-${randomBytes(18).toString("base64url")}`;

const call = async (path, init = {}, key = service) => {
  const r = await fetch(`${url}/auth/v1${path}`, { ...init, headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(15000) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const signIn = async () => (await call("/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) }, anon));

const health = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anon }, signal: AbortSignal.timeout(8000) }).then((r) => r.status).catch(() => 0);
if (health !== 200) fail("The local Supabase auth service is not answering. Start it with `supabase start`.");
ok("local Supabase auth service is healthy");

let attempt = await signIn();
if (attempt.status === 200) {
  ok(`the local admin can already sign in (password source: ${source})`);
} else {
  const list = await call("/admin/users?page=1&per_page=200");
  const user = (list.body.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (user) {
    const r = await call(`/admin/users/${user.id}`, { method: "PUT", body: JSON.stringify({ password, email_confirm: true }) });
    if (r.status !== 200) fail(`could not update the local admin user (HTTP ${r.status}).`);
    ok("local admin user existed; its password was reset to the stored local value");
  } else {
    const r = await call("/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) });
    if (r.status >= 300) fail(`could not create the local admin user (HTTP ${r.status}).`);
    ok("local admin user created");
  }
  attempt = await signIn();
  if (attempt.status !== 200) fail(`the account exists but sign-in still fails (HTTP ${attempt.status}).`);
  ok("sign-in through the normal password grant works");
}

if (!stored || stored !== password) {
  writeFileSync(passwordFile, `LOCAL_ADMIN_PASSWORD=${password}\n`, { mode: 0o600 });
  chmodSync(passwordFile, 0o600);
  ok("password saved to .env.local-admin (git-ignored, mode 600); open that file to read it");
} else ok(".env.local-admin already holds the password");
console.log(`INFO  sign in at http://localhost:3000/admin as ${email}`);
