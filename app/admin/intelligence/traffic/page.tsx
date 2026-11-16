import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart, getTraffic } from "@/app/lib/intelligence/reports";
import { formatDuration, formatRate, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { BarList, ComparisonBar, Empty, Panel, ReportTable } from "@/app/components/admin/intelligence/parts";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Traffic | Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

export default async function IntelligenceTrafficPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveRange({ range: one(params, "range"), from: one(params, "from"), to: one(params, "to") });
  const [t, collectionStart] = await Promise.all([getTraffic(range), getCollectionStart()]);
  const label = (k: string) => SOURCE_LABELS[k as SourceCategory] ?? k;
  const n = t.total_sessions;
  const channelPeak = Math.max(0, ...t.sources.map((source) => source.sessions));
  const campaignPeak = Math.max(0, ...t.campaigns.map((campaign) => campaign.sessions));

  return (
    <IntelligenceFrame active="traffic" range={range} params={params} collectionStart={collectionStart}>
      {n === 0 ? <Empty>No sessions were recorded in this range.</Empty> : (
        <div className="space-y-6">
          <Panel title="Acquisition channels" note="Each session is assigned one channel from its first referrer or UTM. Bars scale to the highest channel count; share uses all sessions.">
            <ReportTable label="Acquisition channels">
              <table className="w-full min-w-[520px] text-left text-sm tabular-nums">
                <thead className="text-xs uppercase tracking-widest text-[#5a5049]">
                  <tr><th className="py-2 pr-4 font-normal">Channel</th><th className="pr-4 text-right font-normal">Sessions</th><th className="pr-4 text-right font-normal">Share</th><th className="pr-4 text-right font-normal">Engaged</th><th className="pr-4 text-right font-normal">Avg time</th><th className="text-right font-normal">Converting</th></tr>
                </thead>
                <tbody>
                  {t.sources.map((s) => (
                    <tr key={s.key} className="border-t border-[#1a1816]/10">
                      <th scope="row" className="min-w-36 py-3 pr-6 font-medium">{label(s.key)}<ComparisonBar value={s.sessions} max={channelPeak} /></th>
                      <td className="pr-4 text-right">{s.sessions}</td>
                      <td className="pr-4 text-right">{formatRate(s.sessions, n)}</td>
                      <td className="pr-4 text-right">{formatRate(s.engaged ?? 0, s.sessions)}</td>
                      <td className="pr-4 text-right">{s.sessions ? formatDuration(s.engaged_ms / s.sessions) : "—"}</td>
                      <td className="text-right">{s.conversions ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </ReportTable>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Source detail" note="The specific origin and the evidence used to classify it.">
              {t.source_details.length ? (
                <ul className="space-y-2 text-sm">
                  {t.source_details.map((d) => (
                    <li key={`${d.category}-${d.key}`} className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span>{d.key ?? "—"} <span className="text-xs text-[#5a5049]">· {label(d.category)}</span></span>
                      <span className="tabular-nums text-[#1a1816]/70">{d.sessions}</span>
                      {d.evidence ? <span className="w-full text-xs text-[#5a5049]">evidence: {d.evidence}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : <Empty>All sessions were direct / unknown.</Empty>}
            </Panel>
            <Panel title="Referring sites" note="Referrer host, as sent by the browser. Many browsers and apps send none.">
              <BarList wrap total={n} rows={t.referrers.map((r) => ({ key: r.key, value: r.sessions }))} />
            </Panel>
          </div>

          <Panel title="Campaigns (UTM)" note="Bars compare session counts against the largest campaign shown.">
            {t.campaigns.length ? (
              <ReportTable label="UTM campaigns">
                <table className="w-full min-w-[480px] text-left text-sm tabular-nums">
                  <thead className="text-xs uppercase tracking-widest text-[#5a5049]"><tr><th className="py-2 pr-4 font-normal">Source</th><th className="pr-4 font-normal">Medium</th><th className="pr-4 font-normal">Campaign</th><th className="pr-4 text-right font-normal">Sessions</th><th className="text-right font-normal">Converting</th></tr></thead>
                  <tbody>
                    {t.campaigns.map((c, i) => (
                      <tr key={i} className="border-t border-[#1a1816]/10"><td className="py-2 pr-4">{c.source}</td><td className="pr-4">{c.medium}</td><th scope="row" className="min-w-36 py-3 pr-4 font-medium [overflow-wrap:anywhere]">{c.campaign}<ComparisonBar value={c.sessions} max={campaignPeak} /></th><td className="pr-4 text-right">{c.sessions}</td><td className="text-right">{c.conversions}</td></tr>
                    ))}
                  </tbody>
                </table>
              </ReportTable>
            ) : <Empty>No UTM-tagged sessions in this range.</Empty>}
          </Panel>

          <Panel title="Landing pages" note="The first page of each session, with engagement and confirmed outcomes.">
            <ReportTable label="Landing pages">
              <table className="w-full min-w-[420px] text-left text-sm tabular-nums">
                <thead className="text-xs uppercase tracking-widest text-[#5a5049]"><tr><th className="py-2 pr-4 font-normal">Page</th><th className="pr-4 text-right font-normal">Sessions</th><th className="pr-4 text-right font-normal">Engaged</th><th className="text-right font-normal">Converting</th></tr></thead>
                <tbody>
                  {t.landing.map((l) => (
                    <tr key={l.key} className="border-t border-[#1a1816]/10"><td className="max-w-[18rem] [overflow-wrap:anywhere] py-2 pr-4" title={l.key}>{l.key}</td><td className="pr-4 text-right">{l.sessions}</td><td className="pr-4 text-right">{formatRate(l.engaged ?? 0, l.sessions)}</td><td className="text-right">{l.conversions ?? 0}</td></tr>
                  ))}
                </tbody>
              </table>
              </ReportTable>
          </Panel>

          <div className="grid gap-6 md:grid-cols-3">
            <Panel title="Devices"><BarList wrap total={n} rows={t.devices.map((d) => ({ key: d.key, value: d.sessions }))} /></Panel>
            <Panel title="Browsers"><BarList wrap total={n} rows={t.browsers.map((d) => ({ key: d.key, value: d.sessions }))} /></Panel>
            <Panel title="Countries" note="From the hosting network edge; unknown when unavailable."><BarList wrap total={n} rows={t.countries.map((d) => ({ key: d.key, value: d.sessions }))} /></Panel>
          </div>
        </div>
      )}
    </IntelligenceFrame>
  );
}
