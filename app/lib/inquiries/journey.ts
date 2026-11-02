import "server-only";
import { listApplications } from "@/app/lib/programs/queries";
import { INVITATION_LABELS, listInvitationSends, summarizeInvitation, type InvitationSend } from "@/app/lib/programs/invitation";
import { PROGRAMS } from "@/app/lib/service-programs/catalog";
import { originStates, type BookingNow } from "@/app/lib/scheduling/adapters/booking-origin";
import { listInquiries } from "./store";

/**
 * The administrator's single list: every program inquiry and every Corporate Transition application, newest first, each with what it is about, whether
 * the owner was told / the invitation went out, and what its booking is NOW. Booking status is never stored here: it is read from the booking
 * records each time, so a cancellation or a new time appears by itself. A booking is attached only when the visitor came through that record's own
 * link; a booking made with the same e-mail address but no link is shown as a hint, not as fact.
 */
export type JourneyRow = {
  key: string; kind: "inquiry" | "application"; id: string; receivedAt: string; name: string; email: string | null; interest: string;
  contact: { text: string; bad: boolean; detail: string | null };
  message: string | null; messageRemoved: boolean;
  href: string | null;
  booking: { text: string; tone: "none" | "ok" | "bad" | "hint" };
};

const stamp = (iso: string, timeZone: string) => {
  try { return new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" }).format(new Date(iso)); }
  catch { return iso; }
};

/** The headline for a person's bookings: the latest one that is still on; otherwise the latest cancelled one. */
export function describeBooking(linked: BookingNow[], hint: BookingNow[], timeZone: string, now: number = Date.now()): JourneyRow["booking"] {
  const live = linked.find((b) => b.status === "confirmed");
  const gone = linked.find((b) => b.status === "canceled");
  if (live) {
    const past = Date.parse(live.startAt) < now;
    return { text: `${past ? "Session was" : "Booked:"} ${stamp(live.startAt, timeZone)}${live.rescheduled ? " (rescheduled)" : ""}`, tone: "ok" };
  }
  if (gone) return { text: `Canceled (was ${stamp(gone.startAt, timeZone)})`, tone: "bad" };
  const guess = hint.find((b) => b.status === "confirmed") ?? hint[0];
  if (guess) return { text: `Possibly booked ${stamp(guess.startAt, timeZone)}${guess.status === "canceled" ? " (canceled)" : ""}: same e-mail, not linked`, tone: "hint" };
  return { text: "Not booked", tone: "none" };
}

export async function listJourney(limit = 200, now: number = Date.now()): Promise<{ rows: JourneyRow[]; notes: string[] }> {
  const notes: string[] = [];
  let inquiries: Awaited<ReturnType<typeof listInquiries>> = [];
  try { inquiries = await listInquiries(limit); } catch (e) { notes.push("Saved inquiries are not available yet."); console.error("journey: inquiries unavailable:", e instanceof Error ? e.message : e); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apps: any[] = [];
  try { apps = (await listApplications()).slice(0, limit); } catch (e) { notes.push("Transition applications could not be read."); console.error("journey: applications unavailable:", e instanceof Error ? e.message : e); }
  let sends: InvitationSend[] = [];
  if (apps.length) { try { sends = await listInvitationSends(apps.map((a) => a.id)); } catch { /* the invitation column then reads "Pending" */ } }
  const sendsOf = new Map<string, InvitationSend[]>();
  for (const s of sends) sendsOf.set(s.application_id, [...(sendsOf.get(s.application_id) ?? []), s]);

  const emails = [...inquiries.map((i) => i.email ?? ""), ...apps.map((a) => String(a.answers?.email ?? ""))];
  let states: Awaited<ReturnType<typeof originStates>> = { linked: new Map(), byEmail: new Map(), timeZone: "UTC" };
  try { states = await originStates({ inquiryIds: inquiries.map((i) => i.id), applicationIds: apps.map((a) => a.id), emails }); }
  catch (e) { notes.push("Booking status could not be read."); console.error("journey: bookings unavailable:", e instanceof Error ? e.message : e); }
  const bookingFor = (key: string, email: string | null) => describeBooking(states.linked.get(key) ?? [], email ? states.byEmail.get(email.trim().toLowerCase()) ?? [] : [], states.timeZone, now);

  const rows: JourneyRow[] = [
    ...inquiries.map((i): JourneyRow => ({
      key: `inquiry:${i.id}`, kind: "inquiry", id: i.id, receivedAt: i.created_at, name: i.full_name, email: i.email,
      interest: i.program_slug ? PROGRAMS.find((p) => p.slug === i.program_slug)?.name ?? i.program_slug : "No program chosen",
      contact: i.owner_status === "accepted" ? { text: "You were notified", bad: false, detail: null } : i.owner_status === "failed" ? { text: "Delivery failed", bad: true, detail: i.owner_error } : { text: "Not sent yet", bad: true, detail: null },
      message: i.message_purged_at ? null : i.message, messageRemoved: !!i.message_purged_at, href: null,
      booking: bookingFor(`inquiry:${i.id}`, i.email),
    })),
    ...apps.map((a): JourneyRow => {
      const legacy = !a.booking_ref;
      const inv = legacy ? null : summarizeInvitation(sendsOf.get(a.id) ?? []);
      const email = typeof a.answers?.email === "string" ? a.answers.email : null;
      return {
        key: `application:${a.id}`, kind: "application", id: a.id, receivedAt: a.submitted_at, name: `${a.answers?.firstName ?? ""} ${a.answers?.lastName ?? ""}`.trim() || "Applicant", email,
        interest: "Corporate Transition",
        contact: inv ? { text: `Invitation: ${INVITATION_LABELS[inv.state]}`, bad: inv.state === "failed", detail: inv.state === "failed" ? inv.lastError : null } : { text: "Earlier flow", bad: false, detail: null },
        message: null, messageRemoved: false, href: `/admin/programs/corporate-transition/${a.id}`,
        booking: bookingFor(`application:${a.id}`, email),
      };
    }),
  ].sort((x, y) => y.receivedAt.localeCompare(x.receivedAt)).slice(0, limit);
  return { rows, notes };
}
