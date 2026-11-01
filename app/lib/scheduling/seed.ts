import { randomBytes } from "node:crypto";
import type { Availability, Booking, MeetingType, SchedulingData } from "./types";
import { computeSlots } from "./availability";
import { createMockGoogleCalendar } from "./providers";
import { localDate, localToInstant } from "./timezone";

/** The host's time zone (Martin works in Bangkok). Availability windows, the admin screens, calendar events and host notices are all in this zone; guests always see their own. */
export const DEFAULT_HOME_TIME_ZONE = "Asia/Bangkok";
import { DEMO_REFERENCE } from "./constants";
export { DEMO_REFERENCE };

/** Hand-built sample bookings are already "in sync": the engine leaves them alone. */
const SYNCED = { status: "ok" as const, attempts: 0, nextAttemptAt: null, lastError: null };
export const newToken = () => randomBytes(18).toString("base64url");
export const newId = () => randomBytes(9).toString("base64url");

const weekdays = (days: number[], start: string, end: string): Availability["weekly"] =>
  Object.fromEntries(days.map((d) => [String(d), [{ start, end }]]));

/** Sample meeting types. They are configuration examples, not final commercial offerings. */
export function seedMeetingTypes(): MeetingType[] {
  return [
    {
      id: "mt-discovery", slug: "discovery-conversation", name: "Discovery Conversation",
      description: "A relaxed, no-obligation conversation about where you are and what you’d like to build. Come as you are.",
      durationMinutes: 30, format: "zoom", priceLabel: "Complimentary", visibility: "public",
      availability: { weekly: weekdays([2, 3, 4], "09:30", "16:30"), breaks: [{ start: "12:00", end: "13:00" }], daysOff: [], overrides: {}, bookingWindowDays: 60 },
      minNoticeHours: 12, bufferBeforeMinutes: 0, bufferAfterMinutes: 30, maxPerDay: 4, slotIntervalMinutes: 30, active: true,
    },
    {
      id: "mt-assessment", slug: "business-architecture-assessment", name: "Business Architecture Assessment",
      description: "A focused working session on one business or idea: what it is, whether it holds together, and what to do next.",
      durationMinutes: 60, format: "zoom", visibility: "public",
      availability: { weekly: weekdays([5], "10:00", "15:00"), breaks: [{ start: "12:00", end: "13:00" }], daysOff: [], overrides: {}, bookingWindowDays: 90 },
      minNoticeHours: 48, bufferBeforeMinutes: 15, bufferAfterMinutes: 15, maxPerDay: 3, slotIntervalMinutes: 60, active: true,
    },
    {
      id: "mt-private", slug: "private-architecture-session", name: "Private Architecture Session",
      description: "An extended private session, by invitation only, for a deeper architectural working conversation.",
      durationMinutes: 90, format: "zoom", visibility: "invitation", inviteCode: "private-preview",
      availability: { weekly: { "1": [{ start: "13:00", end: "16:30" }], "3": [{ start: "13:00", end: "16:30" }] }, breaks: [], daysOff: [], overrides: {}, bookingWindowDays: 60 },
      minNoticeHours: 72, bufferBeforeMinutes: 15, bufferAfterMinutes: 30, maxPerDay: 1, slotIntervalMinutes: 30, active: true,
    },
  ];
}

/**
 * Fresh demo data relative to `now`. The bookings are picked from slots the engine really offers, so the admin calendar is
 * populated and the sample guests cover several time zones; the one "later today" booking is placed by hand.
 */
export async function buildSeedData(now: number, homeTimeZone: string = DEFAULT_HOME_TIME_ZONE): Promise<SchedulingData> {
  const meetingTypes = seedMeetingTypes();
  const tz = homeTimeZone;
  const calendar = createMockGoogleCalendar({ homeTimeZone: () => tz, outage: () => false });
  const data: SchedulingData = { version: 1, settings: { homeTimeZone: tz, simulate: { googleOutage: false, zoomFailure: false } }, meetingTypes, bookings: [], activity: [], outbox: [], consents: [], idempotency: {}, externalRefs: [], emailAttempts: [] };

  const horizon = now + 75 * 86_400_000;
  const busyBase = await calendar.getBusy(now, horizon);
  const taken: Booking[] = [];
  const guests: Record<string, Array<{ name: string; email: string; tz: string; source: string | null; message: string }>> = {
    "mt-discovery": [
      { name: "Amelia Hart", email: "amelia.hart@example.com", tz: "Europe/London", source: "Direct link", message: "Leaving a banking career and exploring a consultancy." },
      { name: "Daniel Okafor", email: "daniel.okafor@example.com", tz: "America/Vancouver", source: "Transition application", message: "" },
      { name: "Priya Nair", email: "priya.nair@example.com", tz: "Asia/Bangkok", source: "LinkedIn", message: "Three ideas, not sure which one to pick." },
      { name: "Lucas Moreau", email: "lucas.moreau@example.com", tz: "Europe/Paris", source: "Direct link", message: "" },
    ],
    "mt-assessment": [{ name: "Sofia Almeida", email: "sofia.almeida@example.com", tz: "Australia/Sydney", source: "Direct link", message: "A small design studio, looking to productise." }],
    "mt-private": [{ name: "Henrik Larsen", email: "henrik.larsen@example.com", tz: "Europe/London", source: "Invitation", message: "" }],
  };
  // Which available day (counting from the second one) each sample guest takes, so the calendar is spread out and the first days stay open.
  const pickDay: Record<string, number[]> = { "mt-discovery": [1, 3, 5, 8], "mt-assessment": [1], "mt-private": [1] };

  for (const type of meetingTypes) {
    const slots = computeSlots({ type, homeTimeZone: tz, from: now, to: horizon, now, busy: busyBase, sameTypeStarts: [] });
    const days = [...new Set(slots.map((x) => localDate(Date.parse(x.startUtc), tz)))];
    (guests[type.id] ?? []).forEach((g, i) => {
      const day = days[Math.min(pickDay[type.id][i], days.length - 1)];
      const ofDay = slots.filter((x) => localDate(Date.parse(x.startUtc), tz) === day);
      const slot = ofDay[Math.min(1, ofDay.length - 1)];
      if (!slot) return;
      const id = newId();
      taken.push({
        id, reference: newToken(), meetingTypeId: type.id, startUtc: slot.startUtc, endUtc: slot.endUtc,
        guestName: g.name, guestEmail: g.email, guestMessage: g.message, guestTimeZone: g.tz, status: "confirmed", source: g.source,
        zoom: { status: "simulated", meetingId: "10000000000", joinUrl: "https://example.com/simulated-zoom/10000000000" },
        community: { state: "unseen" }, idempotencyKey: `seed-${id}`, version: 1, bufferBeforeMinutes: type.bufferBeforeMinutes, bufferAfterMinutes: type.bufferAfterMinutes, sync: SYNCED, createdAt: new Date(now).toISOString(), events: [{ at: new Date(now).toISOString(), kind: "created", detail: "Seeded sample booking" }], demo: true,
      });
    });
  }

  // A meeting later today (home zone) so "Today" is populated, a canceled booking, and a rescheduled one.
  const today = localDate(now, tz);
  const laterToday = localToInstant(today, "17:30", tz);
  const discovery = meetingTypes[0];
  if (laterToday > now + 30 * 60_000) {
    taken.push({
      id: newId(), reference: newToken(), meetingTypeId: discovery.id, startUtc: new Date(laterToday).toISOString(), endUtc: new Date(laterToday + 30 * 60_000).toISOString(),
      guestName: "Marcus Webb", guestEmail: "marcus.webb@example.com", guestMessage: "", guestTimeZone: "America/Toronto", status: "confirmed", source: "Direct link",
      zoom: { status: "simulated", meetingId: "10000000001", joinUrl: "https://example.com/simulated-zoom/10000000001" }, community: { state: "unseen" }, idempotencyKey: `seed-today`, version: 1, bufferBeforeMinutes: discovery.bufferBeforeMinutes, bufferAfterMinutes: discovery.bufferAfterMinutes, sync: SYNCED,
      createdAt: new Date(now).toISOString(), events: [{ at: new Date(now).toISOString(), kind: "created", detail: "Seeded sample booking" }], demo: true,
    });
  }
  const canceled = taken.find((b) => b.guestName === "Lucas Moreau");
  if (canceled) { canceled.status = "canceled"; canceled.events.push({ at: new Date(now).toISOString(), kind: "canceled", detail: "Canceled by the guest" }); }
  const moved = taken.find((b) => b.guestName === "Daniel Okafor");
  if (moved) moved.events.push({ at: new Date(now).toISOString(), kind: "rescheduled", detail: "Moved from an earlier time" });

  // The always-available confirmation used to review the confirmation screen and the community invitation.
  const amelia = taken.find((b) => b.guestName === "Amelia Hart");
  if (amelia) { amelia.reference = DEMO_REFERENCE; amelia.zoom = { status: "simulated", meetingId: "10000000002", joinUrl: "https://example.com/simulated-zoom/10000000002" }; }

  data.bookings = taken;
  data.activity = [{ id: newId(), at: new Date(now).toISOString(), kind: "prototype_reset", summary: "Prototype data created (simulated calendar, Zoom and email)." }];
  return data;
}
