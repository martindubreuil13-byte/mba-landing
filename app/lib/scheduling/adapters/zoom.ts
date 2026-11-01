/* eslint-disable @typescript-eslint/no-explicit-any -- third-party API responses are untyped JSON */
import "server-only";
import { ZOOM_MARKER_PREFIX, ZoomAmbiguousError, ZoomGoneError, ZoomUnavailableError, type MarkedMeeting, type ZoomMeeting, type ZoomMeetingInput, type ZoomMeetingState, type ZoomProvider } from "../providers";

export { ZoomGoneError, ZoomAmbiguousError };

/**
 * Zoom through a Server-to-Server OAuth app (account credentials grant): no user sign-in, no refresh tokens, nothing to expire silently.
 *  - createMeeting        : a scheduled meeting (type 2) whose agenda carries our marker, so a lost response can be recognised
 *  - findMeetingsByMarker : lists the host's scheduled meetings and returns EVERY one carrying the marker (used BEFORE creating, to avoid a duplicate,
 *                           and when cleaning up, to remove all of them)
 *  - updateMeeting / deleteMeeting for reschedule and cancel; "already gone" is success for delete
 * Failures are classified. A create is NOT idempotent: Zoom has no idempotency key, so a request that may have been processed (network error, timeout,
 * 5xx, an unusable success) is reported as ZoomAmbiguousError and is NEVER retried here; the sync engine decides, after looking for the meeting by
 * its marker. Only a rejection that proves nothing was created is retried inside a create: 401 (fetch a new token once) and 429 (honouring Retry-After).
 * Reads, updates and deletes are safe to repeat and retry 429 / 5xx / network failures with bounded backoff. Every request has a deadline.
 * A meeting that no longer exists when we update it raises ZoomGoneError so the caller creates a new one.
 */
export type ZoomClientOptions = {
  accountId: string; clientId: string; clientSecret: string;
  /** The host's Zoom user id or email. REQUIRED: with Server-to-Server OAuth there is no signed-in user, so the alias "me" does not work. */
  userId: string;
  fetch?: typeof fetch; sleep?: (ms: number) => Promise<void>; now?: () => number; maxAttempts?: number; apiBase?: string; tokenUrl?: string;
  /** Deadline for each HTTP request. A request that hits it has an unknown outcome. Default 15 s. */
  timeoutMs?: number;
};

/** Zoom reports start_time as an ISO UTC string and duration in minutes; either may be missing. */
const stateOf = (m: any): ZoomMeetingState => ({
  meetingId: m.id === undefined || m.id === null ? "" : String(m.id), joinUrl: String(m.join_url ?? ""),
  startUtc: typeof m.start_time === "string" && !Number.isNaN(Date.parse(m.start_time)) ? new Date(m.start_time).toISOString() : null,
  durationMinutes: typeof m.duration === "number" && Number.isFinite(m.duration) && m.duration > 0 ? m.duration : null,
  marker: typeof m.agenda === "string" ? m.agenda : null,
});
const startTime = (iso: string) => new Date(iso).toISOString().replace(/\.\d{3}Z$/, "Z");

export class ZoomClient implements ZoomProvider {
  private f: typeof fetch; private sleep: (ms: number) => Promise<void>; private now: () => number; private maxAttempts: number; private timeoutMs: number;
  private cached: { token: string; expiresAt: number } | null = null;
  constructor(private o: ZoomClientOptions) {
    if (!o.userId || o.userId.toLowerCase() === "me") throw new Error("ZoomClient needs the host's user id or email (Server-to-Server OAuth cannot use \"me\").");
    this.f = o.fetch ?? fetch; this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))); this.now = o.now ?? Date.now; this.maxAttempts = o.maxAttempts ?? 4; this.timeoutMs = o.timeoutMs ?? 15_000;
  }
  private get user() { return encodeURIComponent(this.o.userId); }

  private async token(force = false): Promise<string> {
    if (!force && this.cached && this.cached.expiresAt > this.now()) return this.cached.token;
    let r: Response;
    try {
      r = await this.f(`${this.o.tokenUrl ?? "https://zoom.us/oauth/token"}?${new URLSearchParams({ grant_type: "account_credentials", account_id: this.o.accountId })}`, {
        method: "POST", headers: { authorization: `Basic ${Buffer.from(`${this.o.clientId}:${this.o.clientSecret}`).toString("base64")}` }, signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch { throw new ZoomUnavailableError("Zoom could not be reached."); }
    const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; reason?: string; error?: string };
    if (!r.ok || !j.access_token) throw new ZoomUnavailableError(`Zoom refused the credentials (${r.status}${j.reason || j.error ? `, ${j.reason ?? j.error}` : ""}). Check the account id, client id and secret.`);
    this.cached = { token: j.access_token, expiresAt: this.now() + (j.expires_in ?? 3600) * 1000 - 60_000 };
    return j.access_token;
  }

  private async call(method: string, path: string, body?: unknown, okStatuses: number[] = [], opts: { creates?: boolean } = {}): Promise<{ status: number; body: any }> {
    let refreshed = false;
    const unknown = opts.creates === true;   // a create whose outcome we cannot see is AMBIGUOUS, not "failed"
    for (let attempt = 1; ; attempt++) {
      const token = await this.token();   // a failure here happens before the request is made: nothing can have been created
      let res: Response;
      try { res = await this.f(`${this.o.apiBase ?? "https://api.zoom.us/v2"}${path}`, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(this.timeoutMs) }); }
      catch {
        if (unknown) throw new ZoomAmbiguousError("Zoom did not answer in time. The meeting may or may not have been created.");
        if (attempt >= this.maxAttempts) throw new ZoomUnavailableError("Zoom could not be reached."); await this.sleep(backoff(attempt)); continue;
      }
      const json = res.status === 204 ? null : await res.json().catch(() => null);
      if (res.ok || okStatuses.includes(res.status)) return { status: res.status, body: json };
      if (res.status === 401 && !refreshed) { refreshed = true; this.cached = null; await this.token(true); continue; }   // rejected before any work: safe to repeat
      if (res.status === 429) {   // rate limited: rejected before any work, safe to repeat even for a create
        if (attempt >= this.maxAttempts) throw new ZoomUnavailableError("Zoom is unavailable (429).");
        const ra = Number(res.headers.get("retry-after"));
        await this.sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 30_000) : backoff(attempt)); continue;
      }
      if (res.status >= 500) {
        if (unknown) throw new ZoomAmbiguousError(`Zoom answered with an error (${res.status}). The meeting may or may not have been created.`);
        if (attempt >= this.maxAttempts) throw new ZoomUnavailableError(`Zoom is unavailable (${res.status}).`);
        await this.sleep(backoff(attempt)); continue;
      }
      throw new ZoomUnavailableError(`Zoom rejected the request (${res.status}${json?.code ? `, code ${json.code}` : ""}${json?.message ? `: ${String(json.message).slice(0, 120)}` : ""}).`);
    }
  }

  /** Read-only health check: proves token issuance and access to the designated host's meetings. */
  async checkConnection(): Promise<void> {
    await this.call("GET", `/users/${this.user}/meetings?type=upcoming&page_size=1`);
  }

  /** The meeting's body, or null if Zoom has no such meeting. Throws if it does not belong to the configured host. */
  private async fetchOwned(meetingId: string): Promise<any | null> {
    const r = await this.call("GET", `/meetings/${encodeURIComponent(meetingId)}`, undefined, [404]);
    if (r.status === 404) return null;
    const host = this.o.userId;
    const matches = host.includes("@")
      ? typeof r.body?.host_email === "string" && r.body.host_email.toLowerCase() === host.toLowerCase()
      : typeof r.body?.host_id === "string" && r.body.host_id === host;
    if (!matches) throw new ZoomUnavailableError("Meeting ownership could not be verified for the configured Zoom host. No changes were made.");
    return r.body;
  }
  private async ownsMeeting(meetingId: string): Promise<boolean> { return (await this.fetchOwned(meetingId)) !== null; }

  async getMeeting(meetingId: string): Promise<ZoomMeetingState | null> {
    const m = await this.fetchOwned(meetingId);
    return m ? stateOf(m) : null;
  }

  private payload(i: ZoomMeetingInput) {
    return { topic: i.topic, type: 2, start_time: startTime(i.startUtc), duration: i.durationMinutes, timezone: "UTC", agenda: i.marker, settings: { join_before_host: false, waiting_room: true, host_video: true, participant_video: true, mute_upon_entry: false, auto_recording: "none" } };
  }

  async createMeeting(i: ZoomMeetingInput): Promise<ZoomMeeting> {
    const { body } = await this.call("POST", `/users/${this.user}/meetings`, this.payload(i), [], { creates: true });
    // A success we cannot use is still a success on Zoom's side: the meeting exists. Report it as unknown so the marker lookup adopts it.
    if (!body?.id || !body?.join_url) throw new ZoomAmbiguousError("Zoom answered without a usable meeting. It may have been created.");
    return { meetingId: String(body.id), joinUrl: String(body.join_url) };
  }

  /** Every upcoming meeting of the host. Throws if there are more than the pages we read: a partial list must never read as "not found". */
  private async listUpcoming(): Promise<any[]> {
    const all: any[] = [];
    let next = "";
    for (let page = 0; page < 5; page++) {
      const { body } = await this.call("GET", `/users/${this.user}/meetings?type=upcoming&page_size=300${next ? `&next_page_token=${encodeURIComponent(next)}` : ""}`);
      all.push(...((body?.meetings as any[] | undefined) ?? []));
      next = body?.next_page_token ?? "";
      if (!next) return all;
    }
    throw new ZoomUnavailableError("The host has too many upcoming meetings to examine completely. Nothing was changed.");
  }

  async findMeetingsByMarker(marker: string): Promise<ZoomMeeting[]> {
    return (await this.listUpcoming()).filter((m) => m.agenda === marker).map((m) => ({ meetingId: String(m.id), joinUrl: String(m.join_url) }));
  }

  async listMarkedMeetings(): Promise<MarkedMeeting[]> {
    return (await this.listUpcoming()).filter((m) => typeof m.agenda === "string" && m.agenda.startsWith(ZOOM_MARKER_PREFIX)).map((m) => ({ ...stateOf(m), marker: m.agenda as string }));
  }

  async updateMeeting(meetingId: string, i: ZoomMeetingInput): Promise<void> {
    if (!(await this.ownsMeeting(meetingId))) throw new ZoomGoneError();
    const r = await this.call("PATCH", `/meetings/${encodeURIComponent(meetingId)}`, this.payload(i), [404]);
    if (r.status === 404) throw new ZoomGoneError();
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    if (!(await this.ownsMeeting(meetingId))) return;
    await this.call("DELETE", `/meetings/${encodeURIComponent(meetingId)}?schedule_for_reminder=false`, undefined, [404]);
  }
}

const backoff = (attempt: number) => Math.round(500 * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5));
