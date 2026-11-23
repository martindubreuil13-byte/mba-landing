import { describe, expect, it, vi } from "vitest";
import { INTRO_BOOKING_MINUTES, INTRO_BOOKING_PATH } from "@/app/lib/booking";
import { seedMeetingTypes } from "@/app/lib/scheduling/seed";
import { INTRO_MEETING_SLUG, MESSAGE_PATH, createBookingDestinationResolver, type DestinationDeps } from "./booking-destination";

const BOOKING = { kind: "booking", href: "/book/complementary-session?source=rearchitecture" };

function setup(over: Partial<DestinationDeps> = {}) {
  let t = 1_000_000;
  const lookup = vi.fn<DestinationDeps["lookup"]>(async () => ({ ok: true }));
  const intakeEnabled = vi.fn(() => true);
  const resolve = createBookingDestinationResolver({ intakeEnabled, lookup, now: () => t, ...over });
  return { resolve, lookup, intakeEnabled, advance: (ms: number) => { t += ms; } };
}

describe("booking destination", () => {
  it("uses the existing complimentary-session booking route, tagged with its origin, when public booking is available", async () => {
    const { resolve, lookup } = setup();
    expect(await resolve()).toEqual(BOOKING);
    expect(lookup).toHaveBeenCalledWith("complementary-session");
    expect(INTRO_BOOKING_PATH).toBe("/book/complementary-session");
    expect(INTRO_MEETING_SLUG).toBe("complementary-session");
  });

  it("falls back to /lets-talk, without touching the scheduling store, when public intake or scheduling is off", async () => {
    const { resolve, lookup } = setup({ intakeEnabled: () => false });
    expect(await resolve()).toEqual({ kind: "message", href: "/lets-talk", reason: "intake_off" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each([["not_found"], ["invitation_required"]])("falls back to /lets-talk when the meeting type is unavailable (%s)", async (reason) => {
    const { resolve } = setup({ lookup: async () => ({ ok: false, reason }) });
    expect(await resolve()).toEqual({ kind: "message", href: MESSAGE_PATH, reason: "meeting_type_unavailable" });
  });

  it("falls back to /lets-talk when the lookup fails, and tries again shortly", async () => {
    const lookup = vi.fn<DestinationDeps["lookup"]>().mockRejectedValueOnce(new Error("database unreachable")).mockResolvedValue({ ok: true });
    const { resolve, advance } = setup({ lookup });
    expect(await resolve()).toEqual({ kind: "message", href: MESSAGE_PATH, reason: "lookup_failed" });
    expect(await resolve()).toMatchObject({ reason: "lookup_failed" }); // remembered for a few seconds, not hammered
    expect(lookup).toHaveBeenCalledTimes(1);
    advance(11_000);
    expect(await resolve()).toEqual(BOOKING);
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it("remembers a good answer briefly, then asks again, so a deactivated meeting type is noticed within a minute", async () => {
    const lookup = vi.fn<DestinationDeps["lookup"]>().mockResolvedValueOnce({ ok: true }).mockResolvedValue({ ok: false, reason: "not_found" });
    const { resolve, advance } = setup({ lookup });
    expect(await resolve()).toEqual(BOOKING);
    advance(30_000);
    expect(await resolve()).toEqual(BOOKING);
    expect(lookup).toHaveBeenCalledTimes(1);
    advance(31_000);
    expect(await resolve()).toMatchObject({ kind: "message", reason: "meeting_type_unavailable" });
  });

  it("re-checks the flags on every call, even while a booking answer is remembered", async () => {
    let on = true;
    const { resolve } = setup({ intakeEnabled: () => on });
    expect(await resolve()).toEqual(BOOKING);
    on = false;
    expect(await resolve()).toMatchObject({ kind: "message", reason: "intake_off" });
  });
});

describe("local development seed", () => {
  const type = seedMeetingTypes().find((m) => m.slug === INTRO_MEETING_SLUG);

  it("includes the complimentary-session meeting type that the introductory booking link points at", () => {
    expect(type).toBeDefined();
    expect(type).toMatchObject({ active: true, visibility: "public", durationMinutes: INTRO_BOOKING_MINUTES, format: "zoom" });
  });

  it("keeps meeting-type ids and slugs unique", () => {
    const all = seedMeetingTypes();
    expect(new Set(all.map((m) => m.id)).size).toBe(all.length);
    expect(new Set(all.map((m) => m.slug)).size).toBe(all.length);
  });
});
