import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { ResourceEventName } from "./events";
import type { Resource } from "./types";

export type EventInput = {
  name: ResourceEventName;
  resource: Pick<Resource, "id" | "slug" | "resource_type">;
  sessionId?: string | null;
  leadId?: string | null;
  requestId?: string | null;
  ctaLocation?: string | null;
  pageUrl?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  deviceType?: string | null;
  metadata?: Record<string, unknown>;
};

/** Best-effort: analytics must never break a visitor-facing flow. */
export async function recordResourceEvent(input: EventInput): Promise<boolean> {
  try {
    const { error } = await getServiceClient()
      .from("resource_events")
      .insert({
        event_name: input.name,
        resource_id: input.resource.id,
        resource_slug: input.resource.slug,
        resource_type: input.resource.resource_type,
        session_id: input.sessionId ?? null,
        lead_id: input.leadId ?? null,
        request_id: input.requestId ?? null,
        cta_location: input.ctaLocation ?? null,
        page_url: input.pageUrl ?? null,
        referrer: input.referrer ?? null,
        utm_source: input.utmSource ?? null,
        utm_medium: input.utmMedium ?? null,
        utm_campaign: input.utmCampaign ?? null,
        device_type: input.deviceType ?? null,
        metadata: input.metadata ?? {},
      });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Failed to record ${input.name}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/** Window within which a repeat of the same (session, resource, event) is not counted again. */
export const DEDUPE_WINDOW_SECONDS: Partial<Record<ResourceEventName, number>> = {
  resource_page_view: 30 * 60,
  resource_read_started: 24 * 60 * 60,
  resource_read_completed: 24 * 60 * 60,
};

export async function isDuplicateEvent(name: ResourceEventName, resourceId: string, sessionId: string): Promise<boolean> {
  const windowSeconds = DEDUPE_WINDOW_SECONDS[name];
  if (!windowSeconds) return false;
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await getServiceClient()
    .from("resource_events")
    .select("id", { count: "exact", head: true })
    .eq("resource_id", resourceId)
    .eq("session_id", sessionId)
    .eq("event_name", name)
    .gte("created_at", since);
  return (count ?? 0) > 0;
}

/** Once a visitor identifies themselves, their earlier anonymous events for THIS resource join the lead. */
export async function linkSessionEventsToLead(resourceId: string, sessionId: string, leadId: string) {
  const { error } = await getServiceClient()
    .from("resource_events")
    .update({ lead_id: leadId })
    .eq("resource_id", resourceId)
    .eq("session_id", sessionId)
    .is("lead_id", null);
  if (error) console.error("Failed to link session events to lead:", error.message);
}

export function deviceTypeFromUserAgent(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|monitor|curl|wget|python-requests/i;
export function isLikelyBot(ua: string | null): boolean {
  return !ua || BOT_PATTERN.test(ua);
}
