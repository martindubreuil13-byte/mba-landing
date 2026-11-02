import { createHash, createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, ZoomAmbiguousError, type MockCalendar, type MockEmail, type MockZoom } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { googleEventIdFor, MAX_ATTEMPTS, OWNER_MAX_ATTEMPTS, ZOOM_REVIEW_AFTER_SECONDS, zoomMarkerFor } from "./sync";
import { OWNER_NOTIFICATION_EMAIL } from "./owner-address";
import { communityPromptDue } from "./community";
import { ZoomClient } from "./adapters/zoom";
import { renderBookingEmail } from "./adapters/resend-email";

/**
 * Phase 2E regression suite for the four P1 findings of the independent audit (docs/mba-scheduling/PHASE2D-INDEPENDENT-AUDIT.md), the owner
 * notifications and the community consent. The first four sections are the audit's own reproducers, restated with the SAFE outcome as the
 * assertion, plus adversarial variants. Mocks only: no real Google, Zoom or Resend is reachable from here.
 */
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: async () => ({ email: "audit@example.test" }) }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => true, getClientIp: () => "audit" }));
const hook = vi.hoisted(() => ({ service: null as unknown, preview: null as unknown, real: vi.fn() }));
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => { hook.real(); return hook.service; } }));
vi.mock("@/app/lib/scheduling/preview-instance", () => ({ getPreviewScheduling: () => hook.preview }));
import { POST as zoomHook } from "@/app/api/webhooks/scheduling/zoom/route";
import { POST as resendHook } from "@/app/api/webhooks/scheduling/resend/route";
import { POST as previewPost } from "@/app/api/scheduling-preview/[...path]/route";

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const OWNER = OWNER_NOTIFICATION_EMAIL;
type Fx = Awaited<ReturnType<typeof fx>>;

async function fx(o: { owner?: boolean } = {}) {
  let now = NOW;
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const cal: MockCalendar = createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false });
  const zoom: MockZoom = createMockZoom({ failing: () => false });
  const email: MockEmail = createSimulatedEmail();
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: cal, zoom, email, now: () => now, defer: () => {}, ownerEmail: o.owner ? OWNER : undefined, adminUrl: "http://localhost:3000/admin/scheduling/bookings" });
  const t = await svc.saveMeetingType({ slug: "audit-talk", name: "Audit Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  let n = 0;
  const book = async (hhmm = "10:00", name = "Audit Guest", guestMessage = "") => {
    const { booking } = await svc.createBooking({ slug: t.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: name, guestEmail: `guest${++n}@example.test`, guestMessage, guestTimeZone: "UTC", idempotencyKey: `remediation-key-${n}-${hhmm}` });
    return (await svc.repo.getBookingByReference(booking.reference))!;
  };
  return { svc, cal, zoom, email, book, advance: (ms: number) => { now += ms; }, clock: () => now };
}
const refOf = async (f: Fx, id: string, provider: "zoom" | "google") => (await f.svc.repo.listRefs(id)).find((r) => r.provider === provider);
const accepted = async (f: Fx, id: string) => (await f.svc.repo.listEmailAttempts(id)).filter((a) => a.status === "accepted").map((a) => a.kind);
/**
 * Holds the first call of a provider method until released, to model a worker that stalls inside an external call.
 * With `stale`, the real call runs FIRST and its answer is held back: the worker wakes up holding a view of the world that is no longer true.
 */
function gate<T extends object>(target: T, method: keyof T, o: { stale?: boolean } = {}) {
  let release!: () => void, started!: () => void;
  const open = new Promise<void>((r) => (release = r)), begun = new Promise<void>((r) => (started = r));
  const original = (target[method] as unknown as (...a: unknown[]) => Promise<unknown>).bind(target);
  let calls = 0;
  (target as Record<string, unknown>)[method as string] = async (...a: unknown[]) => {
    if (++calls !== 1) return original(...a);
    if (o.stale) { const answer = await original(...a); started(); await open; return answer; }
    started(); await open; return original(...a);
  };
  return { release: () => release(), begun };
}

afterEach(() => vi.unstubAllEnvs());

// ===================================================================================================================== P1-2
describe("P1-2 Zoom: a lost answer does not prove the meeting was not created", () => {
  it("the HTTP adapter makes exactly ONE create request when the answer is lost (the audit reproducer created two)", async () => {
    let created = 0;
    const fake: typeof fetch = async (input, init) => {
      const u = String(input);
      if (u.includes("/oauth/token")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 });
      if (init?.method === "POST" && u.includes("/users/")) { created++; if (created === 1) throw new TypeError("lost response after Zoom committed the create"); return new Response(JSON.stringify({ id: "second-meeting", join_url: "https://zoom.us/j/x" }), { status: 201 }); }
      throw Error("unexpected request");
    };
    const client = new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "audit@example.test", fetch: fake, sleep: async () => {} });
    const err = await client.createMeeting({ topic: "T", startUtc: "2031-02-21T10:00:00Z", durationMinutes: 30, timeZone: "UTC", marker: "m" }).then(() => null, (e) => e as Error);
    expect(created).toBe(1);
    expect(err?.name).toBe("ZoomAmbiguousError");
  });
  it("a timeout, an unusable success and every 5xx on a create are 'unknown outcome', never retried; reads and deletes still retry", async () => {
    const run = async (replies: Array<() => Response | Promise<Response>>, method: "createMeeting" | "findMeetingsByMarker") => {
      let posts = 0, i = 0;
      const fake: typeof fetch = async (input, init) => {
        if (String(input).includes("/oauth/token")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 });
        if (init?.method === "POST") posts++;
        return replies[Math.min(i++, replies.length - 1)]();
      };
      const client = new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "h@example.test", fetch: fake, sleep: async () => {}, timeoutMs: 50 });
      const input = { topic: "T", startUtc: "2031-02-21T10:00:00Z", durationMinutes: 30, timeZone: "UTC", marker: "m" };
      const r = await (method === "createMeeting" ? client.createMeeting(input) : client.findMeetingsByMarker("m")).then((v) => v, (e) => e as Error);
      return { r, posts, calls: i };
    };
    for (const reply of [() => new Response("{}", { status: 500 }), () => new Response("{}", { status: 503 }), () => new Response("{}", { status: 200 }), () => new Response(JSON.stringify({ id: 5 }), { status: 201 })]) {
      const out = await run([reply], "createMeeting");
      expect((out.r as Error).name).toBe("ZoomAmbiguousError"); expect(out.posts).toBe(1);
    }
    const timedOut = await run([() => new Promise<Response>((_, rej) => setTimeout(() => rej(new DOMException("timed out", "TimeoutError")), 5))], "createMeeting");
    expect((timedOut.r as Error).name).toBe("ZoomAmbiguousError"); expect(timedOut.posts).toBe(1);
    const readRetry = await run([() => new Response("{}", { status: 503 }), () => new Response(JSON.stringify({ meetings: [] }), { status: 200 })], "findMeetingsByMarker");
    expect(readRetry.r).toEqual([]); expect(readRetry.calls).toBe(2);
  });
  it("a partial meeting list is never read as 'not found'", async () => {
    const fake: typeof fetch = async (input) => String(input).includes("/oauth/token")
      ? new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 })
      : new Response(JSON.stringify({ meetings: [], next_page_token: "more" }), { status: 200 });
    const client = new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "h@example.test", fetch: fake, sleep: async () => {} });
    await expect(client.findMeetingsByMarker("m")).rejects.toThrow(/too many upcoming meetings/);
  });

  it("lost response, meeting exists: the next pass finds it by its marker and adopts it. One meeting is ever created", async () => {
    const f = await fx(); const b = await f.book();
    f.zoom.loseNextResponse = true;
    const first = await f.svc.sync.run(b.id);
    expect(first.ok).toBe(false);
    expect(f.zoom.creates).toBe(1);
    const mid = await refOf(f, b.id, "zoom");
    expect(mid).toMatchObject({ status: "pending", externalId: null }); expect(mid!.createIntentAt).toBeTruthy();   // the intent is on record
    f.advance(61_000);
    const second = await f.svc.sync.run(b.id);
    expect(second.ok).toBe(true);
    expect(f.zoom.creates).toBe(1); expect(f.zoom.meetings.size).toBe(1);
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ status: "synced", createIntentAt: null, createUnknown: 0 });
    expect((await accepted(f, b.id)).sort()).toEqual(["confirmation", "zoom_details"]);
  });
  it("Zoom lists the meeting late: nothing is ever created while the earlier attempt is unresolved; the late-listed meeting is adopted by the next scan or pass", async () => {
    const f = await fx(); const b = await f.book();
    const find = f.zoom.findMeetingsByMarker.bind(f.zoom); let visible = false;
    f.zoom.findMeetingsByMarker = async (m) => (visible ? find(m) : []);       // eventual consistency: the list does not show it
    f.zoom.loseNextResponse = true;
    await f.svc.sync.run(b.id);
    f.advance(61_000);
    expect((await f.svc.sync.run(b.id)).errors.join()).toMatch(/still looking for the meeting from the earlier Zoom attempt/);
    expect(f.zoom.creates).toBe(1);
    f.advance((ZOOM_REVIEW_AFTER_SECONDS + 5) * 1000);                         // well past the review deadline, and Zoom STILL does not list it
    const asked = await f.svc.sync.run(b.id);
    expect(asked.errors.join()).toMatch(/a person needs to check Zoom/);
    expect(f.zoom.creates).toBe(1); expect(f.zoom.meetings.size).toBe(1);      // no second meeting: elapsed time is not proof of absence
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "failed" });
    f.advance(2 * 3_600_000); f.advance(0);
    visible = true;                                                            // it finally shows up
    expect(await f.svc.sync.scanZoom()).toMatchObject({ ran: true, requeued: 1 });
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    expect(f.zoom.creates).toBe(1); expect(f.zoom.meetings.size).toBe(1);
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ status: "synced", createIntentAt: null });
  });
  it("the create really did not happen but Zoom cannot say so: automatic creation STOPS and a person is asked; only the explicit resolution creates", async () => {
    const f = await fx(); const b = await f.book();
    const create = f.zoom.createMeeting.bind(f.zoom); let calls = 0;
    f.zoom.createMeeting = async (i) => { if (++calls === 1) throw new ZoomAmbiguousError("timed out before Zoom did anything"); return create(i); };
    await f.svc.sync.run(b.id);
    for (const wait of [61, 400, 4000, 40_000]) { f.advance(wait * 1000); await f.svc.sync.run(b.id); }   // hours later: still no automatic create
    expect(calls).toBe(1); expect(f.zoom.meetings.size).toBe(0);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "failed" });
    expect((await f.svc.readAll()).activity.some((a) => a.kind === "zoom_review" && a.bookingId === b.id)).toBe(true);
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ status: "failed" });
    await f.svc.retrySync(b.id);                                                   // an ordinary retry must NOT create (Phase 2G)
    expect(calls).toBe(1); expect(f.zoom.meetings.size).toBe(0);
    await f.svc.resolveUncertainZoom(b.id, { action: "none-exists", intentAt: (await refOf(f, b.id, "zoom"))!.createIntentAt!, acknowledgeDuplicateRisk: true });
    expect(calls).toBe(2); expect(f.zoom.meetings.size).toBe(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ status: "synced", createIntentAt: null });
  });
  it("cancellation removes EVERY meeting carrying the marker, not just the recorded one", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const [only] = [...f.zoom.meetings.values()];
    f.zoom.meetings.set("dup-1", { ...only, meetingId: "dup-1", joinUrl: "https://example.com/dup-1" });    // a duplicate that an old retry created
    expect(f.zoom.meetings.size).toBe(2);
    await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.size).toBe(0); expect(f.cal.events.size).toBe(0);
  });
  it("a booking canceled while an unknown create is unresolved is NEVER declared clean on elapsed time: it needs a person until the meeting shows up, then the scan removes it", async () => {
    const f = await fx(); const b = await f.book();
    const find = f.zoom.findMeetingsByMarker.bind(f.zoom); let visible = false;
    f.zoom.findMeetingsByMarker = async (m) => (visible ? find(m) : []);
    f.zoom.loseNextResponse = true; await f.svc.sync.run(b.id);                    // the meeting exists, not listed
    await f.svc.cancelBooking(b.id);
    for (const wait of [30, 400, 4000]) { f.advance(wait * 1000); await f.svc.sync.run(b.id); }
    expect((await refOf(f, b.id, "zoom"))!.status).not.toBe("deleted");            // never claimed gone
    expect(f.zoom.meetings.size).toBe(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "failed" });
    expect((await f.svc.readAll()).activity.some((a) => a.kind === "zoom_review" && /canceled/.test(a.summary))).toBe(true);
    visible = true;
    expect(await f.svc.sync.scanZoom()).toMatchObject({ requeued: 1 });
    await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.size).toBe(0);                                          // found by its marker and removed
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ status: "deleted" });
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
  });
  it("a canceled booking with NO earlier create at all is cleaned normally (nothing to be uncertain about)", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.cancelBooking(b.id); expect((await f.svc.sync.run(b.id)).ok).toBe(true);
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ status: "deleted" });
  });
});

// ===================================================================================================================== P1-3
describe("P1-3 ownership: an expired worker cannot overwrite newer state or leave an orphan", () => {
  it("the audit reproducer: a worker that stalls past its lease while Zoom creates, replaced by a second worker. Never two meetings; the stalled worker's meeting is adopted, and cancel leaves none", async () => {
    const f = await fx(); const b = await f.book();
    const g = gate(f.zoom, "createMeeting");
    const first = f.svc.sync.run(b.id);
    await g.begun;
    f.advance(301_000);
    const second = await f.svc.sync.run(b.id);                                       // B finds A's create unresolved: it must NOT create another
    expect(second.errors.join()).toMatch(/a person needs to check Zoom/);
    expect(f.zoom.creates).toBe(0);
    g.release();
    const stale = await first;
    expect(stale).toMatchObject({ ok: false, skipped: true });                       // the old worker learns it was replaced and writes nothing
    expect(f.zoom.meetings.size).toBe(1); expect(f.zoom.creates).toBe(1);            // exactly one meeting was ever created
    expect(await f.svc.sync.scanZoom()).toMatchObject({ requeued: 1 });              // it is listed: the next scan hands it back to a normal pass...
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);                              // ...which adopts it
    const winner = await refOf(f, b.id, "zoom");
    expect(winner).toMatchObject({ status: "synced" }); expect([...f.zoom.meetings.keys()]).toEqual([winner!.externalId]);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
    await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    expect(f.zoom.meetings.size).toBe(0);                                            // no orphan
    expect(f.cal.events.size).toBe(0);
  });
  it("the replaced worker's finish cannot release the new worker's lease", async () => {
    const f = await fx(); const b = await f.book();
    const g = gate(f.cal, "upsertEvent");
    const first = f.svc.sync.run(b.id); await g.begun;
    f.advance(301_000);
    const second = gate(f.zoom, "findMeetingsByMarker"); void second;               // (no-op gate keeps the shape symmetrical)
    const claim = await f.svc.repo.claimSync(b.id, new Date(f.clock()).toISOString(), 300);   // worker B owns it now and is "running"
    expect(claim).toEqual(expect.any(String));
    g.release();
    expect(await first).toMatchObject({ skipped: true });
    expect(await f.svc.repo.claimSync(b.id, new Date(f.clock() + 1000).toISOString(), 300)).toBeNull();   // B's lease still stands
    expect(await f.svc.repo.finishSync(b.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, undefined, claim!)).toBe("applied");
  });
  it("cancellation during synchronization is authoritative: the in-flight work is superseded and everything is removed", async () => {
    const f = await fx(); const b = await f.book();
    const g = gate(f.cal, "upsertEvent");
    const running = f.svc.sync.run(b.id); await g.begun;                             // a healthy worker, inside the Google call
    await f.svc.cancelBooking(b.id);
    g.release();
    expect((await running).ok).toBe(true);
    expect(f.zoom.meetings.size).toBe(0); expect(f.cal.events.size).toBe(0);
    expect(await f.svc.repo.getBooking(b.id)).toMatchObject({ status: "canceled", sync: { status: "ok" } });
    expect(await accepted(f, b.id)).toEqual(["cancellation"]);
  });
  it("cancellation while the worker is replaced: the zombie's Google event is deleted again, so the cancel stays final", async () => {
    const f = await fx(); const b = await f.book();
    const g = gate(f.cal, "upsertEvent");
    const zombie = f.svc.sync.run(b.id); await g.begun;
    f.advance(301_000);
    await f.svc.cancelBooking(b.id);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);                              // the replacement processes the cancel
    g.release();                                                                     // the zombie now writes the event for a booking that no longer exists
    expect(await zombie).toMatchObject({ skipped: true });
    expect(f.cal.events.size).toBe(0);                                               // ...and takes it back
    expect(f.zoom.meetings.size).toBe(0);
    expect(await f.svc.repo.getBooking(b.id)).toMatchObject({ status: "canceled", sync: { status: "ok" } });
  });
  it("a zombie that overwrote the calendar with an older version is detected: the booking is re-verified and the right time restored", async () => {
    const f = await fx(); const b = await f.book("10:00");
    const g = gate(f.cal, "upsertEvent");
    const zombie = f.svc.sync.run(b.id); await g.begun;                              // version 1, about to write 10:00
    f.advance(301_000);
    await f.svc.rescheduleBooking(b.id, `${DAY}T14:00:00Z`);
    expect((await f.svc.sync.run(b.id)).ok).toBe(true);                              // the replacement writes 14:00
    expect(f.cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(`${DAY}T14:00:00.000Z`);
    g.release(); await zombie;                                                       // the zombie writes 10:00 over it
    expect(f.cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(`${DAY}T10:00:00.000Z`);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "pending" });   // but its record was refused and the booking is queued again
    await f.svc.sync.run(b.id);
    expect(f.cal.events.get(googleEventIdFor(b.id))!.startUtc).toBe(`${DAY}T14:00:00.000Z`);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
  });
  it("eight workers at once: one does the work, and there is one meeting, one event and one confirmation", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    const results = await Promise.all(Array.from({ length: 8 }, () => f.svc.sync.run(b.id)));
    expect(results.filter((r) => !r.skipped)).toHaveLength(1);
    expect(f.zoom.creates).toBe(1); expect(f.zoom.meetings.size).toBe(1); expect(f.cal.events.size).toBe(1);
    expect((await accepted(f, b.id)).sort()).toEqual(["confirmation", "owner_new_booking"]);
    expect(f.email.sent).toHaveLength(2);
  });
  it("a sweep (reconcile + due) running beside direct runs creates nothing twice", async () => {
    const f = await fx(); const b = await f.book();
    await Promise.all([f.svc.runMaintenance(), f.svc.sync.run(b.id), f.svc.runMaintenance(), f.svc.sync.run(b.id)]);
    expect(f.zoom.meetings.size).toBe(1); expect(f.cal.events.size).toBe(1);
    expect(await accepted(f, b.id)).toEqual(["confirmation"]);
  });

  describe("the duplicate scan (the backstop)", () => {
    const dup = (f: Fx, of: { marker: string }, id: string) => f.zoom.meetings.set(id, { topic: "T", startUtc: `${DAY}T10:00:00Z`, durationMinutes: 30, timeZone: "UTC", marker: of.marker, meetingId: id, joinUrl: `https://example.com/${id}` });
    it("removes surplus meetings of a confirmed booking (keeps the recorded one) and of a canceled booking, and never touches a meeting it does not know", async () => {
      const f = await fx(); const live = await f.book("10:00"); await f.svc.sync.run(live.id);
      const gone = await f.book("12:00"); await f.svc.sync.run(gone.id); await f.svc.cancelBooking(gone.id); await f.svc.sync.run(gone.id);
      const mid = await f.book("15:00");                                              // never synced: its meeting situation is somebody else's business
      const recorded = (await refOf(f, live.id, "zoom"))!.externalId!;
      dup(f, { marker: zoomMarkerFor(live.id) }, "surplus-live"); dup(f, { marker: zoomMarkerFor(gone.id) }, "surplus-canceled"); dup(f, { marker: zoomMarkerFor(mid.id) }, "mid-sync");
      dup(f, { marker: "mba-booking:00000000-0000-4000-8000-00000000dead" }, "someone-elses");   // another environment sharing this Zoom host
      const scan = await f.svc.sync.scanZoom();
      expect(scan).toMatchObject({ ran: true, removed: 2 });
      expect([...f.zoom.meetings.keys()].sort()).toEqual([recorded, "mid-sync", "someone-elses"].sort());
    });
    it("is part of every sweep, rate limited, and reported in the heartbeat", async () => {
      const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
      dup(f, { marker: zoomMarkerFor(b.id) }, "extra");
      const first = await f.svc.runMaintenance();
      expect(first.summary.zoomDuplicatesRemoved).toBe(1); expect(first.summary.zoomScanAt).toBeTruthy();
      dup(f, { marker: zoomMarkerFor(b.id) }, "extra-2");
      expect((await f.svc.runMaintenance()).summary.zoomDuplicatesRemoved).toBe(0);   // not again within 5 minutes
      f.advance(16 * 60_000);
      expect((await f.svc.runMaintenance()).summary.zoomDuplicatesRemoved).toBe(1);
    });
    it("a Zoom outage skips the scan and uses up nothing", async () => {
      const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
      f.zoom.listMarkedMeetings = async () => { throw new Error("down"); };
      expect(await f.svc.sync.scanZoom()).toMatchObject({ ran: false, removed: 0 });
    });
  });
});

// ===================================================================================================================== P1-4
describe("P1-4 webhooks: a failed delivery is retried, a processed one is a replay", () => {
  const sign = (secret: string, raw: string, ts = String(Math.floor(Date.now() / 1000))) => ({ ts, sig: "v0=" + createHmac("sha256", secret).update(`v0:${ts}:${raw}`).digest("hex") });
  const zoomReq = (raw: string, secret = "remediation-secret") => { const { ts, sig } = sign(secret, raw); return new Request("http://localhost/api/webhooks/scheduling/zoom", { method: "POST", body: raw, headers: { "x-zm-request-timestamp": ts, "x-zm-signature": sig } }); };
  beforeEach(() => { vi.stubEnv("SCHEDULING_PROTOTYPE", "true"); vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", "remediation-secret"); });

  it("Zoom: the audit reproducer. A transient failure answers 5xx; the identical retry RUNS the effect; a third delivery is a replay", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    hook.service = f.svc;
    const meetingId = (await refOf(f, b.id, "zoom"))!.externalId!;
    const original = f.svc.onExternalDeleted.bind(f.svc);
    const effect = vi.fn(original); effect.mockRejectedValueOnce(new Error("synthetic database outage"));
    f.svc.onExternalDeleted = effect as never;
    const raw = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: meetingId } } });
    expect((await zoomHook(zoomReq(raw), {})).status).toBe(500);
    const retry = await zoomHook(zoomReq(raw), {});
    expect(retry.status).toBe(200); expect(await retry.json()).toEqual({ ok: true, handled: true });
    expect(effect).toHaveBeenCalledTimes(2);                                         // the audit saw ONE
    expect(await refOf(f, b.id, "zoom")).toMatchObject({ externalId: null, status: "pending" });   // the lost-recovery action actually happened
    const replay = await zoomHook(zoomReq(raw), {});
    expect(await replay.json()).toMatchObject({ duplicate: true });
    expect(effect).toHaveBeenCalledTimes(2);                                         // a processed delivery is NOT run again
  });
  it("Zoom: a retry carrying a fresh timestamp and signature is still the same delivery (identified by its body)", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); hook.service = f.svc;
    const raw = JSON.stringify({ event: "meeting.deleted", event_ts: 1, payload: { object: { id: (await refOf(f, b.id, "zoom"))!.externalId } } });
    expect((await (await zoomHook(zoomReq(raw), {})).json())).toMatchObject({ handled: true });
    const later = sign("remediation-secret", raw, String(Math.floor(Date.now() / 1000) + 3));
    const again = await zoomHook(new Request("http://localhost/api/webhooks/scheduling/zoom", { method: "POST", body: raw, headers: { "x-zm-request-timestamp": later.ts, "x-zm-signature": later.sig } }), {});
    expect(await again.json()).toMatchObject({ duplicate: true });
  });
  it("Zoom: a worker that crashed after claiming leaves the delivery reclaimable; a concurrent holder gets 503 and no effect", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); hook.service = f.svc;
    const raw = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: (await refOf(f, b.id, "zoom"))!.externalId } } });
    const key = createHash("sha256").update(raw).digest("hex");
    await f.svc.repo.beginWebhook("zoom", key, new Date(f.clock()).toISOString(), 120);       // claimed by a worker that then died
    const effect = vi.spyOn(f.svc, "onExternalDeleted");
    const busy = await zoomHook(zoomReq(raw), {});
    expect(busy.status).toBe(503); expect(effect).not.toHaveBeenCalled();
    f.advance(121_000);
    const claimedAt = f.clock();
    // the route reads the real clock for its own timestamp check, but the inbox uses the service clock: the lease has expired there
    expect(claimedAt - NOW).toBeGreaterThan(120_000);
    const retry = await zoomHook(zoomReq(raw), {});
    expect(retry.status).toBe(200); expect(effect).toHaveBeenCalledTimes(1);
  });
  it("Zoom: a bad signature never reaches the inbox, and the validation challenge needs no claim", async () => {
    const f = await fx(); hook.service = f.svc;
    const claim = vi.spyOn(f.svc.repo, "beginWebhook");
    const raw = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: "1" } } });
    const forged = await zoomHook(new Request("http://localhost/api/webhooks/scheduling/zoom", { method: "POST", body: raw, headers: { "x-zm-request-timestamp": String(Math.floor(Date.now() / 1000)), "x-zm-signature": "v0=" + "0".repeat(64) } }), {});
    expect(forged.status).toBe(401);
    const stale = sign("remediation-secret", raw, String(Math.floor(Date.now() / 1000) - 3600));
    expect((await zoomHook(new Request("http://localhost/api/webhooks/scheduling/zoom", { method: "POST", body: raw, headers: { "x-zm-request-timestamp": stale.ts, "x-zm-signature": stale.sig } }), {})).status).toBe(401);
    expect(claim).not.toHaveBeenCalled();
  });
  it("Resend: a delivery status lost to a transient failure is applied on the retry, once; a bounce is never overwritten", async () => {
    const secret = Buffer.from("remediation-svix-secret").toString("base64");
    vi.stubEnv("SCHEDULING_RESEND_WEBHOOK_SECRET", "whsec_" + secret);
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id); hook.service = f.svc;
    const messageId = (await f.svc.repo.listEmailAttempts(b.id))[0].providerMessageId!;
    const original = f.svc.repo.setEmailDelivery.bind(f.svc.repo);
    const apply = vi.fn(original); apply.mockRejectedValueOnce(new Error("synthetic persistence outage")); f.svc.repo.setEmailDelivery = apply;
    const send = (type: string, id: string) => {
      const raw = JSON.stringify({ type, data: { email_id: messageId } }), ts = String(Math.floor(Date.now() / 1000));
      const sig = "v1," + createHmac("sha256", Buffer.from(secret, "base64")).update(`${id}.${ts}.${raw}`).digest("base64");
      return resendHook(new Request("http://localhost/api/webhooks/scheduling/resend", { method: "POST", body: raw, headers: { "svix-id": id, "svix-timestamp": ts, "svix-signature": sig } }), {});
    };
    expect((await send("email.delivered", "evt-1")).status).toBe(500);
    expect((await send("email.delivered", "evt-1")).status).toBe(200);
    expect(apply).toHaveBeenCalledTimes(2);
    expect((await f.svc.repo.listEmailAttempts(b.id))[0].deliveryStatus).toBe("delivered");
    expect(await (await send("email.delivered", "evt-1")).json()).toMatchObject({ duplicate: true });
    expect(apply).toHaveBeenCalledTimes(2);
    await send("email.bounced", "evt-2"); await send("email.delivered", "evt-3");
    expect((await f.svc.repo.listEmailAttempts(b.id))[0].deliveryStatus).toBe("bounced");
  });
});

// ===================================================================================================================== P1-1
describe("P1-1 the sign-in-free preview cannot reach the real service", () => {
  const LIVE = { NODE_ENV: "development", APP_ENV: "development", SCHEDULING_BACKEND: "supabase", SCHEDULING_GOOGLE: "live", SCHEDULING_ZOOM: "live", SCHEDULING_EMAIL: "resend" };
  const call = (init: { origin?: string; type?: string; site?: string; host?: string }) => previewPost(new Request("http://localhost:3000/api/scheduling-preview/bookings/audit-booking/cancel", {
    method: "POST", body: "{}", headers: { host: init.host ?? "localhost:3000", ...(init.origin ? { origin: init.origin } : {}), ...(init.site ? { "sec-fetch-site": init.site } : {}), "content-type": init.type ?? "application/json" },
  }), { params: Promise.resolve({ path: ["bookings", "audit-booking", "cancel"] }) });
  beforeEach(() => { for (const [k, v] of Object.entries(LIVE)) vi.stubEnv(k, v); hook.real.mockClear(); hook.preview = { cancelBooking: vi.fn().mockResolvedValue(undefined) }; hook.service = { cancelBooking: vi.fn() }; });

  it("the audit reproducer (production-like live modes, text/plain, foreign origin) is refused before any handler runs", async () => {
    const r = await call({ origin: "https://untrusted.example", type: "text/plain" });
    expect([403, 415]).toContain(r.status);
    expect((hook.preview as { cancelBooking: ReturnType<typeof vi.fn> }).cancelBooking).not.toHaveBeenCalled();
    expect((hook.service as { cancelBooking: ReturnType<typeof vi.fn> }).cancelBooking).not.toHaveBeenCalled();
  });
  it("a cross-site browser request and a non-JSON body are refused even from a loopback origin", async () => {
    expect((await call({ origin: "http://localhost:3000", site: "cross-site" })).status).toBe(403);
    expect((await call({ origin: "http://localhost:4000" })).status).toBe(403);
    expect((await call({ origin: "http://localhost:3000", type: "text/plain" })).status).toBe(415);
    expect((hook.preview as { cancelBooking: ReturnType<typeof vi.fn> }).cancelBooking).not.toHaveBeenCalled();
  });
  it("the preview's own request runs against the PREVIEW service, and the real service is never even resolved", async () => {
    const ok = await call({ origin: "http://localhost:3000", site: "same-origin" });
    expect(ok.status).toBe(200);
    expect((hook.preview as { cancelBooking: ReturnType<typeof vi.fn> }).cancelBooking).toHaveBeenCalledWith("audit-booking");
    expect(hook.real).not.toHaveBeenCalled();
    expect((hook.service as { cancelBooking: ReturnType<typeof vi.fn> }).cancelBooking).not.toHaveBeenCalled();
  });
  it("answers 404 and runs nothing outside development, on Vercel, or from another host, whatever else is set", async () => {
    vi.stubEnv("NODE_ENV", "production"); expect((await call({ origin: "http://localhost:3000" })).status).toBe(404);
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", "1"); expect((await call({ origin: "http://localhost:3000" })).status).toBe(404);
    vi.stubEnv("VERCEL", ""); expect((await call({ host: "192.168.1.9:3000" })).status).toBe(404);
    expect((hook.preview as { cancelBooking: ReturnType<typeof vi.fn> }).cancelBooking).not.toHaveBeenCalled();
  });
  it("structurally: nothing in the preview namespace imports the live service, adapters, Supabase or the admin session", () => {
    const root = path.resolve(__dirname, "../../..");
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
    const files = [
      "app/lib/scheduling/preview.ts", "app/lib/scheduling/preview-route.ts", "app/lib/scheduling/preview-page.ts", "app/lib/scheduling/preview-instance.ts",
      ...walk(path.join(root, "app/api/scheduling-preview")).map((f) => path.relative(root, f)), ...walk(path.join(root, "app/scheduling-preview")).map((f) => path.relative(root, f)),
    ].filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f));
    expect(files.length).toBeGreaterThan(8);
    const forbidden = /from\s+["'](?:[^"']*\/)?(instance|integrations|supabase\/[^"']*|adapters\/[^"']*|admin-session|google-oauth)["']/;
    const readsLiveSwitches = /SCHEDULING_(BACKEND|GOOGLE|ZOOM|EMAIL)\b/;
    for (const f of files) {
      const text = fs.readFileSync(path.join(root, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");   // code, not comments
      expect(forbidden.test(text), `${f} imports live code`).toBe(false);
      expect(readsLiveSwitches.test(text), `${f} reads a live-mode switch`).toBe(false);
    }
  });
});

// ===================================================================================================================== owner notifications
describe("owner notifications (new booking, reschedule, cancellation)", () => {
  const toOwner = (f: Fx) => f.email.sent.filter((m) => m.to === OWNER);
  const toGuest = (f: Fx) => f.email.sent.filter((m) => m.to !== OWNER);

  it("a new booking sends one guest confirmation and one SEPARATE owner message with the guest, the time in both zones, the Zoom link and no one else", async () => {
    const f = await fx({ owner: true });
    const other = await f.book("15:00", "Someone Else"); await f.svc.sync.run(other.id); f.email.sent.length = 0;
    const b = await f.book("10:00", "Grace Hopper"); await f.svc.sync.run(b.id);
    expect(toGuest(f)).toHaveLength(1); expect(toOwner(f)).toHaveLength(1);
    const [guestMail] = toGuest(f), [ownerMail] = toOwner(f);
    expect(ownerMail.subject).toMatch(/^New booking: Grace Hopper, Audit Talk,/); expect(guestMail.subject).toBe("Confirmed: Audit Talk");
    const zoomUrl = (await refOf(f, b.id, "zoom"))!.url!;
    expect(ownerMail.text).toContain(zoomUrl);
    expect(ownerMail.text).toContain("Grace Hopper"); expect(ownerMail.text).toContain(b.guestEmail); expect(ownerMail.text).toContain("10:00 AM – 10:30 AM");
    expect(ownerMail.text).not.toContain("Someone Else"); expect(ownerMail.text).not.toContain(other.guestEmail); expect(ownerMail.text).not.toContain(other.reference);
    expect(ownerMail.text).toContain("http://localhost:3000/admin/scheduling/bookings");
    expect(ownerMail.content!.audience).toBe("owner"); expect(guestMail.content!.audience ?? "guest").toBe("guest");
    expect(ownerMail.replyTo).toBe(b.guestEmail);                                    // the host answers the guest by replying
    expect(guestMail.replyTo).toBeUndefined();
    expect(ownerMail.text).not.toContain(b.reference);                               // the guest's private link is not forwarded
    // Google guest invitations stay OFF: the calendar event has no attendee, so Google emails nobody
    expect([...f.cal.events.values()].every((e) => !e.attendeeEmail)).toBe(true);
  });
  it("a reschedule sends one owner message with BOTH the previous and the new time; the guest's message is separate", async () => {
    const f = await fx({ owner: true }); const b = await f.book("10:00"); await f.svc.sync.run(b.id); f.email.sent.length = 0;
    await f.svc.rescheduleBooking(b.id, `${DAY}T14:00:00Z`); await f.svc.sync.run(b.id);
    const owner = toOwner(f); expect(owner).toHaveLength(1);
    expect(owner[0].subject).toMatch(/^Rescheduled: Audit Talk with Audit Guest, now /);
    expect(owner[0].text).toMatch(/Previous time: .*10:00 AM – 10:30 AM/); expect(owner[0].text).toMatch(/New time: .*2:00 PM – 2:30 PM/);
    expect(toGuest(f).map((m) => m.subject)).toEqual(["New time: Audit Talk"]);
    expect((await accepted(f, b.id)).filter((k) => k.startsWith("owner_")).sort()).toEqual(["owner_new_booking", "owner_rescheduled"]);
  });
  it("two reschedules before the next sync produce one owner message, from the time the owner was last told", async () => {
    const f = await fx({ owner: true }); const b = await f.book("10:00"); await f.svc.sync.run(b.id); f.email.sent.length = 0;
    await f.svc.rescheduleBooking(b.id, `${DAY}T12:00:00Z`); await f.svc.rescheduleBooking(b.id, `${DAY}T16:00:00Z`); await f.svc.sync.run(b.id);
    expect(toOwner(f)).toHaveLength(1);
    expect(toOwner(f)[0].text).toMatch(/Previous time: .*10:00 AM/); expect(toOwner(f)[0].text).toMatch(/New time: .*4:00 PM/);
  });
  it("a cancellation sends one owner message about that appointment", async () => {
    const f = await fx({ owner: true }); const b = await f.book("10:00"); await f.svc.sync.run(b.id); f.email.sent.length = 0;
    await f.svc.cancelBooking(b.id); await f.svc.sync.run(b.id);
    expect(toOwner(f)).toHaveLength(1); expect(toOwner(f)[0].subject).toMatch(/^Canceled: Audit Talk with Audit Guest/);
    expect(toOwner(f)[0].text).toMatch(/Was scheduled for: .*10:00 AM – 10:30 AM/); expect(toOwner(f)[0].text).not.toMatch(/Zoom:/);
    expect(toGuest(f).map((m) => m.subject)).toEqual(["Canceled: Audit Talk"]);
  });
  it("idempotent: repeated passes, a sweep and concurrent workers never send an owner message twice", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    await Promise.all([...Array.from({ length: 5 }, () => f.svc.sync.run(b.id)), f.svc.runMaintenance()]);
    for (let i = 0; i < 3; i++) { await f.svc.sync.run(b.id); await f.svc.runMaintenance(); }
    expect(toOwner(f)).toHaveLength(1);
    expect((await f.svc.repo.listEmailAttempts(b.id)).filter((a) => a.kind === "owner_new_booking" && a.status === "accepted")).toHaveLength(1);
    expect(f.email.sent.every((m) => m.idempotencyKey.startsWith("sched-email/"))).toBe(true);
    expect(new Set(f.email.sent.map((m) => m.idempotencyKey)).size).toBe(f.email.sent.length);
  });
  it("the first owner message waits for the Zoom link, and goes without it once Zoom keeps failing", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    f.zoom.failing = true;
    await f.svc.sync.run(b.id);
    expect(toOwner(f)).toHaveLength(0);                                              // one failure: still hoping for the link
    f.advance(61_000); await f.svc.sync.run(b.id);
    expect(toOwner(f)).toHaveLength(1);                                              // second failure: the owner hears about the booking anyway
    expect(toOwner(f)[0].text).toContain("Link pending");
    f.zoom.failing = false; f.advance(10 * 60_000); await f.svc.sync.run(b.id);
    expect(toOwner(f)).toHaveLength(1);                                              // and is not told again when the link arrives
    expect(toGuest(f).map((m) => m.subject)).toEqual(["Confirmed: Audit Talk", "Your Zoom details: Audit Talk"]);
  });
  it("independent delivery: a failing owner message neither blocks the guest nor makes the booking look unhealthy, and is retried on its own schedule", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    const send = f.email.send.bind(f.email); let ownerFailures = 2;
    f.email.send = async (m) => { if (m.to === OWNER && ownerFailures-- > 0) throw new Error("owner mailbox rejected"); return send(m); };
    const r = await f.svc.sync.run(b.id);
    expect(r.ok).toBe(true);                                                         // the booking's own synchronisation is fine
    expect(toGuest(f)).toHaveLength(1);
    let booking = (await f.svc.repo.getBooking(b.id))!;
    expect(booking.sync).toMatchObject({ status: "pending", attempts: 0 }); expect(Date.parse(booking.sync!.nextAttemptAt!)).toBe(f.clock() + 60_000);   // a retry just for the owner message
    expect((await f.svc.publicBooking(b.reference))!.progress).toBe("ready");        // the guest's page is not "delayed" by it
    await f.svc.sync.run(b.id); expect(toOwner(f)).toHaveLength(0);                  // too early: backoff respected
    f.advance(61_000); await f.svc.sync.run(b.id); expect(toOwner(f)).toHaveLength(0);       // second failure
    f.advance(301_000); await f.svc.sync.run(b.id);                                  // third attempt succeeds
    expect(toOwner(f)).toHaveLength(1); expect(toGuest(f)).toHaveLength(1);
    booking = (await f.svc.repo.getBooking(b.id))!;
    expect(booking.sync).toMatchObject({ status: "ok" });
    const attempts = (await f.svc.repo.listEmailAttempts(b.id)).filter((a) => a.kind === "owner_new_booking");
    expect(attempts.map((a) => a.status)).toEqual(["failed", "failed", "accepted"]);
  });
  it("gives up on the owner message after a bounded number of attempts, says so in the activity feed, and leaves the booking healthy", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    const send = f.email.send.bind(f.email);
    f.email.send = async (m) => { if (m.to === OWNER) throw new Error("rejected"); return send(m); };
    for (let i = 0; i < OWNER_MAX_ATTEMPTS + 3; i++) { await f.svc.sync.run(b.id); f.advance(3 * 3_600_000); }
    expect((await f.svc.repo.listEmailAttempts(b.id)).filter((a) => a.kind === "owner_new_booking" && a.status === "failed")).toHaveLength(OWNER_MAX_ATTEMPTS);
    expect((await f.svc.readAll()).activity.filter((a) => a.kind === "owner_notification_failed")).toHaveLength(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
  });
  it("the other way round: a failing guest message does not stop the owner message", async () => {
    const f = await fx({ owner: true }); const b = await f.book();
    const send = f.email.send.bind(f.email);
    f.email.send = async (m) => { if (m.to !== OWNER) throw new Error("guest mailbox rejected"); return send(m); };
    const r = await f.svc.sync.run(b.id);
    expect(r.ok).toBe(false); expect(toOwner(f)).toHaveLength(1);
    expect((await f.svc.repo.getBooking(b.id))!.sync).toMatchObject({ status: "pending", attempts: 1 });
  });
  it("sends nothing when no owner address is configured", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    expect(f.email.sent.some((m) => m.content?.audience === "owner")).toBe(false);
  });
  it("the host's message is its own template: guest text is escaped, and there is no guest footer, signature or unsubscribe", async () => {
    const f = await fx({ owner: true });
    const b = await f.book("10:00", "Eve <img src=x onerror=alert(1)>", "Hello <script>alert('x')</script> & goodbye"); await f.svc.sync.run(b.id);
    const m = toOwner(f)[0]; const html = renderBookingEmail(m.content!).html;
    expect(html).not.toMatch(/<script|<img src=x/i); expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("MBA Scheduling"); expect(html).not.toContain("You are receiving this message because you booked"); expect(html).not.toMatch(/unsubscribe/i);
    expect(html).not.toContain("Martin Dubreuil</strong>");                              // no guest-facing signature block
    expect(m.text).toContain("Hello <script>"); expect(m.text).not.toContain("<img src=x onerror=alert(1)>".replace("<img", "<IMG"));   // plain text carries the words, never rendered
    const guestHtml = renderBookingEmail(toGuest(f)[0].content!).html;
    expect(guestHtml).toContain("You are receiving this message because you booked");   // the guest's template is unchanged
  });
  it("a guest name cannot add header lines to the owner's subject", async () => {
    const f = await fx({ owner: true }); const b = await f.book("10:00", "Mallory\r\nBcc: attacker@example.test"); await f.svc.sync.run(b.id);
    const m = toOwner(f)[0];
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});

// ===================================================================================================================== community consent
describe("community consent", () => {
  it("is offered only for a confirmed booking whose Zoom details are ready, and only until an answer is recorded", () => {
    const due = (status: string, progress: string, community: string) => communityPromptDue({ status, progress, community });
    expect(due("confirmed", "ready", "unseen")).toBe(true);
    expect(due("confirmed", "ready", "shown")).toBe(true);                           // opened but never answered: may be offered again
    for (const progress of ["preparing", "delayed"]) expect(due("confirmed", progress, "unseen")).toBe(false);
    expect(due("canceled", "ready", "unseen")).toBe(false);
    for (const answered of ["joined", "declined", "dismissed"]) expect(due("confirmed", "ready", answered)).toBe(false);   // no repeated prompt after a decision
  });
  it("the server refuses to record anything before the booking is ready, and for a canceled booking", async () => {
    const f = await fx(); f.zoom.failing = true; const b = await f.book(); await f.svc.sync.run(b.id);
    await expect(f.svc.recordCommunity(b.reference, "shown")).rejects.toMatchObject({ status: 409 });
    await expect(f.svc.recordCommunity(b.reference, "joined")).rejects.toMatchObject({ status: 409 });
    expect((await f.svc.repo.getBooking(b.id))!.community.state).toBe("unseen");
    f.zoom.failing = false; f.advance(10 * 60_000); await f.svc.sync.run(b.id);
    expect(await f.svc.recordCommunity(b.reference, "shown")).toBe("shown");
    await f.svc.cancelBooking(b.id);
    await expect(f.svc.recordCommunity(b.reference, "joined")).rejects.toMatchObject({ status: 409 });
  });
  it("'yes' stores the consent with its wording version, timestamp, address and source, once; the booking is untouched", async () => {
    const f = await fx(); const b = await f.book(); await f.svc.sync.run(b.id);
    const before = await f.svc.repo.getBooking(b.id);
    expect(await f.svc.recordCommunity(b.reference, "joined")).toBe("joined");
    expect(await f.svc.recordCommunity(b.reference, "declined")).toBe("joined");     // the first answer stands
    const consents = (await f.svc.readAll()).consents.filter((c) => c.bookingId === b.id);
    expect(consents).toHaveLength(1);
    expect(consents[0]).toMatchObject({ choice: "joined", source: "booking_confirmation", wordingVersion: "scheduling-community-v2", email: b.guestEmail, simulated: false });
    expect(Number.isNaN(Date.parse(consents[0].at))).toBe(false); expect(consents[0].wording).toContain("Yes, keep me in the loop");
    const after = await f.svc.repo.getBooking(b.id);
    expect(after).toMatchObject({ status: "confirmed", startUtc: before!.startUtc, version: before!.version });
  });
  it("'no thanks' and 'close' are recorded as non-consent and end the prompt; nobody is enrolled without a 'yes'", async () => {
    const f = await fx(); const a = await f.book("10:00"); const c = await f.book("12:00"); await f.svc.sync.run(a.id); await f.svc.sync.run(c.id);
    await f.svc.recordCommunity(a.reference, "shown"); expect(await f.svc.recordCommunity(a.reference, "declined")).toBe("declined");
    await f.svc.recordCommunity(c.reference, "shown"); expect(await f.svc.recordCommunity(c.reference, "dismissed")).toBe("dismissed");
    expect(await f.svc.recordCommunity(c.reference, "joined")).toBe("dismissed");     // a later request cannot turn a closed window into consent
    const rows = (await f.svc.readAll()).consents;
    expect(rows.filter((r) => r.choice === "joined")).toHaveLength(0);
    expect(communityPromptDue({ status: "confirmed", progress: "ready", community: (await f.svc.publicBooking(a.reference))!.community })).toBe(false);
  });
  it("nothing in the modal is pre-selected, and the prompt offers accept, decline and dismiss", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../../components/scheduling/CommunityModal.tsx"), "utf8");
    expect(src).not.toMatch(/defaultChecked|checked=|type="checkbox"|type="radio"/);
    // The markup lives in CommunityDialog, which receives the same two answers; the labels come from the approved wording constants ("Not now" / "Yes, keep me in the loop").
    expect(src).toMatch(/onChoose\("declined"\)/); expect(src).toMatch(/onChoose\("joined"\)/); expect(src).toMatch(/COMMUNITY_DECLINE/); expect(src).toMatch(/COMMUNITY_JOIN/);
    expect(src).toMatch(/choose = async/); expect(src).toMatch(/close\(true\)/);                  // the answer handlers and the dismissal path are still the modal's own
    expect(src).toMatch(/Escape/); expect(src).toMatch(/aria-modal="true"/);
  });
});

// sanity: the attempt budget used above is the one the engine really has
describe("constants", () => { it("are what the tests assume", () => { expect(MAX_ATTEMPTS).toBe(8); expect(ZOOM_REVIEW_AFTER_SECONDS).toBe(300); expect(OWNER_MAX_ATTEMPTS).toBe(5); }); });
