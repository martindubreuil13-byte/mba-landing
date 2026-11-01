import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { adminAction } from "./admin-actions";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, type MockCalendar, type MockEmail, type MockZoom } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { compareZoom, zoomMarkerFor } from "./sync";
import { ZoomClient } from "./adapters/zoom";
import { bookingRows } from "./admin-views";
import ZoomResolvePanel from "@/app/components/admin/scheduling/ZoomResolvePanel";
import type { Booking, MeetingType } from "./types";

/**
 * Phase 2G: regression tests for the three findings of the independent Phase 2F verification (docs/mba-scheduling/PHASE2F-INDEPENDENT-VERIFICATION.md):
 * F-01 a stale cleanup deleted a newly adopted meeting, F-02 an ordinary Retry authorised another create after an uncertain outcome, F-03 missing Zoom
 * fields counted as verification. Each group starts from Codex's own reproducer, restated with the SAFE outcome as the assertion. Mocks only.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t() }));

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
type Fx = Awaited<ReturnType<typeof fx>>;

async function fx() {
  const clock = { now: NOW };
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const cal: MockCalendar = createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false });
  const zoom: MockZoom = createMockZoom({ failing: () => false });
  const email: MockEmail = createSimulatedEmail();
  const store = new MemoryStore(seed);
  const make = () => new SchedulingService({ store, calendar: cal, zoom, email, now: () => clock.now, defer: () => {} });
  const svc = make();
  const type = await svc.saveMeetingType({ slug: "talk-2g", name: "Talk 2G", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  let n = 0;
  const book = async (hhmm = "10:00") => {
    const { booking } = await svc.createBooking({ slug: type.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: "Guest Two-G", guestEmail: `guest2g${++n}@example.test`, guestTimeZone: "UTC", idempotencyKey: `phase2g-key-${n}-${hhmm}` });
    return (await svc.repo.getBookingByReference(booking.reference))!;
  };
  /** A second meeting carrying the booking's marker, as an old retry or a stalled worker leaves behind. */
  const duplicate = (b: Booking) => f_zoomCreate(zoom, b);
  return { svc, cal, zoom, email, store, make, book, type, clock, duplicate, advance: (ms: number) => { clock.now += ms; } };
}
const f_zoomCreate = (zoom: MockZoom, b: Booking) => zoom.createMeeting({ topic: "Talk 2G", startUtc: b.startUtc, durationMinutes: 30, timeZone: "UTC", marker: zoomMarkerFor(b.id) });
const refOf = async (f: Fx, id: string) => (await f.svc.repo.listRefs(id)).find((r) => r.provider === "zoom");
const syncOf = async (f: Fx, id: string) => (await f.svc.repo.getBooking(id))!.sync!;
const retryUrl = new URL("http://localhost:3000/api/admin/scheduling/bookings/x/retry-sync");
const admin = (f: Fx, id: string, action: string, body: Record<string, unknown> = {}) => adminAction(f.svc, "POST", ["bookings", id, action], retryUrl, body);

/** Holds the first call of a method until released (a worker stalled mid-operation). */
function gate<T extends object>(target: T, method: keyof T) {
  let release!: () => void, started!: () => void;
  const open = new Promise<void>((r) => (release = r)), begun = new Promise<void>((r) => (started = r));
  const original = (target[method] as unknown as (...a: unknown[]) => Promise<unknown>).bind(target);
  let calls = 0;
  (target as Record<string, unknown>)[method as string] = async (...a: unknown[]) => { if (++calls === 1) { started(); await open; } return original(...a); };
  return { release: () => release(), begun };
}
/** A booking whose create outcome is unknown: Zoom created the meeting, the answer was lost, and the list does not show it. */
async function uncertain(f: Fx) {
  const b = await f.book();
  const find = f.zoom.findMeetingsByMarker.bind(f.zoom), list = f.zoom.listMarkedMeetings.bind(f.zoom);
  f.zoom.findMeetingsByMarker = async () => []; f.zoom.listMarkedMeetings = async () => []; f.zoom.loseNextResponse = true;
  await f.svc.sync.run(b.id);
  return { b, intentAt: (await refOf(f, b.id))!.createIntentAt!, reveal: () => { f.zoom.findMeetingsByMarker = find; f.zoom.listMarkedMeetings = list; } };
}

afterEach(() => vi.unstubAllEnvs());

// ===================================================================================================================== F-01 ownership
describe("F-01 a deletion decided on old information can never remove a meeting that has since become authoritative", () => {
  it("Codex's exact interleaving: cleanup picks B as surplus and pauses, A disappears, recovery proceeds. The booking ends with a REAL, verified meeting and the scan sees it", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    const extra = await f.duplicate(b);
    const held = gate(f.zoom, "deleteMeeting"); const scan = f.svc.sync.scanZoom(); await held.begun;   // B is condemned; its deletion is paused
    f.zoom.meetings.delete(a);                                                                              // A is removed externally
    await f.svc.sync.run(b.id); await f.svc.sync.run(b.id);                                                  // recovery: A is gone, B is condemned, so it must not be adopted
    const mid = await refOf(f, b.id);
    expect(mid).toMatchObject({ status: "synced" }); expect(mid!.externalId).not.toBe(extra.meetingId); expect(mid!.externalId).not.toBe(a);
    held.release(); await scan;
    expect([...f.zoom.meetings.keys()]).toEqual([mid!.externalId]);                                          // Codex's run ended with NO meeting and sync ok
    expect(f.zoom.meetings.has(extra.meetingId)).toBe(false);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    await f.svc.sync.scanZoom(); expect((await f.svc.sync.reconcile()).requeued).toEqual([]);
    expect(f.zoom.meetings.has((await refOf(f, b.id))!.externalId!)).toBe(true);                             // what the database calls current EXISTS
    expect((await syncOf(f, b.id)).status).toBe("ok");
  });
  it("the other order: the meeting is adopted BEFORE the paused cleanup condemns it. The cleanup is refused ('owned') and stands down", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    const extra = await f.duplicate(b);
    const held = gate(f.svc.repo, "condemnZoomMeeting"); const scan = f.svc.sync.scanZoom(); await held.begun;   // the decision is made, nothing condemned yet
    f.zoom.meetings.delete(a);
    await f.svc.sync.run(b.id); await f.svc.sync.run(b.id);                                                  // recovery adopts B (the only meeting there is)
    expect((await refOf(f, b.id))!.externalId).toBe(extra.meetingId);
    held.release(); await scan;                                                                              // the stale decision is revalidated by the database
    expect(f.zoom.meetings.has(extra.meetingId)).toBe(true);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true); expect((await refOf(f, b.id))!.externalId).toBe(extra.meetingId);
  });
  it("the database refuses to condemn the authoritative meeting, and refuses to record a condemned one", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    expect(await f.svc.repo.condemnZoomMeeting(b.id, a, "test")).toBe("owned");
    const other = await f.duplicate(b);
    expect(await f.svc.repo.condemnZoomMeeting(b.id, other.meetingId, "test")).toBe("condemned");
    expect(await f.svc.repo.condemnZoomMeeting(b.id, other.meetingId, "again")).toBe("condemned");            // idempotent
    await expect(f.svc.repo.upsertRef({ ...(await refOf(f, b.id))!, externalId: other.meetingId, url: "https://x", status: "synced" })).rejects.toMatchObject({ code: "condemned" });
    expect((await refOf(f, b.id))!.externalId).toBe(a);
  });
  it("a booking cannot condemn another booking's authoritative meeting", async () => {
    const f = await fx(); const one = await f.book("10:00"); const two = await f.book("12:00"); await f.svc.sync.run(one.id); await f.svc.sync.run(two.id);
    const theirs = (await refOf(f, two.id))!.externalId!;
    expect(await f.svc.repo.condemnZoomMeeting(one.id, theirs, "test")).toBe("owned");
  });
  it("a cleanup that fails after condemning (Zoom refuses the delete) leaves the meeting condemned: it cannot be adopted meanwhile, and the next scan finishes it", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    const extra = await f.duplicate(b);
    const del = f.zoom.deleteMeeting.bind(f.zoom); let fail = true;
    f.zoom.deleteMeeting = async (id) => { if (fail) throw new Error("Zoom unavailable"); return del(id); };
    await f.svc.sync.scanZoom();
    expect((await f.svc.repo.listZoomTombstones(b.id)).find((t) => t.externalId === extra.meetingId)).toMatchObject({ status: "pending" });
    f.zoom.meetings.delete(a);                                                                               // A vanishes while the condemned B is still there
    await f.svc.sync.run(b.id); await f.svc.sync.run(b.id);
    expect((await refOf(f, b.id))!.externalId).not.toBe(extra.meetingId);                                    // never adopted
    fail = false; await f.svc.sync.scanZoom();
    expect(f.zoom.meetings.has(extra.meetingId)).toBe(false);
    expect((await f.svc.repo.listZoomTombstones(b.id)).find((t) => t.externalId === extra.meetingId)).toMatchObject({ status: "deleted" });
    expect(f.zoom.meetings.size).toBe(1);
  });
  it("cancellation racing with adoption: the cancel removes the meeting, the stalled adopter cannot resurrect or record it", async () => {
    const f = await fx(); const b = await f.book(); f.zoom.loseNextResponse = true; await f.svc.sync.run(b.id);   // a meeting exists; the answer was lost
    const held = gate(f.zoom, "updateMeeting"); const adopter = f.svc.sync.run(b.id); await held.begun;        // adopting it, paused
    f.advance(301_000); await f.svc.cancelBooking(b.id);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);                                                       // the cancel pass (the lease lapsed)
    held.release(); expect(await adopter).toMatchObject({ skipped: true });
    expect(f.zoom.meetings.size).toBe(0); expect(f.zoom.creates).toBe(1);
    expect(await refOf(f, b.id)).toMatchObject({ status: "deleted" }); expect((await syncOf(f, b.id)).status).toBe("ok");
    await f.svc.runMaintenance(); await f.svc.runMaintenance(); expect(f.zoom.meetings.size).toBe(0);
  });
  it("cancellation racing with a paused surplus cleanup: everything is removed exactly once and the booking ends clean", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); await f.duplicate(b);
    const held = gate(f.zoom, "deleteMeeting"); const scan = f.svc.sync.scanZoom(); await held.begun;
    await f.svc.cancelBooking(b.id); expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    held.release(); await scan;
    expect(f.zoom.meetings.size).toBe(0); expect(await refOf(f, b.id)).toMatchObject({ status: "deleted" });
  });
  it("many recovery workers at once (scans, maintenance sweeps and direct passes) over duplicates: the recorded meeting survives and every duplicate goes", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    await f.duplicate(b); await f.duplicate(b); await f.duplicate(b);
    await Promise.all([...Array.from({ length: 6 }, () => f.svc.sync.scanZoom()), f.svc.runMaintenance(), f.svc.runMaintenance(), f.svc.sync.run(b.id), f.svc.sync.run(b.id)]);
    expect([...f.zoom.meetings.keys()]).toEqual([a]);
    expect((await refOf(f, b.id))!.externalId).toBe(a); expect((await f.svc.sync.run(b.id)).ok).toBe(true);
  });
  it("concurrent recovery with the recorded meeting gone: exactly one replacement is created and recorded", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    f.zoom.meetings.delete(a);
    await Promise.all(Array.from({ length: 5 }, () => f.svc.sync.run(b.id)));
    await f.svc.sync.run(b.id); await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.size).toBe(1); expect(f.zoom.meetings.has((await refOf(f, b.id))!.externalId!)).toBe(true);
  });
  it("a recorded meeting the LIST does not show is read directly by its id: still there (list lag) means nothing to do; said to be gone means repair; an unreachable Zoom concludes nothing", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const a = (await refOf(f, b.id))!.externalId!;
    f.zoom.listMarkedMeetings = async () => [];                                                              // the list lags: it shows nothing
    expect(await f.svc.sync.scanZoom()).toMatchObject({ ran: true, missing: 0, stale: 0, requeued: 0 });
    expect(f.zoom.creates).toBe(1); expect((await refOf(f, b.id))!.externalId).toBe(a);
    const get = f.zoom.getMeeting.bind(f.zoom);
    f.zoom.getMeeting = async () => { throw new Error("Zoom unreachable"); };
    expect(await f.svc.sync.scanZoom()).toMatchObject({ missing: 0, stale: 0 });
    expect((await syncOf(f, b.id)).status).toBe("ok");
    f.zoom.getMeeting = get; f.zoom.meetings.delete(a);                                                      // now it really is gone
    expect(await f.svc.sync.scanZoom()).toMatchObject({ missing: 1 });
    expect((await syncOf(f, b.id)).status).toBe("pending");
    await f.svc.sync.run(b.id); await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.size).toBe(1);
  });
  it("an old stale update after a reschedule still ends at the latest time (regression of Phase 2F)", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    await f.svc.rescheduleBooking(b.id, `${DAY}T11:00:00Z`);
    const held = gate(f.zoom, "updateMeeting"); const old = f.svc.sync.run(b.id); await held.begun;
    f.advance(301_000); await f.svc.rescheduleBooking(b.id, `${DAY}T13:00:00Z`); await f.svc.sync.run(b.id);
    held.release(); await old; await f.svc.sync.run(b.id);
    const id = (await refOf(f, b.id))!.externalId!;
    expect(f.zoom.meetings.get(id)!.startUtc).toBe(`${DAY}T13:00:00.000Z`);
  });
});

// ===================================================================================================================== F-02 retry vs resolution
describe("F-02 an ordinary Retry never authorises another create; resolving an uncertain creation is a separate, deliberate action", () => {
  it("Codex's exact request: an empty-body POST retry-sync after a lost create. No second meeting, intent intact, still needs a person", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    expect(f.zoom.creates).toBe(1);
    const r = await admin(f, b.id, "retry-sync");
    expect(r.status).toBe(200); expect(r.body.synced).toBe(false);
    expect(f.zoom.creates).toBe(1); expect(f.zoom.meetings.size).toBe(1);                                      // Codex's run: 2 and 2
    expect(Date.parse((await refOf(f, b.id))!.createIntentAt!)).toBe(Date.parse(intentAt));
  });
  it("repeated manual retries, hours apart, never create and never clear the uncertainty", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    for (const wait of [1, 60, 3600, 86_400, 86_400]) { f.advance(wait * 1000); await admin(f, b.id, "retry-sync"); }
    expect(f.zoom.creates).toBe(1);
    expect((await refOf(f, b.id))!.createIntentAt).toBeTruthy(); expect(Date.parse((await refOf(f, b.id))!.createIntentAt!)).toBe(Date.parse(intentAt));
    expect((await f.svc.readAll()).activity.filter((a) => a.kind === "zoom_review" && a.bookingId === b.id)).toHaveLength(1);   // and does not spam the feed
  });
  it("a retry still ADOPTS the meeting if the list shows it by then (that is what a safe retry is for) without creating anything", async () => {
    const f = await fx(); const { b, reveal } = await uncertain(f);
    reveal();
    const r = await admin(f, b.id, "retry-sync");
    expect(r.body.synced).toBe(true); expect(f.zoom.creates).toBe(1);
    expect(await refOf(f, b.id)).toMatchObject({ status: "synced", createIntentAt: null });
  });
  it("a plain retry of a KNOWN failure (no create outcome in question) still works as before", async () => {
    const f = await fx(); const b = await f.book(); f.zoom.failing = true;
    for (let i = 0; i < 9; i++) { f.advance(13 * 3_600_000); await f.svc.sync.run(b.id); }
    expect((await syncOf(f, b.id)).status).toBe("failed");
    f.zoom.failing = false; const r = await f.svc.retrySync(b.id);
    expect(r.ok).toBe(true); expect(f.zoom.meetings.size).toBe(1);
  });

  it("resolving: 'none exists' requires the acknowledgement, the current attempt and a list that shows nothing; then it creates exactly one more", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    await expect(admin(f, b.id, "resolve-zoom", { action: "none-exists", intentAt })).rejects.toMatchObject({ status: 400 });   // no acknowledgement
    expect((await admin(f, b.id, "resolve-zoom", { action: "bogus", intentAt })).status).toBe(400);
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt: new Date(Date.parse(intentAt) - 1000).toISOString(), acknowledgeDuplicateRisk: true })).rejects.toMatchObject({ status: 409 });   // a stale view
    expect(f.zoom.creates).toBe(1);
    const ok = await f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true });
    expect(ok.ok).toBe(true); expect(f.zoom.creates).toBe(2);
    expect((await refOf(f, b.id))!.createIntentAt ?? null).toBeNull();
    const decision = (await f.svc.readAll()).activity.find((a) => /accepted the risk of a duplicate/.test(a.summary));
    expect(decision).toBeTruthy(); expect(decision!.summary).toContain(zoomMarkerFor(b.id));                                // the decision is on record
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true })).rejects.toMatchObject({ status: 409 });   // nothing left to resolve
  });
  it("'none exists' is refused while the list shows a meeting for the booking: it points the administrator to adopt it", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    const m = [...f.zoom.meetings.values()][0];
    f.zoom.findMeetingsByMarker = async () => [{ meetingId: m.meetingId, joinUrl: m.joinUrl }];
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true })).rejects.toThrow(new RegExp(m.meetingId));
    expect(f.zoom.creates).toBe(1);
  });
  it("resolving by ADOPTION: the meeting must exist for the host, carry this booking's marker (or none), not be condemned or taken by another booking", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    const mine = [...f.zoom.meetings.values()][0];
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: "123", intentAt })).rejects.toMatchObject({ status: 400 });          // not a meeting number
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: "99999999999", intentAt })).rejects.toMatchObject({ status: 400 });   // Zoom has none
    f.zoom.meetings.set("55555555555", { ...mine, meetingId: "55555555555", marker: "mba-booking:someone-elses" });
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: "55555555555", intentAt })).rejects.toMatchObject({ status: 409 });   // another booking's
    await f.svc.repo.condemnZoomMeeting(b.id, "66666666666", "test"); f.zoom.meetings.set("66666666666", { ...mine, meetingId: "66666666666" });
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: "66666666666", intentAt })).rejects.toMatchObject({ status: 409 });   // condemned
    expect((await refOf(f, b.id))!.createIntentAt).toBeTruthy();                                                                                      // all refusals left the uncertainty alone
    const r = await f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: mine.meetingId, intentAt });
    expect(r.ok).toBe(true); expect(f.zoom.creates).toBe(1);
    expect(await refOf(f, b.id)).toMatchObject({ status: "synced", externalId: mine.meetingId, createIntentAt: null });
    expect((await syncOf(f, b.id)).status).toBe("ok");
  });
  it("adopting a meeting that already belongs to another booking is refused", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    const other = await f.book("12:00"); await f.svc.sync.run(other.id);
    const theirs = (await refOf(f, other.id))!.externalId!;
    f.zoom.meetings.get(theirs)!.marker = "";                                                                // a meeting with no marker, but recorded for the other booking
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: theirs, intentAt })).rejects.toMatchObject({ status: 409 });
    expect((await refOf(f, b.id))!.createIntentAt).toBeTruthy();
  });
  it("resolving cannot race a running worker: it needs the booking's lease first", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    const claim = await f.svc.repo.claimSync(b.id, new Date(f.clock.now).toISOString(), 300);   // a worker is mid-pass
    expect(claim).toBeTruthy();
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true })).rejects.toMatchObject({ status: 409 });
    expect(f.zoom.creates).toBe(1); expect((await refOf(f, b.id))!.createIntentAt).toBeTruthy();
  });
  it("two administrators resolving at once: one wins, the other is refused, one create", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    const out = await Promise.allSettled([1, 2, 3].map(() => f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true })));
    expect(out.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    expect(f.zoom.creates).toBe(2);
  });
  it("a second uncertain create after a resolution needs a NEW resolution: the old attempt's decision does not carry over", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    f.zoom.loseNextResponse = true; f.advance(5000);   // time passes between the attempts
    await f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true });   // the new create is lost as well
    const second = (await refOf(f, b.id))!.createIntentAt!;
    expect(second).toBeTruthy();
    await expect(f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true })).rejects.toMatchObject({ status: 409 });   // the first decision is stale
    expect(f.zoom.creates).toBe(2);
  });
  it("a canceled booking with an unresolved create is resolved the same deliberate way, and its meeting is then deleted", async () => {
    const f = await fx(); const { b, intentAt } = await uncertain(f);
    await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    expect((await syncOf(f, b.id)).status).toBe("failed");
    const mine = [...f.zoom.meetings.values()][0];
    await f.svc.resolveUncertainZoom(b.id, { action: "adopt", meetingId: mine.meetingId, intentAt });
    expect(f.zoom.meetings.size).toBe(0); expect(await refOf(f, b.id)).toMatchObject({ status: "deleted" });
  });

  describe("what the administrator is shown", () => {
    it("the booking row carries the uncertainty and the marker; a normal failure does not", async () => {
      const f = await fx(); const { b } = await uncertain(f);
      const row = bookingRows(await f.svc.readAll(), f.clock.now).find((r) => r.id === b.id)!;
      expect(row.zoom.uncertainSince).toBeTruthy(); expect(row.zoomMarker).toBe(zoomMarkerFor(b.id));
      const g = await fx(); const c = await g.book(); g.zoom.failing = true; await g.svc.sync.run(c.id);
      expect(bookingRows(await g.svc.readAll(), g.clock.now).find((r) => r.id === c.id)!.zoom.uncertainSince ?? null).toBeNull();
    });
    it("the panel says 'outcome unknown', shows the marker and the attempt time, warns of a duplicate, and offers adoption and an acknowledged 'allow a new meeting' (disabled until acknowledged)", () => {
      const html = renderToStaticMarkup(createElement(ZoomResolvePanel, { marker: "mba-booking:abc", since: "2031-02-21T10:00:00.000Z", tz: "UTC", busy: false, onAdopt: () => {}, onNone: () => {} }));
      expect(html).toContain("Zoom creation outcome unknown"); expect(html).toContain("may already have created it"); expect(html).toContain("mba-booking:abc");
      expect(html).toContain("Use this meeting"); expect(html).toContain("Allow a new meeting"); expect(html).toContain("accept that if I am wrong a duplicate");
      expect(html).toMatch(/<input[^>]*type="checkbox"(?![^>]*checked)/);                                    // nothing pre-ticked
      expect(html).toMatch(/<button[^>]*disabled[^>]*>Allow a new meeting/);
      expect(html).not.toMatch(/Retry now/);
    });
    it("the drawer no longer says 'Not created: gave up' for an uncertain creation, labels the safe action 'Check Zoom again', and sends resolutions to resolve-zoom", () => {
      const src = fs.readFileSync(path.resolve(__dirname, "../../components/admin/scheduling/BookingDrawer.tsx"), "utf8");
      expect(src).toMatch(/uncertainSince \? <span[^>]*>Creation outcome unknown/); expect(src).toMatch(/Check Zoom again/); expect(src).toMatch(/"resolve-zoom"/);
      expect(src).toMatch(/action: "adopt"/); expect(src).toMatch(/acknowledgeDuplicateRisk: true/);
    });
  });
});

// ===================================================================================================================== F-03 strict verification
describe("F-03 only a verified match counts as verified", () => {
  const type = { durationMinutes: 30 } as MeetingType;
  const booking = { startUtc: "2031-02-21T10:00:00.000Z" } as Booking;
  const ev = (m: Partial<{ meetingId: string; startUtc: string | null; durationMinutes: number | null }>) => compareZoom({ meetingId: "100", startUtc: "2031-02-21T10:00:00.000Z", durationMinutes: 30, ...m }, "100", booking, type);

  it("verified match / verified mismatch / insufficient evidence, field by field", () => {
    expect(ev({})).toBe("match");
    expect(ev({ startUtc: "2031-02-21T15:00:00.000Z" })).toBe("mismatch");
    expect(ev({ durationMinutes: 90 })).toBe("mismatch");
    expect(ev({ startUtc: "2031-02-21T15:00:00.000Z", durationMinutes: null })).toBe("mismatch");               // a reported wrong value is a mismatch even if the other field is missing
    expect(ev({ startUtc: null })).toBe("insufficient"); expect(ev({ durationMinutes: null })).toBe("insufficient");
    expect(ev({ startUtc: null, durationMinutes: null })).toBe("insufficient");
    expect(ev({ startUtc: "not a date" })).toBe("insufficient"); expect(ev({ durationMinutes: 0 })).toBe("insufficient"); expect(ev({ durationMinutes: -30 })).toBe("insufficient");
    expect(ev({ durationMinutes: Number.NaN })).toBe("insufficient");
    expect(ev({ meetingId: "" })).toBe("insufficient"); expect(ev({ meetingId: "999" })).toBe("insufficient");     // identity must be the expected meeting
  });
  it("Codex's exact case: Zoom at 15:00 for a 10:00 booking, read-back fields all null. The pass is NOT ok and the booking is not marked synchronised", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const id = (await refOf(f, b.id))!.externalId!;
    f.zoom.meetings.get(id)!.startUtc = `${DAY}T15:00:00.000Z`;
    f.zoom.getMeeting = async () => ({ meetingId: id, joinUrl: "https://zoom.us/j/mock", startUtc: null, durationMinutes: null });
    const r = await f.svc.sync.run(b.id);
    expect(r.ok).toBe(false); expect(r.errors.join()).toMatch(/cannot be verified/);
    expect((await syncOf(f, b.id)).status).toBe("pending");                                                    // Codex's run: ok
  });
  it("a wrong identity in the answer, a half-empty answer and a malformed one are all treated as insufficient, never as a match", async () => {
    for (const answer of [() => ({ meetingId: "someone-else", joinUrl: "x", startUtc: `${DAY}T10:00:00.000Z`, durationMinutes: 30 }),
                          (id: string) => ({ meetingId: id, joinUrl: "x", startUtc: `${DAY}T10:00:00.000Z`, durationMinutes: null }),
                          (id: string) => ({ meetingId: id, joinUrl: "x", startUtc: null, durationMinutes: 30 }),
                          () => ({ meetingId: "", joinUrl: "", startUtc: null, durationMinutes: null })]) {
      const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const id = (await refOf(f, b.id))!.externalId!;
      f.zoom.getMeeting = async () => answer(id);
      expect((await f.svc.sync.run(b.id)).ok).toBe(false);
    }
  });
  it("an incomplete answer is re-read once: a complete answer on the second read verifies", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const id = (await refOf(f, b.id))!.externalId!;
    const get = f.zoom.getMeeting.bind(f.zoom); let calls = 0;
    f.zoom.getMeeting = async (m) => (++calls === 1 ? { meetingId: id, joinUrl: "x", startUtc: null, durationMinutes: null } : get(m));
    expect((await f.svc.sync.run(b.id)).ok).toBe(true); expect(calls).toBe(2);
  });
  it("an incomplete answer is NOT repaired blindly (no update is sent on insufficient evidence), while a verified mismatch is", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const id = (await refOf(f, b.id))!.externalId!;
    const update = vi.spyOn(f.zoom, "updateMeeting");
    f.zoom.getMeeting = async () => ({ meetingId: id, joinUrl: "x", startUtc: null, durationMinutes: null });
    await f.svc.sync.run(b.id); expect(update).not.toHaveBeenCalled();
  });
  it("an API failure is a fourth, separate outcome: the pass fails with the error, nothing is repaired and nothing is called verified", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const update = vi.spyOn(f.zoom, "updateMeeting");
    f.zoom.getMeeting = async () => { throw new Error("Zoom is unavailable (503)."); };
    const r = await f.svc.sync.run(b.id);
    expect(r.ok).toBe(false); expect(r.errors.join()).toMatch(/503/); expect(update).not.toHaveBeenCalled();
    expect((await syncOf(f, b.id)).status).toBe("pending");
  });
  it("the periodic scan applies the same rule: an incomplete list entry is completed by a direct read; still incomplete means the booking is re-queued as unverified, never healthy", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); const id = (await refOf(f, b.id))!.externalId!;
    const list = f.zoom.listMarkedMeetings.bind(f.zoom);
    f.zoom.listMarkedMeetings = async () => (await list()).map((m) => ({ ...m, startUtc: null, durationMinutes: null }));
    expect(await f.svc.sync.scanZoom()).toMatchObject({ unverified: 0, stale: 0 });                            // the direct read completes the evidence: a verified match
    f.zoom.getMeeting = async () => ({ meetingId: id, joinUrl: "x", startUtc: null, durationMinutes: null });
    expect(await f.svc.sync.scanZoom()).toMatchObject({ unverified: 1 });
    expect((await syncOf(f, b.id)).status).toBe("pending");
    const g = await fx(); const c = await g.book(); await g.svc.sync.run(c.id); const gid = (await refOf(g, c.id))!.externalId!;
    g.zoom.meetings.get(gid)!.startUtc = `${DAY}T15:00:00.000Z`;
    const l2 = g.zoom.listMarkedMeetings.bind(g.zoom); g.zoom.listMarkedMeetings = async () => (await l2()).map((m) => ({ ...m, startUtc: null }));
    expect(await g.svc.sync.scanZoom()).toMatchObject({ stale: 1 });                                           // completed by the direct read, which shows the wrong time
  });

  describe("the real HTTP adapter with missing or partial answers", () => {
    const client = (body: unknown, status = 200) => {
      const fake: typeof fetch = async (input) => String(input).includes("/oauth/token")
        ? new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 })
        : new Response(JSON.stringify(body), { status });
      return new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "h@example.test", fetch: fake, sleep: async () => {} });
    };
    const host = { host_email: "h@example.test", join_url: "https://z/1" };
    it("missing fields become nulls (insufficient), never defaults", async () => {
      expect(await client({ ...host, id: 1 }).getMeeting("1")).toMatchObject({ meetingId: "1", startUtc: null, durationMinutes: null });
      expect(await client({ ...host, id: 1, start_time: "2031-02-21T10:00:00Z" }).getMeeting("1")).toMatchObject({ startUtc: "2031-02-21T10:00:00.000Z", durationMinutes: null });
      expect(await client({ ...host, id: 1, duration: 30 }).getMeeting("1")).toMatchObject({ startUtc: null, durationMinutes: 30 });
    });
    it("malformed fields become nulls, and a body without an identity yields an empty identity", async () => {
      expect(await client({ ...host, id: 1, start_time: "yesterday-ish", duration: "30" }).getMeeting("1")).toMatchObject({ startUtc: null, durationMinutes: null });
      expect(await client({ ...host, id: 1, duration: 0 }).getMeeting("1")).toMatchObject({ durationMinutes: null });
      expect(await client({ ...host, start_time: "2031-02-21T10:00:00Z", duration: 30 }).getMeeting("1")).toMatchObject({ meetingId: "" });
    });
    it("a meeting that belongs to another host is refused rather than described, and a 404 is 'gone'", async () => {
      await expect(client({ id: 1, host_email: "other@example.test", start_time: "2031-02-21T10:00:00Z", duration: 30 }).getMeeting("1")).rejects.toThrow(/ownership/);
      expect(await client({ code: 3001, message: "not found" }, 404).getMeeting("1")).toBeNull();
    });
    it("list entries with missing fields are described as such (so the scan can ask for more evidence)", async () => {
      const list = await client({ meetings: [{ id: 7, agenda: "mba-booking:b-1", join_url: "https://z/7" }, { id: 8, agenda: "mba-booking:b-2", join_url: "https://z/8", start_time: "2031-02-21T10:00:00Z", duration: 30 }] }).listMarkedMeetings();
      expect(list[0]).toMatchObject({ meetingId: "7", startUtc: null, durationMinutes: null }); expect(list[1]).toMatchObject({ startUtc: "2031-02-21T10:00:00.000Z", durationMinutes: 30 });
    });
  });
});
