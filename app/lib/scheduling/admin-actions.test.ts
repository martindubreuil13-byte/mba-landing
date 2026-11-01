import { beforeEach, describe, expect, it } from "vitest";
import { adminAction } from "./admin-actions";
import { createMockGoogleCalendar, createMockZoom } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";

const NOW = Date.parse("2026-10-26T12:00:00Z");
let svc: SchedulingService, store: MemoryStore;
beforeEach(async () => {
  store = new MemoryStore(await buildSeedData(NOW));
  svc = new SchedulingService({ store, now: () => NOW, calendar: createMockGoogleCalendar({ homeTimeZone: () => "America/Toronto", outage: () => false }), zoom: createMockZoom({ failing: () => false }) });
});
const act = (method: string, path: string, body: Record<string, unknown> = {}) => {
  const u = new URL(`http://x/${path}`);
  return adminAction(svc, method, u.pathname.split("/").filter(Boolean), u, body);
};
const attempt = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string }) => e.code ?? "error");

describe("the shared admin action dispatcher", () => {
  it("lists slots for a meeting type", async () => {
    const r = await act("GET", "slots?typeId=mt-discovery&from=2026-10-27T00:00:00Z&to=2026-11-05T00:00:00Z");
    expect(r.status).toBe(200);
    expect((r.body.slots as unknown[]).length).toBeGreaterThan(0);
  });
  it("rejects the wrong method and unknown paths", async () => {
    expect((await act("POST", "slots")).status).toBe(405);
    expect((await act("GET", "reset")).status).toBe(405);
    expect((await act("GET", "nope")).status).toBe(404);
    expect((await act("POST", "bookings/x/explode")).status).toBe(404);
    expect((await act("POST", "bookings")).status).toBe(404);
  });
  it("cancels, reschedules and resends through the booking routes", async () => {
    const b = (await store.read()).bookings.find((x) => x.guestName === "Amelia Hart")!;
    const next = (await svc.adminSlots(b.meetingTypeId, new Date(NOW).toISOString(), new Date(NOW + 20 * 86_400_000).toISOString(), b.id)).find((s) => Date.parse(s.startUtc) > Date.parse(b.startUtc) + 7 * 86_400_000)!;
    expect((await act("POST", `bookings/${b.id}/reschedule`, { startUtc: next.startUtc })).status).toBe(200);
    expect((await store.read()).bookings.find((x) => x.id === b.id)!.startUtc).toBe(next.startUtc);
    const resent = await act("POST", `bookings/${b.id}/resend`);
    expect(resent.body).toMatchObject({ simulated: true, to: "amelia.hart@example.com" });
    expect((await act("POST", `bookings/${b.id}/cancel`)).status).toBe(200);
    expect((await store.read()).bookings.find((x) => x.id === b.id)!.status).toBe("canceled");
    expect(await attempt(act("POST", `bookings/${b.id}/reschedule`, { startUtc: next.startUtc }))).toBe("conflict");
  });
  it("saves meeting types, availability and settings, and resets", async () => {
    const t = (await store.read()).meetingTypes[0];
    const saved = await act("POST", "meeting-types", { ...t, name: "Discovery (renamed)" });
    expect((saved.body.meetingType as { name: string }).name).toBe("Discovery (renamed)");
    expect((await act("PUT", "availability/mt-discovery", { weekly: { "2": [{ start: "09:00", end: "11:00" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 30 })).status).toBe(200);
    expect(await attempt(act("PUT", "availability/mt-discovery", { weekly: { "2": [{ start: "11:00", end: "09:00" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 30 }))).toBe("invalid_input");
    expect((await act("PUT", "settings", { homeTimeZone: "Europe/London", simulate: { zoomFailure: true } })).body).toMatchObject({ settings: { homeTimeZone: "Europe/London", simulate: { zoomFailure: true } } });
    expect(await attempt(act("PUT", "settings", { homeTimeZone: "EST" }))).toBe("invalid_input");
    await act("POST", "reset");
    expect((await store.read()).settings.homeTimeZone).toBe("America/Toronto");
  });
  it("re-arms the community invitation on sample bookings only, never on a real booking", async () => {
    await svc.recordCommunity("demo-confirmation", "declined");
    await act("POST", "reset", { replayCommunity: "demo-confirmation" });
    expect((await svc.publicBooking("demo-confirmation"))!.community).toBe("unseen");
    const slot = (await svc.publicSlots("discovery-conversation", undefined, new Date(NOW).toISOString(), new Date(NOW + 14 * 86_400_000).toISOString()))[0];
    const { booking } = await svc.createBooking({ slug: "discovery-conversation", startUtc: slot.startUtc, guestName: "Real Guest", guestEmail: "real@example.com", guestTimeZone: "Europe/London", idempotencyKey: "real-guest-key-1" });
    await svc.recordCommunity(booking.reference, "declined");
    await act("POST", "reset", { replayCommunity: booking.reference });
    expect((await svc.publicBooking(booking.reference))!.community).toBe("declined");
  });
});
