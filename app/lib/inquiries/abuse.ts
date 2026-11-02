import "server-only";
import { createHmac } from "node:crypto";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { INQUIRY_LIMITS } from "./config";
import { trustedClientIp } from "./client-ip";
import { secretFor } from "./form-token";

/**
 * Inquiry-endpoint limits, on the site's shared cross-instance limiter. The limiter FAILS OPEN when its own database is unavailable (a limiter
 * outage must not stop real visitors), but an inquiry still cannot be accepted without being stored, so that never weakens the persistence rule.
 *
 * Keys are keyed hashes of the client address and of the e-mail address, never the values themselves, and carry the "inq:" prefix so inquiry
 * traffic can neither use up nor be starved by the booking endpoints' budgets.
 */
const keyFor = (kind: string, value: string) => `inq:${kind}:${createHmac("sha256", secretFor("limit")).update(value).digest("hex").slice(0, 32)}`;

async function within(key: string, windowSeconds: number, limit: number): Promise<boolean> {
  try { return await checkRateLimit(key, windowSeconds, limit); }
  catch (e) { console.error("inquiry limiter unavailable, allowing the request:", e instanceof Error ? e.message : e); return true; }
}

/** 5 submissions per hour per client. With no trustworthy address the check is skipped (never one shared bucket). */
export async function clientWithinLimit(req: Request): Promise<boolean> {
  const ip = trustedClientIp(req);
  if (!ip) { console.warn("INQUIRY LIMIT: no trusted client address on this request; per-client limit skipped"); return true; }
  return within(keyFor("client", ip), INQUIRY_LIMITS.client.windowSeconds, INQUIRY_LIMITS.client.limit);
}

/** 3 NEW inquiries per day per address (protects third parties from auto-reply spam). Callers count only requests that would create a row. */
export const emailWithinLimit = (email: string) => within(keyFor("email", email.trim().toLowerCase()), INQUIRY_LIMITS.email.windowSeconds, INQUIRY_LIMITS.email.limit);

/** The global figure is a monitoring signal only: crossing it logs one line per request and never refuses anyone. */
export async function noteGlobalVolume(): Promise<void> {
  const ok = await within("inq:all", INQUIRY_LIMITS.globalSoft.windowSeconds, INQUIRY_LIMITS.globalSoft.limit);
  if (!ok) console.warn(`INQUIRY VOLUME: more than ${INQUIRY_LIMITS.globalSoft.limit} submissions in the last hour (monitoring threshold only; requests are not refused)`);
}
