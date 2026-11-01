import "server-only";
import { DocumentRepository } from "./document-repository";
import { FileStore } from "./file-store";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "./providers";
import { DEFAULT_HOME_TIME_ZONE } from "./seed";
import { OWNER_NOTIFICATION_EMAIL } from "./owner-address";
import { SchedulingService } from "./service";
import path from "node:path";

/**
 * The service behind the sign-in-free preview (/scheduling-preview and /api/scheduling-preview), and NOTHING ELSE.
 *
 * It is built here, from fixed parts, and never from the environment: a JSON file of its own, the deterministic mock Google Calendar, the mock Zoom
 * and the simulated email. It does not read SCHEDULING_BACKEND / _GOOGLE / _ZOOM / _EMAIL, and this module imports no live adapter, no Supabase client
 * and not instance.ts (a test enforces that). So however the real service is configured, an unauthenticated preview request can only ever touch
 * this file of simulated data: it cannot cancel, reschedule, retry or resend anything real.
 */
const KEY = Symbol.for("mba.scheduling.preview");

export const previewDataPath = () => path.join(process.cwd(), ".prototype-data", "scheduling-preview.json");

function build(): SchedulingService {
  const repo = new DocumentRepository(new FileStore(previewDataPath()));
  const settings = () => repo.getSettings();
  return new SchedulingService({
    repo,
    calendar: createMockGoogleCalendar({ homeTimeZone: async () => (await settings()).homeTimeZone || DEFAULT_HOME_TIME_ZONE, outage: async () => (await settings()).simulate.googleOutage }),
    zoom: createMockZoom({ failing: async () => (await settings()).simulate.zoomFailure }),
    email: createSimulatedEmail(),
    ownerEmail: OWNER_NOTIFICATION_EMAIL,   // the host's notifications are part of what the preview shows; the email is simulated, so nothing is sent
  });
}

export function getPreviewScheduling(): SchedulingService {
  const g = globalThis as unknown as Record<symbol, SchedulingService | undefined>;
  return (g[KEY] ??= build());
}
