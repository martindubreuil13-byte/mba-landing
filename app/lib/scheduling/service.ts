import { createHash } from "node:crypto";
import { isRefShaped } from "@/app/lib/inquiries/refs";
import { z } from "zod";
import type { ActivityKind, Availability, Booking, BusyInterval, CommunityState, MeetingType, SchedulingData, Settings, Slot, SweepSummary } from "./types";
import { computeSlots, validateAvailability } from "./availability";
import { COMMUNITY_SOURCE, COMMUNITY_WORDING, SCHEDULING_COMMUNITY_VERSION, type CommunityConsentPort, type CommunityConsentResult, type CommunityVisitor } from "./community";
import { BUFFER_OPTIONS, DEFAULT_BUFFER_AFTER, DEFAULT_BUFFER_BEFORE, isBufferOption } from "./constants";
import { DocumentRepository } from "./document-repository";
import { composeEmail } from "./notifications";
import { CalendarUnavailableError, createSimulatedEmail, type CalendarProvider, type EmailProvider, type ZoomProvider } from "./providers";
import { isRepositoryError, type SchedulingRepository } from "./repository";
import { buildSeedData, newId, newToken } from "./seed";
import type { SchedulingStore } from "./store";
import { isApprovedOwnerAddress } from "./owner-address";
import { runAlertCheck } from "./alerts";
import type { Admission } from "./rate-limit";
import { BookingSync, MAX_ATTEMPTS, ZOOM_SCAN_EVERY_MS, zoomMarkerFor, type SyncResult } from "./sync";
import { addDays, isValidTimeZone, localDate, localToInstant } from "./timezone";

/**
 * The scheduling rules.
 *
 * Division of labour (this is the production design, and the prototype follows it):
 *   - Rules and records: the REPOSITORY (Supabase in production). It is written first, atomically, and is what prevents a double booking:
 *     overlap including buffers across ALL meeting types, the daily cap, idempotency.
 *   - External availability: Google Calendar (free/busy), read live. Our own events are subtracted so a booking never blocks itself.
 *   - Everything that follows a booking (Zoom meeting, Google event, email) is done by BookingSync, idempotently and retryably.
 * Provider failures: calendar down -> refuse the booking (we cannot prove the time is free); Zoom/Google-write/email down -> keep the booking, retry.
 *
 * Timing: a request returns as soon as the database write is committed. The synchronisation is started through `defer` (Next's `after()` in
 * production), so the guest never waits for Zoom, Google or email; the confirmation page shows an honest "preparing" state until the Zoom link
 * exists. If the deferred work never runs (the function is killed), the booking is still queued in the database and the sweep (runMaintenance) finishes it.
 */

export type ErrorCode = "not_found" | "invitation_required" | "invalid_input" | "slot_unavailable" | "calendar_unavailable" | "idempotency_conflict" | "conflict" | "email_failed" | "rate_limited";
export class SchedulingError extends Error {
  constructor(public code: ErrorCode, message: string, public status: number, public details?: Record<string, string>) { super(message); this.name = "SchedulingError"; }
}

/**
 * Matched by name and shape, NOT with instanceof. The service is a process-wide singleton shared by every route, and Next can
 * bundle each route with its own copy of the module, so an error thrown by the singleton is not an instance of this file's class.
 */
export function isSchedulingError(e: unknown): e is SchedulingError {
  return e instanceof Error && e.name === "SchedulingError" && typeof (e as SchedulingError).status === "number" && typeof (e as SchedulingError).code === "string";
}

const MS_MINUTE = 60_000;
const CONFLICT_SCAN_EVERY_MS = 15 * MS_MINUTE;
const HOUR = 3_600_000;
/** How long a webhook delivery stays claimed by the worker processing it before a retry may take it over (a crash). */
const WEBHOOK_LEASE_SECONDS = 120;

export type SchedulingDeps = {
  /** Either a repository (production: Supabase) or the prototype's document store. */
  repo?: SchedulingRepository; store?: SchedulingStore;
  calendar: CalendarProvider; zoom: ZoomProvider; email?: EmailProvider;
  now?: () => number; inviteGuestInCalendar?: boolean;
  /** Where the host's own notifications go (new booking, reschedule, cancellation). Absent: none are sent. */
  ownerEmail?: string | null; adminUrl?: string | null;
  /** Abuse budget for a new booking (production wiring only). Asked once per genuinely new request, never for a repeat of an earlier key. */
  bookingBudget?: (guestEmail: string) => Promise<Admission>;
  /** Finds the name and email of a known inquiry by its opaque reference (production wiring only), to prefill the booking form. */
  inquiryPrefill?: (ref: string) => Promise<BookingPrefill | null>;
  /** Which inquiry or application a booking reference belongs to (any age). Absent in the local prototype. */
  refOrigin?: (ref: string) => Promise<{ kind: "inquiry" | "application"; id: string } | null>;
  /** Records that a new booking came from an inquiry or application, given the signed context the booking page held. Never allowed to fail a booking. */
  bookingOrigin?: (bookingId: string, context: string) => Promise<void>;
  /** Where an explicit "yes" to the community invitation is recorded as consent (the site's Leads and consent records). Absent in the local prototype. */
  communityConsent?: CommunityConsentPort;
  /**
   * Runs background work after the response is sent (Next's `after`). Absent, or throwing because there is no request to attach to,
   * the work simply runs inline before the call returns: the behaviour of scripts, tests and the cron worker.
   */
  defer?: (task: () => Promise<unknown>) => void;
};

/** What a visitor may know about a meeting type. No invite code, availability rules, buffers or other types. */
export type PublicMeetingType = { slug: string; name: string; description: string; durationMinutes: number; format: "zoom"; priceLabel: string | null };
/** What the confirmation page needs. No email, message, id or other bookings. */
export type PublicBooking = {
  reference: string; meetingName: string; durationMinutes: number; startUtc: string; endUtc: string; guestFirstName: string; guestTimeZone: string;
  status: "confirmed" | "canceled"; zoom: { status: "simulated" | "ready" | "pending" | "failed"; joinUrl: string | null }; community: CommunityState; slug: string;
  /** The Zoom link is ready (or simulated); still being prepared for the first time; or taking longer than usual and being retried. */
  progress: "ready" | "preparing" | "delayed";
  /** Shown only when something here is simulated (never in production), so a real guest is never told "nothing was sent" and a developer never mistakes a simulation for a real send. */
  notice: string | null;
};

/** The only things the booking page may prefill from a known inquiry: the visitor's own name and email. */
export type BookingPrefill = { name: string; email: string };
export type BookingInput = { slug: string; invite?: string; startUtc: string; guestName: string; guestEmail: string; guestMessage?: string; guestTimeZone: string; idempotencyKey: string; source?: string | null; /** The signed note of where the visitor came from, if they came from an inquiry or application link. */ originContext?: string };

const bookingSchema = z.object({
  slug: z.string().min(1).max(80),
  invite: z.string().max(80).optional(),
  startUtc: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Choose a time."),
  guestName: z.string().trim().min(1, "Please enter your name.").max(120),
  guestEmail: z.string().trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),
  guestMessage: z.string().trim().max(1500).optional(),
  guestTimeZone: z.string().refine(isValidTimeZone, "Choose a valid time zone."),
  idempotencyKey: z.string().min(8).max(100),
  source: z.string().trim().max(60).nullish(),
  originContext: z.string().max(400).optional(),
});

export const RESERVED_SLUGS = ["confirmed", "admin", "api"];
const windowSchema = z.object({ start: z.string(), end: z.string() });
const buffer = z.number().refine(isBufferOption, `Choose ${BUFFER_OPTIONS.join(", ")} minutes.`).optional();
export const meetingTypeSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.").refine((s) => !RESERVED_SLUGS.includes(s), "That link name is reserved."),
  name: z.string().trim().min(2, "Give the meeting a name.").max(80),
  description: z.string().trim().max(600),
  durationMinutes: z.number().int().min(10).max(480),
  priceLabel: z.string().trim().max(40).optional(),
  visibility: z.enum(["public", "invitation"]),
  inviteCode: z.string().trim().max(60).optional(),
  minNoticeHours: z.number().int().min(0).max(24 * 30),
  bufferBeforeMinutes: buffer,
  bufferAfterMinutes: buffer,
  maxPerDay: z.number().int().min(1).max(50).nullable(),
  slotIntervalMinutes: z.number().int().min(5).max(240),
  active: z.boolean(),
  availability: z.object({ weekly: z.record(z.string(), z.array(windowSchema)), breaks: z.array(windowSchema), daysOff: z.array(z.string()), overrides: z.record(z.string(), z.array(windowSchema)), bookingWindowDays: z.number() }).optional(),
});
export type MeetingTypeInput = z.infer<typeof meetingTypeSchema>;

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Check the details and try again.";
const requestHash = (slug: string, startUtc: string, email: string) => createHash("sha256").update(JSON.stringify([slug, new Date(startUtc).toISOString(), email.toLowerCase()])).digest("hex");

export class SchedulingService {
  readonly repo: SchedulingRepository;
  readonly sync: BookingSync;
  private calendar: CalendarProvider;
  private zoom: ZoomProvider;
  private email: EmailProvider;
  private adminUrl: string | null;
  private bookingBudget: ((guestEmail: string) => Promise<Admission>) | null;
  private inquiryPrefill: ((ref: string) => Promise<BookingPrefill | null>) | null;
  private refOriginOf: SchedulingDeps["refOrigin"] | null;
  private linkOrigin: SchedulingDeps["bookingOrigin"] | null;
  private communityConsent: CommunityConsentPort | null;
  private clock: () => number;
  private defer?: (task: () => Promise<unknown>) => void;
  constructor(deps: SchedulingDeps) {
    if (!deps.repo && !deps.store) throw new Error("SchedulingService needs a repository or a store.");
    if (deps.ownerEmail && !isApprovedOwnerAddress(deps.ownerEmail)) throw new Error("Owner notifications can only go to the approved owner address.");
    this.repo = deps.repo ?? new DocumentRepository(deps.store!);
    this.calendar = deps.calendar;
    this.zoom = deps.zoom;
    this.email = deps.email ?? createSimulatedEmail();
    this.adminUrl = deps.adminUrl ?? null;
    this.bookingBudget = deps.bookingBudget ?? null;
    this.inquiryPrefill = deps.inquiryPrefill ?? null;
    this.refOriginOf = deps.refOrigin ?? null;
    this.linkOrigin = deps.bookingOrigin ?? null;
    this.communityConsent = deps.communityConsent ?? null;
    this.clock = deps.now ?? (() => Date.now());
    this.defer = deps.defer;
    this.sync = new BookingSync({ repo: this.repo, calendar: deps.calendar, zoom: deps.zoom, email: this.email, now: this.clock, inviteGuestInCalendar: deps.inviteGuestInCalendar, ownerEmail: deps.ownerEmail ?? null, adminUrl: deps.adminUrl ?? null });
  }

  now() { return this.clock(); }
  private iso() { return new Date(this.clock()).toISOString(); }
  private async log(kind: ActivityKind, summary: string, bookingId?: string) { await this.repo.addActivity({ id: newId(), at: this.iso(), kind, summary, bookingId }); }
  /** Starts the booking's synchronisation without making the caller wait for it (see SchedulingDeps.defer). Never throws. */
  private async kick(bookingId: string): Promise<void> {
    const task = () => this.sync.run(bookingId).then(() => undefined, () => undefined);
    if (this.defer) { try { this.defer(task); return; } catch { /* no request to attach to: run it now */ } }
    await task();
  }

  // ------------------------------------------------------------------------------------------------ reading

  readAll(): Promise<SchedulingData> { return this.repo.snapshot(); }

  async publicMeetingType(slug: string, invite?: string): Promise<{ ok: true; type: PublicMeetingType } | { ok: false; reason: "not_found" | "invitation_required" }> {
    const t = (await this.repo.listMeetingTypes()).find((m) => m.slug === slug && m.active);
    if (!t) return { ok: false, reason: "not_found" };
    if (t.visibility === "invitation" && (!invite || invite !== t.inviteCode)) return { ok: false, reason: "invitation_required" };
    return { ok: true, type: { slug: t.slug, name: t.name, description: t.description, durationMinutes: t.durationMinutes, format: t.format, priceLabel: t.priceLabel || null } };
  }

  /**
   * Busy intervals that block a slot: Google Calendar's external commitments plus every confirmed booking with its OWN buffers.
   * Google also reports the events WE created for those bookings; they are removed (exact match) so a booking never blocks itself
   * or its own reschedule, and so its buffers come from our records, not from a second copy in Google.
   */
  private async busyFor(types: MeetingType[], from: number, to: number, excludeBookingId?: string): Promise<{ busy: BusyInterval[]; confirmed: Booking[] }> {
    const pad = 24 * HOUR;
    const [google, confirmed] = await Promise.all([this.calendar.getBusy(from - pad, to + pad), this.repo.listConfirmedBookings(new Date(from - pad).toISOString(), new Date(to + pad).toISOString(), 3 * HOUR)]);
    const own = confirmed.map((b) => ({ s: Date.parse(b.startUtc), e: Date.parse(b.endUtc) }));
    const external = google.filter((g) => !own.some((o) => o.s === g.start && o.e === g.end));
    const mine = confirmed.filter((b) => b.id !== excludeBookingId).map((b) => {
      const t = types.find((m) => m.id === b.meetingTypeId);
      return { start: Date.parse(b.startUtc), end: Date.parse(b.endUtc), before: (b.bufferBeforeMinutes ?? t?.bufferBeforeMinutes ?? 0) * MS_MINUTE, after: (b.bufferAfterMinutes ?? t?.bufferAfterMinutes ?? 0) * MS_MINUTE, label: b.guestName } satisfies BusyInterval;
    });
    return { busy: [...external, ...mine], confirmed };
  }

  private async slotsFor(types: MeetingType[], homeTz: string, t: MeetingType, from: number, to: number, excludeBookingId?: string): Promise<Slot[]> {
    const { busy, confirmed } = await this.busyFor(types, from, to, excludeBookingId);
    return computeSlots({
      type: t, homeTimeZone: homeTz, from, to, now: this.clock(), busy,
      sameTypeStarts: confirmed.filter((b) => b.meetingTypeId === t.id && b.id !== excludeBookingId).map((b) => Date.parse(b.startUtc)),
    });
  }

  private rangeError(from: number, to: number) {
    if (Number.isNaN(from) || Number.isNaN(to) || to <= from || to - from > 70 * 86_400_000) throw new SchedulingError("invalid_input", "Choose a date range of up to ten weeks.", 400);
  }

  /** A visitor asks about the near future: not last year, not a decade ahead (each query costs a live calendar read). */
  private publicRangeError(from: number, to: number) {
    this.rangeError(from, to);
    const now = this.clock();
    if (from < now - 2 * 86_400_000 || to > now + 400 * 86_400_000) throw new SchedulingError("invalid_input", "Choose dates in the coming months.", 400);
  }

  async publicSlots(slug: string, invite: string | undefined, fromIso: string, toIso: string): Promise<Slot[]> {
    const from = Date.parse(fromIso), to = Date.parse(toIso);
    this.publicRangeError(from, to);
    const found = await this.publicMeetingType(slug, invite);
    if (!found.ok) throw new SchedulingError(found.reason, found.reason === "not_found" ? "This booking page does not exist." : "This booking link is private.", found.reason === "not_found" ? 404 : 403);
    const [types, settings] = [await this.repo.listMeetingTypes(), await this.repo.getSettings()];
    return this.guardCalendar(() => this.slotsFor(types, settings.homeTimeZone, types.find((m) => m.slug === slug)!, from, to));
  }

  async adminSlots(typeId: string, fromIso: string, toIso: string, excludeBookingId?: string): Promise<Slot[]> {
    const from = Date.parse(fromIso), to = Date.parse(toIso);
    this.rangeError(from, to);
    const [types, settings] = [await this.repo.listMeetingTypes(), await this.repo.getSettings()];
    const t = types.find((m) => m.id === typeId);
    if (!t) throw new SchedulingError("not_found", "Unknown meeting type.", 404);
    return this.guardCalendar(() => this.slotsFor(types, settings.homeTimeZone, t, from, to, excludeBookingId));
  }

  /** A calendar we cannot read (outage, or credentials that need renewing) means we cannot prove a time is free: refuse, retryably. */
  private async guardCalendar<T>(fn: () => Promise<T>): Promise<T> {
    try { return await fn(); } catch (e) {
      if (e instanceof CalendarUnavailableError || (e instanceof Error && (e.name === "CalendarUnavailableError" || e.name === "CalendarAuthError"))) {
        throw new SchedulingError("calendar_unavailable", "Availability is temporarily unavailable. Please try again in a moment.", 503);
      }
      throw e;
    }
  }

  private async toPublic(b: Booking): Promise<PublicBooking | null> {
    const t = (await this.repo.listMeetingTypes()).find((m) => m.id === b.meetingTypeId);
    if (!t) return null;
    const settled = b.status === "canceled" || b.zoom.status === "ready" || b.zoom.status === "simulated";
    const delayed = b.zoom.status === "failed" || b.sync?.status === "failed" || (b.sync?.attempts ?? 0) > 0;
    const notice = b.zoom.status === "simulated" ? "Prototype notice: this booking is simulated. No real email was sent, no Zoom meeting exists and no calendar was changed."
      : this.email.simulated ? "Development notice: booking emails are simulated here, so nothing was sent to you."
      : this.email.testMode ? "Development notice: booking emails are in test mode here. Real delivery goes only to the developer’s test address, so nothing was sent to you unless that is you." : null;
    return {
      reference: b.reference, meetingName: t.name, durationMinutes: t.durationMinutes, startUtc: b.startUtc, endUtc: b.endUtc, guestFirstName: b.guestName.split(/\s+/)[0], guestTimeZone: b.guestTimeZone, status: b.status,
      zoom: { status: b.zoom.status, joinUrl: b.zoom.joinUrl }, community: b.community.state, slug: t.slug, progress: settled ? "ready" : delayed ? "delayed" : "preparing", notice,
    };
  }
  async publicBooking(reference: string): Promise<PublicBooking | null> {
    const b = await this.repo.getBookingByReference(reference);
    return b ? this.toPublic(b) : null;
  }

  /** The administrator's home-zone calendar day containing an instant, as UTC bounds (for the per-day cap). */
  private dayBounds(instant: number, homeTz: string) {
    const date = localDate(instant, homeTz);
    return { dayStartUtc: new Date(localToInstant(date, "00:00", homeTz)).toISOString(), dayEndUtc: new Date(localToInstant(addDays(date, 1), "00:00", homeTz)).toISOString() };
  }

  private mapRepo(e: unknown): never {
    if (isRepositoryError(e)) {
      if (e.code === "slot_unavailable" || e.code === "day_full") throw new SchedulingError("slot_unavailable", "That time is no longer available. Please choose another.", 409);
      if (e.code === "idempotency_conflict") throw new SchedulingError("idempotency_conflict", "This request key was already used for a different booking.", 409);
      if (e.code === "not_found") throw new SchedulingError("not_found", "Booking not found.", 404);
      if (e.code === "conflict") throw new SchedulingError("conflict", e.message === "conflict" ? "That is not possible in the booking's current state." : e.message, 409);
      if (e.code === "slug_taken") throw new SchedulingError("conflict", "Another meeting type already uses that link.", 409, { field: "slug" });
    }
    throw e;
  }

  // ------------------------------------------------------------------------------------------------ booking

  /** Evaluates health and tells the owner by email when it changes (see alerts.ts). Called by the scheduled alert job. */
  async checkAlerts() { return runAlertCheck({ repo: this.repo, email: this.email, now: this.clock, adminUrl: this.adminUrl }); }

  /**
   * The name and email to prefill for a visitor who arrived with an inquiry reference, or null. Never throws and never reveals why it found nothing:
   * a malformed, unknown or unreadable reference simply means an empty form. The reference is an unguessable random token (144 bits).
   */
  async prefillFor(ref: unknown): Promise<BookingPrefill | null> {
    if (!this.inquiryPrefill || !isRefShaped(ref)) return null;
    try { return await this.inquiryPrefill(ref); } catch { return null; }
  }

  /** Where a booking reference came from (inquiry or application), whatever its age; null for anything unknown or malformed. */
  async originFor(ref: unknown): Promise<{ kind: "inquiry" | "application"; id: string } | null> {
    if (!this.refOriginOf || !isRefShaped(ref)) return null;
    try { return await this.refOriginOf(ref); } catch { return null; }
  }

  async createBooking(raw: BookingInput): Promise<{ booking: PublicBooking; replay: boolean }> {
    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) throw new SchedulingError("invalid_input", firstIssue(parsed.error), 400, { field: String(parsed.error.issues[0]?.path[0] ?? "") });
    const input = parsed.data;
    await this.sync.ownerActivation().catch(() => undefined);   // the baseline is recorded BEFORE any transition, so every transition made while owner notices are on is after it
    const startMs = Date.parse(input.startUtc);
    const hash = requestHash(input.slug, input.startUtc, input.guestEmail);

    // 1. A retry of the same request returns the same booking and creates nothing new.
    const prior = await this.repo.findByIdempotencyKey(input.idempotencyKey);
    if (prior) {
      if (prior.requestHash && prior.requestHash !== hash) throw new SchedulingError("idempotency_conflict", "This request key was already used for a different booking.", 409);
      // The same request again: nothing new is created. If the first attempt's follow-up work is still outstanding, make sure it is running.
      if (prior.sync?.status !== "ok") await this.kick(prior.id);
      return { booking: (await this.toPublic((await this.repo.getBooking(prior.id)) ?? prior))!, replay: true };
    }
    // 2. The meeting type, and the invitation if it needs one.
    const [types, settings] = [await this.repo.listMeetingTypes(), await this.repo.getSettings()];
    const type = types.find((m) => m.slug === input.slug && m.active);
    if (!type) throw new SchedulingError("not_found", "This booking page does not exist.", 404);
    if (type.visibility === "invitation" && (!input.invite || input.invite !== type.inviteCode)) throw new SchedulingError("invitation_required", "This booking link is private.", 403);
    // Abuse budget: only for a genuinely new, well-formed request for a real meeting type, and before Google is queried or anything is sent.
    if (this.bookingBudget) {
      const verdict = await this.bookingBudget(input.guestEmail);
      if (verdict === "limited") throw new SchedulingError("rate_limited", "Too many booking requests for this address or right now. Please wait a while and try again.", 429);
      if (verdict === "unavailable") throw new SchedulingError("calendar_unavailable", "Booking is temporarily unavailable. Please try again in a moment.", 503);
    }
    // 3. Re-check the slot NOW against Google Calendar and every confirmed booking. The visitor's view may be stale.
    const slots = await this.guardCalendar(() => this.slotsFor(types, settings.homeTimeZone, type, startMs, startMs + 1));
    const slot = slots.find((s) => Date.parse(s.startUtc) === startMs);
    if (!slot) throw new SchedulingError("slot_unavailable", "That time is no longer available. Please choose another.", 409);
    // 4. The authoritative write. The repository re-checks overlap (buffers, all types) and the daily cap atomically.
    let created: { booking: Booking; replay: boolean };
    try {
      created = await this.repo.createBooking({
        reference: newToken(), meetingTypeId: type.id, startUtc: slot.startUtc, endUtc: slot.endUtc,
        bufferBeforeMinutes: type.bufferBeforeMinutes, bufferAfterMinutes: type.bufferAfterMinutes,
        guestName: input.guestName, guestEmail: input.guestEmail.toLowerCase(), guestMessage: input.guestMessage ?? "", guestTimeZone: input.guestTimeZone,
        source: input.source ? input.source : null, idempotencyKey: input.idempotencyKey, requestHash: hash,
        ...this.dayBounds(startMs, settings.homeTimeZone), maxPerDay: type.maxPerDay, createdAt: this.iso(),
      });
    } catch (e) { this.mapRepo(e); }
    if (!created.replay) await this.log("booking_created", `${created.booking.guestName} booked ${type.name}`, created.booking.id);
    // Remember where the visitor came from (inquiry or application). Best effort: it never delays or fails a booking that is already committed.
    if (!created.replay && input.originContext && this.linkOrigin) await this.linkOrigin(created.booking.id, input.originContext).catch((e) => console.error("booking origin not recorded:", e instanceof Error ? e.message : e));
    // 5. Zoom, Google event, email: started in the background, retried on failure; the booking stands either way.
    await this.kick(created.booking.id);
    return { booking: (await this.toPublic((await this.repo.getBooking(created.booking.id)) ?? created.booking))!, replay: created.replay };
  }

  async cancelBooking(id: string): Promise<void> {
    await this.sync.ownerActivation().catch(() => undefined);
    let r;
    try { r = await this.repo.cancelBooking(id, this.iso(), "the administrator"); } catch (e) { this.mapRepo(e); }
    if (!r.changed) return; // idempotent
    const t = (await this.repo.listMeetingTypes()).find((m) => m.id === r.booking.meetingTypeId);
    await this.log("booking_canceled", `${r.booking.guestName}'s ${t?.name ?? "meeting"} was canceled`, id);
    await this.kick(id);
  }

  async rescheduleBooking(id: string, newStartUtc: string): Promise<void> {
    await this.sync.ownerActivation().catch(() => undefined);
    const startMs = Date.parse(newStartUtc);
    if (Number.isNaN(startMs)) throw new SchedulingError("invalid_input", "Choose a new time.", 400);
    const b = await this.repo.getBooking(id);
    if (!b) throw new SchedulingError("not_found", "Booking not found.", 404);
    if (b.status === "canceled") throw new SchedulingError("conflict", "A canceled booking cannot be rescheduled.", 409);
    const [types, settings] = [await this.repo.listMeetingTypes(), await this.repo.getSettings()];
    const t = types.find((m) => m.id === b.meetingTypeId)!;
    const slots = await this.guardCalendar(() => this.slotsFor(types, settings.homeTimeZone, t, startMs, startMs + 1, b.id));
    const slot = slots.find((s) => Date.parse(s.startUtc) === startMs);
    if (!slot) throw new SchedulingError("slot_unavailable", "That time is not available. Please choose another.", 409);
    try { await this.repo.rescheduleBooking(id, { startUtc: slot.startUtc, endUtc: slot.endUtc, ...this.dayBounds(startMs, settings.homeTimeZone), maxPerDay: t.maxPerDay, at: this.iso() }, "the administrator"); } catch (e) { this.mapRepo(e); }
    await this.log("booking_rescheduled", `${b.guestName}'s ${t.name} was rescheduled`, id);
    await this.kick(id);
  }

  async resendConfirmation(id: string): Promise<{ to: string; subject: string; simulated: boolean }> {
    const b = await this.repo.getBooking(id);
    if (!b) throw new SchedulingError("not_found", "Booking not found.", 404);
    if (b.status === "canceled") throw new SchedulingError("conflict", "This booking is canceled, so there is no confirmation to resend.", 409);
    const t = (await this.repo.listMeetingTypes()).find((m) => m.id === b.meetingTypeId)!;
    const r = await this.sync.resendConfirmation(id);
    if (!r.ok) throw new SchedulingError("email_failed", "The confirmation could not be sent. It was not recorded as sent.", 502);
    await this.repo.addBookingEvent(id, { at: this.iso(), kind: "confirmation_resent", detail: this.email.simulated ? "Confirmation resent (simulated)" : "Confirmation resent" });
    await this.log("confirmation_resent", `Confirmation for ${b.guestName} resent${this.email.simulated ? " (simulated)" : ""}`, id);
    return { to: b.guestEmail, subject: composeEmail("confirmation_resend", b, t).subject, simulated: this.email.simulated };
  }

  // ------------------------------------------------------------------------------------------------ synchronisation

  /** Worker / cron entry point: every booking whose external state is due for another attempt. */
  runDueSync(limit = 20): Promise<SyncResult[]> { return this.sync.runDue(limit); }

  /**
   * The sweep: first re-queue anything whose external state disagrees with the record although it claims to be fine, then run everything due,
   * then (at most every 15 minutes) look for calendar conflicts that appeared after an event was created. The result is written as a heartbeat so the
   * admin can see recovery is running. Safe to call as often as you like, from any number of workers. This is what finishes work whose in-request task was killed.
   */
  async runMaintenance(limit = 20): Promise<{ reconciled: { checked: number; requeued: string[] }; results: SyncResult[]; summary: SweepSummary }> {
    const reconciled = await this.sync.reconcile();
    const results = await this.sync.runDue(limit);
    const previous = (await this.repo.getLastSweep().catch(() => null))?.summary.conflictScanAt ?? null;
    // Due when never scanned, when 15 minutes have passed, or when the recorded time is in the FUTURE (clock skew, a restored backup): never let a bad timestamp switch scanning off.
    const scanDue = !previous || this.clock() < Date.parse(previous) || this.clock() - Date.parse(previous) >= CONFLICT_SCAN_EVERY_MS;
    const conflicts = scanDue ? await this.sync.scanConflicts().catch(() => ({ checked: 0, flagged: [] as string[], ran: false })) : { checked: 0, flagged: [] as string[], ran: false };
    // The duplicate-meeting scan runs on the same cadence, independently of the conflict scan.
    const zoomPrevious = (await this.repo.getLastSweep().catch(() => null))?.summary.zoomScanAt ?? null;
    const zoomScanDue = !zoomPrevious || this.clock() < Date.parse(zoomPrevious) || this.clock() - Date.parse(zoomPrevious) >= ZOOM_SCAN_EVERY_MS;
    const zoomScan = zoomScanDue ? await this.sync.scanZoom().catch(() => ({ ran: false, removed: 0, stale: 0, requeued: 0, unverified: 0, missing: 0 })) : { ran: false, removed: 0, stale: 0, requeued: 0, unverified: 0, missing: 0 };
    const summary: SweepSummary = {
      reconciled: reconciled.requeued.length, processed: results.length, succeeded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok && !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length, conflictsFlagged: conflicts.flagged.length, conflictScanAt: scanDue && conflicts.ran ? this.iso() : previous,   // a scan that could not read the calendar does not use up its window
      zoomScanAt: zoomScanDue && zoomScan.ran ? this.iso() : zoomPrevious, zoomDuplicatesRemoved: zoomScan.removed, zoomStaleFound: zoomScan.stale, zoomRequeued: zoomScan.requeued, zoomUnverified: zoomScan.unverified, zoomMissing: zoomScan.missing,
    };
    await this.repo.recordSweep(this.iso(), summary).catch(() => undefined);   // the pulse must never fail a sweep
    return { reconciled, results, summary };
  }

  /**
   * A guest's confirmation page is waiting for its Zoom link: if the booking's synchronisation is due and nobody holds it, start it.
   * Returns the page's current state. This makes the happy path independent of any scheduled job.
   */
  async nudge(reference: string): Promise<PublicBooking | null> {
    const b = await this.repo.getBookingByReference(reference);
    if (!b) return null;
    const due = b.sync?.status === "pending" && (!b.sync.nextAttemptAt || Date.parse(b.sync.nextAttemptAt) <= this.clock());
    if (due) await this.kick(b.id);
    return this.toPublic((await this.repo.getBooking(b.id)) ?? b);
  }

  /**
   * Admin "Retry sync": clears the give-up state of KNOWN failures and runs now. It NEVER resolves an uncertain Zoom creation: if an earlier create has no
   * known outcome, a retry only looks again (the meeting is adopted if it is listed) and otherwise leaves it uncertain. Another create can only be
   * authorised by resolveUncertainZoom, a separate, deliberate action.
   */
  async retrySync(id: string): Promise<SyncResult> {
    const b = await this.repo.getBooking(id);
    if (!b) throw new SchedulingError("not_found", "Booking not found.", 404);
    const z = (await this.repo.listRefs(id)).find((r) => r.provider === "zoom");
    if (z && z.status === "failed" && !z.createIntentAt) await this.repo.upsertRef({ ...z, status: "pending", attempts: 0, updatedAt: this.iso() });   // a known failure: try again
    await this.repo.finishSync(id, { status: "pending", attempts: 0, nextAttemptAt: this.iso(), lastError: b.sync?.lastError ?? null });
    return this.sync.run(id);
  }

  /**
   * The explicit workflow for a Zoom create whose outcome is UNKNOWN. Two actions, both deliberate and both bound to the CURRENT attempt (`intentAt` is the
   * attempt time the administrator was shown; if a newer attempt exists the request is refused):
   *   adopt        the administrator found the meeting in Zoom and gives its id. It must exist for the configured host, must not belong to another booking or
   *                be condemned, and becomes the booking's meeting (the next pass checks its time and length).
   *   none-exists  the administrator searched Zoom (every page, past meetings included) and found none, and accepts the duplicate risk. Zoom's list not
   *                showing a meeting is NEVER taken as proof, so this refuses if the list shows one now, and it only ever runs on the administrator's say-so.
   * Either way it takes the booking's lease first (it cannot race a running worker), writes with the lease's token, and records the decision in the activity feed.
   */
  async resolveUncertainZoom(id: string, r: { action: "adopt"; meetingId: string; intentAt: string } | { action: "none-exists"; intentAt: string; acknowledgeDuplicateRisk: boolean }): Promise<SyncResult> {
    const b = await this.repo.getBooking(id);
    if (!b) throw new SchedulingError("not_found", "Booking not found.", 404);
    const z = (await this.repo.listRefs(id)).find((x) => x.provider === "zoom");
    if (!z || !z.createIntentAt || z.externalId) throw new SchedulingError("conflict", "There is no unresolved Zoom creation for this booking.", 409);
    if (Date.parse(r.intentAt) !== Date.parse(z.createIntentAt)) throw new SchedulingError("conflict", "The Zoom creation attempt has changed since you opened this booking. Reload it and look again.", 409);
    const marker = zoomMarkerFor(id);
    const claim = await this.repo.claimSync(id, this.iso(), 120);
    if (!claim) throw new SchedulingError("conflict", "This booking is being synchronised right now. Try again in a minute.", 409);
    let released = false;
    const release = async (state: NonNullable<typeof b.sync>) => { released = true; await this.repo.finishSync(id, state, undefined, claim); };
    try {
      if (r.action === "adopt") {
        const meetingId = String(r.meetingId ?? "").trim();
        if (!/^\d{6,20}$/.test(meetingId)) throw new SchedulingError("invalid_input", "Enter the Zoom meeting number (digits only).", 400);
        const state = await this.zoom.getMeeting(meetingId);   // throws if it belongs to another host
        if (!state) throw new SchedulingError("invalid_input", "Zoom has no meeting with that number for the configured host.", 400);
        if (state.marker && state.marker !== marker) throw new SchedulingError("conflict", "That meeting belongs to a different booking.", 409);
        if ((await this.repo.listZoomTombstones(id)).some((t) => t.externalId === meetingId)) throw new SchedulingError("conflict", "That meeting has been marked for deletion.", 409);
        try {
          const out = await this.repo.upsertRef({ ...z, externalId: meetingId, url: state.joinUrl || null, status: "synced", syncedVersion: 0, contentKey: null, attempts: 0, lastError: null, createIntentAt: null, createUnknown: 0, updatedAt: this.iso() }, claim);
          if (out === "lost") throw new SchedulingError("conflict", "Another worker took over this booking. Try again.", 409);
        } catch (e) { if (isRepositoryError(e)) throw new SchedulingError("conflict", e.code === "condemned" ? "That meeting has been marked for deletion." : "That meeting is already attached to another booking.", 409); throw e; }
        await this.log("zoom_review", `An administrator confirmed that Zoom meeting ${meetingId} is ${b.guestName}'s meeting (attempt from ${z.createIntentAt}). It will be checked against the booking.`, id);
      } else {
        if (r.acknowledgeDuplicateRisk !== true) throw new SchedulingError("invalid_input", "Confirm that you searched Zoom and accept the risk of a duplicate meeting.", 400);
        const dead = await this.sync.condemnedSet(id);
        const listed = (await this.zoom.findMeetingsByMarker(marker)).filter((m) => !dead.has(m.meetingId));
        if (listed.length) throw new SchedulingError("conflict", `Zoom lists a meeting for this booking (${listed.map((m) => m.meetingId).join(", ")}). Adopt it instead.`, 409);
        await this.repo.upsertRef({ ...z, status: "pending", attempts: 0, lastError: "An administrator confirmed that no meeting exists in Zoom.", createIntentAt: null, createUnknown: 0, updatedAt: this.iso() }, claim);
        await this.log("zoom_review", `An administrator searched Zoom for ${b.guestName}'s meeting (marker ${marker}, attempt from ${z.createIntentAt}), found none, and accepted the risk of a duplicate. A new meeting may now be created.`, id);
      }
      await release({ status: "pending", attempts: 0, nextAttemptAt: this.iso(), lastError: null });
    } catch (e) {
      if (!released) await this.repo.finishSync(id, b.sync ?? { status: "failed", attempts: MAX_ATTEMPTS, nextAttemptAt: null, lastError: z.lastError }, undefined, claim).catch(() => undefined);
      throw e;
    }
    return this.sync.run(id);
  }

  /**
   * A webhook says an external object was deleted outside this system (the host removed the Zoom meeting or Google event by hand).
   * The booking stands (our records are the authority): forget the stale reference and queue a re-sync, which recreates it.
   */
  async onExternalDeleted(provider: "zoom" | "google", externalId: string): Promise<boolean> {
    const id = await this.repo.findBookingIdByExternalRef(provider, externalId);
    if (!id) return false;
    const b = await this.repo.getBooking(id);
    if (!b || b.status === "canceled") return false;
    const ref = (await this.repo.listRefs(id)).find((r) => r.provider === provider);
    if (ref) await this.repo.upsertRef({ ...ref, externalId: null, url: null, status: "pending", contentKey: null, attempts: 0, lastError: `Deleted in ${provider === "zoom" ? "Zoom" : "Google Calendar"}`, updatedAt: this.iso() });
    await this.log(provider === "zoom" ? "zoom_failed" : "sync_failed", `${b.guestName}'s ${provider === "zoom" ? "Zoom meeting" : "calendar event"} was deleted outside MBA Scheduling. It is being recreated${provider === "zoom" ? "; resend the confirmation to share the new link" : ""}.`, id);
    await this.repo.finishSync(id, { status: "pending", attempts: 0, nextAttemptAt: this.iso(), lastError: `Deleted in ${provider}` });
    await this.kick(id);
    return true;
  }

  /**
   * Inbound webhooks. A verified delivery is CLAIMED, processed, then marked processed or failed. Only a processed delivery is a replay; one that
   * failed (or whose worker died) stays claimable, so the provider's legitimate retry runs the effect again instead of being turned away.
   * An error from `effect` is rethrown after the delivery is marked failed, so the caller answers 5xx and the provider retries.
   */
  async handleWebhook<T>(provider: "zoom" | "google" | "resend", key: string, effect: () => Promise<T>): Promise<{ status: "processed"; result: T; retried: boolean } | { status: "duplicate" } | { status: "busy" }> {
    const claim = await this.repo.beginWebhook(provider, key, this.iso(), WEBHOOK_LEASE_SECONDS);
    if (claim.state === "duplicate") return { status: "duplicate" };
    if (claim.state === "busy" || !claim.token) return { status: "busy" };
    const token = claim.token;
    let result: T;
    // Completion is fenced by the claim token: if this worker was replaced meanwhile, its late success or failure changes nothing (a processed delivery is terminal).
    try { result = await effect(); }
    catch (e) { await this.repo.finishWebhook(provider, key, token, false, e instanceof Error ? e.message : String(e), this.iso()).catch(() => undefined); throw e; }
    await this.repo.finishWebhook(provider, key, token, true, null, this.iso());
    return { status: "processed", result, retried: claim.state === "retry" };
  }

  // ------------------------------------------------------------------------------------------------ community

  /**
   * The post-booking community invitation. `shown` is recorded when it is displayed; an answer (joined / declined / dismissed) is recorded ONCE per
   * booking, with the exact wording, a timestamp and its source, and later requests change nothing. It is only ever offered, and only ever accepted,
   * for a CONFIRMED booking whose Zoom details are ready. Recording "joined" is the explicit opt-in itself: nothing is subscribed anywhere (no mailing
   * list is connected), and the booking does not depend on the answer.
   */
  async answerCommunity(reference: string, action: "shown" | "declined" | "joined" | "dismissed", visitor: CommunityVisitor = { ip: null, userAgent: null, country: null, region: null }): Promise<{ state: CommunityState; consent: CommunityConsentResult | null }> {
    const b = await this.repo.getBookingByReference(reference);
    if (!b) throw new SchedulingError("not_found", "Booking not found.", 404);
    if (b.status !== "confirmed") throw new SchedulingError("conflict", "This booking is not confirmed.", 409);
    if (b.zoom.status !== "ready" && b.zoom.status !== "simulated") throw new SchedulingError("conflict", "The invitation is offered once your Zoom details are ready.", 409);
    const before = b.community.state;
    // Only a first, explicit "yes" becomes consent in the Leads records, and BEFORE the booking notes it, so a failure here is reported to the visitor and
    // can be retried, and never leaves a "yes" on the booking without a consent record. A "no", a closed window or no answer never reaches the Leads.
    let consent: CommunityConsentResult | null = null;
    if (action === "joined" && this.communityConsent && (before === "unseen" || before === "shown")) {
      consent = await this.communityConsent.join({ guestName: b.guestName, email: b.guestEmail, visitor });
    }
    let state: CommunityState;
    try { state = await this.repo.setCommunity(reference, action, { email: b.guestEmail, wordingVersion: SCHEDULING_COMMUNITY_VERSION, wording: COMMUNITY_WORDING, at: this.iso(), source: COMMUNITY_SOURCE }); } catch (e) { this.mapRepo(e); }
    if (action !== "shown" && state === action && before !== state) {
      await this.log("community_choice", `${b.guestName}: ${action === "joined" ? "said yes to community emails" : action === "declined" ? "said no to community emails" : "closed the invitation without answering"}`, b.id);
    }
    return { state, consent: state === "joined" ? consent : null };
  }

  async recordCommunity(reference: string, action: "shown" | "declined" | "joined" | "dismissed", visitor?: CommunityVisitor): Promise<CommunityState> {
    return (await this.answerCommunity(reference, action, visitor)).state;
  }

  /** Developer aid for the prototype only: show the invitation again on a seeded sample booking. */
  async replayCommunity(reference: string): Promise<void> { await this.repo.replayDemoCommunity?.(reference); }

  // ------------------------------------------------------------------------------------------------ configuration

  async saveMeetingType(raw: unknown): Promise<MeetingType> {
    const parsed = meetingTypeSchema.safeParse(raw);
    if (!parsed.success) throw new SchedulingError("invalid_input", firstIssue(parsed.error), 400, { field: String(parsed.error.issues[0]?.path[0] ?? "") });
    const input = parsed.data;
    let availability: Availability | undefined;
    if (input.availability) {
      const v = validateAvailability(input.availability);
      if (!v.availability) throw new SchedulingError("invalid_input", v.error ?? "Check the availability.", 400);
      availability = v.availability;
    }
    const existing = input.id ? (await this.repo.listMeetingTypes()).find((m) => m.id === input.id) : undefined;
    if (input.id && !existing) throw new SchedulingError("not_found", "Meeting type not found.", 404);
    if (input.visibility === "invitation" && !input.inviteCode && !existing?.inviteCode) input.inviteCode = newToken().slice(0, 12).toLowerCase();
    const next: MeetingType = {
      id: existing?.id ?? `mt-${newId().toLowerCase()}`, slug: input.slug, name: input.name, description: input.description, durationMinutes: input.durationMinutes, format: "zoom",
      priceLabel: input.priceLabel || undefined, visibility: input.visibility,
      inviteCode: input.visibility === "invitation" ? (input.inviteCode || existing?.inviteCode) : undefined,
      availability: availability ?? existing?.availability ?? { weekly: Object.fromEntries([1, 2, 3, 4, 5].map((day) => [String(day), [{ start: "09:00", end: "17:00" }]])), breaks: [{ start: "12:00", end: "13:00" }], daysOff: [], overrides: {}, bookingWindowDays: 60 },
      minNoticeHours: input.minNoticeHours, bufferBeforeMinutes: input.bufferBeforeMinutes ?? existing?.bufferBeforeMinutes ?? DEFAULT_BUFFER_BEFORE, bufferAfterMinutes: input.bufferAfterMinutes ?? existing?.bufferAfterMinutes ?? DEFAULT_BUFFER_AFTER,
      maxPerDay: input.maxPerDay, slotIntervalMinutes: input.slotIntervalMinutes, active: input.active,
    };
    let saved: MeetingType;
    try { saved = await this.repo.saveMeetingType(next, !existing); } catch (e) { this.mapRepo(e); }
    await this.log("meeting_type_saved", `${existing ? "Updated" : "Created"} meeting type “${saved.name}”`);
    return saved;
  }

  async saveAvailability(typeId: string, raw: unknown): Promise<Availability> {
    const v = validateAvailability(raw);
    if (!v.availability) throw new SchedulingError("invalid_input", v.error ?? "Check the availability.", 400);
    let out: Availability;
    try { out = await this.repo.saveAvailability(typeId, v.availability); } catch (e) { this.mapRepo(e); }
    const t = (await this.repo.listMeetingTypes()).find((m) => m.id === typeId);
    await this.log("availability_saved", `Updated availability for “${t?.name ?? "meeting type"}”`);
    return out;
  }

  async saveSettings(input: { homeTimeZone?: unknown; simulate?: Partial<Settings["simulate"]> }): Promise<Settings> {
    if (input.homeTimeZone !== undefined && !isValidTimeZone(input.homeTimeZone)) throw new SchedulingError("invalid_input", "Choose a valid IANA time zone, for example America/Toronto.", 400);
    const s = await this.repo.saveSettings({ homeTimeZone: input.homeTimeZone as string | undefined, simulate: input.simulate });
    await this.log("settings_saved", "Updated scheduling settings");
    return s;
  }

  async resetPrototype(): Promise<void> {
    if (!this.repo.reset) throw new SchedulingError("conflict", "Reset is only available for the local prototype data.", 409);
    await this.repo.reset(await buildSeedData(this.clock()));
  }
}
