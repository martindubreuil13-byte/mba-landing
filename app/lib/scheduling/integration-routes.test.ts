import { createHmac, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { GoogleOAuthError } from "./adapters/google-oauth";

vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));

const state = vi.hoisted(() => ({ service: null as unknown, oauth: null as unknown, allow: true as boolean, rateCalls: [] as unknown[] }));
vi.mock("./instance", () => ({ getScheduling: () => state.service, getGoogleOAuth: () => state.oauth, getIntegrationStatus: async () => ({}) }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async (...a: unknown[]) => { state.rateCalls.push(a); return state.allow; }, getClientIp: () => "203.0.113.9" }));

import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { GET as cronGet } from "@/app/api/cron/scheduling-sync/route";
import { GET as googleCallback } from "@/app/api/admin/scheduling/google/callback/route";
import { GET as googleConnect } from "@/app/api/admin/scheduling/google/connect/route";
import { POST as googleDisconnect } from "@/app/api/admin/scheduling/google/disconnect/route";
import { POST as bookPost } from "@/app/api/scheduling/book/route";
import { GET as statusGet } from "@/app/api/scheduling/booking/[reference]/route";
import { POST as googleHook } from "@/app/api/webhooks/scheduling/google/route";
import { POST as resendHook } from "@/app/api/webhooks/scheduling/resend/route";
import { POST as zoomHook } from "@/app/api/webhooks/scheduling/zoom/route";
import { buildScheduling, describeIntegrations, missingConfig, readModes } from "./integrations";
import { allowRequest, RATES } from "./rate-limit";

const NOW = Date.parse("2026-10-26T12:00:00Z");
let svc: SchedulingService; let store: MemoryStore; let zoomMock: ReturnType<typeof createMockZoom>;
beforeEach(async () => {
  vi.unstubAllEnvs(); vi.stubEnv("SCHEDULING_PROTOTYPE", "true");
  state.allow = true; state.rateCalls = [];
  const seed = await buildSeedData(NOW); seed.bookings = [];
  store = new MemoryStore(seed);
  svc = new SchedulingService({ store, now: () => NOW, calendar: createMockGoogleCalendar({ homeTimeZone: () => "America/Toronto", outage: () => false, pretendCommitments: false }), zoom: (zoomMock = createMockZoom({ failing: () => false })), email: createSimulatedEmail() });
  state.service = svc; state.oauth = null;
});

const req = (url: string, init: RequestInit & { raw?: string } = {}) => new Request(`http://localhost:3000${url}`, { method: init.method ?? "POST", headers: init.headers, body: init.raw ?? init.body });
const sign = (secret: string, ts: number, body: string) => `v0=${createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex")}`;
const adminOn = () => vi.mocked(getAdminUser).mockResolvedValue({ email: "admin@example.com" } as never);
const adminOff = () => vi.mocked(getAdminUser).mockResolvedValue(null);

describe("rate limiting of the public booking API", () => {
  it("allows normal use and answers 429 with Retry-After once the limit is exceeded", async () => {
    const mk = () => bookPost(req("/api/scheduling/book", { headers: { "content-type": "application/json" }, raw: JSON.stringify({ slug: "nope" }) }), {});
    expect((await mk()).status).toBe(400);                               // reached the handler (invalid input), i.e. not limited
    state.allow = false;
    const limited = await mk();
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
    expect(await limited.json()).toMatchObject({ code: "rate_limited" });
    expect(state.rateCalls.at(-1)).toEqual(["sched:book:203.0.113.9", 3600, 10]);
  });
  it("keys the limit by endpoint and client, and fails OPEN if the limiter itself breaks", async () => {
    expect(RATES.book).toEqual({ name: "book", windowSeconds: 3600, limit: 10 });
    expect(RATES.slots.limit).toBeGreaterThan(RATES.book.limit);
    expect(await allowRequest(req("/x"), RATES.slots)).toBe(true);
    expect((state.rateCalls.at(-1) as unknown[])[0]).toBe("sched:slots:203.0.113.9");
  });
});

describe("the sync worker endpoint", () => {
  it("refuses everything without the cron secret, and with the wrong one", async () => {
    const call = (auth?: string) => cronGet(req("/api/cron/scheduling-sync", { method: "GET", headers: auth ? { authorization: auth } : {} }), {});
    expect((await call()).status).toBe(401);                             // CRON_SECRET unset: refuses every call
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    const ok = await call("Bearer s3cret");
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ ok: true, processed: 0 });
  });
  it("runs only the due work", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    const slot = (await svc.publicSlots("discovery-conversation", undefined, new Date(NOW).toISOString(), new Date(NOW + 14 * 864e5).toISOString()))[0];
    await svc.createBooking({ slug: "discovery-conversation", startUtc: slot.startUtc, guestName: "A", guestEmail: "a@example.com", guestTimeZone: "UTC", idempotencyKey: "cron-test-key-1" });
    const out = await (await cronGet(req("/api/cron/scheduling-sync", { method: "GET", headers: { authorization: "Bearer s3cret" } }), {})).json();
    expect(out.processed).toBe(0);                                       // the booking already synced inline
  });
  it("is off (404) when the prototype is off, so deploying the code exposes nothing", async () => {
    vi.stubEnv("SCHEDULING_PROTOTYPE", ""); vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await cronGet(req("/api/cron/scheduling-sync", { method: "GET", headers: { authorization: "Bearer s3cret" } }), {})).status).toBe(404);
  });
});

describe("Zoom webhook", () => {
  const SECRET = "zoom-secret";
  const hook = (body: unknown, opts: { secret?: string; ts?: number; sig?: string | null } = {}) => {
    const raw = JSON.stringify(body); const ts = opts.ts ?? Math.floor(Date.now() / 1000);
    return zoomHook(req("/api/webhooks/scheduling/zoom", { raw, headers: { "x-zm-request-timestamp": String(ts), ...(opts.sig === null ? {} : { "x-zm-signature": opts.sig ?? sign(opts.secret ?? SECRET, ts, raw) }) } }), {});
  };
  it("refuses to process anything until a secret is configured", async () => { expect((await hook({ event: "x" })).status).toBe(503); });
  it("rejects unsigned, wrongly signed and stale requests", async () => {
    vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", SECRET);
    expect((await hook({ event: "meeting.deleted" }, { sig: null })).status).toBe(401);
    expect((await hook({ event: "meeting.deleted" }, { secret: "other" })).status).toBe(401);
    expect((await hook({ event: "meeting.deleted" }, { ts: Math.floor(Date.now() / 1000) - 3600 })).status).toBe(401);
  });
  it("answers Zoom's endpoint validation challenge", async () => {
    vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", SECRET);
    const r = await hook({ event: "endpoint.url_validation", payload: { plainToken: "tok" } });
    expect(await r.json()).toEqual({ plainToken: "tok", encryptedToken: createHmac("sha256", SECRET).update("tok").digest("hex") });
  });
  it("recreates a meeting the host deleted by hand: the booking stands, the link is replaced", async () => {
    vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", SECRET);
    const slot = (await svc.publicSlots("discovery-conversation", undefined, new Date(NOW).toISOString(), new Date(NOW + 14 * 864e5).toISOString()))[0];
    const { booking } = await svc.createBooking({ slug: "discovery-conversation", startUtc: slot.startUtc, guestName: "A", guestEmail: "a@example.com", guestTimeZone: "UTC", idempotencyKey: "zoom-hook-key-1" });
    const before = (await store.read()).externalRefs!.find((r) => r.provider === "zoom")!;
    zoomMock.meetings.delete(before.externalId!);                         // the host really did delete it in Zoom
    const out = await (await hook({ event: "meeting.deleted", payload: { object: { id: before.externalId } } })).json();
    expect(out).toEqual({ ok: true, handled: true });
    const after = (await store.read()).externalRefs!.find((r) => r.provider === "zoom")!;
    expect(after.status).toBe("synced"); expect(after.externalId).not.toBe(before.externalId);
    expect((await svc.publicBooking(booking.reference))!.status).toBe("confirmed");
    expect((await store.read()).activity.some((a) => /deleted outside MBA Scheduling/.test(a.summary))).toBe(true);
    expect((await (await hook({ event: "meeting.deleted", payload: { object: { id: "unknown" } } })).json()).handled).toBe(false);
    expect(await (await hook({ event: "meeting.started", payload: {} })).json()).toEqual({ ignored: true });
  });
});

describe("Google push webhook", () => {
  it("needs the channel token we chose, in constant time", async () => {
    const call = (token?: string) => googleHook(req("/api/webhooks/scheduling/google", { headers: { ...(token ? { "x-goog-channel-token": token } : {}), "x-goog-resource-state": "exists" } }), {});
    expect((await call("t")).status).toBe(503);
    vi.stubEnv("SCHEDULING_GOOGLE_CHANNEL_TOKEN", "chan-token");
    expect((await call()).status).toBe(401); expect((await call("wrong")).status).toBe(401);
    const ok = await call("chan-token");
    expect(ok.status).toBe(200); expect(await ok.json()).toEqual({ ok: true, state: "exists" });
  });
});

describe("Resend webhook for booking emails", () => {
  const SECRET = `whsec_${randomBytes(24).toString("base64")}`;
  let delivery = 0; // Svix gives every delivery its own id; a repeated id is a replay and is ignored
  const post = (body: unknown, good = true, fixedId?: string) => {
    const raw = JSON.stringify(body); const id = fixedId ?? `msg_${++delivery}`; const ts = String(Math.floor(Date.now() / 1000));
    const sig = createHmac("sha256", Buffer.from(SECRET.slice(6), "base64")).update(`${id}.${ts}.${raw}`).digest("base64");
    return resendHook(req("/api/webhooks/scheduling/resend", { raw, headers: { "svix-id": id, "svix-timestamp": ts, "svix-signature": good ? `v1,${sig}` : "v1,AAAA" } }), {});
  };
  it("is refused without a secret or a valid signature", async () => {
    expect((await post({ type: "email.delivered" })).status).toBe(503);
    vi.stubEnv("SCHEDULING_RESEND_WEBHOOK_SECRET", SECRET);
    expect((await post({ type: "email.delivered" }, false)).status).toBe(401);
  });
  it("records delivery for our messages only, and never lets 'delivered' overwrite a bounce", async () => {
    vi.stubEnv("SCHEDULING_RESEND_WEBHOOK_SECRET", SECRET);
    const slot = (await svc.publicSlots("discovery-conversation", undefined, new Date(NOW).toISOString(), new Date(NOW + 14 * 864e5).toISOString()))[0];
    const { booking } = await svc.createBooking({ slug: "discovery-conversation", startUtc: slot.startUtc, guestName: "A", guestEmail: "a@example.com", guestTimeZone: "UTC", idempotencyKey: "resend-hook-key-1" });
    const attempt = (await store.read()).emailAttempts![0];
    expect(await (await post({ type: "email.bounced", data: { email_id: attempt.providerMessageId } })).json()).toEqual({ ok: true });
    await post({ type: "email.delivered", data: { email_id: attempt.providerMessageId } });
    expect((await store.read()).emailAttempts![0].deliveryStatus).toBe("bounced");
    expect(await (await post({ type: "email.delivered", data: { email_id: "someone-elses-email" } })).json()).toEqual({ ignored: true });
    expect(await (await post({ type: "email.opened", data: { email_id: attempt.providerMessageId } })).json()).toEqual({ ignored: true });
    void booking;
  });
});

describe("Google connection endpoints", () => {
  const fakeOauth = (over: Record<string, unknown> = {}) => ({ createAuthorizationUrl: async () => "https://accounts.google.com/o/oauth2/v2/auth?state=abc", completeAuthorization: vi.fn(async () => ({})), disconnect: vi.fn(async () => undefined), ...over });
  it("require the signed-in administrator", async () => {
    adminOff(); state.oauth = fakeOauth();
    expect((await googleConnect(req("/api/admin/scheduling/google/connect", { method: "GET" }), {})).status).toBe(401);
    expect((await googleCallback(req("/api/admin/scheduling/google/callback?code=c&state=s", { method: "GET" }), {})).status).toBe(401);
    expect((await googleDisconnect(req("/api/admin/scheduling/google/disconnect"), {})).status).toBe(401);
  });
  it("say so plainly in mock mode instead of pretending to connect", async () => {
    adminOn(); state.oauth = null;
    const r = await googleConnect(req("/api/admin/scheduling/google/connect", { method: "GET" }), {});
    expect(r.status).toBe(409); expect((await r.json()).error).toMatch(/mock mode/);
  });
  it("connect redirects to Google; the callback returns to the Integrations page with a safe outcome", async () => {
    adminOn(); const oauth = fakeOauth(); state.oauth = oauth;
    const go = await googleConnect(req("/api/admin/scheduling/google/connect", { method: "GET" }), {});
    expect(go.status).toBe(302); expect(go.headers.get("location")).toContain("accounts.google.com");
    const ok = await googleCallback(req("/api/admin/scheduling/google/callback?code=c&state=s", { method: "GET" }), {});
    expect(ok.headers.get("location")).toBe("http://localhost:3000/admin/scheduling/integrations?google=connected");
    expect(oauth.completeAuthorization).toHaveBeenCalledWith({ code: "c", state: "s", error: null });
    state.oauth = fakeOauth({ completeAuthorization: async () => { throw new GoogleOAuthError("secret detail", "state_invalid"); } });
    const bad = await googleCallback(req("/api/admin/scheduling/google/callback?code=c&state=forged", { method: "GET" }), {});
    expect(bad.headers.get("location")).toBe("http://localhost:3000/admin/scheduling/integrations?google=error&reason=state_invalid");
    expect(bad.headers.get("location")).not.toContain("secret");
    state.oauth = fakeOauth({ completeAuthorization: async () => { throw new Error("db password leaked?"); } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await googleCallback(req("/api/admin/scheduling/google/callback?code=c&state=s", { method: "GET" }), {})).headers.get("location")).toContain("reason=failed");
  });
  it("disconnect revokes and forgets", async () => {
    adminOn(); const oauth = fakeOauth(); state.oauth = oauth;
    expect((await googleDisconnect(req("/api/admin/scheduling/google/disconnect"), {})).status).toBe(200);
    expect(oauth.disconnect).toHaveBeenCalled();
  });
});

describe("integration modes and configuration", () => {
  it("default to the prototype: file store, mock Google, mock Zoom, simulated email", () => {
    expect(readModes({})).toEqual({ backend: "file", google: "mock", zoom: "mock", email: "simulated" });
    expect(readModes({ SCHEDULING_GOOGLE: "yes", SCHEDULING_ZOOM: "true", SCHEDULING_EMAIL: "on", SCHEDULING_BACKEND: "postgres" })).toEqual({ backend: "file", google: "mock", zoom: "mock", email: "simulated" });
  });
  it("go live only on the exact words, one integration at a time", () => {
    expect(readModes({ SCHEDULING_GOOGLE: "live" }).google).toBe("live");
    expect(readModes({ SCHEDULING_GOOGLE: "live" }).zoom).toBe("mock");
    expect(readModes({ SCHEDULING_EMAIL: "resend", SCHEDULING_BACKEND: "supabase" })).toMatchObject({ email: "resend", backend: "supabase" });
  });
  it("name every missing variable (never a value) for each live mode", () => {
    const live = readModes({ SCHEDULING_GOOGLE: "live", SCHEDULING_ZOOM: "live", SCHEDULING_EMAIL: "resend", SCHEDULING_BACKEND: "supabase" });
    const missing = missingConfig(live, {});
    expect(missing.google).toEqual(["SCHEDULING_GOOGLE_CLIENT_ID", "SCHEDULING_GOOGLE_CLIENT_SECRET", "SCHEDULING_TOKEN_KEY"]);
    expect(missing.zoom).toEqual(["SCHEDULING_ZOOM_ACCOUNT_ID", "SCHEDULING_ZOOM_CLIENT_ID", "SCHEDULING_ZOOM_CLIENT_SECRET", "SCHEDULING_ZOOM_USER_ID"]);
    expect(missing.email).toEqual(["RESEND_API_KEY"]); expect(missing.backend).toEqual([]);   // validated by getServiceClient
    expect(missingConfig(live, { SCHEDULING_GOOGLE_CLIENT_ID: "x", SCHEDULING_GOOGLE_CLIENT_SECRET: "y", SCHEDULING_TOKEN_KEY: "z" }).google).toEqual([]);
    expect(missingConfig(readModes({ SCHEDULING_GOOGLE: "live" }), { SCHEDULING_GOOGLE_CLIENT_ID: "x", SCHEDULING_GOOGLE_CLIENT_SECRET: "y", SCHEDULING_TOKEN_KEY: "z" }).google[0]).toMatch(/SCHEDULING_BACKEND=supabase/);
    expect(missingConfig(readModes({}), {})).toEqual({ backend: [], google: [], zoom: [], email: [] });
  });
  it("refuses to start a half-configured live mode, naming what is missing and leaking nothing", () => {
    expect(() => buildScheduling({ SCHEDULING_ZOOM: "live", SCHEDULING_ZOOM_ACCOUNT_ID: "acct-secret-value" })).toThrow(/Missing: zoom: SCHEDULING_ZOOM_CLIENT_ID, SCHEDULING_ZOOM_CLIENT_SECRET, SCHEDULING_ZOOM_USER_ID/);
    try { buildScheduling({ SCHEDULING_ZOOM: "live", SCHEDULING_ZOOM_ACCOUNT_ID: "acct-secret-value" }); } catch (e) { expect((e as Error).message).not.toContain("acct-secret-value"); }
  });
  it("reports Zoom connected only after authentication and host access pass, without exposing errors", async () => {
    const env = { SCHEDULING_ZOOM: "live", SCHEDULING_ZOOM_ACCOUNT_ID: "a", SCHEDULING_ZOOM_CLIENT_ID: "c", SCHEDULING_ZOOM_CLIENT_SECRET: "secret-value", SCHEDULING_ZOOM_USER_ID: "host@example.com" };
    const check = vi.fn(async () => undefined);
    expect((await describeIntegrations(null, env, check)).zoom.state).toBe("connected");
    expect(check).toHaveBeenCalledOnce();
    const failed = await describeIntegrations(null, env, async () => { throw new Error("secret-value"); });
    expect(failed.zoom.state).toBe("connection_failed");
    expect(JSON.stringify(failed)).not.toContain("secret-value");
  });
  it("describes the integrations for the admin without exposing a secret", async () => {
    const mock = await describeIntegrations(null, {});
    expect(mock).toMatchObject({ google: { state: "mock" }, zoom: { state: "mock" }, email: { state: "simulated", from: null }, backend: { state: "file" } });
    const env = { SCHEDULING_GOOGLE: "live", SCHEDULING_BACKEND: "supabase", SCHEDULING_GOOGLE_CLIENT_ID: "id", SCHEDULING_GOOGLE_CLIENT_SECRET: "TOP-SECRET", SCHEDULING_TOKEN_KEY: "abc" };
    const conn = { get: async () => ({ status: "needs_reauth" as const, accountEmail: "owner@example.com", scopes: [], calendarId: "primary", refreshTokenEnc: "v1.x.y.z", keyVersion: 1, lastError: "revoked", connectedAt: "2026-10-01T00:00:00Z", lastRefreshedAt: null }), save: async () => undefined, setStatus: async () => undefined, clear: async () => undefined };
    const live = await describeIntegrations(conn, env);
    expect(live.google).toMatchObject({ state: "needs_reauth", accountEmail: "owner@example.com", lastError: "revoked" });
    expect(JSON.stringify(live)).not.toContain("TOP-SECRET"); expect(JSON.stringify(live)).not.toContain("v1.x.y.z");
    expect((await describeIntegrations(null, { SCHEDULING_GOOGLE: "live" })).google.state).toBe("not_configured");
    expect((await describeIntegrations(conn, { ...env })).google.redirectUri).toContain("/api/admin/scheduling/google/callback");
  });
});

describe("webhook replay protection", () => {
  const SECRET = "zoom-secret";
  const deliver = (raw: string, ts: number, sig = sign(SECRET, ts, raw)) => zoomHook(req("/api/webhooks/scheduling/zoom", { raw, headers: { "x-zm-request-timestamp": String(ts), "x-zm-signature": sig } }), {});
  it("honours an identical, validly signed Zoom delivery once; an exact replay inside the signature window changes nothing", async () => {
    vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", SECRET);
    const slot = (await svc.publicSlots("discovery-conversation", undefined, new Date(NOW).toISOString(), new Date(NOW + 14 * 864e5).toISOString()))[0];
    await svc.createBooking({ slug: "discovery-conversation", startUtc: slot.startUtc, guestName: "A", guestEmail: "a@example.com", guestTimeZone: "UTC", idempotencyKey: "replay-key-1" });
    const ref = (await store.read()).externalRefs!.find((r) => r.provider === "zoom")!;
    zoomMock.meetings.delete(ref.externalId!);
    const raw = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: ref.externalId } } }); const ts = Math.floor(Date.now() / 1000);
    expect(await (await deliver(raw, ts)).json()).toEqual({ ok: true, handled: true });
    expect(zoomMock.creates).toBe(2);                                                                  // the meeting was recreated once
    for (let i = 0; i < 3; i++) expect(await (await deliver(raw, ts)).json()).toEqual({ ok: true, duplicate: true });
    expect(zoomMock.creates).toBe(2);                                                                  // replays recreate nothing
    const other = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: "unknown" } } });
    expect(await (await deliver(other, ts)).json()).toEqual({ ok: true, handled: false });             // a different, genuine delivery is still processed
  });
  it("still refuses a tampered or stale replay before the ledger is consulted", async () => {
    vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", SECRET);
    const raw = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: "1" } } }); const ts = Math.floor(Date.now() / 1000);
    expect((await deliver(raw, ts, "v0=deadbeef")).status).toBe(401);
    expect((await deliver(raw, ts - 3600)).status).toBe(401);
  });
  it("acknowledges a repeated Google notification (same channel and message number) without treating it as new", async () => {
    vi.stubEnv("SCHEDULING_GOOGLE_CHANNEL_TOKEN", "chan-token");
    const call = (msg: string) => googleHook(req("/api/webhooks/scheduling/google", { raw: "", headers: { "x-goog-channel-token": "chan-token", "x-goog-channel-id": "ch-1", "x-goog-message-number": msg, "x-goog-resource-state": "exists" } }), {});
    expect(await (await call("7")).json()).toEqual({ ok: true, state: "exists" });
    expect(await (await call("7")).json()).toEqual({ ok: true, duplicate: true });
    expect(await (await call("8")).json()).toEqual({ ok: true, state: "exists" });
  });
  it("acknowledges a repeated Resend (Svix) delivery id without reprocessing it", async () => {
    const SECRETR = `whsec_${randomBytes(24).toString("base64")}`;
    vi.stubEnv("SCHEDULING_RESEND_WEBHOOK_SECRET", SECRETR);
    const raw = JSON.stringify({ type: "email.opened", data: { email_id: "x" } }); const ts = String(Math.floor(Date.now() / 1000)); const id = "msg_replay_1";
    const sig = createHmac("sha256", Buffer.from(SECRETR.slice(6), "base64")).update(`${id}.${ts}.${raw}`).digest("base64");
    const send = () => resendHook(req("/api/webhooks/scheduling/resend", { raw, headers: { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}` } }), {});
    expect(await (await send()).json()).toEqual({ ignored: true });
    expect(await (await send()).json()).toEqual({ ok: true, duplicate: true });
  });
});

describe("the public booking status endpoint (polled by the confirmation page)", () => {
  const status = (reference: string) => statusGet(req(`/api/scheduling/booking/${reference}`, { method: "GET" }), { params: Promise.resolve({ reference }) });
  it("returns only what the confirmation page shows, with an honest progress state, and 404 for anything unknown", async () => {
    const slot = (await svc.publicSlots("discovery-conversation", undefined, new Date(NOW).toISOString(), new Date(NOW + 14 * 864e5).toISOString()))[0];
    const { booking } = await svc.createBooking({ slug: "discovery-conversation", startUtc: slot.startUtc, guestName: "Ada Lovelace", guestEmail: "ada@example.com", guestMessage: "private note", guestTimeZone: "UTC", idempotencyKey: "status-key-1" });
    const r = await status(booking.reference);
    expect(r.status).toBe(200); expect(r.headers.get("cache-control")).toMatch(/no-store/);
    const body = await r.json(); const text = JSON.stringify(body);
    expect(body.booking).toMatchObject({ reference: booking.reference, status: "confirmed", progress: "ready" });
    expect(text).not.toMatch(/ada@example\.com|private note|Lovelace|"id"|guestEmail/);               // no email, message, surname or internal id
    expect((await status("no-such-reference")).status).toBe(404);
    expect((await status("x".repeat(65))).status).toBe(404);
  });
  it("is rate limited per client and is off outside the prototype switch", async () => {
    state.allow = false;
    const limited = await status("anything"); expect(limited.status).toBe(429);
    expect(state.rateCalls.at(-1)).toEqual(["sched:status:203.0.113.9", 60, 60]);
    state.allow = true; vi.stubEnv("SCHEDULING_PROTOTYPE", ""); vi.stubEnv("NODE_ENV", "production");
    expect((await status("anything")).status).toBe(404);
  });
});
