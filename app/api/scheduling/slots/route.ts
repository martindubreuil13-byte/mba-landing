import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, publicRoute } from "@/app/lib/scheduling/http";
import { RATES } from "@/app/lib/scheduling/rate-limit";

export const dynamic = "force-dynamic";

/** GET ?type=<slug>&invite=&from=<iso>&to=<iso> -> { slots: [{ startUtc, endUtc }] }. Start times only: no internal scheduling data. */
export const GET = publicRoute(async (req) => {
  const q = new URL(req.url).searchParams;
  // Bounded inputs: nothing longer than a slug, an invitation code or an ISO timestamp is ever looked up.
  const [type, invite, from, to] = [q.get("type") ?? "", q.get("invite") ?? undefined, q.get("from") ?? "", q.get("to") ?? ""];
  if (type.length > 80 || (invite?.length ?? 0) > 80 || from.length > 40 || to.length > 40) return json({ error: "Invalid request.", code: "invalid_input" }, 400);
  const slots = await getScheduling().publicSlots(type, invite, from, to);
  return json({ slots });
}, { rate: RATES.slots, globalRate: RATES.slotsAll, adminPreview: true });
