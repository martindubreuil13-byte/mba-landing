/**
 * Time-zone arithmetic for MBA Scheduling. Built on Intl (IANA identifiers, no fixed offsets, no library) and
 * deterministic: nothing here formats through locale APIs, so the server and the browser always print the same text.
 *
 * Conventions
 *  - An "instant" is epoch milliseconds (UTC). Appointments are stored as instants; zones are only for display and for
 *    interpreting the wall-clock times an administrator types in their home zone.
 *  - A "local date" is "YYYY-MM-DD" and a "local time" is "HH:MM", both wall-clock in some IANA zone.
 *  - Daylight saving: a wall-clock time can be NONEXISTENT (spring forward) or AMBIGUOUS (fall back).
 *    resolveLocalTime() reports which; localToInstant() applies the "compatible" rule used by the JS Temporal proposal:
 *    a nonexistent time moves FORWARD by the length of the gap, an ambiguous time takes its FIRST occurrence.
 */

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    formatters.set(timeZone, f);
  }
  return f;
}

/** True for a real IANA identifier such as "America/Toronto" (or "UTC"). Fixed offsets and abbreviations are refused. */
export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || !/^(UTC|[A-Za-z_]+(\/[A-Za-z0-9_+-]+)+)$/.test(timeZone)) return false;
  try { formatter(timeZone); return true; } catch { return false; }
}

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number };

/** The wall-clock reading of an instant in a zone. month is 1-12 and weekday 0 (Sunday) - 6. */
export function zonedParts(instant: number, timeZone: string): ZonedParts {
  const p: Record<string, number> = {};
  for (const part of formatter(timeZone).formatToParts(new Date(instant))) if (part.type !== "literal") p[part.type] = Number(part.value);
  const hour = p.hour === 24 ? 0 : p.hour;
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  return { year: p.year, month: p.month, day: p.day, hour, minute: p.minute, second: p.second, weekday };
}

/** Offset of a zone from UTC at an instant, in minutes (positive east of Greenwich). */
export function offsetMinutes(instant: number, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((wallAsUtc - Math.floor(instant / 1000) * 1000) / MINUTE_MS);
}

export type LocalResolution =
  | { kind: "valid"; instant: number }
  | { kind: "ambiguous"; instant: number; later: number }
  | { kind: "nonexistent"; instant: number };

/** Interpret a wall-clock date and time in a zone, reporting daylight-saving ambiguity instead of hiding it. */
export function resolveLocalTime(date: string, time: string, timeZone: string): LocalResolution {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // The two offsets that can apply around this wall-clock time (equal unless a transition is near).
  const before = offsetMinutes(naive - 36 * 3_600_000, timeZone);
  const after = offsetMinutes(naive + 36 * 3_600_000, timeZone);
  const candidates = [...new Set([before, after])]
    .map((offset) => ({ offset, instant: naive - offset * MINUTE_MS }))
    .filter(({ offset, instant }) => offsetMinutes(instant, timeZone) === offset)
    .map(({ instant }) => instant)
    .sort((a, b) => a - b);
  if (candidates.length === 1) return { kind: "valid", instant: candidates[0] };
  if (candidates.length === 2) return { kind: "ambiguous", instant: candidates[0], later: candidates[1] };
  // Spring-forward gap: read the time with the pre-transition offset, which lands just after the gap.
  return { kind: "nonexistent", instant: naive - before * MINUTE_MS };
}

export function localToInstant(date: string, time: string, timeZone: string): number {
  return resolveLocalTime(date, time, timeZone).instant;
}

/** "YYYY-MM-DD" of an instant in a zone. */
export function localDate(instant: number, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar arithmetic on "YYYY-MM-DD" strings. Zone-free: a date is a label, not an instant. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / DAY_MS);
}
export function isValidDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return addDays(date, 0) === date;
}
export function isValidTime(time: unknown): time is string {
  return typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
export const minutesOfDay = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

/** "UTC-05:00", "UTC+07:00", "UTC+05:30". */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
export function zoneOffsetLabel(instant: number, timeZone: string): string {
  return formatOffset(offsetMinutes(instant, timeZone));
}

/** "Tuesday, November 3, 2026". */
export function formatDateLong(instant: number, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${WEEKDAY_NAMES[p.weekday]}, ${MONTH_NAMES[p.month - 1]} ${p.day}, ${p.year}`;
}
/** "Nov 3" style label for compact lists. */
export function formatDateShort(instant: number, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${WEEKDAY_NAMES[p.weekday].slice(0, 3)}, ${MONTH_NAMES[p.month - 1].slice(0, 3)} ${p.day}`;
}
/** "9:30 AM" (12-hour, default) or "09:30". */
export function formatTime(instant: number, timeZone: string, hour12 = true): string {
  const p = zonedParts(instant, timeZone);
  if (!hour12) return `${pad(p.hour)}:${pad(p.minute)}`;
  const h = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h}:${pad(p.minute)} ${p.hour < 12 ? "AM" : "PM"}`;
}
/** Wall-clock "HH:MM" of an instant in a zone. */
export function formatTime24(instant: number, timeZone: string): string { return formatTime(instant, timeZone, false); }

/** Zones offered in the picker when Intl cannot enumerate them. */
export const FALLBACK_TIME_ZONES = [
  "Pacific/Honolulu", "America/Anchorage", "America/Los_Angeles", "America/Vancouver", "America/Denver", "America/Chicago", "America/Mexico_City",
  "America/Toronto", "America/New_York", "America/Halifax", "America/Sao_Paulo", "Atlantic/Reykjavik", "Europe/London", "Europe/Lisbon", "Europe/Paris",
  "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Athens", "Europe/Helsinki", "Europe/Istanbul", "Africa/Cairo", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo",
  "Asia/Seoul", "Australia/Perth", "Australia/Sydney", "Pacific/Auckland", "UTC",
];
