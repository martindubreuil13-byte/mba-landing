import fs from "node:fs";
import { ZOOM_MARKER_PREFIX, ZoomGoneError, type CalendarEventInput, type CalendarProvider, type ZoomMeetingInput, type ZoomProvider } from "../providers";

/**
 * Mock Zoom and Google Calendar whose "external world" lives in ONE JSON file, so a child process and the test that kills it see the same
 * meetings and events. That is what lets a test prove, across a real process kill, that recovery creates no duplicate and leaves no orphan.
 * Test support only. Every call is synchronous file I/O, so there is no interleaving inside one call.
 */
export type World = { meetings: Record<string, ZoomMeetingInput & { meetingId: string; joinUrl: string }>; events: Record<string, CalendarEventInput>; zoomCreates: number };

export const readWorld = (file: string): World => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { meetings: {}, events: {}, zoomCreates: 0 });
const writeWorld = (file: string, w: World) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(w)); fs.renameSync(tmp, file); };

export function createFileZoom(file: string, hooks: { /** Runs after the meeting exists in the "provider" but before the caller gets the answer (a lost response / a crash). */ afterCreate?: () => Promise<void>; /** Runs after an update has been applied in the "provider" but before the caller gets the answer. */ afterUpdate?: () => Promise<void>; /** Runs before a delete is applied (a cleanup that dies mid-way). */ beforeDelete?: () => Promise<void> } = {}): ZoomProvider {
  return {
    async createMeeting(input) {
      const w = readWorld(file); w.zoomCreates++;
      const meetingId = String(20_000_000_000 + w.zoomCreates * 7 + Math.floor(Math.random() * 1000));
      const joinUrl = `https://example.com/simulated-zoom/${meetingId}`;
      w.meetings[meetingId] = { ...input, meetingId, joinUrl }; writeWorld(file, w);
      await hooks.afterCreate?.();
      return { meetingId, joinUrl };
    },
    async findMeetingsByMarker(marker) { return Object.values(readWorld(file).meetings).filter((x) => x.marker === marker).map((m) => ({ meetingId: m.meetingId, joinUrl: m.joinUrl })); },
    async listMarkedMeetings() { return Object.values(readWorld(file).meetings).filter((x) => x.marker.startsWith(ZOOM_MARKER_PREFIX)).map((m) => ({ meetingId: m.meetingId, joinUrl: m.joinUrl, marker: m.marker, startUtc: new Date(m.startUtc).toISOString(), durationMinutes: m.durationMinutes })); },
    async getMeeting(id) { const m = readWorld(file).meetings[id]; return m ? { meetingId: m.meetingId, joinUrl: m.joinUrl, startUtc: new Date(m.startUtc).toISOString(), durationMinutes: m.durationMinutes, marker: m.marker } : null; },
    async updateMeeting(id, input) { const w = readWorld(file); if (!w.meetings[id]) throw new ZoomGoneError(); w.meetings[id] = { ...w.meetings[id], ...input }; writeWorld(file, w); await hooks.afterUpdate?.(); },
    async deleteMeeting(id) { await hooks.beforeDelete?.(); const w = readWorld(file); delete w.meetings[id]; writeWorld(file, w); },
  };
}

export function createFileCalendar(file: string, hooks: { /** Runs after the event exists in the "provider" but before the caller gets the answer. */ afterUpsert?: () => Promise<void> } = {}): CalendarProvider {
  return {
    async getBusy(from, to) { return Object.values(readWorld(file).events).map((e) => ({ start: Date.parse(e.startUtc), end: Date.parse(e.endUtc), before: 0, after: 0, label: "Booking" })).filter((b) => b.end > from && b.start < to); },
    async upsertEvent(input) {
      const w = readWorld(file); w.events[input.eventId] = input; writeWorld(file, w);
      await hooks.afterUpsert?.();
      return { eventId: input.eventId, etag: `"${Object.keys(w.events).length}"`, url: `https://calendar.example.com/event/${input.eventId}` };
    },
    async deleteEvent(eventId) { const w = readWorld(file); delete w.events[eventId]; writeWorld(file, w); },
  };
}
