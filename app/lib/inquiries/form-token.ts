import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { FORM_MAX_AGE_MS, FORM_MIN_AGE_MS } from "./config";

/**
 * A signed "this form was opened at T" token. The page fetches one when it opens; /api/qualify refuses a submission whose token is missing,
 * forged, younger than two seconds (a script) or older than a day (a replay). It carries no personal data and nothing is stored.
 *
 * The signing key is derived from a server secret with a label of its own, so no other signed token of the site can stand in for it.
 */
const VERSION = "ft1";

export function secretFor(label: string, env: NodeJS.ProcessEnv = process.env): Buffer {
  const base = env.INQUIRY_FORM_SECRET || env.NAPKIN_UNSUBSCRIBE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Inquiry signing is not configured.");
  return createHmac("sha256", base).update(`mba-inquiry:${label}`).digest();
}

const sign = (payload: string) => createHmac("sha256", secretFor("form")).update(payload).digest("base64url");

export function issueFormToken(now: number = Date.now()): string {
  const payload = `${VERSION}.${Math.floor(now / 1000)}`;
  return `${payload}.${sign(payload)}`;
}

export type FormTokenCheck = { ok: true } | { ok: false; reason: "invalid" | "too_fast" | "expired" };

export function verifyFormToken(token: unknown, now: number = Date.now()): FormTokenCheck {
  if (typeof token !== "string" || token.length > 120) return { ok: false, reason: "invalid" };
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION || !/^\d{1,12}$/.test(parts[1])) return { ok: false, reason: "invalid" };
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" };
  const age = now - Number(parts[1]) * 1000;
  if (age < FORM_MIN_AGE_MS) return { ok: false, reason: "too_fast" };
  if (age > FORM_MAX_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}
