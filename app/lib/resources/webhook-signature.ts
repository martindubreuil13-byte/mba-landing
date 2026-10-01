import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;

/**
 * Verifies a Resend (Svix) webhook signature.
 * Signed content is `${svix-id}.${svix-timestamp}.${rawBody}`, HMAC-SHA256 with
 * the base64-decoded part of the `whsec_…` secret. The header may carry several
 * space-separated `v1,<base64>` signatures.
 */
export function verifyResendWebhook(params: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  rawBody: string;
  now?: number;
}): boolean {
  const { secret, id, timestamp, signatureHeader, rawBody } = params;
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  const now = params.now ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();

  return signatureHeader.split(" ").some((part) => {
    const [version, signature] = part.split(",");
    if (version !== "v1" || !signature) return false;
    const supplied = Buffer.from(signature, "base64");
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}
