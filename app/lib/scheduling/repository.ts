import type { ActivityEntry, Availability, Booking, BookingEvent, CommunityState, ConsentRecord, EmailAttempt, ExternalRef, MeetingType, OutboxMessage, SchedulingData, Settings, SyncState, SweepSummary } from "./types";

/**
 * Persistence boundary for MBA Scheduling. Two implementations satisfy the SAME contract (contract.test.ts runs it against both):
 *   - DocumentRepository  : the local prototype (JSON file or memory)
 *   - SupabaseRepository  : production (Postgres: exclusion constraint, unique keys, RLS)
 * Every method that changes bookings is atomic, and the rules that protect against double booking live INSIDE it, not in the caller:
 * no overlap (buffers included) across all meeting types, a per-day cap, and idempotent creation.
 */
export type RepoErrorCode = "slot_unavailable" | "day_full" | "idempotency_conflict" | "not_found" | "conflict" | "slug_taken" | "condemned";

export class RepositoryError extends Error {
  constructor(public code: RepoErrorCode, message?: string) { super(message ?? code); this.name = "RepositoryError"; }
}
/** By name and shape, not instanceof: the singleton is shared across Next route bundles that each carry their own copy of this module. */
export const isRepositoryError = (e: unknown): e is RepositoryError => e instanceof Error && e.name === "RepositoryError" && typeof (e as RepositoryError).code === "string";

export type NewBooking = {
  reference: string; meetingTypeId: string; startUtc: string; endUtc: string;
  /** Snapshot of the meeting type's buffers at booking time. */
  bufferBeforeMinutes: number; bufferAfterMinutes: number;
  guestName: string; guestEmail: string; guestMessage: string; guestTimeZone: string; source: string | null;
  idempotencyKey: string; requestHash: string;
  /** The administrator's home-zone calendar day containing the booking, as UTC instants, and the type's cap (null = none). */
  dayStartUtc: string; dayEndUtc: string; maxPerDay: number | null;
  createdAt: string; demo?: boolean;
};
export type MoveBooking = { startUtc: string; endUtc: string; dayStartUtc: string; dayEndUtc: string; maxPerDay: number | null; at: string };

export type CommunityEvidence = { email: string; wordingVersion: string; wording: string; at: string; /** Where the answer was given, for example "booking_confirmation". */ source: string };

export type WebhookClaim = "new" | "retry" | "duplicate" | "busy";

export interface SchedulingRepository {
  /** Everything the admin screens show. */
  snapshot(): Promise<SchedulingData>;

  // ---- configuration
  getSettings(): Promise<Settings>;
  saveSettings(patch: { homeTimeZone?: string; simulate?: Partial<Settings["simulate"]> }): Promise<Settings>;
  listMeetingTypes(): Promise<MeetingType[]>;
  /** Throws slug_taken when another meeting type has the slug. */
  saveMeetingType(type: MeetingType, isNew: boolean): Promise<MeetingType>;
  saveAvailability(typeId: string, availability: Availability): Promise<Availability>;

  // ---- bookings
  listBookings(): Promise<Booking[]>;
  /** Confirmed bookings overlapping [from, to] plus `marginMs` either side (buffers reach outside the booking). */
  listConfirmedBookings(fromIso: string, toIso: string, marginMs: number): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | null>;
  getBookingByReference(reference: string): Promise<Booking | null>;
  findByIdempotencyKey(key: string): Promise<Booking | null>;
  /** Atomic. Replays return the original with replay=true; throws slot_unavailable, day_full or idempotency_conflict. */
  createBooking(input: NewBooking): Promise<{ booking: Booking; replay: boolean }>;
  /** Atomic and idempotent (an already-canceled booking returns changed=false). */
  cancelBooking(id: string, at: string, actor: string): Promise<{ booking: Booking; changed: boolean }>;
  /** Atomic. The booking's own old time never blocks its new one. Throws slot_unavailable, day_full, conflict (canceled) or not_found. */
  rescheduleBooking(id: string, move: MoveBooking, actor: string): Promise<Booking>;
  addBookingEvent(id: string, event: BookingEvent): Promise<void>;
  setCommunity(reference: string, state: CommunityState, evidence?: CommunityEvidence): Promise<CommunityState>;

  // ---- activity and (prototype) simulated outbox / consents
  addActivity(entry: ActivityEntry): Promise<void>;
  addOutbox?(message: OutboxMessage): Promise<void>;
  addConsent?(record: ConsentRecord): Promise<void>;

  // ---- external systems
  listRefs(bookingId: string): Promise<ExternalRef[]>;
  /** The booking an external Google event or Zoom meeting belongs to (for webhooks). */
  findBookingIdByExternalRef(provider: ExternalRef["provider"], externalId: string): Promise<string | null>;
  /**
   * Writes the booking's reference to one external object. With `claim` (a worker's ownership token) the write happens only if that worker
   * still owns the booking, checked in the same transaction as the write: a replaced worker gets "lost" and nothing changes.
   */
  upsertRef(ref: ExternalRef, claim?: string): Promise<"applied" | "lost">;
  /**
   * THE ZOOM OWNERSHIP RULE. A meeting may be deleted only after it has been condemned here, and condemning is refused ("owned") while the meeting is the
   * authoritative (recorded, synced) meeting of a confirmed booking, or of another booking. Condemning and recording share one lock, so they cannot
   * interleave: a meeting recorded first cannot be condemned, and a meeting condemned first can never be recorded afterwards (upsertRef then throws
   * RepositoryError "condemned"). Idempotent: condemning an already condemned meeting returns "condemned" again.
   */
  condemnZoomMeeting(bookingId: string, externalId: string, reason: string): Promise<"condemned" | "owned" | "missing">;
  /** The condemned meeting is gone from Zoom. */
  markZoomCondemnedDeleted(externalId: string): Promise<void>;
  /** Condemned meetings, for one booking or (without an id) for all: `pending` ones still have to be deleted in Zoom (a cleanup may have died after condemning). */
  listZoomTombstones(bookingId?: string): Promise<Array<{ bookingId: string; externalId: string; status: "pending" | "deleted" }>>;
  /** A replaced worker finished an external call anyway: mark every recorded reference as needing re-verification and queue an idle booking. Never fenced; it only ever adds checking. */
  invalidateRefs(bookingId: string, nowIso: string): Promise<void>;
  listEmailAttempts(bookingId: string): Promise<EmailAttempt[]>;
  /** Idempotent: a second ACCEPTED attempt of the same kind and version is refused (recorded=false). Resends are exempt. */
  recordEmailAttempt(attempt: EmailAttempt): Promise<{ recorded: boolean }>;
  /** Delivery status from the provider's signed webhook. */
  setEmailDelivery(providerMessageId: string, status: "delivered" | "bounced" | "failed", at: string): Promise<boolean>;

  // ---- prototype-only conveniences (the Supabase repository does not implement `reset`)
  reset?(data: SchedulingData): Promise<void>;
  replayDemoCommunity?(reference: string): Promise<void>;

  // ---- synchronisation queue (state lives on the booking)
  /** Takes the booking's sync lease unless another worker holds an unexpired one. Returns a NEW ownership token (the fencing token), or null. */
  claimSync(bookingId: string, nowIso: string, lockSeconds: number): Promise<string | null>;
  /** Extends the lease for the current token holder. False: the worker was replaced and must stop. */
  renewSync(bookingId: string, claim: string, nowIso: string, lockSeconds: number): Promise<boolean>;
  /**
   * Records the outcome. With `claim`, NOTHING happens unless the caller still owns the booking ("lost"), and the lease is released.
   * Without `claim` (administrator retry, reconciliation) the status is set and another worker's lease is left alone.
   * With `guard`, the outcome is recorded only if the booking is still at `guard.version`; if a cancel or reschedule landed meanwhile, the booking is
   * put back in the queue as due at `guard.nowIso` and "superseded" is returned, so the caller runs another pass instead of marking stale work as done.
   */
  finishSync(bookingId: string, state: SyncState, guard?: { version: number; nowIso: string }, claim?: string): Promise<"applied" | "superseded" | "missing" | "lost">;
  listDueSync(nowIso: string, limit: number): Promise<string[]>;

  // ---- recovery worker pulse
  /** Records that a sweep just finished (and what it did). */
  recordSweep(nowIso: string, summary: SweepSummary): Promise<void>;
  getLastSweep(): Promise<{ at: string; summary: SweepSummary } | null>;

  // ---- inbound webhook inbox
  /**
   * Claims a verified delivery. "new" and "retry": the caller must process it and then finish it WITH the returned token. "duplicate": already processed
   * (terminal), do nothing. "busy": another caller holds an unexpired claim. A delivery that FAILED, or whose claim expired (a crash), is claimable
   * again, so a provider's legitimate retry is not discarded; every claim gets a NEW token. Processed entries are forgotten after two days.
   */
  beginWebhook(provider: string, key: string, nowIso: string, leaseSeconds: number): Promise<{ state: WebhookClaim; token: string | null }>;
  /**
   * Completes a claim. Only the holder of the CURRENT token, while the delivery is still being processed, changes anything ("applied"). A replaced
   * worker's late success or failure is "stale" and changes nothing, so a processed delivery can never be reopened.
   */
  finishWebhook(provider: string, key: string, token: string, ok: boolean, error: string | null, nowIso: string): Promise<"applied" | "stale">;

  // ---- owner notifications
  /** Records, once and durably, the moment owner notifications were first switched on, and returns it (the same value every time). Only transitions at or after it may produce an owner message. */
  activateOwnerNotifications(nowIso: string): Promise<string>;
}
