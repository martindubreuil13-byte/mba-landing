/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import type { getServiceClient } from "@/app/lib/supabase/service";
import type { ConnectionStore, GoogleConnection, OAuthStateStore } from "./google-oauth";

/** Persists the Google connection (encrypted refresh token) and the single-use OAuth states in Postgres. Service-role only; see the migration. */
type Db = ReturnType<typeof getServiceClient>;

const toConn = (r: any): GoogleConnection => ({
  status: r.status, accountEmail: r.google_account_email, scopes: r.scopes ?? [], calendarId: r.calendar_id, refreshTokenEnc: r.refresh_token_enc, keyVersion: r.key_version,
  lastError: r.last_error, connectedAt: r.connected_at, lastRefreshedAt: r.last_refreshed_at,
});

export class SupabaseConnectionStore implements ConnectionStore, OAuthStateStore {
  constructor(private db: Db) {}

  async get() {
    const r = await this.db.from("sched_google_connection").select("*").eq("id", true).maybeSingle();
    if (r.error) throw new Error(`Google connection read failed: ${r.error.message}`);
    return r.data ? toConn(r.data) : null;
  }
  async save(c: GoogleConnection) {
    const r = await this.db.from("sched_google_connection").upsert({
      id: true, status: c.status, google_account_email: c.accountEmail, scopes: c.scopes, calendar_id: c.calendarId, refresh_token_enc: c.refreshTokenEnc, key_version: c.keyVersion,
      last_error: c.lastError, connected_at: c.connectedAt, last_refreshed_at: c.lastRefreshedAt, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (r.error) throw new Error(`Google connection save failed: ${r.error.message}`);
  }
  async setStatus(status: GoogleConnection["status"], error: string | null) {
    const r = await this.db.from("sched_google_connection").update({ status, last_error: error, updated_at: new Date().toISOString() }).eq("id", true);
    if (r.error) throw new Error(`Google connection update failed: ${r.error.message}`);
  }
  async clear() {
    const r = await this.db.from("sched_google_connection").delete().eq("id", true);
    if (r.error) throw new Error(`Google connection delete failed: ${r.error.message}`);
  }

  async put(rec: { stateHash: string; verifierEnc: string; expiresAt: string }) {
    // Opportunistic clean-up of expired rows keeps the table tiny.
    await this.db.from("sched_oauth_states").delete().lt("expires_at", new Date().toISOString());
    const r = await this.db.from("sched_oauth_states").insert({ state_hash: rec.stateHash, code_verifier_enc: rec.verifierEnc, expires_at: rec.expiresAt });
    if (r.error) throw new Error(`OAuth state save failed: ${r.error.message}`);
  }
  /** DELETE ... RETURNING is atomic: two callbacks racing on one state, only one gets the row. */
  async consume(stateHash: string, nowIso: string) {
    const r = await this.db.from("sched_oauth_states").delete().eq("state_hash", stateHash).gt("expires_at", nowIso).select("code_verifier_enc");
    if (r.error) throw new Error(`OAuth state read failed: ${r.error.message}`);
    return r.data?.[0] ? { verifierEnc: r.data[0].code_verifier_enc as string } : null;
  }
}
