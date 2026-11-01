import "server-only";
import { after } from "next/server";
import { assertSchedulingRuntime } from "./release-gates";
import { schedulingTestModeActive } from "@/app/lib/email-policy";
import { getServiceClient } from "@/app/lib/supabase/service";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import type { IntegrationStatus, Modes } from "./integration-types";
import { DocumentRepository } from "./document-repository";
import { ownerNotificationAddress } from "./owner-address";
import { FileStore } from "./file-store";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail, type CalendarProvider, type EmailProvider, type ZoomProvider } from "./providers";
import type { SchedulingRepository } from "./repository";
import { DEFAULT_HOME_TIME_ZONE } from "./seed";
import { SchedulingService } from "./service";
import { GoogleCalendarClient } from "./adapters/google-calendar";
import { GoogleOAuth, type ConnectionStore } from "./adapters/google-oauth";
import { ResendEmailProvider } from "./adapters/resend-email";
import { SupabaseConnectionStore } from "./adapters/supabase-connection";
import { SupabaseRepository } from "./adapters/supabase-repository";
import { TokenVault } from "./adapters/token-vault";
import { ZoomClient } from "./adapters/zoom";

/**
 * Chooses the concrete collaborators. Everything defaults to the prototype (file store, mock Google, mock Zoom, simulated email);
 * a real integration is used ONLY when its switch is set explicitly AND its configuration is complete. Nothing here ever turns an
 * integration on by itself, and a half-configured live mode refuses to start with a message naming what is missing (names only, never values).
 *
 *   SCHEDULING_BACKEND = file | supabase       persistence
 *   SCHEDULING_GOOGLE  = mock | live           Google Calendar
 *   SCHEDULING_ZOOM    = mock | live           Zoom
 *   SCHEDULING_EMAIL   = simulated | resend    booking emails
 */
type Env = Record<string, string | undefined>;
export type { Modes, IntegrationStatus } from "./integration-types";

export function readModes(env: Env = process.env): Modes {
  return {
    backend: env.SCHEDULING_BACKEND === "supabase" ? "supabase" : "file",
    google: env.SCHEDULING_GOOGLE === "live" ? "live" : "mock",
    zoom: env.SCHEDULING_ZOOM === "live" ? "live" : "mock",
    email: env.SCHEDULING_EMAIL === "resend" ? "resend" : "simulated",
  };
}

/** Names of the environment variables a mode still needs. Never their values. */
export function missingConfig(modes: Modes, env: Env = process.env): { backend: string[]; google: string[]; zoom: string[]; email: string[] } {
  const need = (names: string[]) => names.filter((n) => !env[n]);
  return {
    // The database connection settings are validated by the site's guarded service client (getServiceClient), which names what is missing.
    backend: [],
    google: modes.google === "live" ? [...need(["SCHEDULING_GOOGLE_CLIENT_ID", "SCHEDULING_GOOGLE_CLIENT_SECRET", "SCHEDULING_TOKEN_KEY"]), ...(modes.backend === "supabase" ? [] : ["SCHEDULING_BACKEND=supabase (the Google connection is stored in the database)"])] : [],
    zoom: modes.zoom === "live" ? need(["SCHEDULING_ZOOM_ACCOUNT_ID", "SCHEDULING_ZOOM_CLIENT_ID", "SCHEDULING_ZOOM_CLIENT_SECRET", "SCHEDULING_ZOOM_USER_ID"]) : [],
    email: modes.email === "resend" ? need(["RESEND_API_KEY"]) : [],
  };
}

export function googleRedirectUri(env: Env = process.env): string {
  return env.SCHEDULING_GOOGLE_REDIRECT_URI || `${appBaseUrl()}/api/admin/scheduling/google/callback`;
}

export type Built = { service: SchedulingService; oauth: GoogleOAuth | null; modes: Modes; connections: ConnectionStore | null };

export function buildScheduling(env: Env = process.env): Built {
  assertSchedulingRuntime(env);
  const modes = readModes(env);
  const missing = missingConfig(modes, env);
  const problems = Object.entries(missing).flatMap(([k, v]) => (v.length ? [`${k}: ${v.join(", ")}`] : []));
  if (problems.length) throw new Error(`MBA Scheduling live mode is not fully configured. Missing: ${problems.join("; ")}.`);

  const db = modes.backend === "supabase" ? getServiceClient() : null;
  let repo: SchedulingRepository;
  if (db) repo = new SupabaseRepository(db);
  else { repo = new DocumentRepository(new FileStore(FileStore.defaultPath())); }
  const settings = () => repo.getSettings();

  let oauth: GoogleOAuth | null = null;
  let connections: ConnectionStore | null = null;
  let calendar: CalendarProvider;
  if (modes.google === "live") {
    const store = new SupabaseConnectionStore(db!);
    connections = store;
    oauth = new GoogleOAuth({ config: { clientId: env.SCHEDULING_GOOGLE_CLIENT_ID!, clientSecret: env.SCHEDULING_GOOGLE_CLIENT_SECRET!, redirectUri: googleRedirectUri(env) }, vault: TokenVault.fromEnv(env), connections: store, states: store });
    calendar = new GoogleCalendarClient({ oauth, inviteGuest: env.SCHEDULING_GOOGLE_INVITE_GUEST === "true" });
  } else {
    calendar = createMockGoogleCalendar({ homeTimeZone: async () => (await settings()).homeTimeZone || DEFAULT_HOME_TIME_ZONE, outage: async () => (await settings()).simulate.googleOutage });
  }

  const zoom: ZoomProvider = modes.zoom === "live"
    ? new ZoomClient({ accountId: env.SCHEDULING_ZOOM_ACCOUNT_ID!, clientId: env.SCHEDULING_ZOOM_CLIENT_ID!, clientSecret: env.SCHEDULING_ZOOM_CLIENT_SECRET!, userId: env.SCHEDULING_ZOOM_USER_ID! })
    : createMockZoom({ failing: async () => (await settings()).simulate.zoomFailure });

  const email: EmailProvider = modes.email === "resend" ? new ResendEmailProvider() : createSimulatedEmail();
  // Zoom, Google and email run AFTER the response (the guest never waits for them). SCHEDULING_SYNC=inline restores the old, blocking behaviour.
  // `after` throws outside a request (scripts, the cron worker); the service then simply runs the work inline.
  const defer = env.SCHEDULING_SYNC === "inline" ? undefined : (task: () => Promise<unknown>) => after(task);
  // The host is told about every new booking, reschedule and cancellation (see notifications.ts). Guest invitations through Google stay OFF unless explicitly enabled above.
  const service = new SchedulingService({ repo, calendar, zoom, email, inviteGuestInCalendar: env.SCHEDULING_GOOGLE_INVITE_GUEST === "true", defer, ownerEmail: ownerNotificationAddress(env), adminUrl: `${appBaseUrl()}/admin/scheduling/bookings` });
  return { service, oauth, modes, connections };
}

// ------------------------------------------------------------------------------------------------ status for the admin screen

export async function describeIntegrations(connections: ConnectionStore | null, env: Env = process.env, checkZoom?: () => Promise<void>): Promise<IntegrationStatus> {
  const modes = readModes(env); const missing = missingConfig(modes, env);
  let google: IntegrationStatus["google"]["state"] = "mock"; let conn = null as Awaited<ReturnType<ConnectionStore["get"]>>;
  if (modes.google === "live") {
    if (missing.google.length) google = "not_configured";
    else { conn = connections ? await connections.get().catch(() => null) : null; google = conn ? conn.status : "not_connected"; }
  }
  let zoomState: IntegrationStatus["zoom"]["state"] = modes.zoom === "mock" ? "mock" : "not_configured";
  if (modes.zoom === "live" && !missing.zoom.length) {
    try {
      const check = checkZoom ?? (() => new ZoomClient({ accountId: env.SCHEDULING_ZOOM_ACCOUNT_ID!, clientId: env.SCHEDULING_ZOOM_CLIENT_ID!, clientSecret: env.SCHEDULING_ZOOM_CLIENT_SECRET!, userId: env.SCHEDULING_ZOOM_USER_ID! }).checkConnection());
      await check(); zoomState = "connected";
    } catch { zoomState = "connection_failed"; }
  }
  return {
    modes, missing,
    google: { state: google, accountEmail: conn?.accountEmail ?? null, lastError: conn?.lastError ?? null, connectedAt: conn?.connectedAt ?? null, redirectUri: googleRedirectUri(env) },
    zoom: { state: zoomState },
    email: { state: modes.email === "simulated" ? "simulated" : missing.email.length ? "not_configured" : "configured", from: modes.email === "resend" ? (env.SCHEDULING_EMAIL_FROM || env.RESOURCE_EMAIL_FROM || "Martin Dubreuil <martin@mindrasolutions.com>") : null, testMode: modes.email === "resend" && schedulingTestModeActive(env) },
    backend: { state: modes.backend === "file" ? "file" : "supabase" },
  };
}
