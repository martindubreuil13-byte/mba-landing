import type { Metadata } from "next";
import Link from "next/link";
import { reportHref } from "@/app/components/admin/intelligence/report-links";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart } from "@/app/lib/intelligence/reports";
import { listJourneys } from "@/app/lib/intelligence/journeys";
import { parseJourneyFilters } from "@/app/lib/intelligence/journeys-model";
import { formatDuration, isoDay, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_CATEGORIES, SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import { conversionLabel } from "@/app/lib/intelligence/events";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { Empty, Panel, ReportTable } from "@/app/components/admin/intelligence/parts";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Journeys | Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);
const sel = "mt-1 block border border-[#1a1816]/15 bg-white px-2 py-2 text-sm normal-case tracking-normal";

export default async function IntelligenceJourneysPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveRange({ range: one(params, "range"), from: one(params, "from"), to: one(params, "to") });
  const f = parseJourneyFilters(Object.fromEntries(["source", "audience", "landing", "outcome", "device", "page"].map((k) => [k, one(params, k)])));
  const [{ rows, total, pages }, collectionStart] = await Promise.all([listJourneys(range, f), getCollectionStart()]);

  const keep = (page: number) => {
    const qs = new URLSearchParams();
    if (range.key === "custom") { qs.set("from", isoDay(range.from)); qs.set("to", isoDay(new Date(range.to.getTime() - 86_400_000))); } else qs.set("range", range.key);
    for (const [k, v] of Object.entries({ source: f.source, audience: f.audience, landing: f.landing, outcome: f.outcome, device: f.device })) if (v) qs.set(k, v);
    if (page > 1) qs.set("page", String(page));
    return `/admin/intelligence/journeys?${qs}`;
  };

  return (
    <IntelligenceFrame active="journeys" range={range} params={params} collectionStart={collectionStart}>
      <p className="mb-6 max-w-3xl text-sm text-[#1a1816]/60">
        Each row is one anonymous browser-tab session: a sequence of pages and actions, not a person. Nothing here identifies a visitor or
        shows anything they typed. Use it to see patterns and friction, not to follow individuals.
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-3 border-t border-[#b19d90] bg-[#faf5eb] p-4 text-xs uppercase tracking-widest text-[#5a5049]">
        {range.key === "custom" ? (<><input type="hidden" name="from" value={isoDay(range.from)} /><input type="hidden" name="to" value={isoDay(new Date(range.to.getTime() - 86_400_000))} /></>) : <input type="hidden" name="range" value={range.key} />}
        <label>Source
          <select name="source" defaultValue={f.source} className={sel}><option value="">Any</option>{SOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{SOURCE_LABELS[c]}</option>)}</select>
        </label>
        <label>Audience
          <select name="audience" defaultValue={f.audience} className={sel}><option value="">All</option><option value="ai">AI assistant referrals</option><option value="human">Human-oriented (all others)</option></select>
        </label>
        <label>Outcome
          <select name="outcome" defaultValue={f.outcome} className={sel}><option value="">Any</option><option value="converted">Lead confirmed</option><option value="not_converted">No lead</option></select>
        </label>
        <label>Device
          <select name="device" defaultValue={f.device} className={sel}><option value="">Any</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option></select>
        </label>
        <label>Landing page
          <input name="landing" defaultValue={f.landing} placeholder="/answers/…" className={`${sel} w-44`} />
        </label>
        <button className="border border-[#6b1f1f] bg-[#6b1f1f] px-4 py-2 text-xs uppercase tracking-widest text-white">Filter</button>
      </form>

      <Panel title={`Sessions (${total})`} note="Newest first, in UTC. Open the start time to inspect an anonymous session timeline.">
        {rows.length === 0 ? <Empty>No sessions match these filters in this range.</Empty> : (
          <ReportTable label="Anonymous session list">
            <table className="w-full min-w-[820px] text-left text-sm tabular-nums">
              <thead className="text-xs uppercase tracking-widest text-[#5a5049]">
                <tr><th className="py-2 pr-4 font-normal">Started</th><th className="pr-4 font-normal">Arrived via</th><th className="pr-4 font-normal">Landing → last page</th><th className="pr-4 text-right font-normal">Pages</th><th className="pr-4 text-right font-normal">Time</th><th className="pr-4 font-normal">Device</th><th className="font-normal">Outcome</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[#d7c8bb] align-top">
                    <th scope="row" className="whitespace-nowrap py-3 pr-4 text-left font-medium">
                      <Link href={reportHref(`/admin/intelligence/journeys/${r.id}`, params, range)} className="text-[#6b1f1f] underline underline-offset-2 focus-visible:outline-2">{r.started_at.slice(0, 16).replace("T", " ")}</Link>
                    </th>
                    <td className="pr-4">{r.ai_platform ? `${SOURCE_LABELS.ai_assistant}: ${r.ai_platform}` : SOURCE_LABELS[r.source_category as SourceCategory] ?? r.source_category}</td>
                    <td className="max-w-[20rem] [overflow-wrap:anywhere] pr-4" title={`${r.landing_path} → ${r.last_path ?? r.landing_path}`}>{r.landing_path}{r.last_path && r.last_path !== r.landing_path ? <span className="text-[#5a5049]"> → {r.last_path}</span> : null}</td>
                    <td className="pr-4 text-right">{r.page_count}</td>
                    <td className="pr-4 text-right">{r.engaged_ms ? formatDuration(r.engaged_ms) : "—"}</td>
                    <td className="pr-4">{r.device ?? "—"}</td>
                    <td>{r.converted ? <span className="text-[#6b1f1f]">Lead: {conversionLabel(r.first_conversion ?? "lead")}</span> : <span className="text-[#5a5049]">No confirmed lead</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
              </ReportTable>
        )}
        {pages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-widest">
            {f.page > 1 ? <Link href={keep(f.page - 1)} className="text-[#6b1f1f]">← Newer</Link> : <span />}
            <span className="text-[#5a5049]">Page {Math.min(f.page, pages)} of {pages}</span>
            {f.page < pages ? <Link href={keep(f.page + 1)} className="text-[#6b1f1f]">Older →</Link> : <span />}
          </div>
        ) : null}
      </Panel>
    </IntelligenceFrame>
  );
}
