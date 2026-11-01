import type { BusyInterval } from "./types";
import type { EmailContent } from "./notifications";
import { addDays, localDate, localToInstant } from "./timezone";

/**
 * External integrations, behind interfaces. This file holds the interfaces, the error types and the deterministic MOCKS.
 * The real adapters live in ./adapters/ and are chosen only in instance.ts. No credential is read here.
 */

export class CalendarUnavailableError extends Error {
  constructor(message = "The calendar could not be reached.") { super(message); this.name = "CalendarUnavailableError"; }
}
/** The Google connection needs the owner to sign in again (token expired, revoked or never granted). Not retryable by the system. */
export class CalendarAuthError extends CalendarUnavailableError {
  constructor(message = "Google Calendar needs to be reconnected.") { super(message); this.name = "CalendarAuthError"; }
}
export class ZoomUnavailableError extends Error {
  constructor(message = "Zoom could not create the meeting.") { super(message); this.name = "ZoomUnavailableError"; }
}
/**
 * A create call whose OUTCOME IS UNKNOWN: the request may have reached Zoom and created the meeting, but the answer was lost, late, or unusable
 * (timeout, dropped connection, 5xx, a success without a join link). It is never retried blindly: the caller must first look for the meeting.
 */
export class ZoomAmbiguousError extends ZoomUnavailableError {
  constructor(message = "Zoom may have created the meeting, but the answer was lost.") { super(message); this.name = "ZoomAmbiguousError"; }
}
/** By name, not instanceof: the singleton is shared by route bundles that each carry their own copy of this module. */
export const isZoomAmbiguous = (e: unknown): e is ZoomAmbiguousError => e instanceof Error && e.name === "ZoomAmbiguousError";
/** The meeting no longer exists in Zoom (deleted by hand). Raised on update so the caller creates a new one. */
export class ZoomGoneError extends ZoomUnavailableError {
  constructor() { super("The Zoom meeting no longer exists."); this.name = "ZoomGoneError"; }
}
export class EmailSendError extends Error {
  constructor(message = "The email could not be sent.") { super(message); this.name = "EmailSendError"; }
}

/** A calendar event for one booking. `eventId` is deterministic per booking, so create and retry are the same call. */
export type CalendarEventInput = {
  eventId: string; bookingId: string; summary: string; description: string;
  startUtc: string; endUtc: string; /** The administrator's home zone: how the event is displayed on their calendar. */ timeZone: string;
  location?: string | null; attendeeEmail?: string | null;
};

export interface CalendarProvider {
  /** Busy intervals overlapping [from, to) on the administrator's calendar (external commitments; includes our own events). Throws CalendarUnavailableError / CalendarAuthError. */
  getBusy(from: number, to: number): Promise<BusyInterval[]>;
  /** Create the event, or update it if it already exists (same eventId). Idempotent. */
  upsertEvent(input: CalendarEventInput): Promise<{ eventId: string; etag?: string | null; url?: string | null }>;
  /** Delete the event. An event that is already gone counts as success. */
  deleteEvent(eventId: string): Promise<void>;
}

export type ZoomMeetingInput = { topic: string; startUtc: string; durationMinutes: number; timeZone: string; /** Written into the meeting so a lost response can be recognised later. */ marker: string };
export type ZoomMeeting = { meetingId: string; joinUrl: string };
/** What Zoom itself currently shows for a meeting. `startUtc` / `durationMinutes` are absent when Zoom does not report them (for example a recurring meeting without a fixed time). */
export type ZoomMeetingState = ZoomMeeting & { startUtc: string | null; durationMinutes: number | null; /** The agenda Zoom shows (our marker, when it is ours); null when absent. */ marker?: string | null };
export type MarkedMeeting = ZoomMeetingState & { marker: string };
/** Every meeting this system creates carries a marker starting with this, followed by the booking id. */
export const ZOOM_MARKER_PREFIX = "mba-booking:";

export interface ZoomProvider {
  /** Creates ONE meeting. Throws ZoomAmbiguousError when the outcome is unknown; it never retries a create on its own. */
  createMeeting(input: ZoomMeetingInput): Promise<ZoomMeeting>;
  /**
   * Every meeting carrying the marker (there should be at most one; more means a duplicate to clean up). Throws, rather than returning a partial
   * answer, when the host's meetings cannot all be examined: "none found" must be a proof of absence for the pages that were readable.
   */
  findMeetingsByMarker(marker: string): Promise<ZoomMeeting[]>;
  /** The meeting as Zoom shows it right now, or null if it no longer exists. Used to CHECK external state, never to infer that a create did not happen. Throws if the meeting belongs to another host. */
  getMeeting(meetingId: string): Promise<ZoomMeetingState | null>;
  /** Every meeting with one of this system's markers (for the duplicate / orphan scan). Throws when the list cannot be read completely. */
  listMarkedMeetings(): Promise<MarkedMeeting[]>;
  updateMeeting(meetingId: string, input: ZoomMeetingInput): Promise<void>;
  /** Delete. A meeting that is already gone counts as success. */
  deleteMeeting(meetingId: string): Promise<void>;
}

export type OutgoingEmail = {
  to: string; subject: string; text: string; html?: string; replyTo?: string;
  /** Sent to the provider so a retried send of the same message cannot deliver twice. */
  idempotencyKey: string; tags?: Record<string, string>;
  /** The structured message, for providers that render their own branded HTML. */
  content?: EmailContent;
};
export interface EmailProvider {
  /** True for providers that deliver nothing (the prototype). */
  readonly simulated: boolean;
  /** True while real delivery is confined to the single developer test address and every other message is simulated (see email-policy.ts). */
  readonly testMode?: boolean;
  /** `simulated` is set when this one message was not really sent (for example, a test-mode message for any other recipient). */
  send(message: OutgoingEmail): Promise<{ id: string; simulated?: boolean }>;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export type MockCalendar = CalendarProvider & {
  /** Events "created in Google", for inspection by tests. */
  events: Map<string, CalendarEventInput & { etag: string }>;
  /** Extra busy periods tests can inject. */
  extraBusy: BusyInterval[];
  failWrites: boolean;
  authExpired: boolean;
};

/**
 * Deterministic stand-in for Google Calendar. The same date always has the same pretend commitments, so the demo
 * and the tests are repeatable. Times are wall-clock in the home zone, converted like real availability rules.
 */
export function createMockGoogleCalendar(opts: { homeTimeZone: () => Promise<string> | string; outage: () => Promise<boolean> | boolean; /** The deterministic pretend commitments (default on); tests that need a quiet calendar turn them off. */ pretendCommitments?: boolean }): MockCalendar {
  const events = new Map<string, CalendarEventInput & { etag: string }>();
  const cal: MockCalendar = {
    events, extraBusy: [], failWrites: false, authExpired: false,
    async getBusy(from, to) {
      if (cal.authExpired) throw new CalendarAuthError("Simulated expired Google credentials.");
      if (await opts.outage()) throw new CalendarUnavailableError("Simulated Google Calendar outage.");
      const tz = await opts.homeTimeZone();
      const out: BusyInterval[] = [...cal.extraBusy.filter((b) => b.end > from && b.start < to)];
      const add = (date: string, a: string, b: string, label: string) => {
        const start = localToInstant(date, a, tz), end = localToInstant(date, b, tz);
        if (end > from && start < to) out.push({ start, end, before: 0, after: 0, label });
      };
      for (let date = addDays(localDate(from, tz), -1); opts.pretendCommitments !== false && date <= addDays(localDate(to, tz), 1); date = addDays(date, 1)) {
        const n = hash(date);
        if (n % 13 === 0) add(date, "09:00", "17:00", "Travel (simulated)");
        if (n % 4 === 0) add(date, "10:00", "11:00", "Existing commitment (simulated)");
        if (n % 5 === 1) add(date, "14:00", "15:30", "Existing commitment (simulated)");
      }
      // Our own events are busy in Google too: report them, exactly like the real API would.
      for (const e of events.values()) { const s = Date.parse(e.startUtc), en = Date.parse(e.endUtc); if (en > from && s < to) out.push({ start: s, end: en, before: 0, after: 0, label: "Booking" }); }
      return out;
    },
    async upsertEvent(input) {
      if (cal.authExpired) throw new CalendarAuthError("Simulated expired Google credentials.");
      if (cal.failWrites || (await opts.outage())) throw new CalendarUnavailableError("Simulated Google write failure.");
      const etag = `"${hash(JSON.stringify(input))}"`;
      events.set(input.eventId, { ...input, etag });
      return { eventId: input.eventId, etag, url: `https://calendar.example.com/event/${input.eventId}` };
    },
    async deleteEvent(eventId) {
      if (cal.authExpired) throw new CalendarAuthError("Simulated expired Google credentials.");
      if (cal.failWrites || (await opts.outage())) throw new CalendarUnavailableError("Simulated Google write failure.");
      events.delete(eventId);
    },
  };
  return cal;
}

export type MockZoom = ZoomProvider & { meetings: Map<string, ZoomMeetingInput & { meetingId: string; joinUrl: string }>; creates: number; failing: boolean; /** Simulates the response being lost AFTER Zoom created the meeting. */ loseNextResponse: boolean };

export function createMockZoom(opts: { failing: () => Promise<boolean> | boolean }): MockZoom {
  const meetings = new Map<string, ZoomMeetingInput & { meetingId: string; joinUrl: string }>();
  const z: MockZoom = {
    meetings, creates: 0, failing: false, loseNextResponse: false,
    async createMeeting(input) {
      if (z.failing || (await opts.failing())) throw new ZoomUnavailableError("Simulated Zoom failure.");
      z.creates++;
      const meetingId = String(10_000_000_000 + (hash(`zoom:${input.marker}:${z.creates}`) % 89_999_999_999));
      // example.com is reserved for documentation: the link is visibly not a real meeting.
      const m = { ...input, meetingId, joinUrl: `https://example.com/simulated-zoom/${meetingId}` };
      meetings.set(meetingId, m);
      if (z.loseNextResponse) { z.loseNextResponse = false; throw new ZoomAmbiguousError("Simulated lost response after creation."); }
      return { meetingId, joinUrl: m.joinUrl };
    },
    async findMeetingsByMarker(marker) {
      if (z.failing || (await opts.failing())) throw new ZoomUnavailableError("Simulated Zoom failure.");
      return [...meetings.values()].filter((x) => x.marker === marker).map((m) => ({ meetingId: m.meetingId, joinUrl: m.joinUrl }));
    },
    async listMarkedMeetings() {
      if (z.failing || (await opts.failing())) throw new ZoomUnavailableError("Simulated Zoom failure.");
      return [...meetings.values()].filter((x) => x.marker.startsWith(ZOOM_MARKER_PREFIX)).map((m) => ({ meetingId: m.meetingId, joinUrl: m.joinUrl, marker: m.marker, startUtc: new Date(m.startUtc).toISOString(), durationMinutes: m.durationMinutes }));
    },
    async getMeeting(meetingId) {
      if (z.failing || (await opts.failing())) throw new ZoomUnavailableError("Simulated Zoom failure.");
      const m = meetings.get(meetingId);
      return m ? { meetingId: m.meetingId, joinUrl: m.joinUrl, startUtc: new Date(m.startUtc).toISOString(), durationMinutes: m.durationMinutes, marker: m.marker } : null;
    },
    async updateMeeting(meetingId, input) {
      if (z.failing || (await opts.failing())) throw new ZoomUnavailableError("Simulated Zoom failure.");
      const m = meetings.get(meetingId);
      if (!m) throw new ZoomGoneError();
      meetings.set(meetingId, { ...m, ...input });
    },
    async deleteMeeting(meetingId) {
      if (z.failing || (await opts.failing())) throw new ZoomUnavailableError("Simulated Zoom failure.");
      meetings.delete(meetingId);
    },
  };
  return z;
}

export type MockEmail = EmailProvider & { sent: Array<OutgoingEmail & { id: string }>; failing: boolean };

/** Delivers nothing. Records what would have been sent; a repeated idempotency key returns the first message, like the real provider. */
export function createSimulatedEmail(): MockEmail {
  const sent: Array<OutgoingEmail & { id: string }> = [];
  const m: MockEmail = {
    simulated: true, sent, failing: false,
    async send(message) {
      if (m.failing) throw new EmailSendError("Simulated email failure.");
      const prior = sent.find((s) => s.idempotencyKey === message.idempotencyKey);
      if (prior) return { id: prior.id };
      const id = `sim_${hash(message.idempotencyKey).toString(36)}${sent.length}`;
      sent.push({ ...message, id });
      return { id };
    },
  };
  return m;
}
