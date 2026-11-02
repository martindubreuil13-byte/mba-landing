import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicBody, publicRoute } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";
import { refExchangeEnabled } from "@/app/lib/inquiries/config";

export const dynamic = "force-dynamic";

/**
 * POST { ref } -> { prefill: { name, email } | null }. The booking page calls this once, with the reference it read from the URL fragment, to fill in
 * the visitor's own name and e-mail. The reference is in the request BODY (never a URL or query string), the answer is never cached, an unknown,
 * malformed or expired reference all answer the same `{ prefill: null }`, the reference is never logged, and the endpoint is rate limited.
 * Answers 404 until BOOKING_REF_EXCHANGE_ENABLED is on.
 */
export const POST = publicRoute(async (req) => {
  if (!refExchangeEnabled()) return json({ error: "Not found" }, 404);
  const body = await publicBody(req, 1024);
  return json({ prefill: await getScheduling().prefillFor(body.ref) });
}, { rate: RATES.bookingContext });
