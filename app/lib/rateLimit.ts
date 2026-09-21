import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";

/**
 * Server-side, cross-instance rate limiter backed by a single atomic
 * Postgres UPSERT (see the `rate_limit_check` function / `api_rate_limits`
 * table). Deliberately not an in-memory Map — this app runs on Vercel's
 * serverless/edge platform, where in-memory state isn't shared across
 * instances or survives cold starts, so an in-process limiter would give a
 * false sense of protection. Reuses the existing Supabase infrastructure
 * rather than adding a new dependency (e.g. Redis) for this.
 *
 * Fails OPEN on infrastructure errors: a transient Supabase issue degrades
 * to "not rate limited" rather than blocking every legitimate visitor. This
 * is a deliberate availability-over-strictness tradeoff for a cost-control
 * guard, not a security boundary.
 */
export async function checkRateLimit(key: string, windowSeconds: number, limit: number): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("rate_limit_check", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    console.error(`Rate limit check failed for "${key}" — failing open:`, error);
    return true;
  }

  return data === true;
}

/** Best-effort client IP extraction behind Vercel's proxy. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
