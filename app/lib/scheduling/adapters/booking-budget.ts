import "server-only";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/app/lib/supabase/service";
import { RATES, type Admission, type RateRule } from "../rate-limit";

/**
 * The booking budget: how many booking attempts one recipient address, and everyone together, may make per hour (mail goes to an address nobody has
 * verified, and each booking uses Zoom and Google). On the site's existing cross-instance limiter (one atomic Postgres upsert).
 * It fails CLOSED: if the limiter cannot answer, the booking database it shares is almost certainly unavailable too, and an unmetered flood is the one
 * thing this exists to stop. The recipient is keyed by a hash, so the limiter table never holds an email address.
 */
export async function admitBooking(guestEmail: string): Promise<Admission> {
  const keys: Array<[string, RateRule]> = [
    [`sched:${RATES.bookEmail.name}:${createHash("sha256").update(guestEmail.trim().toLowerCase()).digest("hex").slice(0, 32)}`, RATES.bookEmail],
    [`sched:${RATES.bookAll.name}:all`, RATES.bookAll],
  ];
  try {
    for (const [key, rule] of keys) {
      const { data, error } = await getServiceClient().rpc("rate_limit_check", { p_key: key, p_window_seconds: rule.windowSeconds, p_limit: rule.limit });
      if (error) { console.error("scheduling booking budget unavailable, refusing:", error.message); return "unavailable"; }
      if (data !== true) return "limited";
    }
    return "ok";
  } catch (e) { console.error("scheduling booking budget unavailable, refusing:", e instanceof Error ? e.message : e); return "unavailable"; }
}
