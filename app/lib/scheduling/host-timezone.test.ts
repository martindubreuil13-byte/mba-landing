import { describe, expect, it, vi } from "vitest";
import { buildSeedData, DEFAULT_HOME_TIME_ZONE } from "./seed";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "./providers";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { bookingRows } from "./admin-views";
import { formatTime, localDate } from "./timezone";

/** Stage G business decision: the host's time zone is Asia/Bangkok everywhere; guests keep seeing their own. Mocks only. */
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t() }));

const NOW = Date.parse("2031-02-20T12:00:00Z");

async function fx(zone?: string) {
  const seed = await buildSeedData(NOW, zone); seed.bookings = []; seed.meetingTypes = [];
  const cal = createMockGoogleCalendar({ homeTimeZone: () => seed.settings.homeTimeZone, outage: () => false, pretendCommitments: false });
  const email = createSimulatedEmail();
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: cal, zoom: createMockZoom({ failing: () => false }), email, now: () => NOW, defer: () => {}, ownerEmail: "martindubreuil13@gmail.com" });
  const t = await svc.saveMeetingType({ slug: "talk-tz", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 30, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: { "1": [{ start: "09:00", end: "12:00" }], "2": [{ start: "09:00", end: "12:00" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 365 } });
  return { svc, cal, email, t };
}
const range = (from: string, to: string) => [`${from}T00:00:00Z`, `${to}T23:59:59Z`] as const;

describe("the host's time zone", () => {
  it("is Asia/Bangkok by default, in the code and for a fresh store", async () => {
    expect(DEFAULT_HOME_TIME_ZONE).toBe("Asia/Bangkok");
    expect((await buildSeedData(NOW)).settings.homeTimeZone).toBe("Asia/Bangkok");
  });

  it("reads weekly availability on Bangkok's clock: 09:00 to 12:00 there is 02:00 to 05:00 UTC", async () => {
    const f = await fx();
    const slots = await f.svc.publicSlots("talk-tz", undefined, ...range("2031-03-03", "2031-03-04"));   // Monday and Tuesday
    expect(slots.map((s) => s.startUtc.slice(0, 16))).toEqual(["2031-03-03T02:00", "2031-03-03T02:30", "2031-03-03T03:00", "2031-03-03T03:30", "2031-03-03T04:00", "2031-03-03T04:30",
      "2031-03-04T02:00", "2031-03-04T02:30", "2031-03-04T03:00", "2031-03-04T03:30", "2031-03-04T04:00", "2031-03-04T04:30"]);
  });

  it("keeps the same offset all year (Bangkok has no daylight saving), so a window never drifts", async () => {
    const f = await fx();
    for (const day of ["2031-12-01", "2031-03-10", "2031-07-07", "2031-11-03"]) {
      const slots = await f.svc.publicSlots("talk-tz", undefined, ...range(day, day));
      expect(slots[0].startUtc.slice(11, 16), day).toBe("02:00");
    }
  });

  it("shows every visitor the SAME instants in the visitor's own zone, whatever zone the host uses", async () => {
    const f = await fx();
    const [slot] = await f.svc.publicSlots("talk-tz", undefined, ...range("2031-03-03", "2031-03-03"));
    const t = Date.parse(slot.startUtc);
    expect(formatTime(t, "Asia/Bangkok", false)).toBe("09:00");
    expect(formatTime(t, "America/Toronto", false)).toBe("21:00");     // Sunday evening in Toronto (EST, UTC-5)
    expect(formatTime(t, "Europe/London", false)).toBe("02:00");
    expect(localDate(t, "America/Toronto")).toBe("2031-03-02");
    expect(formatTime(t, "Australia/Sydney", false)).toBe("13:00");
  });

  it("creates the appointment at the chosen instant, labels the Google event and Zoom meeting in the host's zone, and tells the host in that zone", async () => {
    const f = await fx();
    const [slot] = await f.svc.publicSlots("talk-tz", undefined, ...range("2031-03-03", "2031-03-03"));
    const { booking } = await f.svc.createBooking({ slug: "talk-tz", startUtc: slot.startUtc, guestName: "Visitor", guestEmail: "visitor@example.test", guestTimeZone: "America/Toronto", idempotencyKey: "tz-key-1234567" });
    const stored = (await f.svc.repo.getBookingByReference(booking.reference))!;
    expect(stored.startUtc).toBe(slot.startUtc);
    expect(stored.guestTimeZone).toBe("America/Toronto");
    await f.svc.sync.run(stored.id);
    expect([...f.cal.events.values()].map((e) => e.timeZone)).toEqual(["Asia/Bangkok"]);
    const guest = f.email.sent.find((m) => m.to === "visitor@example.test")!;
    const owner = f.email.sent.find((m) => m.to === "martindubreuil13@gmail.com")!;
    expect(guest.text).toMatch(/9:00 PM/);                               // the visitor's own clock
    expect(owner.text).toMatch(/9:00 AM/);                               // the host's clock
    expect(owner.text).toMatch(/Asia\/Bangkok|GMT\+7|UTC\+7|\+07:00/);
    const row = bookingRows(await f.svc.repo.snapshot(), NOW).find((r) => r.id === stored.id)!;
    expect(row.guestTimeZone).toBe("America/Toronto");
  });

  it("does not move a historical appointment when the host zone changes: the stored instant is identical, only the host's display differs", async () => {
    const f = await fx("America/Toronto");
    const [slot] = await f.svc.publicSlots("talk-tz", undefined, ...range("2031-03-03", "2031-03-03"));
    const { booking } = await f.svc.createBooking({ slug: "talk-tz", startUtc: slot.startUtc, guestName: "Early", guestEmail: "early@example.test", guestTimeZone: "UTC", idempotencyKey: "tz-key-7654321" });
    const before = (await f.svc.repo.getBookingByReference(booking.reference))!;
    const hostBefore = formatTime(Date.parse(before.startUtc), (await f.svc.repo.getSettings()).homeTimeZone, false);
    await f.svc.saveSettings({ homeTimeZone: "Asia/Bangkok" });
    const after = (await f.svc.repo.getBookingByReference(booking.reference))!;
    expect(after.startUtc).toBe(before.startUtc);
    expect(after.endUtc).toBe(before.endUtc);
    expect(after.version).toBe(before.version);
    expect(hostBefore).toBe("09:00");                                                                              // 09:00 in Toronto...
    expect(formatTime(Date.parse(after.startUtc), (await f.svc.repo.getSettings()).homeTimeZone, false)).toBe("21:00");   // ...is 21:00 in Bangkok: the same moment
  });

  it("refuses a bogus host zone and keeps Bangkok", async () => {
    const f = await fx();
    await expect(f.svc.saveSettings({ homeTimeZone: "EST" })).rejects.toMatchObject({ status: 400 });
    expect((await f.svc.repo.getSettings()).homeTimeZone).toBe("Asia/Bangkok");
  });
});
