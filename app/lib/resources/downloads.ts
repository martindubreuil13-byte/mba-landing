import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { recordResourceEvent } from "./event-store";
import type { Resource, ResourceRequest } from "./types";

/** Rapid repeats (double-click, scanner + browser) inside this window count once. */
const DEDUPE_SECONDS = 20;

/** Never throws: tracking must not block a download. */
export async function recordDownloadStart(request: ResourceRequest & { resource: Resource }, via: string) {
  try {
    const now = Date.now();
    if (request.last_download_at && now - new Date(request.last_download_at).getTime() < DEDUPE_SECONDS * 1000) return;

    const stamp = new Date(now).toISOString();
    const supabase = getServiceClient();
    await supabase
      .from("resource_requests")
      .update({
        download_count: (request.download_count ?? 0) + 1,
        first_download_at: request.first_download_at ?? stamp,
        last_download_at: stamp,
      })
      .eq("id", request.id);
    await supabase.from("leads").update({ last_activity_at: stamp }).eq("id", request.lead_id);

    await recordResourceEvent({
      name: "resource_download_started",
      resource: request.resource,
      sessionId: request.session_id ?? null,
      leadId: request.lead_id,
      requestId: request.id,
      metadata: { via },
    });
  } catch (error) {
    console.error("Failed to record download start:", error instanceof Error ? error.message : error);
  }
}
