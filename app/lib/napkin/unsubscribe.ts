import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";

function secret() {
  const value = process.env.NAPKIN_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Unsubscribe signing is not configured.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createUnsubscribeToken(leadId: string, newsletter = false, campaignId?: string): string {
  const payload = campaignId ? `v3.${leadId}.${campaignId}` : `${newsletter ? "v2" : TOKEN_VERSION}.${leadId}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length === 4 && parts[0] === "v3") {
    const payload = parts.slice(0, 3).join(".");
    const expected = Buffer.from(signature(payload));
    const supplied = Buffer.from(parts[3]);
    return expected.length === supplied.length && timingSafeEqual(expected, supplied) ? parts[1] : null;
  }
  if (parts.length !== 3 || (parts[0] !== TOKEN_VERSION && parts[0] !== "v2") || !parts[1] || !parts[2]) return null;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(parts[2]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  return parts[1];
}
