import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicBody, publicRoute } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";
import { refExchangeEnabled } from "@/app/lib/inquiries/config";
import { signContext } from "@/app/lib/inquiries/context";

export const dynamic = "force-dynamic";

/**
 * POST { ref } -> { prefill: { name, email } | null, context: string | null }. The booking page calls this once, with the reference it read from the
 * URL fragment, to fill in the visitor's own name and e-mail (until the reference is 60 days old) and to get a signed two-hour note of where the visitor
 * came from, which it sends with the booking so the booking can be linked to its inquiry or application. The reference is in the request BODY (never a
 * URL), the answer is never cached, an unknown or malformed reference answers `{ prefill: null, context: null }`, the reference is never logged, and the
 * endpoint is rate limited.
 * Answers 404 until PROGRAM_INQUIRY_STORE_ENABLED is on.
 */
export const POST = publicRoute(async (req) => {
  if (!refExchangeEnabled()) return json({ error: "Not found" }, 404);
  const body = await publicBody(req, 1024);
  const svc = getScheduling();
  const [prefill, origin] = await Promise.all([svc.prefillFor(body.ref), svc.originFor(body.ref)]);
  return json({ prefill, context: origin ? signContext(origin) : null });
}, { rate: RATES.bookingContext });
