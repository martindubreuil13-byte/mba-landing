/** Shapes for the Integrations screen. Plain types and a static mock, so the development preview can show the screen without touching real integration state. */
export type Modes = { backend: "file" | "supabase"; google: "mock" | "live"; zoom: "mock" | "live"; email: "simulated" | "resend" };
export type IntegrationStatus = {
  modes: Modes; missing: { backend: string[]; google: string[]; zoom: string[]; email: string[] };
  google: { state: "mock" | "not_configured" | "not_connected" | "connected" | "needs_reauth" | "revoked"; accountEmail: string | null; lastError: string | null; connectedAt: string | null; redirectUri: string };
  zoom: { state: "mock" | "not_configured" | "connected" | "connection_failed" };
  email: { state: "simulated" | "not_configured" | "configured"; from: string | null; /** Real delivery is confined to the single developer test address (development only); everything else is simulated. */ testMode?: boolean };
  backend: { state: "file" | "not_configured" | "supabase" };
  /** The recovery worker's pulse: `never` until a sweep has run, `stale` if the last one is over five minutes old. Absent in the preview. */
  recovery?: { state: "ok" | "stale" | "never"; ageSeconds: number | null; lastSummary: { reconciled: number; processed: number; succeeded: number; failed: number; skipped: number; conflictsFlagged: number } | null };
};
export const MOCK_STATUS: IntegrationStatus = {
  modes: { backend: "file", google: "mock", zoom: "mock", email: "simulated" }, missing: { backend: [], google: [], zoom: [], email: [] },
  google: { state: "mock", accountEmail: null, lastError: null, connectedAt: null, redirectUri: "" }, zoom: { state: "mock" }, email: { state: "simulated", from: null }, backend: { state: "file" },
};
