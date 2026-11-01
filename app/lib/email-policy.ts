import { deploymentEnv, isProductionDeployment } from "./deployment";

/**
 * Outbound email policy.
 *  - production: unrestricted (unchanged).
 *  - every other environment (preview, development): email is OFF by default.
 *    It turns on only when PREVIEW_EMAIL_ENABLED=true AND PREVIEW_EMAIL_ALLOWLIST is
 *    set AND every allowlist entry is the authorised admin address (ADMIN_EMAIL).
 *    Anything else is a misconfiguration and keeps email disabled. A message is
 *    delivered only if every recipient is on the allowlist.
 */
type Env = Record<string, string | undefined>;

export type EmailDecision = { allowed: true } | { allowed: false; reason: string };

/** "Name <a@b.com>" -> "a@b.com", lower-cased. */
export function bareAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

export function previewAllowlist(env: Env = process.env): { ok: true; list: string[] } | { ok: false; reason: string } {
  if (env.PREVIEW_EMAIL_ENABLED !== "true") {
    return { ok: false, reason: "Email delivery is disabled in this non-production environment (PREVIEW_EMAIL_ENABLED is not true)." };
  }
  const list = (env.PREVIEW_EMAIL_ALLOWLIST ?? "").split(",").map(bareAddress).filter(Boolean);
  if (list.length === 0) return { ok: false, reason: "Email delivery is disabled: PREVIEW_EMAIL_ALLOWLIST is empty." };
  const admin = env.ADMIN_EMAIL ? bareAddress(env.ADMIN_EMAIL) : "";
  if (!admin || list.some((address) => address !== admin)) {
    return { ok: false, reason: "Email delivery is disabled: PREVIEW_EMAIL_ALLOWLIST may contain only the authorised admin address (ADMIN_EMAIL)." };
  }
  return { ok: true, list };
}

/**
 * THE ONE EXCEPTION to "non-production sends only to ADMIN_EMAIL", for MBA Scheduling's booking emails during local development.
 * It exists so the three transactional messages (confirmation, reschedule, cancellation) can be checked in a real mail client, and nothing else.
 *   - The recipient is this constant, in code: it cannot be repointed from the environment, so changing it is a reviewed code change.
 *   - It applies only to a caller that declares the purpose "scheduling-transactional" (see createResend); every other caller, including
 *     the Transition and resource flows, is evaluated by the unchanged rules above and never sees the exception.
 *   - It never widens anything in production (production is unrestricted before this is reached) and is not even considered there.
 */
export const SCHEDULING_TEST_RECIPIENT = "martindubreuil13@gmail.com";
export type EmailPurpose = "scheduling-transactional";

/**
 * Is the scheduling test mode on? ALL of these must hold, or it is off:
 *   - the explicit opt-in SCHEDULING_EMAIL_TEST_MODE=true (put it in .env.development.local or the shell, never in a shared or hosted environment),
 *   - the process is a local `next dev` server (NODE_ENV=development; a build, `next start` and tests are not),
 *   - it is not running on Vercel at all (no VERCEL / VERCEL_ENV, whatever their values),
 *   - the deployment is classified "development" (never production, never preview).
 * Production cannot activate it: the flag is ignored there.
 */
export function schedulingTestModeActive(env: Env = process.env): boolean {
  if (env.SCHEDULING_EMAIL_TEST_MODE !== "true") return false;
  if (env.VERCEL || env.VERCEL_ENV) return false;
  if (env.NODE_ENV !== "development") return false;
  return deploymentEnv(env) === "development";
}

export function evaluateEmailPolicy(recipients: string[], env: Env = process.env, purpose?: EmailPurpose): EmailDecision {
  if (isProductionDeployment(env)) return { allowed: true };
  const standard = evaluateStandard(recipients, env);
  if (standard.allowed) return standard;
  // The single scheduling exception: one recipient in total (no cc / bcc), exactly the test address, for scheduling's own purpose only.
  if (purpose === "scheduling-transactional" && schedulingTestModeActive(env) && recipients.length === 1 && bareAddress(recipients[0]) === SCHEDULING_TEST_RECIPIENT) return { allowed: true };
  return standard;
}

function evaluateStandard(recipients: string[], env: Env): EmailDecision {
  const allowlist = previewAllowlist(env);
  if (!allowlist.ok) return { allowed: false, reason: allowlist.reason };
  const blocked = recipients.map(bareAddress).filter((address) => !allowlist.list.includes(address));
  if (recipients.length === 0 || blocked.length > 0) {
    return { allowed: false, reason: "Email blocked: the recipient is not on this environment's allowlist." };
  }
  return { allowed: true };
}
