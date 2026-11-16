import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart, getOverview } from "@/app/lib/intelligence/reports";
import { formatDuration, formatRate, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import { contentCategory } from "@/app/lib/intelligence/content";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import TrendChart from "@/app/components/admin/intelligence/TrendChart";
import { BarList, Empty } from "@/app/components/admin/intelligence/parts";

import { MetricSummary, ReportCaption, ReportSection } from "@/app/components/admin/intelligence/EditorialReport";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

export default async function IntelligenceOverviewPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveRange({ range: one(params, "range"), from: one(params, "from"), to: one(params, "to") });
  const [{ current: c, previous: p }, collectionStart] = await Promise.all([getOverview(range), getCollectionStart()]);

  const avg = (o: typeof c) => (o.sessions > 0 ? o.engaged_ms_total / o.sessions : 0);
  const convRate = (o: typeof c) => (o.sessions > 0 ? (o.converting_sessions / o.sessions) * 100 : 0);
  const engagedRate = (o: typeof c) => (o.sessions > 0 ? (o.engaged_sessions / o.sessions) * 100 : 0);
  const label = (k: string) => SOURCE_LABELS[k as SourceCategory] ?? k;

  return (
    <IntelligenceFrame active="overview" range={range} params={params} collectionStart={collectionStart}>
      <div className="space-y-8 bg-[#faf5eb] px-4 py-6 text-[#1a1816] sm:px-8">
        {c.sessions === 0 && (
          <ReportCaption>
            No sessions were recorded in this range. {collectionStart ? "Try a wider range." : "Session data appears after the tracker records a public visit."}
          </ReportCaption>
        )}

        <ReportSection title="Acquisition" caption="How much traffic arrived and where sessions began.">
          <dl className="grid gap-5 sm:grid-cols-2">
            <MetricSummary label="Sessions" value={String(c.sessions)} current={c.sessions} previous={p.sessions}>
              Anonymous per-tab visits that end after 30 minutes of inactivity.
            </MetricSummary>
            <MetricSummary label="Page views" value={String(c.pageviews)} current={c.pageviews} previous={p.pageviews}>
              Public pages loaded or navigated to, including in-site navigation.
            </MetricSummary>
          </dl>
          <div className="mt-5"><ReportCaption>Each bar is scaled to the largest count in its list. The printed percentage is the share of all sessions.</ReportCaption></div>
          <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="mb-3 font-serif text-xl">Top traffic sources</h3>
              <BarList total={c.sessions} label={label} wrap rows={c.top_sources.map((s) => ({ key: s.key, value: s.sessions, sub: s.conversions ? `${s.conversions} converting` : undefined }))} />
            </div>
            <div className="min-w-0">
              <h3 className="mb-3 font-serif text-xl">Top landing pages</h3>
              <BarList total={c.sessions} wrap rows={c.top_landing.map((s) => ({ key: s.key, value: s.sessions, sub: s.conversions ? `${s.conversions} converting` : undefined }))} />
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Daily activity">
          <TrendChart points={c.trend} />
        </ReportSection>

        <ReportSection title="Engagement" caption="How long pages were visible and which content appeared in sessions that converted.">
          <dl className="grid gap-5 sm:grid-cols-2">
            <MetricSummary label="Engaged sessions" value={String(c.engaged_sessions)} current={c.engaged_sessions} previous={p.engaged_sessions}>
              10+ seconds visible, 2+ page views, or a conversion. {c.sessions ? `${formatRate(c.engaged_sessions, c.sessions)} of sessions` : "Rate unavailable without sessions"} (previous period: {p.sessions ? `${engagedRate(p).toFixed(1)}%` : "no data"}).
            </MetricSummary>
            <MetricSummary label="Average engagement time" value={c.sessions ? formatDuration(avg(c)) : "—"} current={c.sessions ? avg(c) : undefined} previous={p.sessions ? avg(p) : undefined}>
              Visible time averaged over all sessions. Background tabs are excluded and the last page of a crashed tab may be missed.
            </MetricSummary>
          </dl>
          <h3 className="mb-2 mt-6 font-serif text-xl">Top content pages</h3>
          <ReportCaption>Answers, essays, resources and cases, ranked by sessions that converted, then by views.</ReportCaption>
          {c.top_content.length ? (
            <ul className="mt-3 divide-y divide-[#d7c8bb]">
              {c.top_content.map((r) => (
                <li key={r.key} className="py-3 text-sm">
                  <p className="[overflow-wrap:anywhere] font-semibold">{r.key}</p>
                  <ReportCaption>{contentCategory(r.key)} · {r.views} views · {r.sessions} sessions · {r.sessions ? formatDuration(r.avg_engaged_ms) : "Unavailable"} avg time · {r.converting_sessions} converting</ReportCaption>
                </li>
              ))}
            </ul>
          ) : <Empty>No content page views in this range.</Empty>}
        </ReportSection>

        <ReportSection title="Conversions and AI referrals">
          <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <MetricSummary label="Lead conversions" value={String(c.lead_conversions)} current={c.lead_conversions} previous={p.lead_conversions}>
              Server-confirmed submissions, including leads without a linked session. A booking-link click does not count as a lead or booking.
            </MetricSummary>
            <MetricSummary label="Conversion rate" value={formatRate(c.converting_sessions, c.sessions)} current={c.sessions ? convRate(c) : undefined} previous={p.sessions ? convRate(p) : undefined}>
              Sessions with a confirmed lead divided by all sessions. The rate is unavailable when there are zero sessions.
            </MetricSummary>
            <MetricSummary label="AI referral sessions" value={String(c.ai_sessions)} current={c.ai_sessions} previous={p.ai_sessions}>
              Referrer or UTM evidence identifies a known assistant. Visits with no such evidence are not inferred to be from AI.
            </MetricSummary>
          </dl>
        </ReportSection>
      </div>

      <details className="mt-8 text-sm text-[#5a5049]">
        <summary className="w-fit cursor-pointer font-semibold text-[#6b1f1f] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">How to read these numbers</summary>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5">
          <li>Collection is cookieless and respects Global Privacy Control and Do Not Track, so visitors using either are not counted at all. Ad blockers also block some collection. Totals therefore run lower than GA4 and are not a census.</li>
          <li>Unique visitors are not measured. Nothing identifies a returning person across sessions.</li>
          <li>Comparisons use the immediately preceding period of equal length. Where that period has no data, no percentage is shown.</li>
          <li>Full definitions: docs/website-intelligence/metrics.md.</li>
        </ul>
      </details>
    </IntelligenceFrame>
  );
}
