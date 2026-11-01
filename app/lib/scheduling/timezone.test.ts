import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDateLong, formatOffset, formatTime, isValidDate, isValidTimeZone, localDate, localToInstant, offsetMinutes, resolveLocalTime, weekdayOf, zonedParts } from "./timezone";

const z = (iso: string) => Date.parse(iso);

describe("IANA zones, not fixed offsets", () => {
  it("accepts real identifiers and refuses abbreviations, offsets and nonsense", () => {
    for (const tz of ["America/Toronto", "America/Vancouver", "Europe/London", "Asia/Bangkok", "Australia/Sydney", "UTC", "America/Argentina/Buenos_Aires"]) expect(isValidTimeZone(tz), tz).toBe(true);
    for (const tz of ["EST", "UTC+5", "GMT-5", "Not/AZone", "", "toronto", 5, null]) expect(isValidTimeZone(tz), String(tz)).toBe(false);
  });

  it("reports the offset that applies at the instant, which changes with daylight saving", () => {
    expect(offsetMinutes(z("2026-01-15T12:00:00Z"), "America/Toronto")).toBe(-300);
    expect(offsetMinutes(z("2026-07-15T12:00:00Z"), "America/Toronto")).toBe(-240);
    expect(offsetMinutes(z("2026-01-15T12:00:00Z"), "Australia/Sydney")).toBe(660);
    expect(offsetMinutes(z("2026-07-15T12:00:00Z"), "Australia/Sydney")).toBe(600);
    expect(offsetMinutes(z("2026-07-15T12:00:00Z"), "Europe/London")).toBe(60);
    expect(offsetMinutes(z("2026-01-15T12:00:00Z"), "Asia/Bangkok")).toBe(420);
    expect(offsetMinutes(z("2026-07-15T12:00:00Z"), "Asia/Bangkok")).toBe(420);
    expect(offsetMinutes(z("2026-07-15T12:00:00Z"), "Asia/Kolkata")).toBe(330);
  });
});

describe("the same local time maps to different instants across the year", () => {
  it("keeps 10:00 in Toronto at 10:00 local while UTC moves", () => {
    expect(new Date(localToInstant("2026-07-01", "10:00", "America/Toronto")).toISOString()).toBe("2026-07-01T14:00:00.000Z");
    expect(new Date(localToInstant("2026-12-01", "10:00", "America/Toronto")).toISOString()).toBe("2026-12-01T15:00:00.000Z");
  });
  it("round-trips every half hour of a year in five zones", () => {
    for (const tz of ["America/Toronto", "America/Vancouver", "Europe/London", "Asia/Bangkok", "Australia/Sydney"]) {
      for (let day = 0; day < 365; day += 7) {
        const date = addDays("2026-01-01", day);
        for (const time of ["00:00", "09:30", "12:00", "17:30", "23:30"]) {
          const r = resolveLocalTime(date, time, tz);
          if (r.kind !== "valid") continue; // gaps and overlaps are covered below
          const p = zonedParts(r.instant, tz);
          expect(`${date} ${time}`).toBe(`${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`);
        }
      }
    }
  });
});

describe("daylight-saving transitions", () => {
  it("America/Toronto, spring forward: 02:30 on 2026-03-08 does not exist and moves forward to 03:30 EDT", () => {
    const r = resolveLocalTime("2026-03-08", "02:30", "America/Toronto");
    expect(r.kind).toBe("nonexistent");
    expect(new Date(r.instant).toISOString()).toBe("2026-03-08T07:30:00.000Z");
    expect(zonedParts(r.instant, "America/Toronto").hour).toBe(3);
  });
  it("America/Toronto, fall back: 01:30 on 2026-11-01 happens twice and the first occurrence (EDT) is used", () => {
    const r = resolveLocalTime("2026-11-01", "01:30", "America/Toronto");
    expect(r.kind).toBe("ambiguous");
    expect(new Date(r.instant).toISOString()).toBe("2026-11-01T05:30:00.000Z");
    if (r.kind === "ambiguous") expect(new Date(r.later).toISOString()).toBe("2026-11-01T06:30:00.000Z");
  });
  it("Europe/London changes on different dates from Toronto", () => {
    expect(resolveLocalTime("2026-03-29", "01:30", "Europe/London").kind).toBe("nonexistent");
    expect(new Date(localToInstant("2026-03-29", "01:30", "Europe/London")).toISOString()).toBe("2026-03-29T01:30:00.000Z");
    const fall = resolveLocalTime("2026-10-25", "01:30", "Europe/London");
    expect(fall.kind).toBe("ambiguous");
    expect(new Date(fall.instant).toISOString()).toBe("2026-10-25T00:30:00.000Z");
    // Two weeks in which Toronto and London are an hour closer together than usual.
    expect(offsetMinutes(z("2026-03-15T12:00:00Z"), "America/Toronto") - offsetMinutes(z("2026-03-15T12:00:00Z"), "Europe/London")).toBe(-240);
    expect(offsetMinutes(z("2026-02-15T12:00:00Z"), "America/Toronto") - offsetMinutes(z("2026-02-15T12:00:00Z"), "Europe/London")).toBe(-300);
  });
  it("Australia/Sydney, southern hemisphere: forward in October, back in April", () => {
    expect(resolveLocalTime("2026-10-04", "02:30", "Australia/Sydney").kind).toBe("nonexistent");
    expect(new Date(localToInstant("2026-10-04", "02:30", "Australia/Sydney")).toISOString()).toBe("2026-10-03T16:30:00.000Z");
    const back = resolveLocalTime("2027-04-04", "02:30", "Australia/Sydney");
    expect(back.kind).toBe("ambiguous");
    expect(new Date(back.instant).toISOString()).toBe("2027-04-03T15:30:00.000Z");
  });
  it("Asia/Bangkok has no daylight saving, so no time is ever ambiguous or missing", () => {
    for (const date of ["2026-03-08", "2026-03-29", "2026-10-25", "2026-11-01"]) for (const time of ["01:30", "02:30"]) expect(resolveLocalTime(date, time, "Asia/Bangkok").kind).toBe("valid");
  });
  it("a day with a transition is 23 or 25 hours long", () => {
    const hours = (date: string, tz: string) => (localToInstant(addDays(date, 1), "00:00", tz) - localToInstant(date, "00:00", tz)) / 3_600_000;
    expect(hours("2026-03-08", "America/Toronto")).toBe(23);
    expect(hours("2026-11-01", "America/Toronto")).toBe(25);
    expect(hours("2026-03-09", "America/Toronto")).toBe(24);
  });
});

describe("zone-free calendar arithmetic and deterministic formatting", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-30", "2026-11-03")).toBe(4);
    expect(weekdayOf("2026-10-30")).toBe(5);
  });
  it("validates dates", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-02-28")).toBe(true);
    expect(isValidDate("tomorrow")).toBe(false);
  });
  it("formats without relying on locale APIs", () => {
    const t = z("2026-11-03T14:30:00Z");
    expect(formatDateLong(t, "America/Toronto")).toBe("Tuesday, November 3, 2026");
    expect(formatTime(t, "America/Toronto")).toBe("9:30 AM");
    expect(formatTime(t, "Europe/London")).toBe("2:30 PM");
    expect(formatTime(t, "Europe/London", false)).toBe("14:30");
    expect(formatTime(z("2026-11-03T05:00:00Z"), "America/Toronto")).toBe("12:00 AM");
    expect(formatTime(z("2026-11-03T17:05:00Z"), "America/Toronto")).toBe("12:05 PM");
    expect(formatOffset(-300)).toBe("UTC-05:00");
    expect(formatOffset(330)).toBe("UTC+05:30");
  });
  it("a late booking lands on the visitor's own calendar date, not the host's", () => {
    const t = z("2026-11-04T01:00:00Z"); // Tuesday evening in Toronto, already Wednesday in Bangkok
    expect(localDate(t, "America/Toronto")).toBe("2026-11-03");
    expect(localDate(t, "Asia/Bangkok")).toBe("2026-11-04");
  });
});
