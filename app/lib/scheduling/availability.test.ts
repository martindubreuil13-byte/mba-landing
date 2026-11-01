import { describe, expect, it } from "vitest";
import { computeSlots, validateAvailability, workingSpans } from "./availability";
import { seedMeetingTypes } from "./seed";
import type { BusyInterval, MeetingType } from "./types";
import { formatTime, localDate, weekdayOf } from "./timezone";

const TZ = "America/Toronto";
const at = (iso: string) => Date.parse(iso);
const NOW = at("2026-10-26T12:00:00Z"); // Monday 08:00 in Toronto
const discovery = seedMeetingTypes()[0];
const slotsOf = (type: MeetingType, from: string, to: string, extra: Partial<Parameters<typeof computeSlots>[0]> = {}) =>
  computeSlots({ type, homeTimeZone: TZ, from: at(from), to: at(to), now: NOW, busy: [], sameTypeStarts: [], ...extra });
const starts = (s: { startUtc: string }[]) => s.map((x) => x.startUtc);
const hourType = (over: Partial<MeetingType> = {}, avail: Partial<MeetingType["availability"]> = {}): MeetingType => ({
  ...discovery, id: "mt-x", slug: "x", durationMinutes: 60, slotIntervalMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, minNoticeHours: 0, maxPerDay: null,
  availability: { weekly: {}, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 365, ...avail }, ...over,
});

describe("availability rules", () => {
  it("offers only the configured weekdays (Discovery: Tuesday to Thursday) and honours the lunch break", () => {
    const slots = slotsOf(discovery, "2026-10-26T00:00:00Z", "2026-11-09T00:00:00Z");
    expect(slots.length).toBeGreaterThan(20);
    for (const s of slots) {
      const t = at(s.startUtc);
      expect([2, 3, 4]).toContain(weekdayOf(localDate(t, TZ)));
      const hhmm = formatTime(t, TZ, false);
      expect(hhmm >= "09:30" && hhmm < "16:30", hhmm).toBe(true);
      expect(hhmm >= "12:00" && hhmm < "13:00", `${hhmm} is inside the break`).toBe(false);
    }
    expect(formatTime(at(slots[0].startUtc), TZ)).toBe("9:30 AM");
  });

  it("keeps 9:30 AM local across the November fall-back while the UTC time moves an hour", () => {
    const slots = slotsOf(discovery, "2026-10-26T00:00:00Z", "2026-11-09T00:00:00Z");
    expect(starts(slots)).toContain("2026-10-27T13:30:00.000Z"); // Tuesday, EDT
    expect(starts(slots)).toContain("2026-11-03T14:30:00.000Z"); // Tuesday after the change, EST
  });

  it("shows a visitor the same meeting in their own zone, with the correct offset in each week", () => {
    const slots = slotsOf(discovery, "2026-10-26T00:00:00Z", "2026-11-09T00:00:00Z");
    const before = slots.find((s) => s.startUtc === "2026-10-27T13:30:00.000Z")!;
    const after = slots.find((s) => s.startUtc === "2026-11-03T14:30:00.000Z")!;
    expect(formatTime(at(before.startUtc), "Europe/London")).toBe("1:30 PM"); // London already on GMT
    expect(formatTime(at(after.startUtc), "Europe/London")).toBe("2:30 PM");
    expect(formatTime(at(before.startUtc), "Asia/Bangkok")).toBe("8:30 PM");
    expect(formatTime(at(after.startUtc), "Asia/Bangkok")).toBe("9:30 PM");
    expect(formatTime(at(before.startUtc), "Australia/Sydney")).toBe("12:30 AM");
  });

  it("respects minimum notice", () => {
    const type = { ...discovery, minNoticeHours: 12 };
    const slots = computeSlots({ type, homeTimeZone: TZ, from: at("2026-10-26T00:00:00Z"), to: at("2026-10-29T00:00:00Z"), now: at("2026-10-27T13:00:00Z"), busy: [], sameTypeStarts: [] });
    expect(slots.every((s) => at(s.startUtc) >= at("2026-10-28T01:00:00Z"))).toBe(true);
    expect(starts(slots)).not.toContain("2026-10-27T13:30:00.000Z");
  });

  it("limits how far ahead a visitor can book", () => {
    const type = { ...discovery, availability: { ...discovery.availability, bookingWindowDays: 7 } };
    const slots = slotsOf(type, "2026-10-26T00:00:00Z", "2026-12-31T00:00:00Z");
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => localDate(at(s.startUtc), TZ) <= "2026-11-01")).toBe(true);
  });

  it("applies days off, and date-specific overrides replace that day's hours", () => {
    const off = { ...discovery, availability: { ...discovery.availability, daysOff: ["2026-10-27"] } };
    expect(slotsOf(off, "2026-10-27T00:00:00Z", "2026-10-28T12:00:00Z").every((s) => localDate(at(s.startUtc), TZ) !== "2026-10-27")).toBe(true);
    // A Saturday is normally closed; the override opens it for two hours.
    const open = { ...discovery, availability: { ...discovery.availability, overrides: { "2026-10-31": [{ start: "10:00", end: "12:00" }] } } };
    const s = slotsOf(open, "2026-10-31T00:00:00Z", "2026-11-01T00:00:00Z");
    expect(s.map((x) => formatTime(at(x.startUtc), TZ, false))).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });

  it("caps bookings per day", () => {
    const day = (h: number) => at(`2026-10-27T${String(h).padStart(2, "0")}:00:00Z`);
    const capped = slotsOf(discovery, "2026-10-27T00:00:00Z", "2026-10-28T00:00:00Z", { sameTypeStarts: [day(13), day(14), day(15), day(16)] });
    expect(capped.filter((s) => localDate(at(s.startUtc), TZ) === "2026-10-27")).toHaveLength(0);
    const free = slotsOf(discovery, "2026-10-27T00:00:00Z", "2026-10-28T00:00:00Z", { sameTypeStarts: [day(13)] });
    expect(free.filter((s) => localDate(at(s.startUtc), TZ) === "2026-10-27").length).toBeGreaterThan(0);
  });
});

describe("conflicts and buffers", () => {
  const busy = (start: string, end: string, before = 0, after = 0): BusyInterval => ({ start: at(start), end: at(end), before: before * 60_000, after: after * 60_000 });

  it("removes slots that overlap a busy interval", () => {
    const slots = slotsOf(discovery, "2026-10-27T00:00:00Z", "2026-10-28T00:00:00Z", { busy: [busy("2026-10-27T14:00:00Z", "2026-10-27T15:00:00Z")] });
    expect(starts(slots)).not.toContain("2026-10-27T14:00:00.000Z");
    expect(starts(slots)).not.toContain("2026-10-27T14:30:00.000Z");
  });

  it("applies the meeting's own after-buffer to what comes next, and an existing booking's buffer to this one", () => {
    // Discovery has a 15 minute after-buffer. A call at 14:00Z-14:30Z blocks 13:30Z (it would end exactly as the call starts, with no gap).
    const slots = slotsOf(discovery, "2026-10-27T00:00:00Z", "2026-10-28T00:00:00Z", { busy: [busy("2026-10-27T14:00:00Z", "2026-10-27T14:30:00Z")] });
    expect(starts(slots)).not.toContain("2026-10-27T13:30:00.000Z");
    // 14:30Z starts the instant the call ends; allowed only because the call itself carries no buffer.
    expect(starts(slots)).toContain("2026-10-27T14:30:00.000Z");
    const withBuffer = slotsOf(discovery, "2026-10-27T00:00:00Z", "2026-10-28T00:00:00Z", { busy: [busy("2026-10-27T14:00:00Z", "2026-10-27T14:30:00Z", 0, 15)] });
    expect(starts(withBuffer)).not.toContain("2026-10-27T14:30:00.000Z");
    expect(starts(withBuffer)).toContain("2026-10-27T15:00:00.000Z");
  });

  it("a booking of one meeting type blocks every other type", () => {
    const friday = hourType({}, { weekly: { "5": [{ start: "10:00", end: "15:00" }] } });
    const none = slotsOf(friday, "2026-10-30T00:00:00Z", "2026-10-31T00:00:00Z");
    expect(none.map((s) => formatTime(at(s.startUtc), TZ, false))).toEqual(["10:00", "11:00", "12:00", "13:00", "14:00"]);
    const blocked = slotsOf(friday, "2026-10-30T00:00:00Z", "2026-10-31T00:00:00Z", { busy: [busy("2026-10-30T15:00:00Z", "2026-10-30T15:30:00Z")] });
    expect(blocked.map((s) => formatTime(at(s.startUtc), TZ, false))).toEqual(["10:00", "12:00", "13:00", "14:00"]);
  });
});

describe("working windows across daylight-saving changes", () => {
  it("a window that spans the fall-back keeps its true four-hour length (America/Toronto, 2026-11-01)", () => {
    const type = hourType({}, { overrides: { "2026-11-01": [{ start: "00:30", end: "03:30" }] } });
    const s = slotsOf(type, "2026-11-01T00:00:00Z", "2026-11-02T12:00:00Z");
    expect(starts(s)).toEqual(["2026-11-01T04:30:00.000Z", "2026-11-01T05:30:00.000Z", "2026-11-01T06:30:00.000Z", "2026-11-01T07:30:00.000Z"]);
  });
  it("a window that spans the spring-forward is an hour shorter (2026-03-08)", () => {
    const type = hourType({}, { overrides: { "2026-03-08": [{ start: "00:30", end: "03:30" }] } });
    const s = computeSlots({ type, homeTimeZone: TZ, from: at("2026-03-08T00:00:00Z"), to: at("2026-03-09T12:00:00Z"), now: at("2026-03-01T00:00:00Z"), busy: [], sameTypeStarts: [] });
    expect(starts(s)).toEqual(["2026-03-08T05:30:00.000Z", "2026-03-08T06:30:00.000Z"]);
  });
  it("a window that starts in the missing hour begins when the clocks land (02:00-04:00 on 2026-03-08 is one hour)", () => {
    const spans = workingSpans({ weekly: {}, breaks: [], daysOff: [], overrides: { "2026-03-08": [{ start: "02:00", end: "04:00" }] }, bookingWindowDays: 30 }, "2026-03-08", TZ);
    expect(spans.map((s) => [new Date(s.start).toISOString(), new Date(s.end).toISOString()])).toEqual([["2026-03-08T07:00:00.000Z", "2026-03-08T08:00:00.000Z"]]);
  });
  it("changing the home zone moves the same rules to different instants", () => {
    const type = hourType({}, { weekly: { "2": [{ start: "09:00", end: "10:00" }] } });
    const toronto = computeSlots({ type, homeTimeZone: "America/Toronto", from: at("2026-10-27T00:00:00Z"), to: at("2026-10-28T00:00:00Z"), now: NOW, busy: [], sameTypeStarts: [] });
    const london = computeSlots({ type, homeTimeZone: "Europe/London", from: at("2026-10-27T00:00:00Z"), to: at("2026-10-28T00:00:00Z"), now: NOW, busy: [], sameTypeStarts: [] });
    expect(starts(toronto)).toEqual(["2026-10-27T13:00:00.000Z"]);
    expect(starts(london)).toEqual(["2026-10-27T09:00:00.000Z"]);
  });
});

describe("administrator input validation", () => {
  const ok = { weekly: { "2": [{ start: "09:00", end: "12:00" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 30 };
  it("accepts a sound schedule and drops empty days", () => {
    const r = validateAvailability({ ...ok, weekly: { ...ok.weekly, "3": [] } });
    expect(r.error).toBeUndefined();
    expect(Object.keys(r.availability!.weekly)).toEqual(["2"]);
  });
  it("rejects reversed, malformed and overlapping windows, bad dates and bad booking windows", () => {
    expect(validateAvailability({ ...ok, weekly: { "2": [{ start: "12:00", end: "09:00" }] } }).error).toMatch(/end after/);
    expect(validateAvailability({ ...ok, weekly: { "2": [{ start: "9am", end: "10:00" }] } }).error).toMatch(/times like/);
    expect(validateAvailability({ ...ok, weekly: { "2": [{ start: "09:00", end: "11:00" }, { start: "10:00", end: "12:00" }] } }).error).toMatch(/overlap/);
    expect(validateAvailability({ ...ok, daysOff: ["2026-02-30"] }).error).toMatch(/real dates/);
    expect(validateAvailability({ ...ok, bookingWindowDays: 0 }).error).toMatch(/between 1 and 365/);
    expect(validateAvailability({ ...ok, overrides: { "nope": [] } }).error).toMatch(/real dates/);
  });
});
