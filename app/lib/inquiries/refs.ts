import { REF_PREFILL_DAYS } from "./config";

/** The shape of every booking reference (also what the generator produces: 18 random bytes, base64url). Anything else is not looked up. */
export const REF_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export const isRefShaped = (ref: unknown): ref is string => typeof ref === "string" && REF_PATTERN.test(ref);

/** True once `issuedAt` (an ISO timestamp or ms) is more than REF_PREFILL_DAYS ago, or cannot be read: unreadable counts as expired. */
export function prefillExpired(issuedAt: string | number | null | undefined, now: number = Date.now()): boolean {
  const t = typeof issuedAt === "number" ? issuedAt : Date.parse(String(issuedAt ?? ""));
  return !Number.isFinite(t) || now - t > REF_PREFILL_DAYS * 86_400_000;
}
