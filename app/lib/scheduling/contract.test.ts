import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DocumentRepository } from "./document-repository";
import type { NewBooking, SchedulingRepository } from "./repository";
import { SupabaseRepository } from "./adapters/supabase-repository";
import { buildSeedData } from "./seed";
import { MemoryStore } from "./store";
import { localDbReady, type LocalDb } from "./testing/local-db";
import type { Availability, EmailAttempt, ExternalRef, MeetingType } from "./types";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

/**
 * ONE behaviour, two implementations. The prototype's document repository and the production Postgres repository must agree on every
 * rule that protects bookings: overlap with buffers across all meeting types, idempotency, the per-day cap, atomic cancel/reschedule,
 * unique external references, once-only emails, the sync lock. The Postgres run executes against the LOCAL Supabase stack only and is
 * skipped when it is not running. Real concurrency: parallel requests are separate HTTP calls, i.e. separate database transactions.
 */

const MIN = 60_000;
const avail: Availability = { weekly: {}, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 365 };
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const day = (n: number) => Date.UTC(2031, 2, 1 + n, 0, 0, 0);          // far-future UTC midnights, unique per test
const at = (n: number, hh: number, mm = 0) => new Date(day(n) + (hh * 60 + mm) * MIN).toISOString();

type Ctx = { repo: SchedulingRepository; types: MeetingType[]; track: (t: MeetingType) => MeetingType; cleanup: () => Promise<void>; /** Removes the heartbeat row when there was none before the test. */ clearSweep?: () => Promise<void> };
type Factory = () => Promise<Ctx>;

function typeDraft(over: Partial<MeetingType> = {}): MeetingType {
  const slug = `ct-${uid()}`;
  return { id: `mt-${uid()}`, slug, name: slug, description: "", durationMinutes: 60, format: "zoom", visibility: "public", availability: avail, minNoticeHours: 0, bufferBeforeMinutes: 0, bufferAfterMinutes: 30, maxPerDay: null, slotIntervalMinutes: 15, active: true, ...over };
}

function booking(typeId: string, start: string, over: Partial<NewBooking> = {}, minutes = 60, buffers: [number, number] = [0, 30]): NewBooking {
  const key = `ck-${uid()}`;
  return {
    reference: `ref-${uid()}`, meetingTypeId: typeId, startUtc: start, endUtc: new Date(Date.parse(start) + minutes * MIN).toISOString(),
    bufferBeforeMinutes: buffers[0], bufferAfterMinutes: buffers[1], guestName: "Contract Guest", guestEmail: "contract@example.com", guestMessage: "hi", guestTimeZone: "Europe/London", source: "test",
    idempotencyKey: key, requestHash: `h-${key}`, dayStartUtc: new Date(Date.parse(start) - (Date.parse(start) % 86_400_000)).toISOString(), dayEndUtc: new Date(Date.parse(start) - (Date.parse(start) % 86_400_000) + 86_400_000).toISOString(),
    maxPerDay: null, createdAt: "2026-10-26T12:00:00.000Z", ...over,
  };
}
const code = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string; message?: string }) => e.code ?? `other:${e.message}`);

function describeRepo(name: string, factory: Factory, skip = false) {
  (skip ? describe.skip : describe)(`repository contract: ${name}`, () => {
    let c: Ctx;
    beforeAll(async () => { c = await factory(); });
    afterAll(async () => { await c?.cleanup(); });
    const mk = async (over: Partial<MeetingType> = {}) => c.track(await c.repo.saveMeetingType(typeDraft(over), true));

    it("saves, lists and edits meeting types; refuses a duplicate link; knows unknown ids", async () => {
      const t = await mk({ bufferBeforeMinutes: 15, bufferAfterMinutes: 45 });
      expect(t.bufferBeforeMinutes).toBe(15); expect(t.bufferAfterMinutes).toBe(45);
      expect((await c.repo.listMeetingTypes()).some((x) => x.id === t.id)).toBe(true);
      const renamed = await c.repo.saveMeetingType({ ...t, name: "Renamed", bufferAfterMinutes: 0 }, false);
      expect(renamed).toMatchObject({ id: t.id, name: "Renamed", bufferAfterMinutes: 0 });
      await expect(c.repo.saveMeetingType(typeDraft({ slug: t.slug }), true)).rejects.toMatchObject({ code: "slug_taken" });
      await expect(c.repo.saveMeetingType({ ...t, id: "00000000-0000-4000-8000-000000000000" }, false)).rejects.toMatchObject({ code: "not_found" });
      const a2: Availability = { ...avail, daysOff: ["2031-03-05"], bookingWindowDays: 30 };
      expect(await c.repo.saveAvailability(t.id, a2)).toEqual(a2);
      expect((await c.repo.listMeetingTypes()).find((x) => x.id === t.id)!.availability.daysOff).toEqual(["2031-03-05"]);
    });

    it("creates a booking with its attendee, buffer snapshot, version, history and a pending sync", async () => {
      const t = await mk();
      const nb = booking(t.id, at(1, 10), { guestName: "Ada Lovelace", guestEmail: "ada@example.com", guestMessage: "Hello", source: "LinkedIn" }, 60, [15, 45]);
      const { booking: b, replay } = await c.repo.createBooking(nb);
      expect(replay).toBe(false);
      expect(b).toMatchObject({ reference: nb.reference, meetingTypeId: t.id, guestName: "Ada Lovelace", guestEmail: "ada@example.com", guestMessage: "Hello", guestTimeZone: "Europe/London", status: "confirmed", source: "LinkedIn", version: 1, bufferBeforeMinutes: 15, bufferAfterMinutes: 45 });
      expect(b.startUtc).toBe(at(1, 10)); expect(b.endUtc).toBe(at(1, 11));
      expect(b.sync).toMatchObject({ status: "pending", attempts: 0 });
      expect(b.zoom).toEqual({ status: "pending", meetingId: null, joinUrl: null });
      expect(b.community.state).toBe("unseen");
      expect(b.events.map((e) => e.kind)).toEqual(["created"]);
      expect((await c.repo.getBookingByReference(nb.reference))!.id).toBe(b.id);
      expect((await c.repo.findByIdempotencyKey(nb.idempotencyKey))!.id).toBe(b.id);
      expect(await c.repo.getBooking("00000000-0000-4000-8000-000000000000")).toBeNull();
    });

    it("is idempotent: same key and request replays; a different request under the key is refused", async () => {
      const t = await mk();
      const nb = booking(t.id, at(2, 10));
      const first = await c.repo.createBooking(nb);
      const again = await c.repo.createBooking({ ...nb, reference: "different-ref" });
      expect(again.replay).toBe(true); expect(again.booking.id).toBe(first.booking.id);
      await expect(c.repo.createBooking({ ...nb, requestHash: "something-else" })).rejects.toMatchObject({ code: "idempotency_conflict" });
    });

    it("is idempotent under concurrency: ten simultaneous requests with one key make one booking", async () => {
      const t = await mk();
      const nb = booking(t.id, at(3, 10));
      const results = await Promise.all(Array.from({ length: 10 }, (_, i) => c.repo.createBooking({ ...nb, reference: `${nb.reference}-${i}` })));
      expect(new Set(results.map((r) => r.booking.id)).size).toBe(1);
      expect(results.filter((r) => !r.replay)).toHaveLength(1);
    });

    it("keeps meetings of EVERY type apart by both buffers (touching the boundary is allowed, one minute inside is not)", async () => {
      const a = await mk({ bufferAfterMinutes: 30 });
      const b = await mk({ bufferBeforeMinutes: 15, bufferAfterMinutes: 0 });
      await c.repo.createBooking(booking(a.id, at(4, 10), {}, 60, [0, 30]));                          // 10:00-11:00, clear until 11:30
      await expect(c.repo.createBooking(booking(b.id, at(4, 10, 30), {}, 30, [15, 0]))).rejects.toMatchObject({ code: "slot_unavailable" });  // overlaps
      await expect(c.repo.createBooking(booking(b.id, at(4, 11, 40), {}, 30, [15, 0]))).rejects.toMatchObject({ code: "slot_unavailable" });  // 11:40 - 15 = 11:25 < 11:30
      const ok = await c.repo.createBooking(booking(b.id, at(4, 11, 45), {}, 30, [15, 0]));            // 11:45 - 15 = 11:30: exactly clear
      expect(ok.booking.startUtc).toBe(at(4, 11, 45));
      // and from the other side: B (before 15) at 12:00 means an earlier A-type meeting needs its own 30 after + B's 15 before = 45 clear
      await c.repo.createBooking(booking(b.id, at(19, 12), {}, 30, [15, 0]));                                                               // B 12:00-12:30
      await expect(c.repo.createBooking(booking(a.id, at(19, 10, 30), {}, 60, [0, 30]))).rejects.toMatchObject({ code: "slot_unavailable" }); // ends 11:30, +30 = 12:00 > 11:45
      expect((await c.repo.createBooking(booking(a.id, at(19, 10, 15), {}, 60, [0, 30]))).booking.startUtc).toBe(at(19, 10, 15));           // ends 11:15, +30 = 11:45: exactly clear
    });

    it("lets exactly one of many simultaneous conflicting bookings win", async () => {
      const a = await mk(); const b = await mk();
      const tries = Array.from({ length: 12 }, (_, i) => booking(i % 2 ? a.id : b.id, at(5, 10, i * 5)));   // all overlap each other
      const results = await Promise.all(tries.map((t) => code(c.repo.createBooking(t))));
      expect(results.filter((r) => r === "ok")).toHaveLength(1);
      expect(results.filter((r) => r === "slot_unavailable")).toHaveLength(11);
    });

    it("lets simultaneous bookings that do not conflict all succeed", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const results = await Promise.all(Array.from({ length: 8 }, (_, i) => code(c.repo.createBooking(booking(t.id, at(6, 8 + i), {}, 60, [0, 0])))));
      expect(results.every((r) => r === "ok")).toBe(true);
    });

    it("enforces the per-day cap under concurrency and leaves other days alone", async () => {
      const t = await mk({ maxPerDay: 2, bufferAfterMinutes: 0 });
      const cap = (start: string) => booking(t.id, start, { maxPerDay: 2 }, 30, [0, 0]);
      const results = await Promise.all([8, 9, 10, 11, 12].map((h) => code(c.repo.createBooking(cap(at(7, h))))));
      expect(results.filter((r) => r === "ok")).toHaveLength(2);
      expect(results.filter((r) => r === "day_full")).toHaveLength(3);
      expect(await code(c.repo.createBooking(cap(at(8, 9))))).toBe("ok");   // next day is a fresh count
    });

    it("cancels atomically and idempotently, bumps the version and releases the time and its buffers", async () => {
      const t = await mk();
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(9, 10)));
      await expect(c.repo.createBooking(booking(t.id, at(9, 10, 30)))).rejects.toMatchObject({ code: "slot_unavailable" });
      const r1 = await c.repo.cancelBooking(b.id, "2026-10-26T13:00:00.000Z", "the administrator");
      expect(r1.changed).toBe(true); expect(r1.booking).toMatchObject({ status: "canceled", version: 2 }); expect(r1.booking.sync!.status).toBe("pending");
      const r2 = await c.repo.cancelBooking(b.id, "2026-10-26T13:05:00.000Z", "the administrator");
      expect(r2.changed).toBe(false); expect(r2.booking.version).toBe(2);
      expect((await c.repo.getBooking(b.id))!.events.map((e) => e.kind)).toEqual(["created", "canceled"]);
      await c.repo.createBooking(booking(t.id, at(9, 10, 30)));                       // the freed time is bookable again
      await expect(c.repo.cancelBooking("00000000-0000-4000-8000-000000000000", "2026-10-26T13:00:00.000Z", "x")).rejects.toMatchObject({ code: "not_found" });
    });

    it("reschedules atomically: its own old time never blocks it, others do, canceled cannot move", async () => {
      const t = await mk({ maxPerDay: 2 });
      const mv = (start: string, minutes = 60) => ({ startUtc: start, endUtc: new Date(Date.parse(start) + minutes * MIN).toISOString(), dayStartUtc: new Date(Date.parse(start) - (Date.parse(start) % 86_400_000)).toISOString(), dayEndUtc: new Date(Date.parse(start) - (Date.parse(start) % 86_400_000) + 86_400_000).toISOString(), maxPerDay: 2, at: "2026-10-26T14:00:00.000Z" });
      const { booking: a } = await c.repo.createBooking(booking(t.id, at(10, 10), { maxPerDay: 2 }));
      const { booking: other } = await c.repo.createBooking(booking(t.id, at(10, 15), { maxPerDay: 2 }));
      const moved = await c.repo.rescheduleBooking(a.id, mv(at(10, 10, 15)), "the administrator");   // overlaps its own old time: fine
      expect(moved).toMatchObject({ startUtc: at(10, 10, 15), version: 2 }); expect(moved.sync).toMatchObject({ status: "pending", attempts: 0 });
      expect(moved.events.map((e) => e.kind)).toEqual(["created", "rescheduled"]);
      await expect(c.repo.rescheduleBooking(a.id, mv(at(10, 15, 15)), "x")).rejects.toMatchObject({ code: "slot_unavailable" });  // inside `other` + buffer
      await expect(c.repo.rescheduleBooking("00000000-0000-4000-8000-000000000000", mv(at(10, 12)), "x")).rejects.toMatchObject({ code: "not_found" });
      await c.repo.cancelBooking(other.id, "2026-10-26T14:00:00.000Z", "x");
      await expect(c.repo.rescheduleBooking(other.id, mv(at(10, 20)), "x")).rejects.toMatchObject({ code: "conflict" });
      // moving itself to another day does not count against that day's cap twice
      await c.repo.rescheduleBooking(a.id, mv(at(11, 10)), "x");
      expect((await c.repo.getBooking(a.id))!.startUtc).toBe(at(11, 10));
    });

    it("ignores canceled bookings when checking overlap and lists only live ones as confirmed", async () => {
      const t = await mk();
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(12, 10)));
      expect((await c.repo.listConfirmedBookings(at(12, 0), at(12, 23), 2 * 3_600_000)).some((x) => x.id === b.id)).toBe(true);
      expect((await c.repo.listConfirmedBookings(at(14, 0), at(14, 23), 0)).some((x) => x.id === b.id)).toBe(false);
      await c.repo.cancelBooking(b.id, "2026-10-26T13:00:00.000Z", "x");
      expect((await c.repo.listConfirmedBookings(at(12, 0), at(12, 23), 2 * 3_600_000)).some((x) => x.id === b.id)).toBe(false);
    });

    it("stores one Google event and one Zoom meeting per booking, refuses an external id used by another booking, and projects the Zoom link", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const { booking: a } = await c.repo.createBooking(booking(t.id, at(13, 8), {}, 60, [0, 0]));
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(13, 10), {}, 60, [0, 0]));
      const ref = (id: string, provider: "zoom" | "google", extId: string | null, over: Partial<ExternalRef> = {}): ExternalRef => ({ bookingId: id, provider, externalId: extId, url: extId ? `https://example.com/${extId}` : null, status: "synced", syncedVersion: 1, contentKey: "v1", etag: null, attempts: 0, lastError: null, updatedAt: "2026-10-26T12:00:00.000Z", ...over });
      const zid = `z${uid()}`, gid = `g${uid()}`;
      await c.repo.upsertRef(ref(a.id, "zoom", zid)); await c.repo.upsertRef(ref(a.id, "google", gid));
      await c.repo.upsertRef(ref(a.id, "zoom", zid, { syncedVersion: 2, contentKey: "v2" }));       // upsert, not a second row
      const refs = await c.repo.listRefs(a.id);
      expect(refs).toHaveLength(2);
      expect(refs.find((r) => r.provider === "zoom")).toMatchObject({ externalId: zid, syncedVersion: 2, contentKey: "v2", status: "synced" });
      await expect(c.repo.upsertRef(ref(b.id, "zoom", zid))).rejects.toMatchObject({ code: "conflict" });
      await expect(c.repo.upsertRef(ref(b.id, "google", gid))).rejects.toMatchObject({ code: "conflict" });
      expect((await c.repo.getBooking(a.id))!.zoom).toMatchObject({ status: "ready", joinUrl: `https://example.com/${zid}` });
      expect((await c.repo.getBooking(b.id))!.zoom.status).toBe("pending");
      await c.repo.upsertRef(ref(b.id, "zoom", null, { status: "failed", attempts: 8, lastError: "boom" }));
      expect((await c.repo.getBooking(b.id))!.zoom.status).toBe("failed");
    });

    it("accepts each kind of email once per booking version, allows retries after failures and repeats of a resend, and keeps a bounce", async () => {
      const t = await mk();
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(15, 10)));
      const att = (kind: EmailAttempt["kind"], status: EmailAttempt["status"], over: Partial<EmailAttempt> = {}): EmailAttempt => ({ id: uid(), bookingId: b.id, kind, version: 1, to: "contract@example.com", status, providerMessageId: status === "accepted" ? `msg-${uid()}` : null, error: status === "failed" ? "provider down" : null, includedZoom: false, idempotencyKey: `ek-${uid()}`, attemptedAt: "2026-10-26T12:00:00.000Z", ...over });
      expect((await c.repo.recordEmailAttempt(att("confirmation", "failed"))).recorded).toBe(true);
      expect((await c.repo.recordEmailAttempt(att("confirmation", "failed"))).recorded).toBe(true);        // failures may repeat
      const good = att("confirmation", "accepted");
      expect((await c.repo.recordEmailAttempt(good)).recorded).toBe(true);
      expect((await c.repo.recordEmailAttempt(att("confirmation", "accepted"))).recorded).toBe(false);     // accepted only once per version
      expect((await c.repo.recordEmailAttempt(att("confirmation", "accepted", { version: 2 }))).recorded).toBe(true);
      expect((await c.repo.recordEmailAttempt(att("confirmation_resend", "accepted"))).recorded).toBe(true);
      expect((await c.repo.recordEmailAttempt(att("confirmation_resend", "accepted"))).recorded).toBe(true); // a manual resend may repeat
      const all = await c.repo.listEmailAttempts(b.id);
      expect(all.filter((a) => a.kind === "confirmation" && a.status === "accepted")).toHaveLength(2);
      // concurrency: five identical accepted sends racing for one slot -> one recorded
      const racers = await Promise.all(Array.from({ length: 5 }, () => c.repo.recordEmailAttempt(att("cancellation", "accepted"))));
      expect(racers.filter((r) => r.recorded)).toHaveLength(1);
      expect(await c.repo.setEmailDelivery(good.providerMessageId!, "bounced", "2026-10-26T12:05:00.000Z")).toBe(true);
      expect(await c.repo.setEmailDelivery(good.providerMessageId!, "delivered", "2026-10-26T12:06:00.000Z")).toBe(true);
      expect((await c.repo.listEmailAttempts(b.id)).find((a) => a.providerMessageId === good.providerMessageId)!.deliveryStatus).toBe("bounced");
      expect(await c.repo.setEmailDelivery("unknown-message", "delivered", "2026-10-26T12:06:00.000Z")).toBe(false);
    });

    it("hands each booking's sync to one worker at a time, and lists only what is due", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(16, 10), { createdAt: "2026-10-26T12:00:00.000Z" }, 60, [0, 0]));
      const now = "2026-10-26T12:10:00.000Z";
      expect(await c.repo.listDueSync(now, 1000)).toContain(b.id);
      const claims = await Promise.all(Array.from({ length: 6 }, () => c.repo.claimSync(b.id, now, 300)));
      expect(claims.filter(Boolean)).toHaveLength(1);                                                  // only one worker takes it
      const first = claims.find(Boolean)!;
      expect(first).toEqual(expect.any(String));                                                        // the claim is an ownership token
      expect(await c.repo.listDueSync(now, 1000)).not.toContain(b.id);                                  // locked: not offered again
      const second = await c.repo.claimSync(b.id, "2026-10-26T12:16:00.000Z", 300);                    // the lock expires
      expect(second).toEqual(expect.any(String)); expect(second).not.toBe(first);                       // a NEW token for every claim
      await c.repo.finishSync(b.id, { status: "pending", attempts: 2, nextAttemptAt: "2026-10-26T13:00:00.000Z", lastError: "later" }, undefined, second!);
      expect(await c.repo.listDueSync("2026-10-26T12:30:00.000Z", 1000)).not.toContain(b.id);          // not yet time
      expect(await c.repo.listDueSync("2026-10-26T13:00:01.000Z", 1000)).toContain(b.id);
      expect((await c.repo.getBooking(b.id))!.sync).toMatchObject({ status: "pending", attempts: 2, lastError: "later" });
      await c.repo.finishSync(b.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null });
      expect(await c.repo.listDueSync("2027-01-01T00:00:00.000Z", 1000)).not.toContain(b.id);
      await c.repo.finishSync(b.id, { status: "failed", attempts: 8, nextAttemptAt: null, lastError: "gave up" });
      expect(await c.repo.listDueSync("2027-01-01T00:00:00.000Z", 1000)).not.toContain(b.id);          // given up: waits for a human
      expect(await c.repo.claimSync("00000000-0000-4000-8000-000000000000", now, 300)).toBeNull();
    });

    it("a cancel or reschedule that lands while a worker holds the sync lock keeps that lock, and the worker's outcome for the old version is not recorded as done", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const now = "2026-10-26T12:10:00.000Z";
      // cancel mid-run
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(60, 10), {}, 60, [0, 0]));
      const k1 = await c.repo.claimSync(b.id, now, 300);
      expect(k1).toEqual(expect.any(String));
      await c.repo.cancelBooking(b.id, now, "the administrator");
      expect(await c.repo.claimSync(b.id, now, 300)).toBeNull();                                        // the cancel did not release the worker's lock
      const lateOk = await c.repo.finishSync(b.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, { version: 1, nowIso: now }, k1!);
      expect(lateOk).toBe("superseded");                                                                 // it worked on version 1; the booking is at 2
      expect((await c.repo.getBooking(b.id))!.sync).toMatchObject({ status: "pending", attempts: 0, nextAttemptAt: now });
      expect(await c.repo.listDueSync(now, 1000)).toContain(b.id);                                      // queued again, due now, lock released
      const k2 = await c.repo.claimSync(b.id, now, 300);
      expect(k2).toEqual(expect.any(String));
      expect(await c.repo.finishSync(b.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, { version: 2, nowIso: now }, k2!)).toBe("applied");
      expect((await c.repo.getBooking(b.id))!.sync).toMatchObject({ status: "ok" });
      // reschedule mid-run
      const { booking: r } = await c.repo.createBooking(booking(t.id, at(61, 10), {}, 60, [0, 0]));
      const k3 = await c.repo.claimSync(r.id, now, 300);
      expect(k3).toEqual(expect.any(String));
      await c.repo.rescheduleBooking(r.id, { startUtc: at(61, 14), endUtc: at(61, 15), dayStartUtc: at(61, 0), dayEndUtc: at(62, 0), maxPerDay: null, at: now }, "the administrator");
      expect(await c.repo.claimSync(r.id, now, 300)).toBeNull();
      expect(await c.repo.finishSync(r.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, { version: 1, nowIso: now }, k3!)).toBe("superseded");
      expect(await c.repo.listDueSync(now, 1000)).toContain(r.id);
      expect(await c.repo.finishSync("00000000-0000-4000-8000-000000000000", { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, { version: 1, nowIso: now })).toBe("missing");
    });

    it("records the recovery worker's pulse (the latest sweep wins) and accepts a calendar-conflict entry in a booking's history", async () => {
      const before = await c.repo.getLastSweep();                                                       // the developer's real pulse, if any: restored at the end
      try {
        const s1 = { reconciled: 1, processed: 2, succeeded: 2, failed: 0, skipped: 0, conflictsFlagged: 0, conflictScanAt: null };
        const s2 = { reconciled: 0, processed: 5, succeeded: 4, failed: 1, skipped: 2, conflictsFlagged: 1, conflictScanAt: "2031-03-01T12:00:00.000Z" };
        await c.repo.recordSweep("2031-03-01T12:00:00.000Z", s1);
        expect(await c.repo.getLastSweep()).toEqual({ at: "2031-03-01T12:00:00.000Z", summary: s1 });
        await c.repo.recordSweep("2031-03-01T12:01:00.000Z", s2);
        expect(await c.repo.getLastSweep()).toEqual({ at: "2031-03-01T12:01:00.000Z", summary: s2 });
      } finally {
        if (before) await c.repo.recordSweep(before.at, before.summary);
        else if (c.clearSweep) await c.clearSweep();
      }
      const t = await mk({ bufferAfterMinutes: 0 });
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(63, 10), {}, 60, [0, 0]));
      await c.repo.addBookingEvent(b.id, { at: "2026-10-26T12:00:00.000Z", kind: "calendar_conflict", detail: "Overlaps another event" });
      expect((await c.repo.getBooking(b.id))!.events.some((e) => e.kind === "calendar_conflict")).toBe(true);
    });

    it("a replaced worker cannot clear the newer worker's lease, record a reference, or complete anything (fencing)", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(64, 10), {}, 60, [0, 0]));
      const t0 = "2026-10-26T12:10:00.000Z", later = "2026-10-26T12:16:00.000Z", ok = { status: "ok" as const, attempts: 0, nextAttemptAt: null, lastError: null };
      const ref = (id: string): import("./types").ExternalRef => ({ bookingId: b.id, provider: "zoom", externalId: id, url: `https://example.com/${id}`, status: "synced", syncedVersion: 1, etag: null, contentKey: "v1", attempts: 0, lastError: null, updatedAt: later });
      const a = await c.repo.claimSync(b.id, t0, 300);                       // worker A
      const bTok = await c.repo.claimSync(b.id, later, 300);                 // A's lease expired; worker B takes over
      expect(a).toEqual(expect.any(String)); expect(bTok).toEqual(expect.any(String)); expect(bTok).not.toBe(a);
      // A wakes up and tries everything
      expect(await c.repo.renewSync(b.id, a!, later, 300)).toBe(false);
      expect(await c.repo.upsertRef(ref("zoom-from-a"), a!)).toBe("lost");
      expect(await c.repo.listRefs(b.id)).toHaveLength(0);                   // nothing of A's was recorded
      expect(await c.repo.finishSync(b.id, ok, { version: 1, nowIso: later }, a!)).toBe("lost");
      expect((await c.repo.getBooking(b.id))!.sync?.status).toBe("pending");  // not marked done
      expect(await c.repo.claimSync(b.id, "2026-10-26T12:16:01.000Z", 300)).toBeNull();   // and B's lease was not released by A's attempt
      // B is unaffected
      expect(await c.repo.renewSync(b.id, bTok!, "2026-10-26T12:17:00.000Z", 300)).toBe(true);
      expect(await c.repo.upsertRef(ref("zoom-from-b"), bTok!)).toBe("applied");
      expect((await c.repo.listRefs(b.id)).map((r) => r.externalId)).toEqual(["zoom-from-b"]);
      expect(await c.repo.finishSync(b.id, ok, { version: 1, nowIso: later }, bTok!)).toBe("applied");
      // once released, B's old token is dead too, and A still cannot do anything
      expect(await c.repo.finishSync(b.id, ok, undefined, bTok!)).toBe("lost");
      expect(await c.repo.upsertRef(ref("zoom-late"), a!)).toBe("lost");
      // an unfenced outcome (administrator retry, reconciliation) never releases somebody else's lease
      const cTok = await c.repo.claimSync(b.id, "2026-10-26T12:30:00.000Z", 300);
      expect(cTok).toEqual(expect.any(String));
      await c.repo.finishSync(b.id, { status: "pending", attempts: 0, nextAttemptAt: "2026-10-26T12:30:00.000Z", lastError: null });
      expect(await c.repo.claimSync(b.id, "2026-10-26T12:30:01.000Z", 300)).toBeNull();
    });

    it("keeps the Zoom create intent, and a replaced worker's request to verify the booking again marks every reference stale and re-queues it", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(65, 10), {}, 60, [0, 0]));
      const now = "2026-10-26T12:10:00.000Z";
      await c.repo.upsertRef({ bookingId: b.id, provider: "zoom", externalId: null, url: null, status: "pending", syncedVersion: 0, attempts: 1, lastError: "lost", updatedAt: now, createIntentAt: now, createUnknown: 1 });
      expect((await c.repo.listRefs(b.id))[0]).toMatchObject({ createIntentAt: now, createUnknown: 1 });
      await c.repo.upsertRef({ bookingId: b.id, provider: "zoom", externalId: `z-${uid()}`, url: "https://example.com/z", status: "synced", syncedVersion: 1, contentKey: "v1", attempts: 0, lastError: null, updatedAt: now, createIntentAt: null, createUnknown: 0 });
      await c.repo.upsertRef({ bookingId: b.id, provider: "google", externalId: `g-${uid()}`, url: null, status: "synced", syncedVersion: 1, contentKey: "v1|https://example.com/z", attempts: 0, lastError: null, updatedAt: now });
      const k = await c.repo.claimSync(b.id, now, 300); await c.repo.finishSync(b.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, { version: 1, nowIso: now }, k!);
      expect(await c.repo.listDueSync("2026-10-26T12:20:00.000Z", 1000)).not.toContain(b.id);
      await c.repo.invalidateRefs(b.id, "2026-10-26T12:20:00.000Z");
      expect((await c.repo.listRefs(b.id)).map((r) => r.contentKey ?? null)).toEqual([null, null]);
      expect((await c.repo.getBooking(b.id))!.sync).toMatchObject({ status: "pending", nextAttemptAt: "2026-10-26T12:20:00.000Z" });
      expect(await c.repo.listDueSync("2026-10-26T12:20:00.000Z", 1000)).toContain(b.id);
    });

    it("keeps a webhook inbox: a delivery is claimed, then processed or failed; only a PROCESSED one is a replay, a failed or abandoned one is claimable again, and completion is fenced by the claim token", async () => {
      const key = `wk-${uid()}`;
      const t0 = "2026-10-26T12:00:00.000Z";
      const first = await c.repo.beginWebhook("zoom", key, t0, 120);
      expect(first.state).toBe("new"); expect(first.token).toEqual(expect.any(String));
      expect((await c.repo.beginWebhook("zoom", key, t0, 120)).state).toBe("busy");                      // somebody is processing it right now
      expect(await c.repo.finishWebhook("zoom", key, first.token!, false, "database unavailable", t0)).toBe("applied");   // that attempt failed...
      const retry = await c.repo.beginWebhook("zoom", key, t0, 120);
      expect(retry.state).toBe("retry"); expect(retry.token).not.toBe(first.token);                      // ...so the provider's retry is NOT turned away, and gets a NEW token
      expect(await c.repo.finishWebhook("zoom", key, retry.token!, true, null, t0)).toBe("applied");
      expect((await c.repo.beginWebhook("zoom", key, t0, 120)).state).toBe("duplicate");                 // processed: a genuine replay
      // crash: claimed, never finished. After the claim lease the retry takes over.
      const crashed = `${key}-crash`;
      expect((await c.repo.beginWebhook("zoom", crashed, t0, 120)).state).toBe("new");
      expect((await c.repo.beginWebhook("zoom", crashed, "2026-10-26T12:01:59.000Z", 120)).state).toBe("busy");
      expect((await c.repo.beginWebhook("zoom", crashed, "2026-10-26T12:02:01.000Z", 120)).state).toBe("retry");
      // six concurrent deliveries of one new event: exactly one is told to process it
      const race = await Promise.all(Array.from({ length: 6 }, () => c.repo.beginWebhook("google", key, t0, 120)));
      expect(race.filter((r) => r.state === "new")).toHaveLength(1);
      expect(race.filter((r) => r.state === "busy")).toHaveLength(5);
      expect((await c.repo.beginWebhook("resend", key, t0, 120)).state).toBe("new");                     // the same key under another provider is a different event
      // processed entries are forgotten after two days (far beyond the signature window)
      expect((await c.repo.beginWebhook("zoom", `${key}-other`, "2026-10-29T12:00:01.000Z", 120)).state).toBe("new");
      expect((await c.repo.beginWebhook("zoom", key, "2026-10-29T12:00:02.000Z", 120)).state).toBe("new");
    });

    it("RE-03: a replaced webhook worker's late failure or late success cannot reopen or overwrite a processed delivery, in either completion order", async () => {
      const t0 = "2026-10-26T12:00:00.000Z", later = "2026-10-26T12:02:01.000Z";
      // order 1: A claims; B reclaims after the lease and SUCCEEDS; A then FAILS late
      const k1 = `wk-${uid()}-late-fail`;
      const a1 = await c.repo.beginWebhook("zoom", k1, t0, 120); const b1 = await c.repo.beginWebhook("zoom", k1, later, 120);
      expect(b1.state).toBe("retry");
      expect(await c.repo.finishWebhook("zoom", k1, b1.token!, true, null, later)).toBe("applied");
      expect(await c.repo.finishWebhook("zoom", k1, a1.token!, false, "late failure", later)).toBe("stale");
      expect((await c.repo.beginWebhook("zoom", k1, later, 120)).state).toBe("duplicate");              // still terminal: the effect is not run a third time
      // order 2: A claims; B reclaims; A SUCCEEDS late while B is still processing, then B FAILS
      const k2 = `wk-${uid()}-late-success`;
      const a2 = await c.repo.beginWebhook("zoom", k2, t0, 120); const b2 = await c.repo.beginWebhook("zoom", k2, later, 120);
      expect(await c.repo.finishWebhook("zoom", k2, a2.token!, true, null, later)).toBe("stale");        // a replaced worker cannot complete it
      expect((await c.repo.beginWebhook("zoom", k2, later, 120)).state).toBe("busy");                    // B still owns it
      expect(await c.repo.finishWebhook("zoom", k2, b2.token!, false, "b failed", later)).toBe("applied");
      expect((await c.repo.beginWebhook("zoom", k2, later, 120)).state).toBe("retry");                   // the failure of the CURRENT owner is what counts: retry
      // a finished claim cannot be finished twice
      const k3 = `wk-${uid()}-twice`;
      const a3 = await c.repo.beginWebhook("zoom", k3, t0, 120);
      expect(await c.repo.finishWebhook("zoom", k3, a3.token!, true, null, t0)).toBe("applied");
      expect(await c.repo.finishWebhook("zoom", k3, a3.token!, false, "again", t0)).toBe("stale");
      expect((await c.repo.beginWebhook("zoom", k3, t0, 120)).state).toBe("duplicate");
    });

    it("ZOOM OWNERSHIP: condemning a meeting and recording it can never both succeed, however they interleave; a canceled booking may condemn its own meeting, nobody another booking's", async () => {
      const t = await mk({ bufferAfterMinutes: 0 });
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(66, 10), {}, 60, [0, 0]));
      const k = await c.repo.claimSync(b.id, "2026-10-26T12:10:00.000Z", 300);
      const rec = (id: string, ext: string): import("./types").ExternalRef => ({ bookingId: id, provider: "zoom", externalId: ext, url: `https://example.com/${ext}`, status: "synced", syncedVersion: 1, etag: null, contentKey: "v1", attempts: 0, lastError: null, updatedAt: "2026-10-26T12:10:00.000Z" });
      let recordedWins = 0, condemnedWins = 0;
      for (let i = 0; i < 20; i++) {
        const ext = `own-${uid()}-${i}`;
        const [recorded, condemned] = await Promise.all([
          c.repo.upsertRef(rec(b.id, ext), k!).then(() => "recorded", (e) => (e as { code?: string }).code ?? "error"),
          c.repo.condemnZoomMeeting(b.id, ext, "race"),
        ]);
        const ref = (await c.repo.listRefs(b.id)).find((r) => r.provider === "zoom");
        const tomb = (await c.repo.listZoomTombstones(b.id)).some((x) => x.externalId === ext);
        if (recorded === "recorded") { recordedWins++; expect(condemned).toBe("owned"); expect(tomb).toBe(false); expect(ref!.externalId).toBe(ext); }
        else { condemnedWins++; expect(recorded).toBe("condemned"); expect(condemned).toBe("condemned"); expect(tomb).toBe(true); expect(ref?.externalId).not.toBe(ext); }
      }
      expect(recordedWins + condemnedWins).toBe(20);
      // the unfenced write path is held to the same rule
      const dead = `dead-${uid()}`; await c.repo.condemnZoomMeeting(b.id, dead, "x");
      await expect(c.repo.upsertRef(rec(b.id, dead))).rejects.toMatchObject({ code: "condemned" });
      // a recorded meeting of a confirmed booking is owned; of ANOTHER booking, also owned
      const mine = `mine-${uid()}`; await c.repo.upsertRef(rec(b.id, mine), k!);
      expect(await c.repo.condemnZoomMeeting(b.id, mine, "x")).toBe("owned");
      const { booking: other } = await c.repo.createBooking(booking(t.id, at(67, 10), {}, 60, [0, 0]));
      expect(await c.repo.condemnZoomMeeting(other.id, mine, "x")).toBe("owned");
      // a canceled booking may condemn its own (that is how a cancellation deletes it); the deletion bookkeeping is idempotent
      await c.repo.cancelBooking(b.id, "2026-10-26T12:11:00.000Z", "the administrator");
      expect(await c.repo.condemnZoomMeeting(b.id, mine, "canceled")).toBe("condemned");
      expect((await c.repo.listZoomTombstones(b.id)).find((x) => x.externalId === mine)).toMatchObject({ status: "pending" });
      await c.repo.markZoomCondemnedDeleted(mine); await c.repo.markZoomCondemnedDeleted(mine);
      expect((await c.repo.listZoomTombstones(b.id)).find((x) => x.externalId === mine)).toMatchObject({ status: "deleted" });
      expect(await c.repo.condemnZoomMeeting("00000000-0000-4000-8000-000000000000", "x", "x")).toBe("missing");
    });

    it("RE-04: records the owner-notification baseline once, durably, and returns the same moment every time", async () => {
      const first = await c.repo.activateOwnerNotifications("2026-10-26T12:00:00.000Z");
      const again = await c.repo.activateOwnerNotifications("2027-01-01T00:00:00.000Z");
      expect(Date.parse(again)).toBe(Date.parse(first));                                                   // later calls never move it
      const racers = await Promise.all(Array.from({ length: 5 }, () => c.repo.activateOwnerNotifications("2028-01-01T00:00:00.000Z")));
      expect(new Set(racers.map((r) => Date.parse(r))).size).toBe(1); expect(Date.parse(racers[0])).toBe(Date.parse(first));
    });

    it("remembers what the owner was last alerted about, durably, and starts empty", async () => {
      const before = await c.repo.getAlertState();                                                         // the developer's own state, if any: restored at the end
      try {
        await c.repo.setAlertState("worker-stalled", "2031-03-01T12:00:00.000Z");
        expect(await c.repo.getAlertState()).toEqual({ signature: "worker-stalled", sentAt: "2031-03-01T12:00:00.000Z" });
        await c.repo.setAlertState("", "2031-03-01T13:00:00.000Z");
        expect(await c.repo.getAlertState()).toEqual({ signature: "", sentAt: "2031-03-01T13:00:00.000Z" });
      } finally { await c.repo.setAlertState(before.signature, before.sentAt ?? "2031-03-01T00:00:00.000Z"); }
    });

    it("records the community answer once, with evidence", async () => {
      const t = await mk();
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(17, 10)));
      const ev = { email: "contract@example.com", wordingVersion: "scheduling-community-v1", wording: "Yes, count me in", at: "2026-10-26T12:00:00.000Z", source: "booking_confirmation" };
      expect(await c.repo.setCommunity(b.reference, "shown", ev)).toBe("shown");
      expect(await c.repo.setCommunity(b.reference, "shown", ev)).toBe("shown");
      expect(await c.repo.setCommunity(b.reference, "joined", ev)).toBe("joined");
      expect(await c.repo.setCommunity(b.reference, "declined", ev)).toBe("joined");                    // answered once
      expect((await c.repo.getBooking(b.id))!.community.state).toBe("joined");
      const snap = await c.repo.snapshot();
      expect(snap.consents.filter((x) => x.bookingId === b.id)).toHaveLength(1);
      expect(snap.consents.find((x) => x.bookingId === b.id)).toMatchObject({ choice: "joined", source: "booking_confirmation", wordingVersion: "scheduling-community-v1", email: "contract@example.com" });   // consent, timestamp and source are stored
      await expect(c.repo.setCommunity("no-such-reference", "shown", ev)).rejects.toMatchObject({ code: "not_found" });
    });

    it("saves settings and shows everything in the snapshot", async () => {
      const t = await mk();
      const { booking: b } = await c.repo.createBooking(booking(t.id, at(18, 10)));
      await c.repo.addActivity({ id: uid(), at: "2026-10-26T12:00:00.000Z", kind: "booking_created", summary: `contract activity ${t.slug}`, bookingId: b.id });
      const before = await c.repo.getSettings();
      const next = await c.repo.saveSettings({ homeTimeZone: "Europe/London", simulate: { zoomFailure: true } });
      expect(next).toMatchObject({ homeTimeZone: "Europe/London", simulate: { zoomFailure: true } });
      await c.repo.saveSettings({ homeTimeZone: before.homeTimeZone, simulate: { zoomFailure: before.simulate.zoomFailure } });
      const snap = await c.repo.snapshot();
      expect(snap.bookings.some((x) => x.id === b.id)).toBe(true);
      expect(snap.meetingTypes.some((x) => x.id === t.id)).toBe(true);
      expect(snap.activity.some((a) => a.summary.includes(t.slug))).toBe(true);
    });
  });
}

// ---------------------------------------------------------------------------------------------------- the two implementations

describeRepo("document repository (prototype)", async () => {
  const seed = await buildSeedData(Date.parse("2026-10-26T12:00:00Z"));
  seed.bookings = []; seed.meetingTypes = [];
  const repo = new DocumentRepository(new MemoryStore(seed));
  return { repo, types: [], track: (t) => t, cleanup: async () => undefined };
});

const local: LocalDb | null = await localDbReady();
describeRepo("Supabase repository (LOCAL Postgres)", async () => {
  const db = createClient(local!.url, local!.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const repo = new SupabaseRepository(db as never);
  const created: MeetingType[] = [];
  // The owner-notification baseline is a one-row singleton of the real local database: a test must put it back exactly as it found it.
  const baseline = (await db.from("sched_settings").select("owner_notify_since").eq("id", true).single()).data?.owner_notify_since ?? null;
  return {
    repo, types: created,
    track: (t) => { created.push(t); return t; },
    clearSweep: async () => { await db.from("sched_worker_heartbeat").delete().eq("id", true); },
    cleanup: async () => {
      await db.from("sched_settings").update({ owner_notify_since: baseline }).eq("id", true);
      await db.from("sched_webhook_events").delete().like("event_key", "wk-%");
      const ids = created.map((t) => t.id);
      if (ids.length) {
        await db.from("sched_activity").delete().like("summary", "contract activity ct-%");
        await db.from("sched_bookings").delete().in("meeting_type_id", ids);
        await db.from("sched_meeting_types").delete().in("id", ids);
      }
    },
  };
}, !local);

// ---------------------------------------------------------------------------------------------------- database-level guarantees

(local ? describe : describe.skip)("database-level guarantees (LOCAL Postgres)", () => {
  const db = () => createClient(local!.url, local!.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const anon = () => createClient(local!.url, local!.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const made: string[] = [];
  afterAll(async () => { if (made.length) { await db().from("sched_bookings").delete().in("meeting_type_id", made); await db().from("sched_meeting_types").delete().in("id", made); } });

  const newType = async () => {
    const r = await db().from("sched_meeting_types").insert({ slug: `db-${uid()}`, name: "DB guarantees", duration_minutes: 60, visibility: "public", availability: avail }).select().single();
    made.push(r.data!.id); return r.data!.id as string;
  };
  const row = (typeId: string, start: string, end: string, over: Record<string, unknown> = {}) => ({ reference: `db-ref-${uid()}`, meeting_type_id: typeId, start_at: start, end_at: end, buffer_before_minutes: 0, buffer_after_minutes: 30, idempotency_key: `db-key-${uid()}`, ...over });

  it("rejects an overlapping or too-close booking even when the application is bypassed entirely (exclusion constraint)", async () => {
    const t = await newType();
    expect((await db().from("sched_bookings").insert(row(t, at(20, 10), at(20, 11)))).error).toBeNull();
    expect((await db().from("sched_bookings").insert(row(t, at(20, 10, 30), at(20, 11, 30)))).error?.code).toBe("23P01");
    expect((await db().from("sched_bookings").insert(row(t, at(20, 11, 15), at(20, 12)))).error?.code).toBe("23P01");   // inside the 30 minute after-buffer
    expect((await db().from("sched_bookings").insert(row(t, at(20, 11, 30), at(20, 12, 30)))).error).toBeNull();          // exactly clear
  });
  it("lets a canceled booking's time be reused (the constraint applies to confirmed bookings only)", async () => {
    const t = await newType();
    const first = await db().from("sched_bookings").insert(row(t, at(21, 10), at(21, 11))).select().single();
    await db().from("sched_bookings").update({ status: "canceled" }).eq("id", first.data!.id);
    expect((await db().from("sched_bookings").insert(row(t, at(21, 10), at(21, 11)))).error).toBeNull();
  });
  it("computes the padded range itself and rejects buffers outside the allowed list", async () => {
    const t = await newType();
    const r = await db().from("sched_bookings").insert(row(t, at(22, 10), at(22, 11), { buffer_before_minutes: 15, buffer_after_minutes: 45 })).select("blocked_range").single();
    expect(r.data!.blocked_range).toContain("["); // a tstzrange value
    expect((await db().from("sched_bookings").insert(row(t, at(22, 15), at(22, 16), { buffer_after_minutes: 20 }))).error?.code).toBe("23514");
    expect((await db().from("sched_meeting_types").insert({ slug: `db-${uid()}`, name: "bad", duration_minutes: 60, visibility: "public", availability: avail, buffer_after_minutes: 5 })).error?.code).toBe("23514");
  });
  it("refuses a second booking row for the same idempotency key, and a reused reference", async () => {
    const t = await newType();
    const a = row(t, at(23, 10), at(23, 11));
    expect((await db().from("sched_bookings").insert(a)).error).toBeNull();
    expect((await db().from("sched_bookings").insert({ ...a, reference: "other", start_at: at(24, 10), end_at: at(24, 11) })).error?.code).toBe("23505");
    expect((await db().from("sched_bookings").insert({ ...row(t, at(25, 10), at(25, 11)), reference: a.reference })).error?.code).toBe("23505");
  });
  it("gives the browser roles no access at all: no reads, no writes, no function calls", async () => {
    const t = await newType();
    const a = anon();
    for (const table of ["sched_bookings", "sched_attendees", "sched_meeting_types", "sched_google_connection", "sched_oauth_states", "sched_email_attempts"]) {
      const r = await a.from(table).select("*").limit(1);
      expect(r.error?.code, `anon select on ${table}`).toBe("42501");
    }
    expect((await a.from("sched_bookings").insert(row(t, at(26, 10), at(26, 11)))).error?.code).toBe("42501");
    expect((await a.rpc("sched_create_booking", { p: {} })).error?.code).toBe("42501");
    expect((await a.rpc("sched_list_due_sync", { p_now: new Date().toISOString(), p_limit: 5 })).error?.code).toBe("42501");
  });
  it("stores the Google refresh token only as an opaque string column and keeps OAuth states single-use", async () => {
    // The table holds ONE row: the developer's real Google authorization, if they have connected. This test must never delete or alter it.
    // It only inserts (and later removes) its own fake row when the table is empty; every other check is refused by a constraint and changes nothing.
    const real = (await db().from("sched_google_connection").select("id").eq("id", true).maybeSingle()).data;
    if (!real) {
      const ins = await db().from("sched_google_connection").insert({ id: true, status: "connected", google_account_email: "owner@example.com", refresh_token_enc: "v1.iv.tag.ciphertext" }).select().single();
      expect(ins.error).toBeNull();
    }
    expect((await db().from("sched_google_connection").insert({ id: true, status: "connected" })).error?.code).toBe("23505");   // singleton
    expect((await db().from("sched_google_connection").update({ status: "bogus" }).eq("id", true)).error?.code).toBe("23514");   // refused, so the row is unchanged
    if (!real) await db().from("sched_google_connection").delete().eq("id", true);
    const s = `st-${uid()}`;
    expect((await db().from("sched_oauth_states").insert({ state_hash: s, code_verifier_enc: "enc", expires_at: new Date(Date.now() + 600_000).toISOString() })).error).toBeNull();
    expect((await db().from("sched_oauth_states").insert({ state_hash: s, code_verifier_enc: "enc", expires_at: new Date(Date.now() + 600_000).toISOString() })).error?.code).toBe("23505");
    await db().from("sched_oauth_states").delete().eq("state_hash", s);
  });
});
