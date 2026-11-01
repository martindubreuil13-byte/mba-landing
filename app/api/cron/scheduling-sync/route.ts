import { getScheduling } from "@/app/lib/scheduling/instance";
import { cronRoute, json } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";

/**
 * The sweep: re-queues anything whose external state disagrees with the record, then brings every booking whose Zoom meeting, Google event or email is behind up to date (see sync.ts). Idempotent and
 * safe to run as often as you like; concurrent runs never act on the same booking twice. Call it with `Authorization: Bearer $CRON_SECRET`.
 * NOT registered in vercel.json: Hobby cron runs at most daily, which is too slow for retries (see the handover for the options).
 */
export const maxDuration = 60;

export const GET = cronRoute(async () => {
  const { summary } = await getScheduling().runMaintenance(1);
  return json({ ok: true, ...summary });
});
