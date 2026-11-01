import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicBody, publicRoute, str } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";
import { SchedulingError } from "@/app/lib/scheduling/service";

export const dynamic = "force-dynamic";
/** The Zoom / Google / email work runs after the response, inside this limit (see service.ts). */
export const maxDuration = 60;

/** POST a booking. The slot is re-checked server-side; a repeated `idempotencyKey` returns the original booking. */
export const POST = publicRoute(async (req) => {
  const b = await publicBody(req);
  // Honeypot: a field real visitors never see or fill. A bot that fills every field gets a plain refusal and nothing is created or sent.
  if (typeof b.contactUrl === "string" && b.contactUrl.trim() !== "") throw new SchedulingError("invalid_input", "We couldn’t complete the booking. Please try again.", 400);
  const { booking, replay } = await getScheduling().createBooking({
    slug: str(b.slug, 80), invite: str(b.invite, 80) || undefined, startUtc: str(b.startUtc, 40), guestName: str(b.name, 200), guestEmail: str(b.email, 250),
    guestMessage: str(b.message, 2000), guestTimeZone: str(b.timeZone, 80), idempotencyKey: str(b.idempotencyKey, 120), source: str(b.source, 80) || null,
  });
  return json({ booking, replay }, replay ? 200 : 201);
}, { rate: RATES.book });
