import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart, getTraffic } from "@/app/lib/intelligence/reports";
import { formatDuration, formatRate, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { BarList, Empty, Panel } from "@/app/components/admin/intelligence/parts";

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

  return (
    <IntelligenceFrame active="traffic" range={range} collectionStart={collectionStart}>
      {n === 0 ? <Empty>No sessions were recorded in this range.</Empty> : (
        <div className="space-y-6">
          <Panel title="Channels" note="Each session is assigned exactly one channel from its first referrer / UTM. Raw values are stored, so rules can be revised.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm tabular-nums">
                <thead className="text-xs uppercase tracking-widest text-[#1a1816]/50">
                  <tr><th className="py-2 pr-4 font-normal">Channel</th><th className="pr-4 text-right font-normal">Sessions</th><th className="pr-4 text-right font-normal">Share</th><th className="pr-4 text-right font-normal">Engaged</th><th className="pr-4 text-right font-normal">Avg time</th><th className="text-right font-normal">Converting</th></tr>
                </thead>
                <tbody>
                  {t.sources.map((s) => (
                    <tr key={s.key} className="border-t border-[#1a1816]/10">
                      <td className="py-2 pr-4">{label(s.key)}</td>
                      <td className="pr-4 text-right">{s.sessions}</td>
                      <td className="pr-4 text-right">{formatRate(s.sessions, n)}</td>
                      <td className="pr-4 text-right">{formatRate(s.engaged ?? 0, s.sessions)}</td>
                      <td className="pr-4 text-right">{s.sessions ? formatDuration(s.engaged_ms / s.sessions) : "—"}</td>
                      <td className="text-right">{s.conversions ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Source detail" note="The specific origin and the evidence used to classify it.">
              {t.source_details.length ? (
                <ul className="space-y-2 text-sm">
                  {t.source_details.map((d) => (
                    <li key={`${d.category}-${d.key}`} className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span>{d.key ?? "—"} <span className="text-xs text-[#1a1816]/45">· {label(d.category)}</span></span>
                      <span className="tabular-nums text-[#1a1816]/70">{d.sessions}</span>
                      {d.evidence ? <span className="w-full text-xs text-[#1a1816]/40">evidence: {d.evidence}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : <Empty>All sessions were direct / unknown.</Empty>}
            </Panel>
            <Panel title="Referring sites" note="Referrer host, as sent by the browser. Many browsers and apps send none.">
              <BarList total={n} rows={t.referrers.map((r) => ({ key: r.key, value: r.sessions }))} />
            </Panel>
          </div>

          <Panel title="Campaigns (UTM)">
            {t.campaigns.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm tabular-nums">
                  <thead className="text-xs uppercase tracking-widest text-[#1a1816]/50"><tr><th className="py-2 pr-4 font-normal">Source</th><th className="pr-4 font-normal">Medium</th><th className="pr-4 font-normal">Campaign</th><th className="pr-4 text-right font-normal">Sessions</th><th className="text-right font-normal">Converting</th></tr></thead>
                  <tbody>
                    {t.campaigns.map((c, i) => (
                      <tr key={i} className="border-t border-[#1a1816]/10"><td className="py-2 pr-4">{c.source}</td><td className="pr-4">{c.medium}</td><td className="pr-4">{c.campaign}</td><td className="pr-4 text-right">{c.sessions}</td><td className="text-right">{c.conversions}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty>No UTM-tagged sessions in this range.</Empty>}
          </Panel>

          <Panel title="Landing pages">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm tabular-nums">
                <thead className="text-xs uppercase tracking-widest text-[#1a1816]/50"><tr><th className="py-2 pr-4 font-normal">Page</th><th className="pr-4 text-right font-normal">Sessions</th><th className="pr-4 text-right font-normal">Engaged</th><th className="text-right font-normal">Converting</th></tr></thead>
                <tbody>
                  {t.landing.map((l) => (
                    <tr key={l.key} className="border-t border-[#1a1816]/10"><td className="max-w-[18rem] truncate py-2 pr-4" title={l.key}>{l.key}</td><td className="pr-4 text-right">{l.sessions}</td><td className="pr-4 text-right">{formatRate(l.engaged ?? 0, l.sessions)}</td><td className="text-right">{l.conversions ?? 0}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-6 md:grid-cols-3">
            <Panel title="Devices"><BarList total={n} rows={t.devices.map((d) => ({ key: d.key, value: d.sessions }))} /></Panel>
            <Panel title="Browsers"><BarList total={n} rows={t.browsers.map((d) => ({ key: d.key, value: d.sessions }))} /></Panel>
            <Panel title="Countries" note="From the hosting network edge; unknown when unavailable."><BarList total={n} rows={t.countries.map((d) => ({ key: d.key, value: d.sessions }))} /></Panel>
          </div>
        </div>
      )}
    </IntelligenceFrame>
  );
}
