import type { ActivityEntry, Availability, Booking, BookingEvent, CommunityState, ConsentRecord, EmailAttempt, ExternalRef, MeetingType, OutboxMessage, SchedulingData, Settings, SyncState, SweepSummary } from "./types";
import { RepositoryError, type CommunityEvidence, type MoveBooking, type NewBooking, type SchedulingRepository, type WebhookClaim } from "./repository";
import type { SchedulingStore } from "./store";
import { newId } from "./seed";

const MIN = 60_000;
/** The worker lease on a booking, kept beside it in the document (the database keeps it in sync_locked_until / sync_claim). */
type Locked = { syncLockedUntil?: string; syncClaim?: string };

/**
 * The prototype's repository, over the JSON-document store. It enforces the SAME rules as the database does, inside one
 * serialised mutation, so the contract tests can hold both implementations to one behaviour.
 */
export class DocumentRepository implements SchedulingRepository {
  constructor(private store: SchedulingStore) {}

  private norm(d: SchedulingData): SchedulingData { d.externalRefs ??= []; d.emailAttempts ??= []; return d; }
  private async read() { return this.norm(await this.store.read()); }
  private mutate<T>(fn: (d: SchedulingData) => T | Promise<T>) { return this.store.mutate((d) => fn(this.norm(d))); }

  /** The two buffers around a booking: its own snapshot, else (older records) its meeting type's current setting. */
  private buffers(d: SchedulingData, b: Booking) {
    const t = d.meetingTypes.find((m) => m.id === b.meetingTypeId);
    return { before: (b.bufferBeforeMinutes ?? t?.bufferBeforeMinutes ?? 0) * MIN, after: (b.bufferAfterMinutes ?? t?.bufferAfterMinutes ?? 0) * MIN };
  }

  /** Two bookings conflict unless there is room for BOTH buffers between them (identical to the database's padded-range exclusion). */
  private overlaps(d: SchedulingData, start: number, end: number, before: number, after: number, ignoreId?: string) {
    return d.bookings.some((x) => {
      if (x.status !== "confirmed" || x.id === ignoreId) return false;
      const xs = Date.parse(x.startUtc), xe = Date.parse(x.endUtc), xb = this.buffers(d, x);
      return !(start >= xe + xb.after + before || end + after + xb.before <= xs);
    });
  }

  private dayCount(d: SchedulingData, typeId: string, dayStart: string, dayEnd: string, ignoreId?: string) {
    const a = Date.parse(dayStart), b = Date.parse(dayEnd);
    return d.bookings.filter((x) => x.status === "confirmed" && x.meetingTypeId === typeId && x.id !== ignoreId && Date.parse(x.startUtc) >= a && Date.parse(x.startUtc) < b).length;
  }

  async snapshot() { return this.read(); }

  async getSettings() { return (await this.read()).settings; }
  async saveSettings(patch: { homeTimeZone?: string; simulate?: Partial<Settings["simulate"]> }) {
    return this.mutate((d) => {
      if (patch.homeTimeZone !== undefined) d.settings.homeTimeZone = patch.homeTimeZone;
      if (patch.simulate) d.settings.simulate = { ...d.settings.simulate, ...Object.fromEntries(Object.entries(patch.simulate).filter(([, v]) => typeof v === "boolean")) };
      return d.settings;
    });
  }
  async listMeetingTypes() { return (await this.read()).meetingTypes; }
  async saveMeetingType(type: MeetingType, isNew: boolean) {
    return this.mutate((d) => {
      const i = d.meetingTypes.findIndex((m) => m.id === type.id);
      if (!isNew && i < 0) throw new RepositoryError("not_found");
      if (d.meetingTypes.some((m) => m.slug === type.slug && m.id !== type.id)) throw new RepositoryError("slug_taken");
      if (i >= 0) d.meetingTypes[i] = type; else d.meetingTypes.push(type);
      return type;
    });
  }
  async saveAvailability(typeId: string, availability: Availability) {
    return this.mutate((d) => { const t = d.meetingTypes.find((m) => m.id === typeId); if (!t) throw new RepositoryError("not_found"); t.availability = availability; return availability; });
  }

  async listBookings() { return (await this.read()).bookings; }
  async listConfirmedBookings(fromIso: string, toIso: string, marginMs: number) {
    const a = Date.parse(fromIso) - marginMs, b = Date.parse(toIso) + marginMs;
    return (await this.read()).bookings.filter((x) => x.status === "confirmed" && Date.parse(x.endUtc) > a && Date.parse(x.startUtc) < b);
  }
  async getBooking(id: string) { return (await this.read()).bookings.find((b) => b.id === id) ?? null; }
  async getBookingByReference(reference: string) { return (await this.read()).bookings.find((b) => b.reference === reference) ?? null; }
  async findByIdempotencyKey(key: string) { const d = await this.read(); const id = d.idempotency[key]; return id ? d.bookings.find((b) => b.id === id) ?? null : null; }

  async createBooking(nb: NewBooking) {
    return this.mutate((d) => {
      const prior = d.idempotency[nb.idempotencyKey];
      const existing = prior ? d.bookings.find((b) => b.id === prior) : undefined;
      if (existing) {
        if (existing.requestHash !== nb.requestHash) throw new RepositoryError("idempotency_conflict");
        return { booking: existing, replay: true };
      }
      const start = Date.parse(nb.startUtc), end = Date.parse(nb.endUtc);
      if (this.overlaps(d, start, end, nb.bufferBeforeMinutes * MIN, nb.bufferAfterMinutes * MIN)) throw new RepositoryError("slot_unavailable");
      if (nb.maxPerDay !== null && this.dayCount(d, nb.meetingTypeId, nb.dayStartUtc, nb.dayEndUtc) >= nb.maxPerDay) throw new RepositoryError("day_full");
      const booking: Booking = {
        id: newId(), reference: nb.reference, meetingTypeId: nb.meetingTypeId, startUtc: nb.startUtc, endUtc: nb.endUtc,
        guestName: nb.guestName, guestEmail: nb.guestEmail, guestMessage: nb.guestMessage, guestTimeZone: nb.guestTimeZone,
        status: "confirmed", source: nb.source, zoom: { status: "pending", meetingId: null, joinUrl: null }, community: { state: "unseen" },
        idempotencyKey: nb.idempotencyKey, requestHash: nb.requestHash, createdAt: nb.createdAt, version: 1,
        bufferBeforeMinutes: nb.bufferBeforeMinutes, bufferAfterMinutes: nb.bufferAfterMinutes,
        sync: { status: "pending", attempts: 0, nextAttemptAt: nb.createdAt, lastError: null },
        events: [{ at: nb.createdAt, kind: "created", detail: nb.demo ? "Seeded sample booking" : "Booked online" }], ...(nb.demo ? { demo: true } : {}),
      };
      d.bookings.push(booking);
      d.idempotency[nb.idempotencyKey] = booking.id;
      return { booking, replay: false };
    });
  }

  async cancelBooking(id: string, at: string, actor: string) {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) throw new RepositoryError("not_found");
      if (b.status === "canceled") return { booking: b, changed: false };
      b.status = "canceled"; b.version = (b.version ?? 1) + 1;
      b.sync = { status: "pending", attempts: 0, nextAttemptAt: at, lastError: null };
      b.events.push({ at, kind: "canceled", detail: `Canceled by ${actor}` });
      return { booking: b, changed: true };
    });
  }

  async rescheduleBooking(id: string, move: MoveBooking, actor: string) {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) throw new RepositoryError("not_found");
      if (b.status === "canceled") throw new RepositoryError("conflict", "A canceled booking cannot be rescheduled.");
      const { before, after } = this.buffers(d, b);
      if (this.overlaps(d, Date.parse(move.startUtc), Date.parse(move.endUtc), before, after, b.id)) throw new RepositoryError("slot_unavailable");
      if (move.maxPerDay !== null && this.dayCount(d, b.meetingTypeId, move.dayStartUtc, move.dayEndUtc, b.id) >= move.maxPerDay) throw new RepositoryError("day_full");
      const previous = b.startUtc;
      b.startUtc = move.startUtc; b.endUtc = move.endUtc; b.version = (b.version ?? 1) + 1;
      b.sync = { status: "pending", attempts: 0, nextAttemptAt: move.at, lastError: null };
      b.events.push({ at: move.at, kind: "rescheduled", detail: `Moved from ${previous} by ${actor}` });
      return b;
    });
  }

  async addBookingEvent(id: string, event: BookingEvent) { await this.mutate((d) => { d.bookings.find((x) => x.id === id)?.events.push(event); }); }

  async setCommunity(reference: string, state: CommunityState, evidence?: CommunityEvidence) {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.reference === reference);
      if (!b) throw new RepositoryError("not_found");
      const current = b.community.state;
      if (state === "shown") { if (current === "unseen") b.community = { state: "shown", at: evidence?.at }; return b.community.state; }
      if (current !== "unseen" && current !== "shown") return current;
      b.community = { state, at: evidence?.at };
      if (evidence && (state === "joined" || state === "declined" || state === "dismissed")) {
        d.consents.unshift({ id: newId(), at: evidence.at, bookingId: b.id, email: evidence.email, choice: state, wordingVersion: evidence.wordingVersion, wording: evidence.wording, source: evidence.source, simulated: false });
      }
      return state;
    });
  }

  async reset(data: SchedulingData) { await this.store.replace(data); }
  async replayDemoCommunity(reference: string) { await this.mutate((d) => { const b = d.bookings.find((x) => x.reference === reference && x.demo); if (b) b.community = { state: "unseen" }; }); }

  async addActivity(entry: ActivityEntry) { await this.mutate((d) => { d.activity.unshift(entry); d.activity = d.activity.slice(0, 200); }); }
  async addOutbox(message: OutboxMessage) { await this.mutate((d) => { d.outbox.unshift(message); d.outbox = d.outbox.slice(0, 300); }); }
  async addConsent(record: ConsentRecord) { await this.mutate((d) => { d.consents.unshift(record); }); }

  async listRefs(bookingId: string) { return (await this.read()).externalRefs!.filter((r) => r.bookingId === bookingId); }
  async findBookingIdByExternalRef(provider: ExternalRef["provider"], externalId: string) { return (await this.read()).externalRefs!.find((r) => r.provider === provider && r.externalId === externalId)?.bookingId ?? null; }
  async upsertRef(ref: ExternalRef, claim?: string): Promise<"applied" | "lost"> {
    return this.mutate((d): "applied" | "lost" => {
      const b = d.bookings.find((x) => x.id === ref.bookingId);
      // Fenced: only the worker that still owns the booking may record what it did. Checked inside the same serialised mutation as the write.
      if (claim !== undefined && (!b || (b as Locked).syncClaim !== claim)) return "lost";
      const refs = d.externalRefs!;
      // A condemned meeting can never be recorded as a booking's synced meeting (the database enforces the same with a trigger).
      if (ref.provider === "zoom" && ref.externalId && ref.status === "synced" && (d.zoomTombstones ?? []).some((t) => t.externalId === ref.externalId)) throw new RepositoryError("condemned", "That Zoom meeting was condemned for deletion.");
      const i = refs.findIndex((r) => r.bookingId === ref.bookingId && r.provider === ref.provider);
      if (ref.externalId && refs.some((r) => r.provider === ref.provider && r.externalId === ref.externalId && r.bookingId !== ref.bookingId)) throw new RepositoryError("conflict", "That external id already belongs to another booking.");
      if (i >= 0) refs[i] = ref; else refs.push(ref);
      // Keep the booking's projection in step so the UI never has to join.
      if (b && ref.provider === "zoom") b.zoom = ref.status === "synced" && ref.url ? { status: b.zoom.status === "simulated" ? "simulated" : "ready", meetingId: ref.externalId, joinUrl: ref.url } : { status: ref.status === "failed" ? "failed" : "pending", meetingId: null, joinUrl: null, ...(!ref.externalId && ref.createIntentAt ? { uncertainSince: ref.createIntentAt } : {}) };
      return "applied";
    });
  }
  async condemnZoomMeeting(bookingId: string, externalId: string, reason: string) {
    return this.mutate((d): "condemned" | "owned" | "missing" => {
      const b = d.bookings.find((x) => x.id === bookingId);
      if (!b) return "missing";
      if (d.externalRefs!.some((r) => r.provider === "zoom" && r.externalId === externalId && r.status === "synced" && (r.bookingId !== bookingId || b.status === "confirmed"))) return "owned";
      const t = (d.zoomTombstones ??= []);
      if (!t.some((x) => x.externalId === externalId)) t.push({ externalId, bookingId, reason: reason.slice(0, 200), status: "pending" });
      return "condemned";
    });
  }
  async markZoomCondemnedDeleted(externalId: string) { await this.mutate((d) => { const t = d.zoomTombstones?.find((x) => x.externalId === externalId); if (t) t.status = "deleted"; }); }
  async listZoomTombstones(bookingId?: string) { return ((await this.read()).zoomTombstones ?? []).filter((t) => !bookingId || t.bookingId === bookingId).map((t) => ({ bookingId: t.bookingId, externalId: t.externalId, status: t.status })); }
  async invalidateRefs(bookingId: string, nowIso: string) {
    await this.mutate((d) => {
      for (const r of d.externalRefs!) if (r.bookingId === bookingId && r.status === "synced") r.contentKey = null;
      const b = d.bookings.find((x) => x.id === bookingId);
      if (b && b.sync?.status === "ok") b.sync = { status: "pending", attempts: 0, nextAttemptAt: nowIso, lastError: null };
    });
  }
  async listEmailAttempts(bookingId: string) { return (await this.read()).emailAttempts!.filter((a) => a.bookingId === bookingId); }
  async recordEmailAttempt(attempt: EmailAttempt) {
    return this.mutate((d) => {
      if (attempt.status === "accepted" && attempt.kind !== "confirmation_resend" && d.emailAttempts!.some((a) => a.bookingId === attempt.bookingId && a.kind === attempt.kind && a.version === attempt.version && a.status === "accepted")) return { recorded: false };
      d.emailAttempts!.push(attempt);
      return { recorded: true };
    });
  }
  async setEmailDelivery(providerMessageId: string, status: "delivered" | "bounced" | "failed", at: string) {
    return this.mutate((d) => {
      const a = d.emailAttempts!.find((x) => x.providerMessageId === providerMessageId);
      if (!a) return false;
      if (a.deliveryStatus === "bounced") return true; // a late "delivered" never overwrites a bounce
      a.deliveryStatus = status; void at;
      return true;
    });
  }

  async claimSync(bookingId: string, nowIso: string, lockSeconds: number): Promise<string | null> {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.id === bookingId) as Locked | undefined;
      if (!b) return null;
      if (b.syncLockedUntil && Date.parse(b.syncLockedUntil) > Date.parse(nowIso)) return null;
      b.syncLockedUntil = new Date(Date.parse(nowIso) + lockSeconds * 1000).toISOString();
      b.syncClaim = newId();   // a NEW token for every successful claim: whoever held an older one can no longer act
      return b.syncClaim;
    });
  }
  async renewSync(bookingId: string, claim: string, nowIso: string, lockSeconds: number) {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.id === bookingId) as Locked | undefined;
      if (!b || b.syncClaim !== claim) return false;
      b.syncLockedUntil = new Date(Date.parse(nowIso) + lockSeconds * 1000).toISOString();
      return true;
    });
  }
  async finishSync(bookingId: string, state: SyncState, guard?: { version: number; nowIso: string }, claim?: string) {
    return this.mutate((d): "applied" | "superseded" | "missing" | "lost" => {
      const b = d.bookings.find((x) => x.id === bookingId) as (Booking & Locked) | undefined;
      if (!b) return "missing";
      if (claim !== undefined && b.syncClaim !== claim) return "lost";   // replaced: nothing changes, the newer worker's lease stays
      const release = () => { if (claim !== undefined) { delete b.syncLockedUntil; delete b.syncClaim; } };
      release();
      if (guard && (b.version ?? 1) !== guard.version) { b.sync = { status: "pending", attempts: 0, nextAttemptAt: guard.nowIso, lastError: null }; return "superseded"; }
      b.sync = state;
      return "applied";
    });
  }

  async recordSweep(nowIso: string, summary: SweepSummary) { await this.mutate((d) => { d.lastSweep = { at: nowIso, summary }; }); }
  async getLastSweep() { return (await this.read()).lastSweep ?? null; }
  async getAlertState() { return (await this.read()).alertState ?? { signature: "", sentAt: null }; }
  async setAlertState(signature: string, sentAtIso: string) { await this.mutate((d) => { d.alertState = { signature, sentAt: sentAtIso }; }); }

  async beginWebhook(provider: string, key: string, nowIso: string, leaseSeconds: number) {
    return this.mutate((d): { state: WebhookClaim; token: string | null } => {
      const inbox = (d.webhookSeen ??= {});
      const now = Date.parse(nowIso);
      for (const [k, e] of Object.entries(inbox)) if (now - Date.parse(e.seenAt) > (e.status === "processed" ? 2 : 7) * 86_400_000) delete inbox[k];
      const id = `${provider}|${key}`;
      const e = inbox[id];
      if (!e) { const token = newId(); inbox[id] = { status: "processing", seenAt: nowIso, claimedAt: nowIso, attempts: 1, token }; return { state: "new", token }; }
      if (e.status === "processed") return { state: "duplicate", token: null };
      if (e.status === "failed" || !e.claimedAt || Date.parse(e.claimedAt) <= now - leaseSeconds * 1000) { const token = newId(); e.status = "processing"; e.claimedAt = nowIso; e.attempts += 1; e.token = token; return { state: "retry", token }; }
      return { state: "busy", token: null };
    });
  }
  async finishWebhook(provider: string, key: string, token: string, ok: boolean, error: string | null, nowIso: string) {
    return this.mutate((d): "applied" | "stale" => {
      const e = d.webhookSeen?.[`${provider}|${key}`];
      if (!e || e.status !== "processing" || e.token !== token) return "stale";   // replaced, or already finished: nothing changes
      e.status = ok ? "processed" : "failed"; e.lastError = ok ? null : (error ?? "").slice(0, 300); e.token = null;
      if (ok) e.processedAt = nowIso;
      return "applied";
    });
  }

  async activateOwnerNotifications(nowIso: string) {
    return this.mutate((d) => { d.settings.ownerNotifySince ??= nowIso; return d.settings.ownerNotifySince; });
  }
  async listDueSync(nowIso: string, limit: number) {
    const now = Date.parse(nowIso);
    return (await this.read()).bookings
      .filter((b) => { const until = (b as Booking & Locked).syncLockedUntil; return !until || Date.parse(until) <= now; })
      .filter((b) => b.sync && b.sync.status !== "ok" && b.sync.status !== "failed" && (!b.sync.nextAttemptAt || Date.parse(b.sync.nextAttemptAt) <= now))
      .sort((a, b) => Date.parse(a.sync!.nextAttemptAt ?? a.createdAt) - Date.parse(b.sync!.nextAttemptAt ?? b.createdAt)).slice(0, limit).map((b) => b.id);
  }
}
