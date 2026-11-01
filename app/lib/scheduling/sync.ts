import { createHash } from "node:crypto";
import type { Booking, EmailAttempt, EmailKind, ExternalRef, GuestEmailKind, MeetingType, OwnerEmailKind } from "./types";
import { composeEmail, composeOwnerEmail, outboxRecord, startAtVersion, type EmailContent } from "./notifications";
import { isApprovedOwnerAddress } from "./owner-address";
import { isZoomAmbiguous, type CalendarProvider, type EmailProvider, type MarkedMeeting, type ZoomMeetingState, type ZoomProvider, ZOOM_MARKER_PREFIX } from "./providers";
import type { SchedulingRepository } from "./repository";
import { newId } from "./seed";
import { OWNER_RETRY_NOTE } from "./constants";

/**
 * Synchronisation of ONE booking with the outside world: Zoom, Google Calendar, email.
 *
 * The database (our repository) is the authority for rules and records, and is written FIRST, atomically. Everything here is a
 * consequence of that record and is DERIVED from it, so it is idempotent and safe to run again at any time:
 *   - each external object has a deterministic identity (Google event id from the booking id; Zoom meeting marker),
 *   - each step compares the booking's version with the version the external object reflects, and does only what is stale,
 *   - each email is sent at most once per (booking, kind, version): the provider key AND a unique database row say so.
 * A failed step records the error, schedules a retry with backoff, and never stops the other steps or loses the booking.
 * Re-running `run(bookingId)` (the cron worker, the admin "Retry sync") is the recovery procedure.
 *
 * OWNERSHIP. A time-limited lock is not ownership: a worker that stalls past its lease is still running. Every claim therefore carries a random
 * token (the fencing token). Before each external call the worker renews its lease with that token, and everything it records (references, the final
 * outcome) is written only if the token is still current, checked by the database in the same transaction. A replaced worker cannot overwrite, clear
 * or complete anything. If it nevertheless finished an external call, it cleans up after itself where that is provably safe and otherwise asks for the
 * booking to be verified again. A periodic scan removes any duplicate meeting that still got through (see scanZoom).
 *
 * ZOOM CREATION IS NOT IDEMPOTENT. Zoom has no idempotency key, so a timeout or lost response proves nothing about whether the meeting exists, and a
 * marker search that finds nothing proves nothing either (Zoom's list is not documented as immediately consistent). The intent to create is recorded
 * BEFORE the call. If the outcome is unknown, automatic creation STOPS for that booking: recovery keeps looking for the meeting by its marker, adopts
 * it if it shows up (at any time, including through the periodic scan), and otherwise asks a person. Cancellation never declares a booking clean while
 * a create is unresolved. Only "Retry sync", pressed by someone who looked in Zoom, allows another create.
 *
 * ZOOM CONTENT IS VERIFIED, NOT ASSUMED. A request already in flight when a worker loses its lease can still change Zoom afterwards, and no database
 * token can stop that. So before a pass reports success it READS the meeting back from Zoom and corrects it if it does not show the booking's current
 * time; a replaced worker that finished a write requests re-verification; and the periodic scan compares every marked meeting with its booking, which
 * also covers a worker that died right after its write.
 */
export const BACKOFF_SECONDS = [60, 300, 1_800, 7_200, 43_200];
export const MAX_ATTEMPTS = 8;
const LOCK_SECONDS = 300;
/**
 * After a Zoom create whose outcome is UNKNOWN, how long recovery keeps looking for the meeting by its marker before it stops and asks a person.
 * This is only a deadline for ASKING FOR HELP. It is never evidence that the meeting does not exist, and nothing is ever created once it has passed:
 * an uncertain create is resolved by finding the meeting, or by a person (Retry sync), never by waiting.
 */
export const ZOOM_REVIEW_AFTER_SECONDS = 300;
/** How often the host's Zoom meetings are compared with the bookings (duplicates, stale content, late-listed meetings). */
export const ZOOM_SCAN_EVERY_MS = 5 * 60_000;
/** Owner notifications are retried on their own schedule, a few times, and never hold the booking's own synchronisation hostage. */
export const OWNER_BACKOFF_SECONDS = [60, 300, 1_800, 7_200];
export const OWNER_MAX_ATTEMPTS = 5;
/** A cancel or reschedule that lands while a worker is mid-run makes it run again; this bounds that (the booking is re-queued, never lost). */
const MAX_PASSES = 4;

export type SyncDeps = {
  repo: SchedulingRepository; calendar: CalendarProvider; zoom: ZoomProvider; email: EmailProvider; now: () => number;
  /** Notify the guest through Google too (sendUpdates). Off by default: our own branded email is the notification. */ inviteGuestInCalendar?: boolean;
  /** Where the host's own notifications go. Absent: none are sent. */ ownerEmail?: string | null;
  /** Link to the bookings screen, for the host's notifications. */ adminUrl?: string | null;
};
export type SyncResult = { bookingId: string; ok: boolean; skipped?: boolean; errors: string[] };

/** Deterministic Google event id (base32hex: a-v, 0-9; 5-1024 chars), so a retried create is the same call, never a duplicate. */
export const googleEventIdFor = (bookingId: string) => `mba${createHash("sha256").update(bookingId).digest("hex").slice(0, 29)}`;
export const zoomMarkerFor = (bookingId: string) => `mba-booking:${bookingId}`;

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/** Thrown inside a pass when the booking's claim was taken over by another worker: stop at once and write nothing more. */
class OwnershipLost extends Error { constructor() { super("another worker took over this booking"); this.name = "OwnershipLost"; } }
const isLost = (e: unknown) => e instanceof Error && e.name === "OwnershipLost";
/** What one pass carries: the fencing token, and what the pass learned that changes how it ends. */
type Ctx = { claim: string; ownerRetryAt: number | null; escalated: boolean };

/**
 * What Zoom's own record says about a meeting, judged against the booking:
 *   match         the identity is the expected meeting AND start time AND length are both reported AND both equal the booking's. The ONLY result that may count as verified.
 *   mismatch      a field that Zoom reports differs (the meeting shows the wrong time or length).
 *   insufficient  the record is about another meeting, or a required field is missing or unusable. It is evidence of nothing: not a match, not a mismatch.
 * (A failure to reach Zoom at all is a fourth, separate outcome: the call throws.)
 */
export type ZoomEvidence = "match" | "mismatch" | "insufficient";
export function compareZoom(m: { meetingId: string; startUtc: string | null; durationMinutes: number | null }, expectedId: string, b: Booking, type: MeetingType): ZoomEvidence {
  if (!m.meetingId || m.meetingId !== expectedId) return "insufficient";
  const startKnown = m.startUtc !== null && !Number.isNaN(Date.parse(m.startUtc)), durationKnown = m.durationMinutes !== null && m.durationMinutes > 0;
  if ((startKnown && Date.parse(m.startUtc!) !== Date.parse(b.startUtc)) || (durationKnown && m.durationMinutes !== type.durationMinutes)) return "mismatch";
  return startKnown && durationKnown ? "match" : "insufficient";
}

export class BookingSync {
  constructor(private d: SyncDeps) {}
  private ownerSince?: Promise<string | null>;
  /**
   * The moment owner notifications were first switched on (recorded once, durably), or null when they are off. Only transitions at or after it can ever
   * produce an owner message: turning the feature on, or an administrator's retry, never announces history. The service calls this BEFORE it records any
   * transition, so every transition made while the feature is on is later than the baseline.
   */
  ownerActivation(): Promise<string | null> {
    if (!this.d.ownerEmail) return Promise.resolve(null);
    return (this.ownerSince ??= this.d.repo.activateOwnerNotifications(this.iso()).catch((e) => { this.ownerSince = undefined; throw e; }));
  }
  private iso() { return new Date(this.d.now()).toISOString(); }

  /**
   * Bring one booking's external state up to date. Skipped if another worker already holds it.
   * If the booking is canceled or rescheduled while this worker is mid-run, the work in hand describes a stale version: it is NOT recorded
   * as done (the database refuses, see finishSync's guard) and this worker simply runs again against the new version.
   */
  async run(bookingId: string): Promise<SyncResult> {
    const { repo } = this.d;
    let claim = await repo.claimSync(bookingId, this.iso(), LOCK_SECONDS);
    if (!claim) return { bookingId, ok: false, skipped: true, errors: [] };
    for (let pass = 1; ; pass++) {
      const r = await this.pass(bookingId, claim);
      if (!r.superseded) return r.result;
      if (pass >= MAX_PASSES) return { bookingId, ok: false, errors: ["the booking changed repeatedly while syncing; it is queued to run again"] };
      claim = await repo.claimSync(bookingId, this.iso(), LOCK_SECONDS);
      if (!claim) return { bookingId, ok: false, skipped: true, errors: [] };
    }
  }

  /** Renews the lease with the claim token. False means this worker was replaced: the pass must stop and write nothing more. */
  private async own(c: Ctx, bookingId: string) {
    if (!(await this.d.repo.renewSync(bookingId, c.claim, this.iso(), LOCK_SECONDS))) throw new OwnershipLost();
  }
  /** Writes a reference only while this worker still owns the booking. */
  private async put(c: Ctx, ref: ExternalRef) {
    if ((await this.d.repo.upsertRef(ref, c.claim)) === "lost") throw new OwnershipLost();
  }

  /** One pass over Zoom, Google and email for the booking as it is NOW. Releases the lease it owns, unless it was replaced (then it touches nothing). */
  private async pass(bookingId: string, claim: string): Promise<{ result: SyncResult; superseded: boolean }> {
    const { repo } = this.d;
    const errors: string[] = [];
    const c: Ctx = { claim, ownerRetryAt: null, escalated: false };
    const replaced = (): { result: SyncResult; superseded: boolean } => ({ result: { bookingId, ok: false, skipped: true, errors: ["another worker took over this booking"] }, superseded: false });
    let booking: Booking | null = null;
    try {
      booking = await repo.getBooking(bookingId);
      if (!booking) { await repo.finishSync(bookingId, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, undefined, claim).catch(() => undefined); return { result: { bookingId, ok: false, skipped: true, errors: ["not found"] }, superseded: false }; }
      const snapshot = booking;
      const type = (await repo.listMeetingTypes()).find((t) => t.id === snapshot.meetingTypeId);
      if (!type) { errors.push("meeting type missing"); return await this.done(c, snapshot, errors); }
      const homeTz = (await repo.getSettings()).homeTimeZone;
      // Re-read before every external write: if the booking moved on, stop and let the next pass do the right thing.
      const moved = async () => ((await repo.getBooking(bookingId))?.version ?? 1) !== (snapshot.version ?? 1);

      await this.zoomStep(c, snapshot, type, homeTz, errors);
      if (await moved()) return await this.done(c, snapshot, errors);
      const fresh = (await repo.getBooking(bookingId)) ?? snapshot; // the Zoom step may have attached a link
      await this.googleStep(c, fresh, type, homeTz, errors);
      if (await moved()) return await this.done(c, snapshot, errors);
      await this.emailStep(c, fresh, type, homeTz, errors);
      // Success is only reported once Zoom itself has been read back and shows the current booking.
      if (errors.length === 0) { try { await this.verifyZoom(c, snapshot, type, homeTz, errors); } catch (e) { if (isLost(e)) throw e; errors.push(`zoom: ${errText(e)}`); } }
      return await this.done(c, snapshot, errors);
    } catch (e) {
      if (isLost(e)) return replaced();
      // A bug or an unexpected failure must not leave the booking locked or stuck in "pending" forever.
      errors.push(errText(e));
      const b = booking ?? (await repo.getBooking(bookingId).catch(() => null));
      if (!b) return { result: { bookingId, ok: false, errors }, superseded: false };
      return await this.done(c, b, errors).catch(() => ({ result: { bookingId, ok: false, errors }, superseded: false }));
    }
  }

  private async done(c: Ctx, b: Booking, errors: string[]): Promise<{ result: SyncResult; superseded: boolean }> {
    const outcome = await this.finish(c, b, errors);
    if (outcome === "lost") return { result: { bookingId: b.id, ok: false, skipped: true, errors: ["another worker took over this booking"] }, superseded: false };
    return { result: { bookingId: b.id, ok: errors.length === 0 && outcome === "applied", errors }, superseded: outcome === "superseded" };
  }

  /**
   * Safety net against anything the queue itself cannot see: a booking that says its sync is fine while its external objects or its
   * confirmation email say otherwise (a crash between a provider call and the database write, a manual database edit, a restored backup,
   * a replaced worker that asked for the booking to be verified again).
   * Such bookings are queued again. Cheap: only upcoming confirmed bookings and recently canceled ones are looked at.
   */
  async reconcile(limit = 200): Promise<{ checked: number; requeued: string[] }> {
    const { repo } = this.d;
    const now = this.d.now();
    const recent = (await repo.listBookings()).filter((b) => !b.demo && b.sync?.status === "ok" && (b.status === "confirmed" ? Date.parse(b.endUtc) > now - 864e5 : Date.parse(b.startUtc) > now - 30 * 864e5)).slice(0, limit);
    const requeued: string[] = [];
    for (const b of recent) {
      const [refs, attempts] = await Promise.all([repo.listRefs(b.id), repo.listEmailAttempts(b.id)]);
      const z = this.ref(refs, "zoom"), g = this.ref(refs, "google"), v = b.version ?? 1;
      const stale = b.status === "canceled"
        ? z?.status !== "deleted" || g?.status !== "deleted"
        : z?.status !== "synced" || z.contentKey !== `v${v}` || g?.status !== "synced" || g.syncedVersion !== v || !g.contentKey || !attempts.some((a) => a.kind === "confirmation" && a.status === "accepted");
      if (!stale) continue;
      const outcome = await repo.finishSync(b.id, { status: "pending", attempts: 0, nextAttemptAt: this.iso(), lastError: "Reconciliation found the external state behind the booking" }, { version: v, nowIso: this.iso() });
      if (outcome !== "missing") requeued.push(b.id);
    }
    return { checked: recent.length, requeued };
  }

  /** Worker entry point: everything that is due. */
  async runDue(limit = 20): Promise<SyncResult[]> {
    const ids = await this.d.repo.listDueSync(this.iso(), limit);
    const out: SyncResult[] = [];
    for (const id of ids) out.push(await this.run(id));
    return out;
  }

  /** Records the outcome for the version this pass worked on. "superseded" means the booking changed meanwhile and is queued again; "lost" means this worker was replaced. */
  private async finish(c: Ctx, b: Booking, errors: string[]): Promise<"applied" | "superseded" | "missing" | "lost"> {
    const { repo } = this.d;
    const guard = { version: b.version ?? 1, nowIso: this.iso() };
    if (errors.length === 0) {
      // Everything the booking itself needs is done. A host notification still waiting for its retry time keeps the booking queued for that moment only.
      if (c.ownerRetryAt !== null) return repo.finishSync(b.id, { status: "pending", attempts: 0, nextAttemptAt: new Date(c.ownerRetryAt).toISOString(), lastError: OWNER_RETRY_NOTE }, guard, c.claim);
      return repo.finishSync(b.id, { status: "ok", attempts: 0, nextAttemptAt: null, lastError: null }, guard, c.claim);
    }
    const attempts = c.escalated ? MAX_ATTEMPTS : (b.sync?.attempts ?? 0) + 1;
    const lastError = errors.join("; ").slice(0, 500);
    if (attempts >= MAX_ATTEMPTS) {
      const outcome = await repo.finishSync(b.id, { status: "failed", attempts, nextAttemptAt: null, lastError }, guard, c.claim);
      if (outcome === "applied") {
        for (const r of await repo.listRefs(b.id)) if (r.status === "pending") await repo.upsertRef({ ...r, status: "failed", updatedAt: this.iso() });
        await repo.addActivity({ id: newId(), at: this.iso(), kind: "sync_failed", summary: c.escalated ? `Stopped syncing ${b.guestName}'s booking: ${lastError}` : `Giving up syncing ${b.guestName}'s booking after ${attempts} attempts. Use Retry sync once the cause is fixed.`, bookingId: b.id });
      }
      return outcome;
    }
    const delay = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)];
    return repo.finishSync(b.id, { status: "pending", attempts, nextAttemptAt: new Date(this.d.now() + delay * 1000).toISOString(), lastError }, guard, c.claim);
  }

  private ref(refs: ExternalRef[], provider: "zoom" | "google") { return refs.find((r) => r.provider === provider); }
  private base(b: Booking, provider: "zoom" | "google"): ExternalRef {
    return { bookingId: b.id, provider, externalId: null, url: null, status: "pending", syncedVersion: 0, etag: null, contentKey: null, attempts: 0, lastError: null, updatedAt: this.iso(), createIntentAt: null, createUnknown: 0 };
  }
  private async fail(c: Ctx, b: Booking, existing: ExternalRef | undefined, provider: "zoom" | "google", e: unknown, errors: string[], label: string) {
    const prior = existing ?? this.base(b, provider);
    const attempts = prior.attempts + 1;
    await this.put(c, { ...prior, status: prior.status === "synced" ? "synced" : "pending", attempts, lastError: errText(e), updatedAt: this.iso() });
    if (attempts === 1) await this.d.repo.addActivity({ id: newId(), at: this.iso(), kind: provider === "zoom" ? "zoom_failed" : "sync_failed", summary: provider === "zoom" ? `Zoom link pending for ${b.guestName} (${errText(e)}). The booking is confirmed; it will be retried.` : `Google Calendar not updated for ${b.guestName} (${errText(e)}). It will be retried.`, bookingId: b.id });
    errors.push(`${label}: ${errText(e)}`);
  }

  // -------------------------------------------------------------------------------------------------------- Zoom
  /**
   * THE ONE WAY A ZOOM MEETING IS DELETED. First the database condemns it, which it refuses while the meeting is the booking's authoritative meeting
   * (so a deletion decided on old information can never remove a meeting that has since been adopted), and which makes it impossible to record the
   * meeting afterwards. Only then is Zoom asked to delete it. If this dies between the two steps the meeting stays condemned and the scan finishes the job.
   * "kept": it is (now) authoritative, nothing was deleted. Throws if Zoom could not delete it (the condemnation stands; the scan retries).
   */
  private async deleteSurplus(bookingId: string, meetingId: string, reason: string): Promise<"deleted" | "kept"> {
    const { repo, zoom } = this.d;
    if ((await repo.condemnZoomMeeting(bookingId, meetingId, reason)) !== "condemned") return "kept";
    await zoom.deleteMeeting(meetingId);
    await repo.markZoomCondemnedDeleted(meetingId);
    return "deleted";
  }
  /** Meetings already condemned for a booking: never candidates for adoption again, whatever the list shows. */
  private async condemnedIds(bookingId: string) { return new Set((await this.d.repo.listZoomTombstones(bookingId)).map((t) => t.externalId)); }
  condemnedSet(bookingId: string) { return this.condemnedIds(bookingId); }

  /** Records a Zoom write that this worker made after it lost ownership: the database refuses the record, so ask for the booking to be verified again. */
  private async putZoomWrite(c: Ctx, bookingId: string, ref: ExternalRef) {
    if ((await this.d.repo.upsertRef(ref, c.claim)) === "lost") {
      await this.d.repo.invalidateRefs(bookingId, this.iso()).catch(() => undefined);   // Zoom may now hold stale content; the next pass reads it back and corrects it
      throw new OwnershipLost();
    }
  }

  /** Stops automatic work on a booking's Zoom meeting and asks a person: the outcome of an earlier create cannot be established. */
  private async needsPerson(c: Ctx, b: Booking, zref: ExternalRef | undefined, canceled: boolean, errors: string[]) {
    const marker = zoomMarkerFor(b.id);
    c.escalated = true;
    const lastError = canceled ? "Needs a person: Zoom may still hold a meeting for this canceled booking." : "Needs a person: Zoom may have created this meeting but it cannot be found.";
    const alreadyAsked = zref?.status === "failed" && zref.lastError === lastError;   // a plain re-check must not repeat the request every time
    await this.put(c, { ...(zref ?? this.base(b, "zoom")), status: "failed", createUnknown: Math.max(1, zref?.createUnknown ?? 0), lastError, updatedAt: this.iso() });
    if (!alreadyAsked) await this.d.repo.addActivity({ id: newId(), at: this.iso(), kind: "zoom_review", summary: canceled
      ? `${b.guestName}'s booking is canceled, but an earlier Zoom attempt never reported whether it created a meeting. Check Zoom for a meeting whose agenda is ${marker} and delete it, then use Retry sync.`
      : `Zoom may already have created a meeting for ${b.guestName} that cannot be found. Check Zoom for a meeting whose agenda is ${marker}: if there is one, Retry sync adopts it; if there is none, Retry sync creates one.`, bookingId: b.id });
    errors.push(canceled ? "zoom: an earlier create is unresolved; a person needs to check Zoom, then use Retry sync" : "zoom: the outcome of an earlier create is unknown; a person needs to check Zoom, then use Retry sync");
  }

  private async zoomStep(c: Ctx, b: Booking, type: MeetingType, homeTz: string, errors: string[]) {
    const { repo, zoom } = this.d;
    let zref = this.ref(await repo.listRefs(b.id), "zoom");
    let cur = zref;   // the reference as last WRITTEN by this pass; a failure is recorded on top of it, never on top of an older copy
    const version = b.version ?? 1;
    const marker = zoomMarkerFor(b.id);
    const reviewDue = (r?: ExternalRef) => !!r?.createIntentAt && this.d.now() >= Date.parse(r.createIntentAt) + ZOOM_REVIEW_AFTER_SECONDS * 1000;
    if (b.status === "canceled") {
      if (zref?.status === "deleted") return;
      try {
        await this.own(c, b.id);
        // A meeting may exist without a saved reference (a crash or lost response mid-create), and a retry may even have made a second one: remove EVERY meeting that carries the marker.
        const found = await zoom.findMeetingsByMarker(marker);
        const recorded = zref?.status === "synced" && !!zref.externalId;
        const pendingDeletes = (await repo.listZoomTombstones(b.id)).filter((t) => t.status === "pending").map((t) => t.externalId);
        // A create whose outcome was never established may have produced a meeting the list does not show (yet). "Nothing found" is then NOT "nothing exists":
        // the booking is not declared clean. It waits for the meeting to appear (the scan requeues it) or for a person.
        if (!found.length && !recorded && zref?.createIntentAt) { await this.needsPerson(c, b, zref, true, errors); return; }
        const ids = new Set([...found.map((m) => m.meetingId), ...pendingDeletes]);
        if (recorded) ids.add(zref!.externalId!);
        for (const id of ids) await this.deleteSurplus(b.id, id, "the booking was canceled");
        await this.put(c, { ...(zref ?? this.base(b, "zoom")), externalId: [...ids][0] ?? null, url: null, status: "deleted", syncedVersion: version, contentKey: null, attempts: 0, lastError: null, updatedAt: this.iso(), createIntentAt: null });
      } catch (e) { if (isLost(e)) throw e; await this.fail(c, b, cur, "zoom", e, errors, "zoom"); }
      return;
    }
    const input = { topic: type.name, startUtc: b.startUtc, durationMinutes: type.durationMinutes, timeZone: homeTz, marker };
    const key = `v${version}`;
    try {
      if (zref?.status === "synced" && zref.externalId) {
        if (zref.contentKey === key) return;
        try {
          await this.own(c, b.id);
          await zoom.updateMeeting(zref.externalId, input);
          await this.putZoomWrite(c, b.id, { ...zref, syncedVersion: version, contentKey: key, attempts: 0, lastError: null, updatedAt: this.iso() });
          return;
        } catch (e) {
          // Someone deleted the meeting in Zoom: fall through and create a new one (the marker lookup below finds nothing). A KNOWN deletion, so a new create is safe.
          if (!(e instanceof Error && e.name === "ZoomGoneError")) throw e;
          zref = { ...zref, externalId: null, url: null, status: "pending", contentKey: null, updatedAt: this.iso() };
          await this.put(c, zref); cur = zref;
        }
      }
      // No confirmed link yet. A previous attempt may have created the meeting and lost the response: look before creating.
      await this.own(c, b.id);
      const dead = await this.condemnedIds(b.id);
      const found = (await zoom.findMeetingsByMarker(marker)).filter((m) => !dead.has(m.meetingId));   // a condemned meeting is on its way out: never adopt it
      if (found.length) {
        const [keep, ...extra] = found;
        await zoom.updateMeeting(keep.meetingId, input);
        await this.putZoomWrite(c, b.id, { ...(zref ?? this.base(b, "zoom")), externalId: keep.meetingId, url: keep.joinUrl, status: "synced", syncedVersion: version, contentKey: key, attempts: 0, lastError: null, updatedAt: this.iso(), createIntentAt: null, createUnknown: 0 });
        for (const x of extra) await this.deleteSurplus(b.id, x.meetingId, "duplicate of the adopted meeting").catch(() => undefined);   // duplicates of THIS booking: the scan removes any that this misses
        return;
      }
      // Nothing found. If an earlier create has no recorded outcome, that is NOT evidence that no meeting exists, whatever time has passed: NEVER create again.
      // Keep looking for a short while (the meeting may be listed late), then hand it to a person. Only "Retry sync" clears the intent.
      if (zref?.createIntentAt) {
        if (!reviewDue(zref)) throw new Error("still looking for the meeting from the earlier Zoom attempt; not creating another");
        await this.needsPerson(c, b, zref, false, errors);
        return;
      }
      // Safe to create: no earlier create is unresolved. The intent is recorded BEFORE the call, so a crash or lost answer leaves a trace that recovery acts on.
      const intent: ExternalRef = { ...(zref ?? this.base(b, "zoom")), status: "pending", createIntentAt: this.iso(), createUnknown: 0, updatedAt: this.iso() };
      await this.put(c, intent); cur = intent;
      let meeting;
      try { meeting = await zoom.createMeeting(input); }
      catch (e) {
        // A definite refusal proves nothing was created: forget the intent. An uncertain outcome keeps it: the meeting may exist.
        if (!isZoomAmbiguous(e)) { cur = { ...intent, createIntentAt: null, updatedAt: this.iso() }; await this.put(c, cur); }
        throw e;
      }
      const recorded: ExternalRef = { ...intent, externalId: meeting.meetingId, url: meeting.joinUrl, status: "synced", syncedVersion: version, contentKey: key, attempts: 0, lastError: null, updatedAt: this.iso(), createIntentAt: null, createUnknown: 0 };
      if ((await repo.upsertRef(recorded, c.claim)) === "lost") {
        // This worker was replaced while Zoom was creating the meeting. It exists, nobody recorded it: remove it if that is provably safe, else leave it to the marker lookup / scan.
        await this.cleanUpOrphanMeeting(b.id, meeting.meetingId);
        throw new OwnershipLost();
      }
    } catch (e) { if (isLost(e)) throw e; await this.fail(c, b, cur, "zoom", e, errors, "zoom"); }
  }

  /**
   * Reads the meeting back from Zoom and makes sure it shows the booking's CURRENT time and length before the pass may report success. Only a VERIFIED
   * MATCH counts: a record that is incomplete, or about another meeting, is insufficient evidence and the pass does not succeed on it. This is what
   * catches a request that was already in flight when a worker lost its lease and landed afterwards. Bounded: one repair, and one re-read of an
   * incomplete answer. A failure to reach Zoom throws (reported as an error by the caller): also not a success.
   */
  private async verifyZoom(c: Ctx, b: Booking, type: MeetingType, homeTz: string, errors: string[]) {
    const { repo, zoom } = this.d;
    if (b.status === "canceled") return;
    const zref = this.ref(await repo.listRefs(b.id), "zoom");
    if (!zref || zref.status !== "synced" || !zref.externalId) return;
    let repaired = false, reread = false;
    for (let i = 0; i < 4; i++) {
      await this.own(c, b.id);
      const state = await zoom.getMeeting(zref.externalId);
      const latest = await repo.getBooking(b.id);
      if ((latest?.version ?? 1) !== (b.version ?? 1)) return;   // the booking moved on meanwhile: the next pass verifies that version
      if (!state) {
        await this.put(c, { ...zref, externalId: null, url: null, status: "pending", contentKey: null, updatedAt: this.iso() });
        errors.push("zoom: the meeting no longer exists in Zoom; it will be recreated");
        return;
      }
      const evidence = compareZoom(state, zref.externalId, latest!, type);
      if (evidence === "match") return;
      if (evidence === "insufficient") {
        if (reread) { errors.push("zoom: Zoom did not report the meeting's time and length, so it cannot be verified; the booking stays unsynchronised until it can be"); await repo.invalidateRefs(b.id, this.iso()).catch(() => undefined); return; }
        reread = true; continue;
      }
      if (repaired) { errors.push("zoom: the meeting does not show the booking's current time and could not be corrected yet"); await repo.invalidateRefs(b.id, this.iso()).catch(() => undefined); return; }
      await zoom.updateMeeting(zref.externalId, { topic: type.name, startUtc: latest!.startUtc, durationMinutes: type.durationMinutes, timeZone: homeTz, marker: zoomMarkerFor(b.id) });
      repaired = true;
    }
    errors.push("zoom: the meeting could not be verified");
  }

  /**
   * A replaced worker created a meeting nobody recorded. Delete it only when the database proves it is surplus: another meeting is recorded for the
   * booking, or the booking is canceled and its meeting already removed. Otherwise the current worker may still adopt it by its marker (and the scan
   * removes any duplicate later), so it is left alone. Best effort by design.
   */
  private async cleanUpOrphanMeeting(bookingId: string, meetingId: string) {
    const { repo } = this.d;
    try {
      const [booking, refs] = await Promise.all([repo.getBooking(bookingId), repo.listRefs(bookingId)]);
      const cur = this.ref(refs, "zoom");
      const winnerElsewhere = cur?.status === "synced" && !!cur.externalId && cur.externalId !== meetingId;
      const canceledAndClean = booking?.status === "canceled" && cur?.status === "deleted";
      if (winnerElsewhere || canceledAndClean) await this.deleteSurplus(bookingId, meetingId, "created by a replaced worker");   // the database re-checks ownership at the moment of deleting
    } catch { /* the scan is the backstop */ }
  }

  // ---------------------------------------------------------------------------------------------- Google Calendar
  private async googleStep(c: Ctx, b: Booking, type: MeetingType, homeTz: string, errors: string[]) {
    const { repo, calendar } = this.d;
    const refs = await repo.listRefs(b.id);
    const gref = this.ref(refs, "google");
    const zref = this.ref(refs, "zoom");
    const version = b.version ?? 1;
    const eventId = gref?.externalId ?? googleEventIdFor(b.id);
    if (b.status === "canceled") {
      if (gref?.status === "deleted") return;
      try { await this.own(c, b.id); await calendar.deleteEvent(eventId); await this.put(c, { ...(gref ?? this.base(b, "google")), externalId: eventId, status: "deleted", syncedVersion: version, contentKey: null, attempts: 0, lastError: null, updatedAt: this.iso() }); }
      catch (e) { if (isLost(e)) throw e; await this.fail(c, b, gref, "google", e, errors, "google"); }
      return;
    }
    const zoomUrl = zref?.status === "synced" ? zref.url : null;
    const key = `v${version}|${zoomUrl ?? ""}`;
    if (gref?.status === "synced" && gref.contentKey === key) return;
    if (!gref) await this.checkConflict(b);
    try {
      await this.own(c, b.id);
      const out = await calendar.upsertEvent({
        eventId, bookingId: b.id, summary: `${type.name}: ${b.guestName}`,
        description: [`${type.name} (${type.durationMinutes} min)`, `Guest: ${b.guestName} <${b.guestEmail}>`, b.guestMessage ? `Message: ${b.guestMessage}` : "", zoomUrl ? `Zoom: ${zoomUrl}` : "Zoom link pending", `Booking: ${b.reference}`, "Managed by MBA Scheduling. Change it there, not here."].filter(Boolean).join("\n"),
        startUtc: b.startUtc, endUtc: b.endUtc, timeZone: homeTz, location: zoomUrl, attendeeEmail: this.d.inviteGuestInCalendar ? b.guestEmail : null,
      });
      const rec: ExternalRef = { ...(gref ?? this.base(b, "google")), externalId: out.eventId, url: out.url ?? null, etag: out.etag ?? null, status: "synced", syncedVersion: version, contentKey: key, attempts: 0, lastError: null, updatedAt: this.iso() };
      if ((await repo.upsertRef(rec, c.claim)) === "lost") {
        // Replaced mid-call. The event is written with the deterministic id, so what it shows may now be stale, or it may exist for a booking that was canceled meanwhile.
        const now = await repo.getBooking(b.id).catch(() => null);
        if (now?.status === "canceled") await calendar.deleteEvent(eventId).catch(() => undefined);   // cancellation is authoritative and final
        else await repo.invalidateRefs(b.id, this.iso()).catch(() => undefined);                       // have the current worker (or the next sweep) re-apply the right content
        throw new OwnershipLost();
      }
    } catch (e) { if (isLost(e)) throw e; await this.fail(c, b, gref, "google", e, errors, "google"); }
  }

  /**
   * Just before our event first exists, anything else busy at that time is an external conflict (something was added to the calendar after the
   * slot was offered). The booking stands, the administrator is told. Best effort: a calendar that cannot be read here is handled by the create below.
   */
  private async checkConflict(b: Booking) {
    try {
      const busy = await this.d.calendar.getBusy(Date.parse(b.startUtc), Date.parse(b.endUtc));
      if (busy.length) await this.flagConflict(b);
    } catch { /* not fatal here */ }
  }

  /** Records a conflict on the booking's own history and in Recent activity, once per booking and time. Returns whether it was newly flagged. */
  private async flagConflict(b: Booking): Promise<boolean> {
    const { repo } = this.d;
    const fresh = (await repo.getBooking(b.id)) ?? b;
    const detail = `Overlaps another event on your Google Calendar (${fresh.startUtc}). The booking stands; review it and reschedule one of them if needed.`;
    if (fresh.events.some((e) => e.kind === "calendar_conflict" && e.detail === detail)) return false;
    await repo.addBookingEvent(fresh.id, { at: this.iso(), kind: "calendar_conflict", detail });
    await repo.addActivity({ id: newId(), at: this.iso(), kind: "calendar_conflict", summary: `${fresh.guestName}'s booking overlaps another event on your Google Calendar. The booking stands; review it and reschedule one of them if needed.`, bookingId: fresh.id });
    return true;
  }

  /**
   * Catches a conflict that appears AFTER our event exists (nothing watches the calendar yet): one free/busy read over all upcoming bookings.
   * Google merges overlapping events into one block, so blocks entirely covered by our own bookings are ignored; anything else overlapping a booking
   * is foreign. An external event identical to our own booking cannot be told apart (documented limit). A calendar that cannot be read is skipped.
   */
  async scanConflicts(limit = 200): Promise<{ checked: number; flagged: string[]; /** False when the calendar could not be read: nothing was learned, so the caller should try again soon. */ ran: boolean }> {
    const { repo, calendar } = this.d;
    const now = this.d.now();
    const upcoming = (await repo.listBookings()).filter((b) => !b.demo && b.status === "confirmed" && Date.parse(b.endUtc) > now && Date.parse(b.startUtc) < now + 90 * 864e5).slice(0, limit);
    if (!upcoming.length) return { checked: 0, flagged: [], ran: true };
    const iv = upcoming.map((b) => ({ id: b.id, s: Date.parse(b.startUtc), e: Date.parse(b.endUtc) })).sort((a, b) => a.s - b.s);
    const merged: Array<{ s: number; e: number }> = [];
    for (const x of iv) { const last = merged[merged.length - 1]; if (last && x.s <= last.e) last.e = Math.max(last.e, x.e); else merged.push({ s: x.s, e: x.e }); }
    let busy;
    try { busy = await calendar.getBusy(iv[0].s, Math.max(...iv.map((x) => x.e))); } catch { return { checked: 0, flagged: [], ran: false }; }
    const foreign = busy.filter((x) => !merged.some((m) => x.start >= m.s && x.end <= m.e));
    const flagged: string[] = [];
    for (const x of iv) if (foreign.some((f) => f.start < x.e && f.end > x.s)) { const b = upcoming.find((u) => u.id === x.id)!; if (await this.flagConflict(b)) flagged.push(b.id); }
    return { checked: upcoming.length, flagged, ran: true };
  }

  // -------------------------------------------------------------------------------------------------------- Zoom scan
  /**
   * The periodic comparison of the host's Zoom meetings with the bookings. It does not depend on any worker having survived, which is why it exists:
   * no lock or token can stop a request that was already in flight, and a process can die at any point. It follows the ownership rule: every deletion
   * goes through deleteSurplus (condemn, then delete), so a decision made on old information cannot remove a meeting that has since become authoritative.
   *   1. Finishes deletions that were condemned but never completed (a cleanup that died half way).
   *   2. One list of the host's marked meetings, grouped by booking. For a booking WE know:
   *        canceled and recorded as removed: every meeting carrying its marker is surplus;
   *        canceled, not yet recorded as removed: re-queued, so its cancel pass finds and deletes the meeting;
   *        confirmed with a recorded meeting: the others are surplus, and the recorded one must VERIFY (see compareZoom); a mismatch or insufficient
   *          evidence marks the references stale and re-queues the booking;
   *        confirmed with an UNRESOLVED create: the meeting has finally been listed, so the booking is re-queued and adopts it.
   *   3. Every confirmed upcoming booking whose recorded meeting is NOT in the list is read directly by its id. A list is not proof of absence: a
   *      meeting that Zoom still returns is fine (list lag), one that Zoom says is gone is queued for repair (a known deletion), and a failed read
   *      concludes nothing.
   * A meeting whose booking this database does not know belongs to someone else (another environment may share the host) and is NEVER touched.
   */
  async scanZoom(): Promise<{ ran: boolean; removed: number; stale: number; requeued: number; unverified: number; missing: number }> {
    const { repo, zoom } = this.d;
    const none = { ran: false, removed: 0, stale: 0, requeued: 0, unverified: 0, missing: 0 };
    let marked: MarkedMeeting[];
    try { marked = await zoom.listMarkedMeetings(); } catch { return none; }
    const types = await repo.listMeetingTypes();
    let removed = 0, stale = 0, requeued = 0, unverified = 0, missing = 0;
    const requeue = async (b: Booking, why: string) => {
      const out = await repo.finishSync(b.id, { status: "pending", attempts: 0, nextAttemptAt: this.iso(), lastError: why }, { version: b.version ?? 1, nowIso: this.iso() });
      if (out !== "missing") requeued++;
    };
    // 1. condemned but not yet deleted
    for (const t of (await repo.listZoomTombstones()).filter((x) => x.status === "pending")) {
      try { await zoom.deleteMeeting(t.externalId); await repo.markZoomCondemnedDeleted(t.externalId); removed++; } catch { /* the next scan tries again */ }
    }
    // 2. what Zoom lists
    const byBooking = new Map<string, MarkedMeeting[]>();
    for (const m of marked) { const id = m.marker.slice(ZOOM_MARKER_PREFIX.length); const list = byBooking.get(id) ?? []; list.push(m); byBooking.set(id, list); }
    const listed = new Set(marked.map((m) => m.meetingId));
    // A recorded meeting is judged on Zoom's evidence; an incomplete list entry is completed by reading that one meeting directly.
    const judge = async (b: Booking, type: MeetingType, z: ExternalRef, entry: ZoomMeetingState | null): Promise<void> => {
      if (z.contentKey !== `v${b.version ?? 1}`) return;   // already stale: the queue's business
      let state = entry;
      let evidence: ZoomEvidence = state ? compareZoom(state, z.externalId!, b, type) : "insufficient";
      if (evidence === "insufficient") { try { state = await zoom.getMeeting(z.externalId!); } catch { return; } if (state) evidence = compareZoom(state, z.externalId!, b, type); }
      if (!state) { missing++; await repo.invalidateRefs(b.id, this.iso()); return; }
      if (evidence === "mismatch") { stale++; await repo.invalidateRefs(b.id, this.iso()); }
      else if (evidence === "insufficient") { unverified++; await repo.invalidateRefs(b.id, this.iso()); }
    };
    for (const [bookingId, meetings] of byBooking) {
      const b = await repo.getBooking(bookingId).catch(() => null);
      if (!b) continue;
      const z = this.ref(await repo.listRefs(bookingId), "zoom");
      let surplus: MarkedMeeting[] = [];
      if (b.status === "canceled") {
        if (z?.status === "deleted") surplus = meetings;
        else await requeue(b, "Zoom still lists a meeting for this canceled booking");
      } else if (z?.status === "synced" && z.externalId && meetings.some((m) => m.meetingId === z.externalId)) {
        surplus = meetings.filter((m) => m.meetingId !== z.externalId);
        const type = types.find((t) => t.id === b.meetingTypeId);
        if (type) await judge(b, type, z, meetings.find((m) => m.meetingId === z.externalId)!);
      } else if (z && z.createIntentAt && !z.externalId) {
        await requeue(b, "Zoom now lists the meeting from an earlier create");
      }
      let gone = 0;
      for (const m of surplus) { try { if ((await this.deleteSurplus(bookingId, m.meetingId, "surplus found by the scan")) === "deleted") gone++; } catch { /* condemned; finished by the next scan */ } }
      if (gone) { removed += gone; await repo.addActivity({ id: newId(), at: this.iso(), kind: "zoom_review", summary: `Removed ${gone} duplicate Zoom meeting${gone === 1 ? "" : "s"} left over for ${b.guestName}'s booking.`, bookingId }); }
    }
    // 3. recorded meetings the list did not show
    const now = this.d.now();
    const upcoming = (await repo.listBookings()).filter((b) => !b.demo && b.status === "confirmed" && Date.parse(b.endUtc) > now).slice(0, 200);
    for (const b of upcoming) {
      const z = this.ref(await repo.listRefs(b.id), "zoom");
      const type = types.find((t) => t.id === b.meetingTypeId);
      if (z?.status === "synced" && z.externalId && type && !listed.has(z.externalId)) await judge(b, type, z, null);
    }
    return { ran: true, removed, stale, requeued, unverified, missing };
  }

  // -------------------------------------------------------------------------------------------------------- Email
  private async emailStep(c: Ctx, b: Booking, type: MeetingType, homeTz: string, errors: string[]) {
    const attempts = await this.d.repo.listEmailAttempts(b.id);
    const version = b.version ?? 1;
    const accepted = (kind: EmailKind, v?: number) => attempts.find((a) => a.kind === kind && a.status === "accepted" && (v === undefined || a.version === v));
    let kind: GuestEmailKind | null = null;
    if (b.status === "canceled") kind = accepted("cancellation", version) ? null : "cancellation";
    else if (!accepted("confirmation")) kind = "confirmation";
    // A reschedule notice only makes sense for a guest who was told an EARLIER version. If the booking moved before the first confirmation
    // went out, that confirmation (composed from the booking as it is now) already carries the new time.
    else if (version > 1 && (accepted("confirmation")?.version ?? version) < version && !accepted("reschedule", version)) kind = "reschedule";
    else if (b.zoom.joinUrl) {
      // The guest was told "your link will follow": send it once the link exists.
      const latest = accepted("reschedule", version) ?? accepted("confirmation");
      if (latest && !latest.includedZoom && !accepted("zoom_details", version)) kind = "zoom_details";
    }
    if (kind) { await this.own(c, b.id); await this.deliver(b, kind, version, b.guestEmail, composeEmail(kind, b, type), errors, { type, claim: c }); }
    // The host's notification is a separate message with its own tracking and retries: the guest's failing does not stop it, nor the other way round.
    await this.ownerStep(c, b, type, homeTz, attempts);
  }

  /**
   * Which notification the host is owed for this booking right now, if any. It follows genuine TRANSITIONS, each judged by when it happened against
   * the activation baseline: the booking's creation, each reschedule, and the cancellation. A booking that was already canceled (or moved) before
   * owner notifications existed is history, whatever its current status says.
   */
  private ownerKindFor(b: Booking, attempts: EmailAttempt[], zref: ExternalRef | undefined, since: string): { kind: OwnerEmailKind; version: number; toldVersion: number } | null {
    const version = b.version ?? 1;
    const after = (at: string | undefined) => !!at && Date.parse(at) >= Date.parse(since);
    const done = (k: OwnerEmailKind) => attempts.filter((a) => a.kind === k && a.status === "accepted");
    if (b.status === "canceled") {
      const canceledAt = b.events.filter((e) => e.kind === "canceled").at(-1)?.at;
      if (!after(canceledAt)) return null;                                  // canceled before owner notifications were on: history
      return done("owner_canceled").some((a) => a.version === version) ? null : { kind: "owner_canceled", version, toldVersion: version };
    }
    const told = [...done("owner_new_booking"), ...done("owner_rescheduled")].map((a) => a.version);
    const moves = b.events.filter((e) => e.kind === "rescheduled");
    if (!told.length) {
      if (after(b.createdAt)) {
        // The first notice carries the Zoom link. It waits for the link, unless Zoom keeps failing: then the host hears about the booking anyway.
        const linkReady = !!b.zoom.joinUrl, zoomStuck = (zref?.attempts ?? 0) >= 2 || zref?.status === "failed";
        return linkReady || zoomStuck ? { kind: "owner_new_booking", version, toldVersion: version } : null;
      }
      // Booked before owner notifications were on: the host was not told about it, and is not told now. A reschedule made AFTER the baseline is a genuine
      // transition and is announced, against the version that was current at the baseline.
      const baseline = 1 + moves.filter((e) => !after(e.at)).length;
      return version > baseline ? { kind: "owner_rescheduled", version, toldVersion: baseline } : null;
    }
    const last = Math.max(...told);
    return last < version ? { kind: "owner_rescheduled", version, toldVersion: last } : null;
  }

  private async ownerStep(c: Ctx, b: Booking, type: MeetingType, homeTz: string, attempts: EmailAttempt[]) {
    const to = this.d.ownerEmail;
    if (!to || !isApprovedOwnerAddress(to)) return;   // owner messages go to the one approved address only
    const since = await this.ownerActivation();
    if (!since) return;
    const zref = this.ref(await this.d.repo.listRefs(b.id), "zoom");
    const due = this.ownerKindFor(b, attempts, zref, since);
    if (!due) return;
    const failed = attempts.filter((a) => a.kind === due.kind && a.version === due.version && a.status === "failed");
    if (failed.length >= OWNER_MAX_ATTEMPTS) return;   // given up (the activity feed said so when it happened)
    const wait = (n: number) => OWNER_BACKOFF_SECONDS[Math.min(n - 1, OWNER_BACKOFF_SECONDS.length - 1)] * 1000;
    const retryAt = (at: number) => { c.ownerRetryAt = c.ownerRetryAt === null ? at : Math.min(c.ownerRetryAt, at); };
    if (failed.length) {
      const dueAt = Math.max(...failed.map((a) => Date.parse(a.attemptedAt))) + wait(failed.length);
      if (this.d.now() < dueAt) { retryAt(dueAt); return; }
    }
    await this.own(c, b.id);
    const content = composeOwnerEmail(due.kind, b, type, { homeTz, adminUrl: this.d.adminUrl, previousStartUtc: due.kind === "owner_rescheduled" ? startAtVersion(b, due.toldVersion) : null });
    const ok = await this.deliver(b, due.kind, due.version, to, content, [], { type, claim: c, replyTo: b.guestEmail });
    if (ok) return;
    if (failed.length + 1 >= OWNER_MAX_ATTEMPTS) await this.d.repo.addActivity({ id: newId(), at: this.iso(), kind: "owner_notification_failed", summary: `The notification to you about ${b.guestName}'s booking could not be sent after ${OWNER_MAX_ATTEMPTS} attempts. The booking itself is unaffected.`, bookingId: b.id });
    else retryAt(this.d.now() + wait(failed.length + 1));
  }

  /**
   * Sends ONE message and records the attempt. The provider key is per (booking, kind, version), so a retry or a second worker cannot deliver it twice
   * inside the provider's window, and a unique database row makes the accepted record exactly-once. Owner and guest messages are separate kinds.
   */
  private async deliver(b: Booking, kind: EmailKind, version: number, to: string, content: EmailContent, errors: string[], o: { type: MeetingType; claim: Ctx | null; nonce?: string; replyTo?: string }) {
    const { repo, email } = this.d;
    const idempotencyKey = `sched-email/${b.id}/${kind}/${version}${o.nonce ? `/${o.nonce}` : ""}`;
    try {
      const sent = await email.send({ to, subject: content.subject, text: content.text, idempotencyKey, content, replyTo: o.replyTo, tags: { scheduling_booking: b.id, scheduling_kind: kind } });
      await repo.recordEmailAttempt({ id: newId(), bookingId: b.id, kind, version, to, status: "accepted", providerMessageId: sent.id, error: null, includedZoom: !!b.zoom.joinUrl, idempotencyKey, attemptedAt: this.iso() });
      if (email.simulated || sent.simulated) await repo.addOutbox?.(outboxRecord(newId(), this.iso(), kind, b, o.type, content, to));
      return true;
    } catch (e) {
      await repo.recordEmailAttempt({ id: newId(), bookingId: b.id, kind, version, to, status: "failed", providerMessageId: null, error: errText(e), includedZoom: false, idempotencyKey, attemptedAt: this.iso() });
      errors.push(`email: ${errText(e)}`);
      return false;
    }
  }

  /** The administrator's "Resend confirmation": always sends, once per click. */
  async resendConfirmation(bookingId: string): Promise<{ ok: boolean; error?: string }> {
    const b = await this.d.repo.getBooking(bookingId);
    if (!b) return { ok: false, error: "not found" };
    const type = (await this.d.repo.listMeetingTypes()).find((t) => t.id === b.meetingTypeId);
    if (!type) return { ok: false, error: "meeting type missing" };
    const errors: string[] = [];
    await this.deliver(b, "confirmation_resend", b.version ?? 1, b.guestEmail, composeEmail("confirmation_resend", b, type), errors, { type, claim: null, nonce: `${this.d.now()}-${newId()}` });
    return errors.length ? { ok: false, error: errors[0] } : { ok: true };
  }
}
