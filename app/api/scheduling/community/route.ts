import { getScheduling } from "@/app/lib/scheduling/instance";
import { bodyOf, json, publicRoute, str } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";

export const dynamic = "force-dynamic";

const ACTIONS = ["shown", "declined", "joined", "dismissed"] as const;

/** POST { reference, action }. Phase 1 only records the answer in the prototype store; nothing is subscribed anywhere. */
export const POST = publicRoute(async (req) => {
  const b = await bodyOf(req);
  const action = ACTIONS.find((a) => a === b.action);
  if (!action) return json({ error: "Unknown action." }, 400);
  const community = await getScheduling().recordCommunity(str(b.reference, 80), action);
  return json({ community });
}, { rate: RATES.community });
