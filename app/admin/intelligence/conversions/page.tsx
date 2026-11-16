import { MetricSummary } from "@/app/components/admin/intelligence/EditorialReport";
import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart, getConversions } from "@/app/lib/intelligence/reports";
import { formatRate, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import { conversionLabel } from "@/app/lib/intelligence/events";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { BarList, DayBars, Empty, NotMeasured, Panel } from "@/app/components/admin/intelligence/parts";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Conversions | Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

export default async function IntelligenceConversionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveRange({ range: one(params, "range"), from: one(params, "from"), to: one(params, "to") });
  const [{ current: c, previous: p }, collectionStart] = await Promise.all([getConversions(range), getCollectionStart()]);
  const srcLabel = (k: string) => (k === "unattributed" ? "No session id (unattributed)" : SOURCE_LABELS[k as SourceCategory] ?? k);

  const observations = [
    { label: "Sessions", n: c.sessions, note: "Anonymous per-tab visits." },
    { label: "Engaged sessions", n: c.engaged_sessions, note: "10+ s visible, 2+ pages, or a confirmed lead." },
    { label: "Sessions with a CTA click", n: c.sessions_with_cta, note: "Any program, assessment, napkin or booking call-to-action clicked." },
    { label: "Sessions with a confirmed lead", n: c.converting_sessions, note: "Server accepted a submission in this session." },
  ];

  return (
    <IntelligenceFrame active="conversions" range={range} params={params} collectionStart={collectionStart}>
      <p className="mb-6 max-w-3xl text-sm text-[#1a1816]/60">
        A <strong>lead</strong>{" "}here is a submission the server confirmed (the database or email provider accepted it), not a button click.
        Leads are linked to a visit only when the visitor&apos;s browser sent its anonymous session id; others are counted as
        &ldquo;unattributed&rdquo;. Attribution is association (the session&apos;s source and landing page), not proof of cause.
      </p>

      <dl className="mb-8 grid gap-6 bg-[#faf5eb] p-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricSummary label="Total leads" value={String(c.total_leads)} current={c.total_leads} previous={p.total_leads}>Server-confirmed inquiries, guide requests, assessment leads, napkin joins and program applications.</MetricSummary>
        <MetricSummary label="Linked to a visit" value={`${c.attributed_leads}`}>{`${formatRate(c.attributed_leads, c.total_leads)} of leads carried a session id. The rest (analytics off, blocked, or GPC/DNT) have no source or page journey.`}</MetricSummary>
        <MetricSummary label="Lead conversion rate" value={formatRate(c.converting_sessions, c.sessions)} current={c.sessions ? (c.converting_sessions / c.sessions) * 100 : undefined} previous={p.sessions ? (p.converting_sessions / p.sessions) * 100 : undefined}>Sessions with a confirmed lead ÷ all sessions.</MetricSummary>
        <MetricSummary label="Booking-link clicks" value={String(c.booking_clicks)} current={c.booking_clicks} previous={p.booking_clicks}>{`${c.sessions_with_booking_click} ${c.sessions_with_booking_click === 1 ? "session" : "sessions"} clicked a booking link. A click is not a booking.`}</MetricSummary>
        <MetricSummary label="Assessment starts" value={String(c.sessions_with_start)} current={c.sessions_with_start} previous={p.sessions_with_start}>Sessions that began the assessment, napkin or program questionnaire (browser-reported).</MetricSummary>
        <MetricSummary label="Assessment completion" value={formatRate(c.sessions_with_complete, c.sessions_with_start)}>{`${c.sessions_with_complete} reported completions for ${c.sessions_with_start} reported starts (browser-reported; “—” if none started).`}</MetricSummary>
      </dl>
      <div className="mb-8 bg-[#faf5eb] p-5">
        <NotMeasured label="Confirmed bookings" reason="Confirmed bookings are not counted in this report. They are listed with their inquiry or application under Inquiries, and in full under Scheduling." />
      </div>

      {c.sessions === 0 && c.total_leads === 0 ? <Empty>No sessions or leads were recorded in this range.</Empty> : (
        <div className="space-y-6">
          <Panel title="Observed session activity" note="Bars show share of all sessions. Counts can overlap and do not represent steps or drop-off.">
            <ul className="space-y-4">
              {observations.map((s) => (
                <li key={s.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm"><span>{s.label}</span><span className="tabular-nums text-[#1a1816]/70">{s.n} <span className="text-[#1a1816]/40">· {formatRate(s.n, c.sessions)} of sessions</span></span></div>
                  <div className="mt-1 h-2 bg-[#1a1816]/[0.07]" aria-hidden><div className="h-full bg-[#6b1f1f]" style={{ width: `${c.sessions ? (s.n / c.sessions) * 100 : undefined}%` }} /></div>
                  <p className="mt-1 text-xs text-[#1a1816]/45">{s.note}</p>
                </li>
              ))}
              <li className="border-t border-dashed border-[#1a1816]/15 pt-3 text-sm text-[#1a1816]/50">Actual bookings are tracked in Scheduling. This report has no confirmed booking count.</li>
            </ul>
          </Panel>

          <Panel title="Lead trend" note="Confirmed leads per day, UTC."><DayBars points={c.trend} label="Confirmed leads" /></Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Leads by type"><BarList wrap total={c.total_leads} label={conversionLabel} rows={c.by_kind.map((r) => ({ key: r.key, value: r.n }))} /></Panel>
            <Panel title="Leads by source" note="The source of the session the lead belongs to (first referrer / UTM)."><BarList wrap total={c.total_leads} label={srcLabel} rows={c.by_source.map((r) => ({ key: r.key, value: r.n }))} /></Panel>
            <Panel title="Leads by landing page" note="The page the lead's session began on."><BarList wrap total={c.total_leads} rows={c.by_landing.map((r) => ({ key: r.key, value: r.n }))} /></Panel>
            <Panel title="Converting page" note="The page the form was submitted from."><BarList wrap total={c.total_leads} rows={c.by_converting_page.map((r) => ({ key: r.key, value: r.n }))} /></Panel>
          </div>
        </div>
      )}
    </IntelligenceFrame>
  );
}
