import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SupabaseRepository } from "./adapters/supabase-repository";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, type MockCalendar, type MockEmail, type MockZoom } from "./providers";
import { SchedulingService } from "./service";
import { BACKOFF_SECONDS, googleEventIdFor } from "./sync";
import { formatTime } from "./timezone";
import { localDbReady } from "./testing/local-db";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

/**
 * The whole system on REAL Postgres (the LOCAL Supabase stack only): the production service, the production repository, the migration's
 * constraints and functions, with mock Google / Zoom / email. Skipped when the local stack is not running.
 */
const local = await localDbReady();
const NOW = Date.parse("2031-02-20T12:00:00Z");
const TZ = "America/Toronto";
const day = (d: string, hhmm: string, offset = "-05:00") => new Date(`${d}T${hhmm}:00${offset}`).toISOString();
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(++seq).toString(36)}`;

(local ? describe : describe.skip)("MBA Scheduling on local Postgres (service + repository + migration)", () => {
  const connectDb = () => createClient(local!.url, local!.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let db: ReturnType<typeof connectDb>;
  let repo: SupabaseRepository; let cal: MockCalendar; let zoom: MockZoom; let email: MockEmail; let svc: SchedulingService;
  let originalTz: string;
  const typeIds: string[] = [];

  const build = (clock: () => number = () => NOW) => {
    cal = createMockGoogleCalendar({ homeTimeZone: () => TZ, outage: () => false, pretendCommitments: false });
    zoom = createMockZoom({ failing: () => false });
    email = createSimulatedEmail();
    return new SchedulingService({ repo, now: clock, calendar: cal, zoom, email });
  };
  const mkType = async (over: Record<string, unknown> = {}, dates: string[] = ["2031-03-04"], window: [string, string] = ["06:00", "20:00"]) => {
    const slug = `svc-${uid()}`;
    const t = await svc.saveMeetingType({ slug, name: slug, description: "", durationMinutes: 60, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 30, bufferBeforeMinutes: 0,
      availability: { weekly: {}, breaks: [], daysOff: [], overrides: Object.fromEntries(dates.map((d) => [d, [{ start: window[0], end: window[1] }]])), bookingWindowDays: 365 }, ...over });
    typeIds.push(t.id); return t;
  };
  let n = 0;
  const book = (slug: string, startUtc: string, name = "SvcTest Guest", email = `svc${++n}@example.com`) => svc.createBooking({ slug, startUtc, guestName: name, guestEmail: email, guestTimeZone: "Europe/London", idempotencyKey: `svc-key-${uid()}-${n}` });
  const code = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string; message: string }) => e.code ?? `other:${e.message}`);
  const row = async (reference: string) => (await repo.getBookingByReference(reference))!;

  beforeAll(async () => {
    db = connectDb();
    repo = new SupabaseRepository(db as never);
    originalTz = (await repo.getSettings()).homeTimeZone;
    await repo.saveSettings({ homeTimeZone: TZ });
  });
  beforeEach(() => { svc = build(); });                                                  // fresh mocks (and counters) for every test
  afterAll(async () => {
    if (typeIds.length) { await db.from("sched_bookings").delete().in("meeting_type_id", typeIds); await db.from("sched_meeting_types").delete().in("id", typeIds); }
    await db.from("sched_activity").delete().or("summary.like.%SvcTest%,summary.like.%svc-%");
    if (originalTz) await repo.saveSettings({ homeTimeZone: originalTz });
  });

  it("books, syncs Zoom + Google + email, reschedules, and cancels, with every record in Postgres", async () => {
    const t = await mkType({ maxPerDay: 3 });
    const slots = await svc.publicSlots(t.slug, undefined, "2031-03-03T00:00:00Z", "2031-03-06T00:00:00Z");
    expect(slots.length).toBeGreaterThan(10);
    const first = slots.find((s) => formatTime(Date.parse(s.startUtc), TZ, false) === "10:00")!;
    const { booking, replay } = await book(t.slug, first.startUtc, "SvcTest Lifecycle");
    expect(replay).toBe(false);
    let b = await row(booking.reference);
    expect(b).toMatchObject({ status: "confirmed", version: 1, guestName: "SvcTest Lifecycle", bufferAfterMinutes: 30, sync: { status: "ok" } });
    const refs = await repo.listRefs(b.id);
    expect(refs.map((r) => r.provider).sort()).toEqual(["google", "zoom"]);
    expect(refs.find((r) => r.provider === "google")!.externalId).toBe(googleEventIdFor(b.id));
    expect(b.zoom.status).toBe("ready");
    expect(cal.events.size).toBe(1); expect(zoom.meetings.size).toBe(1); expect(email.sent).toHaveLength(1);
    expect((await repo.listEmailAttempts(b.id)).map((a) => [a.kind, a.status])).toEqual([["confirmation", "accepted"]]);

    // 10:00 Toronto in March 2031 (EST, before the 10 March change) is 15:00Z
    expect(b.startUtc).toBe("2031-03-04T15:00:00.000Z");

    const later = slots.find((s) => formatTime(Date.parse(s.startUtc), TZ, false) === "14:00")!;
    await svc.rescheduleBooking(b.id, later.startUtc);
    b = await row(booking.reference);
    expect(b).toMatchObject({ version: 2, startUtc: later.startUtc, sync: { status: "ok" } });
    expect(zoom.meetings.size).toBe(1); expect(zoom.creates).toBe(1); expect(cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(later.startUtc);
    expect(email.sent.map((m) => m.subject)).toEqual(["Confirmed: " + t.name, "New time: " + t.name]);
    expect(b.events.map((e) => e.kind)).toEqual(["created", "rescheduled"]);

    await svc.cancelBooking(b.id); await svc.cancelBooking(b.id);
    b = await row(booking.reference);
    expect(b).toMatchObject({ status: "canceled", version: 3 });
    expect(zoom.meetings.size).toBe(0); expect(cal.events.size).toBe(0);
    expect(email.sent).toHaveLength(3); expect(email.sent[2].subject).toBe("Canceled: " + t.name);
    expect((await repo.listRefs(b.id)).every((r) => r.status === "deleted")).toBe(true);
    expect(b.events.map((e) => e.kind)).toEqual(["created", "rescheduled", "canceled"]);
  });

  it("lets exactly one of six simultaneous requests for the same slot win, through the full service", async () => {
    const t = await mkType({}, ["2031-03-05"]);
    const slot = (await svc.publicSlots(t.slug, undefined, "2031-03-05T00:00:00Z", "2031-03-06T12:00:00Z")).find((s) => formatTime(Date.parse(s.startUtc), TZ, false) === "11:00")!;
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => code(book(t.slug, slot.startUtc, `SvcTest Racer ${i}`))));
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "slot_unavailable")).toHaveLength(5);
    expect((await repo.listConfirmedBookings(slot.startUtc, slot.endUtc, 0)).filter((b) => b.meetingTypeId === t.id)).toHaveLength(1);
    expect(zoom.creates).toBe(1); expect(email.sent).toHaveLength(1);
  });

  it("is idempotent end to end: a retried request returns the same booking without a second Zoom meeting, event or email", async () => {
    const t = await mkType({}, ["2031-03-06"]);
    const slot = (await svc.publicSlots(t.slug, undefined, "2031-03-06T00:00:00Z", "2031-03-07T12:00:00Z"))[0];
    const input = { slug: t.slug, startUtc: slot.startUtc, guestName: "SvcTest Retry", guestEmail: "retry@example.com", guestTimeZone: "UTC", idempotencyKey: `svc-idem-${uid()}` };
    const a = await svc.createBooking(input);
    const [b, c] = await Promise.all([svc.createBooking(input), svc.createBooking(input)]);
    expect(b.booking.reference).toBe(a.booking.reference); expect(c.booking.reference).toBe(a.booking.reference);
    expect([b.replay, c.replay]).toEqual([true, true]);
    expect(zoom.creates).toBe(1); expect(email.sent).toHaveLength(1);
    await expect(svc.createBooking({ ...input, startUtc: new Date(Date.parse(slot.startUtc) + 3600_000).toISOString() })).rejects.toMatchObject({ code: "idempotency_conflict" });
  });

  it("keeps different meeting types apart by their buffers, in the database", async () => {
    const a = await mkType({ bufferAfterMinutes: 60 }); const b = await mkType({ bufferBeforeMinutes: 15, bufferAfterMinutes: 0, durationMinutes: 30 });
    const slotsA = await svc.publicSlots(a.slug, undefined, "2031-03-04T00:00:00Z", "2031-03-05T12:00:00Z");
    await book(a.slug, slotsA.find((s) => formatTime(Date.parse(s.startUtc), TZ, false) === "10:00")!.startUtc, "SvcTest BufferA");   // 10:00-11:00, clear until 12:00
    const times = (await svc.publicSlots(b.slug, undefined, "2031-03-04T00:00:00Z", "2031-03-05T12:00:00Z")).map((s) => formatTime(Date.parse(s.startUtc), TZ, false));
    expect(times).not.toContain("11:30"); expect(times).not.toContain("11:45"); expect(times).toContain("12:15");     // 12:00 + B's 15 minute before-buffer
    expect(times).toContain("09:00");                                                                                  // B ends 09:30, A needs 0 before
    expect(await code(book(b.slug, day("2031-03-04", "11:45"), "SvcTest TooClose"))).toBe("slot_unavailable");
  });

  it("keeps true instants across the spring-forward change (America/Toronto, Sunday 9 March 2031)", async () => {
    const t = await mkType({ bufferAfterMinutes: 30, durationMinutes: 30 }, ["2031-03-09"], ["00:00", "06:00"]);
    const slots = (await svc.publicSlots(t.slug, undefined, "2031-03-09T00:00:00Z", "2031-03-10T12:00:00Z")).map((s) => s.startUtc);
    expect(slots).toContain("2031-03-09T06:00:00.000Z");                                                               // 1:00 AM EST
    const first = await book(t.slug, "2031-03-09T06:00:00.000Z", "SvcTest DstA");
    const after = (await svc.publicSlots(t.slug, undefined, "2031-03-09T00:00:00Z", "2031-03-10T12:00:00Z")).map((s) => s.startUtc);
    expect(after).not.toContain("2031-03-09T06:45:00.000Z");                                                           // 1:45 AM EST: inside the buffer
    expect(after).toContain("2031-03-09T07:00:00.000Z");                                                               // 3:00 AM EDT, 30 real minutes later
    const stored = await row(first.booking.reference);
    expect([stored.startUtc, stored.endUtc]).toEqual(["2031-03-09T06:00:00.000Z", "2031-03-09T06:30:00.000Z"]);
  });

  it("recovers: a Zoom outage keeps the booking, the retry runs after the backoff, and two competing workers create ONE meeting", async () => {
    const t = await mkType({}, ["2031-03-11"]);
    let clock = NOW; const s1 = build(() => clock);
    const zoomA = zoom; zoomA.failing = true;
    const slot = (await s1.publicSlots(t.slug, undefined, "2031-03-11T00:00:00Z", "2031-03-12T12:00:00Z"))[0];
    const { booking } = await s1.createBooking({ slug: t.slug, startUtc: slot.startUtc, guestName: "SvcTest Recover", guestEmail: "recover@example.com", guestTimeZone: "UTC", idempotencyKey: `svc-rec-${uid()}` });
    let b = await row(booking.reference);
    expect(b.status).toBe("confirmed"); expect(b.zoom.status).toBe("pending"); expect(b.sync).toMatchObject({ status: "pending", attempts: 1 });
    // two workers (two service instances, one database) wake up together once Zoom is back
    zoomA.failing = false; clock += BACKOFF_SECONDS[0] * 1000;
    const calB = createMockGoogleCalendar({ homeTimeZone: () => TZ, outage: () => false, pretendCommitments: false });
    const sharedZoom = zoomA; const sharedEmail = email;
    const s2 = new SchedulingService({ repo, now: () => clock, calendar: calB, zoom: sharedZoom, email: sharedEmail });
    const [r1, r2] = await Promise.all([s1.runDueSync(50), s2.runDueSync(50)]);
    const mine = [...r1, ...r2].filter((r) => r.bookingId === b.id);
    expect(mine.filter((r) => !r.skipped)).toHaveLength(1);                                                            // only one worker acted on it
    b = await row(booking.reference);
    expect(b.sync).toMatchObject({ status: "ok", attempts: 0 }); expect(b.zoom.status).toBe("ready");
    expect(sharedZoom.meetings.size).toBe(1); expect(sharedZoom.creates).toBe(1);
    expect(sharedEmail.sent.map((m) => m.subject.split(":")[0])).toEqual(["Confirmed", "Your Zoom details"]);
  });

  it("answers the community invitation once, with consent evidence stored", async () => {
    const t = await mkType({}, ["2031-03-12"]);
    const slot = (await svc.publicSlots(t.slug, undefined, "2031-03-12T00:00:00Z", "2031-03-13T12:00:00Z"))[0];
    const { booking } = await book(t.slug, slot.startUtc, "SvcTest Community");
    expect(await svc.recordCommunity(booking.reference, "shown")).toBe("shown");
    expect(await svc.recordCommunity(booking.reference, "joined")).toBe("joined");
    expect(await svc.recordCommunity(booking.reference, "declined")).toBe("joined");
    const b = await row(booking.reference);
    const { data } = await db.from("sched_community_consents").select("*").eq("booking_id", b.id);
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({ choice: "joined", wording_version: "scheduling-community-v2" });
    expect(data![0].wording).toContain("Yes, keep me in the loop");
  });
});
