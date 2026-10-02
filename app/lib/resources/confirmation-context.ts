import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { getResourceConfig, type ResourceAccessConfig } from "./config";

/**
 * Read-only: which member-access resource (if any) a confirmation link belongs to, so the /confirm page can say what
 * confirming unlocks. Opening the page mutates nothing. Leads that did not come from a configured resource (e.g. the
 * Transition application, or a rejoin) get null and see the standard wording.
 */
export async function getConfirmationContext(leadId: string): Promise<{ title: string; access: ResourceAccessConfig } | null> {
  const supabase = getServiceClient();
  // The LATEST request decides what this link is for: a rejoin (no resource) must not show an old resource's wording.
  const { data: row } = await supabase
    .from("consent_records")
    .select("source_resource_id")
    .eq("lead_id", leadId)
    .eq("action", "opt_in_requested")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.source_resource_id) return null;
  const { data: resource } = await supabase.from("resources").select("title, slug").eq("id", row.source_resource_id).maybeSingle();
  const config = resource ? getResourceConfig(resource.slug) : null;
  return resource && config ? { title: resource.title, access: config.access } : null;
}
