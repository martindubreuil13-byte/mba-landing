import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicRoute } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";

export const dynamic = "force-dynamic";

/** GET ?type=<slug>&invite=&from=<iso>&to=<iso> -> { slots: [{ startUtc, endUtc }] }. Start times only: no internal scheduling data. */
export const GET = publicRoute(async (req) => {
  const q = new URL(req.url).searchParams;
  const slots = await getScheduling().publicSlots(q.get("type") ?? "", q.get("invite") ?? undefined, q.get("from") ?? "", q.get("to") ?? "");
  return json({ slots });
}, { rate: RATES.slots });
