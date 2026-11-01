import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { deploymentEnv } from "@/app/lib/deployment";

/**
 * The sign-in-free admin preview (/scheduling-preview) exists ONLY for local development. It is on when ALL of these hold:
 *   - NODE_ENV is exactly "development" (`next dev`; a build, `next start` and tests are never "development")
 *   - not on Vercel (VERCEL / VERCEL_ENV unset)
 *   - the deployment environment is not production or preview (APP_ENV)
 *   - the request's Host is loopback (localhost, 127.0.0.1, ::1), so it is not reachable by name from another machine
 * Otherwise it answers 404 as if it did not exist. It reads and writes only the simulated prototype data; it never
 * touches the admin session, Supabase or any production record, and it does not alter how /admin authenticates.
 */
export function isLoopbackHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.trim().toLowerCase();
  const name = h.startsWith("[") ? h.slice(0, h.indexOf("]") + 1) : h.split(":")[0];
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]";
}

export function schedulingPreviewEnabled(env: Record<string, string | undefined> = process.env, host?: string | null): boolean {
  if (env.VERCEL || env.VERCEL_ENV) return false;
  if (env.NODE_ENV !== "development") return false;
  if (deploymentEnv(env) !== "development") return false;
  return isLoopbackHost(host);
}

/** For preview pages and layouts. */
export async function requireSchedulingPreview(): Promise<void> {
  const h = await headers();
  if (!schedulingPreviewEnabled(process.env, h.get("host"))) notFound();
}
