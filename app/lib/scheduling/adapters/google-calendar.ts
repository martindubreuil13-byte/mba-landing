import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- third-party API responses are untyped JSON */
import { CalendarAuthError, CalendarUnavailableError, type CalendarEventInput, type CalendarProvider } from "../providers";
import type { BusyInterval } from "../types";
import { GOOGLE_PRIMARY_CALENDAR, type GoogleOAuth } from "./google-oauth";

/**
 * Google Calendar as the external availability source of truth.
 *  - getBusy   : events.freebusy over the connected calendar. Times are instants (UTC); no time-zone arithmetic is done here,
 *                so daylight saving cannot be mis-applied: Google returns the true instants.
 *  - upsertEvent: creates the event with a DETERMINISTIC id (so a retry is the same call, never a duplicate); if it exists, updates it.
 *  - deleteEvent: removes it; "already gone" is success.
 * Failure handling (all classified, none silent):
 *  - 401              -> refresh the access token once and retry; still 401 => the connection is dead: needs reconnect (CalendarAuthError)
 *  - 403 permission   -> needs reconnect (the grant lacks calendar permission)
 *  - 403 rate limit / 429 / 5xx / network -> bounded retries with backoff (honouring Retry-After), then CalendarUnavailableError
 *  - 404 on update    -> the event was deleted in Google: create it again
 * Guests are NOT invited by Google unless asked (sendUpdates=none): our own branded email is the notification.
 */
export type GoogleCalendarOptions = {
  oauth: GoogleOAuth; calendarId?: string; fetch?: typeof fetch; sleep?: (ms: number) => Promise<void>;
  baseUrl?: string; maxAttempts?: number; /** Invite the guest through Google as well (Google sends its own invitation). */ inviteGuest?: boolean;
};

const API = "https://www.googleapis.com/calendar/v3";

type ApiResult = { status: number; body: any; headers: Headers };

export class GoogleCalendarClient implements CalendarProvider {
  private f: typeof fetch;
  private sleep: (ms: number) => Promise<void>;
  private maxAttempts: number;
  constructor(private o: GoogleCalendarOptions) {
    if (o.calendarId !== undefined && o.calendarId !== GOOGLE_PRIMARY_CALENDAR) throw new CalendarAuthError("Only the designated primary calendar is allowed.");
    this.f = o.fetch ?? fetch;
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.maxAttempts = o.maxAttempts ?? 4;
  }
  private get cal() { return encodeURIComponent(GOOGLE_PRIMARY_CALENDAR); }
  private url(path: string) { return `${this.o.baseUrl ?? API}${path}`; }

  /** One API call with token refresh, classification and bounded retries. */
  private async call(method: string, path: string, body?: unknown, okStatuses: number[] = []): Promise<ApiResult> {
    let refreshed = false;
    for (let attempt = 1; ; attempt++) {
      const token = await this.o.oauth.accessToken();
      let res: Response;
      try {
        res = await this.f(this.url(path), { method, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) });   // a hung request must not hold a worker's lease; every call here is safe to repeat (deterministic event id)
      } catch {
        if (attempt >= this.maxAttempts) throw new CalendarUnavailableError("Google Calendar could not be reached.");
        await this.sleep(backoff(attempt)); continue;
      }
      const json = res.status === 204 ? null : await res.json().catch(() => null);
      if (res.ok || okStatuses.includes(res.status)) return { status: res.status, body: json, headers: res.headers };
      const reason: string = json?.error?.errors?.[0]?.reason ?? json?.error?.status ?? "";

      if (res.status === 401) {
        if (!refreshed) { refreshed = true; this.o.oauth.invalidate(); continue; }
        await this.o.oauth.markNeedsReauth("Google rejected the credential (401).");
        throw new CalendarAuthError("Google Calendar needs to be reconnected.");
      }
      if (res.status === 403 && !/rateLimit|quota/i.test(reason)) {
        await this.o.oauth.markNeedsReauth(`Google denied access (${reason || "403"}).`);
        throw new CalendarAuthError("Google Calendar needs to be reconnected.");
      }
      if (res.status === 429 || res.status >= 500 || res.status === 403) {
        if (attempt >= this.maxAttempts) throw new CalendarUnavailableError(`Google Calendar is unavailable (${res.status}).`);
        const retryAfter = Number(res.headers.get("retry-after"));
        await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : backoff(attempt)); continue;
      }
      throw new CalendarUnavailableError(`Google Calendar rejected the request (${res.status}${reason ? `, ${reason}` : ""}).`);
    }
  }

  async getBusy(from: number, to: number): Promise<BusyInterval[]> {
    const id = GOOGLE_PRIMARY_CALENDAR;
    const { body } = await this.call("POST", "/freeBusy", { timeMin: new Date(from).toISOString(), timeMax: new Date(to).toISOString(), timeZone: "UTC", items: [{ id }] });
    const entry = body?.calendars?.[id];
    // Per-calendar errors (notFound, internalError) arrive with a 200: treat as "cannot prove the time is free".
    if (!entry || entry.errors?.length) throw new CalendarUnavailableError(`Google could not report availability${entry?.errors?.[0]?.reason ? ` (${entry.errors[0].reason})` : ""}.`);
    return (entry.busy as { start: string; end: string }[]).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end), before: 0, after: 0, label: "Google Calendar" }));
  }

  private eventBody(i: CalendarEventInput) {
    return {
      summary: i.summary, description: i.description, ...(i.location ? { location: i.location } : {}),
      start: { dateTime: new Date(i.startUtc).toISOString(), timeZone: i.timeZone }, end: { dateTime: new Date(i.endUtc).toISOString(), timeZone: i.timeZone },
      status: "confirmed", transparency: "opaque", reminders: { useDefault: true },
      ...(i.attendeeEmail ? { attendees: [{ email: i.attendeeEmail }] } : {}),
      extendedProperties: { private: { mbaBookingId: i.bookingId } },
    };
  }

  async upsertEvent(i: CalendarEventInput) {
    const updates = this.o.inviteGuest && i.attendeeEmail ? "all" : "none";
    const body = this.eventBody(i);
    // Insert with our own id. 409 = it already exists (a retry, or a reschedule): update it instead.
    const created = await this.call("POST", `/calendars/${this.cal}/events?sendUpdates=${updates}`, { id: i.eventId, ...body }, [409]);
    if (created.status !== 409) return { eventId: created.body.id as string, etag: created.body.etag as string, url: (created.body.htmlLink as string) ?? null };
    const patched = await this.call("PATCH", `/calendars/${this.cal}/events/${encodeURIComponent(i.eventId)}?sendUpdates=${updates}`, body, [404]);
    if (patched.status === 404) {
      // Gone from Google since the insert said it existed (purged by hand): create it afresh under the same id.
      const again = await this.call("POST", `/calendars/${this.cal}/events?sendUpdates=${updates}`, { id: i.eventId, ...body });
      return { eventId: again.body.id as string, etag: again.body.etag as string, url: (again.body.htmlLink as string) ?? null };
    }
    return { eventId: patched.body.id as string, etag: patched.body.etag as string, url: (patched.body.htmlLink as string) ?? null };
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.call("DELETE", `/calendars/${this.cal}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, undefined, [404, 410]);
  }
}

/** 0.5s, 1s, 2s, 4s with jitter. */
const backoff = (attempt: number) => Math.round(500 * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5));
