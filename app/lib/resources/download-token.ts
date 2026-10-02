import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = "d1";
/** "Durable": the link in the member's email keeps working for a year. Asking again issues a fresh one. */
const DEFAULT_TTL_DAYS = 365;

function secret() {
  const value = process.env.NAPKIN_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Download signing is not configured.");
  return value;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/**
 * Signed, expiring download token. It is scoped to ONE request AND ONE resource (both are in the signed payload),
 * and its `d1` prefix is signed too, so a confirmation (`c1`) or unsubscribe (`v1`) token can never be used here.
 * It only ever travels to a confirmed member (in their email and in the response to the confirmation POST).
 */
export function createDownloadToken(requestId: string, resourceId: string, now = Date.now(), ttlDays = DEFAULT_TTL_DAYS): string {
  const expires = Math.floor(now / 1000) + ttlDays * 86_400;
  const payload = `${VERSION}.${requestId}.${resourceId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export type DownloadTokenCheck = { ok: true; requestId: string; resourceId: string } | { ok: false; reason: "invalid" | "expired" };

export function verifyDownloadToken(token: string, now = Date.now()): DownloadTokenCheck {
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== VERSION || !parts[1] || !parts[2] || !parts[3] || !parts[4]) return { ok: false, reason: "invalid" };
  const payload = parts.slice(0, 4).join(".");
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(parts[4]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return { ok: false, reason: "invalid" };
  const expires = Number(parts[3]);
  if (!Number.isFinite(expires) || expires * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, requestId: parts[1], resourceId: parts[2] };
}

export const isSignedDownloadToken = (token: string) => token.startsWith(`${VERSION}.`);
