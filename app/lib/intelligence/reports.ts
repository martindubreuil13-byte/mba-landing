import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { ResolvedRange } from "./ranges";

import { isProductionDeployment } from "@/app/lib/deployment";
import { BOOKING_CLICK_EVENTS, COMPLETE_EVENTS, CTA_EVENTS, START_EVENTS } from "./events";

export type KeyedCount = { key: string; sessions: number; engaged?: number; conversions?: number };
export type TrendPoint = { day: string; sessions: number; pageviews: number; ai_sessions: number; conversions: number };
export type ContentRow = { key: string; views: number; sessions: number; avg_engaged_ms: number; converting_sessions: number };

export type Overview = {
  sessions: number;
  pageviews: number;
  engaged_sessions: number;
  engaged_ms_total: number;
  ai_sessions: number;
  lead_conversions: number;
  converting_sessions: number;
  trend: TrendPoint[];
  top_sources: KeyedCount[];
  top_landing: KeyedCount[];
  top_content: ContentRow[];
};

export type Traffic = {
  total_sessions: number;
  sources: (KeyedCount & { engaged_ms: number })[];
  source_details: { category: string; key: string | null; sessions: number; evidence: string | null }[];
  referrers: { key: string; sessions: number }[];
  campaigns: { source: string; medium: string; campaign: string; sessions: number; conversions: number }[];
  devices: { key: string; sessions: number }[];
  browsers: { key: string; sessions: number }[];
  countries: { key: string; sessions: number }[];
  landing: KeyedCount[];
};

export type ContentPage = {
  path: string;
  title: string | null;
  views: number;
  sessions: number;
  landing_sessions: number;
  avg_engaged_ms: number;
  continued_sessions: number;
  assisted_leads: number;
  landing_leads: number;
  cta_clicks: number;
  starts: number;
  sources: { key: string; sessions: number }[];
};

export type Conversions = {
  sessions: number;
  engaged_sessions: number;
  total_leads: number;
  attributed_leads: number;
  converting_sessions: number;
  by_kind: { key: string; n: number }[];
  by_source: { key: string; n: number }[];
  by_landing: { key: string; n: number }[];
  by_converting_page: { key: string; n: number }[];
  trend: { day: string; n: number }[];
  sessions_with_cta: number;
  sessions_with_start: number;
  sessions_with_complete: number;
  booking_clicks: number;
  sessions_with_booking_click: number;
};

export type AiReferrals = {
  total_sessions: number;
  ai_sessions: number;
  platforms: { key: string; sessions: number; engaged: number; engaged_ms: number; conversions: number }[];
  landing: { key: string; sessions: number; conversions: number }[];
  evidence: { platform: string; evidence: string | null; sessions: number }[];
  trend: { day: string; n: number }[];
};

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getServiceClient().rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

/**
 * `p_prod` makes every report read ONLY rows written by a production deployment, so preview / development rows can
 * never appear in production reports. Outside production the report shows whatever the isolated database holds.
 */
const scope = (from: Date, to: Date) => ({ p_from: from.toISOString(), p_to: to.toISOString(), p_prod: isProductionDeployment() });

/** Current period and the preceding equal period, fetched together. */
export async function getOverview(range: ResolvedRange) {
  const [current, previous] = await Promise.all([
    rpc<Overview>("wi_overview", scope(range.from, range.to)),
    rpc<Overview>("wi_overview", scope(range.previous.from, range.previous.to)),
  ]);
  return { current, previous };
}

export const getTraffic = (range: ResolvedRange) => rpc<Traffic>("wi_traffic", scope(range.from, range.to));

export const getContent = (range: ResolvedRange) =>
  rpc<ContentPage[]>("wi_content", { ...scope(range.from, range.to), p_cta_events: [...CTA_EVENTS], p_start_events: [...START_EVENTS] });

export async function getConversions(range: ResolvedRange) {
  const args = (from: Date, to: Date) => ({
    ...scope(from, to),
    p_cta_events: [...CTA_EVENTS],
    p_start_events: [...START_EVENTS],
    p_complete_events: [...COMPLETE_EVENTS],
    p_booking_events: [...BOOKING_CLICK_EVENTS],
  });
  const [current, previous] = await Promise.all([
    rpc<Conversions>("wi_conversions", args(range.from, range.to)),
    rpc<Conversions>("wi_conversions", args(range.previous.from, range.previous.to)),
  ]);
  return { current, previous };
}

export async function getAiReferrals(range: ResolvedRange) {
  const [current, previous] = await Promise.all([
    rpc<AiReferrals>("wi_ai_referrals", scope(range.from, range.to)),
    rpc<AiReferrals>("wi_ai_referrals", scope(range.previous.from, range.previous.to)),
  ]);
  return { current, previous };
}

/** When collection began (earliest in-scope session), or null if nothing has ever been collected. */
export async function getCollectionStart(): Promise<string | null> {
  let q = getServiceClient().from("wi_sessions").select("started_at").order("started_at", { ascending: true }).limit(1);
  if (isProductionDeployment()) q = q.eq("environment", "production");
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data?.[0]?.started_at ?? null;
}
