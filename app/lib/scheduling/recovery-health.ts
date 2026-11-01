import type { Booking, SweepSummary } from "./types";
/** Aggregate-only monitoring; never returns guest details, references, provider IDs or secrets. */
export function recoveryHealth(bookings: Booking[], pulse: { at: string; summary: SweepSummary } | null, now: number) {
  const fresh = (at: string | null | undefined, age: number) => !!at && Date.parse(at) <= now && now - Date.parse(at) <= age;
  const checks = { heartbeat: fresh(pulse?.at, 300_000), zoomScan: fresh(pulse?.summary.zoomScanAt, 360_000), calendarScan: fresh(pulse?.summary.conflictScanAt, 960_000) };
  const attention = {
    failed: bookings.filter(b => b.sync?.status === "failed").length,
    overdue: bookings.filter(b => b.sync?.status === "pending" && now - Date.parse(b.sync.nextAttemptAt ?? b.createdAt) > 300_000).length,
    approachingWithoutLink: bookings.filter(b => b.status === "confirmed" && Date.parse(b.startUtc) >= now && Date.parse(b.startUtc) < now + 86400_000 && !b.zoom.joinUrl).length,
    canceledCleanup: bookings.filter(b => b.status === "canceled" && b.sync?.status !== "ok").length,
  };
  return { ok: Object.values(checks).every(Boolean) && Object.values(attention).every(v => v === 0), checks, attention };
}
