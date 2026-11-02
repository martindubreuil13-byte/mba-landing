import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { verifyContext } from "@/app/lib/inquiries/context";

/**
 * Booking origins: which inquiry or Transition application a booking came from.
 *
 * `linkBookingOrigin` runs after a booking is committed, with the signed context the booking page held (see lib/inquiries/context.ts). A missing,
 * forged or expired context links nothing. One origin per booking; repeating it changes nothing. It never changes the booking.
 *
 * `originStates` is the read side for the administrator: for a set of inquiries / applications (and, as a hint only, e-mail addresses) it answers
 * what their bookings are NOW, straight from the booking records, so a cancellation or a new time shows up without anything being copied.
 */
export async function linkBookingOrigin(bookingId: string, context: string): Promise<void> {
  const origin = verifyContext(context);
  if (!origin) return;
  const db = getServiceClient();
  let leadId: string | null = null;
  if (origin.kind === "inquiry") leadId = ((await db.from("program_inquiries").select("lead_id").eq("id", origin.id).maybeSingle()).data as { lead_id?: string } | null)?.lead_id ?? null;
  else leadId = ((await db.from("program_applications").select("lead_id").eq("id", origin.id).maybeSingle()).data as { lead_id?: string } | null)?.lead_id ?? null;
  const { error } = await db.from("booking_origins").upsert(
    { booking_id: bookingId, origin_type: origin.kind, application_id: origin.kind === "application" ? origin.id : null, inquiry_id: origin.kind === "inquiry" ? origin.id : null, lead_id: leadId },
    { onConflict: "booking_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(`Could not link the booking: ${error.message}`);
}

export type BookingNow = { id: string; status: "confirmed" | "canceled"; startAt: string; rescheduled: boolean; createdAt: string };
export type OriginStates = {
  /** Keyed "inquiry:<id>" / "application:<id>": the person's bookings that were made from that record, newest first. */
  linked: Map<string, BookingNow[]>;
  /** Keyed by lower-case e-mail: bookings made with that address that are NOT linked to any record (a hint, never a link). */
  byEmail: Map<string, BookingNow[]>;
  /** The host's time zone, for showing times. */
  timeZone: string;
};

export async function originStates(input: { inquiryIds: string[]; applicationIds: string[]; emails: string[] }): Promise<OriginStates> {
  const db = getServiceClient();
  const out: OriginStates = { linked: new Map(), byEmail: new Map(), timeZone: "UTC" };
  const settings = await db.from("sched_settings").select("home_time_zone").limit(1).maybeSingle();
  out.timeZone = (settings.data as { home_time_zone?: string } | null)?.home_time_zone || "UTC";

  const linkRows: { booking_id: string; inquiry_id: string | null; application_id: string | null }[] = [];
  if (input.inquiryIds.length) { const r = await db.from("booking_origins").select("booking_id, inquiry_id, application_id").in("inquiry_id", input.inquiryIds); if (!r.error) linkRows.push(...(r.data as typeof linkRows)); }
  if (input.applicationIds.length) { const r = await db.from("booking_origins").select("booking_id, inquiry_id, application_id").in("application_id", input.applicationIds); if (!r.error) linkRows.push(...(r.data as typeof linkRows)); }
  const linkedIds = new Set(linkRows.map((l) => l.booking_id));

  const emails = [...new Set(input.emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const attendee: { booking_id: string; email: string }[] = [];
  if (emails.length) { const r = await db.from("sched_attendees").select("booking_id, email").in("email", emails); if (!r.error) attendee.push(...(r.data as typeof attendee)); }

  const ids = [...new Set([...linkedIds, ...attendee.map((a) => a.booking_id)])];
  if (!ids.length) return out;
  const bookings = await db.from("sched_bookings").select("id, status, start_at, created_at").in("id", ids);
  if (bookings.error) throw new Error(`Could not read bookings: ${bookings.error.message}`);
  const events = await db.from("sched_booking_events").select("booking_id, kind").in("booking_id", ids).eq("kind", "rescheduled");
  const moved = new Set(((events.data ?? []) as { booking_id: string }[]).map((e) => e.booking_id));
  const byId = new Map<string, BookingNow>();
  for (const b of bookings.data as { id: string; status: "confirmed" | "canceled"; start_at: string; created_at: string }[]) byId.set(b.id, { id: b.id, status: b.status, startAt: b.start_at, createdAt: b.created_at, rescheduled: moved.has(b.id) });
  const newestFirst = (a: BookingNow, b: BookingNow) => b.createdAt.localeCompare(a.createdAt);

  for (const l of linkRows) {
    const b = byId.get(l.booking_id); if (!b) continue;
    const key = l.inquiry_id ? `inquiry:${l.inquiry_id}` : `application:${l.application_id}`;
    out.linked.set(key, [...(out.linked.get(key) ?? []), b].sort(newestFirst));
  }
  for (const a of attendee) {
    if (linkedIds.has(a.booking_id)) continue;
    const b = byId.get(a.booking_id); if (!b) continue;
    const key = a.email.trim().toLowerCase();
    out.byEmail.set(key, [...(out.byEmail.get(key) ?? []), b].sort(newestFirst));
  }
  return out;
}
