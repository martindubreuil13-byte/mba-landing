import type { Booking, EmailKind, GuestEmailKind, MeetingType, OutboxMessage, OwnerEmailKind } from "./types";
import { formatDateLong, formatTime, zoneOffsetLabel } from "./timezone";

/**
 * Composes the booking emails as DATA. The same content feeds the plain-text part, the prototype's simulated outbox and the
 * branded HTML renderer (adapters/resend-email.ts). Nothing here sends anything. Booking emails are transactional only:
 * no marketing content, no unsubscribe link, no tracking.
 */
export type EmailContent = {
  kind: EmailKind;
  /** Who the message is for. Guest and owner messages have separate templates and a different frame (the owner's has no guest footer or signature). */
  audience?: "guest" | "owner";
  subject: string; preview: string; heading: string;
  greeting: string; paragraphs: string[];
  /** Label / value rows: meeting, date, time, zone, Zoom. */
  rows: [string, string][];
  zoomUrl: string | null;
  closing: string;
  text: string;
};

function when(booking: Booking) {
  const start = Date.parse(booking.startUtc);
  const tz = booking.guestTimeZone;
  return { date: formatDateLong(start, tz), time: `${formatTime(start, tz)} – ${formatTime(Date.parse(booking.endUtc), tz)}`, zone: `${tz} (${zoneOffsetLabel(start, tz)})` };
}

export function composeEmail(kind: GuestEmailKind, booking: Booking, type: MeetingType): EmailContent {
  const first = booking.guestName.split(/\s+/)[0] || "there";
  const w = when(booking);
  const zoomUrl = booking.zoom.joinUrl;
  const zoomLine = zoomUrl ? `Zoom: ${zoomUrl}` : "Zoom: your link will follow in a separate message.";
  const rows: [string, string][] = [["Meeting", `${type.name} · ${type.durationMinutes} minutes`], ["Date", w.date], ["Time", w.time], ["Time zone", w.zone], ["Zoom", zoomUrl ?? "Your link will follow in a separate message."]];
  const details = `${type.name} · ${type.durationMinutes} minutes\n${w.date}, ${w.time} (${w.zone})\n${zoomLine}`;
  const sign = "Martin Dubreuil\nThe Modern Business Architect";

  if (kind === "cancellation") {
    const body = `Hi ${first},\n\nYour ${type.name} on ${w.date}, ${w.time} (${w.zone}) has been canceled.\n\nYou are welcome to book another time whenever suits you.\n\n${sign}`;
    return { kind, subject: `Canceled: ${type.name}`, preview: "Your meeting has been canceled.", heading: "Your meeting has been canceled", greeting: `Hi ${first},`, paragraphs: [`Your ${type.name} on ${w.date}, ${w.time} (${w.zone}) has been canceled.`, "You are welcome to book another time whenever suits you."], rows: [], zoomUrl: null, closing: "", text: body };
  }
  if (kind === "reschedule") {
    return { kind, subject: `New time: ${type.name}`, preview: "Your meeting has moved. Here are the new details.", heading: "Your meeting has a new time", greeting: `Hi ${first},`, paragraphs: ["Your meeting has moved. Here are the new details."], rows, zoomUrl, closing: "", text: `Hi ${first},\n\nYour meeting has moved. Here are the new details.\n\n${details}\n\n${sign}` };
  }
  if (kind === "zoom_details") {
    return { kind, subject: `Your Zoom details: ${type.name}`, preview: "Here is the Zoom link for your meeting.", heading: "Your Zoom details", greeting: `Hi ${first},`, paragraphs: ["Here is the Zoom link for your meeting. Everything else is as confirmed."], rows, zoomUrl, closing: "", text: `Hi ${first},\n\nHere is the Zoom link for your meeting. Everything else is as confirmed.\n\n${details}\n\n${sign}` };
  }
  return { kind, subject: `Confirmed: ${type.name}`, preview: "We're on the calendar.", heading: "We’re on the calendar.", greeting: `Hi ${first},`, paragraphs: ["We're on the calendar."], rows, zoomUrl, closing: "If you need to change the time, just reply to this email.", text: `Hi ${first},\n\nWe're on the calendar.\n\n${details}\n\nIf you need to change the time, just reply to this email.\n\n${sign}` };
}

/** Plain-text view, as the prototype's simulated outbox shows it. */
export function composeMessage(kind: GuestEmailKind, booking: Booking, type: MeetingType): Pick<OutboxMessage, "subject" | "body"> {
  const c = composeEmail(kind, booking, type);
  return { subject: c.subject, body: c.text };
}

export function outboxRecord(id: string, at: string, kind: EmailKind, booking: Booking, type: MeetingType, content?: EmailContent, to?: string): OutboxMessage {
  const c = content ?? composeEmail(kind as GuestEmailKind, booking, type);
  return { id, at, kind, bookingId: booking.id, to: to ?? booking.guestEmail, subject: c.subject, body: c.text, simulated: true };
}

// ------------------------------------------------------------------------------------------------ owner notifications

/** One line, no control characters: guest-supplied text must never be able to add header lines to a subject. */
const oneLine = (v: string) => v.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s{2,}/g, " ").trim();

/**
 * The start time a booking had at an earlier version, read from its history ("Moved from <ISO> by ..." is written by every reschedule, in order, so
 * the Nth such entry holds the start time at version N). Null when the history does not say (a seeded sample).
 */
export function startAtVersion(booking: Booking, version: number): string | null {
  const moves = booking.events.filter((e) => e.kind === "rescheduled");
  if (version >= (booking.version ?? 1)) return booking.startUtc;
  const m = moves[version - 1]?.detail.match(/Moved from (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
  return m ? m[1] : null;
}

export type OwnerContext = { homeTz: string; adminUrl?: string | null; /** For a reschedule: the start time the owner was last told. */ previousStartUtc?: string | null };

function span(startUtc: string, endUtc: string, tz: string) {
  const s = Date.parse(startUtc);
  return { date: formatDateLong(s, tz), time: `${formatTime(s, tz)} – ${formatTime(Date.parse(endUtc), tz)}`, zone: `${tz} (${zoneOffsetLabel(s, tz)})` };
}
const line = (when: ReturnType<typeof span>) => `${when.date}, ${when.time} (${when.zone})`;

/**
 * The notification the HOST receives about ONE booking. It is composed from that booking alone, so it cannot mention anyone else.
 * Transactional and plain: who, what, when (in the host's zone and the guest's), the Zoom link when there is one, and where to manage it.
 */
export function composeOwnerEmail(kind: OwnerEmailKind, booking: Booking, type: MeetingType, ctx: OwnerContext): EmailContent {
  const guest = oneLine(booking.guestName) || "A guest";
  const mine = span(booking.startUtc, booking.endUtc, ctx.homeTz);
  const theirs = span(booking.startUtc, booking.endUtc, booking.guestTimeZone);
  const zoomUrl = booking.zoom.joinUrl;
  const base: [string, string][] = [["Guest", guest], ["Email", oneLine(booking.guestEmail)], ["Meeting", `${type.name} · ${type.durationMinutes} minutes`]];
  const admin: [string, string][] = ctx.adminUrl ? [["Manage", ctx.adminUrl]] : [];
  const msg: [string, string][] = booking.guestMessage ? [["Their message", booking.guestMessage.replace(/\s+/g, " ").trim().slice(0, 600)]] : [];
  const text = (intro: string, rows: [string, string][]) => `${intro}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMBA Scheduling`;
  const short = `${mine.date.replace(/,? \d{4}$/, "")}`;

  if (kind === "owner_canceled") {
    const by = booking.events.filter((e) => e.kind === "canceled").at(-1)?.detail.replace(/^Canceled by /, "") || "the administrator";
    const rows: [string, string][] = [...base, ["Was scheduled for", line(mine)], ["Canceled by", by], ...admin];
    return { kind, audience: "owner", subject: oneLine(`Canceled: ${type.name} with ${guest}, ${short}`), preview: `${guest}'s ${type.name} was canceled.`, heading: "A booking was canceled", greeting: "", paragraphs: [`${guest}'s ${type.name} on ${mine.date} was canceled. The guest has been told.`], rows, zoomUrl: null, closing: "", text: text(`${guest}'s ${type.name} on ${mine.date} was canceled. The guest has been told.`, rows) };
  }
  if (kind === "owner_rescheduled") {
    const prev = ctx.previousStartUtc ? span(ctx.previousStartUtc, new Date(Date.parse(ctx.previousStartUtc) + (Date.parse(booking.endUtc) - Date.parse(booking.startUtc))).toISOString(), ctx.homeTz) : null;
    const rows: [string, string][] = [...base, ["Previous time", prev ? line(prev) : "Not recorded"], ["New time", line(mine)], ["Guest's local time", line(theirs)], ["Zoom", zoomUrl ?? "Link pending"], ...admin];
    return { kind, audience: "owner", subject: oneLine(`Rescheduled: ${type.name} with ${guest}, now ${short}`), preview: `${guest}'s ${type.name} moved to ${mine.date}.`, heading: "A booking has a new time", greeting: "", paragraphs: [`${guest}'s ${type.name} was moved. The guest has been told the new time.`], rows, zoomUrl, closing: "", text: text(`${guest}'s ${type.name} was moved. The guest has been told the new time.`, rows) };
  }
  const rows: [string, string][] = [...base, ["When", line(mine)], ["Guest's local time", line(theirs)], ["Zoom", zoomUrl ?? "Link pending. You will see it in the booking once Zoom has it."], ...msg, ...admin];
  return { kind, audience: "owner", subject: oneLine(`New booking: ${guest}, ${type.name}, ${short}`), preview: `${guest} booked ${type.name} for ${mine.date}.`, heading: "New booking", greeting: "", paragraphs: [`${guest} booked a ${type.name}.`], rows, zoomUrl, closing: "", text: text(`${guest} booked a ${type.name}.`, rows) };
}
