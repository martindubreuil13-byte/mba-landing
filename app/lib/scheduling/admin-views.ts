import type { Booking, MeetingType, SchedulingData } from "./types";
import { OWNER_RETRY_NOTE } from "./constants";
import { ZOOM_MARKER_PREFIX } from "./providers";

/** Serializable shapes handed from admin server pages to client components. */
export type BookingRow = {
  id: string; reference: string; guestName: string; guestEmail: string; guestMessage: string; guestTimeZone: string;
  typeId: string; typeName: string; typeLink: string; startUtc: string; endUtc: string; status: Booking["status"]; rescheduled: boolean;
  source: string | null; zoom: Booking["zoom"]; community: string; events: Booking["events"]; durationMinutes: number;
  sync: NonNullable<Booking["sync"]>;
  /** The text Zoom shows in the meeting's agenda when it is this booking's (what an administrator searches for when a create has an unknown outcome). */
  zoomMarker: string;
  /** What the background synchronisation is doing, in words the administrator can act on. */
  recovery: Recovery;
  /** An external calendar event overlaps this booking (flagged by the sync; the booking stands). */
  conflict: boolean;
};

/**
 * ok: fully synchronised. syncing: saved, the first attempt is under way. retrying: an attempt failed, the next is scheduled.
 * stuck: due for a long time and nobody has picked it up (the recovery worker is not running). failed: gave up, needs a person.
 */
export type Recovery = { state: "ok" | "syncing" | "retrying" | "stuck" | "failed"; label: string };
const STUCK_AFTER_MS = 5 * 60_000;

export function recoveryOf(b: Pick<Booking, "sync" | "createdAt">, now: number): Recovery {
  const s = b.sync ?? { status: "ok" as const, attempts: 0, nextAttemptAt: null, lastError: null };
  if (s.status === "ok") return { state: "ok", label: "Up to date" };
  if (s.status === "failed") return { state: "failed", label: "Needs attention · gave up" };
  // Only the host's own notification is waiting for a retry: the booking itself is fully synchronised, so it is not "syncing" and needs no attention.
  if (s.attempts === 0 && s.lastError === OWNER_RETRY_NOTE) return { state: "ok", label: "Up to date · host notification will be retried" };
  if (s.attempts > 0) return { state: "retrying", label: `Retrying · attempt ${s.attempts}` };
  const since = Date.parse(s.nextAttemptAt ?? b.createdAt);
  return now - since > STUCK_AFTER_MS ? { state: "stuck", label: "Waiting for the recovery worker" } : { state: "syncing", label: "Syncing…" };
}

/** Rows an administrator should look at: a failed, repeatedly failing or stuck synchronisation (also for canceled bookings: an external object may remain), or a conflict. */
export const needsAttention = (r: Pick<BookingRow, "status" | "recovery" | "conflict">) =>
  r.recovery.state === "failed" || r.recovery.state === "retrying" || r.recovery.state === "stuck" || (r.status === "confirmed" && r.conflict);

/** Is the recovery worker alive? `never`: no sweep recorded yet. `stale`: the last sweep is older than five minutes. */
export function workerState(lastSweepAt: string | null, now: number): { state: "ok" | "stale" | "never"; ageSeconds: number | null } {
  if (!lastSweepAt) return { state: "never", ageSeconds: null };
  const age = Math.max(0, Math.round((now - Date.parse(lastSweepAt)) / 1000));
  return { state: age > 300 ? "stale" : "ok", ageSeconds: age };
}

/** Path (no origin) of a meeting type's public page, with the invitation code when it needs one. */
export const typeLinkPath = (t: Pick<MeetingType, "slug" | "visibility" | "inviteCode">) => `/book/${t.slug}${t.visibility === "invitation" && t.inviteCode ? `?invite=${encodeURIComponent(t.inviteCode)}` : ""}`;

export function bookingRows(d: SchedulingData, now: number = Date.now()): BookingRow[] {
  return d.bookings.flatMap((b) => {
    const t = d.meetingTypes.find((m) => m.id === b.meetingTypeId);
    if (!t) return [];
    return [{
      id: b.id, reference: b.reference, guestName: b.guestName, guestEmail: b.guestEmail, guestMessage: b.guestMessage, guestTimeZone: b.guestTimeZone,
      typeId: t.id, typeName: t.name, typeLink: typeLinkPath(t), startUtc: b.startUtc, endUtc: b.endUtc, status: b.status, rescheduled: b.events.some((e) => e.kind === "rescheduled"),
      source: b.source, zoom: b.zoom, community: b.community.state, events: b.events, durationMinutes: t.durationMinutes,
      sync: b.sync ?? { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, zoomMarker: `${ZOOM_MARKER_PREFIX}${b.id}`,
      recovery: recoveryOf(b, now), conflict: b.events.some((e) => e.kind === "calendar_conflict"),
    }];
  }).sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc));
}
