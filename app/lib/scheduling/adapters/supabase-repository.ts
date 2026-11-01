/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import type { getServiceClient } from "@/app/lib/supabase/service";
import type { ActivityEntry, Availability, Booking, BookingEvent, CommunityState, ConsentRecord, EmailAttempt, ExternalRef, MeetingType, OutboxMessage, SchedulingData, Settings, SyncState, SweepSummary } from "../types";
import { RepositoryError, type CommunityEvidence, type MoveBooking, type NewBooking, type SchedulingRepository, type WebhookClaim } from "../repository";

/**
 * The production repository, over Postgres (see supabase/migrations/20261101090000_mba_scheduling.sql).
 * It contains NO scheduling rules of its own: double-booking protection, buffers across meeting types, the daily cap and idempotency
 * are enforced by the database (exclusion constraint, unique keys, advisory-locked functions), and this class only translates.
 * Server-only: it takes a service-role client, which bypasses RLS, so it must never be reachable from the browser.
 */
type Db = ReturnType<typeof getServiceClient>;

const iso = (v: string | null | undefined) => (v ? new Date(v).toISOString() : null);
const ERR_CODES: Record<string, ConstructorParameters<typeof RepositoryError>[0]> = { SC001: "slot_unavailable", SC002: "day_full", SC003: "idempotency_conflict", SC004: "not_found", SC005: "conflict", SC006: "condemned" };

function fail(error: { code?: string; message: string; details?: string | null }): never {
  const mapped = error.code ? ERR_CODES[error.code] : undefined;
  if (mapped) throw new RepositoryError(mapped);
  throw new Error(`Scheduling database error${error.code ? ` (${error.code})` : ""}: ${error.message}`);
}
function must<T>(res: { data: T | null; error: any }): T {
  if (res.error) fail(res.error);
  return res.data as T;
}

const BOOKING_SELECT = "*, attendee:sched_attendees(*), events:sched_booking_events(*), refs:sched_external_refs(*)";
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

function zoomProjection(refs: any[] | null | undefined): Booking["zoom"] {
  const z = (refs ?? []).find((r) => r.provider === "zoom");
  if (z?.status === "synced" && z.url) return { status: "ready", meetingId: z.external_id, joinUrl: z.url };
  return { status: z?.status === "failed" ? "failed" : "pending", meetingId: null, joinUrl: null, ...(z && !z.external_id && z.create_intent_at ? { uncertainSince: new Date(z.create_intent_at).toISOString() } : {}) };
}

function toBooking(r: any): Booking {
  const a = one<any>(r.attendee);
  return {
    id: r.id, reference: r.reference, meetingTypeId: r.meeting_type_id, startUtc: iso(r.start_at)!, endUtc: iso(r.end_at)!,
    guestName: a?.name ?? "", guestEmail: a?.email ?? "", guestMessage: a?.message ?? "", guestTimeZone: a?.time_zone ?? "UTC",
    status: r.status, source: r.source, zoom: zoomProjection(r.refs), community: { state: r.community_state, at: iso(r.community_at) ?? undefined },
    idempotencyKey: r.idempotency_key, requestHash: r.request_hash ?? undefined, createdAt: iso(r.created_at)!, version: r.version,
    bufferBeforeMinutes: r.buffer_before_minutes, bufferAfterMinutes: r.buffer_after_minutes,
    sync: { status: r.sync_status, attempts: r.sync_attempts, nextAttemptAt: iso(r.sync_next_attempt_at), lastError: r.sync_last_error },
    events: ((r.events ?? []) as any[]).sort((x, y) => x.id - y.id).map((e) => ({ at: iso(e.created_at)!, kind: e.kind, detail: e.detail })),
    ...(r.demo ? { demo: true } : {}),
  };
}

const toType = (r: any): MeetingType => ({
  id: r.id, slug: r.slug, name: r.name, description: r.description, durationMinutes: r.duration_minutes, format: "zoom", priceLabel: r.price_label ?? undefined,
  visibility: r.visibility, inviteCode: r.invite_code ?? undefined, availability: r.availability as Availability, minNoticeHours: r.min_notice_hours,
  bufferBeforeMinutes: r.buffer_before_minutes, bufferAfterMinutes: r.buffer_after_minutes, maxPerDay: r.max_per_day, slotIntervalMinutes: r.slot_interval_minutes, active: r.active,
});
const fromType = (t: MeetingType) => ({
  slug: t.slug, name: t.name, description: t.description, duration_minutes: t.durationMinutes, format: "zoom", price_label: t.priceLabel ?? null, visibility: t.visibility,
  invite_code: t.visibility === "invitation" ? t.inviteCode ?? null : null, availability: t.availability, min_notice_hours: t.minNoticeHours,
  buffer_before_minutes: t.bufferBeforeMinutes, buffer_after_minutes: t.bufferAfterMinutes, max_per_day: t.maxPerDay, slot_interval_minutes: t.slotIntervalMinutes, active: t.active,
});
const toSettings = (r: any): Settings => ({ homeTimeZone: r.home_time_zone, simulate: { googleOutage: !!r.simulate_google_outage, zoomFailure: !!r.simulate_zoom_failure } });
const toRef = (r: any): ExternalRef => ({ bookingId: r.booking_id, provider: r.provider, externalId: r.external_id, url: r.url, status: r.status, syncedVersion: r.synced_version, etag: r.etag, contentKey: r.content_key, attempts: r.attempts, lastError: r.last_error, updatedAt: iso(r.updated_at)!, createIntentAt: iso(r.create_intent_at), createUnknown: r.create_unknown ?? 0 });
const toAttempt = (r: any): EmailAttempt => ({ id: r.id, bookingId: r.booking_id, kind: r.kind, version: r.version, to: r.to_email, status: r.status, providerMessageId: r.provider_message_id, error: r.error, includedZoom: r.included_zoom, idempotencyKey: r.idempotency_key, deliveryStatus: r.delivery_status, attemptedAt: iso(r.attempted_at)! });

const TRANSIENT = new Set(["40P01", "40001"]); // deadlock / serialization: safe to retry the whole atomic function

export class SupabaseRepository implements SchedulingRepository {
  constructor(private db: Db) {}

  private async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const res = await this.db.rpc(name, args);
      if (res.error && TRANSIENT.has(res.error.code ?? "") && attempt < 3) { await new Promise((r) => setTimeout(r, 25 * (attempt + 1))); continue; }
      return must<T>(res as any);
    }
  }

  async snapshot(): Promise<SchedulingData> {
    const [settings, meetingTypes, bookings, activity, attempts, consents] = await Promise.all([
      this.getSettings(), this.listMeetingTypes(), this.listBookings(),
      this.db.from("sched_activity").select("*").order("created_at", { ascending: false }).limit(200).then((r) => must<any[]>(r as any)),
      this.db.from("sched_email_attempts").select("*").order("attempted_at", { ascending: false }).limit(60).then((r) => must<any[]>(r as any)),
      this.db.from("sched_community_consents").select("*").order("created_at", { ascending: false }).limit(100).then((r) => must<any[]>(r as any)),
    ]);
    const outbox: OutboxMessage[] = attempts.map((a) => ({ id: a.id, at: iso(a.attempted_at)!, kind: a.kind, bookingId: a.booking_id, to: a.to_email, subject: `${a.kind.replace(/_/g, " ")}: ${a.status}${a.delivery_status ? `, ${a.delivery_status}` : ""}`, body: a.error ?? `Provider message ${a.provider_message_id ?? "n/a"}`, simulated: false }));
    const consentRecords: ConsentRecord[] = consents.map((c) => ({ id: c.id, at: iso(c.created_at)!, bookingId: c.booking_id, email: c.email, choice: c.choice, wordingVersion: c.wording_version, wording: c.wording, source: c.source ?? "booking_confirmation", simulated: false }));
    return {
      version: 1, settings, meetingTypes, bookings,
      activity: activity.map((a) => ({ id: a.id, at: iso(a.created_at)!, kind: a.kind, summary: a.summary, bookingId: a.booking_id ?? undefined })),
      outbox, consents: consentRecords, idempotency: {},
    };
  }

  async getSettings() { return toSettings(must<any>((await this.db.from("sched_settings").select("*").eq("id", true).single()) as any)); }
  async saveSettings(patch: { homeTimeZone?: string; simulate?: Partial<Settings["simulate"]> }) {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.homeTimeZone !== undefined) row.home_time_zone = patch.homeTimeZone;
    if (patch.simulate?.googleOutage !== undefined) row.simulate_google_outage = patch.simulate.googleOutage;
    if (patch.simulate?.zoomFailure !== undefined) row.simulate_zoom_failure = patch.simulate.zoomFailure;
    return toSettings(must<any>((await this.db.from("sched_settings").update(row).eq("id", true).select().single()) as any));
  }

  async listMeetingTypes() { return must<any[]>((await this.db.from("sched_meeting_types").select("*").order("created_at")) as any).map(toType); }
  async saveMeetingType(type: MeetingType, isNew: boolean) {
    const res = isNew
      ? await this.db.from("sched_meeting_types").insert(fromType(type)).select().single()
      : await this.db.from("sched_meeting_types").update(fromType(type)).eq("id", type.id).select().maybeSingle();
    if (res.error) { if (res.error.code === "23505") throw new RepositoryError("slug_taken"); fail(res.error); }
    if (!res.data) throw new RepositoryError("not_found");
    return toType(res.data);
  }
  async saveAvailability(typeId: string, availability: Availability) {
    const r = await this.db.from("sched_meeting_types").update({ availability }).eq("id", typeId).select("availability").maybeSingle();
    if (r.error) fail(r.error);
    if (!r.data) throw new RepositoryError("not_found");
    return r.data.availability as Availability;
  }

  async listBookings() { return must<any[]>((await this.db.from("sched_bookings").select(BOOKING_SELECT).order("start_at")) as any).map(toBooking); }
  async listConfirmedBookings(fromIso: string, toIso: string, marginMs: number) {
    const lo = new Date(Date.parse(fromIso) - marginMs).toISOString(), hi = new Date(Date.parse(toIso) + marginMs).toISOString();
    return must<any[]>((await this.db.from("sched_bookings").select("*").eq("status", "confirmed").lt("start_at", hi).gt("end_at", lo)) as any).map(toBooking);
  }
  async getBooking(id: string) {
    const r = await this.db.from("sched_bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle();
    if (r.error) { if (r.error.code === "22P02") return null; fail(r.error); } // not a uuid
    return r.data ? toBooking(r.data) : null;
  }
  async getBookingByReference(reference: string) { return this.byColumn("reference", reference); }
  async findByIdempotencyKey(key: string) { return this.byColumn("idempotency_key", key); }
  private async byColumn(col: string, value: string) {
    const r = await this.db.from("sched_bookings").select(BOOKING_SELECT).eq(col, value).maybeSingle();
    if (r.error) fail(r.error);
    return r.data ? toBooking(r.data) : null;
  }

  async createBooking(nb: NewBooking) {
    const out = await this.rpc<{ id: string; replay: boolean }>("sched_create_booking", {
      p: {
        reference: nb.reference, meeting_type_id: nb.meetingTypeId, start_at: nb.startUtc, end_at: nb.endUtc,
        buffer_before_minutes: nb.bufferBeforeMinutes, buffer_after_minutes: nb.bufferAfterMinutes,
        guest_name: nb.guestName, guest_email: nb.guestEmail, guest_message: nb.guestMessage, guest_time_zone: nb.guestTimeZone, source: nb.source ?? "",
        idempotency_key: nb.idempotencyKey, request_hash: nb.requestHash, day_start: nb.dayStartUtc, day_end: nb.dayEndUtc, max_per_day: nb.maxPerDay, demo: !!nb.demo, created_at: nb.createdAt,
      },
    });
    return { booking: (await this.getBooking(out.id))!, replay: out.replay };
  }
  async cancelBooking(id: string, at: string, actor: string) {
    const out = await this.rpc<{ changed: boolean }>("sched_cancel_booking", { p_id: id, p: { at, actor } });
    return { booking: (await this.getBooking(id))!, changed: out.changed };
  }
  async rescheduleBooking(id: string, move: MoveBooking, actor: string) {
    await this.rpc("sched_reschedule_booking", { p_id: id, p: { start_at: move.startUtc, end_at: move.endUtc, day_start: move.dayStartUtc, day_end: move.dayEndUtc, max_per_day: move.maxPerDay, at: move.at, actor } });
    return (await this.getBooking(id))!;
  }
  async addBookingEvent(id: string, event: BookingEvent) {
    must((await this.db.from("sched_booking_events").insert({ booking_id: id, kind: event.kind, detail: event.detail, created_at: event.at })) as any);
  }
  async setCommunity(reference: string, state: CommunityState, evidence?: CommunityEvidence) {
    return this.rpc<CommunityState>("sched_set_community", { p_reference: reference, p_state: state, p: { at: evidence?.at ?? new Date().toISOString(), wording_version: evidence?.wordingVersion ?? "", wording: evidence?.wording ?? "", email: evidence?.email ?? "", source: evidence?.source ?? "booking_confirmation" } });
  }

  async addActivity(entry: ActivityEntry) {
    must((await this.db.from("sched_activity").insert({ kind: entry.kind, summary: entry.summary, booking_id: entry.bookingId ?? null, created_at: entry.at })) as any);
  }
  async replayDemoCommunity(reference: string) { must((await this.db.from("sched_bookings").update({ community_state: "unseen" }).eq("reference", reference).eq("demo", true)) as any); }

  async listRefs(bookingId: string) { return must<any[]>((await this.db.from("sched_external_refs").select("*").eq("booking_id", bookingId)) as any).map(toRef); }
  async findBookingIdByExternalRef(provider: ExternalRef["provider"], externalId: string) {
    const r = await this.db.from("sched_external_refs").select("booking_id").eq("provider", provider).eq("external_id", externalId).maybeSingle();
    if (r.error) fail(r.error);
    return r.data?.booking_id ?? null;
  }
  async upsertRef(ref: ExternalRef, claim?: string): Promise<"applied" | "lost"> {
    if (claim !== undefined) {
      // Fenced: ownership is checked and the row written in ONE transaction inside the database.
      const r = await this.db.rpc("sched_upsert_ref_fenced", { p_id: ref.bookingId, p_claim: claim, p: {
        provider: ref.provider, external_id: ref.externalId, url: ref.url, status: ref.status, synced_version: ref.syncedVersion, content_key: ref.contentKey ?? null, etag: ref.etag ?? null,
        attempts: ref.attempts, last_error: ref.lastError, updated_at: ref.updatedAt, create_intent_at: ref.createIntentAt ?? null, create_unknown: ref.createUnknown ?? 0,
      } });
      if (r.error) fail(r.error);
      return r.data === "applied" ? "applied" : "lost";
    }
    const r = await this.db.from("sched_external_refs").upsert({
      booking_id: ref.bookingId, provider: ref.provider, external_id: ref.externalId, url: ref.url, status: ref.status, synced_version: ref.syncedVersion,
      content_key: ref.contentKey ?? null, etag: ref.etag ?? null, attempts: ref.attempts, last_error: ref.lastError, updated_at: ref.updatedAt,
      create_intent_at: ref.createIntentAt ?? null, create_unknown: ref.createUnknown ?? 0,
    }, { onConflict: "booking_id,provider" });
    if (r.error) { if (r.error.code === "23505") throw new RepositoryError("conflict", "That external id already belongs to another booking."); fail(r.error); }
    return "applied";
  }
  async condemnZoomMeeting(bookingId: string, externalId: string, reason: string) {
    const r = await this.db.rpc("sched_zoom_condemn", { p_booking: bookingId, p_external: externalId, p_reason: reason });
    if (r.error) { if (r.error.code === "22P02") return "missing" as const; fail(r.error); }
    return r.data as "condemned" | "owned" | "missing";
  }
  async markZoomCondemnedDeleted(externalId: string) { must((await this.db.rpc("sched_zoom_condemn_done", { p_external: externalId })) as any); }
  async listZoomTombstones(bookingId?: string) {
    let q = this.db.from("sched_zoom_tombstones").select("booking_id, external_id, status");
    if (bookingId) q = q.eq("booking_id", bookingId);
    return must<any[]>((await q) as any).map((t) => ({ bookingId: t.booking_id as string, externalId: t.external_id as string, status: t.status as "pending" | "deleted" }));
  }
  async invalidateRefs(bookingId: string, nowIso: string) {
    const r = await this.db.rpc("sched_invalidate_refs", { p_id: bookingId, p_now: nowIso });
    if (r.error) fail(r.error);
  }
  async listEmailAttempts(bookingId: string) { return must<any[]>((await this.db.from("sched_email_attempts").select("*").eq("booking_id", bookingId).order("attempted_at")) as any).map(toAttempt); }
  async recordEmailAttempt(a: EmailAttempt) {
    const r = await this.db.from("sched_email_attempts").insert({
      booking_id: a.bookingId, kind: a.kind, version: a.version, to_email: a.to, status: a.status, provider_message_id: a.providerMessageId, error: a.error,
      included_zoom: a.includedZoom, idempotency_key: a.idempotencyKey, attempted_at: a.attemptedAt,
    });
    if (r.error) { if (r.error.code === "23505") return { recorded: false }; fail(r.error); }
    return { recorded: true };
  }
  async setEmailDelivery(providerMessageId: string, status: "delivered" | "bounced" | "failed", at: string) {
    const found = await this.db.from("sched_email_attempts").select("id, delivery_status").eq("provider_message_id", providerMessageId).limit(1);
    const row = must<any[]>(found as any)[0];
    if (!row) return false;
    if (row.delivery_status === "bounced") return true; // a late "delivered" never overwrites a bounce
    must((await this.db.from("sched_email_attempts").update({ delivery_status: status, delivery_updated_at: at }).eq("id", row.id)) as any);
    return true;
  }

  async claimSync(bookingId: string, nowIso: string, lockSeconds: number): Promise<string | null> {
    const r = await this.db.rpc("sched_claim_sync", { p_id: bookingId, p_now: nowIso, p_lock_seconds: lockSeconds });
    if (r.error) { if (r.error.code === "22P02") return null; fail(r.error); }
    return typeof r.data === "string" ? r.data : null;
  }
  async renewSync(bookingId: string, claim: string, nowIso: string, lockSeconds: number) {
    const r = await this.db.rpc("sched_renew_sync", { p_id: bookingId, p_claim: claim, p_now: nowIso, p_lock_seconds: lockSeconds });
    if (r.error) { if (r.error.code === "22P02") return false; fail(r.error); }
    return r.data === true;
  }
  async finishSync(bookingId: string, state: SyncState, guard?: { version: number; nowIso: string }, claim?: string) {
    const r = await this.db.rpc("sched_finish_sync", { p_id: bookingId, p_claim: claim ?? null, p_status: state.status, p_attempts: state.attempts, p_next: state.nextAttemptAt, p_error: state.lastError, p_version: guard?.version ?? null, p_now: guard?.nowIso ?? new Date().toISOString() });
    if (r.error) { if (r.error.code === "22P02") return "missing" as const; fail(r.error); }
    return r.data as "applied" | "superseded" | "missing" | "lost";
  }
  async recordSweep(nowIso: string, summary: SweepSummary) {
    must((await this.db.from("sched_worker_heartbeat").upsert({ id: true, last_run_at: nowIso, last_summary: summary, updated_at: nowIso }, { onConflict: "id" })) as any);
  }
  async getLastSweep() {
    const r = must<any>((await this.db.from("sched_worker_heartbeat").select("last_run_at, last_summary").eq("id", true).maybeSingle()) as any);
    return r ? { at: iso(r.last_run_at)!, summary: r.last_summary as SweepSummary } : null;
  }
  async getAlertState() {
    const r = must<any>((await this.db.from("sched_alert_state").select("signature, sent_at").eq("id", true).maybeSingle()) as any);
    return { signature: (r?.signature as string | undefined) ?? "", sentAt: r ? iso(r.sent_at) : null };
  }
  async setAlertState(signature: string, sentAtIso: string) {
    must((await this.db.from("sched_alert_state").upsert({ id: true, signature, sent_at: sentAtIso, updated_at: sentAtIso }, { onConflict: "id" })) as any);
  }
  async beginWebhook(provider: string, key: string, nowIso: string, leaseSeconds: number) {
    return must<{ state: WebhookClaim; token: string | null }>((await this.db.rpc("sched_webhook_begin", { p_provider: provider, p_key: key, p_now: nowIso, p_lease_seconds: leaseSeconds })) as any);
  }
  async finishWebhook(provider: string, key: string, token: string, ok: boolean, error: string | null, nowIso: string) {
    return must<"applied" | "stale">((await this.db.rpc("sched_webhook_finish", { p_provider: provider, p_key: key, p_token: token, p_ok: ok, p_error: error, p_now: nowIso })) as any);
  }
  async activateOwnerNotifications(nowIso: string) {
    return iso(must<string>((await this.db.rpc("sched_activate_owner_notifications", { p_now: nowIso })) as any))!;
  }
  async listDueSync(nowIso: string, limit: number) { return must<string[]>((await this.db.rpc("sched_list_due_sync", { p_now: nowIso, p_limit: limit })) as any) ?? []; }
}
