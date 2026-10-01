import { isProductionDeployment } from "./deployment";

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

export function evaluateEmailPolicy(recipients: string[], env: Env = process.env): EmailDecision {
  if (isProductionDeployment(env)) return { allowed: true };
  const allowlist = previewAllowlist(env);
  if (!allowlist.ok) return { allowed: false, reason: allowlist.reason };
  const blocked = recipients.map(bareAddress).filter((address) => !allowlist.list.includes(address));
  if (recipients.length === 0 || blocked.length > 0) {
    return { allowed: false, reason: "Email blocked: the recipient is not on this environment's allowlist." };
  }
  return { allowed: true };
}
