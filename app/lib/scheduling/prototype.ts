import { notFound } from "next/navigation";

/**
 * MBA Scheduling is a LOCAL PROTOTYPE. It runs only when
 *   - the code is NOT on Vercel (VERCEL / VERCEL_ENV are never set locally, always set there), AND
 *   - it was asked for: `next dev` (NODE_ENV=development) or SCHEDULING_PROTOTYPE=true for a local `next start`.
 * So a deployment to Vercel can never serve it, whatever the environment variables say. When it is off, every public
 * page, admin page and API route answers 404 as if it did not exist.
 */
export function schedulingPrototypeEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL || env.VERCEL_ENV) return false;
  return env.SCHEDULING_PROTOTYPE === "true" || env.NODE_ENV === "development";
}

/** For pages and layouts. */
export function requireSchedulingPrototype(): void {
  if (!schedulingPrototypeEnabled()) notFound();
}
