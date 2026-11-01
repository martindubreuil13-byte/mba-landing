import type { Booking, SweepSummary } from "./types";
/** Aggregate-only monitoring; never returns guest details, references, provider IDs or secrets. */
export function recoveryHealth(bookings: Booking[], pulse: { at: string; summary: SweepSummary } | null, now: number) {
  const fresh = (at: string | null | undefined, age: number) => !!at && Date.parse(at) <= now && now - Date.parse(at) <= age;
  // The worker runs every minute. The scans run at the first sweep AFTER their interval, so their real period is a little longer than the interval (the Zoom scan about
  // six minutes, the calendar scan about fifteen). A scan is "overdue" only after two full periods: with a tighter limit the age sometimes lands just over it by pure timing
  // (a monitor that fires in the same minute as the scan), which raised a false alarm.
  const checks = { heartbeat: fresh(pulse?.at, 300_000), zoomScan: fresh(pulse?.summary.zoomScanAt, 720_000), calendarScan: fresh(pulse?.summary.conflictScanAt, 1_860_000) };
  const attention = {
    failed: bookings.filter(b => b.sync?.status === "failed").length,
    overdue: bookings.filter(b => b.sync?.status === "pending" && now - Date.parse(b.sync.nextAttemptAt ?? b.createdAt) > 300_000).length,
    approachingWithoutLink: bookings.filter(b => b.status === "confirmed" && Date.parse(b.startUtc) >= now && Date.parse(b.startUtc) < now + 86400_000 && !b.zoom.joinUrl).length,
    canceledCleanup: bookings.filter(b => b.status === "canceled" && b.sync?.status !== "ok").length,
  };
  return { ok: Object.values(checks).every(Boolean) && Object.values(attention).every(v => v === 0), checks, attention };
}
