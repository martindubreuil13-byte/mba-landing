/**
 * The address a request really came from, for rate limits only (never logged, never stored in the clear: see ./abuse.ts).
 *
 * Behind Vercel's proxy a value the visitor sends in `x-forwarded-for` is discarded and replaced by the real peer address (verified against the
 * production site on 2 November 2026: 60 requests each claiming a different address were all counted as one client). The LAST entry of that header
 * is the one the proxy itself wrote, so it is correct under that behaviour and also if a proxy ever appended instead of replacing; the first entry
 * is whatever the sender claimed and is never used on the platform. The platform's own `x-vercel-forwarded-for` and `x-real-ip` are the fallbacks.
 * Anywhere else (a local run, a test) there is no trusted proxy and the first forwarded entry is used as before.
 *
 * When nothing usable is present the answer is null and the caller skips the per-client limit rather than putting every visitor into one shared
 * bucket (which would let one person lock everyone out).
 */
export function trustedClientIp(req: Request, env: Record<string, string | undefined> = process.env): string | null {
  const first = (v: string | null) => (v ? v.split(",")[0].trim() : "") || null;
  if (env.VERCEL === "1") {
    const chain = req.headers.get("x-forwarded-for");
    const last = chain ? chain.split(",").pop()?.trim() : "";
    return last || first(req.headers.get("x-vercel-forwarded-for")) || first(req.headers.get("x-real-ip"));
  }
  return first(req.headers.get("x-forwarded-for")) ?? first(req.headers.get("x-real-ip"));
}
