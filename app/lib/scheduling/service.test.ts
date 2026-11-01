import { beforeEach, describe, expect, it } from "vitest";
import { createMockGoogleCalendar, createMockZoom } from "./providers";
import { buildSeedData, DEMO_REFERENCE } from "./seed";
import { SchedulingError, SchedulingService, type BookingInput } from "./service";
import { MemoryStore } from "./store";
import { formatTime, localDate, weekdayOf, zonedParts } from "./timezone";

const NOW = Date.parse("2026-10-26T12:00:00Z");
const TZ = "America/Toronto";
const range = (days = 21) => [new Date(NOW).toISOString(), new Date(NOW + days * 86_400_000).toISOString()] as const;

let flags: { outage: boolean; zoom: boolean };
let store: MemoryStore;
let svc: SchedulingService;

beforeEach(async () => {
  flags = { outage: false, zoom: false };
  store = new MemoryStore(await buildSeedData(NOW, "America/Toronto"));
  svc = new SchedulingService({
    store, now: () => NOW,
    calendar: createMockGoogleCalendar({ homeTimeZone: () => TZ, outage: () => flags.outage }),
    zoom: createMockZoom({ failing: () => flags.zoom }),
  });
});

const guest = (over: Partial<BookingInput> = {}): Omit<BookingInput, "startUtc" | "idempotencyKey"> & { idempotencyKey?: string } => ({ slug: "discovery-conversation", guestName: "Test Guest", guestEmail: "Test.Guest@Example.com", guestMessage: "Hello", guestTimeZone: "Asia/Bangkok", ...over });
let n = 0;
const key = () => `key-${++n}-${Math.random().toString(36).slice(2)}`;
const firstSlot = async (slug = "discovery-conversation", invite?: string) => (await svc.publicSlots(slug, invite, ...range()))[0];
const book = async (startUtc: string, over: Partial<BookingInput> = {}) => svc.createBooking({ ...guest(over), startUtc, idempotencyKey: over.idempotencyKey ?? key() } as BookingInput);
const code = async (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof SchedulingError ? e.code : `other:${(e as Error).message}`));

describe("meeting-type routing and privacy", () => {
  it("resolves public meeting types and exposes only what a visitor may see", async () => {
    const r = await svc.publicMeetingType("discovery-conversation");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.type).sort()).toEqual(["description", "durationMinutes", "format", "name", "priceLabel", "slug"]);
      expect(r.type.priceLabel).toBe("Complimentary");
    }
    const a = await svc.publicMeetingType("business-architecture-assessment");
    expect(a.ok && a.type.durationMinutes).toBe(60);
  });
  it("answers not_found for unknown or inactive types", async () => {
    expect((await svc.publicMeetingType("nope")).ok).toBe(false);
    const d = await store.read();
    await svc.saveMeetingType({ ...d.meetingTypes[0], active: false });
    expect(await svc.publicMeetingType("discovery-conversation")).toEqual({ ok: false, reason: "not_found" });
  });
  it("invitation-only types need the invite code, and never reveal it", async () => {
    expect(await svc.publicMeetingType("private-architecture-session")).toEqual({ ok: false, reason: "invitation_required" });
    expect(await svc.publicMeetingType("private-architecture-session", "wrong")).toEqual({ ok: false, reason: "invitation_required" });
    const r = await svc.publicMeetingType("private-architecture-session", "private-preview");
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r)).not.toContain("private-preview");
    expect(await code(svc.publicSlots("private-architecture-session", undefined, ...range()))).toBe("invitation_required");
    expect((await svc.publicSlots("private-architecture-session", "private-preview", ...range())).length).toBeGreaterThan(0);
  });
  it("offers slots on the right weekdays for each type", async () => {
    const days = async (slug: string, invite?: string) => new Set((await svc.publicSlots(slug, invite, ...range(35))).map((s) => weekdayOf(localDate(Date.parse(s.startUtc), TZ))));
    expect([...(await days("discovery-conversation"))].sort()).toEqual([2, 3, 4]);
    expect([...(await days("business-architecture-assessment"))]).toEqual([5]);
    expect([...(await days("private-architecture-session", "private-preview"))].sort()).toEqual([1, 3]);
  });
});

describe("booking", () => {
  it("confirms a booking and returns only public details", async () => {
    const slot = await firstSlot();
    const { booking, replay } = await book(slot.startUtc);
    expect(replay).toBe(false);
    expect(booking.status).toBe("confirmed");
    expect(booking.guestFirstName).toBe("Test");
    expect(booking.zoom.status).toBe("ready");
    expect(booking.zoom.joinUrl).toMatch(/simulated-zoom/);
    expect(JSON.stringify(booking)).not.toMatch(/example\.com"|@|"id"/); // no email, no internal id
    expect(booking.reference).toMatch(/^[A-Za-z0-9_-]{24}$/); // 144-bit opaque token
    const d = await store.read();
    const stored = d.bookings.find((b) => b.reference === booking.reference)!;
    expect(stored.guestEmail).toBe("test.guest@example.com");
    expect(d.outbox[0]).toMatchObject({ kind: "confirmation", to: "test.guest@example.com", simulated: true });
    expect(d.outbox[0].body).toContain("We're on the calendar.");
    expect(d.activity[0].kind).toBe("booking_created");
  });

  it("stores and shows the booking in the guest's own zone", async () => {
    const slot = await firstSlot();
    const { booking } = await book(slot.startUtc, { guestTimeZone: "Australia/Sydney" });
    expect(booking.guestTimeZone).toBe("Australia/Sydney");
    expect(booking.startUtc).toBe(slot.startUtc);
    // On 27 Oct 2026 Sydney (AEDT, UTC+11) is 15 hours ahead of Toronto (EDT, UTC-4).
    const start = Date.parse(booking.startUtc);
    expect((zonedParts(start, "Australia/Sydney").hour - zonedParts(start, TZ).hour + 24) % 24).toBe(15);
  });

  it("removes a booked time from the offered slots", async () => {
    const slot = await firstSlot();
    await book(slot.startUtc);
    expect((await svc.publicSlots("discovery-conversation", undefined, ...range())).map((s) => s.startUtc)).not.toContain(slot.startUtc);
  });

  it("refuses a second booking of the same slot, even with a fresh request key", async () => {
    const slot = await firstSlot();
    await book(slot.startUtc);
    expect(await code(book(slot.startUtc))).toBe("slot_unavailable");
    expect((await store.read()).bookings.filter((b) => b.startUtc === slot.startUtc && b.status === "confirmed")).toHaveLength(1);
  });

  it("holds under concurrency: five simultaneous requests for one slot produce exactly one booking", async () => {
    const slot = await firstSlot();
    const results = await Promise.all(Array.from({ length: 5 }, (_, i) => code(book(slot.startUtc, { guestEmail: `guest${i}@example.com` }))));
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "slot_unavailable")).toHaveLength(4);
    expect((await store.read()).bookings.filter((b) => b.startUtc === slot.startUtc && b.status === "confirmed")).toHaveLength(1);
  });

  it("is idempotent: a retried request returns the same booking, creates nothing and sends nothing twice", async () => {
    const slot = await firstSlot();
    const k = key();
    const first = await book(slot.startUtc, { idempotencyKey: k });
    const outboxBefore = (await store.read()).outbox.length;
    const [again, concurrent] = await Promise.all([book(slot.startUtc, { idempotencyKey: k }), book(slot.startUtc, { idempotencyKey: k })]);
    expect(again.booking.reference).toBe(first.booking.reference);
    expect(concurrent.booking.reference).toBe(first.booking.reference);
    expect(again.replay && concurrent.replay).toBe(true);
    const d = await store.read();
    expect(d.outbox).toHaveLength(outboxBefore);
    expect(d.bookings.filter((b) => b.idempotencyKey === k)).toHaveLength(1);
  });
  it("refuses to reuse a request key for a different booking", async () => {
    const [a, b] = await svc.publicSlots("discovery-conversation", undefined, ...range());
    const k = key();
    await book(a.startUtc, { idempotencyKey: k });
    expect(await code(book(b.startUtc, { idempotencyKey: k }))).toBe("idempotency_conflict");
  });

  it("re-checks availability at confirmation, so a stale or invented time is refused", async () => {
    expect(await code(book("2026-10-31T15:00:00.000Z"))).toBe("slot_unavailable"); // a Saturday
    expect(await code(book("2026-10-27T13:31:00.000Z"))).toBe("slot_unavailable"); // not on the grid
    expect(await code(book("2025-01-01T15:00:00.000Z"))).toBe("slot_unavailable"); // the past
  });

  it("validates the guest's details", async () => {
    const slot = await firstSlot();
    expect(await code(book(slot.startUtc, { guestName: "  " }))).toBe("invalid_input");
    expect(await code(book(slot.startUtc, { guestEmail: "not-an-email" }))).toBe("invalid_input");
    expect(await code(book(slot.startUtc, { guestTimeZone: "EST" }))).toBe("invalid_input");
    expect(await code(book("garbage"))).toBe("invalid_input");
    expect((await store.read()).bookings.filter((b) => b.guestName === "Test Guest")).toHaveLength(0);
  });

  it("refuses an invitation-only booking without the code", async () => {
    const slot = (await svc.publicSlots("private-architecture-session", "private-preview", ...range(30)))[0];
    expect(await code(book(slot.startUtc, { slug: "private-architecture-session" }))).toBe("invitation_required");
    expect(await code(book(slot.startUtc, { slug: "private-architecture-session", invite: "private-preview" }))).toBe("ok");
  });

  it("fills a day up to its maximum and then stops offering it", async () => {
    // Private sessions are capped at one per day.
    const slots = await svc.publicSlots("private-architecture-session", "private-preview", ...range(30));
    const day = localDate(Date.parse(slots[0].startUtc), TZ);
    await book(slots[0].startUtc, { slug: "private-architecture-session", invite: "private-preview" });
    const left = (await svc.publicSlots("private-architecture-session", "private-preview", ...range(30))).filter((s) => localDate(Date.parse(s.startUtc), TZ) === day);
    expect(left).toHaveLength(0);
  });
});

describe("provider failures", () => {
  it("a calendar outage hides availability and refuses bookings rather than risk a double booking", async () => {
    const slot = await firstSlot();
    flags.outage = true;
    const before = (await store.read()).bookings.length;
    expect(await code(svc.publicSlots("discovery-conversation", undefined, ...range()))).toBe("calendar_unavailable");
    expect(await code(book(slot.startUtc))).toBe("calendar_unavailable");
    expect((await store.read()).bookings).toHaveLength(before);
    flags.outage = false;
    expect(await code(book(slot.startUtc))).toBe("ok"); // and recovers
  });
  it("a Zoom failure keeps the booking, marks the link pending and logs it for follow-up", async () => {
    flags.zoom = true;
    const slot = await firstSlot();
    const { booking } = await book(slot.startUtc);
    expect(booking.status).toBe("confirmed");
    expect(booking.zoom).toEqual({ status: "pending", joinUrl: null });
    const d = await store.read();
    expect(d.activity.some((a) => a.kind === "zoom_failed")).toBe(true);
    expect(d.outbox[0].body).toContain("your link will follow");
  });
});

describe("cancellation and rescheduling", () => {
  it("cancels once, frees the time and records the message", async () => {
    const slot = await firstSlot();
    const { booking } = await book(slot.startUtc);
    const id = (await store.read()).bookings.find((b) => b.reference === booking.reference)!.id;
    await svc.cancelBooking(id);
    await svc.cancelBooking(id); // idempotent
    const d = await store.read();
    expect(d.bookings.find((b) => b.id === id)!.status).toBe("canceled");
    expect(d.outbox.filter((m) => m.kind === "cancellation" && m.bookingId === id)).toHaveLength(1);
    expect((await svc.publicSlots("discovery-conversation", undefined, ...range())).map((s) => s.startUtc)).toContain(slot.startUtc);
    expect(await code(book(slot.startUtc))).toBe("ok"); // the freed time can be booked again
  });
  it("reschedules to another valid slot, frees the old one and refuses invalid targets", async () => {
    const all = await svc.publicSlots("discovery-conversation", undefined, ...range());
    const after = (s: { startUtc: string }, hours: number) => all.find((x) => Date.parse(x.startUtc) >= Date.parse(s.startUtc) + hours * 3_600_000)!; // far enough away that no buffer touches
    const a = all[0], b = after(a, 1), c = after(b, 1);
    const { booking } = await book(a.startUtc);
    const id = (await store.read()).bookings.find((x) => x.reference === booking.reference)!.id;
    await book(c.startUtc, { guestEmail: "other@example.com" });
    await svc.rescheduleBooking(id, b.startUtc);
    const moved = (await store.read()).bookings.find((x) => x.id === id)!;
    expect(moved.startUtc).toBe(b.startUtc);
    expect(moved.events.at(-1)?.kind).toBe("rescheduled");
    expect((await svc.publicSlots("discovery-conversation", undefined, ...range())).map((s) => s.startUtc)).toContain(a.startUtc);
    expect(await code(svc.rescheduleBooking(id, c.startUtc))).toBe("slot_unavailable"); // someone else holds it
    expect(await code(svc.rescheduleBooking(id, "2026-10-31T15:00:00.000Z"))).toBe("slot_unavailable");
    expect((await store.read()).outbox.filter((m) => m.kind === "reschedule")).toHaveLength(1);
  });
  it("can move a booking by a few minutes into time it already occupies", async () => {
    const [a] = await svc.publicSlots("discovery-conversation", undefined, ...range());
    const { booking } = await book(a.startUtc);
    const id = (await store.read()).bookings.find((x) => x.reference === booking.reference)!.id;
    const slots = await svc.adminSlots("mt-discovery", ...range(), id);
    expect(slots.map((s) => s.startUtc)).toContain(a.startUtc);
  });
  it("does not reschedule a canceled booking, and resends only for live ones", async () => {
    const [a, b] = await svc.publicSlots("discovery-conversation", undefined, ...range());
    const { booking } = await book(a.startUtc);
    const id = (await store.read()).bookings.find((x) => x.reference === booking.reference)!.id;
    const r = await svc.resendConfirmation(id);
    expect(r.to).toBe("test.guest@example.com");
    expect((await store.read()).outbox[0].kind).toBe("confirmation_resend");
    await svc.cancelBooking(id);
    expect(await code(svc.rescheduleBooking(id, b.startUtc))).toBe("conflict");
    expect(await code(svc.resendConfirmation(id))).toBe("conflict");
    expect(await code(svc.cancelBooking("missing"))).toBe("not_found");
  });
});

describe("community invitation", () => {
  const ref = async () => { const { booking } = await book((await firstSlot()).startUtc); return booking.reference; };
  it("starts unseen, is shown once, and an answer is recorded once", async () => {
    const r = await ref();
    expect((await svc.publicBooking(r))!.community).toBe("unseen");
    expect(await svc.recordCommunity(r, "shown")).toBe("shown");
    expect(await svc.recordCommunity(r, "shown")).toBe("shown");
    expect(await svc.recordCommunity(r, "joined")).toBe("joined");
    expect(await svc.recordCommunity(r, "declined")).toBe("joined"); // later clicks change nothing
    const d = await store.read();
    expect(d.consents).toHaveLength(1);
    expect(d.consents[0]).toMatchObject({ choice: "joined", simulated: false, source: "booking_confirmation", wordingVersion: "scheduling-community-v2" });
    expect(Date.parse(d.consents[0].at)).not.toBeNaN();                                                                  // the timestamp is stored
    expect(d.consents[0].wording).toContain("Yes, keep me in the loop");
  });
  it("closing the invitation records no consent and never enrolls anyone", async () => {
    const r = await ref();
    await svc.recordCommunity(r, "shown");
    expect(await svc.recordCommunity(r, "dismissed")).toBe("dismissed");
    const d = await store.read();
    expect(d.consents.filter((c) => c.choice === "joined")).toHaveLength(0);
    expect((await svc.publicBooking(r))!.community).toBe("dismissed");
  });
  it("declining is recorded as a decline", async () => {
    const r = await ref();
    expect(await svc.recordCommunity(r, "declined")).toBe("declined");
    expect((await store.read()).consents[0].choice).toBe("declined");
  });
  it("the sample confirmation is available and can be replayed", async () => {
    expect((await svc.publicBooking(DEMO_REFERENCE))?.meetingName).toBe("Discovery Conversation");
    await svc.recordCommunity(DEMO_REFERENCE, "declined");
    await svc.replayCommunity(DEMO_REFERENCE);
    expect((await svc.publicBooking(DEMO_REFERENCE))!.community).toBe("unseen");
  });
});

describe("administrator configuration", () => {
  const base = async () => (await store.read()).meetingTypes[1];
  it("creates a meeting type with its own link, defaults and an invite code when invitation-only", async () => {
    const t = await svc.saveMeetingType({ slug: "founder-clinic", name: "Founder Clinic", description: "x", durationMinutes: 45, visibility: "invitation", minNoticeHours: 24, bufferBeforeMinutes: 15, bufferAfterMinutes: 30, maxPerDay: null, slotIntervalMinutes: 15, active: true });
    expect(t.inviteCode).toMatch(/^[a-z0-9_-]{12}$/);
    expect(Object.keys(t.availability.weekly).sort()).toEqual(["1", "2", "3", "4", "5"]);
    expect((await svc.publicMeetingType("founder-clinic", t.inviteCode)).ok).toBe(true);
    expect((await svc.publicSlots("founder-clinic", t.inviteCode, ...range())).length).toBeGreaterThan(0);
  });
  it("edits an existing type and the change reaches visitors", async () => {
    const t = await base();
    await svc.saveMeetingType({ ...t, durationMinutes: 45, name: "Assessment (45)" });
    const slots = await svc.publicSlots("business-architecture-assessment", undefined, ...range(35));
    expect(Date.parse(slots[0].endUtc) - Date.parse(slots[0].startUtc)).toBe(45 * 60_000);
    expect((await svc.publicMeetingType("business-architecture-assessment") as { type: { name: string } }).type.name).toBe("Assessment (45)");
  });
  it("rejects duplicate links, reserved links and invalid values", async () => {
    const t = await base();
    expect(await code(svc.saveMeetingType({ ...t, id: undefined, name: "Copy" }))).toBe("conflict");
    expect(await code(svc.saveMeetingType({ ...t, id: undefined, slug: "confirmed" }))).toBe("invalid_input");
    expect(await code(svc.saveMeetingType({ ...t, slug: "Bad Slug" }))).toBe("invalid_input");
    expect(await code(svc.saveMeetingType({ ...t, durationMinutes: 1 }))).toBe("invalid_input");
  });
  it("saves availability for one type without touching the others", async () => {
    const before = (await store.read()).meetingTypes;
    await svc.saveAvailability("mt-assessment", { weekly: { "1": [{ start: "09:00", end: "11:00" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 30 });
    const days = new Set((await svc.publicSlots("business-architecture-assessment", undefined, ...range(35))).map((s) => weekdayOf(localDate(Date.parse(s.startUtc), TZ))));
    expect([...days]).toEqual([1]);
    const after = (await store.read()).meetingTypes;
    expect(after[0]).toEqual(before[0]);
    expect(await code(svc.saveAvailability("mt-assessment", { weekly: { "1": [{ start: "11:00", end: "09:00" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 30 }))).toBe("invalid_input");
  });
  it("changes the home time zone, and slots follow", async () => {
    const before = (await svc.publicSlots("discovery-conversation", undefined, ...range()))[0];
    expect(await code(svc.saveSettings({ homeTimeZone: "EST" }))).toBe("invalid_input");
    await svc.saveSettings({ homeTimeZone: "Europe/London" });
    const london = createMockGoogleCalendar({ homeTimeZone: () => "Europe/London", outage: () => false });
    const svc2 = new SchedulingService({ store, now: () => NOW, calendar: london, zoom: createMockZoom({ failing: () => false }) });
    const after = (await svc2.publicSlots("discovery-conversation", undefined, ...range()))[0];
    expect(after.startUtc).not.toBe(before.startUtc);
    expect(formatTime(Date.parse(after.startUtc), "Europe/London")).toBe("9:30 AM");
  });
  it("reset restores the sample data", async () => {
    await svc.saveSettings({ homeTimeZone: "Europe/London" });
    await svc.resetPrototype();
    expect((await store.read()).settings.homeTimeZone).toBe("Asia/Bangkok");
    expect((await store.read()).meetingTypes).toHaveLength(3);
  });
});
