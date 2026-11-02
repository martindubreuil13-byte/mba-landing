import "server-only";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

/**
 * Per-client request limits for the public scheduling API, on the site's existing cross-instance limiter (one atomic Postgres upsert).
 * Like the rest of the site it fails OPEN if the limiter itself is unavailable: a transient database problem must not stop legitimate
 * visitors from booking. The booking itself stays protected by idempotency and the database's overlap constraint either way.
 */
export type RateRule = { name: string; windowSeconds: number; limit: number };

export async function allowRequest(req: Request, rule: RateRule): Promise<boolean> {
  try { return await checkRateLimit(`sched:${rule.name}:${getClientIp(req)}`, rule.windowSeconds, rule.limit); }
  catch (e) { console.error("scheduling rate limiter unavailable, allowing the request:", e instanceof Error ? e.message : e); return true; }
}

/** One limit shared by every visitor (protects provider quotas and the owner's inbox from a spread-out flood). Fails open like the per-client limit. */
export async function allowGlobal(rule: RateRule): Promise<boolean> {
  try { return await checkRateLimit(`sched:${rule.name}:all`, rule.windowSeconds, rule.limit); }
  catch (e) { console.error("scheduling rate limiter unavailable, allowing the request:", e instanceof Error ? e.message : e); return true; }
}

/** The answer of the booking budget (see adapters/booking-budget.ts). */
export type Admission = "ok" | "limited" | "unavailable";

/** Sensible defaults per endpoint. A booking is rare; reading availability is frequent. */
export const RATES = {
  book: { name: "book", windowSeconds: 3600, limit: 10 },
  slots: { name: "slots", windowSeconds: 60, limit: 40 },
  /** Every visitor together: each uncached availability read is a live Google Calendar query. */
  slotsAll: { name: "slots-all", windowSeconds: 60, limit: 300 },
  /** Booking attempts that got past validation, per recipient address and across everyone, per hour (mail goes to an address nobody has verified). */
  bookEmail: { name: "book-email", windowSeconds: 3600, limit: 5 },
  bookAll: { name: "book-all", windowSeconds: 3600, limit: 30 },
  community: { name: "community", windowSeconds: 3600, limit: 30 },
  /** Exchanging a booking reference for the visitor's own details: once per page load, so this is generous for a person and useless for guessing. */
  bookingContext: { name: "booking-context", windowSeconds: 600, limit: 30 },
  /** The confirmation page polls every few seconds while its Zoom link is being prepared. */
  status: { name: "status", windowSeconds: 60, limit: 60 },
} as const satisfies Record<string, RateRule>;
