import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicRoute } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET the public state of one booking (no email, message or id: only what the confirmation page shows). The reference is the unguessable token
 * from the confirmation URL. The page polls this while its Zoom link is being prepared; a poll also starts the booking's synchronisation if it is
 * due and nobody is running it, so the happy path never depends on a scheduled job.
 */
export const GET = publicRoute<{ params: Promise<{ reference: string }> }>(async (_req, { params }) => {
  const reference = (await params).reference;
  const booking = reference.length > 0 && reference.length <= 64 ? await getScheduling().nudge(reference) : null;
  return booking ? json({ booking }) : json({ error: "Booking not found." }, 404);
}, { rate: RATES.status, intake: false });
