import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SupabaseRepository } from "./adapters/supabase-repository";
import { DocumentRepository } from "./document-repository";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, type MockCalendar, type MockEmail, type MockZoom } from "./providers";
import type { SchedulingRepository } from "./repository";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { BACKOFF_SECONDS, googleEventIdFor, MAX_ATTEMPTS, zoomMarkerFor } from "./sync";
import { bookingRows, needsAttention, workerState } from "./admin-views";
import { localDbReady } from "./testing/local-db";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

/**
 * Background execution and recovery. The same scenarios run against the document store AND real Postgres (the LOCAL stack only), with mock
 * Google / Zoom / email. The service is given a `defer` queue instead of Next's `after`, so a test decides exactly when the background work runs
 * (or never runs: a killed function). Races are made deterministic by holding Zoom's create call open.
 */
const local = await localDbReady();
const NOW = Date.parse("2031-02-20T12:00:00Z");
const TZ = "America/Toronto";
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(++seq).toString(36)}`;

type Backend = { name: string; enabled: boolean; open: () => Promise<{ repo: SchedulingRepository; close: () => Promise<void> }> };
const backends: Backend[] = [
  { name: "document store", enabled: true, open: async () => {
    const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = TZ;
    return { repo: new DocumentRepository(new MemoryStore(seed)), close: async () => undefined };
  } },
  { name: "local Postgres", enabled: !!local, open: async () => {
    const db = createClient(local!.url, local!.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const repo = new SupabaseRepository(db as never);
    const originalTz = (await repo.getSettings()).homeTimeZone;
    await repo.saveSettings({ homeTimeZone: TZ });
    const typeIds: string[] = [];
    const pulseBefore = await repo.getLastSweep();                        // the dev server's real recovery pulse: the sweeps below must not leave a fake one behind
    const save = repo.saveMeetingType.bind(repo);
    repo.saveMeetingType = async (t, create) => { const out = await save(t, create); typeIds.push(out.id); return out; };
    return { repo, close: async () => {
      if (typeIds.length) { await db.from("sched_bookings").delete().in("meeting_type_id", typeIds); await db.from("sched_meeting_types").delete().in("id", typeIds); }
      await db.from("sched_activity").delete().or("summary.like.%BgTest%");
      if (pulseBefore) await repo.recordSweep(pulseBefore.at, pulseBefore.summary); else await db.from("sched_worker_heartbeat").delete().eq("id", true);
      await repo.saveSettings({ homeTimeZone: originalTz });
    } };
  } },
];

for (const backend of backends) {
  (backend.enabled ? describe : describe.skip)(`background execution and recovery (${backend.name})`, () => {
    let repo: SchedulingRepository; let close: () => Promise<void>;
    let cal: MockCalendar; let zoom: MockZoom; let email: MockEmail; let svc: SchedulingService;
    let queue: Array<() => Promise<unknown>>; let now: number; let dayNo = 0;

    const drain = async () => { while (queue.length) await Promise.all(queue.splice(0).map((t) => t())); };
    const build = (withDefer = true) => {
      cal = createMockGoogleCalendar({ homeTimeZone: () => TZ, outage: () => false, pretendCommitments: false });
      zoom = createMockZoom({ failing: () => false });
      email = createSimulatedEmail();
      queue = [];
      svc = new SchedulingService({ repo, now: () => now, calendar: cal, zoom, email, defer: withDefer ? (t) => { queue.push(t); } : undefined });
    };
    const date = () => new Date(Date.UTC(2031, 3, 10 + ++dayNo)).toISOString().slice(0, 10);          // a fresh day per test (all in daylight time, UTC-4)
    const at = (d: string, hhmm: string) => new Date(`${d}T${hhmm}:00-04:00`).toISOString();
    const mkType = (d: string[], over: Record<string, unknown> = {}) => svc.saveMeetingType({ slug: `bg-${uid()}`, name: "BgTest Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 30, bufferBeforeMinutes: 0,
      availability: { weekly: {}, breaks: [], daysOff: [], overrides: Object.fromEntries(d.map((x) => [x, [{ start: "06:00", end: "20:00" }]])), bookingWindowDays: 365 }, ...over });
    let n = 0;
    const book = (slug: string, startUtc: string, key = `bg-key-${uid()}-${++n}`) => svc.createBooking({ slug, startUtc, guestName: "BgTest Guest", guestEmail: `bg${n}@example.com`, guestTimeZone: "Europe/London", idempotencyKey: key });
    const row = async (reference: string) => (await repo.getBookingByReference(reference))!;
    const refs = async (id: string) => repo.listRefs(id);
    const accepted = async (id: string) => (await repo.listEmailAttempts(id)).filter((a) => a.status === "accepted").map((a) => a.kind);
    /** Holds Zoom's create call open, so a test can change the booking while a sync is demonstrably in flight. */
    const holdZoomCreate = () => {
      const orig = zoom.createMeeting.bind(zoom); let release!: () => void; let started!: () => void;
      const gate = new Promise<void>((r) => (release = r)), begun = new Promise<void>((r) => (started = r));
      zoom.createMeeting = async (i) => { started(); await gate; return orig(i); };
      return { begun, release };
    };

    beforeAll(async () => { ({ repo, close } = await backend.open()); });
    afterAll(async () => { await close(); });
    // Each test gets a fresh external world, but bookings of earlier tests stay in the repository. The sweep is global, so it would (rightly) notice that their
    // recorded Zoom meetings are gone from the new world. Retire them first, with a throwaway service of its own, so a test only ever sees its own bookings.
    const retireEarlierBookings = async () => {
      const retirer = new SchedulingService({ repo, now: () => now, calendar: createMockGoogleCalendar({ homeTimeZone: () => TZ, outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email: createSimulatedEmail() });
      const mine = new Set((await repo.listMeetingTypes()).filter((t) => t.name.startsWith("BgTest")).map((t) => t.id));   // only this suite's own bookings, never a real one
      for (const b of await repo.listBookings()) if (!b.demo && b.status === "confirmed" && mine.has(b.meetingTypeId)) await retirer.cancelBooking(b.id);
    };
    beforeEach(async () => { now = NOW; await retireEarlierBookings(); build(); });

    it("returns as soon as the booking is saved, before Zoom, Google or email have run, and says so honestly", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking, replay } = await book(t.slug, at(d, "10:00"));
      expect(replay).toBe(false);
      expect(booking).toMatchObject({ status: "confirmed", progress: "preparing", zoom: { status: "pending", joinUrl: null } });   // no link is promised
      expect(zoom.creates).toBe(0); expect(cal.events.size).toBe(0); expect(email.sent).toHaveLength(0);
      const b = await row(booking.reference);
      expect(b).toMatchObject({ status: "confirmed", sync: { status: "pending" } });                                              // saved and queued, not lost
      expect(queue).toHaveLength(1);
      await drain();                                                                                                              // leave nothing queued behind for later tests
    });

    it("then completes in the background: one meeting, one event, one email, and the page becomes ready with the link", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      await drain();
      const after = (await svc.publicBooking(booking.reference))!;
      expect(after.progress).toBe("ready"); expect(after.zoom.joinUrl).toMatch(/^https:\/\//);
      expect(zoom.creates).toBe(1); expect(cal.events.size).toBe(1); expect(email.sent).toHaveLength(1);
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok" });
    });

    it("treats duplicate requests as one booking, and two workers racing for it still create one of everything", async () => {
      const d = date(); const t = await mkType([d]); const key = `bg-dup-${uid()}`;
      const [a, b] = await Promise.all([book(t.slug, at(d, "10:00"), key), book(t.slug, at(d, "10:00"), key)]);
      expect(a.booking.reference).toBe(b.booking.reference);
      expect([a.replay, b.replay].sort()).toEqual([false, true]);
      await drain();                                                                                                             // both queued tasks run at once
      expect(zoom.creates).toBe(1); expect(zoom.meetings.size).toBe(1); expect(cal.events.size).toBe(1); expect(email.sent).toHaveLength(1);
      await book(t.slug, at(d, "10:00"), key); await drain();                                                                   // a late retry, long after
      expect(zoom.creates).toBe(1); expect(email.sent).toHaveLength(1);
    });

    it("canceling before the first sync has run leaves nothing behind, and the guest is told it was canceled", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      const id = (await row(booking.reference)).id;
      await svc.cancelBooking(id);
      await drain();
      expect(zoom.meetings.size).toBe(0); expect(cal.events.size).toBe(0);
      expect(await accepted(id)).toEqual(["cancellation"]);
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok" });
      expect((await svc.publicBooking(booking.reference))).toMatchObject({ status: "canceled", progress: "ready" });
    });

    it("canceling WHILE a sync is in flight: the in-flight run is not recorded as done and cleans up what it created (no orphans)", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      const id = (await row(booking.reference)).id;
      const hold = holdZoomCreate();
      const inflight = svc.sync.run(id);                                                                                          // claims the lock, starts creating the Zoom meeting
      await hold.begun;
      await svc.cancelBooking(id);                                                                                                // lands mid-run; must not release the worker's lock
      expect((await row(booking.reference)).status).toBe("canceled");
      await drain();                                                                                                              // the cancel's own background task fires NOW, finds the lock held and gives up
      expect(zoom.meetings.size).toBe(0);
      hold.release();
      const result = await inflight;                                                                                              // from here only the in-flight run itself can put things right: no sweep, no rescue task
      expect(result.skipped).not.toBe(true);
      expect(zoom.creates).toBe(1);                                                                                               // it did create one...
      expect(zoom.meetings.size).toBe(0); expect(cal.events.size).toBe(0);                                                        // ...and it was removed again
      const r = await refs(id);
      expect(r.find((x) => x.provider === "zoom")?.status).toBe("deleted"); expect(r.find((x) => x.provider === "google")?.status).toBe("deleted");
      expect(await accepted(id)).toEqual(["cancellation"]);                                                                       // never confirmed, so only the cancellation
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok", attempts: 0 });
    });

    it("rescheduling WHILE a sync is in flight ends with one meeting and one event at the new time, and one confirmation", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      const id = (await row(booking.reference)).id;
      const hold = holdZoomCreate();
      const inflight = svc.sync.run(id);
      await hold.begun;
      await svc.rescheduleBooking(id, at(d, "14:00"));
      await drain();                                                                                                              // the reschedule's own task finds the lock held and gives up
      hold.release();
      await inflight;                                                                                                             // only the in-flight run itself can converge
      expect(zoom.creates).toBe(1); expect(zoom.meetings.size).toBe(1);                                                           // updated in place, not duplicated
      expect([...zoom.meetings.values()][0].startUtc).toBe(at(d, "14:00"));
      expect(cal.events.size).toBe(1); expect(cal.events.get(googleEventIdFor(id))!.startUtc).toBe(at(d, "14:00"));
      expect(await accepted(id)).toEqual(["confirmation"]);                                                                       // no "rescheduled" notice for a change the guest never saw
      expect(email.sent).toHaveLength(1); expect(email.sent[0].text).toContain("7:00");
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok" });
    });

    it("a Google failure never delays the guest's Zoom link; it is retried on the backoff schedule and recovers", async () => {
      const d = date(); const t = await mkType([d]);
      cal.failWrites = true;
      const { booking } = await book(t.slug, at(d, "10:00"));
      await drain();
      expect((await svc.publicBooking(booking.reference))!.progress).toBe("ready");                                               // Zoom is what the guest waits for
      const b1 = await row(booking.reference);
      expect(b1.sync).toMatchObject({ status: "pending", attempts: 1 });
      expect(cal.events.size).toBe(0);
      now += (BACKOFF_SECONDS[0] - 1) * 1000; expect((await svc.runMaintenance()).results).toHaveLength(0);                       // not yet due
      now += 2000; cal.failWrites = false;
      const run = await svc.runMaintenance();
      expect(run.results).toHaveLength(1); expect(run.results[0].ok).toBe(true);
      expect(cal.events.size).toBe(1); expect(zoom.creates).toBe(1); expect(email.sent).toHaveLength(1);
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok", attempts: 0 });
    });

    it("a Zoom failure shows 'delayed' without a link, then recovers: the link appears once and the follow-up email is sent once", async () => {
      const d = date(); const t = await mkType([d]);
      zoom.failing = true;
      const { booking } = await book(t.slug, at(d, "10:00"));
      expect(booking.progress).toBe("preparing");
      await drain();
      const mid = (await svc.publicBooking(booking.reference))!;
      expect(mid).toMatchObject({ progress: "delayed", zoom: { joinUrl: null } });
      expect(mid.zoom.joinUrl).toBeNull();
      zoom.failing = false; now += 61_000;
      await svc.runMaintenance(); await svc.runMaintenance();
      const done = (await svc.publicBooking(booking.reference))!;
      expect(done.progress).toBe("ready"); expect(done.zoom.joinUrl).toMatch(/^https:\/\//);
      expect(zoom.creates).toBe(1);
      const id = (await row(booking.reference)).id;
      expect((await accepted(id)).sort()).toEqual(["confirmation", "zoom_details"]);
      expect(cal.events.get(googleEventIdFor(id))!.location).toBe(done.zoom.joinUrl);
    });

    it("a killed function loses nothing: the booking stays queued and the sweep finishes it; a dead worker's lock only blocks until it expires", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      const id = (await row(booking.reference)).id;
      queue.length = 0;                                                                                                           // the after() task never ran
      expect(await repo.claimSync(id, new Date(now).toISOString(), 300)).toEqual(expect.any(String));                                              // ...or it died holding the lock
      expect((await svc.runMaintenance()).results).toHaveLength(0);                                                               // locked: left alone
      now += 301_000;
      const swept = await svc.runMaintenance();
      expect(swept.results.map((r) => r.ok)).toEqual([true]);
      expect(zoom.creates).toBe(1); expect(cal.events.size).toBe(1); expect(email.sent).toHaveLength(1);
      expect((await svc.publicBooking(booking.reference))!.progress).toBe("ready");
    });

    it("a crash between the Zoom call and the database write does not create a second meeting: it is found by its marker", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      const id = (await row(booking.reference)).id;
      const orig = repo.upsertRef.bind(repo); let crashed = false;
      repo.upsertRef = async (ref) => { if (!crashed && ref.provider === "zoom" && ref.status === "synced") { crashed = true; throw new Error("process died before saving the Zoom reference"); } return orig(ref); };
      try {
        await drain();                                                                                                            // meeting created in Zoom, reference never saved
        expect(zoom.meetings.size).toBe(1);
        now += 61_000; await svc.runMaintenance();
      } finally { repo.upsertRef = orig; }
      expect(zoom.creates).toBe(1); expect(zoom.meetings.size).toBe(1);
      expect([...zoom.meetings.values()][0].marker).toBe(zoomMarkerFor(id));
      expect((await refs(id)).find((r) => r.provider === "zoom")).toMatchObject({ status: "synced" });
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok" });
    });

    it("a cancel after such a crash still removes the unrecorded meeting (found by marker), leaving no orphan", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      const id = (await row(booking.reference)).id;
      const orig = repo.upsertRef.bind(repo); let crashed = false;
      repo.upsertRef = async (ref) => { if (!crashed && ref.provider === "zoom" && ref.status === "synced") { crashed = true; throw new Error("process died"); } return orig(ref); };
      try { await drain(); } finally { repo.upsertRef = orig; }
      expect(zoom.meetings.size).toBe(1);                                                                                         // an unrecorded meeting exists
      await svc.cancelBooking(id); await drain();
      now += 61_000; await svc.runMaintenance();
      expect(zoom.meetings.size).toBe(0); expect(cal.events.size).toBe(0);
    });

    it("the sweep re-queues a booking that claims to be fine but whose external state is not, and fixes it", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      await drain();
      const id = (await row(booking.reference)).id;
      expect((await svc.runMaintenance()).reconciled.requeued).toEqual([]);                                                       // healthy: left alone
      const g = (await refs(id)).find((r) => r.provider === "google")!;
      await repo.upsertRef({ ...g, status: "pending", syncedVersion: 0, contentKey: null });                                      // e.g. a restored backup
      cal.events.clear();
      const swept = await svc.runMaintenance();
      expect(swept.reconciled.requeued).toEqual([id]);
      expect(cal.events.size).toBe(1); expect(zoom.creates).toBe(1); expect(email.sent).toHaveLength(1);
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok" });
    });

    it("an event added to the calendar after the slot was offered is flagged for the administrator; the booking stands", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      cal.extraBusy.push({ start: Date.parse(at(d, "10:10")), end: Date.parse(at(d, "10:50")), before: 0, after: 0, label: "Added later" });
      await drain();
      const id = (await row(booking.reference)).id;
      const flagged = (await repo.snapshot()).activity.filter((a) => a.kind === "calendar_conflict" && a.bookingId === id);
      expect(flagged).toHaveLength(1);
      expect((await row(booking.reference)).status).toBe("confirmed");
      expect(cal.events.size).toBe(1);
      // ...and it is on the booking itself, where the admin looks, not only in the activity feed
      const rows = bookingRows(await repo.snapshot(), now).filter((r) => r.id === id);
      expect(rows[0]).toMatchObject({ conflict: true, status: "confirmed" }); expect(needsAttention(rows[0])).toBe(true);
    });

    it("a conflict that appears AFTER the event exists is found by the sweep, flagged once, and scanning is rate limited", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      await drain();
      const id = (await row(booking.reference)).id;
      const first = await svc.runMaintenance();
      expect(first.summary.conflictsFlagged).toBe(0);                                                                             // clean calendar: nothing flagged
      cal.extraBusy.push({ start: Date.parse(at(d, "10:15")), end: Date.parse(at(d, "11:15")), before: 0, after: 0, label: "Added later" });
      now += 60_000; expect((await svc.runMaintenance()).summary.conflictsFlagged).toBe(0);                                      // scanned less than 15 minutes ago: not scanned again yet
      now += 15 * 60_000; const found = await svc.runMaintenance();
      expect(found.summary.conflictsFlagged).toBe(1);
      expect((await row(booking.reference)).events.filter((e) => e.kind === "calendar_conflict")).toHaveLength(1);
      now += 16 * 60_000; expect((await svc.runMaintenance()).summary.conflictsFlagged).toBe(0);                                 // still there, but already flagged: no repeat
      expect((await row(booking.reference)).events.filter((e) => e.kind === "calendar_conflict")).toHaveLength(1);
      expect((await row(booking.reference)).id).toBe(id);
    });

    it("never mistakes our own back-to-back bookings, which Google may report as one merged block, for a conflict", async () => {
      const d = date(); const t = await mkType([d], { bufferAfterMinutes: 0, bufferBeforeMinutes: 0 });
      await book(t.slug, at(d, "10:00")); await book(t.slug, at(d, "10:30"));
      await drain();
      cal.events.clear();                                                                                                         // report them the way Google can: one merged block covering both
      cal.extraBusy.push({ start: Date.parse(at(d, "10:00")), end: Date.parse(at(d, "11:00")), before: 0, after: 0, label: "Merged" });
      const r = await svc.runMaintenance();
      expect(r.summary.conflictsFlagged).toBe(0);
    });

    it("records a pulse on every sweep, so the admin can tell the recovery worker is running", async () => {
      const d = date(); const t = await mkType([d]);
      await book(t.slug, at(d, "10:00")); queue.length = 0;                                                                       // the background task is lost
      const run = await svc.runMaintenance();
      const pulse = (await repo.getLastSweep())!;
      expect(pulse.at).toBe(new Date(now).toISOString());
      expect(pulse.summary).toEqual(run.summary); expect(pulse.summary).toMatchObject({ processed: 1, succeeded: 1, failed: 0 });
      expect(workerState(pulse.at, now)).toEqual({ state: "ok", ageSeconds: 0 });
      expect(workerState(pulse.at, now + 6 * 60_000).state).toBe("stale");
    });

    it("a conflict-scan timestamp in the future (clock skew, a restored backup) never switches scanning off", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00")); await drain();
      await repo.recordSweep(new Date(now).toISOString(), { reconciled: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0, conflictsFlagged: 0, conflictScanAt: new Date(now + 3 * 365 * 86_400_000).toISOString() });
      cal.extraBusy.push({ start: Date.parse(at(d, "10:10")), end: Date.parse(at(d, "10:50")), before: 0, after: 0, label: "Added later" });
      expect((await svc.runMaintenance()).summary.conflictsFlagged).toBe(1);
      expect((await row(booking.reference)).events.some((e) => e.kind === "calendar_conflict")).toBe(true);
    });

    it("a Google outage during the sweep does not break it: no false conflicts, the pulse is still written, and healthy bookings are untouched", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00")); await drain();
      cal.authExpired = true;                                                                                                     // credentials expire / Google is unreachable
      cal.extraBusy.push({ start: Date.parse(at(d, "10:10")), end: Date.parse(at(d, "10:50")), before: 0, after: 0, label: "Unseen" });
      now += 20 * 60_000;
      const run = await svc.runMaintenance();                                                                                     // must not throw
      expect(run.summary.conflictsFlagged).toBe(0);                                                                               // it could not look, so it claims nothing
      expect((await repo.getLastSweep())!.at).toBe(new Date(now).toISOString());
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok" });
      cal.authExpired = false;                                                                                                    // and once Google is back, the next scan finds it
      now += 60_000; expect((await svc.runMaintenance()).summary.conflictsFlagged).toBe(1);                                      // the failed scan did not use up its window: one minute later is enough
    });

    it("an interrupted booking shows as 'stuck' in the admin until the sweep picks it up, then clears", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00")); queue.length = 0;                                                   // the function died: nothing will run it
      const view = async () => bookingRows(await repo.snapshot(), now).find((r) => r.reference === booking.reference)!;
      expect((await view()).recovery.state).toBe("syncing");                                                                      // fresh: looks like normal work in progress
      now += 6 * 60_000;
      expect((await view()).recovery).toEqual({ state: "stuck", label: "Waiting for the recovery worker" }); expect(needsAttention(await view())).toBe(true);
      await svc.runMaintenance();
      expect((await view()).recovery.state).toBe("ok"); expect(needsAttention(await view())).toBe(false);
    });

    it("retries are bounded: after the last attempt the booking stays visible as 'gave up', makes no further provider calls, and recovers on Retry now", async () => {
      const d = date(); const t = await mkType([d]);
      zoom.failing = true;
      let calls = 0; const orig = zoom.findMeetingsByMarker.bind(zoom); zoom.findMeetingsByMarker = async (m) => { calls++; return orig(m); };   // one call per attempt
      const { booking } = await book(t.slug, at(d, "10:00"));
      await drain();
      for (let i = 2; i <= MAX_ATTEMPTS; i++) { now += 13 * 3_600_000; await svc.runMaintenance(); }                              // each attempt is due after at most 12 hours
      expect(calls).toBe(MAX_ATTEMPTS);
      const id = (await row(booking.reference)).id;
      const view = async () => bookingRows(await repo.snapshot(), now).find((r) => r.id === id)!;
      expect((await row(booking.reference)).sync).toMatchObject({ status: "failed", attempts: MAX_ATTEMPTS });
      expect((await view()).recovery.state).toBe("failed"); expect(needsAttention(await view())).toBe(true);
      expect((await repo.snapshot()).activity.some((a) => a.kind === "sync_failed" && /Giving up/.test(a.summary) && a.bookingId === id)).toBe(true);
      now += 13 * 3_600_000; await svc.runMaintenance(); await svc.runMaintenance();
      expect(calls).toBe(MAX_ATTEMPTS);                                                                                           // given up: the sweep leaves it alone
      zoom.failing = false;
      const retried = await svc.retrySync(id);                                                                                    // the admin's "Retry now"
      expect(retried.ok).toBe(true);
      expect((await row(booking.reference)).sync).toMatchObject({ status: "ok", attempts: 0 });
      expect(zoom.creates).toBe(1); expect((await view()).recovery.state).toBe("ok");
    });

    it("refuses to book when the calendar cannot be read, and writes nothing", async () => {
      const d = date(); const t = await mkType([d]);
      cal.authExpired = true;
      await expect(book(t.slug, at(d, "10:00"))).rejects.toMatchObject({ code: "calendar_unavailable", status: 503 });
      cal.authExpired = false;
      expect((await repo.listConfirmedBookings(at(d, "00:00"), at(d, "23:59"), 0))).toHaveLength(0);
      expect(queue).toHaveLength(0);
    });

    it("the guest's request time does not depend on how slow Zoom and Google are (only the database write is waited for)", async () => {
      const SLOW = 700;
      const d = date(); const t = await mkType([d]);
      const origZoom = zoom.createMeeting.bind(zoom), origCal = cal.upsertEvent.bind(cal);
      zoom.createMeeting = async (i) => { await new Promise((r) => setTimeout(r, SLOW)); return origZoom(i); };
      cal.upsertEvent = async (i) => { await new Promise((r) => setTimeout(r, SLOW)); return origCal(i); };
      const t0 = Date.now();
      const { booking } = await book(t.slug, at(d, "10:00"));
      const fast = Date.now() - t0;
      expect(booking.progress).toBe("preparing");
      expect(fast).toBeLessThan(SLOW);                                                                                            // returned long before either provider answered
      await drain();
      expect(zoom.meetings.size).toBe(1); expect(cal.events.size).toBe(1);
      // the same work, run inline as before, takes at least both delays
      build(false);
      const origZoom2 = zoom.createMeeting.bind(zoom), origCal2 = cal.upsertEvent.bind(cal);
      zoom.createMeeting = async (i) => { await new Promise((r) => setTimeout(r, SLOW)); return origZoom2(i); };
      cal.upsertEvent = async (i) => { await new Promise((r) => setTimeout(r, SLOW)); return origCal2(i); };
      const d2 = date(); const t2 = await mkType([d2]);
      const t1 = Date.now(); await book(t2.slug, at(d2, "10:00")); const slow = Date.now() - t1;
      expect(slow).toBeGreaterThanOrEqual(2 * SLOW - 50);
    });

    it("runs the work inline, before returning, when no background hook is available (scripts, the cron worker)", async () => {
      build(false);
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      expect(booking).toMatchObject({ progress: "ready", zoom: { status: "ready" } });
      expect(zoom.creates).toBe(1);
    });

    it("a polling page starts due work exactly once and never touches unknown or locked bookings", async () => {
      const d = date(); const t = await mkType([d]);
      const { booking } = await book(t.slug, at(d, "10:00"));
      queue.length = 0;
      expect(await svc.nudge("no-such-reference")).toBeNull();
      const first = await svc.nudge(booking.reference);
      expect(first!.progress).toBe("preparing"); expect(queue).toHaveLength(1);                                                   // due and free: started
      await drain();
      expect((await svc.nudge(booking.reference))!.progress).toBe("ready"); expect(queue).toHaveLength(0);                        // done: nothing to start
      expect(zoom.creates).toBe(1);
    });
  });
}
