import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = "c1";
const DEFAULT_TTL_DAYS = 30;

function secret() {
  const value = process.env.NAPKIN_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Confirmation signing is not configured.");
  return value;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/**
 * Signed, expiring token for the "confirm your email" link. The `c1` prefix is
 * part of the signed payload, so an unsubscribe token (`v1`) can never be used
 * to confirm, or the other way round.
 */
export function createConfirmationToken(leadId: string, now = Date.now(), ttlDays = DEFAULT_TTL_DAYS): string {
  const expires = Math.floor(now / 1000) + ttlDays * 86_400;
  const payload = `${VERSION}.${leadId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export type TokenCheck = { ok: true; leadId: string } | { ok: false; reason: "invalid" | "expired" };

export function verifyConfirmationToken(token: string, now = Date.now()): TokenCheck {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION || !parts[1] || !parts[2] || !parts[3]) return { ok: false, reason: "invalid" };

  const payload = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(parts[3]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return { ok: false, reason: "invalid" };

  const expires = Number(parts[2]);
  if (!Number.isFinite(expires) || expires * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, leadId: parts[1] };
}
