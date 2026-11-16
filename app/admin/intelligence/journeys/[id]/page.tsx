import type { Metadata } from "next";
import Link from "next/link";
import { reportHref, type ReportParams } from "@/app/components/admin/intelligence/report-links";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart } from "@/app/lib/intelligence/reports";
import { getJourney } from "@/app/lib/intelligence/journeys";
import { cleanTitle } from "@/app/lib/intelligence/content-table";
import { buildTimeline, isSessionId, sessionDurationMs, summarize } from "@/app/lib/intelligence/journeys-model";
import { formatDuration, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import { conversionLabel } from "@/app/lib/intelligence/events";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { Panel } from "@/app/components/admin/intelligence/parts";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Session | Website Intelligence" };
export const dynamic = "force-dynamic";

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div><dt className="text-xs uppercase tracking-widest text-[#5a5049]">{label}</dt><dd className="mt-1 break-words text-sm">{value || <span className="text-[#1a1816]/35">—</span>}</dd></div>
);

export default async function IntelligenceJourneyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ReportParams> }) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const one = (value: string | string[] | undefined) => typeof value === "string" ? value : undefined;
  const range = resolveRange({ range: one(query.range), from: one(query.from), to: one(query.to) });
  if (!isSessionId(id)) notFound();
  const [journey, collectionStart] = await Promise.all([getJourney(id), getCollectionStart()]);
  if (!journey) notFound();

  const { session: s, pageviews, events } = journey;
  const items = buildTimeline(s, pageviews, events);
  const utm = [s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content].some(Boolean)
    ? `source=${s.utm_source ?? "—"} · medium=${s.utm_medium ?? "—"} · campaign=${s.utm_campaign ?? "—"} · content=${s.utm_content ?? "—"}` : null;

  return (
    <IntelligenceFrame active="journeys" range={range} params={query} collectionStart={collectionStart}>
      <Link href={reportHref("/admin/intelligence/journeys", query, range)} className="mb-4 inline-block text-xs uppercase tracking-widest text-[#6b1f1f]">← All sessions</Link>
      <p className="mb-6 max-w-3xl text-sm text-[#1a1816]/60">
        One anonymous browser-tab session. It does not represent an identified person, and it holds nothing a visitor typed.
        {s.environment !== "production" ? ` (Recorded by a ${s.environment} deployment.)` : ""}
      </p>

      <div className="space-y-6">
        <Panel title="Path at a glance"><p className="text-sm leading-relaxed text-[#1a1816]/80">{summarize(items)}</p></Panel>

        <Panel title="Attribution" note="Session source = how this session's first page view arrived. Raw values are kept so the rule can be revised.">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            <Fact label="Source" value={s.ai_platform ? `${SOURCE_LABELS.ai_assistant}: ${s.ai_platform}` : SOURCE_LABELS[s.source_category as SourceCategory] ?? s.source_category} />
            <Fact label="Evidence" value={s.source_evidence} />
            <Fact label="Raw referrer" value={s.referrer} />
            <Fact label="UTM" value={utm} />
            <Fact label="Landing page" value={s.landing_path} />
            <Fact label="Exit page (last seen)" value={s.last_path} />
            <Fact label="Session length" value={formatDuration(sessionDurationMs(s))} />
            <Fact label="Visible time on pages" value={s.engaged_ms ? formatDuration(s.engaged_ms) : null} />
            <Fact label="Device" value={[s.device, s.browser].filter(Boolean).join(" · ")} />
            <Fact label="Country" value={s.country} />
            <Fact label="Pages viewed" value={s.page_count} />
            <Fact label="Outcome" value={s.converted ? `Lead confirmed: ${conversionLabel(s.first_conversion ?? "lead")}` : "No confirmed lead"} />
          </dl>
        </Panel>

        <Panel title="Timeline" note="Time shown on a page is visible, in-focus time; the last page may be under-counted if the tab was killed.">
          <ol className="relative space-y-0 border-l border-[#b19d90] pl-6">
            {items.map((item, i) => (
              <li key={i} className="relative pb-7 last:pb-0 [overflow-wrap:anywhere]">
                <span aria-hidden="true" className={`absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full ${item.kind === "event" && item.confirmed ? "bg-[#6b1f1f]" : item.kind === "pageview" ? "bg-[#1a1816]" : "border border-[#1a1816]/40 bg-[#f5f1ed]"}`} />
                <p className="mb-1 text-xs font-semibold tabular-nums text-[#5a5049]"><time dateTime={item.at}>{item.at.slice(11, 19)} UTC</time> · {item.kind === "arrival" ? "Arrival" : item.kind === "pageview" ? "Page view" : item.confirmed ? "Confirmed outcome" : "Observed event"}</p>
                {item.kind === "arrival" ? (
                  <p className="text-sm">{item.label}{item.evidence ? <span className="text-xs text-[#5a5049]"> · evidence: {item.evidence}</span> : null}</p>
                ) : item.kind === "pageview" ? (
                  <p className="text-sm">
                    <span className="font-medium">{cleanTitle(item.title, item.path)}</span>
                    <span className="text-[#1a1816]/50"> {item.path}</span>
                    {item.isLanding ? <span className="ml-2 text-xs uppercase tracking-widest text-[#6b1f1f]">landing</span> : null}
                    {item.isLast ? <span className="ml-2 text-xs uppercase tracking-widest text-[#5a5049]">last seen</span> : null}
                    <span className="block text-xs text-[#5a5049]">{item.engagedMs ? `${formatDuration(item.engagedMs)} on page` : "time on page not recorded"}</span>
                  </p>
                ) : (
                  <p className={`text-sm ${item.confirmed ? "font-medium text-[#6b1f1f]" : ""}`}>
                    {item.label}
                    {item.path ? <span className="text-xs text-[#5a5049]"> on {item.path}</span> : null}
                    {Object.keys(item.props).length ? <span className="block text-xs text-[#5a5049]">{Object.entries(item.props).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</span> : null}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </IntelligenceFrame>
  );
}
