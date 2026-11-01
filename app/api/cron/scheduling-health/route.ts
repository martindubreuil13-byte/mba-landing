import { getScheduling } from "@/app/lib/scheduling/instance";
import { cronRoute, json } from "@/app/lib/scheduling/http";
import { recoveryHealth } from "@/app/lib/scheduling/recovery-health";
export const dynamic = "force-dynamic";
/** Read-only, credential-protected monitor. An existing monitor/operator can page on HTTP 503; this endpoint never sends email. */
export const GET = cronRoute(async () => {
  const repo = getScheduling().repo;
  const [bookings, pulse] = await Promise.all([repo.listBookings(), repo.getLastSweep()]);
  const result = recoveryHealth(bookings, pulse, Date.now());
  return json(result, result.ok ? 200 : 503);
});
