import { schedulingPrototypeEnabled } from "@/app/lib/scheduling/prototype";
import { getScheduling } from "@/app/lib/scheduling/instance";
import { bodyOf, json, publicRoute, str } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";

export const dynamic = "force-dynamic";

/** Prototype aid: re-arms the community invitation, and ONLY on seeded sample bookings (the service ignores real bookings). */
export const POST = publicRoute(async (req) => {
  if (!schedulingPrototypeEnabled()) return json({ error: "Not found" }, 404);
  await getScheduling().replayCommunity(str((await bodyOf(req)).reference, 80));
  return json({ success: true });
}, { rate: RATES.community });
