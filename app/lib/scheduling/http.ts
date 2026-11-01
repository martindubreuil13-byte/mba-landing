import "server-only";
import { deploymentEnv } from "@/app/lib/deployment";
import { timingSafeEqual } from "node:crypto";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { schedulingOperationsEnabled, schedulingIntakeEnabled } from "./release-gates";
import { allowGlobal, allowRequest, type RateRule } from "./rate-limit";
import { assertSameSite, bodyOf, json, isSchedulingError, notFound, publicBody, run, str, type Handler } from "./http-shared";

export { bodyOf, json, isSchedulingError, publicBody, str };

/** Public route: new intake defaults off in production; optionally rate limited per client (429 with Retry-After). `adminPreview` (GET only) lets the signed-in administrator use a read-only route while intake is closed. */
export function publicRoute<C = unknown>(fn: Handler<C>, opts: { rate?: RateRule; globalRate?: RateRule; intake?: boolean; adminPreview?: boolean } = {}) {
  return async (req: Request, ctx: C) => {
    if (!(opts.intake === false ? schedulingOperationsEnabled() : schedulingIntakeEnabled())) {
      // While intake is closed, a READ-ONLY route may opt in to serving the signed-in administrator (the booking page's preview). Nothing that writes ever does.
      const preview = opts.adminPreview === true && req.method === "GET" && schedulingOperationsEnabled() && !!(await getAdminUser().catch(() => null));
      if (!preview) return notFound();
    }
    if (req.method !== "GET" && req.method !== "HEAD") { try { assertSameSite(req); } catch (e) { return run(async () => { throw e; }, req, ctx); } }
    if ((opts.rate && !(await allowRequest(req, opts.rate))) || (opts.globalRate && !(await allowGlobal(opts.globalRate)))) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again.", code: "rate_limited" }), { status: 429, headers: { "content-type": "application/json", "cache-control": "no-store", "retry-after": String(Math.min((opts.rate ?? opts.globalRate)!.windowSeconds, 60)) } });
    }
    return run(fn, req, ctx);
  };
}

/** Admin route: operations gate independent of intake, 401 unless the signed-in admin (the existing admin authentication). */
export function adminRoute<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    if (!schedulingOperationsEnabled()) return notFound();
    if (!(await getAdminUser())) return json({ error: "Unauthorized" }, 401);
    return run(fn, req, ctx);
  };
}

/** Inbound webhook: same on/off switch. Each handler verifies its provider's signature itself and refuses when its secret is not configured. */
export function webhookRoute<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => (schedulingOperationsEnabled() ? run(fn, req, ctx) : notFound());
}

/**
 * Scheduled job: same on/off switch plus the dedicated Scheduling recovery bearer check (constant time). Without a scoped secret it refuses every production call.
 * During a rotation SCHEDULING_RECOVERY_SECRET_PREVIOUS (production only, at least 32 characters) is accepted as well, so the scheduler and the application can be
 * switched one after the other without a gap. Remove it once the scheduler uses the new secret.
 */
export function cronRoute<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    if (!schedulingOperationsEnabled()) return notFound();
    const secret = process.env.SCHEDULING_RECOVERY_SECRET || (!(process.env.VERCEL || process.env.VERCEL_ENV) && deploymentEnv() === "development" ? process.env.CRON_SECRET : undefined);
    const previous = process.env.SCHEDULING_RECOVERY_SECRET && (process.env.SCHEDULING_RECOVERY_SECRET_PREVIOUS?.length ?? 0) >= 32 ? process.env.SCHEDULING_RECOVERY_SECRET_PREVIOUS : undefined;
    const given = Buffer.from(req.headers.get("authorization") ?? "");
    const matches = (candidate: string | undefined) => { const wanted = Buffer.from(`Bearer ${candidate ?? ""}`); return !!candidate && given.length === wanted.length && timingSafeEqual(given, wanted); };
    // Both candidates are always compared, so the time taken does not reveal which one (if any) was close.
    const current = matches(secret), old = matches(previous);
    if (!current && !old) return json({ error: "Unauthorized" }, 401);
    return run(fn, req, ctx);
  };
}
