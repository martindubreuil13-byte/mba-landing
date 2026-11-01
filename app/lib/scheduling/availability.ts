import type { Availability, BusyInterval, MeetingType, Slot, TimeWindow } from "./types";
import { addDays, isValidDate, isValidTime, localDate, localToInstant, minutesOfDay, weekdayOf } from "./timezone";

/**
 * The availability engine: a pure function from (rules, clock, busy intervals) to bookable slots. No I/O, so it is
 * deterministic and testable, and the real Google Calendar adapter later only has to supply `busy`.
 *
 * Rules are wall-clock times in the administrator's home zone. Each working window is converted to real instants
 * date by date, so a window that crosses a daylight-saving change keeps its true length and a 09:00 meeting stays
 * at 09:00 local all year while its UTC time moves.
 */

const MINUTE = 60_000;
const HOUR = 3_600_000;

type Span = { start: number; end: number };

export function windowsFor(a: Availability, date: string): TimeWindow[] {
  if (a.daysOff.includes(date)) return [];
  const override = a.overrides[date];
  if (override) return override;
  return a.weekly[String(weekdayOf(date))] ?? [];
}

/** Working spans of one home-zone date as instants, with recurring breaks carved out. */
export function workingSpans(a: Availability, date: string, homeTimeZone: string): Span[] {
  const toSpan = (w: TimeWindow): Span => ({ start: localToInstant(date, w.start, homeTimeZone), end: localToInstant(date, w.end, homeTimeZone) });
  let spans = windowsFor(a, date).map(toSpan).filter((s) => s.end > s.start);
  for (const gap of a.breaks.map(toSpan).filter((s) => s.end > s.start)) {
    spans = spans.flatMap((s) => {
      if (gap.end <= s.start || gap.start >= s.end) return [s];
      const out: Span[] = [];
      if (gap.start > s.start) out.push({ start: s.start, end: gap.start });
      if (gap.end < s.end) out.push({ start: gap.end, end: s.end });
      return out;
    });
  }
  return spans.sort((x, y) => x.start - y.start);
}

/** A candidate conflicts with an existing event unless there is room for BOTH events' own buffers between them. */
function clashes(startMs: number, endMs: number, before: number, after: number, busy: BusyInterval[]): boolean {
  return busy.some((b) => !(startMs >= b.end + b.after + before || endMs + after + b.before <= b.start));
}

export type SlotQuery = {
  type: MeetingType;
  homeTimeZone: string;
  /** Instants, [from, to). */
  from: number;
  to: number;
  now: number;
  busy: BusyInterval[];
  /** Confirmed bookings of this meeting type, for the per-day cap. */
  sameTypeStarts: number[];
};

export function computeSlots(q: SlotQuery): Slot[] {
  const { type, homeTimeZone: tz, now } = q;
  const a = type.availability;
  const duration = type.durationMinutes * MINUTE;
  const step = Math.max(5, type.slotIntervalMinutes) * MINUTE;
  const before = type.bufferBeforeMinutes * MINUTE;
  const after = type.bufferAfterMinutes * MINUTE;
  const earliest = now + type.minNoticeHours * HOUR;
  const today = localDate(now, tz);
  const lastDate = addDays(today, Math.max(0, a.bookingWindowDays - 1));

  const perDay = new Map<string, number>();
  for (const s of q.sameTypeStarts) { const d = localDate(s, tz); perDay.set(d, (perDay.get(d) ?? 0) + 1); }

  const out: Slot[] = [];
  // One day of slack each side: a late-evening home-zone window can fall on a different date than the visitor's.
  const first = addDays(localDate(q.from, tz), -1);
  const last = addDays(localDate(q.to, tz), 1);
  for (let date = first; date <= last; date = addDays(date, 1)) {
    if (date > lastDate) break;
    if (type.maxPerDay !== null && (perDay.get(date) ?? 0) >= type.maxPerDay) continue;
    for (const span of workingSpans(a, date, tz)) {
      for (let t = span.start; t + duration <= span.end; t += step) {
        if (t < q.from || t >= q.to || t < earliest) continue;
        if (clashes(t, t + duration, before, after, q.busy)) continue;
        out.push({ startUtc: new Date(t).toISOString(), endUtc: new Date(t + duration).toISOString() });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Validation of administrator input, shared by the API and the tests.

export function validateWindows(windows: unknown): { windows?: TimeWindow[]; error?: string } {
  if (!Array.isArray(windows)) return { error: "Windows must be a list." };
  const clean: TimeWindow[] = [];
  for (const w of windows) {
    if (!w || !isValidTime(w.start) || !isValidTime(w.end)) return { error: "Use times like 09:00." };
    if (minutesOfDay(w.end) <= minutesOfDay(w.start)) return { error: "Each window must end after it starts." };
    clean.push({ start: w.start, end: w.end });
  }
  clean.sort((x, y) => minutesOfDay(x.start) - minutesOfDay(y.start));
  for (let i = 1; i < clean.length; i++) if (minutesOfDay(clean[i].start) < minutesOfDay(clean[i - 1].end)) return { error: "Windows on the same day must not overlap." };
  return { windows: clean };
}

export function validateAvailability(input: unknown): { availability?: Availability; error?: string } {
  const v = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const weekly: Record<string, TimeWindow[]> = {};
  const weeklyIn = (v.weekly && typeof v.weekly === "object" ? v.weekly : {}) as Record<string, unknown>;
  for (let day = 0; day <= 6; day++) {
    const r = validateWindows(weeklyIn[String(day)] ?? []);
    if (r.error) return { error: r.error };
    if (r.windows!.length) weekly[String(day)] = r.windows!;
  }
  const breaks = validateWindows(v.breaks ?? []);
  if (breaks.error) return { error: `Breaks: ${breaks.error}` };
  const daysOff = Array.isArray(v.daysOff) ? v.daysOff : [];
  if (!daysOff.every(isValidDate)) return { error: "Days off must be real dates." };
  const overrides: Record<string, TimeWindow[]> = {};
  for (const [date, w] of Object.entries((v.overrides && typeof v.overrides === "object" ? v.overrides : {}) as Record<string, unknown>)) {
    if (!isValidDate(date)) return { error: "Overrides must use real dates." };
    const r = validateWindows(w);
    if (r.error) return { error: `Override ${date}: ${r.error}` };
    if (r.windows!.length) overrides[date] = r.windows!;
  }
  const window = Number(v.bookingWindowDays);
  if (!Number.isInteger(window) || window < 1 || window > 365) return { error: "The booking window must be between 1 and 365 days." };
  return { availability: { weekly, breaks: breaks.windows!, daysOff: [...new Set(daysOff as string[])].sort(), overrides, bookingWindowDays: window } };
}
