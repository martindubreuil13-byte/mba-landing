import "server-only";
import type { GoogleOAuth } from "./adapters/google-oauth";
import { buildScheduling, describeIntegrations, type Built, type IntegrationStatus } from "./integrations";
import { workerState } from "./admin-views";
import type { SchedulingService } from "./service";

/**
 * The single place the running app gets its service. What it is wired to is decided in integrations.ts from explicit switches:
 * by default the local prototype (file store, mock Google, mock Zoom, simulated email). Process-wide singleton, shared across route bundles.
 */
const KEY = Symbol.for("mba.scheduling.built");

function built(): Built {
  const g = globalThis as unknown as Record<symbol, Built | undefined>;
  return (g[KEY] ??= buildScheduling());
}

export function getScheduling(): SchedulingService { return built().service; }

/** The Google OAuth handler, or null when Google is in mock mode. */
export function getGoogleOAuth(): GoogleOAuth | null { return built().oauth; }

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const status = await describeIntegrations(built().connections);
  const sweep = await built().service.repo.getLastSweep().catch(() => null);
  const w = workerState(sweep?.at ?? null, Date.now());
  return { ...status, recovery: { state: w.state, ageSeconds: w.ageSeconds, lastSummary: sweep?.summary ?? null } };
}
