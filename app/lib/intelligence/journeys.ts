import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { isProductionDeployment } from "@/app/lib/deployment";
import type { ResolvedRange } from "./ranges";
import { JOURNEY_PAGE_SIZE, type JourneyFilters, type TimelineEvent, type TimelinePageview, type TimelineSession } from "./journeys-model";

export type JourneyRow = {
  id: string;
  started_at: string;
  source_category: string;
  source_detail: string | null;
  ai_platform: string | null;
  landing_path: string;
  last_path: string | null;
  page_count: number;
  engaged_ms: number;
  device: string | null;
  converted: boolean;
  first_conversion: string | null;
};

const COLUMNS = "id, started_at, source_category, source_detail, ai_platform, landing_path, last_path, page_count, engaged_ms, device, converted, first_conversion";

/** Escapes LIKE wildcards so a filter such as "100%" is matched literally. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Paginated session list for the selected range and filters. Production deployments only ever read production rows. */
export async function listJourneys(range: ResolvedRange, f: JourneyFilters) {
  let q = getServiceClient()
    .from("wi_sessions")
    .select(COLUMNS, { count: "exact" })
    .gte("started_at", range.from.toISOString())
    .lt("started_at", range.to.toISOString());
  if (isProductionDeployment()) q = q.eq("environment", "production");
  if (f.source) q = q.eq("source_category", f.source);
  if (f.audience === "ai") q = q.not("ai_platform", "is", null);
  if (f.audience === "human") q = q.is("ai_platform", null);
  if (f.landing) q = q.ilike("landing_path", `%${likeEscape(f.landing)}%`);
  if (f.outcome) q = q.eq("converted", f.outcome === "converted");
  if (f.device) q = q.eq("device", f.device);

  const from = (f.page - 1) * JOURNEY_PAGE_SIZE;
  const { data, count, error } = await q.order("started_at", { ascending: false }).range(from, from + JOURNEY_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  const total = count ?? 0;
  return { rows: (data ?? []) as JourneyRow[], total, pages: Math.max(1, Math.ceil(total / JOURNEY_PAGE_SIZE)) };
}

export type JourneyDetail = {
  session: TimelineSession & {
    id: string; environment: string; referrer: string | null; utm_source: string | null; utm_medium: string | null;
    utm_campaign: string | null; utm_content: string | null; device: string | null; browser: string | null; country: string | null;
    last_path: string | null; page_count: number; first_conversion: string | null;
  };
  pageviews: TimelinePageview[];
  events: TimelineEvent[];
};

/** One session's full timeline. Deliberately omits ref_table/ref_id: an anonymous session is never linked to a lead record. */
export async function getJourney(id: string): Promise<JourneyDetail | null> {
  const db = getServiceClient();
  let sq = db.from("wi_sessions").select("*").eq("id", id);
  if (isProductionDeployment()) sq = sq.eq("environment", "production");
  const { data: session, error } = await sq.maybeSingle();
  if (error) throw new Error(error.message);
  if (!session) return null;

  const [pv, ev] = await Promise.all([
    db.from("wi_pageviews").select("seq, path, title, occurred_at, engaged_ms").eq("session_id", id).order("seq").limit(200),
    db.from("wi_events").select("name, path, occurred_at, props, origin, is_conversion, conversion_kind").eq("session_id", id).order("occurred_at").limit(500),
  ]);
  if (pv.error) throw new Error(pv.error.message);
  if (ev.error) throw new Error(ev.error.message);
  return { session, pageviews: (pv.data ?? []) as TimelinePageview[], events: (ev.data ?? []) as TimelineEvent[] };
}
