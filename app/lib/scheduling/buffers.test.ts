import { beforeEach, describe, expect, it } from "vitest";
import { BUFFER_OPTIONS, DEFAULT_BUFFER_AFTER, DEFAULT_BUFFER_BEFORE } from "./constants";
import { createMockZoom, type CalendarProvider } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingError, SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { formatTime } from "./timezone";
import type { BusyInterval, MeetingType } from "./types";

const TZ = "America/Toronto";
const NOW = Date.parse("2026-10-26T12:00:00Z");
const at = (iso: string) => Date.parse(iso);
let busy: BusyInterval[];
let store: MemoryStore;
let svc: SchedulingService;

const calendar: CalendarProvider = {
  getBusy: async (from, to) => busy.filter((b) => b.end > from && b.start < to),
  upsertEvent: async (i) => ({ eventId: i.eventId }),
  deleteEvent: async () => undefined,
};

beforeEach(async () => {
  busy = [];
  const seed = await buildSeedData(NOW, "America/Toronto");
  seed.bookings = []; seed.meetingTypes = [];
  store = new MemoryStore(seed);
  svc = new SchedulingService({ store, now: () => NOW, calendar, zoom: createMockZoom({ failing: () => false }) });
});

const day = (date: string, start = "06:00", end = "20:00") => ({ weekly: {}, breaks: [], daysOff: [], overrides: { [date]: [{ start, end }] }, bookingWindowDays: 365 });
const mk = (slug: string, over: Partial<Record<string, unknown>> = {}) => svc.saveMeetingType({
  slug, name: slug, description: "", durationMinutes: 60, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true,
  availability: day("2026-12-08"), ...over,
}) as Promise<MeetingType>;
const FROM = "2026-12-07T00:00:00Z", TO = "2026-12-10T00:00:00Z";
const times = async (slug: string) => (await svc.publicSlots(slug, undefined, FROM, TO)).map((s) => formatTime(at(s.startUtc), TZ, false));
let n = 0;
const book = (slug: string, startUtc: string, email = `g${++n}@example.com`) => svc.createBooking({ slug, startUtc, guestName: "Guest", guestEmail: email, guestTimeZone: "Europe/London", idempotencyKey: `buf-key-${n}-${slug}-${startUtc}` });
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (isErr(e) ? e.code : `other:${(e as Error).message}`));
const isErr = (e: unknown): e is SchedulingError => e instanceof Error && e.name === "SchedulingError";
const utc = (hhmm: string) => `2026-12-08T${String((Number(hhmm.slice(0, 2)) + 5) % 24).padStart(2, "0")}:${hhmm.slice(3)}:00.000Z`; // Toronto is UTC-5 in December

describe("buffer configuration", () => {
  it("offers exactly 0, 15, 30, 45 and 60 minutes, defaulting to 30 after and 0 before", async () => {
    expect([...BUFFER_OPTIONS]).toEqual([0, 15, 30, 45, 60]);
    const t = await mk("defaults");
    expect([t.bufferBeforeMinutes, t.bufferAfterMinutes]).toEqual([DEFAULT_BUFFER_BEFORE, DEFAULT_BUFFER_AFTER]);
    expect([DEFAULT_BUFFER_BEFORE, DEFAULT_BUFFER_AFTER]).toEqual([0, 30]);
  });
  it("accepts every listed option and refuses anything else", async () => {
    for (const m of BUFFER_OPTIONS) expect((await mk(`opt-${m}`, { bufferBeforeMinutes: m, bufferAfterMinutes: m })).bufferAfterMinutes).toBe(m);
    for (const bad of [5, 10, 20, 75, 90, -15]) { expect(await code(mk(`bad-${Math.abs(bad)}`, { bufferAfterMinutes: bad }))).toBe("invalid_input"); expect(await code(mk(`bad-b-${Math.abs(bad)}`, { bufferBeforeMinutes: bad }))).toBe("invalid_input"); }
  });
  it("keeps the existing buffers when an edit does not mention them", async () => {
    const t = await mk("keep", { bufferBeforeMinutes: 45, bufferAfterMinutes: 15 });
    const { bufferBeforeMinutes: _b, bufferAfterMinutes: _a, ...rest } = t; void _b; void _a;
    const again = await svc.saveMeetingType({ ...rest, name: "renamed" });
    expect([again.bufferBeforeMinutes, again.bufferAfterMinutes]).toEqual([45, 15]);
  });
});

describe("buffers across ALL meeting types", () => {
  it("a booking of one type keeps other types away: its after-buffer plus the next type's before-buffer", async () => {
    await mk("a-hour", { bufferAfterMinutes: 30 });                         // 60 min, 30 after
    await mk("b-half", { durationMinutes: 30, bufferBeforeMinutes: 15, bufferAfterMinutes: 0 });
    await book("a-hour", utc("10:00"));                                   // 10:00-11:00 (+30 after = 11:30)
    const b = await times("b-half");
    expect(b).not.toContain("11:15");                                      // starts inside A's after-buffer
    expect(b).not.toContain("11:30");                                      // B needs 15 of its own before-buffer: 11:45 is the first
    expect(b).toContain("11:45");
    expect(b).toContain("08:30");                                          // ends 09:00, +0 after, A needs 0 before: fine
    expect(b).not.toContain("09:45");                                      // ends 10:15: overlaps A
  });
  it("works in the other direction: the booked type's BEFORE-buffer and the candidate's AFTER-buffer", async () => {
    await mk("a-hour", { bufferBeforeMinutes: 45, bufferAfterMinutes: 0 });
    await mk("b-half", { durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 15 });
    await book("a-hour", utc("12:00"));                                   // needs 45 clear before 12:00
    const b = await times("b-half");
    expect(b).toContain("10:30");                                          // ends 11:00, +15 after = 11:15 = exactly where A's 45 minute before-buffer begins
    expect(b).not.toContain("10:45");                                      // ends 11:15, +15 = 11:30 > 11:15
  });
  it("the same type blocks itself with both of its buffers", async () => {
    await mk("solo", { bufferBeforeMinutes: 15, bufferAfterMinutes: 30 });
    await book("solo", utc("10:00"));                                     // 10:00-11:00
    const t = await times("solo");
    expect(t).not.toContain("11:30");                                      // gap 30 < 30 + 15
    expect(t).toContain("11:45");
    expect(t).not.toContain("08:30");                                      // ends 09:30, +30 = 10:00 > 09:45
    expect(t).toContain("08:15");
  });
  it("a zero buffer allows back-to-back meetings", async () => {
    await mk("tight", { bufferBeforeMinutes: 0, bufferAfterMinutes: 0 });
    await book("tight", utc("10:00"));
    expect(await times("tight")).toContain("11:00");
  });
  it("buffers are minutes on the clock face of elapsed time, so every option behaves", async () => {
    for (const m of BUFFER_OPTIONS) {
      await mk(`gap-${m}`, { bufferAfterMinutes: m, bufferBeforeMinutes: 0, durationMinutes: 30, slotIntervalMinutes: 15, availability: day("2026-12-08", "09:00", "13:00") });
    }
    await book("gap-45", utc("10:00"));                                   // 10:00-10:30
    for (const m of BUFFER_OPTIONS) {
      const first = (await times(`gap-${m}`)).find((t) => t > "10:00")!;
      // The candidate's own buffer is AFTER it; the booked meeting's after-buffer (45) pushes the next start to 11:15 for every type.
      expect(first, `type with ${m}`).toBe("11:15");
    }
  });
});

describe("buffers against Google Calendar busy periods", () => {
  it("keeps the candidate's before-buffer clear of the end of a Google event, and its after-buffer clear of the start of the next", async () => {
    await mk("gcal", { durationMinutes: 30, bufferBeforeMinutes: 30, bufferAfterMinutes: 30 });
    busy = [{ start: at(utc("13:00")), end: at(utc("14:00")), before: 0, after: 0, label: "External" }];
    const t = await times("gcal");
    expect(t).not.toContain("14:00");                                      // would start right as the event ends
    expect(t).not.toContain("14:15");
    expect(t).toContain("14:30");
    expect(t).not.toContain("12:30");                                      // ends 13:00: touches, no 30 minute buffer
    expect(t).toContain("12:00");                                          // ends 12:30, +30 after = 13:00
  });
  it("an event WE created for a booking does not block that booking from being rescheduled, but still carries our buffers", async () => {
    await mk("ours", { durationMinutes: 60, bufferAfterMinutes: 30, bufferBeforeMinutes: 0 });
    const { booking } = await book("ours", utc("10:00"));
    const id = (await store.read()).bookings.find((b) => b.reference === booking.reference)!.id;
    busy = [{ start: at(utc("10:00")), end: at(utc("11:00")), before: 0, after: 0, label: "Our event as Google reports it" }];
    const open = (await svc.adminSlots((await store.read()).meetingTypes[0].id, "2026-12-07T00:00:00Z", "2026-12-10T00:00:00Z", id)).map((s) => formatTime(at(s.startUtc), TZ, false));
    expect(open).toContain("10:15");                                       // moving 15 minutes later is allowed: own time is free
    expect(open).toContain("10:00");
  });
});

describe("buffers when canceling and rescheduling", () => {
  it("canceling releases the booking's buffers", async () => {
    await mk("cancel-me", { bufferAfterMinutes: 30 });
    const { booking } = await book("cancel-me", utc("10:00"));
    expect(await times("cancel-me")).not.toContain("11:15");
    await svc.cancelBooking((await store.read()).bookings.find((b) => b.reference === booking.reference)!.id);
    expect(await times("cancel-me")).toContain("11:00");
    expect(await times("cancel-me")).toContain("10:00");
  });
  it("rescheduling next to another booking is refused if the buffers would not fit, and allowed if they do", async () => {
    await mk("resched", { bufferAfterMinutes: 30, bufferBeforeMinutes: 15 });
    await book("resched", utc("10:00"));                                   // 10:00-11:00
    const mine = await book("resched", utc("14:00"));
    const id = (await store.read()).bookings.find((b) => b.reference === mine.booking.reference)!.id;
    expect(await code(svc.rescheduleBooking(id, utc("11:30")))).toBe("slot_unavailable");  // gap 30 < 30 + 15
    expect(await code(svc.rescheduleBooking(id, utc("11:45")))).toBe("ok");                 // gap 45
    expect((await store.read()).bookings.find((b) => b.id === id)!.startUtc).toBe(new Date(utc("11:45")).toISOString());
  });
  it("a booking keeps the buffers it was booked with, even if the meeting type is edited afterwards", async () => {
    const t = await mk("snap", { bufferAfterMinutes: 15 });
    await book("snap", utc("10:00"));
    await svc.saveMeetingType({ ...t, bufferAfterMinutes: 60 });
    const stored = (await store.read()).bookings[0];
    expect(stored.bufferAfterMinutes).toBe(15);
    const after = await times("snap");
    expect(after).toContain("11:15");                                      // 11:00 + the 15 it was BOOKED with. Had the new 60 been applied to it, 12:00 would be first.
    expect(after).not.toContain("11:00");
  });
});

describe("the repository is the authority, not the screen", () => {
  it("refuses a booking whose buffers collide even if the caller's view of the calendar was stale", async () => {
    await mk("auth-a", { bufferAfterMinutes: 60 });
    await mk("auth-b", { bufferBeforeMinutes: 0, bufferAfterMinutes: 0, durationMinutes: 30 });
    await book("auth-a", utc("10:00"));                                    // keeps clear until 12:00
    const types = await svc.repo.listMeetingTypes();
    const b = types.find((x) => x.slug === "auth-b")!;
    const start = utc("11:15");
    await expect(svc.repo.createBooking({
      reference: "stale-view", meetingTypeId: b.id, startUtc: start, endUtc: new Date(at(start) + 30 * 60_000).toISOString(), bufferBeforeMinutes: 0, bufferAfterMinutes: 0,
      guestName: "X", guestEmail: "x@example.com", guestMessage: "", guestTimeZone: "UTC", source: null, idempotencyKey: "stale-key-1", requestHash: "h",
      dayStartUtc: "2026-12-08T05:00:00.000Z", dayEndUtc: "2026-12-09T05:00:00.000Z", maxPerDay: null, createdAt: new Date(NOW).toISOString(),
    })).rejects.toMatchObject({ code: "slot_unavailable" });
  });
  it("concurrent bookings of DIFFERENT types that fit alone but collide together produce exactly one booking", async () => {
    await mk("race-a", { bufferAfterMinutes: 30 });
    await mk("race-b", { bufferAfterMinutes: 30, durationMinutes: 30 });
    const results = await Promise.all([code(book("race-a", utc("10:00"))), code(book("race-b", utc("11:15"))), code(book("race-b", utc("10:30"))), code(book("race-a", utc("10:15")))]);
    const confirmed = (await store.read()).bookings.filter((b) => b.status === "confirmed");
    expect(results.filter((r) => r === "ok").length).toBe(confirmed.length);
    // No two confirmed bookings may be closer than their buffers allow.
    for (const x of confirmed) for (const y of confirmed) {
      if (x === y || Date.parse(x.startUtc) > Date.parse(y.startUtc)) continue;
      expect(Date.parse(y.startUtc) - Date.parse(x.endUtc) >= (x.bufferAfterMinutes! + y.bufferBeforeMinutes!) * 60_000, `${x.startUtc} / ${y.startUtc}`).toBe(true);
    }
  });
});

describe("buffers across daylight-saving changes (elapsed minutes, not clock times)", () => {
  it("fall back, America/Toronto 2026-11-01: the gap is measured in real minutes, so 01:00 EST can follow a 00:00 EDT booking", async () => {
    await mk("dst-fall", { durationMinutes: 30, bufferAfterMinutes: 30, bufferBeforeMinutes: 0, availability: day("2026-11-01", "00:00", "04:00") });
    // 00:00 EDT = 04:00Z, ends 04:30Z, buffer to 05:00Z (that is 01:00 EDT, the FIRST 1 AM).
    await svc.createBooking({ slug: "dst-fall", startUtc: "2026-11-01T04:00:00.000Z", guestName: "G", guestEmail: "fall@example.com", guestTimeZone: "UTC", idempotencyKey: "dst-fall-key-1" });
    const slots = (await svc.publicSlots("dst-fall", undefined, "2026-11-01T00:00:00Z", "2026-11-02T00:00:00Z")).map((s) => s.startUtc);
    expect(slots).not.toContain("2026-11-01T04:45:00.000Z");
    expect(slots).toContain("2026-11-01T05:00:00.000Z");                   // first 1:00 AM
    expect(slots).toContain("2026-11-01T06:00:00.000Z");                   // second 1:00 AM, an hour of real time later
  });
  it("spring forward, America/Toronto 2026-03-08: 1:30 AM EST to 3:00 AM EDT is 30 real minutes, enough for a 30 minute buffer and no more", async () => {
    const early = Date.parse("2026-03-01T12:00:00Z");
    const seed = await buildSeedData(early, "America/Toronto"); seed.bookings = []; seed.meetingTypes = [];
    const s2 = new SchedulingService({ store: new MemoryStore(seed), now: () => early, calendar, zoom: createMockZoom({ failing: () => false }) });
    await s2.saveMeetingType({ slug: "dst-spring", name: "dst-spring", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 30, bufferBeforeMinutes: 0, availability: day("2026-03-08", "00:00", "05:00") });
    await s2.createBooking({ slug: "dst-spring", startUtc: "2026-03-08T06:00:00.000Z", guestName: "G", guestEmail: "spring@example.com", guestTimeZone: "UTC", idempotencyKey: "dst-spring-key-1" }); // 1:00 AM EST
    const slots = (await s2.publicSlots("dst-spring", undefined, "2026-03-08T00:00:00Z", "2026-03-09T00:00:00Z")).map((s) => s.startUtc);
    expect(slots).not.toContain("2026-03-08T06:45:00.000Z");              // 1:45 AM EST: inside the buffer
    expect(slots).toContain("2026-03-08T07:00:00.000Z");                   // 3:00 AM EDT: 30 real minutes after the 1:30 AM end
  });
});
