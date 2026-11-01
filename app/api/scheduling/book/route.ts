import { getScheduling } from "@/app/lib/scheduling/instance";
import { bodyOf, json, publicRoute, str } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";

export const dynamic = "force-dynamic";
/** The Zoom / Google / email work runs after the response, inside this limit (see service.ts). */
export const maxDuration = 60;

/** POST a booking. The slot is re-checked server-side; a repeated `idempotencyKey` returns the original booking. */
export const POST = publicRoute(async (req) => {
  const b = await bodyOf(req);
  const { booking, replay } = await getScheduling().createBooking({
    slug: str(b.slug, 80), invite: str(b.invite, 80) || undefined, startUtc: str(b.startUtc, 40), guestName: str(b.name, 200), guestEmail: str(b.email, 250),
    guestMessage: str(b.message, 2000), guestTimeZone: str(b.timeZone, 80), idempotencyKey: str(b.idempotencyKey, 120), source: str(b.source, 80) || null,
  });
  return json({ booking, replay }, replay ? 200 : 201);
}, { rate: RATES.book });
