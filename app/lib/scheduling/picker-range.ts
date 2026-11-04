import { localDate, localToInstant } from "./timezone";

/** Never ask the public API for the already elapsed part of a calendar month. */
export function pickerRangeStart(yearMonth: string, timeZone: string, now = Date.now()): string {
  const today = localDate(now, timeZone);
  const first = yearMonth <= today.slice(0, 7) ? today : `${yearMonth}-01`;
  return new Date(localToInstant(first, "00:00", timeZone)).toISOString();
}
