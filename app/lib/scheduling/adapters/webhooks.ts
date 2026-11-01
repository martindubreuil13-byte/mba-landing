import { createHmac, timingSafeEqual } from "node:crypto";

/** Signature checks for inbound webhooks. Pure functions: no I/O, constant-time comparisons, bounded clock skew. */

const safeEqual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const TOLERANCE_SECONDS = 5 * 60;

/**
 * Zoom: header `x-zm-signature: v0=<hex>` is HMAC-SHA256(secret token, "v0:<x-zm-request-timestamp>:<raw body>").
 * A stale timestamp is refused (replay protection).
 */
export function verifyZoomSignature(p: { secret: string; timestamp: string | null; signature: string | null; rawBody: string; nowSeconds?: number }): boolean {
  if (!p.secret || !p.timestamp || !p.signature) return false;
  const ts = Number(p.timestamp);
  const now = p.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > TOLERANCE_SECONDS) return false;
  const expected = `v0=${createHmac("sha256", p.secret).update(`v0:${p.timestamp}:${p.rawBody}`).digest("hex")}`;
  return safeEqual(expected, p.signature);
}

/** Zoom's endpoint validation challenge: answer with the plain token and its HMAC. Only after the request itself passed verification. */
export function zoomChallengeResponse(secret: string, plainToken: string) {
  return { plainToken, encryptedToken: createHmac("sha256", secret).update(plainToken).digest("hex") };
}

/** Google push notifications carry the shared token we chose when creating the channel, in `X-Goog-Channel-Token`. */
export function verifyGoogleChannelToken(expected: string | undefined, header: string | null): boolean {
  return !!expected && !!header && safeEqual(expected, header);
}
