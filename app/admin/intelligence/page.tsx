import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart, getOverview } from "@/app/lib/intelligence/reports";
import { formatDuration, formatRate, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import { contentCategory } from "@/app/lib/intelligence/content";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import TrendChart from "@/app/components/admin/intelligence/TrendChart";
import { BarList, Empty, NotMeasured, Panel, Stat } from "@/app/components/admin/intelligence/parts";

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
    <IntelligenceFrame active="overview" range={range} collectionStart={collectionStart}>
      {c.sessions === 0 ? (
        <Empty>
          No sessions were recorded in this range.{" "}
          {collectionStart ? "Try a wider range." : "Collection starts once the tracker is live on the public site and visitors arrive; nothing is shown until real data exists."}
        </Empty>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <NotMeasured label="Unique visitors" reason="The site sets no cookie and stores no identifier that could recognise a returning person, so unique visitors cannot be counted honestly. Sessions are the unit." />
        <Stat label="Sessions" value={String(c.sessions)} current={c.sessions} previous={p.sessions} definition="Per-tab visits that end after 30 minutes of inactivity. Not people." />
        <Stat label="Page views" value={String(c.pageviews)} current={c.pageviews} previous={p.pageviews} definition="Pages loaded or navigated to, including in-site navigation." />
        <Stat label="Engaged sessions" value={`${c.engaged_sessions}`} current={c.engaged_sessions} previous={p.engaged_sessions} definition={`10+ seconds visible, 2+ page views, or a conversion. ${formatRate(c.engaged_sessions, c.sessions)} of sessions (previous period: ${p.sessions ? engagedRate(p).toFixed(1) + "%" : "no data"}).`} />
        <Stat label="Avg engagement time" value={c.sessions ? formatDuration(avg(c)) : "—"} current={avg(c)} previous={p.sessions ? avg(p) : undefined} definition="Visible time on pages, averaged over all sessions. Excludes background tabs; the last page of a crashed tab may be missed." />
        <Stat label="AI referral sessions" value={String(c.ai_sessions)} current={c.ai_sessions} previous={p.ai_sessions} definition="Sessions whose referrer or UTM identifies a known AI assistant. Others may reach us without any referrer and are counted as direct." />
        <Stat label="Lead conversions" value={String(c.lead_conversions)} current={c.lead_conversions} previous={p.lead_conversions} definition="Submissions the server confirmed (inquiry, guide request, assessment lead, program application). Includes visitors who sent no session id. A booking-link click is not a lead or a booking." />
        <Stat label="Conversion rate" value={formatRate(c.converting_sessions, c.sessions)} current={convRate(c)} previous={p.sessions ? convRate(p) : undefined} definition="Sessions with a confirmed lead ÷ all sessions. Session-based, not person-based." />
      </div>

      <div className="mb-8">
        <Panel title="Traffic trend" note="Daily, UTC.">
          {c.trend.length ? <TrendChart points={c.trend} /> : <Empty>No data in this range.</Empty>}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Top traffic sources" note="By sessions.">
          <BarList total={c.sessions} label={label} rows={c.top_sources.map((s) => ({ key: s.key, value: s.sessions, sub: s.conversions ? `${s.conversions} converting` : undefined }))} />
        </Panel>
        <Panel title="Top landing pages" note="First page of the session.">
          <BarList total={c.sessions} rows={c.top_landing.map((s) => ({ key: s.key, value: s.sessions, sub: s.conversions ? `${s.conversions} converting` : undefined }))} />
        </Panel>
        <Panel title="Top content pages" note="Answers, essays, resources and cases. Ranked by sessions that converted, then by views.">
          {c.top_content.length ? (
            <ul className="space-y-3 text-sm">
              {c.top_content.map((r) => (
                <li key={r.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate" title={r.key}>{r.key}</span>
                    <span className="shrink-0 tabular-nums text-[#1a1816]/70">{r.views} views</span>
                  </div>
                  <p className="text-xs text-[#1a1816]/45">
                    {contentCategory(r.key)} · {r.sessions} sessions · {r.avg_engaged_ms ? formatDuration(r.avg_engaged_ms) : "—"} avg time · {r.converting_sessions} converting
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No content page views in this range.</Empty>
          )}
        </Panel>
      </div>

      <details className="mt-10 text-sm text-[#1a1816]/60">
        <summary className="cursor-pointer select-none text-xs uppercase tracking-widest">How to read these numbers</summary>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5">
          <li>Collection is cookieless and respects Global Privacy Control and Do Not Track, so visitors using either are not counted at all. Ad blockers also block some collection. Totals therefore run lower than GA4 and are not a census.</li>
          <li>There is deliberately no unique-visitor count: nothing identifies a returning person. All counts are sessions (one per browser tab visit).</li>
          <li>Comparisons use the immediately preceding period of equal length. Where that period has no data, no percentage is shown.</li>
          <li>Full definitions: docs/website-intelligence/metrics.md.</li>
        </ul>
      </details>
    </IntelligenceFrame>
  );
}
