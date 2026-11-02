/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = vi.hoisted(() => ({ current: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.current.client() }));

import { signContext, verifyContext } from "./context";
import { linkBookingOrigin, originStates } from "@/app/lib/scheduling/adapters/booking-origin";
import { describeBooking, listJourney } from "./journey";
import { buildSeedData } from "@/app/lib/scheduling/seed";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "@/app/lib/scheduling/providers";
import { SchedulingService } from "@/app/lib/scheduling/service";
import { MemoryStore } from "@/app/lib/scheduling/store";

const INQ = "11111111-1111-4111-8111-111111111111", APP = "22222222-2222-4222-8222-222222222222", LEAD = "33333333-3333-4333-8333-333333333333";
const T0 = Date.parse("2026-11-02T12:00:00Z");

beforeEach(() => {
  db.current = new FakeDb();
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-for-tests"); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "");
});

describe("the signed origin context", () => {
  it("round-trips an inquiry or an application and holds only the kind and the row id", () => {
    for (const o of [{ kind: "inquiry", id: INQ }, { kind: "application", id: APP }] as const) {
      const token = signContext(o, T0);
      expect(verifyContext(token, T0 + 1000)).toEqual(o);
      const payload = Buffer.from(token.split(".")[1], "base64url").toString();
      expect(payload).not.toMatch(/@|ref|name/i);
    }
  });

  it("is good for two hours and not a minute longer", () => {
    const token = signContext({ kind: "inquiry", id: INQ }, T0);
    expect(verifyContext(token, T0 + 119 * 60_000)).not.toBeNull();
    expect(verifyContext(token, T0 + 121 * 60_000)).toBeNull();
  });

  it("refuses forgeries: edited payload, swapped signature, other secret, wrong version, junk", () => {
    const token = signContext({ kind: "inquiry", id: INQ }, T0);
    const [v, body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify(["a", APP, 9_999_999_999])).toString("base64url");
    for (const bad of [`${v}.${forged}.${sig}`, `${v}.${body}.${sig.slice(0, -2)}xx`, `bc2.${body}.${sig}`, `${v}.${body}`, "", "x".repeat(500), 5, null, undefined]) expect(verifyContext(bad, T0 + 1000)).toBeNull();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "another-secret");
    expect(verifyContext(token, T0 + 1000)).toBeNull();
  });

  it("refuses a context whose id is not a row id", () => {
    expect(verifyContext(signContext({ kind: "inquiry", id: "not-a-uuid" }, T0), T0 + 1000)).toBeNull();
  });
});

describe("linking a new booking to its origin", () => {
  const seedRecords = () => {
    db.current.tables.program_inquiries.push({ id: INQ, lead_id: LEAD });
    db.current.tables.program_applications.push({ id: APP, lead_id: LEAD });
  };

  it("records one origin row per booking, with the person, for an inquiry and for an application", async () => {
    seedRecords();
    await linkBookingOrigin("booking-1", signContext({ kind: "inquiry", id: INQ }));
    await linkBookingOrigin("booking-2", signContext({ kind: "application", id: APP }));
    expect(db.current.tables.booking_origins).toMatchObject([
      { booking_id: "booking-1", origin_type: "inquiry", inquiry_id: INQ, application_id: null, lead_id: LEAD },
      { booking_id: "booking-2", origin_type: "application", application_id: APP, inquiry_id: null, lead_id: LEAD },
    ]);
  });

  it("changes nothing for a missing, forged or expired context, and never overwrites an existing link", async () => {
    seedRecords();
    for (const bad of ["", "garbage", signContext({ kind: "inquiry", id: INQ }, Date.now() - 3 * 3_600_000)]) await linkBookingOrigin("booking-1", bad);
    expect(db.current.tables.booking_origins).toHaveLength(0);
    await linkBookingOrigin("booking-1", signContext({ kind: "inquiry", id: INQ }));
    await linkBookingOrigin("booking-1", signContext({ kind: "application", id: APP }));
    expect(db.current.tables.booking_origins).toHaveLength(1);
    expect(db.current.tables.booking_origins[0].origin_type).toBe("inquiry");
  });
});

describe("the booking service links after the booking is committed", () => {
  const DAY = "2031-02-21";
  async function service(link: (id: string, ctx: string) => Promise<void>) {
    const NOW = Date.parse("2031-02-20T12:00:00Z");
    const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
    const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email: createSimulatedEmail(), now: () => NOW, defer: () => {}, bookingOrigin: link });
    const t = await svc.saveMeetingType({ slug: "talk-link", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
      availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
    const input = (n: number, extra: object = {}) => ({ slug: t.slug, startUtc: `${DAY}T1${n}:00:00Z`, guestName: "Guest", guestEmail: `guest${n}@example.test`, guestTimeZone: "UTC", idempotencyKey: `link-key-${n}-0000`, ...extra });
    return { svc, input };
  }

  it("links a new booking once, with the booking's id and the context the page held", async () => {
    const link = vi.fn(async () => undefined); const { svc, input } = await service(link);
    const { booking } = await svc.createBooking(input(0, { originContext: "the-context" }));
    expect(link).toHaveBeenCalledTimes(1); expect(link).toHaveBeenCalledWith(expect.any(String), "the-context");
    expect(booking.reference).toBeTruthy();
  });

  it("does not link a repeat of the same request, or a booking that arrived without a context", async () => {
    const link = vi.fn(async () => undefined); const { svc, input } = await service(link);
    await svc.createBooking(input(1, { originContext: "ctx" })); await svc.createBooking(input(1, { originContext: "ctx" }));
    await svc.createBooking(input(2));
    expect(link).toHaveBeenCalledTimes(1);
  });

  it("a failing link never fails or delays the booking", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { svc, input } = await service(async () => { throw new Error("database unavailable"); });
    const r = await svc.createBooking(input(3, { originContext: "ctx" }));
    expect(r.replay).toBe(false); expect(r.booking.reference).toBeTruthy();
    expect(err.mock.calls.flat().join(" ")).toContain("booking origin not recorded");
    err.mockRestore();
  });
});

describe("booking status shown to the administrator comes from the booking records", () => {
  const b = (over: Partial<{ id: string; status: "confirmed" | "canceled"; startAt: string; rescheduled: boolean; createdAt: string }>) => ({ id: "x", status: "confirmed" as const, startAt: "2036-11-05T06:00:00Z", rescheduled: false, createdAt: "2026-11-01T00:00:00Z", ...over });

  it("describes booked, rescheduled, past, canceled, rebooked, hint and none", () => {
    const tz = "Asia/Bangkok";
    expect(describeBooking([b({})], [], tz, T0)).toMatchObject({ tone: "ok", text: expect.stringMatching(/^Booked: .*13:00|^Booked: .*1:00 p\.m\./) });
    expect(describeBooking([b({ rescheduled: true })], [], tz, T0).text).toContain("(rescheduled)");
    expect(describeBooking([b({ startAt: "2026-10-01T06:00:00Z" })], [], tz, T0).text).toMatch(/^Session was/);
    expect(describeBooking([b({ status: "canceled" })], [], tz, T0)).toMatchObject({ tone: "bad", text: expect.stringContaining("Canceled (was") });
    // cancelled first, booked again later: the live booking is the headline
    expect(describeBooking([b({ id: "new" }), b({ id: "old", status: "canceled" })], [], tz, T0).tone).toBe("ok");
    expect(describeBooking([], [b({})], tz, T0)).toMatchObject({ tone: "hint", text: expect.stringContaining("same e-mail, not linked") });
    expect(describeBooking([], [], tz, T0)).toEqual({ text: "Not booked", tone: "none" });
    // a link beats a hint
    expect(describeBooking([b({ status: "canceled" })], [b({})], tz, T0).tone).toBe("bad");
  });

  it("follows a cancellation and a reschedule with nothing copied: change the booking, the answer changes", async () => {
    db.current.tables.sched_settings.push({ home_time_zone: "Asia/Bangkok" });
    db.current.tables.sched_bookings.push({ id: "b1", status: "confirmed", start_at: "2036-11-05T06:00:00Z", created_at: "2026-11-01T00:00:00Z" });
    db.current.tables.booking_origins.push({ booking_id: "b1", inquiry_id: INQ, application_id: null });
    const read = async () => describeBooking((await originStates({ inquiryIds: [INQ], applicationIds: [], emails: [] })).linked.get(`inquiry:${INQ}`) ?? [], [], "Asia/Bangkok", T0);
    expect((await read()).text).toMatch(/^Booked: /);
    db.current.tables.sched_booking_events.push({ booking_id: "b1", kind: "rescheduled" }); db.current.tables.sched_bookings[0].start_at = "2036-11-06T07:00:00Z";
    expect((await read()).text).toMatch(/Nov 6.*\(rescheduled\)/);
    db.current.tables.sched_bookings[0].status = "canceled";
    expect((await read()).text).toMatch(/^Canceled \(was .*Nov 6/);
  });
});

describe("the combined list", () => {
  it("merges inquiries and applications newest first, with program interest, and tolerates a missing part", async () => {
    db.current.tables.leads.push({ id: LEAD, email: "ada@example.test", first_name: "Ada" });
    db.current.tables.program_inquiries.push({ id: INQ, lead_id: LEAD, full_name: "Ada Lovelace", program_slug: "pre-architecture", message: "hello", owner_status: "accepted", auto_reply_status: "accepted", created_at: "2026-11-02T10:00:00Z", message_purged_at: null });
    db.current.tables.program_applications.push({ id: APP, lead_id: LEAD, program_key: "corporate-transition", booking_ref: "r", answers: { firstName: "Elena", lastName: "T", email: "elena@example.com" }, submitted_at: "2026-11-01T10:00:00Z", status: "INVITED" });
    const { rows, notes } = await listJourney(50, T0);
    expect(notes).toEqual([]);
    expect(rows.map((r) => [r.kind, r.name, r.interest])).toEqual([["inquiry", "Ada Lovelace", "Pre-Architecture"], ["application", "Elena T", "Corporate Transition"]]);
    expect(rows[0]).toMatchObject({ email: "ada@example.test", message: "hello", contact: { text: "You were notified", bad: false }, booking: { text: "Not booked" } });

    // the new table is not there yet: the applications still show, with a plain note
    delete db.current.tables.program_inquiries;
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const partial = await listJourney(50, T0);
    expect(partial.rows.map((r) => r.kind)).toEqual(["application"]); expect(partial.notes).toEqual(["Saved inquiries are not available yet."]);
    err.mockRestore();
  });

  it("flags an inquiry whose notification failed and one whose message was removed", async () => {
    db.current.tables.leads.push({ id: LEAD, email: "ada@example.test" });
    db.current.tables.program_inquiries.push({ id: INQ, lead_id: LEAD, full_name: "Ada", program_slug: null, message: "", owner_status: "failed", owner_error: "provider_rejected: no", auto_reply_status: "pending", created_at: "2026-11-02T10:00:00Z", message_purged_at: "2028-11-03T00:00:00Z" });
    const { rows } = await listJourney(50, T0);
    expect(rows[0]).toMatchObject({ interest: "No program chosen", contact: { text: "Delivery failed", bad: true, detail: "provider_rejected: no" }, messageRemoved: true, message: null });
  });
});
