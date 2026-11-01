import "server-only";
import { deploymentEnv } from "@/app/lib/deployment";
import { timingSafeEqual } from "node:crypto";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { schedulingOperationsEnabled, schedulingIntakeEnabled } from "./release-gates";
import { allowRequest, type RateRule } from "./rate-limit";
import { bodyOf, json, isSchedulingError, notFound, run, str, type Handler } from "./http-shared";

export { bodyOf, json, isSchedulingError, str };

/** Public route: new intake defaults off in production; optionally rate limited per client (429 with Retry-After). */
export function publicRoute<C = unknown>(fn: Handler<C>, opts: { rate?: RateRule; intake?: boolean } = {}) {
  return async (req: Request, ctx: C) => {
    if (!(opts.intake === false ? schedulingOperationsEnabled() : schedulingIntakeEnabled())) return notFound();
    if (opts.rate && !(await allowRequest(req, opts.rate))) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again.", code: "rate_limited" }), { status: 429, headers: { "content-type": "application/json", "cache-control": "no-store", "retry-after": String(Math.min(opts.rate.windowSeconds, 60)) } });
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

/** Scheduled job: same on/off switch plus the dedicated Scheduling recovery bearer check (constant time). Without a scoped secret it refuses every production call. */
export function cronRoute<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    if (!schedulingOperationsEnabled()) return notFound();
    const secret = process.env.SCHEDULING_RECOVERY_SECRET || (!(process.env.VERCEL || process.env.VERCEL_ENV) && deploymentEnv() === "development" ? process.env.CRON_SECRET : undefined);
    const given = Buffer.from(req.headers.get("authorization") ?? "");
    const wanted = Buffer.from(`Bearer ${secret ?? ""}`);
    if (!secret || given.length !== wanted.length || !timingSafeEqual(given, wanted)) return json({ error: "Unauthorized" }, 401);
    return run(fn, req, ctx);
  };
}
