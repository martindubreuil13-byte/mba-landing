import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicBody, publicRoute, str } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";
import { getClientIp } from "@/app/lib/rateLimit";

export const dynamic = "force-dynamic";

const ACTIONS = ["shown", "declined", "joined", "dismissed"] as const;

/** POST { reference, action }. Phase 1 only records the answer in the prototype store; nothing is subscribed anywhere. */
export const POST = publicRoute(async (req) => {
  const b = await publicBody(req, 1024);
  const action = ACTIONS.find((a) => a === b.action);
  if (!action) return json({ error: "Unknown action." }, 400);
  // Where the visitor is decides how the site's consent policy treats a "yes" (see adapters/leads-consent.ts). The address and browser are only ever stored as keyed hashes.
  const visitor = { ip: getClientIp(req), userAgent: req.headers.get("user-agent"), country: req.headers.get("x-vercel-ip-country"), region: req.headers.get("x-vercel-ip-country-region") };
  const { state, consent } = await getScheduling().answerCommunity(str(b.reference, 80), action, visitor);
  // `consent` says what a "yes" did, so the page can tell the visitor the truth (active, or waiting for them to verify their address).
  return json({ community: state, ...(consent ? { consent } : {}) });
}, { rate: RATES.community });
