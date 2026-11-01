import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, ZoomAmbiguousError, type MockCalendar, type MockEmail, type MockZoom } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { ZoomClient } from "./adapters/zoom";
import { ResendEmailProvider } from "./adapters/resend-email";
import { isApprovedOwnerAddress, OWNER_NOTIFICATION_EMAIL, ownerNotificationAddress } from "./owner-address";
import { ZOOM_REVIEW_AFTER_SECONDS } from "./sync";

/**
 * Phase 2F: regression tests for the five findings of the independent Phase 2E re-audit (docs/mba-scheduling/PHASE2E-INDEPENDENT-REAUDIT.md).
 * Each group starts from the re-audit's own reproducer and then attacks the fix from other directions. Every test here fails if its fix is reverted
 * (the mutation runs are listed in docs/mba-scheduling/PHASE2F-REMEDIATION.md). Mocks only: no real Google, Zoom or Resend is reachable.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t() }));

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const OWNER = OWNER_NOTIFICATION_EMAIL;
type Fx = Awaited<ReturnType<typeof fx>>;

async function fx(o: { owner?: boolean; store?: MemoryStore; clock?: { now: number } } = {}) {
  const clock = o.clock ?? { now: NOW };
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const cal: MockCalendar = createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false });
  const zoom: MockZoom = createMockZoom({ failing: () => false });
  const email: MockEmail = createSimulatedEmail();
  const store = o.store ?? new MemoryStore(seed);
  const make = (ownerOn: boolean) => new SchedulingService({ store, calendar: cal, zoom, email, now: () => clock.now, defer: () => {}, ownerEmail: ownerOn ? OWNER : undefined });
  const svc = make(!!o.owner);
  const t = await svc.saveMeetingType({ slug: "talk-2f", name: "Talk 2F", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  let n = 0;
  const book = async (hhmm = "10:00", s = svc) => {
    const { booking } = await s.createBooking({ slug: t.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: "Guest Two-F", guestEmail: `guest2f${++n}@example.test`, guestTimeZone: "UTC", idempotencyKey: `phase2f-key-${n}-${hhmm}` });
    return (await s.repo.getBookingByReference(booking.reference))!;
  };
  return { svc, cal, zoom, email, store, make, book, clock, advance: (ms: number) => { clock.now += ms; } };
}
const refOf = async (f: Fx, id: string) => (await f.svc.repo.listRefs(id)).find((r) => r.provider === "zoom");
const zoomStart = (f: Fx, id: string) => f.zoom.meetings.get(id)?.startUtc;
const ownerKinds = async (f: Fx, id: string) => (await f.svc.repo.listEmailAttempts(id)).filter((a) => a.kind.startsWith("owner_") && a.status === "accepted").map((a) => a.kind);

/** Holds the first call of a provider method until released (a worker that stalls inside an external call, or a request already in flight). */
function gate<T extends object>(target: T, method: keyof T) {
  let release!: () => void, started!: () => void;
  const open = new Promise<void>((r) => (release = r)), begun = new Promise<void>((r) => (started = r));
  const original = (target[method] as unknown as (...a: unknown[]) => Promise<unknown>).bind(target);
  let calls = 0;
  (target as Record<string, unknown>)[method as string] = async (...a: unknown[]) => { if (++calls === 1) { started(); await open; } return original(...a); };
  return { release: () => release(), begun };
}

afterEach(() => vi.unstubAllEnvs());

// =============================================================================================================================== RE-01
describe("RE-01 a stale Zoom update cannot leave Zoom at the wrong time while the database says 'ok'", () => {
  it("the re-audit's reproducer: 10:00, reschedule to 11:00, the worker stalls inside updateMeeting, replaced after its lease, 12:00 completes, the old update lands. Zoom ends at 12:00", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    await f.svc.rescheduleBooking(b.id, `${DAY}T11:00:00Z`);
    const held = gate(f.zoom, "updateMeeting"); const old = f.svc.sync.run(b.id); await held.begun;
    f.advance(301_000); await f.svc.rescheduleBooking(b.id, `${DAY}T12:00:00Z`);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);                               // the replacement completes version 3
    const id = (await refOf(f, b.id))!.externalId!;
    expect(zoomStart(f, id)).toBe(`${DAY}T12:00:00.000Z`);
    held.release();                                                                    // the in-flight update (11:00) now lands in Zoom
    expect(await old).toMatchObject({ skipped: true });                                // its record is refused...
    expect(zoomStart(f, id)).toBe(`${DAY}T11:00:00.000Z`);                             // ...and Zoom IS wrong at this instant (no lock can prevent that)
    const booking = (await f.svc.repo.getBooking(b.id))!;
    expect(booking.sync).toMatchObject({ status: "pending" });                         // but it is not reported as synchronised: the booking is queued for verification
    expect((await refOf(f, b.id))!.contentKey).toBeNull();
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);                                // the next pass reads Zoom back and corrects it
    expect(zoomStart(f, id)).toBe(`${DAY}T12:00:00.000Z`);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
    expect(f.zoom.meetings.size).toBe(1);
  });
  it("a stale write that lands BEFORE the worker finishes is found by the read-back and corrected before success is reported", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const id = (await refOf(f, b.id))!.externalId!;
    await f.svc.rescheduleBooking(b.id, `${DAY}T14:00:00Z`);
    const update = f.zoom.updateMeeting.bind(f.zoom); let calls = 0;
    f.zoom.updateMeeting = async (mid, input) => { await update(mid, input); if (++calls === 1) f.zoom.meetings.get(mid)!.startUtc = `${DAY}T10:00:00.000Z`; };   // an older request lands right after ours
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    expect(zoomStart(f, id)).toBe(`${DAY}T14:00:00.000Z`);
    expect(calls).toBe(2);                                                             // the second call is the repair
  });
  it("if Zoom cannot be corrected the pass does NOT report success", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const id = (await refOf(f, b.id))!.externalId!;
    await f.svc.rescheduleBooking(b.id, `${DAY}T14:00:00Z`);
    const update = f.zoom.updateMeeting.bind(f.zoom);
    f.zoom.updateMeeting = async (mid, input) => { await update(mid, input); f.zoom.meetings.get(mid)!.startUtc = `${DAY}T10:00:00.000Z`; };   // every update is overwritten by an older one
    const r = await f.svc.sync.run(b.id);
    expect(r.ok).toBe(false); expect(r.errors.join()).toMatch(/does not show the booking's current time/);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "pending", attempts: 1 });
    void id;
  });
  it("a meeting deleted in Zoom is noticed by the read-back and recreated (a known deletion, so creating is safe)", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    f.zoom.meetings.clear();
    expect((await f.svc.sync.run(b.id)).ok).toBe(false);                               // reset, retry scheduled
    f.advance(61_000); expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    expect(f.zoom.meetings.size).toBe(1);
  });
  it("the adoption path is covered too: a stale marker-search result, adopted with an older time, is repaired", async () => {
    const f = await fx(); const b = await f.book();
    f.zoom.loseNextResponse = true; await f.svc.sync.run(b.id);                       // meeting exists, answer lost (v1, 10:00)
    await f.svc.rescheduleBooking(b.id, `${DAY}T11:00:00Z`);
    const held = gate(f.zoom, "updateMeeting"); const old = f.svc.sync.run(b.id); await held.begun;   // adopting at 11:00, held
    f.advance(301_000); await f.svc.rescheduleBooking(b.id, `${DAY}T12:00:00Z`);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    held.release(); await old;
    const id = [...f.zoom.meetings.keys()][0];
    expect(f.zoom.meetings.size).toBe(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync?.status).toBe("pending");
    await f.svc.sync.run(b.id);
    expect(zoomStart(f, id)).toBe(`${DAY}T12:00:00.000Z`);
  });
  it("cancellation stays authoritative: a late update to a meeting the cancel already deleted creates nothing and the booking stays clean", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    await f.svc.rescheduleBooking(b.id, `${DAY}T11:00:00Z`);
    const held = gate(f.zoom, "updateMeeting"); const old = f.svc.sync.run(b.id); await held.begun;
    f.advance(301_000); await f.svc.cancelBooking(b.id);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    held.release(); expect(await old).toMatchObject({ skipped: true });
    expect(f.zoom.meetings.size).toBe(0); expect(f.zoom.creates).toBe(1);             // no meeting was resurrected
    await f.svc.runMaintenance(); await f.svc.runMaintenance();
    expect(f.zoom.meetings.size).toBe(0); expect(f.cal.events.size).toBe(0);
  });
  it("the periodic scan finds stale content even when the worker that caused it is gone, and has it corrected", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const id = (await refOf(f, b.id))!.externalId!;
    f.zoom.meetings.get(id)!.startUtc = `${DAY}T10:30:00.000Z`;                       // a stale write landed after its sender died: no worker will ever compensate
    expect((await f.svc.sync.reconcile()).requeued).toEqual([]);                      // the database alone cannot see it (this is what the re-audit found)
    const swept = await f.svc.runMaintenance();
    expect(swept.summary.zoomStaleFound).toBe(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync?.status).toBe("pending");
    await f.svc.runMaintenance();
    expect(zoomStart(f, id)).toBe(`${DAY}T10:00:00.000Z`);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
  });
  it("a wrong LENGTH is caught the same way, and a meeting whose booking this database does not know is never touched", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const id = (await refOf(f, b.id))!.externalId!;
    f.zoom.meetings.get(id)!.durationMinutes = 90;
    f.zoom.meetings.set("not-ours", { ...f.zoom.meetings.get(id)!, meetingId: "not-ours", marker: "mba-booking:00000000-0000-4000-8000-00000000beef", startUtc: "2031-01-01T00:00:00Z" });
    expect(await f.svc.sync.scanZoom()).toMatchObject({ stale: 1, removed: 0 });
    await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.get(id)!.durationMinutes).toBe(30);
    expect(f.zoom.meetings.get("not-ours")!.startUtc).toBe("2031-01-01T00:00:00Z");
  });
  it("the scan leaves a booking alone when its meeting is right, and when its reference already says it is stale (the queue handles that)", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    expect(await f.svc.sync.scanZoom()).toMatchObject({ stale: 0, requeued: 0 });
    const id = (await refOf(f, b.id))!.externalId!;
    await f.svc.rescheduleBooking(b.id, `${DAY}T14:00:00Z`);                          // reference is now behind the booking: not the scan's concern
    expect(await f.svc.sync.scanZoom()).toMatchObject({ stale: 0 });
    void id;
  });
});

// =============================================================================================================================== RE-02
describe("RE-02 an uncertain Zoom create is never resolved by waiting", () => {
  it("the re-audit's reproducer: listing lags past 180 seconds. No second meeting is created, ever; the late-listed one is adopted", async () => {
    const f = await fx(); const b = await f.book(); const find = f.zoom.findMeetingsByMarker.bind(f.zoom); let hidden = true;
    f.zoom.findMeetingsByMarker = async (m) => (hidden ? [] : find(m)); f.zoom.loseNextResponse = true;
    await f.svc.sync.run(b.id); expect(f.zoom.meetings.size).toBe(1);
    f.advance(181_000); await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.size).toBe(1); expect(f.zoom.creates).toBe(1);             // the audit saw 2 here
    for (const wait of [300, 3600, 86_400]) { f.advance(wait * 1000); await f.svc.sync.run(b.id); await f.svc.runMaintenance(); }
    expect(f.zoom.creates).toBe(1);                                                    // a day later: still one create. Time never becomes permission.
    hidden = false;
    await f.svc.runMaintenance(); await f.svc.runMaintenance();
    expect(f.zoom.meetings.size).toBe(1); expect(f.zoom.creates).toBe(1);
    expect(await refOf(f, b.id)).toMatchObject({ status: "synced", createIntentAt: null });
    expect((await f.svc.repo.getBooking(b.id))!.sync?.status).toBe("ok");
  });
  it("the re-audit's cancellation reproducer: the booking is NOT recorded as clean while a hidden meeting may exist, and the late-listed meeting is then removed", async () => {
    const f = await fx(); const b = await f.book(); const find = f.zoom.findMeetingsByMarker.bind(f.zoom); let hidden = true;
    f.zoom.findMeetingsByMarker = async (m) => (hidden ? [] : find(m)); f.zoom.loseNextResponse = true;
    await f.svc.sync.run(b.id); await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    f.advance(181_000); await f.svc.sync.run(b.id);
    expect((await refOf(f, b.id))!.status).not.toBe("deleted");                        // the audit saw "deleted" here, with the meeting still alive
    expect(f.zoom.meetings.size).toBe(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync?.status).toBe("failed");           // surfaced for a person
    hidden = false;
    await f.svc.runMaintenance(); await f.svc.runMaintenance();
    expect(f.zoom.meetings.size).toBe(0);
    expect(await refOf(f, b.id)).toMatchObject({ status: "deleted" });
  });
  it("the uncertain state is durable: a new process (a new service on the same data) still refuses to create", async () => {
    const f = await fx(); const b = await f.book(); f.zoom.loseNextResponse = true; await f.svc.sync.run(b.id);
    const find = f.zoom.findMeetingsByMarker.bind(f.zoom); f.zoom.findMeetingsByMarker = async () => [];
    f.advance((ZOOM_REVIEW_AFTER_SECONDS + 10) * 1000);
    const restarted = f.make(false);
    await restarted.sync.run(b.id); await restarted.runMaintenance();
    expect(f.zoom.creates).toBe(1);
    f.zoom.findMeetingsByMarker = find;
  });
  it("only a person can allow another create, through the explicit resolution (an ordinary Retry sync never does)", async () => {
    const f = await fx(); const b = await f.book();
    const create = f.zoom.createMeeting.bind(f.zoom); let calls = 0;
    f.zoom.createMeeting = async (i) => { if (++calls === 1) throw new ZoomAmbiguousError("no answer"); return create(i); };
    await f.svc.sync.run(b.id); f.advance(400_000); await f.svc.sync.run(b.id);
    expect((await f.svc.repo.getBooking(b.id))!.sync?.status).toBe("failed"); expect(calls).toBe(1);
    await f.svc.retrySync(b.id); expect(calls).toBe(1);                                // a plain retry only looks again
    const intentAt = (await refOf(f, b.id))!.createIntentAt!;
    await f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: true });
    expect(calls).toBe(2); expect(f.zoom.meetings.size).toBe(1);
  });
  it("a definite refusal (not ambiguous) leaves no uncertainty: the next attempt creates normally", async () => {
    const f = await fx(); const b = await f.book();
    f.zoom.failing = true; await f.svc.sync.run(b.id);
    expect((await refOf(f, b.id))!.createIntentAt ?? null).toBeNull();
    f.zoom.failing = false; f.advance(61_000);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true); expect(f.zoom.meetings.size).toBe(1);
  });
  it("a meeting that was found is never duplicated by the review deadline: the pass that finds it adopts it, even after the deadline", async () => {
    const f = await fx(); const b = await f.book(); f.zoom.loseNextResponse = true; await f.svc.sync.run(b.id);
    f.advance((ZOOM_REVIEW_AFTER_SECONDS + 100) * 1000);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    expect(f.zoom.creates).toBe(1);
  });

  describe("the real HTTP adapter over several pages", () => {
    const fakeZoom = (pages: Array<Array<Record<string, unknown>>>) => {
      const fake: typeof fetch = async (input) => {
        const u = String(input);
        if (u.includes("/oauth/token")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 });
        const tok = new URL(u).searchParams.get("next_page_token"); const i = tok ? Number(tok) : 0;
        return new Response(JSON.stringify({ meetings: pages[i] ?? [], next_page_token: i + 1 < pages.length ? String(i + 1) : "" }), { status: 200 });
      };
      return new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "h@example.test", fetch: fake, sleep: async () => {} });
    };
    const m = (id: number, agenda: string, start = "2031-02-21T10:00:00Z") => ({ id, agenda, join_url: `https://z/${id}`, start_time: start, duration: 30, topic: "T" });
    it("returns EVERY duplicate, wherever it is in the list, with Zoom's own time and length", async () => {
      const client = fakeZoom([[m(1, "x")], [m(2, "x")], [m(3, "mba-booking:b-1"), m(4, "y"), m(5, "mba-booking:b-1", "2031-02-21T11:00:00Z")]]);
      expect((await client.findMeetingsByMarker("mba-booking:b-1")).map((x) => x.meetingId)).toEqual(["3", "5"]);
      const marked = await client.listMarkedMeetings();
      expect(marked.map((x) => x.meetingId)).toEqual(["3", "5"]);
      expect(marked[1]).toMatchObject({ startUtc: "2031-02-21T11:00:00.000Z", durationMinutes: 30 });
    });
    it("fails closed rather than guess when the host has more meetings than can be examined", async () => {
      const client = fakeZoom(Array.from({ length: 7 }, (_, i) => [m(i + 1, "x")]));
      await expect(client.findMeetingsByMarker("mba-booking:b-1")).rejects.toThrow(/too many upcoming meetings/);
      await expect(client.listMarkedMeetings()).rejects.toThrow(/too many upcoming meetings/);
    });
  });
});

// =============================================================================================================================== RE-03
describe("RE-03 a processed webhook delivery is terminal", () => {
  it("the re-audit's reproducer: A claims, B reclaims after the lease and succeeds, A fails late. A third delivery is a replay (the audit ran the effect a third time)", async () => {
    const f = await fx(); let release!: () => void, started!: () => void;
    const opened = new Promise<void>((r) => (release = r)), begun = new Promise<void>((r) => (started = r)); let effects = 0;
    const old = f.svc.handleWebhook("zoom", "lease-race", async () => { effects++; started(); await opened; throw Error("late failure"); }).catch(() => null);
    await begun; f.advance(121_000);
    expect((await f.svc.handleWebhook("zoom", "lease-race", async () => { effects++; return true; })).status).toBe("processed");
    release(); await old;
    const third = await f.svc.handleWebhook("zoom", "lease-race", async () => { effects++; return true; });
    expect(third.status).toBe("duplicate"); expect(effects).toBe(2);
  });
  it("the other order: a replaced worker's late SUCCESS cannot complete a delivery that the current worker then fails; the retry runs", async () => {
    const f = await fx(); let release!: () => void, started!: () => void;
    const opened = new Promise<void>((r) => (release = r)), begun = new Promise<void>((r) => (started = r));
    const old = f.svc.handleWebhook("zoom", "race-2", async () => { started(); await opened; return "a"; });
    await begun; f.advance(121_000);
    await expect(f.svc.handleWebhook("zoom", "race-2", async () => { release(); await old; throw new Error("b failed"); })).rejects.toThrow("b failed");
    let ran = 0;
    const retry = await f.svc.handleWebhook("zoom", "race-2", async () => { ran++; return "c"; });
    expect(retry).toMatchObject({ status: "processed", retried: true }); expect(ran).toBe(1);
  });
  it("eight simultaneous deliveries of one event run the effect once; the rest are told to retry later or that it was processed", async () => {
    const f = await fx(); let effects = 0;
    const out = await Promise.all(Array.from({ length: 8 }, () => f.svc.handleWebhook("resend", "same-event", async () => { effects++; await new Promise((r) => setTimeout(r, 5)); return true; })));
    expect(effects).toBe(1); expect(out.filter((o) => o.status === "processed")).toHaveLength(1);
    expect(out.filter((o) => o.status === "busy" || o.status === "duplicate")).toHaveLength(7);
    expect((await f.svc.handleWebhook("resend", "same-event", async () => { effects++; return true; })).status).toBe("duplicate");
    expect(effects).toBe(1);
  });
  it("a failure still leaves the delivery retryable, and a worker that dies mid-effect is retried once its claim lapses", async () => {
    const f = await fx(); let effects = 0;
    await expect(f.svc.handleWebhook("zoom", "e1", async () => { effects++; throw new Error("down"); })).rejects.toThrow("down");
    expect((await f.svc.handleWebhook("zoom", "e1", async () => { effects++; return 1; })).status).toBe("processed");
    await f.svc.repo.beginWebhook("zoom", "e2", new Date(f.clock.now).toISOString(), 120);   // claimed, then the process dies
    expect((await f.svc.handleWebhook("zoom", "e2", async () => 1)).status).toBe("busy");
    f.advance(121_000);
    expect((await f.svc.handleWebhook("zoom", "e2", async () => { effects++; return 1; })).status).toBe("processed");
    expect(effects).toBe(3);
  });
});

// =============================================================================================================================== RE-04
describe("RE-04 owner notifications follow genuine transitions, not the current status", () => {
  it("the re-audit's reproducer: owner notices switched on 40 days after a booking was canceled, then an administrator's retry. Nothing is sent", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    f.advance(40 * 86_400_000);
    const withOwner = f.make(true);
    await withOwner.retrySync(b.id);
    await withOwner.runMaintenance(); await withOwner.runMaintenance();
    expect(await ownerKinds(f, b.id)).toEqual([]);
    expect(f.email.sent.filter((m) => m.to === OWNER)).toHaveLength(0);
    expect((await withOwner.repo.listEmailAttempts(b.id)).filter((a) => a.kind.startsWith("owner_"))).toHaveLength(0);   // and no fake "delivered" row was invented
  });
  it("the same holds for an old booking that is still confirmed: no catch-up 'new booking' notice, on retry or in any sweep", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    f.advance(40 * 86_400_000);
    const withOwner = f.make(true); await withOwner.retrySync(b.id); await withOwner.runMaintenance();
    expect(await ownerKinds(f, b.id)).toEqual([]);
  });
  it("a genuine cancellation made AFTER owner notices were on is announced exactly once, and a later administrator retry adds nothing", async () => {
    const f = await fx({ owner: true }); const b = await f.book(); await f.svc.sync.run(b.id);
    f.advance(1000); await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    expect(await ownerKinds(f, b.id)).toEqual(["owner_new_booking", "owner_canceled"]);
    f.advance(40 * 86_400_000);
    await f.svc.retrySync(b.id); await f.svc.retrySync(b.id); await f.svc.runMaintenance();
    expect((await ownerKinds(f, b.id)).filter((k) => k === "owner_canceled")).toHaveLength(1);
  });
  it("a booking made BEFORE the switch-on and canceled AFTER it is a genuine transition: the cancellation is announced (the new-booking notice never is)", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    f.advance(86_400_000);
    const withOwner = f.make(true);
    await withOwner.runMaintenance();                                                   // switch-on happens here: the baseline is recorded
    f.advance(1000); await withOwner.cancelBooking(b.id); await withOwner.sync.run(b.id);
    expect(await ownerKinds(f, b.id)).toEqual(["owner_canceled"]);
  });
  it("likewise a reschedule made after the switch-on is announced, against the time that was current at the switch-on", async () => {
    const f = await fx(); const b = await f.book("10:00"); await f.svc.sync.run(b.id);
    f.advance(86_400_000);
    const withOwner = f.make(true); await withOwner.runMaintenance();
    f.advance(1000); await withOwner.rescheduleBooking(b.id, `${DAY}T14:00:00Z`); await withOwner.sync.run(b.id);
    expect(await ownerKinds(f, b.id)).toEqual(["owner_rescheduled"]);
    const mail = f.email.sent.find((m) => m.to === OWNER)!;
    expect(mail.text).toMatch(/Previous time: .*10:00 AM/); expect(mail.text).toMatch(/New time: .*2:00 PM/);
  });
  it("the baseline is durable and shared: another process on the same data does not move it, so bookings made after it are never suppressed", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    f.advance(5000);
    const other = f.make(true);                                                          // a second server instance
    await other.sync.run(b.id);
    expect(await ownerKinds(f, b.id)).toEqual(["owner_new_booking"]);
  });
  it("guest delivery is untouched by the owner baseline: an old booking's still-pending guest confirmation is delivered on retry, with no owner record beside it", async () => {
    const f = await fx(); const b = await f.book();
    f.email.failing = true; await f.svc.sync.run(b.id);                                 // the guest's confirmation failed back then
    f.email.failing = false; f.advance(40 * 86_400_000);
    const withOwner = f.make(true); await withOwner.retrySync(b.id);
    expect((await withOwner.repo.listEmailAttempts(b.id)).filter((a) => a.status === "accepted").map((a) => a.kind)).toEqual(["confirmation"]);
    expect(await ownerKinds(f, b.id)).toEqual([]);
  });
});

// =============================================================================================================================== RE-05
describe("RE-05 owner notices can only go to the approved address", () => {
  it("the re-audit's reproducer: a configured different address is refused loudly instead of being used", () => {
    expect(() => ownerNotificationAddress({ SCHEDULING_OWNER_EMAIL: "different@example.test" })).toThrow(/not the approved owner address/);
    expect(ownerNotificationAddress({})).toBe("martindubreuil13@gmail.com");
    expect(ownerNotificationAddress({ SCHEDULING_OWNER_EMAIL: "  MartinDubreuil13@Gmail.com " })).toBe("martindubreuil13@gmail.com");   // the same address
    expect(ownerNotificationAddress({ SCHEDULING_OWNER_EMAIL: "" })).toBe("martindubreuil13@gmail.com");
  });
  it("a deployment that sets another address does not start (and a correct or absent one does)", async () => {
    const { buildScheduling } = await import("./integrations");
    expect(() => buildScheduling({ SCHEDULING_OWNER_EMAIL: "someone-else@example.test" })).toThrow(/approved owner address/);
    expect(() => buildScheduling({})).not.toThrow();
    expect(() => buildScheduling({ SCHEDULING_OWNER_EMAIL: "martindubreuil13@gmail.com" })).not.toThrow();
  });
  it("the service refuses any other owner address, whoever passes it", async () => {
    const seed = await buildSeedData(NOW);
    const make = (ownerEmail: string) => () => new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false }), zoom: createMockZoom({ failing: () => false }), ownerEmail });
    expect(make("attacker@example.test")).toThrow(/approved owner address/);
    expect(make("martindubreuil13@gmail.com.evil.test")).toThrow(); expect(make("x+martindubreuil13@gmail.com")).toThrow();
    expect(make("martindubreuil13@gmail.com")).not.toThrow();
  });
  it("the email provider refuses an owner message to any other address, even if the caller asks (and even outside test mode)", async () => {
    const send = vi.fn(async () => ({ data: { id: "re_1" }, error: null }));
    const provider = new ResendEmailProvider({ resend: { emails: { send } } as never, env: {} });
    const msg = (to: string) => ({ to, subject: "s", text: "t", idempotencyKey: "k", tags: { scheduling_booking: "b", scheduling_kind: "owner_new_booking" } });
    await expect(provider.send(msg("other@example.test"))).rejects.toThrow(/approved owner address/);
    await expect(provider.send(msg("martindubreuil13@gmail.com, other@example.test"))).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
    await provider.send(msg("martindubreuil13@gmail.com"));
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("request input cannot reach the owner address: a guest's address only ever becomes the Reply-To of the owner message, never its recipient", async () => {
    const f = await fx({ owner: true }); const b = await f.book(); await f.svc.sync.run(b.id);
    const ownerMails = f.email.sent.filter((m) => m.content?.audience === "owner");
    expect(ownerMails.length).toBeGreaterThan(0);
    for (const m of ownerMails) { expect(m.to).toBe("martindubreuil13@gmail.com"); expect(m.replyTo).toBe(b.guestEmail); }
    expect(isApprovedOwnerAddress(b.guestEmail)).toBe(false);
  });
  it("structurally: the environment variable is read in one file only, and the approved address is written in one file only", () => {
    const root = path.resolve(__dirname, "../../..");
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" || e.name === ".next" ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
    const files = walk(path.join(root, "app")).filter((p) => /\.(ts|tsx)$/.test(p) && !/\.test\./.test(p));
    expect(files.filter((p) => /SCHEDULING_OWNER_EMAIL/.test(fs.readFileSync(p, "utf8"))).map((p) => path.relative(root, p))).toEqual(["app/lib/scheduling/owner-address.ts"]);
    expect(files.filter((p) => /OWNER_NOTIFICATION_EMAIL\s*=/.test(fs.readFileSync(p, "utf8"))).map((p) => path.relative(root, p))).toEqual(["app/lib/scheduling/owner-address.ts"]);
  });
});
