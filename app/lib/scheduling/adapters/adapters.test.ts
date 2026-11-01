import { createHash, createHmac, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarAuthError, CalendarUnavailableError, EmailSendError, ZoomUnavailableError } from "../providers";
import { composeEmail } from "../notifications";
import type { Booking, MeetingType } from "../types";
import { GoogleCalendarClient } from "./google-calendar";
import { GOOGLE_SCOPES, GoogleOAuth, MemoryConnectionStore } from "./google-oauth";
import { renderBookingEmail, ResendEmailProvider } from "./resend-email";
import { TokenVault, VaultError } from "./token-vault";
import { verifyGoogleChannelToken, verifyZoomSignature, zoomChallengeResponse } from "./webhooks";
import { ZoomClient, ZoomGoneError } from "./zoom";

vi.mock("server-only", () => ({}));

type Call = { url: string; method: string; headers: Record<string, string>; body: string };
type Reply = { status?: number; json?: unknown; headers?: Record<string, string> } | Error;
/** A scripted fetch: replies are consumed in order per matching rule; every call is recorded. */
function fakeFetch(rules: Array<{ match: RegExp; replies: Reply[] | ((c: Call) => Reply) }>) {
  const calls: Call[] = [];
  const counters = new Map<number, number>();
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => { headers[k] = v; });
    const call: Call = { url, method: init?.method ?? "GET", headers, body: String(init?.body ?? "") };
    calls.push(call);
    const i = rules.findIndex((r) => r.match.test(`${call.method} ${url}`));
    if (i < 0) throw new Error(`unexpected request: ${call.method} ${url}`);
    const rule = rules[i];
    const n = counters.get(i) ?? 0; counters.set(i, n + 1);
    const reply = typeof rule.replies === "function" ? rule.replies(call) : rule.replies[Math.min(n, rule.replies.length - 1)];
    if (reply instanceof Error) throw reply;
    return new Response(reply.status === 204 ? null : JSON.stringify(reply.json ?? {}), { status: reply.status ?? 200, headers: { "content-type": "application/json", ...(reply.headers ?? {}) } });
  }) as typeof fetch;
  return { f, calls };
}
const noSleep = async () => undefined;

// ============================================================================================================== token vault

describe("TokenVault", () => {
  const key = () => ({ version: 1, key: randomBytes(32) });
  it("round-trips and never stores the plaintext", () => {
    const v = new TokenVault(key());
    const enc = v.encrypt("1//refresh-token-value", "google-refresh-token");
    expect(enc).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(enc).not.toContain("refresh-token-value");
    expect(v.decrypt(enc, "google-refresh-token")).toBe("1//refresh-token-value");
  });
  it("uses a fresh IV every time", () => { const v = new TokenVault(key()); expect(v.encrypt("x", "p")).not.toBe(v.encrypt("x", "p")); });
  it("detects tampering, a wrong key and a wrong purpose", () => {
    const v = new TokenVault(key());
    const enc = v.encrypt("secret", "purpose-a");
    const parts = enc.split("."); parts[3] = Buffer.from("tampered!").toString("base64url");
    expect(() => v.decrypt(parts.join("."), "purpose-a")).toThrow(VaultError);
    expect(() => v.decrypt(enc, "purpose-b")).toThrow(VaultError);
    expect(() => new TokenVault(key()).decrypt(enc, "purpose-a")).toThrow(VaultError);
    expect(() => v.decrypt("not-encrypted", "purpose-a")).toThrow(VaultError);
  });
  it("rotates keys: old values still decrypt, new writes use the new key, and old ones are flagged", () => {
    const k1 = key(), k2 = { version: 2, key: randomBytes(32) };
    const old = new TokenVault(k1).encrypt("secret", "p");
    const rotated = new TokenVault(k2, k1);
    expect(rotated.decrypt(old, "p")).toBe("secret");
    expect(rotated.needsRotation(old)).toBe(true);
    const fresh = rotated.encrypt("secret", "p");
    expect(fresh.startsWith("v2.")).toBe(true); expect(rotated.needsRotation(fresh)).toBe(false);
  });
  it("builds from the environment and rejects a missing or short key", () => {
    expect(() => TokenVault.fromEnv({})).toThrow(/SCHEDULING_TOKEN_KEY is not set/);
    expect(() => TokenVault.fromEnv({ SCHEDULING_TOKEN_KEY: Buffer.from("short").toString("base64") })).toThrow(/32 random bytes/);
    expect(TokenVault.fromEnv({ SCHEDULING_TOKEN_KEY: randomBytes(32).toString("base64") }).keyVersion).toBe(1);
  });
});

// ============================================================================================================== Google OAuth

describe("GoogleOAuth", () => {
  const config = { clientId: "client-id", clientSecret: "client-secret", redirectUri: "http://localhost:3000/api/admin/scheduling/google/callback" };
  let store: MemoryConnectionStore, vault: TokenVault, now: number;
  beforeEach(() => { store = new MemoryConnectionStore(); vault = new TokenVault({ version: 1, key: randomBytes(32) }); now = Date.parse("2026-10-30T12:00:00Z"); });
  const oauth = (f: typeof fetch) => new GoogleOAuth({ config, vault, connections: store, states: store, fetch: f, now: () => now });
  const GRANTED = GOOGLE_SCOPES.join(" ");
  const tokenOk = (over: Record<string, unknown> = {}) => ({ json: { access_token: "AT-1", refresh_token: "RT-1", expires_in: 3600, scope: GRANTED, ...over } });

  it("sends the administrator to Google with PKCE, offline access, least-privilege scopes and an unguessable state", async () => {
    const o = oauth(fakeFetch([]).f);
    const url = new URL(await o.createAuthorizationUrl());
    const q = url.searchParams;
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(q.get("client_id")).toBe("client-id"); expect(q.get("redirect_uri")).toBe(config.redirectUri);
    expect(q.get("response_type")).toBe("code"); expect(q.get("access_type")).toBe("offline"); expect(q.get("prompt")).toBe("consent");
    expect(q.get("code_challenge_method")).toBe("S256"); expect(q.get("code_challenge")).toMatch(/^[\w-]{43}$/); expect(q.get("state")!.length).toBeGreaterThanOrEqual(40);
    const scopes = q.get("scope")!.split(" ");
    expect(scopes).toContain("https://www.googleapis.com/auth/calendar.freebusy"); expect(scopes).toContain("https://www.googleapis.com/auth/calendar.events.owned");
    expect(scopes.some((s) => /gmail|contacts|drive|auth\/calendar$/.test(s))).toBe(false);
    expect(client_secret_absent(url.toString())).toBe(true);
  });

  it("completes the sign-in: verifies PKCE, checks scopes, stores only an ENCRYPTED refresh token", async () => {
    const f = fakeFetch([{ match: /POST https:\/\/oauth2\.googleapis\.com\/token/, replies: [tokenOk()] }, { match: /GET https:\/\/openidconnect\.googleapis\.com\/v1\/userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] }]);
    const o = oauth(f.f);
    const authUrl = new URL(await o.createAuthorizationUrl());
    const conn = await o.completeAuthorization({ code: "auth-code", state: authUrl.searchParams.get("state") });
    expect(conn).toMatchObject({ status: "connected", accountEmail: "martindubreuil13@gmail.com", calendarId: "primary" });
    expect(conn.refreshTokenEnc).not.toContain("RT-1");
    expect(vault.decrypt(conn.refreshTokenEnc!, "google-refresh-token")).toBe("RT-1");
    const sent = new URLSearchParams(f.calls[0].body);
    expect(sent.get("grant_type")).toBe("authorization_code"); expect(sent.get("code")).toBe("auth-code");
    // the verifier sent to Google hashes to the challenge sent earlier
    expect(createHash("sha256").update(sent.get("code_verifier")!).digest("base64url")).toBe(authUrl.searchParams.get("code_challenge"));
    expect(JSON.stringify(await store.get())).not.toContain("RT-1");
  });

  it("refuses a replayed, forged, expired or missing state", async () => {
    const f = fakeFetch([{ match: /token/, replies: [tokenOk()] }, { match: /userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] }]);
    const o = oauth(f.f);
    const state = new URL(await o.createAuthorizationUrl()).searchParams.get("state");
    await o.completeAuthorization({ code: "c", state });
    await expect(o.completeAuthorization({ code: "c", state })).rejects.toMatchObject({ code: "state_invalid" });          // replay
    await expect(o.completeAuthorization({ code: "c", state: "forged" })).rejects.toMatchObject({ code: "state_invalid" });
    await expect(o.completeAuthorization({ code: null, state })).rejects.toMatchObject({ code: "state_invalid" });
    const expiring = new URL(await o.createAuthorizationUrl()).searchParams.get("state");
    now += 11 * 60_000;
    await expect(o.completeAuthorization({ code: "c", state: expiring })).rejects.toMatchObject({ code: "state_invalid" });  // 10 minute limit
  });

  it("refuses a connection that lacks a refresh token or calendar permission, and reports a denied consent", async () => {
    for (const [reply, code] of [[tokenOk({ refresh_token: undefined }), "no_refresh_token"], [tokenOk({ scope: "openid email" }), "scope_missing"]] as const) {
      const o = oauth(fakeFetch([{ match: /token/, replies: [reply] }, { match: /userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] }]).f);
      const state = new URL(await o.createAuthorizationUrl()).searchParams.get("state");
      await expect(o.completeAuthorization({ code: "c", state })).rejects.toMatchObject({ code });
      expect(await store.get()).toBeNull();
    }
    await expect(oauth(fakeFetch([]).f).completeAuthorization({ code: null, state: null, error: "access_denied" })).rejects.toMatchObject({ code: "denied" });
  });

  it.each([
    { email: "other@gmail.com", email_verified: true, sub: "other" },
    { email: "martindubreuil13@gmail.com", email_verified: false, sub: "owner" },
    { email: "martindubreuil13@gmail.com", email_verified: true },
    {},
  ])("rejects untrusted or wrong identities before persisting credentials: %j", async (identity) => {
    const f = fakeFetch([{ match: /token/, replies: [tokenOk()] }, { match: /userinfo/, replies: [{ json: identity }] }]);
    const o = oauth(f.f);
    const state = new URL(await o.createAuthorizationUrl()).searchParams.get("state");
    await expect(o.completeAuthorization({ code: "c", state })).rejects.toMatchObject({ code: "identity_invalid" });
    expect(await store.get()).toBeNull();
    await expect(o.accessToken()).rejects.toBeInstanceOf(CalendarAuthError);
  });
  it.each([{ status: 503 }, new Error("network failure")])("fails closed when Google identity cannot be verified", async (reply) => {
    const o = oauth(fakeFetch([{ match: /token/, replies: [tokenOk()] }, { match: /userinfo/, replies: [reply] }]).f);
    await expect(o.completeAuthorization({ code: "c", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") })).rejects.toMatchObject({ code: "identity_invalid" });
    expect(await store.get()).toBeNull();
  });
  it("rejects the former broad scope without the owned-calendar scope", async () => {
    const o = oauth(fakeFetch([{ match: /token/, replies: [tokenOk({ scope: "openid email https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.events" })] }]).f);
    await expect(o.completeAuthorization({ code: "c", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") })).rejects.toMatchObject({ code: "scope_missing" });
    expect(await store.get()).toBeNull();
  });

  async function connected() {
    const f = fakeFetch([
      { match: /POST https:\/\/oauth2\.googleapis\.com\/token/, replies: [tokenOk(), { json: { access_token: "AT-2", expires_in: 3600 } }, { json: { access_token: "AT-3", expires_in: 3600 } }] },
      { match: /userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] },
    ]);
    const o = oauth(f.f);
    await o.completeAuthorization({ code: "c", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") });
    return { o, f };
  }

  it("caches the access token, refreshes when it expires, and never sends the refresh token anywhere but Google's token endpoint", async () => {
    const { o, f } = await connected();
    expect(await o.accessToken()).toBe("AT-1");                      // from the sign-in itself
    expect(await o.accessToken()).toBe("AT-1");
    now += 3600_000;                                                   // expired
    expect(await o.accessToken()).toBe("AT-2");
    expect(f.calls.filter((c) => c.url.includes("/token")).length).toBe(2);
    expect(new URLSearchParams(f.calls.at(-1)!.body).get("grant_type")).toBe("refresh_token");
    expect(f.calls.every((c) => c.url.startsWith("https://oauth2.googleapis.com") || c.url.startsWith("https://openidconnect.googleapis.com"))).toBe(true);
  });

  it("recovers from expired credentials: invalid_grant marks the connection for reconnection, stops retrying, and reconnecting fixes it", async () => {
    const f = fakeFetch([
      { match: /POST https:\/\/oauth2\.googleapis\.com\/token/, replies: [tokenOk(), { status: 400, json: { error: "invalid_grant", error_description: "Token has been expired or revoked." } }, tokenOk({ access_token: "AT-NEW", refresh_token: "RT-NEW" })] },
      { match: /userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] },
    ]);
    const o = oauth(f.f);
    await o.completeAuthorization({ code: "c", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") });
    now += 3600_000;
    await expect(o.accessToken()).rejects.toBeInstanceOf(CalendarAuthError);
    expect((await store.get())!.status).toBe("needs_reauth");
    const before = f.calls.length;
    await expect(o.accessToken()).rejects.toBeInstanceOf(CalendarAuthError);   // does NOT hammer Google again
    expect(f.calls.length).toBe(before);
    await o.completeAuthorization({ code: "c2", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") });   // reconnect
    expect((await store.get())!.status).toBe("connected");
    expect(await o.accessToken()).toBe("AT-NEW");
  });

  it("treats a Google outage as unavailable (retryable), not as a broken connection", async () => {
    const f = fakeFetch([{ match: /POST https:\/\/oauth2\.googleapis\.com\/token/, replies: [tokenOk(), { status: 503, json: {} }] }, { match: /userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] }]);
    const o = oauth(f.f);
    await o.completeAuthorization({ code: "c", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") });
    now += 3600_000;
    await expect(o.accessToken()).rejects.toBeInstanceOf(CalendarUnavailableError);
    expect((await store.get())!.status).toBe("connected");
  });

  it("re-encrypts a credential stored under a retired key as soon as it has been used, so the old key can be dropped", async () => {
    const { o } = await connected();
    const oldKey = { version: 1, key: Buffer.from(randomBytes(32)) };
    const withOld = new TokenVault(oldKey);
    const stored = (await store.get())!;
    await store.save({ ...stored, refreshTokenEnc: withOld.encrypt("RT-1", "google-refresh-token"), keyVersion: 1 });   // as if it had been saved before the rotation
    const newKey = { version: 2, key: Buffer.from(randomBytes(32)) };
    const rotated = new GoogleOAuth({ config, vault: new TokenVault(newKey, oldKey), connections: store, states: store, fetch: fakeFetch([{ match: /token/, replies: [{ json: { access_token: "AT-R", expires_in: 3600 } }] }]).f, now: () => now });
    void o;
    now += 3600_000;
    expect(await rotated.accessToken()).toBe("AT-R");
    const after = (await store.get())!;
    expect(after.keyVersion).toBe(2);
    expect(after.refreshTokenEnc!.startsWith("v2.")).toBe(true);
    expect(after.status).toBe("connected");
    // The previous key is no longer needed: a service holding only the new key can read it.
    expect(new TokenVault(newKey).decrypt(after.refreshTokenEnc!, "google-refresh-token")).toBe("RT-1");
  });

  it("does not overwrite a credential that was replaced (reconnected) while the rotation was in progress", async () => {
    const { o } = await connected();
    void o;
    const oldKey = { version: 1, key: Buffer.from(randomBytes(32)) };
    const stored = (await store.get())!;
    await store.save({ ...stored, refreshTokenEnc: new TokenVault(oldKey).encrypt("RT-1", "google-refresh-token"), keyVersion: 1 });
    const newer = new TokenVault({ version: 2, key: randomBytes(32) }, oldKey).encrypt("RT-RECONNECTED", "google-refresh-token");
    const racing = { get: async () => ({ ...(await store.get())!, refreshTokenEnc: newer }), save: store.save.bind(store), setStatus: store.setStatus.bind(store), clear: store.clear.bind(store) };
    let reads = 0;
    const connections = { ...racing, get: async () => (reads++ === 0 ? store.get() : racing.get()) } as typeof store;
    const rotated = new GoogleOAuth({ config, vault: new TokenVault({ version: 2, key: randomBytes(32) }, oldKey), connections, states: store, fetch: fakeFetch([{ match: /token/, replies: [{ json: { access_token: "AT-R", expires_in: 3600 } }] }]).f, now: () => now });
    now += 3600_000;
    await rotated.accessToken();
    const after = (await store.get())!;
    expect(after.keyVersion).toBe(1);                       // not re-encrypted over the newer credential
    expect(after.refreshTokenEnc!.startsWith("v1.")).toBe(true);
  });

  it("fails safe when the stored token cannot be decrypted (wrong key): needs reconnection", async () => {
    const { o } = await connected();
    const other = new GoogleOAuth({ config, vault: new TokenVault({ version: 1, key: randomBytes(32) }), connections: store, states: store, fetch: fakeFetch([]).f, now: () => now });
    await expect(other.accessToken(true)).rejects.toBeInstanceOf(CalendarAuthError);
    expect((await store.get())!.status).toBe("needs_reauth"); void o;
  });

  it.each([{ accountEmail: "other@gmail.com" }, { calendarId: "unrelated" }, { scopes: [] }])("refuses an invalid saved connection before using any token: %j", async (change) => {
    const { o, f } = await connected();
    store.conn = { ...store.conn!, ...change };
    const count = f.calls.length;
    await expect(o.accessToken()).rejects.toBeInstanceOf(CalendarAuthError);
    expect(store.conn!.status).toBe("needs_reauth");
    expect(f.calls).toHaveLength(count);
  });
  it("disconnects: revokes at Google and forgets the token locally", async () => {
    const f = fakeFetch([{ match: /POST https:\/\/oauth2\.googleapis\.com\/token/, replies: [tokenOk()] }, { match: /userinfo/, replies: [{ json: { email: "martindubreuil13@gmail.com", email_verified: true, sub: "owner-sub" } }] }, { match: /revoke/, replies: [{ json: {} }] }]);
    const o = oauth(f.f);
    await o.completeAuthorization({ code: "c", state: new URL(await o.createAuthorizationUrl()).searchParams.get("state") });
    await o.disconnect();
    expect(f.calls.some((c) => c.url.includes("/revoke") && new URLSearchParams(c.body).get("token") === "RT-1")).toBe(true);
    expect(await store.get()).toBeNull();
    await expect(o.accessToken()).rejects.toBeInstanceOf(CalendarAuthError);
  });
});
const client_secret_absent = (u: string) => !u.includes("client-secret");

// ============================================================================================================== Google Calendar client

describe("GoogleCalendarClient", () => {
  const event = { eventId: "mba0123456789abcdef", bookingId: "b-1", summary: "Discovery: Ada", description: "d", startUtc: "2026-11-03T14:30:00.000Z", endUtc: "2026-11-03T15:00:00.000Z", timeZone: "America/Toronto", location: "https://zoom.us/j/1", attendeeEmail: "ada@example.com" };
  function make(rules: Parameters<typeof fakeFetch>[0], opts: { inviteGuest?: boolean } = {}) {
    const f = fakeFetch(rules);
    const store = new MemoryConnectionStore();
    const vault = new TokenVault({ version: 1, key: randomBytes(32) });
    store.conn = { status: "connected", accountEmail: "martindubreuil13@gmail.com", scopes: [...GOOGLE_SCOPES], calendarId: "primary", refreshTokenEnc: vault.encrypt("RT", "google-refresh-token"), keyVersion: 1, lastError: null, connectedAt: null, lastRefreshedAt: null };
    const tokens = { match: /POST https:\/\/oauth2\.googleapis\.com\/token/, replies: (() => { let n = 0; return () => ({ json: { access_token: `AT-${++n}`, expires_in: 3600 } }); })() };
    const g = fakeFetch([tokens, ...rules.map((r) => r)]);
    void f;
    const oauth = new GoogleOAuth({ config: { clientId: "c", clientSecret: "s", redirectUri: "r" }, vault, connections: store, states: store, fetch: g.f });
    return { client: new GoogleCalendarClient({ oauth, fetch: g.f, sleep: noSleep, inviteGuest: opts.inviteGuest }), calls: g.calls, store };
  }
  const api = (m: string, p: string) => new RegExp(`${m} https://www\\.googleapis\\.com/calendar/v3${p}`);

  it("rejects any calendar override before making requests", () => {
    const fetch = vi.fn();
    expect(() => new GoogleCalendarClient({ oauth: {} as GoogleOAuth, calendarId: "unrelated@example.com", fetch })).toThrow(/primary calendar/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reads free/busy as true instants, so daylight saving cannot be misapplied", async () => {
    const { client, calls } = make([{ match: api("POST", "/freeBusy"), replies: [{ json: { calendars: { primary: { busy: [{ start: "2026-11-01T05:30:00Z", end: "2026-11-01T06:30:00Z" }, { start: "2026-03-08T07:00:00-04:00", end: "2026-03-08T08:00:00-04:00" }] } } } }] }]);
    const busy = await client.getBusy(Date.parse("2026-11-01T00:00:00Z"), Date.parse("2026-11-02T00:00:00Z"));
    expect(busy).toHaveLength(2);
    expect(busy[0]).toMatchObject({ start: Date.parse("2026-11-01T05:30:00Z"), end: Date.parse("2026-11-01T06:30:00Z") });   // 1:30 AM EDT -> 1:30 AM EST, one hour of real time
    expect(busy[1].start).toBe(Date.parse("2026-03-08T11:00:00Z"));
    const sent = JSON.parse(calls.find((c) => c.url.includes("/freeBusy"))!.body);
    expect(sent).toMatchObject({ timeMin: "2026-11-01T00:00:00.000Z", timeMax: "2026-11-02T00:00:00.000Z", timeZone: "UTC", items: [{ id: "primary" }] });
  });
  it("treats a per-calendar error inside a 200 response as 'cannot prove free', never as 'free'", async () => {
    const { client } = make([{ match: api("POST", "/freeBusy"), replies: [{ json: { calendars: { primary: { errors: [{ reason: "notFound" }], busy: [] } } } }] }]);
    await expect(client.getBusy(0, 1000)).rejects.toBeInstanceOf(CalendarUnavailableError);
  });
  it("refreshes the access token once on a 401 and retries; a second 401 means the connection is dead", async () => {
    const ok = { json: { calendars: { primary: { busy: [] } } } };
    const a = make([{ match: api("POST", "/freeBusy"), replies: [{ status: 401, json: {} }, ok] }]);
    expect(await a.client.getBusy(0, 1000)).toEqual([]);
    expect(a.calls.filter((c) => c.url.includes("/token")).length).toBe(2);
    const b = make([{ match: api("POST", "/freeBusy"), replies: [{ status: 401, json: {} }] }]);
    await expect(b.client.getBusy(0, 1000)).rejects.toBeInstanceOf(CalendarAuthError);
    expect((await b.store.get())!.status).toBe("needs_reauth");
  });
  it("sends a missing-permission 403 to reconnection, but retries a rate-limit 403", async () => {
    const perm = make([{ match: api("POST", "/freeBusy"), replies: [{ status: 403, json: { error: { errors: [{ reason: "insufficientPermissions" }] } } }] }]);
    await expect(perm.client.getBusy(0, 1000)).rejects.toBeInstanceOf(CalendarAuthError);
    const rate = make([{ match: api("POST", "/freeBusy"), replies: [{ status: 403, json: { error: { errors: [{ reason: "userRateLimitExceeded" }] } } }, { json: { calendars: { primary: { busy: [] } } } }] }]);
    expect(await rate.client.getBusy(0, 1000)).toEqual([]);
  });
  it("retries 429 and 5xx with backoff (honouring Retry-After), then gives up as unavailable without dropping the connection", async () => {
    const sleeps: number[] = [];
    const g = fakeFetch([{ match: /token/, replies: [{ json: { access_token: "AT", expires_in: 3600 } }] }, { match: api("POST", "/freeBusy"), replies: [{ status: 429, headers: { "retry-after": "2" }, json: {} }, { status: 503, json: {} }, { json: { calendars: { primary: { busy: [] } } } }] }]);
    const store = new MemoryConnectionStore(); const vault = new TokenVault({ version: 1, key: randomBytes(32) });
    store.conn = { status: "connected", accountEmail: "martindubreuil13@gmail.com", scopes: [...GOOGLE_SCOPES], calendarId: "primary", refreshTokenEnc: vault.encrypt("RT", "google-refresh-token"), keyVersion: 1, lastError: null, connectedAt: null, lastRefreshedAt: null };
    const client = new GoogleCalendarClient({ oauth: new GoogleOAuth({ config: { clientId: "c", clientSecret: "s", redirectUri: "r" }, vault, connections: store, states: store, fetch: g.f }), fetch: g.f, sleep: async (ms) => { sleeps.push(ms); } });
    expect(await client.getBusy(0, 1000)).toEqual([]);
    expect(sleeps[0]).toBe(2000); expect(sleeps).toHaveLength(2);
    const down = make([{ match: api("POST", "/freeBusy"), replies: [{ status: 500, json: {} }] }]);
    await expect(down.client.getBusy(0, 1000)).rejects.toBeInstanceOf(CalendarUnavailableError);
    expect((await down.store.get())!.status).toBe("connected");
    const net = make([{ match: api("POST", "/freeBusy"), replies: [new TypeError("fetch failed")] }]);
    await expect(net.client.getBusy(0, 1000)).rejects.toBeInstanceOf(CalendarUnavailableError);
  });
  it("creates the event with OUR deterministic id, UTC instants plus the home zone, a private booking marker, and no guest invitation by default", async () => {
    const { client, calls } = make([{ match: api("POST", "/calendars/primary/events"), replies: [{ json: { id: event.eventId, etag: '"e1"', htmlLink: "https://calendar.google.com/e" } }] }]);
    const out = await client.upsertEvent(event);
    expect(out).toEqual({ eventId: event.eventId, etag: '"e1"', url: "https://calendar.google.com/e" });
    const call = calls.find((c) => c.url.includes("/events"))!;
    expect(call.url).toContain("sendUpdates=none");
    const body = JSON.parse(call.body);
    expect(body.id).toBe(event.eventId);
    expect(body.start).toEqual({ dateTime: "2026-11-03T14:30:00.000Z", timeZone: "America/Toronto" });
    expect(body.extendedProperties.private.mbaBookingId).toBe("b-1");
    expect(body.location).toBe("https://zoom.us/j/1");
    expect(body.attendees).toEqual([{ email: "ada@example.com" }]);   // listed on the event, but not notified by Google
  });
  it("invites the guest through Google only when asked", async () => {
    const { client, calls } = make([{ match: api("POST", "/calendars/primary/events"), replies: [{ json: { id: event.eventId } }] }], { inviteGuest: true });
    await client.upsertEvent(event);
    expect(calls.find((c) => c.url.includes("/events"))!.url).toContain("sendUpdates=all");
  });
  it("is idempotent: a retried create (409) becomes an update, so there is never a duplicate event", async () => {
    const { client, calls } = make([
      { match: api("POST", "/calendars/primary/events"), replies: [{ status: 409, json: { error: { errors: [{ reason: "duplicate" }] } } }] },
      { match: api("PATCH", `/calendars/primary/events/${event.eventId}`), replies: [{ json: { id: event.eventId, etag: '"e2"' } }] },
    ]);
    expect((await client.upsertEvent(event)).etag).toBe('"e2"');
    expect(calls.filter((c) => c.method === "POST" && c.url.includes("/events")).length).toBe(1);
    expect(JSON.parse(calls.find((c) => c.method === "PATCH")!.body).start.dateTime).toBe("2026-11-03T14:30:00.000Z");
  });
  it("recreates an event that was removed from Google by hand", async () => {
    let posts = 0;
    const { client } = make([
      { match: api("POST", "/calendars/primary/events"), replies: () => (++posts === 1 ? { status: 409, json: {} } : { json: { id: event.eventId, etag: '"e3"' } }) },
      { match: api("PATCH", `/calendars/primary/events/${event.eventId}`), replies: [{ status: 404, json: {} }] },
    ]);
    expect((await client.upsertEvent(event)).etag).toBe('"e3"');
  });
  it("deletes an event, and counts one that is already gone as success", async () => {
    const a = make([{ match: api("DELETE", "/calendars/primary/events/x1"), replies: [{ status: 204 }] }]);
    await a.client.deleteEvent("x1");
    expect(a.calls.find((c) => c.method === "DELETE")!.url).toContain("sendUpdates=none");
    for (const status of [404, 410]) await make([{ match: api("DELETE", "/calendars/primary/events/x1"), replies: [{ status, json: {} }] }]).client.deleteEvent("x1");
  });
});

// ============================================================================================================== Zoom client

describe("ZoomClient", () => {
  const input = { topic: "Discovery Conversation", startUtc: "2026-11-03T14:30:00.000Z", durationMinutes: 30, timeZone: "America/Toronto", marker: "mba-booking:b-1" };
  function make(rules: Parameters<typeof fakeFetch>[0]) {
    const tokens = { match: /POST https:\/\/zoom\.us\/oauth\/token/, replies: (() => { let n = 0; return () => ({ json: { access_token: `ZT-${++n}`, expires_in: 3600 } }); })() };
    const f = fakeFetch([tokens, ...rules]);
    let now = Date.parse("2026-10-30T12:00:00Z");
    return { client: new ZoomClient({ accountId: "acct", clientId: "cid", clientSecret: "csecret", userId: "host@example.com", fetch: f.f, sleep: noSleep, now: () => now }), calls: f.calls, advance: (ms: number) => { now += ms; } };
  }
  const api = (m: string, p: string) => new RegExp(`${m} https://api\\.zoom\\.us/v2${p}`);

  it("authenticates with the account-credentials grant (Basic auth, no user sign-in) and caches the token", async () => {
    const { client, calls, advance } = make([{ match: api("GET", "/users/host%40example.com/meetings.*"), replies: [{ json: { meetings: [] } }] }]);
    await client.findMeetingsByMarker("m"); await client.findMeetingsByMarker("m");
    const tokenCalls = calls.filter((c) => c.url.includes("oauth/token"));
    expect(tokenCalls).toHaveLength(1);
    expect(tokenCalls[0].url).toContain("grant_type=account_credentials"); expect(tokenCalls[0].url).toContain("account_id=acct");
    expect(tokenCalls[0].headers.authorization).toBe(`Basic ${Buffer.from("cid:csecret").toString("base64")}`);
    advance(3600_000); await client.findMeetingsByMarker("m");
    expect(calls.filter((c) => c.url.includes("oauth/token"))).toHaveLength(2);
  });
  it("creates a scheduled meeting with a UTC start, the duration and our marker in the agenda", async () => {
    const { client, calls } = make([{ match: api("POST", "/users/host%40example.com/meetings"), replies: [{ status: 201, json: { id: 83412345678, join_url: "https://us02web.zoom.us/j/83412345678?pwd=x" } }] }]);
    expect(await client.createMeeting(input)).toEqual({ meetingId: "83412345678", joinUrl: "https://us02web.zoom.us/j/83412345678?pwd=x" });
    const body = JSON.parse(calls.find((c) => c.url.includes("/meetings"))!.body);
    expect(body).toMatchObject({ topic: "Discovery Conversation", type: 2, start_time: "2026-11-03T14:30:00Z", duration: 30, timezone: "UTC", agenda: "mba-booking:b-1" });
    expect(body.settings.waiting_room).toBe(true);
    expect(calls.find((c) => c.url.includes("/meetings"))!.headers.authorization).toBe("Bearer ZT-1");
  });
  it("finds a meeting it already created by marker, across pages, so a lost response never causes a duplicate", async () => {
    const { client } = make([{ match: api("GET", "/users/host%40example.com/meetings.*"), replies: [{ json: { meetings: [{ id: 1, agenda: "other", join_url: "u1" }], next_page_token: "p2" } }, { json: { meetings: [{ id: 2, agenda: "mba-booking:b-1", join_url: "https://zoom.example/2" }] } }] }]);
    expect(await client.findMeetingsByMarker("mba-booking:b-1")).toEqual([{ meetingId: "2", joinUrl: "https://zoom.example/2" }]);
    expect(await make([{ match: api("GET", "/users/host%40example.com/meetings.*"), replies: [{ json: { meetings: [] } }] }]).client.findMeetingsByMarker("nope")).toEqual([]);
  });
  it("updates and deletes; a deleted meeting raises ZoomGoneError on update and is success on delete", async () => {
    const { client, calls } = make([{ match: api("GET", "/meetings/55$"), replies: [{ json: { host_email: "host@example.com" } }] }, { match: api("PATCH", "/meetings/55"), replies: [{ status: 204 }] }, { match: api("DELETE", "/meetings/55.*"), replies: [{ status: 204 }] }]);
    await client.updateMeeting("55", input); await client.deleteMeeting("55");
    expect(JSON.parse(calls.find((c) => c.method === "PATCH")!.body).start_time).toBe("2026-11-03T14:30:00Z");
    const gone = make([{ match: api("GET", "/meetings/9$"), replies: [{ status: 404 }] }, { match: api("PATCH", "/meetings/9"), replies: [{ status: 404, json: { code: 3001 } }] }, { match: api("DELETE", "/meetings/9.*"), replies: [{ status: 404, json: { code: 3001 } }] }]);
    await expect(gone.client.updateMeeting("9", input)).rejects.toBeInstanceOf(ZoomGoneError);
    await gone.client.deleteMeeting("9");
  });
  it.each([{ host_email: "other@example.com" }, {}, { host_id: "another-host" }])("never mutates a meeting whose ownership is unverified: %j", async (body) => {
    const { client, calls } = make([{ match: api("GET", "/meetings/55$"), replies: [{ json: body }] }]);
    await expect(client.updateMeeting("55", input)).rejects.toThrow(/ownership/);
    await expect(client.deleteMeeting("55")).rejects.toThrow(/ownership/);
    expect(calls.some((c) => c.method === "PATCH" || c.method === "DELETE")).toBe(false);
  });
  it("allows immutable host IDs and rejects other host IDs before deletion", async () => {
    for (const host_id of ["designated-host", "other-host"]) {
      const f = fakeFetch([{ match: /oauth\/token/, replies: [{ json: { access_token: "t" } }] }, { match: /GET .*meetings\/55$/, replies: [{ json: { host_id } }] }, { match: /DELETE .*meetings\/55/, replies: [{ status: 204 }] }]);
      const client = new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "designated-host", fetch: f.f, sleep: noSleep });
      if (host_id === "designated-host") await client.deleteMeeting("55");
      else await expect(client.deleteMeeting("55")).rejects.toThrow(/ownership/);
      expect(f.calls.some((c) => c.method === "DELETE")).toBe(host_id === "designated-host");
    }
  });
  it("checks authentication and host access without writing a meeting", async () => {
    const { client, calls } = make([{ match: api("GET", "/users/host%40example.com/meetings.*"), replies: [{ json: { meetings: [] } }] }]);
    await client.checkConnection();
    expect(calls.map((c) => c.method)).toEqual(["POST", "GET"]);
    expect(calls[0].url).toContain("/oauth/token");
  });
  it("refreshes on 401, retries 429/5xx honouring Retry-After, and reports permanent errors without leaking secrets", async () => {
    const a = make([{ match: api("POST", "/users/host%40example.com/meetings"), replies: [{ status: 401, json: {} }, { status: 201, json: { id: 1, join_url: "https://z/1" } }] }]);
    expect((await a.client.createMeeting(input)).meetingId).toBe("1");
    expect(a.calls.filter((c) => c.url.includes("oauth/token"))).toHaveLength(2);
    const b = make([{ match: api("POST", "/users/host%40example.com/meetings"), replies: [{ status: 429, headers: { "retry-after": "1" }, json: {} }, { status: 201, json: { id: 2, join_url: "https://z/2" } }] }]);
    expect((await b.client.createMeeting(input)).meetingId).toBe("2");   // a 429 was rejected before any work: safe to repeat
    const down = make([{ match: api("POST", "/users/host%40example.com/meetings"), replies: [{ status: 500, json: {} }, { status: 201, json: { id: 3, join_url: "https://z/3" } }] }]);
    const failed = (await down.client.createMeeting(input).then(() => null, (e) => e)) as Error;
    expect(failed).toBeInstanceOf(ZoomUnavailableError); expect(failed.name).toBe("ZoomAmbiguousError");   // a 5xx on a create may have created the meeting: never retried here
    expect(down.calls.filter((c) => c.method === "POST" && c.url.includes("/meetings"))).toHaveLength(1);
    const bad = make([{ match: api("POST", "/users/host%40example.com/meetings"), replies: [{ status: 400, json: { code: 300, message: "Invalid access token, does not contain scopes" } }] }]);
    const err = (await bad.client.createMeeting(input).then(() => null, (e) => e)) as Error;
    expect(err).toBeInstanceOf(ZoomUnavailableError); expect(err.message).toContain("400"); expect(err.message).not.toContain("csecret");
  });
  it("refuses to be built without the host user (the \"me\" alias does not work with Server-to-Server OAuth)", () => {
    expect(() => new ZoomClient({ accountId: "a", clientId: "c", clientSecret: "s", userId: "" })).toThrow(/host's user id or email/);
  });
  it("explains refused credentials without echoing them", async () => {
    const f = fakeFetch([{ match: /oauth\/token/, replies: [{ status: 400, json: { reason: "Invalid client_id or client_secret", error: "invalid_client" } }] }]);
    const client = new ZoomClient({ accountId: "acct", clientId: "cid", clientSecret: "TOPSECRET", userId: "host@example.com", fetch: f.f, sleep: noSleep });
    const err = (await client.createMeeting(input).then(() => null, (e) => e)) as Error;
    expect(err.message).toMatch(/refused the credentials/); expect(err.message).not.toContain("TOPSECRET");
  });
});

// ============================================================================================================== webhook signatures

describe("webhook verification", () => {
  const secret = "zoom-webhook-secret";
  const now = Math.floor(Date.parse("2026-10-30T12:00:00Z") / 1000);
  const sign = (ts: number, body: string, s = secret) => `v0=${createHmac("sha256", s).update(`v0:${ts}:${body}`).digest("hex")}`;
  const body = JSON.stringify({ event: "meeting.deleted", payload: { object: { id: 123 } } });
  it("accepts a correctly signed Zoom request and rejects a wrong secret, an altered body, a missing header and a stale timestamp", () => {
    expect(verifyZoomSignature({ secret, timestamp: String(now), signature: sign(now, body), rawBody: body, nowSeconds: now })).toBe(true);
    expect(verifyZoomSignature({ secret, timestamp: String(now), signature: sign(now, body, "other"), rawBody: body, nowSeconds: now })).toBe(false);
    expect(verifyZoomSignature({ secret, timestamp: String(now), signature: sign(now, body), rawBody: body + " ", nowSeconds: now })).toBe(false);
    expect(verifyZoomSignature({ secret, timestamp: null, signature: sign(now, body), rawBody: body, nowSeconds: now })).toBe(false);
    expect(verifyZoomSignature({ secret, timestamp: String(now), signature: null, rawBody: body, nowSeconds: now })).toBe(false);
    expect(verifyZoomSignature({ secret, timestamp: String(now - 600), signature: sign(now - 600, body), rawBody: body, nowSeconds: now })).toBe(false);
    expect(verifyZoomSignature({ secret: "", timestamp: String(now), signature: sign(now, body, ""), rawBody: body, nowSeconds: now })).toBe(false);
  });
  it("answers Zoom's endpoint validation with the HMAC of the plain token", () => {
    expect(zoomChallengeResponse(secret, "abc")).toEqual({ plainToken: "abc", encryptedToken: createHmac("sha256", secret).update("abc").digest("hex") });
  });
  it("checks Google's channel token in constant time and refuses when none is configured", () => {
    expect(verifyGoogleChannelToken("tok-123", "tok-123")).toBe(true);
    expect(verifyGoogleChannelToken("tok-123", "tok-124")).toBe(false);
    expect(verifyGoogleChannelToken("tok-123", null)).toBe(false);
    expect(verifyGoogleChannelToken(undefined, "anything")).toBe(false);
  });
});

// ============================================================================================================== branded booking email

describe("booking email", () => {
  const type = { name: "Discovery Conversation", durationMinutes: 30 } as MeetingType;
  const booking = (zoom: string | null): Booking => ({ id: "b1", reference: "r", meetingTypeId: "t", startUtc: "2026-11-03T14:30:00.000Z", endUtc: "2026-11-03T15:00:00.000Z", guestName: "Ada Lovelace", guestEmail: "ada@example.com", guestMessage: "", guestTimeZone: "Europe/London", status: "confirmed", source: null, zoom: { status: zoom ? "ready" : "pending", meetingId: zoom ? "1" : null, joinUrl: zoom }, community: { state: "unseen" }, idempotencyKey: "k", createdAt: "", events: [] });

  it("renders the existing branded shell, with the Zoom button only for a real https link, and no marketing or tracking", () => {
    const withZoom = renderBookingEmail(composeEmail("confirmation", booking("https://us02web.zoom.us/j/123"), type));
    expect(withZoom.html).toContain("#6b1f1f"); expect(withZoom.html).toContain("Georgia"); expect(withZoom.html).toContain("JOIN ZOOM MEETING"); expect(withZoom.html).toContain("https://us02web.zoom.us/j/123");
    expect(withZoom.text).toContain("Tuesday, November 3, 2026"); expect(withZoom.text).toContain("Europe/London");
    for (const out of [withZoom.html, withZoom.text]) expect(out).not.toMatch(/unsubscribe|newsletter|<img|pixel|track/i);
    expect(withZoom.html).toContain("/privacy");
    const without = renderBookingEmail(composeEmail("confirmation", booking(null), type));
    expect(without.html).not.toContain("JOIN ZOOM MEETING"); expect(without.text).toMatch(/link will follow/i);
    expect(renderBookingEmail(composeEmail("confirmation", booking("http://insecure.example/j/1"), type)).html).not.toContain("JOIN ZOOM MEETING");
  });
  it("covers every email kind", () => {
    for (const k of ["confirmation", "confirmation_resend", "reschedule", "cancellation", "zoom_details"] as const) {
      const c = composeEmail(k, booking("https://zoom.us/j/1"), type); const r = renderBookingEmail(c);
      expect(c.subject.length).toBeGreaterThan(5); expect(r.html).toContain("<!doctype html>"); expect(r.text.length).toBeGreaterThan(40);
    }
    expect(composeEmail("cancellation", booking("https://zoom.us/j/1"), type).rows).toEqual([]);
  });
  it("sends through the policy-checked client with an idempotency key, reply-to and tags; maps a refusal to EmailSendError", async () => {
    const send = vi.fn(async () => ({ data: { id: "re_123" }, error: null }));
    const p = new ResendEmailProvider({ from: "Martin Dubreuil <martin@mindrasolutions.com>", resend: { emails: { send } } as never });
    const content = composeEmail("confirmation", booking("https://zoom.us/j/1"), type);
    expect(await p.send({ to: "ada@example.com", subject: content.subject, text: content.text, idempotencyKey: "sched-email/b1/confirmation/1", content, tags: { scheduling_booking: "b1", scheduling_kind: "confirmation" } })).toEqual({ id: "re_123" });
    const [payload, options] = send.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>];
    expect(options).toEqual({ idempotencyKey: "sched-email/b1/confirmation/1" });
    expect(payload).toMatchObject({ from: "Martin Dubreuil <martin@mindrasolutions.com>", to: "ada@example.com", replyTo: "martin@mindrasolutions.com", tags: [{ name: "scheduling_booking", value: "b1" }, { name: "scheduling_kind", value: "confirmation" }] });
    expect(String(payload.html)).toContain("JOIN ZOOM MEETING");
    const refuse = new ResendEmailProvider({ resend: { emails: { send: async () => ({ data: null, error: { name: "application_error", message: "Email delivery is disabled in this non-production environment" } }) } } as never });
    await expect(refuse.send({ to: "x@y.z", subject: "s", text: "t", idempotencyKey: "k", tags: { scheduling_booking: "b1", scheduling_kind: "confirmation" } })).rejects.toBeInstanceOf(EmailSendError);
  });
});
