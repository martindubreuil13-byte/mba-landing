import { appBaseUrl } from "@/app/lib/resources/base-url";
import { notFound } from "next/navigation";
import { deploymentEnv } from "@/app/lib/deployment";
import { schedulingPrototypeEnabled } from "./prototype";
type Env = Record<string, string | undefined>;

/** Production operations and new intake are separate switches; hosted previews always fail closed. */
export function schedulingOperationsEnabled(env: Env = process.env): boolean {
  if (deploymentEnv(env) === "production") return env.SCHEDULING_OPERATIONS_ENABLED === "true";
  if (env.VERCEL || env.VERCEL_ENV || deploymentEnv(env) !== "development") return false;
  return schedulingPrototypeEnabled(env);
}
export function schedulingIntakeEnabled(env: Env = process.env): boolean {
  if (!schedulingOperationsEnabled(env)) return false;
  return deploymentEnv(env) !== "production" || env.SCHEDULING_PUBLIC_INTAKE_ENABLED === "true";
}
export function requireSchedulingOperations() { if (!schedulingOperationsEnabled()) notFound(); }
export function requireSchedulingIntake() { if (!schedulingIntakeEnabled()) notFound(); }

/** Called before constructing any repository/provider: production can never silently use mock or test collaborators. */
export function assertSchedulingRuntime(env: Env = process.env) {
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production" || deploymentEnv(env) === "preview") throw new Error("Scheduling integrations are unavailable in hosted previews.");
  if (deploymentEnv(env) !== "production") return;
  if (!schedulingOperationsEnabled(env)) throw new Error("Scheduling operations are disabled.");
  const required: Record<string, string> = { SCHEDULING_BACKEND: "supabase", SCHEDULING_GOOGLE: "live", SCHEDULING_ZOOM: "live", SCHEDULING_EMAIL: "resend" };
  for (const [key, value] of Object.entries(required)) if (env[key] !== value) throw new Error(`Production Scheduling requires ${key}=${value}.`);
  if (env.SCHEDULING_EMAIL_TEST_MODE === "true" || env.SCHEDULING_PROTOTYPE === "true") throw new Error("Development Scheduling flags are forbidden in production.");
  if ((env.SCHEDULING_RECOVERY_SECRET?.length ?? 0) < 32) throw new Error("SCHEDULING_RECOVERY_SECRET must contain at least 32 random characters.");
  if (env.SCHEDULING_GOOGLE_REDIRECT_URI !== `${appBaseUrl({ ...env, APP_BASE_URL: undefined })}/api/admin/scheduling/google/callback`) throw new Error("Production Scheduling requires the canonical HTTPS Google callback.");
  if (env.SCHEDULING_EMAIL_FROM !== "Martin Dubreuil <martin@mindrasolutions.com>" || env.SCHEDULING_EMAIL_REPLY_TO !== "martin@mindrasolutions.com") throw new Error("Production Scheduling sender and reply-to must be explicitly configured to the approved addresses.");
  if (env.SCHEDULING_GOOGLE_INVITE_GUEST === "true") throw new Error("Google invitation email must remain disabled; Scheduling sends its own notifications.");
}
