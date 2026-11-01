import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SupabaseRepository } from "./adapters/supabase-repository";
import { createSimulatedEmail, type MockEmail } from "./providers";
import { SchedulingService } from "./service";
import { createFileCalendar, createFileZoom, readWorld, type World } from "./testing/file-mocks";
import { localDbClient, localDbReady } from "./testing/local-db";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 90_000, hookTimeout: 30_000 });

/**
 * A REAL process kill. A child process runs the real sync against local Postgres and is SIGKILLed at an exact point: after the provider has done
 * its work (a Zoom meeting exists, or a Google event is written) but before the booking's record of it is saved, still holding the booking's lock.
 * The mock providers share one JSON file, so this test can see exactly what the dead process left behind, and then prove the recovery sweep
 * finishes the job with no duplicate and no orphan. Local Postgres only; skipped when the stack is not running.
 */
const local = await localDbReady();
const ROOT = path.resolve(__dirname, "../../..");
const CHILD = path.join(__dirname, "testing/kill-child.ts");
const CHILD_CONFIG = path.join(__dirname, "testing/kill-child.vite.config.ts");
const TZ = "America/Toronto";
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(++seq).toString(36)}`;

(local ? describe : describe.skip)("recovery after a real process kill (local Postgres)", () => {
  let repo: SupabaseRepository; let svc: SchedulingService; let email: MockEmail;
  let dir: string; let world: string; let queue: Array<() => Promise<unknown>>;
  let dayNo = 0; let originalTz: string; let pulseBefore: Awaited<ReturnType<SupabaseRepository["getLastSweep"]>>;
  const typeIds: string[] = [];
  const date = () => new Date(Date.UTC(2027, 5, 1 + ++dayNo)).toISOString().slice(0, 10);       // June 2027 (summer time, UTC-4, inside the 365-day window of the real clock the child uses)
  const at = (d: string, hhmm: string) => new Date(`${d}T${hhmm}:00-04:00`).toISOString();

  /** A service whose clock can be moved, on the shared file-backed providers. */
  const service = (clock: () => number = () => Date.now(), defer = true) => {
    email = createSimulatedEmail(); queue = [];
    return new SchedulingService({ repo, now: clock, email, calendar: createFileCalendar(world), zoom: createFileZoom(world), defer: defer ? (t) => { queue.push(t); } : undefined });
  };
  const mkType = async () => {
    const t = await svc.saveMeetingType({ slug: `kill-${uid()}`, name: "KillTest Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 30, bufferBeforeMinutes: 0,
      availability: { weekly: {}, breaks: [], daysOff: [], overrides: Object.fromEntries([date()].map((x) => [x, [{ start: "06:00", end: "20:00" }]])), bookingWindowDays: 365 } });
    typeIds.push(t.id); return t;
  };
  const bookOn = async (t: { slug: string; availability: { overrides: Record<string, unknown> } }) => {
    const d = Object.keys(t.availability.overrides)[0];
    const { booking } = await svc.createBooking({ slug: t.slug, startUtc: at(d, "10:00"), guestName: "KillTest Guest", guestEmail: `kill-${uid()}@example.com`, guestTimeZone: "Europe/London", idempotencyKey: `kill-key-${uid()}` });
    return { reference: booking.reference, id: (await repo.getBookingByReference(booking.reference))!.id };
  };

  /** Starts the child, waits until it announces the exact kill point, then SIGKILLs it. Resolves with how it ended. */
  const killChildAt = (point: "zoom" | "zoom-update" | "scan-before-delete" | "google" | "webhook-claimed" | "webhook-processed", bookingId: string) => new Promise<{ signal: string | null; output: string }>((resolve, reject) => {
    const signal = path.join(dir, `signal-${uid()}`);
    const child = spawn(path.join(ROOT, "node_modules/.bin/vite-node"), ["--config", CHILD_CONFIG, CHILD, point, bookingId, world, signal], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let output = ""; child.stdout.on("data", (b) => (output += b)); child.stderr.on("data", (b) => (output += b));
    const started = Date.now();
    const poll = setInterval(() => {
      if (fs.existsSync(signal)) { clearInterval(poll); child.kill("SIGKILL"); }
      else if (Date.now() - started > 60_000) { clearInterval(poll); child.kill("SIGKILL"); reject(new Error(`the child never reached its kill point. Output: ${output.slice(0, 600)}`)); }
    }, 50);
    child.on("exit", (_code, sig) => { clearInterval(poll); resolve({ signal: sig, output }); });
  });

  /**
   * Kills a scan at the moment it has condemned a duplicate and is about to ask Zoom to delete it. If the child ends BY ITSELF with the scan having
   * "finished" it found nothing to clean up, which is a real failure and is NOT retried. If it ends by itself WITHOUT finishing it crashed (for example a
   * dropped local connection under load), which says nothing about the property under test, so it is started once more.
   */
  const killScanChild = async (bookingId: string) => {
    let out = await killChildAt("scan-before-delete", bookingId);
    if (out.signal !== "SIGKILL" && !out.output.includes("finished without being killed")) out = await killChildAt("scan-before-delete", bookingId);
    return out;
  };

  beforeAll(async () => {
    repo = new SupabaseRepository((await localDbClient(local!)) as never);
    originalTz = (await repo.getSettings()).homeTimeZone; await repo.saveSettings({ homeTimeZone: TZ });
    pulseBefore = await repo.getLastSweep();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "mba-kill-"));
  });
  // Each test has its own external world (a file), but earlier tests' bookings stay in the shared database, and the sweep is global. Retire them first (only this
  // suite's own, never a real one) so the sweep, which rightly notices a recorded meeting that is absent from the current world, only ever sees the current test.
  beforeEach(async () => {
    world = path.join(dir, `world-${uid()}.json`); svc = service();
    const retirer = new SchedulingService({ repo, calendar: createFileCalendar(path.join(dir, `retire-${uid()}.json`)), zoom: createFileZoom(path.join(dir, `retire-${uid()}.json`)), email: createSimulatedEmail() });
    const mine = new Set((await repo.listMeetingTypes()).filter((t) => t.name === "KillTest Talk").map((t) => t.id));
    for (const b of await repo.listBookings()) if (b.status === "confirmed" && mine.has(b.meetingTypeId)) await retirer.cancelBooking(b.id);
  });
  afterAll(async () => {
    const db = await localDbClient(local!);
    if (typeIds.length) { await db.from("sched_bookings").delete().in("meeting_type_id", typeIds); await db.from("sched_meeting_types").delete().in("id", typeIds); }
    await db.from("sched_activity").delete().like("summary", "%KillTest%");
    await db.from("sched_webhook_events").delete().like("event_key", "kill-wh-%");
    if (pulseBefore) await repo.recordSweep(pulseBefore.at, pulseBefore.summary); else await db.from("sched_worker_heartbeat").delete().eq("id", true);
    await repo.saveSettings({ homeTimeZone: originalTz });
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("killed right after Zoom created the meeting but before it was recorded: the lock expires, the sweep finds the meeting by its marker, and nothing is duplicated", async () => {
    const t = await mkType(); const { id, reference } = await bookOn(t); queue.length = 0;
    const died = await killChildAt("zoom", id);
    expect(died.signal).toBe("SIGKILL");                                                                                          // really killed, not a clean exit
    // what the dead process left behind
    expect(Object.keys(readWorld(world).meetings)).toHaveLength(1);                                                               // the meeting exists in Zoom...
    const left = (await repo.listRefs(id)).find((r) => r.provider === "zoom");                                                    // ...the booking never recorded the meeting, but it DID record the intent to create one
    expect(left).toMatchObject({ status: "pending", externalId: null }); expect(left!.createIntentAt).toBeTruthy();
    expect(Object.keys(readWorld(world).events)).toHaveLength(0);
    expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "pending" });
    expect(await repo.claimSync(id, new Date().toISOString(), 300)).toBeNull();                                                  // the dead worker still holds the lock
    // a sweep right away must leave it alone; one after the lock expires finishes it
    const early = service(); expect((await early.runMaintenance()).results.filter((r) => !r.skipped && r.bookingId === id)).toHaveLength(0);
    const late = service(() => Date.now() + 301_000);
    const run = await late.runMaintenance();
    expect(run.results.find((r) => r.bookingId === id)).toMatchObject({ ok: true });
    const w = readWorld(world);
    expect(Object.keys(w.meetings)).toHaveLength(1); expect(w.zoomCreates).toBe(1);                                               // the SAME meeting, found by its marker: no second one
    expect(await repo.listRefs(id).then((r) => r.find((x) => x.provider === "zoom"))).toMatchObject({ status: "synced", createIntentAt: null, createUnknown: 0 });   // and the intent is cleared once it is adopted
    expect(Object.keys(w.events)).toHaveLength(1);
    expect((await repo.listRefs(id)).filter((r) => r.status === "synced").map((r) => r.provider).sort()).toEqual(["google", "zoom"]);
    expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "ok" });
    expect((await repo.listEmailAttempts(id)).filter((a) => a.status === "accepted").map((a) => a.kind)).toEqual(["confirmation"]);
    expect((await late.publicBooking(reference))!.progress).toBe("ready");
  });

  it("killed right after the Google event was written but before it was recorded: recovery reuses the event (deterministic id) and creates no second one", async () => {
    const t = await mkType(); const { id } = await bookOn(t); queue.length = 0;
    const died = await killChildAt("google", id);
    expect(died.signal, `the child ended on its own. Output: ${died.output.slice(0, 500)}`).toBe("SIGKILL");
    const before = readWorld(world);
    expect(Object.keys(before.meetings)).toHaveLength(1); expect(Object.keys(before.events)).toHaveLength(1);                     // Zoom was finished and recorded; the event exists but is unrecorded
    expect((await repo.listRefs(id)).find((r) => r.provider === "google")).toBeUndefined();
    await service(() => Date.now() + 301_000).runMaintenance();
    const w = readWorld(world);
    expect(Object.keys(w.events)).toHaveLength(1); expect(w.zoomCreates).toBe(1); expect(Object.keys(w.meetings)).toHaveLength(1);
    expect((await repo.listRefs(id)).filter((r) => r.status === "synced")).toHaveLength(2);
    expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "ok" });
  });

  it("two recovery workers running at the same moment after a kill: exactly one does the work, and there is still one of everything", async () => {
    const t = await mkType(); const { id } = await bookOn(t); queue.length = 0;
    await killChildAt("zoom", id);
    const a = service(() => Date.now() + 301_000), b = service(() => Date.now() + 301_000);
    const [ra, rb] = await Promise.all([a.runMaintenance(), b.runMaintenance()]);
    const mine = [...ra.results, ...rb.results].filter((r) => r.bookingId === id);
    expect(mine.some((r) => r.ok)).toBe(true);                                                                                     // somebody did the work (the other either found it claimed, or ran a no-op pass afterwards)
    const w = readWorld(world);
    expect(Object.keys(w.meetings)).toHaveLength(1); expect(Object.keys(w.events)).toHaveLength(1);
    expect((await repo.listEmailAttempts(id)).filter((x) => x.status === "accepted")).toHaveLength(1);
  });

  it("the booking is canceled while its worker is dead: the sweep removes the unrecorded meeting and leaves no orphan in Zoom or Google", async () => {
    const t = await mkType(); const { id } = await bookOn(t); queue.length = 0;
    await killChildAt("zoom", id);
    expect(Object.keys(readWorld(world).meetings)).toHaveLength(1);                                                                // an orphan-in-waiting
    await svc.cancelBooking(id); queue.length = 0;                                                                                 // the admin cancels; its own task is lost too
    await service(() => Date.now() + 301_000).runMaintenance();
    const w = readWorld(world);
    expect(Object.keys(w.meetings)).toHaveLength(0); expect(Object.keys(w.events)).toHaveLength(0);
    expect((await repo.getBooking(id))!).toMatchObject({ status: "canceled", sync: { status: "ok" } });
    expect((await repo.listEmailAttempts(id)).filter((x) => x.status === "accepted").map((x) => x.kind)).toEqual(["cancellation"]);
  });

  it("a webhook worker killed after CLAIMING a delivery but before processing it: the provider's retry takes it over once the claim lapses and runs the effect", async () => {
    const key = `kill-wh-${uid()}`;
    const died = await killChildAt("webhook-claimed", key);
    expect(died.signal).toBe("SIGKILL"); expect(died.output).toContain("new");
    const t0 = new Date().toISOString();
    expect((await repo.beginWebhook("zoom", key, t0, 120)).state).toBe("busy");                             // the dead worker still "holds" it, briefly
    const retry = await repo.beginWebhook("zoom", key, new Date(Date.now() + 121_000).toISOString(), 120);
    expect(retry.state).toBe("retry");                                                                      // lapsed: a retry is accepted, not discarded
    await repo.finishWebhook("zoom", key, retry.token!, true, null, t0);
    expect((await repo.beginWebhook("zoom", key, t0, 120)).state).toBe("duplicate");
  });
  it("a webhook worker killed AFTER the acknowledgment was committed: the delivery is a replay and its effect is not run again", async () => {
    const key = `kill-wh-${uid()}`;
    const died = await killChildAt("webhook-processed", key);
    expect(died.signal).toBe("SIGKILL");
    expect((await repo.beginWebhook("zoom", key, new Date().toISOString(), 120)).state).toBe("duplicate");
  });

  it("killed right after a Zoom UPDATE was applied but before it was recorded, and the booking moved on meanwhile: Zoom is brought to the current time, with no second meeting", async () => {
    const t = await mkType(); const { id } = await bookOn(t);
    const d = Object.keys(t.availability.overrides)[0];
    await svc.sync.run(id);                                                                                        // version 1 synchronised (10:00)
    await svc.rescheduleBooking(id, at(d, "11:00")); queue.length = 0;                                             // version 2 (11:00)
    const died = await killChildAt("zoom-update", id);
    expect(died.signal).toBe("SIGKILL");
    const meetingId = Object.keys(readWorld(world).meetings)[0];
    expect(readWorld(world).meetings[meetingId].startUtc).toBe(at(d, "11:00"));                                    // the dead worker's write DID land
    expect((await repo.listRefs(id)).find((r) => r.provider === "zoom")!.contentKey).toBe("v1");                   // ...but was never recorded
    await svc.rescheduleBooking(id, at(d, "13:00")); queue.length = 0;                                             // version 3 (13:00): Zoom now shows a stale time
    await service(() => Date.now() + 301_000).runMaintenance();
    const w = readWorld(world);
    expect(Object.keys(w.meetings)).toEqual([meetingId]); expect(w.meetings[meetingId].startUtc).toBe(at(d, "13:00"));   // read back and corrected; still one meeting
    expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "ok" });
    expect((await repo.listRefs(id)).find((r) => r.provider === "zoom")).toMatchObject({ status: "synced", contentKey: "v3" });
  });
  it("killed after Zoom created the meeting while Zoom does not LIST it: recovery never creates a second one, however long it waits, and adopts the meeting when it appears", async () => {
    const t = await mkType(); const { id } = await bookOn(t); queue.length = 0;
    await killChildAt("zoom", id);
    expect(Object.keys(readWorld(world).meetings)).toHaveLength(1);
    let listed = false;
    const lagging = (clock: () => number) => { const s = service(clock); const z = createFileZoom(world); s.sync["d"].zoom = { ...z, findMeetingsByMarker: async (m: string) => (listed ? z.findMeetingsByMarker(m) : []), listMarkedMeetings: async () => (listed ? z.listMarkedMeetings() : []) } as never; return s; };
    for (const hours of [1, 5, 30, 200]) await lagging(() => Date.now() + hours * 3_600_000).runMaintenance();
    expect(readWorld(world).zoomCreates).toBe(1); expect(Object.keys(readWorld(world).meetings)).toHaveLength(1);   // 200 hours later: still ONE create
    expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "failed" });                                    // a person is asked
    listed = true;
    const late = lagging(() => Date.now() + 201 * 3_600_000);
    await late.runMaintenance(); await late.runMaintenance();
    expect(readWorld(world).zoomCreates).toBe(1);
    expect((await repo.listRefs(id)).find((r) => r.provider === "zoom")).toMatchObject({ status: "synced", createIntentAt: null });
    expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "ok" });
  });

  it("a cleanup killed right AFTER condemning a duplicate and BEFORE Zoom deleted it: the duplicate stays condemned (never adopted, even when the recorded meeting then vanishes), and the next scan finishes the job", async () => {
    const t = await mkType(); const { id } = await bookOn(t); await svc.sync.run(id);
    const w0 = readWorld(world); const A = Object.keys(w0.meetings)[0];
    const dup = `dup-${uid()}`;
    const w1: World = { ...w0, meetings: { ...w0.meetings, [dup]: { ...w0.meetings[A], meetingId: dup, joinUrl: `https://example.com/simulated-zoom/${dup}` } } };
    fs.writeFileSync(world, JSON.stringify(w1));
    const died = await killScanChild(id);
    expect(died.signal, `the child ended on its own. Output: ${died.output.slice(0, 600)}`).toBe("SIGKILL");
    expect((await repo.listZoomTombstones(id)).find((x) => x.externalId === dup)).toMatchObject({ status: "pending" });   // condemned, durably
    expect(Object.keys(readWorld(world).meetings)).toContain(dup);                                                         // ...but still in Zoom
    expect((await repo.listRefs(id)).find((r) => r.provider === "zoom")!.externalId).toBe(A);                              // the recorded meeting was never touched
    // the recorded meeting vanishes while the cleanup is dead: recovery must NOT adopt the condemned duplicate
    const w2 = readWorld(world); delete w2.meetings[A]; fs.writeFileSync(world, JSON.stringify(w2));
    const later = service(() => Date.now() + 301_000);
    await later.sync.run(id); await later.sync.run(id);
    const ref = (await repo.listRefs(id)).find((r) => r.provider === "zoom")!;
    expect(ref.status).toBe("synced"); expect(ref.externalId).not.toBe(dup); expect(ref.externalId).not.toBe(A);
    await later.sync.scanZoom();                                                                                           // finishes the interrupted deletion
    expect(Object.keys(readWorld(world).meetings)).toEqual([ref.externalId]);
    expect((await repo.listZoomTombstones(id)).find((x) => x.externalId === dup)).toMatchObject({ status: "deleted" });
    await later.sync.run(id); expect((await repo.getBooking(id))!.sync).toMatchObject({ status: "ok" });
  });
  it("the same kill, but the recorded meeting is fine: the next scan just completes the deletion and nothing else changes", async () => {
    const t = await mkType(); const { id } = await bookOn(t); await svc.sync.run(id);
    const w0 = readWorld(world); const A = Object.keys(w0.meetings)[0]; const dup = `dup-${uid()}`;
    fs.writeFileSync(world, JSON.stringify({ ...w0, meetings: { ...w0.meetings, [dup]: { ...w0.meetings[A], meetingId: dup } } }));
    await killScanChild(id);
    await service().sync.scanZoom();
    expect(Object.keys(readWorld(world).meetings)).toEqual([A]);
    expect((await repo.listRefs(id)).find((r) => r.provider === "zoom")!.externalId).toBe(A);
  });
});
