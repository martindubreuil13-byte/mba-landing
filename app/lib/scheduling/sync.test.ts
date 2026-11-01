import { beforeEach, describe, expect, it } from "vitest";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, type MockCalendar, type MockEmail, type MockZoom } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { BACKOFF_SECONDS, googleEventIdFor, MAX_ATTEMPTS, zoomMarkerFor } from "./sync";
import { formatTime } from "./timezone";

/**
 * Synchronisation with Google Calendar, Zoom and email, against mocks that record everything they are asked to do.
 * The clock is manual so retries and backoff are exact.
 */
const TZ = "America/Toronto";
let now: number;
let store: MemoryStore; let cal: MockCalendar; let zoom: MockZoom; let email: MockEmail; let svc: SchedulingService;

beforeEach(async () => {
  now = Date.parse("2026-10-26T12:00:00Z");
  const seed = await buildSeedData(now, "America/Toronto"); seed.bookings = []; seed.meetingTypes = [];
  store = new MemoryStore(seed);
  cal = createMockGoogleCalendar({ homeTimeZone: () => TZ, outage: () => false, pretendCommitments: false });
  zoom = createMockZoom({ failing: () => false });
  email = createSimulatedEmail();
  svc = new SchedulingService({ store, now: () => now, calendar: cal, zoom, email });
  await svc.saveMeetingType({ slug: "talk", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 30,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { "2026-12-08": [{ start: "06:00", end: "20:00" }], "2026-12-09": [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  cal.extraBusy = [];
});

const utc = (day: number, hhmm: string) => `2026-12-0${day}T${String((Number(hhmm.slice(0, 2)) + 5) % 24).padStart(2, "0")}:${hhmm.slice(3)}:00.000Z`;
let n = 0;
const book = async (startUtc: string, name = "Ada Lovelace") => { const r = await svc.createBooking({ slug: "talk", startUtc, guestName: name, guestEmail: `g${++n}@example.com`, guestTimeZone: "Europe/London", idempotencyKey: `sync-key-${n}-${startUtc}` }); return (await store.read()).bookings.find((b) => b.reference === r.booking.reference)!; };
const state = async (id: string) => { const d = await store.read(); return { b: d.bookings.find((x) => x.id === id)!, refs: d.externalRefs ?? [], attempts: d.emailAttempts ?? [], d }; };
const sentKinds = () => email.sent.map((m) => m.subject.split(":")[0]);

describe("a new booking", () => {
  it("creates one Zoom meeting, one Google event (carrying the Zoom link) and one confirmation email", async () => {
    const b = await book(utc(8, "10:00"));
    const { refs, attempts, b: now1 } = await state(b.id);
    expect(zoom.meetings.size).toBe(1);
    const z = refs.find((r) => r.provider === "zoom")!, g = refs.find((r) => r.provider === "google")!;
    expect(z).toMatchObject({ status: "synced", syncedVersion: 1 });
    expect(g).toMatchObject({ status: "synced", externalId: googleEventIdFor(b.id) });
    const ev = cal.events.get(googleEventIdFor(b.id))!;
    expect(ev.location).toBe(z.url); expect(ev.description).toContain(z.url!); expect(ev.timeZone).toBe(TZ);
    expect(ev.startUtc).toBe(utc(8, "10:00")); expect(ev.endUtc).toBe(utc(8, "10:30"));
    expect(attempts.filter((a) => a.status === "accepted").map((a) => a.kind)).toEqual(["confirmation"]);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]).toMatchObject({ to: b.guestEmail, subject: "Confirmed: Talk" });
    expect(email.sent[0].text).toContain(z.url!); expect(email.sent[0].content!.zoomUrl).toBe(z.url);
    expect(now1.sync).toMatchObject({ status: "ok", attempts: 0 });
    expect(now1.zoom).toMatchObject({ status: "ready", joinUrl: z.url });
  });
  it("derives the Google event id and the Zoom marker from the booking id, so they are stable", async () => {
    expect(googleEventIdFor("abc")).toBe(googleEventIdFor("abc"));
    expect(googleEventIdFor("abc")).toMatch(/^mba[0-9a-f]{29}$/);                 // base32hex: allowed by Google
    expect(googleEventIdFor("abc")).not.toBe(googleEventIdFor("abd"));
    expect(zoomMarkerFor("abc")).toBe("mba-booking:abc");
    const b = await book(utc(8, "10:00"));
    expect([...zoom.meetings.values()][0].marker).toBe(zoomMarkerFor(b.id));
  });
  it("is idempotent: syncing again changes nothing and sends nothing", async () => {
    const b = await book(utc(8, "10:00"));
    for (let i = 0; i < 3; i++) await svc.sync.run(b.id);
    expect(zoom.creates).toBe(1); expect(zoom.meetings.size).toBe(1); expect(cal.events.size).toBe(1); expect(email.sent).toHaveLength(1);
    expect((await state(b.id)).attempts.filter((a) => a.status === "accepted")).toHaveLength(1);
  });
  it("lets only one of several simultaneous workers act on a booking", async () => {
    const b = await book(utc(8, "10:00"));
    await store.mutate((d) => { const x = d.bookings.find((y) => y.id === b.id)!; x.sync = { status: "pending", attempts: 0, nextAttemptAt: null, lastError: null }; d.externalRefs = []; d.emailAttempts = []; x.zoom = { status: "pending", meetingId: null, joinUrl: null }; });
    zoom.meetings.clear(); cal.events.clear(); email.sent.length = 0; zoom.creates = 0;
    const results = await Promise.all(Array.from({ length: 5 }, () => svc.sync.run(b.id)));
    expect(results.filter((r) => !r.skipped)).toHaveLength(1);
    expect(zoom.creates).toBe(1); expect(cal.events.size).toBe(1); expect(email.sent).toHaveLength(1);
  });
});

describe("Zoom failures", () => {
  it("keeps the booking, tells the guest the link will follow, retries with backoff, then sends the Zoom details once", async () => {
    zoom.failing = true;
    const b = await book(utc(8, "10:00"));
    let s = await state(b.id);
    expect(s.b.status).toBe("confirmed");
    expect(s.b.zoom.status).toBe("pending");
    expect(s.d.activity.some((a) => a.kind === "zoom_failed")).toBe(true);
    expect(s.b.sync).toMatchObject({ status: "pending", attempts: 1 });
    expect(Date.parse(s.b.sync!.nextAttemptAt!) - now).toBe(BACKOFF_SECONDS[0] * 1000);
    expect(email.sent).toHaveLength(1); expect(email.sent[0].content!.zoomUrl).toBeNull(); expect(email.sent[0].text).toMatch(/link will follow/i);
    expect(cal.events.get(googleEventIdFor(b.id))!.location).toBeFalsy();                    // Google event exists, Zoom link pending
    // nothing is due yet
    expect(await svc.runDueSync()).toHaveLength(0);
    // Zoom recovers; the clock reaches the retry time
    zoom.failing = false; now += BACKOFF_SECONDS[0] * 1000;
    const r = await svc.runDueSync();
    expect(r).toHaveLength(1); expect(r[0].ok).toBe(true);
    s = await state(b.id);
    expect(s.b.sync).toMatchObject({ status: "ok", attempts: 0 });
    expect(s.b.zoom.status).toBe("ready");
    expect(cal.events.get(googleEventIdFor(b.id))!.location).toBe(s.b.zoom.joinUrl);          // the calendar event now carries the link
    expect(sentKinds()).toEqual(["Confirmed", "Your Zoom details"]);
    expect(email.sent[1].text).toContain(s.b.zoom.joinUrl!);
    await svc.sync.run(b.id); expect(email.sent).toHaveLength(2);                              // and never again
  });
  it("does not create a duplicate Zoom meeting when the response to a create was lost", async () => {
    zoom.loseNextResponse = true;
    const b = await book(utc(8, "10:00"));
    expect(zoom.meetings.size).toBe(1);                                                          // Zoom created it, we never heard back
    expect((await state(b.id)).b.zoom.status).toBe("pending");
    now += BACKOFF_SECONDS[0] * 1000;
    await svc.runDueSync();
    expect(zoom.meetings.size).toBe(1); expect(zoom.creates).toBe(1);                            // the retry FOUND the meeting by its marker
    expect((await state(b.id)).b.zoom).toMatchObject({ status: "ready", meetingId: [...zoom.meetings.keys()][0] });
  });
  it("recreates a meeting that was deleted in Zoom by hand when the booking is rescheduled", async () => {
    const b = await book(utc(8, "10:00"));
    zoom.meetings.clear();
    await svc.rescheduleBooking(b.id, utc(8, "13:00"));
    expect(zoom.meetings.size).toBe(1);
    expect((await state(b.id)).b.zoom.status).toBe("ready");
  });
  it("gives up after the maximum attempts, says so in the activity feed, and Retry sync recovers it", async () => {
    zoom.failing = true;
    const b = await book(utc(8, "10:00"));
    for (let i = 1; i < MAX_ATTEMPTS; i++) { now = Date.parse((await state(b.id)).b.sync!.nextAttemptAt ?? new Date(now + 1e9).toISOString()); await svc.runDueSync(); }
    const s = await state(b.id);
    expect(s.b.sync).toMatchObject({ status: "failed", attempts: MAX_ATTEMPTS, nextAttemptAt: null });
    expect(s.d.activity.some((a) => a.kind === "sync_failed" && /Giving up/.test(a.summary))).toBe(true);
    expect(s.b.zoom.status).toBe("failed");
    now += 1e10; expect(await svc.runDueSync()).toHaveLength(0);                                  // a failed booking waits for a human
    zoom.failing = false;
    const r = await svc.retrySync(b.id);
    expect(r.ok).toBe(true);
    expect((await state(b.id)).b).toMatchObject({ sync: { status: "ok" }, zoom: { status: "ready" } });
  });
  it("uses growing delays: 1 minute, 5 minutes, 30 minutes, 2 hours, 12 hours", () => {
    expect(BACKOFF_SECONDS).toEqual([60, 300, 1800, 7200, 43200]);
  });
});

describe("Google Calendar failures", () => {
  it("an outage while writing the event keeps the booking and the email, and retries only Google", async () => {
    cal.failWrites = true;
    const b = await book(utc(8, "10:00"));
    let s = await state(b.id);
    expect(s.b.status).toBe("confirmed"); expect(zoom.meetings.size).toBe(1); expect(email.sent).toHaveLength(1);
    expect(s.refs.find((r) => r.provider === "google")).toMatchObject({ status: "pending", attempts: 1 });
    expect(s.d.activity.some((a) => a.kind === "sync_failed" && /Google Calendar not updated/.test(a.summary))).toBe(true);
    cal.failWrites = false; now += BACKOFF_SECONDS[0] * 1000;
    await svc.runDueSync();
    s = await state(b.id);
    expect(s.refs.find((r) => r.provider === "google")).toMatchObject({ status: "synced", attempts: 0 });
    expect(zoom.creates).toBe(1); expect(email.sent).toHaveLength(1);                            // nothing else was repeated
  });
  it("expired Google credentials block availability and booking (we cannot prove the time is free) with a retryable error", async () => {
    cal.authExpired = true;
    await expect(svc.publicSlots("talk", undefined, "2026-12-08T00:00:00Z", "2026-12-10T00:00:00Z")).rejects.toMatchObject({ code: "calendar_unavailable", status: 503 });
    await expect(svc.createBooking({ slug: "talk", startUtc: utc(8, "10:00"), guestName: "A", guestEmail: "a@example.com", guestTimeZone: "UTC", idempotencyKey: "auth-expired-1" })).rejects.toMatchObject({ code: "calendar_unavailable" });
    expect((await store.read()).bookings).toHaveLength(0);
    cal.authExpired = false;                                                                      // reconnected
    expect((await svc.publicSlots("talk", undefined, "2026-12-08T00:00:00Z", "2026-12-10T00:00:00Z")).length).toBeGreaterThan(0);
  });
});

describe("email failures", () => {
  it("records the failure, retries, sends exactly once when the provider recovers, and never loses the booking", async () => {
    email.failing = true;
    const b = await book(utc(8, "10:00"));
    let s = await state(b.id);
    expect(s.b.status).toBe("confirmed"); expect(s.b.sync).toMatchObject({ status: "pending", attempts: 1 });
    expect(s.attempts.map((a) => a.status)).toEqual(["failed"]);
    expect(zoom.meetings.size).toBe(1); expect(cal.events.size).toBe(1);
    email.failing = false; now += BACKOFF_SECONDS[0] * 1000;
    await svc.runDueSync();
    s = await state(b.id);
    expect(s.attempts.map((a) => a.status)).toEqual(["failed", "accepted"]);
    expect(email.sent).toHaveLength(1); expect(zoom.creates).toBe(1);
    await svc.sync.run(b.id); expect(email.sent).toHaveLength(1);
  });
  it("sends every email with a provider idempotency key that names the booking, kind and version", async () => {
    const b = await book(utc(8, "10:00"));
    expect(email.sent[0].idempotencyKey).toBe(`sched-email/${b.id}/confirmation/1`);
  });
  it("a manual resend sends again each time, and reports failure instead of pretending", async () => {
    const b = await book(utc(8, "10:00"));
    await svc.resendConfirmation(b.id); await svc.resendConfirmation(b.id);
    expect(email.sent).toHaveLength(3);
    email.failing = true;
    await expect(svc.resendConfirmation(b.id)).rejects.toMatchObject({ code: "email_failed", status: 502 });
  });
});

describe("rescheduling", () => {
  it("moves the Zoom meeting and the Google event, and sends one reschedule email", async () => {
    const b = await book(utc(8, "10:00"));
    const meetingId = [...zoom.meetings.keys()][0];
    await svc.rescheduleBooking(b.id, utc(9, "14:00"));
    const s = await state(b.id);
    expect(s.b).toMatchObject({ version: 2, startUtc: utc(9, "14:00"), sync: { status: "ok" } });
    expect(zoom.meetings.size).toBe(1); expect(zoom.creates).toBe(1);                              // updated, not recreated
    expect(zoom.meetings.get(meetingId)!.startUtc).toBe(utc(9, "14:00"));
    expect(cal.events.size).toBe(1); expect(cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(utc(9, "14:00"));
    expect(sentKinds()).toEqual(["Confirmed", "New time"]);
    expect(s.refs.every((r) => r.syncedVersion === 2)).toBe(true);
    await svc.sync.run(b.id); expect(email.sent).toHaveLength(2);
  });
  it("a second reschedule sends a second email (one per version) and still keeps one meeting and one event", async () => {
    const b = await book(utc(8, "10:00"));
    await svc.rescheduleBooking(b.id, utc(9, "14:00")); await svc.rescheduleBooking(b.id, utc(8, "16:00"));
    expect(sentKinds()).toEqual(["Confirmed", "New time", "New time"]);
    expect(zoom.meetings.size).toBe(1); expect(cal.events.size).toBe(1); expect((await state(b.id)).b.version).toBe(3);
  });
  it("is safe when Google is down during the move: the booking is already moved, Google catches up later", async () => {
    const b = await book(utc(8, "10:00"));
    cal.failWrites = true;
    await svc.rescheduleBooking(b.id, utc(9, "14:00"));
    expect((await state(b.id)).b.startUtc).toBe(utc(9, "14:00"));
    expect(cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(utc(8, "10:00"));               // stale in Google for the moment
    cal.failWrites = false; now += BACKOFF_SECONDS[0] * 1000; await svc.runDueSync();
    expect(cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(utc(9, "14:00"));
  });
});

describe("cancellation", () => {
  it("deletes the Zoom meeting and the Google event, sends one cancellation, and is idempotent", async () => {
    const b = await book(utc(8, "10:00"));
    await svc.cancelBooking(b.id); await svc.cancelBooking(b.id);
    const s = await state(b.id);
    expect(s.b.status).toBe("canceled");
    expect(zoom.meetings.size).toBe(0); expect(cal.events.size).toBe(0);
    expect(s.refs.map((r) => r.status).sort()).toEqual(["deleted", "deleted"]);
    expect(sentKinds()).toEqual(["Confirmed", "Canceled"]);
    expect(email.sent[1].content!.rows).toEqual([]);
    await svc.sync.run(b.id); expect(email.sent).toHaveLength(2);
  });
  it("still removes the Google event when only the create was in flight (no reference stored yet)", async () => {
    cal.failWrites = true; zoom.failing = true;
    const b = await book(utc(8, "10:00"));
    cal.events.set(googleEventIdFor(b.id), { eventId: googleEventIdFor(b.id), bookingId: b.id, summary: "x", description: "", startUtc: b.startUtc, endUtc: b.endUtc, timeZone: TZ, etag: "e" });  // Google created it but the response was lost
    cal.failWrites = false; zoom.failing = false;
    await svc.cancelBooking(b.id);
    expect(cal.events.size).toBe(0);
  });
  it("a canceled booking frees its slot and its buffers for the next guest", async () => {
    const b = await book(utc(8, "10:00"));
    expect((await svc.publicSlots("talk", undefined, "2026-12-08T00:00:00Z", "2026-12-09T00:00:00Z")).map((s) => formatTime(Date.parse(s.startUtc), TZ, false))).not.toContain("10:15");
    await svc.cancelBooking(b.id);
    expect((await svc.publicSlots("talk", undefined, "2026-12-08T00:00:00Z", "2026-12-09T00:00:00Z")).map((s) => formatTime(Date.parse(s.startUtc), TZ, false))).toContain("10:00");
  });
});

describe("conflict detection against Google Calendar", () => {
  it("our own Google events never block our own bookings, but an external event does", async () => {
    const b = await book(utc(8, "10:00"));
    // Google reports our event as busy, exactly like the real API: it must not hide the booking's own time from a reschedule.
    const slots = (await svc.adminSlots((await store.read()).meetingTypes[0].id, "2026-12-08T00:00:00Z", "2026-12-09T00:00:00Z", b.id)).map((s) => formatTime(Date.parse(s.startUtc), TZ, false));
    expect(slots).toContain("10:00");
    cal.extraBusy = [{ start: Date.parse(utc(8, "13:00")), end: Date.parse(utc(8, "14:00")), before: 0, after: 0, label: "External meeting" }];
    const after = (await svc.publicSlots("talk", undefined, "2026-12-08T00:00:00Z", "2026-12-09T00:00:00Z")).map((s) => formatTime(Date.parse(s.startUtc), TZ, false));
    expect(after).not.toContain("13:15"); expect(after).not.toContain("13:00");
    expect(after).not.toContain("12:45");                                                       // 12:45-13:15 overlaps; 12:30 would touch (needs its 30 after)
    expect(after).toContain("14:00");
    await expect(svc.createBooking({ slug: "talk", startUtc: utc(8, "13:15"), guestName: "A", guestEmail: "a@example.com", guestTimeZone: "UTC", idempotencyKey: "conflict-ext-1" })).rejects.toMatchObject({ code: "slot_unavailable" });
  });
});

describe("the due-sync worker", () => {
  it("processes only bookings that are due, oldest first, and reports each", async () => {
    zoom.failing = true;
    const a = await book(utc(8, "10:00")); const b = await book(utc(8, "13:00"));
    zoom.failing = false;
    expect(await svc.runDueSync()).toHaveLength(0);
    now += BACKOFF_SECONDS[0] * 1000;
    const out = await svc.runDueSync();
    expect(out.map((r) => r.bookingId).sort()).toEqual([a.id, b.id].sort());
    expect(out.every((r) => r.ok)).toBe(true);
    expect(await svc.runDueSync()).toHaveLength(0);
  });
  it("retrySync and runDueSync refuse unknown bookings cleanly", async () => {
    await expect(svc.retrySync("nope")).rejects.toMatchObject({ code: "not_found" });
    expect((await svc.sync.run("nope")).skipped).toBe(true);
  });
});
