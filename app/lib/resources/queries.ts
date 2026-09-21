import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { upsertLeadPreservingOptIn } from "@/app/lib/leads/upsert";
import type { Lead, LeadWithStats, Resource, ResourceRequest, ResourceType } from "./types";

// ============================================================
// RESOURCES — public reads
// ============================================================

export async function listPublishedResources(): Promise<Resource[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load resources: ${error.message}`);
  return data ?? [];
}

export async function getPublishedResourceBySlug(slug: string): Promise<Resource | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load resource: ${error.message}`);
  return data;
}

// ============================================================
// RESOURCES — admin
// ============================================================

export type ResourceWithRequestCount = Resource & { request_count: number };

export async function listAllResourcesAdmin(): Promise<ResourceWithRequestCount[]> {
  const supabase = getServiceClient();
  const { data: resources, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load resources: ${error.message}`);
  if (!resources || resources.length === 0) return [];

  const { data: requests } = await supabase.from("resource_requests").select("resource_id");

  const counts = new Map<string, number>();
  for (const r of requests ?? []) {
    counts.set(r.resource_id, (counts.get(r.resource_id) ?? 0) + 1);
  }

  return resources.map((r) => ({ ...r, request_count: counts.get(r.id) ?? 0 }));
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load resource: ${error.message}`);
  return data;
}

export async function isSlugTaken(slug: string, excludeId?: string) {
  const supabase = getServiceClient();
  let query = supabase.from("resources").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to check slug: ${error.message}`);
  return Boolean(data);
}

export type ResourceInput = {
  title: string;
  slug: string;
  short_description: string;
  long_description?: string | null;
  resource_type: ResourceType | string;
  audience?: string | null;
  file_path: string;
  file_name: string;
  cover_image_path?: string | null;
  published: boolean;
  featured?: boolean;
};

export async function createResource(input: ResourceInput): Promise<Resource> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("resources").insert(input).select().single();
  if (error) throw new Error(`Failed to create resource: ${error.message}`);
  return data;
}

export async function updateResource(
  id: string,
  input: Partial<ResourceInput>
): Promise<Resource> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resources")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update resource: ${error.message}`);
  return data;
}

// ============================================================
// LEAD CAPTURE — the core dedup + consent logic
// ============================================================

export type CaptureLeadInput = {
  first_name: string;
  email: string;
  country?: string | null;
  ongoing_content_opt_in: boolean;
  resource_id: string;
  source?: string | null;
  campaign?: string | null;
  medium?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
};

export async function captureLeadAndRequestResource(input: CaptureLeadInput) {
  const supabase = getServiceClient();

  const lead: Lead = await upsertLeadPreservingOptIn({
    first_name: input.first_name,
    email: input.email,
    country: input.country,
    ongoing_content_opt_in: input.ongoing_content_opt_in,
  });

  const { data: request, error: requestError } = await supabase
    .from("resource_requests")
    .insert({
      lead_id: lead.id,
      resource_id: input.resource_id,
      opted_in_this_request: input.ongoing_content_opt_in,
      source: input.source ?? null,
      campaign: input.campaign ?? null,
      medium: input.medium ?? null,
      referrer: input.referrer ?? null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      utm_content: input.utm_content ?? null,
    })
    .select()
    .single();

  if (requestError) throw new Error(`Failed to record resource request: ${requestError.message}`);

  return { lead, request: request as ResourceRequest };
}

export async function getResourceRequestWithResource(requestId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resource_requests")
    .select("*, resource:resources(*)")
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load request: ${error.message}`);
  if (!data) return null;

  return data as ResourceRequest & { resource: Resource };
}

// ============================================================
// LEADS — admin
// ============================================================

export async function listLeadsAdmin(): Promise<LeadWithStats[]> {
  const supabase = getServiceClient();

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (leadsError) throw new Error(`Failed to load leads: ${leadsError.message}`);
  if (!leads || leads.length === 0) return [];

  const { data: requests, error: requestsError } = await supabase
    .from("resource_requests")
    .select("lead_id, requested_at, source, medium, campaign, resource:resources(title)");
  if (requestsError) throw new Error(`Failed to load requests: ${requestsError.message}`);

  type RequestRow = {
    lead_id: string;
    requested_at: string;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    resource: { title: string } | { title: string }[] | null;
  };

  const byLead = new Map<string, RequestRow[]>();
  for (const r of (requests ?? []) as RequestRow[]) {
    const list = byLead.get(r.lead_id) ?? [];
    list.push(r);
    byLead.set(r.lead_id, list);
  }

  return leads.map((lead) => {
    const leadRequests = (byLead.get(lead.id) ?? []).sort((a, b) =>
      a.requested_at.localeCompare(b.requested_at)
    );
    const lastInteraction = leadRequests.reduce(
      (latest, r) => (r.requested_at > latest ? r.requested_at : latest),
      lead.created_at
    );
    const titles = leadRequests.map((r) =>
      Array.isArray(r.resource) ? r.resource[0]?.title : r.resource?.title
    );

    const firstRequest = leadRequests[0];
    const originalSourceParts = firstRequest
      ? [firstRequest.source, firstRequest.medium, firstRequest.campaign].filter(Boolean)
      : [];

    return {
      ...lead,
      resource_count: leadRequests.length,
      last_interaction_at: lastInteraction,
      resource_titles: titles.filter((t): t is string => Boolean(t)),
      original_source: originalSourceParts.length > 0 ? originalSourceParts.join(" / ") : null,
    };
  });
}

// ============================================================
// BASIC ANALYTICS
// ============================================================

export async function getResourceStats() {
  const supabase = getServiceClient();

  const [{ count: totalRequests }, { data: leads }, { data: requests }] = await Promise.all([
    supabase.from("resource_requests").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("id, created_at, ongoing_content_opt_in"),
    supabase.from("resource_requests").select("lead_id, requested_at"),
  ]);

  const totalLeads = leads?.length ?? 0;
  const optIns = leads?.filter((l) => l.ongoing_content_opt_in).length ?? 0;

  const leadIds = new Set((requests ?? []).map((r) => r.lead_id));
  const uniqueLeads = leadIds.size;

  const requestCountByLead = new Map<string, number>();
  for (const r of requests ?? []) {
    requestCountByLead.set(r.lead_id, (requestCountByLead.get(r.lead_id) ?? 0) + 1);
  }
  const returningLeads = [...requestCountByLead.values()].filter((c) => c > 1).length;

  return {
    totalRequests: totalRequests ?? 0,
    totalLeads,
    uniqueLeads,
    newLeads: totalLeads,
    returningLeads,
    optIns,
  };
}
