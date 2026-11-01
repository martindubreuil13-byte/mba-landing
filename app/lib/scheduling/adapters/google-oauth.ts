import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { CalendarAuthError, CalendarUnavailableError } from "../providers";
import { TokenVault } from "./token-vault";

/**
 * Google OAuth 2.0 (authorization code + PKCE) for ONE administrator account, with server-side token handling.
 * Everything that touches the network goes through an injected `fetch`, so it is tested without Google.
 *
 * Security properties:
 *  - `state` is random, stored only as a hash, expires in 10 minutes and is single-use (CSRF / replay protection)
 *  - PKCE: the code verifier never leaves the server (stored encrypted); the challenge goes to Google
 *  - the refresh token is encrypted (TokenVault) before it is stored; the access token is memory-only
 *  - offline access with a forced consent prompt, so Google always returns a refresh token
 *  - the granted scopes are verified: a connection that lacks calendar permission is refused, not silently half-working
 */
export const GOOGLE_OWNER_EMAIL = "martindubreuil13@gmail.com";
export const GOOGLE_PRIMARY_CALENDAR = "primary";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

/** Least privilege: availability and events. NOT full calendar access, NOT contacts, NOT Gmail. */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events.owned",
  "openid", "email",
] as const;
export const REQUIRED_CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.freebusy", "https://www.googleapis.com/auth/calendar.events.owned"] as const;

export type GoogleConnection = {
  status: "connected" | "needs_reauth" | "revoked";
  accountEmail: string | null; scopes: string[]; calendarId: string;
  /** Encrypted by TokenVault. Never the plain token. */
  refreshTokenEnc: string | null; keyVersion: number; lastError: string | null; connectedAt: string | null; lastRefreshedAt: string | null;
};
export interface ConnectionStore {
  get(): Promise<GoogleConnection | null>;
  save(c: GoogleConnection): Promise<void>;
  setStatus(status: GoogleConnection["status"], error: string | null): Promise<void>;
  clear(): Promise<void>;
}
export interface OAuthStateStore {
  put(rec: { stateHash: string; verifierEnc: string; expiresAt: string }): Promise<void>;
  /** Atomic and single-use: returns the record once, then never again. Expired records are not returned. */
  consume(stateHash: string, nowIso: string): Promise<{ verifierEnc: string } | null>;
}

export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string };
export class GoogleOAuthError extends Error {
  constructor(message: string, public code: "state_invalid" | "no_refresh_token" | "scope_missing" | "exchange_failed" | "denied" | "identity_invalid") { super(message); this.name = "GoogleOAuthError"; }
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const STATE_TTL_MS = 10 * 60_000;
const VERIFIER_PURPOSE = "google-oauth-verifier";
export const REFRESH_PURPOSE = "google-refresh-token";

type Deps = { config: GoogleConfig; vault: TokenVault; connections: ConnectionStore; states: OAuthStateStore; fetch?: typeof fetch; now?: () => number };

export class GoogleOAuth {
  private f: typeof fetch;
  private now: () => number;
  private cached: { token: string; expiresAt: number } | null = null;
  constructor(private d: Deps) { this.f = d.fetch ?? fetch; this.now = d.now ?? Date.now; }

  // ------------------------------------------------------------------------------------------ connect / reconnect

  /** Step 1: the URL to send the administrator to. Calling it again (reconnect) is always safe. */
  async createAuthorizationUrl(): Promise<string> {
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(64).toString("base64url");
    await this.d.states.put({ stateHash: sha256(state).toString("hex"), verifierEnc: this.d.vault.encrypt(verifier, VERIFIER_PURPOSE), expiresAt: new Date(this.now() + STATE_TTL_MS).toISOString() });
    const u = new URL(GOOGLE_AUTH_URL);
    u.search = new URLSearchParams({
      client_id: this.d.config.clientId, redirect_uri: this.d.config.redirectUri, response_type: "code", scope: GOOGLE_SCOPES.join(" "),
      login_hint: GOOGLE_OWNER_EMAIL, access_type: "offline", prompt: "consent", include_granted_scopes: "false", state,
      code_challenge: sha256(verifier).toString("base64url"), code_challenge_method: "S256",
    }).toString();
    return u.toString();
  }

  /** Step 2: Google sent the administrator back with `code` and `state`. */
  async completeAuthorization(params: { code: string | null; state: string | null; error?: string | null }): Promise<GoogleConnection> {
    if (params.error) throw new GoogleOAuthError(params.error === "access_denied" ? "Access was not granted." : `Google returned: ${params.error}`, "denied");
    if (!params.code || !params.state) throw new GoogleOAuthError("The response from Google is incomplete.", "state_invalid");
    const record = await this.d.states.consume(sha256(params.state).toString("hex"), new Date(this.now()).toISOString());
    if (!record) throw new GoogleOAuthError("This sign-in link has expired or was already used. Start the connection again.", "state_invalid");
    const verifier = this.d.vault.decrypt(record.verifierEnc, VERIFIER_PURPOSE);

    const res = await this.token({ grant_type: "authorization_code", code: params.code, redirect_uri: this.d.config.redirectUri, code_verifier: verifier });
    if (!res.refresh_token) throw new GoogleOAuthError("Google did not return a refresh token. Remove this app's access in your Google account (Security, Third-party access) and connect again.", "no_refresh_token");
    const scopes = (res.scope ?? "").split(" ").filter(Boolean);
    const missing = REQUIRED_CALENDAR_SCOPES.filter((s) => !scopes.includes(s));
    if (missing.length) throw new GoogleOAuthError(`Calendar permission was not granted (${missing.map((m) => m.split("/").pop()).join(", ")}). Connect again and tick every box.`, "scope_missing");

    const email = await this.userEmail(res.access_token);
    const conn: GoogleConnection = {
      status: "connected", accountEmail: email, scopes, calendarId: GOOGLE_PRIMARY_CALENDAR,
      refreshTokenEnc: this.d.vault.encrypt(res.refresh_token, REFRESH_PURPOSE), keyVersion: this.d.vault.keyVersion,
      lastError: null, connectedAt: new Date(this.now()).toISOString(), lastRefreshedAt: new Date(this.now()).toISOString(),
    };
    await this.d.connections.save(conn);
    this.cached = { token: res.access_token, expiresAt: this.now() + (res.expires_in ?? 3600) * 1000 - 60_000 };
    return conn;
  }

  /** Disconnect: revoke at Google (best effort), forget the token here. */
  async disconnect(): Promise<void> {
    const c = await this.d.connections.get();
    if (c?.refreshTokenEnc) {
      try { await this.f(GOOGLE_REVOKE_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: this.d.vault.decrypt(c.refreshTokenEnc, REFRESH_PURPOSE) }) }); } catch { /* the local forget below is what matters */ }
    }
    this.cached = null;
    await this.d.connections.clear();
  }

  // ------------------------------------------------------------------------------------------ using the connection

  /**
   * A valid access token, refreshing when needed. A revoked or expired refresh token (invalid_grant) marks the connection
   * "needs reconnection" and raises CalendarAuthError: the system stops trying and the administrator sees "Reconnect".
   */
  async accessToken(force = false): Promise<string> {
    const c = await this.d.connections.get();
    if (!c || c.status === "revoked") throw new CalendarAuthError("Google Calendar is not connected.");
    if (c.status === "needs_reauth" || !c.refreshTokenEnc) throw new CalendarAuthError("Google Calendar needs to be reconnected.");
    if (c.accountEmail !== GOOGLE_OWNER_EMAIL || c.calendarId !== GOOGLE_PRIMARY_CALENDAR || REQUIRED_CALENDAR_SCOPES.some((scope) => !c.scopes.includes(scope))) {
      await this.markNeedsReauth("The saved connection does not match the designated account, calendar or permissions.");
      throw new CalendarAuthError("Google Calendar needs to be reconnected.");
    }
    if (!force && this.cached && this.cached.expiresAt > this.now()) return this.cached.token;
    let refresh: string;
    try { refresh = this.d.vault.decrypt(c.refreshTokenEnc, REFRESH_PURPOSE); }
    catch { await this.d.connections.setStatus("needs_reauth", "The stored credential could not be decrypted."); throw new CalendarAuthError("Google Calendar needs to be reconnected."); }
    let res: TokenResponse;
    try { res = await this.token({ grant_type: "refresh_token", refresh_token: refresh }); }
    catch (e) {
      if (e instanceof GoogleOAuthError && e.code === "exchange_failed" && /invalid_grant/.test(e.message)) {
        await this.d.connections.setStatus("needs_reauth", "Google no longer accepts the saved credential (expired, revoked or password changed).");
        this.cached = null;
        throw new CalendarAuthError("Google Calendar needs to be reconnected.");
      }
      throw e instanceof GoogleOAuthError ? new CalendarUnavailableError(e.message) : e;
    }
    this.cached = { token: res.access_token, expiresAt: this.now() + (res.expires_in ?? 3600) * 1000 - 60_000 };
    // Key rotation: a credential stored under an older key is re-encrypted under the current one as soon as it has just been proven usable,
    // so the previous key can then be retired. Best effort; a failure leaves the old (still readable) value in place.
    if (this.d.vault.needsRotation(c.refreshTokenEnc)) await this.reencrypt(c.refreshTokenEnc, refresh).catch(() => undefined);
    return res.access_token;
  }

  /** Replaces the stored credential only if it is still exactly the value that was just used: a reconnection made in the meantime always wins. */
  private async reencrypt(stored: string, refreshToken: string) {
    const latest = await this.d.connections.get();
    if (!latest || latest.status !== "connected" || latest.refreshTokenEnc !== stored) return;
    await this.d.connections.save({ ...latest, refreshTokenEnc: this.d.vault.encrypt(refreshToken, REFRESH_PURPOSE), keyVersion: this.d.vault.keyVersion });
  }

  /** The API rejected our access token (revoked mid-flight): drop the cache so the next call refreshes. */
  invalidate() { this.cached = null; }
  async markNeedsReauth(reason: string) { this.cached = null; await this.d.connections.setStatus("needs_reauth", reason); }
  connection() { return this.d.connections.get(); }

  // ------------------------------------------------------------------------------------------ http

  private async token(form: Record<string, string>): Promise<TokenResponse> {
    let r: Response;
    try {
      r = await this.f(GOOGLE_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ ...form, client_id: this.d.config.clientId, client_secret: this.d.config.clientSecret }) });
    } catch { throw new CalendarUnavailableError("Google could not be reached."); }
    const body = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (r.status >= 500 || r.status === 429) throw new CalendarUnavailableError(`Google token endpoint unavailable (${r.status}).`);
    if (!r.ok) throw new GoogleOAuthError(`Google refused the request: ${String(body.error ?? r.status)}${body.error_description ? ` (${String(body.error_description).slice(0, 120)})` : ""}`, "exchange_failed");
    return body as unknown as TokenResponse;
  }

  private async userEmail(accessToken: string): Promise<string> {
    // Trust only Google's authenticated HTTPS UserInfo response, never callback parameters or an unverified JWT.
    try {
      const r = await this.f(GOOGLE_USERINFO_URL, { headers: { authorization: `Bearer ${accessToken}` }, redirect: "error" });
      if (!r.ok) throw new Error();
      const identity = await r.json() as { sub?: unknown; email?: unknown; email_verified?: unknown };
      if (typeof identity.sub !== "string" || !identity.sub || identity.email_verified !== true ||
          typeof identity.email !== "string" || identity.email.toLowerCase() !== GOOGLE_OWNER_EMAIL) throw new Error();
      return GOOGLE_OWNER_EMAIL;
    } catch { throw new GoogleOAuthError("Google could not verify the designated owner account. No credentials were saved.", "identity_invalid"); }
  }
}

type TokenResponse = { access_token: string; expires_in?: number; refresh_token?: string; scope?: string; token_type?: string };

export class MemoryConnectionStore implements ConnectionStore, OAuthStateStore {
  conn: GoogleConnection | null = null;
  private states = new Map<string, { verifierEnc: string; expiresAt: string }>();
  async get() { return this.conn ? { ...this.conn } : null; }
  async save(c: GoogleConnection) { this.conn = { ...c }; }
  async setStatus(status: GoogleConnection["status"], error: string | null) { if (this.conn) this.conn = { ...this.conn, status, lastError: error }; }
  async clear() { this.conn = null; }
  async put(rec: { stateHash: string; verifierEnc: string; expiresAt: string }) { this.states.set(rec.stateHash, { verifierEnc: rec.verifierEnc, expiresAt: rec.expiresAt }); }
  async consume(stateHash: string, nowIso: string) {
    const r = this.states.get(stateHash);
    if (!r) return null;
    this.states.delete(stateHash);
    return Date.parse(r.expiresAt) > Date.parse(nowIso) ? { verifierEnc: r.verifierEnc } : null;
  }
}
