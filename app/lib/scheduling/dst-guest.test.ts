import { describe, expect, it } from "vitest";
import { composeEmail } from "./notifications";
import type { Booking, MeetingType } from "./types";
import { formatTime, zoneOffsetLabel } from "./timezone";

/**
 * What the GUEST is told about when their meeting is, across daylight-saving changes in THEIR time zone (not the host's). The instant is stored
 * and synchronised in UTC; the words in the email and on the confirmation page are derived in the guest's zone, and the offset label is what
 * tells the guest which of two identical-looking clock times they mean.
 */
const type = { id: "t", slug: "t", name: "Discovery Conversation", description: "", durationMinutes: 30, format: "zoom", visibility: "public", availability: { weekly: {}, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 90 }, minNoticeHours: 0, bufferBeforeMinutes: 0, bufferAfterMinutes: 30, maxPerDay: null, slotIntervalMinutes: 30, active: true } as MeetingType;
const booking = (startUtc: string, guestTimeZone: string): Booking => ({
  id: "b", reference: "r", meetingTypeId: "t", startUtc, endUtc: new Date(Date.parse(startUtc) + 30 * 60_000).toISOString(), guestName: "Ada Lovelace", guestEmail: "ada@example.com", guestMessage: "", guestTimeZone,
  status: "confirmed", source: null, zoom: { status: "ready", meetingId: "1", joinUrl: "https://example.com/simulated-zoom/1" }, community: { state: "unseen" }, idempotencyKey: "k", createdAt: "2026-10-01T00:00:00Z", events: [], version: 1,
});
const rows = (b: Booking) => Object.fromEntries(composeEmail("confirmation", b, type).rows);

describe("guest-facing times across daylight saving", () => {
  it("fall back in the guest's zone: 1:30 AM happens twice on 1 November 2026 (America/New_York) and the two meetings are told apart by their offsets", () => {
    const edt = rows(booking("2026-11-01T05:30:00.000Z", "America/New_York")), est = rows(booking("2026-11-01T06:30:00.000Z", "America/New_York"));
    expect(edt.Time).toMatch(/^1:30 AM/); expect(est.Time).toMatch(/^1:30 AM/);                      // identical clock times...
    expect(edt["Time zone"]).not.toBe(est["Time zone"]);                                               // ...but not the same label
    expect(edt["Time zone"]).toMatch(/04:00/); expect(est["Time zone"]).toMatch(/05:00/);
    expect(edt.Date).toBe(est.Date);
  });
  it("spring forward in the guest's zone: 28 March 2027 (Europe/London), 00:30 GMT and 02:30 BST are 90 real minutes apart, shown with their own offsets", () => {
    const gmt = rows(booking("2027-03-28T00:30:00.000Z", "Europe/London")), bst = rows(booking("2027-03-28T01:30:00.000Z", "Europe/London"));
    expect(gmt.Time).toMatch(/^12:30 AM/); expect(bst.Time).toMatch(/^2:30 AM/);                       // the 1 AM hour does not exist that night
    expect(gmt["Time zone"]).toMatch(/\+00:00|00:00/); expect(bst["Time zone"]).toMatch(/\+01:00/);
    expect(Date.parse("2027-03-28T01:30:00.000Z") - Date.parse("2027-03-28T00:30:00.000Z")).toBe(60 * 60_000);
  });
  it("a guest in a zone without daylight saving (Asia/Bangkok, the host's zone) never changes offset", () => {
    for (const d of ["2026-03-08T07:00:00.000Z", "2026-11-01T07:00:00.000Z", "2027-03-28T07:00:00.000Z"]) expect(rows(booking(d, "Asia/Bangkok"))["Time zone"]).toMatch(/\+07:00/);
  });
  it("a guest and a host a world apart see the same instant: Bangkok 14:00 on 4 Nov is 2:00 AM in New York (EST after the change) and 7:00 AM in London", () => {
    const start = Date.parse("2026-11-04T07:00:00.000Z");
    expect(formatTime(start, "Asia/Bangkok")).toBe("2:00 PM"); expect(formatTime(start, "America/New_York")).toBe("2:00 AM"); expect(formatTime(start, "Europe/London")).toBe("7:00 AM");
    expect(zoneOffsetLabel(start, "America/New_York")).toMatch(/05:00/);
  });
  it("every message kind states the zone, and the cancellation names the same date and time as the confirmation", () => {
    const b = booking("2026-11-01T06:30:00.000Z", "America/New_York");
    for (const kind of ["confirmation", "reschedule", "cancellation", "zoom_details"] as const) expect(composeEmail(kind, b, type).text).toMatch(/05:00|UTC/);
    expect(composeEmail("cancellation", b, type).text).toContain("1:30 AM");
  });
});
