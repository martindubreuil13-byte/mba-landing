import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { consentStatusOf, type ConsentStatus } from "@/app/lib/leads/consent";
import { listResourceConfigs } from "./config";
import { computeFunnel, computeTrend, type DateRange, type FunnelEvent, type FunnelRequest } from "./funnel";
import { resourceFileExists } from "./storage";
import { resourceStatus, type DeliveryStatus, type Lead, type LeadStatus, type Resource } from "./types";

const PAGE = 1000; // Supabase returns at most 1000 rows per request

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

/** Inclusive UTC day range -> [startIso, endExclusiveIso). */
function bounds(range: DateRange) {
  return {
    start: `${range.from}T00:00:00.000Z`,
    end: new Date(new Date(`${range.to}T00:00:00.000Z`).getTime() + 86_400_000).toISOString(),
  };
}

export type GuideLeadRow = {
  request_id: string;
  lead_id: string;
  name: string;
  email: string;
  lead_status: LeadStatus;
  consent_status: ConsentStatus;
  requested_at: string;
  cta_location: string | null;
  delivery_status: DeliveryStatus;
  download_count: number;
  last_activity_at: string | null;
};

export async function getResourceAnalytics(resource: Resource, range: DateRange) {
  const supabase = getServiceClient();
  const { start, end } = bounds(range);

  const events = await fetchAll<FunnelEvent>((from, to) =>
    supabase
      .from("resource_events")
      .select("event_name, session_id, cta_location, created_at, metadata")
      .eq("resource_id", resource.id)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(from, to)
  );

  type RequestWithLead = FunnelRequest & {
    id: string;
    lead_id: string;
    cta_location: string | null;
    lead: Lead | Lead[] | null;
  };

  const requests = await fetchAll<RequestWithLead>((from, to) =>
    supabase
      .from("resource_requests")
      .select("id, lead_id, requested_at, cta_location, delivery_status, download_count, lead:leads(*)")
      .eq("resource_id", resource.id)
      .gte("requested_at", start)
      .lt("requested_at", end)
      .order("requested_at", { ascending: false })
      .range(from, to)
  );

  const summary = computeFunnel(events, requests);
  const trend = computeTrend(events, range.from, range.to);

  const leads: GuideLeadRow[] = requests.map((r) => {
    const lead = (Array.isArray(r.lead) ? r.lead[0] : r.lead) as Lead;
    return {
      request_id: r.id,
      lead_id: r.lead_id,
      name: lead?.first_name ?? "",
      email: lead?.email ?? "",
      lead_status: lead?.lead_status ?? "new",
      consent_status: lead ? consentStatusOf({ ...lead, suppressed_at: lead.suppressed_at ?? null }) : "pending",
      requested_at: r.requested_at,
      cta_location: r.cta_location,
      delivery_status: r.delivery_status ?? "not_tracked",
      download_count: r.download_count ?? 0,
      last_activity_at: lead?.last_activity_at ?? null,
    };
  });

  return { summary, trend, leads };
}

export type GuideOverviewRow = {
  resource: Resource;
  tracked: boolean;
  status: string;
  pdfAvailable: boolean;
  summary: ReturnType<typeof computeFunnel>;
};

/** One row per resource that has the lead-capture experience configured. */
export async function listGuideOverview(range: DateRange): Promise<GuideOverviewRow[]> {
  const supabase = getServiceClient();
  const slugs = listResourceConfigs().map((c) => c.slug);
  const { data: resources, error } = await supabase.from("resources").select("*").in("slug", slugs);
  if (error) throw new Error(error.message);

  return Promise.all(
    ((resources ?? []) as Resource[]).map(async (resource) => {
      const [{ summary }, pdfAvailable] = await Promise.all([getResourceAnalytics(resource, range), resourceFileExists(resource.file_path)]);
      return { resource, tracked: true, status: resourceStatus(resource), pdfAvailable, summary };
    })
  );
}
