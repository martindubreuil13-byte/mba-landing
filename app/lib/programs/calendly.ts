import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServiceClient } from "@/app/lib/supabase/service";

/**
 * Calendly booking tracking, driven ONLY by verified Calendly webhook events (`invitee.created`, `invitee.canceled`).
 * A click on the booking link never marks anything as booked.
 *
 * Matching: the booking link carries an opaque `booking_ref` as `utm_content` (see introBookingUrl). Calendly returns it in
 * `payload.tracking.utm_content`. A rescheduled booking is matched through `old_invitee` if Calendly did not carry the tracking over.
 * Events that match no application are ignored: the same Calendly event type is used by other pages of the site.
 *
 * Idempotency: one `program_bookings` row per Calendly invitee URI (unique). A repeated delivery of the same event updates that
 * row to the same values; a late `created` never revives an invitee already seen as cancelled.
 */

/** Calendly signs `${t}.${rawBody}` with the subscription's signing key: header `Calendly-Webhook-Signature: t=…,v1=<hex hmac sha256>`. */
export function verifyCalendlySignature(args: { key: string; header: string | null; rawBody: string; nowMs?: number; toleranceSeconds?: number }): boolean {
  if (!args.header) return false;
  const parts = Object.fromEntries(args.header.split(",").map((p) => { const i = p.indexOf("="); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1 || !/^\d+$/.test(t) || !/^[0-9a-f]+$/i.test(v1)) return false;
  const tolerance = (args.toleranceSeconds ?? 300) * 1000;
  if (Math.abs((args.nowMs ?? Date.now()) - Number(t) * 1000) > tolerance) return false;
  const expected = createHmac("sha256", args.key).update(`${t}.${args.rawBody}`).digest();
  const given = Buffer.from(v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Whether bookings can be confirmed automatically at all. Without the signing key the admin must say "not connected", never "pending". */
export const calendlyTrackingConfigured = () => !!process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();

export type CalendlyBookingEvent = {
  kind: "created" | "canceled";
  inviteeUri: string; eventUri: string | null; ref: string | null; oldInviteeUri: string | null;
  startTime: string | null; endTime: string | null; bookedAt: string | null; canceledAt: string | null; rescheduled: boolean;
};

const str = (v: unknown, max = 500) => (typeof v === "string" && v.length <= max ? v : null);
const iso = (v: unknown) => { const s = str(v, 64); return s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null; };

/** Returns null for any event type or shape this feature does not use. Only opaque identifiers and times are read; no name or email. */
export function parseCalendlyEvent(body: unknown): CalendlyBookingEvent | null {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const kind = b.event === "invitee.created" ? "created" : b.event === "invitee.canceled" ? "canceled" : null;
  const p = b.payload;
  if (!kind || !p || typeof p !== "object") return null;
  const inviteeUri = str(p.uri);
  if (!inviteeUri) return null;
  return {
    kind, inviteeUri, eventUri: str(p.scheduled_event?.uri) ?? str(p.event),
    ref: str(p.tracking?.utm_content, 100), oldInviteeUri: str(p.old_invitee),
    startTime: iso(p.scheduled_event?.start_time), endTime: iso(p.scheduled_event?.end_time),
    bookedAt: iso(p.created_at) ?? iso(b.created_at),
    canceledAt: kind === "canceled" ? iso(p.cancellation?.created_at) ?? iso(p.updated_at) ?? iso(b.created_at) ?? new Date().toISOString() : null,
    rescheduled: p.rescheduled === true,
  };
}

export type ProgramBooking = { id: string; application_id: string | null; calendly_invitee_uri: string; status: "active" | "canceled"; start_time: string | null; end_time: string | null; booked_at: string | null; canceled_at: string | null; rescheduled: boolean };

/** The summary the admin list reads: BOOKED with a meeting time while any invitee is active, otherwise back to waiting. */
export async function recomputeBooking(applicationId: string) {
  const db = getServiceClient();
  const { data: rows, error } = await db.from("program_bookings").select("*").eq("application_id", applicationId);
  if (error) throw new Error(error.message);
  const active = ((rows ?? []) as ProgramBooking[]).filter((r) => r.status === "active").sort((a, b) => (b.booked_at ?? "").localeCompare(a.booked_at ?? ""))[0];
  const { data: app } = await db.from("program_applications").select("status").eq("id", applicationId).maybeSingle();
  if (!app) return;
  const patch: Record<string, unknown> = active
    ? { booking_status: "booked", booked_at: active.booked_at, meeting_at: active.start_time }
    : { booking_status: "not_booked", booked_at: null, meeting_at: null };
  if (active && (app.status === "INVITED" || app.status === "UNDER_REVIEW")) patch.status = "BOOKED";
  if (!active && app.status === "BOOKED") patch.status = "INVITED";
  const { error: updateError } = await db.from("program_applications").update(patch).eq("id", applicationId);
  if (updateError) throw new Error(updateError.message);
}

export type ApplyResult = { matched: boolean; applicationId?: string; duplicate?: boolean };

export async function applyCalendlyEvent(e: CalendlyBookingEvent): Promise<ApplyResult> {
  const db = getServiceClient();
  const { data: existing } = await db.from("program_bookings").select("*").eq("calendly_invitee_uri", e.inviteeUri).maybeSingle();

  let applicationId: string | null = existing?.application_id ?? null;
  if (!applicationId && e.ref) {
    const { data } = await db.from("program_applications").select("id").eq("booking_ref", e.ref).maybeSingle();
    applicationId = data?.id ?? null;
  }
  if (!applicationId && e.oldInviteeUri) {
    const { data } = await db.from("program_bookings").select("application_id").eq("calendly_invitee_uri", e.oldInviteeUri).maybeSingle();
    applicationId = data?.application_id ?? null;
  }
  if (!applicationId) return { matched: false };

  if (e.kind === "canceled") {
    const values = { status: "canceled", canceled_at: e.canceledAt, rescheduled: e.rescheduled };
    if (existing) {
      if (existing.status === "canceled") return { matched: true, applicationId, duplicate: true };
      const { error } = await db.from("program_bookings").update(values).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("program_bookings").insert({ application_id: applicationId, booking_ref: e.ref, calendly_invitee_uri: e.inviteeUri, calendly_event_uri: e.eventUri, start_time: e.startTime, end_time: e.endTime, booked_at: e.bookedAt, ...values });
      if (error && error.code !== "23505") throw new Error(error.message);
    }
  } else if (existing) {
    // Repeated `created`: keep the row as it is. A cancelled invitee is never revived by a late or replayed event.
    if (existing.status === "active") {
      const { error } = await db.from("program_bookings").update({ application_id: applicationId, start_time: e.startTime, end_time: e.endTime, calendly_event_uri: e.eventUri }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    await recomputeBooking(applicationId);
    return { matched: true, applicationId, duplicate: true };
  } else {
    const { error } = await db.from("program_bookings").insert({ application_id: applicationId, booking_ref: e.ref, calendly_invitee_uri: e.inviteeUri, calendly_event_uri: e.eventUri, status: "active", start_time: e.startTime, end_time: e.endTime, booked_at: e.bookedAt, rescheduled: false });
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  await recomputeBooking(applicationId);
  return { matched: true, applicationId };
}

export async function listBookings(applicationId: string): Promise<ProgramBooking[]> {
  const { data, error } = await getServiceClient().from("program_bookings").select("*").eq("application_id", applicationId).order("booked_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProgramBooking[];
}
