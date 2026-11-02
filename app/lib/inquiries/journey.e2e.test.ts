/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", async (orig) => ({ ...(await orig<object>()), after: (t: () => unknown) => t() }));
import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = vi.hoisted(() => ({ current: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.current.client() }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => true, getClientIp: () => "unknown" }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: async () => null }));

import { submitInquiry } from "./submit";
import { inquiryPrefill, refOrigin } from "@/app/lib/scheduling/adapters/inquiry-prefill";
import { linkBookingOrigin } from "@/app/lib/scheduling/adapters/booking-origin";
import { listJourney } from "./journey";
import { signContext } from "./context";
import { buildSeedData } from "@/app/lib/scheduling/seed";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "@/app/lib/scheduling/providers";
import { SchedulingService } from "@/app/lib/scheduling/service";
import { MemoryStore } from "@/app/lib/scheduling/store";

/**
 * The whole journey with every outside party faked: a visitor writes, is answered, follows the link, books, and the administrator's list follows the
 * booking through to its cancellation. Nothing real is called.
 */
const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";

beforeEach(() => {
  db.current = new FakeDb();
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-for-tests"); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "");
  vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true"); vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", "");
});

describe("inquiry -> link -> booking -> admin list -> cancellation", () => {
  it("follows the visitor from their message to their canceled booking", async () => {
    // 1. A visitor writes. The reply carries their private link.
    const sent: any[] = [];
    const r = await submitInquiry(
      { name: "Ada Lovelace", email: "ada@example.test", situation: "Program 03", message: "I would like to talk.", attribution: {}, clientKey: "journey-key-0123456789" },
      { notifyTo: "owner@example.test", send: async (p) => { sent.push(p); return { data: { id: `msg_${sent.length}` }, error: null }; } },
    );
    if (!r.ok) throw new Error("inquiry failed");
    const link = (sent[1].text as string).match(/#r=([A-Za-z0-9_-]+)/)?.[1];
    expect(link).toBe(r.bookingRef);

    // 2. The booking page exchanges the reference for the visitor's details and a context.
    const service = { inquiryPrefill: (ref: string) => inquiryPrefill(ref), refOriginOf: (ref: string) => refOrigin(ref) };
    const prefill = await (SchedulingService.prototype as any).prefillFor.call(service, link);
    const origin = await (SchedulingService.prototype as any).originFor.call(service, link);
    expect(prefill).toEqual({ name: "Ada Lovelace", email: "ada@example.test" });
    const context = signContext(origin);

    // 3. They book, sending the context. The real booking rules run; only the outside providers are faked.
    const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
    const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email: createSimulatedEmail(), now: () => NOW, defer: () => {}, bookingOrigin: linkBookingOrigin });
    const t = await svc.saveMeetingType({ slug: "talk-journey", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
      availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
    // The mock booking store and the database tables the admin reads are separate here, so the booking is mirrored by id into the table the admin reads.
    const { booking } = await svc.createBooking({ slug: t.slug, startUtc: `${DAY}T10:00:00Z`, guestName: prefill.name, guestEmail: prefill.email, guestTimeZone: "UTC", idempotencyKey: "journey-booking-0001", source: "inquiry-pre-architecture", originContext: context });
    const stored = (await (svc as any).repo.getBooking((await (svc as any).repo.findByIdempotencyKey("journey-booking-0001")).id));
    db.current.tables.sched_settings.push({ home_time_zone: "UTC" });
    db.current.tables.sched_bookings.push({ id: stored.id, status: "confirmed", start_at: stored.startUtc, created_at: "2031-02-20T12:00:00Z" });
    expect(booking.reference).toBeTruthy();
    expect(db.current.tables.booking_origins).toMatchObject([{ booking_id: stored.id, origin_type: "inquiry", inquiry_id: db.current.tables.program_inquiries[0].id }]);

    // 4. The administrator's list shows the inquiry with its booking.
    let rows = (await listJourney(50, NOW)).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Ada Lovelace", email: "ada@example.test", contact: { text: "You were notified" }, booking: { tone: "ok" } });
    expect(rows[0].booking.text).toMatch(/^Booked: .*Feb 21/);

    // 5. It is rescheduled, then canceled: the list follows with nothing copied.
    db.current.tables.sched_booking_events.push({ booking_id: stored.id, kind: "rescheduled" });
    expect((await listJourney(50, NOW)).rows[0].booking.text).toContain("(rescheduled)");
    db.current.tables.sched_bookings[0].status = "canceled";
    rows = (await listJourney(50, NOW)).rows;
    expect(rows[0].booking).toMatchObject({ tone: "bad", text: expect.stringContaining("Canceled (was") });
  });

  it("a visitor who books with no link is shown only as a hint, never as a booking", async () => {
    db.current.tables.leads.push({ id: "l1", email: "ada@example.test" });
    db.current.tables.program_inquiries.push({ id: "11111111-1111-4111-8111-111111111111", lead_id: "l1", full_name: "Ada", program_slug: null, message: "m", owner_status: "accepted", auto_reply_status: "accepted", created_at: "2031-02-19T10:00:00Z", message_purged_at: null });
    db.current.tables.sched_bookings.push({ id: "b9", status: "confirmed", start_at: "2031-02-25T10:00:00Z", created_at: "2031-02-20T10:00:00Z" });
    db.current.tables.sched_attendees.push({ booking_id: "b9", email: "ada@example.test" });
    const row = (await listJourney(50, NOW)).rows[0];
    expect(row.booking.tone).toBe("hint"); expect(row.booking.text).toContain("not linked");
    expect(db.current.tables.booking_origins).toHaveLength(0);
  });
});
