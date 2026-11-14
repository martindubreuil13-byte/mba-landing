import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isUuid } from "@/app/lib/relationships/model";

function signature(payload: string) {
  const secret = process.env.NAPKIN_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secret ? createHmac("sha256", secret).update("campaign-booking:" + payload).digest("hex") : null;
}

export function signAttribution(id: string) {
  const payload = `${id}.${Date.now() + 7 * 86400_000}`;
  const mac = signature(payload);
  return mac ? `${payload}.${mac}` : null;
}

export function readAttribution(value: string) {
  const [id, expiry, mac, extra] = value.split(".");
  if (!isUuid(id) || !/^\d{13}$/.test(expiry ?? "") || Number(expiry) <= Date.now() || extra !== undefined) return null;
  const expected = signature(`${id}.${expiry}`);
  if (!expected || !/^[a-f0-9]{64}$/.test(mac ?? "")) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(mac)) ? id : null;
}
