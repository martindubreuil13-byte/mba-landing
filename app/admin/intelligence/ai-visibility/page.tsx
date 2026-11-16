import { MetricSummary } from "@/app/components/admin/intelligence/EditorialReport";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getAiReferrals, getCollectionStart } from "@/app/lib/intelligence/reports";
import { getAiDomains, listResults } from "@/app/lib/intelligence/benchmarks";
import { formatRate as benchRate, summarize } from "@/app/lib/intelligence/benchmarks-model";
import { formatDuration, formatRate, resolveRange } from "@/app/lib/intelligence/ranges";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { BarList, ComparisonBar, DayBars, Empty, Panel, ReportTable } from "@/app/components/admin/intelligence/parts";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "AI Visibility | Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

const Layer = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="mb-4 border-t border-[#b19d90] pt-4 font-serif text-3xl">{title}</h2>
    <div className="space-y-6">{children}</div>
  </section>
);

export default async function IntelligenceAiVisibilityPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveRange({ range: one(params, "range"), from: one(params, "from"), to: one(params, "to") });
  const [{ current: c, previous: p }, collectionStart, domains, results] = await Promise.all([
    getAiReferrals(range), getCollectionStart(), getAiDomains(), listResults(500),
  ]);
  const bench = summarize(results);
  const aiEngaged = c.platforms.reduce((a, x) => a + x.engaged, 0);
  const aiConverting = c.platforms.reduce((a, x) => a + x.conversions, 0);
  const assistantPeak = Math.max(0, ...c.platforms.map((assistant) => assistant.sessions));
  const aiMs = c.platforms.reduce((a, x) => a + x.engaged_ms, 0);

  return (
    <IntelligenceFrame active="ai" range={range} params={params} collectionStart={collectionStart}>
      <p className="max-w-3xl text-sm text-[#1a1816]/60">
        Three separate questions, three separate kinds of evidence. Visitors who arrived <em>from</em> an assistant (measured), requests from AI
        crawlers (not measured yet), and what assistants <em>say</em> when asked (manually recorded). None of them is evidence of the others.
      </p>

      <Layer title="AI referral traffic">
        <dl className="grid gap-5 bg-[#faf5eb] p-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricSummary label="AI referral sessions" value={String(c.ai_sessions)} current={c.ai_sessions} previous={p.ai_sessions}>Sessions whose referrer or UTM identifies a known AI assistant.</MetricSummary>
          <MetricSummary label="Share of sessions" value={formatRate(c.ai_sessions, c.total_sessions)}>A floor: many assistants and apps send no referrer, and those visits appear as direct.</MetricSummary>
          <MetricSummary label="Engaged" value={formatRate(aiEngaged, c.ai_sessions)}>Of AI referral sessions: 10+ s, 2+ pages, or a confirmed lead.</MetricSummary>
          <MetricSummary label="Confirmed leads" value={String(aiConverting)}>Server-confirmed leads in AI referral sessions (association, not proof of cause).</MetricSummary>
        </dl>

        {c.ai_sessions === 0 ? (
          <Empty>No sessions arrived from an identifiable AI assistant in this range. That does not mean none were influenced by one: many assistants strip referrers, and those visits are counted as direct / unknown.</Empty>
        ) : (
          <>
            <Panel nested title="Referral trend" note="AI referral sessions per day, UTC."><DayBars points={c.trend} label="AI referral sessions" /></Panel>
            <Panel nested title="By assistant" note="Platform is taken from the referrer host or UTM source. Bars compare session counts with the largest assistant shown.">
              <ReportTable label="Assistant referral comparison">
                <table className="w-full min-w-[520px] text-left text-sm tabular-nums">
                  <thead className="text-xs uppercase tracking-widest text-[#5a5049]"><tr><th className="py-2 pr-4 font-normal">Assistant</th><th className="pr-4 text-right font-normal">Sessions</th><th className="pr-4 text-right font-normal">Engaged</th><th className="pr-4 text-right font-normal">Avg time</th><th className="text-right font-normal">Leads</th></tr></thead>
                  <tbody>{c.platforms.map((x) => (
                    <tr key={x.key} className="border-t border-[#1a1816]/10"><th scope="row" className="min-w-36 py-3 pr-4 font-medium">{x.key}<ComparisonBar value={x.sessions} max={assistantPeak} /></th><td className="pr-4 text-right">{x.sessions}</td><td className="pr-4 text-right">{formatRate(x.engaged, x.sessions)}</td><td className="pr-4 text-right">{formatDuration(x.engaged_ms / Math.max(x.sessions, 1))}</td><td className="text-right">{x.conversions}</td></tr>
                  ))}</tbody>
                </table>
              </ReportTable>
              <p className="mt-3 text-xs text-[#5a5049]">Overall average time in AI referral sessions: {formatDuration(aiMs / Math.max(c.ai_sessions, 1))}.</p>
            </Panel>
            <div className="space-y-6">
              <Panel nested title="Landing pages from AI referrals"><BarList wrap total={c.ai_sessions} rows={c.landing.map((l) => ({ key: l.key, value: l.sessions, sub: l.conversions ? `${l.conversions} with a confirmed lead` : undefined }))} /></Panel>
            </div>
            <Panel nested title="Classification evidence" note="Exactly what each classification was based on.">
              <ul className="space-y-1 text-sm">{c.evidence.map((e, i) => <li key={i} className="flex justify-between gap-3"><span>{e.platform} <span className="text-xs text-[#5a5049]">· {e.evidence ?? "—"}</span></span><span className="tabular-nums text-[#1a1816]/70">{e.sessions}</span></li>)}</ul>
            </Panel>
          </>
        )}

        <Panel nested title="Known AI referral domains" note="Editable list used to classify referrers (table wi_ai_referral_domains). A change applies to new sessions within about 5 minutes; stored sessions keep their original classification and raw referrer.">
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => <li key={d.domain} className={d.active ? "" : "text-[#5a5049] line-through"}>{d.domain} <span className="text-xs text-[#5a5049]">→ {d.platform}</span></li>)}
          </ul>
        </Panel>
      </Layer>

      <Layer title="AI crawler activity">
        <div className="border border-dashed border-[#1a1816]/25 bg-white/60 p-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1816]/70">Not available</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#1a1816]/65">
            No crawler figure is shown because none is being collected, and none will be estimated. Crawlers (GPTBot, ClaudeBot, PerplexityBot and
            others) do not run JavaScript, so the page tracker never sees them; they can only be seen in server request logs, and this hosting setup
            does not give the application those logs.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#5a5049]">What would make it measurable (awaiting your decision)</p>
          <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-sm text-[#1a1816]/65">
            <li>Intercepting every public request in <code>proxy.ts</code> and logging crawler hits: adds latency and a database write per request. Not approved.</li>
            <li>Vercel Log Drains or an equivalent log export: a paid-plan feature at the time of writing (verify current plans before relying on it). Not approved.</li>
            <li>Verification: user-agent strings can be faked, so counts should be confirmed against providers&apos; published IP ranges where they exist, and shown as verified / unverified.</li>
          </ul>
          <p className="mt-3 max-w-3xl text-xs text-[#5a5049]">Even once measured, crawler access is not a recommendation or a citation: it only shows that a bot fetched a page.</p>
        </div>
      </Layer>

      <Layer title="Manual recommendation and citation benchmarks">
        <Panel nested title="Recorded answers" note="Manually recorded observations, kept apart from visitor analytics. Each is one answer from one assistant on one date; it does not describe every answer an assistant gives.">
          {bench.length === 0 ? <Empty>No benchmark results recorded yet. Add your question universe and record what assistants say.</Empty> : (
            <ReportTable label="Manual benchmark summary">
              <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                <thead className="text-xs uppercase tracking-widest text-[#5a5049]"><tr><th className="py-2 pr-4 font-normal">Assistant</th><th className="px-2 text-right font-normal">Answers</th><th className="px-2 text-right font-normal">Names business</th><th className="px-2 text-right font-normal">Cites site</th><th className="px-2 text-right font-normal">Recommends</th></tr></thead>
                <tbody>{bench.map((s) => <tr key={s.platform} className="border-t border-[#1a1816]/10"><td className="py-2 pr-4">{s.platform}</td><td className="px-2 text-right">{s.answers}</td><td className="px-2 text-right">{benchRate(s.mentions_business)}</td><td className="px-2 text-right">{benchRate(s.cites_site)}</td><td className="px-2 text-right">{benchRate(s.recommends_business)}</td></tr>)}</tbody>
              </table>
              </ReportTable>
          )}
          <Link href="/admin/intelligence/ai-visibility/benchmarks" className="mt-4 inline-block text-xs uppercase tracking-widest text-[#6b1f1f]">Manage questions and record results →</Link>
          <p className="mt-3 text-xs text-[#5a5049]">No automated or recurring benchmarking runs. That would need your approval of providers, method and budget.</p>
        </Panel>
      </Layer>
    </IntelligenceFrame>
  );
}
