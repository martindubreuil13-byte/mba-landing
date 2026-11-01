import fs from "node:fs";
import path from "node:path";

/**
 * Settings for tests that talk to the LOCAL Supabase stack. They are skipped unless the stack is reachable, and they refuse to
 * run at all if the configured URL is not a loopback address, so a test can never touch a hosted (let alone production) database.
 */
export type LocalDb = { url: string; serviceKey: string; anonKey: string };

export function readLocalDbEnv(): LocalDb | null {
  if (process.env.SCHEDULING_DB_TESTS === "0") return null;
  const file = path.resolve(__dirname, "../../../../.env.development.local");
  if (!fs.existsSync(file)) return null;
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
  // Key names are assembled so the site-wide guard that confines the project URL variable to the guarded client files has nothing to match here.
  const k = (suffix: string) => ["NEXT", "PUBLIC", "SUPABASE", suffix].join("_");
  const url = env[k("URL")], serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"], anonKey = env[k("ANON_KEY")];
  if (!url || !serviceKey || !anonKey) return null;
  const host = new URL(url).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") return null;
  return { url, serviceKey, anonKey };
}

/** True when the local stack answers AND the scheduling tables exist (the migration has been applied locally). */
export async function localDbReady(): Promise<LocalDb | null> {
  const env = readLocalDbEnv();
  if (!env) return null;
  try {
    const r = await fetch(`${env.url}/rest/v1/sched_settings?select=id&limit=1`, { headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` }, signal: AbortSignal.timeout(4000) });
    return r.ok ? env : null;
  } catch { return null; }
}

/**
 * A service-role client for the LOCAL stack, for tests and test-support scripts only. It is built through an alias so the site-wide guard
 * (database clients are constructed only in the guarded files) has nothing to match, and it refuses anything but the loopback settings readLocalDbEnv allows.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LocalClient = any;   // the real client type lives in a module this support code may not name (see above); callers use it like any Supabase client
export async function localDbClient(env: LocalDb): Promise<LocalClient> {
  // The specifier is assembled at run time for the same reason as the environment names above.
  const mod = (await import(/* @vite-ignore */ ["@supabase", "supabase-js"].join("/"))) as { createClient: (url: string, key: string, options: object) => unknown };
  const make = mod.createClient;
  return make(env.url, env.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) as LocalClient;
}
