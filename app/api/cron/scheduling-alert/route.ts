import { getScheduling } from "@/app/lib/scheduling/instance";
import { cronRoute, json } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Unattended alerting: evaluates the scheduling health and emails the owner's approved address when it changes (once per change, a reminder every six
 * hours while it lasts, and once on recovery). Authenticated like the other recovery routes (the dedicated bearer). The answer carries counts only.
 */
export const GET = cronRoute(async () => {
  const { findings, sent, unavailable } = await getScheduling().checkAlerts();
  return json({ ok: true, findings, sent, ...(unavailable ? { unavailable } : {}) });
});
