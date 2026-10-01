import Link from "next/link";
import type { DateRange, FunnelSummary, TrendDay } from "@/app/lib/resources/funnel";
import { formatRate } from "@/app/lib/resources/funnel";
import { DELIVERY_STATUS_LABELS } from "@/app/lib/resources/delivery-status";
import { CTA_LOCATIONS } from "@/app/lib/resources/events";

export function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
      <p className="text-2xl font-light">{value}</p>
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p>
      {hint && <p className="text-[11px] text-[#1a1816]/45 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

const PRESETS: { value: DateRange["preset"]; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

/** GET form: no JavaScript needed, shareable URLs. Days are UTC. */
export function RangeFilter({ range, action }: { range: DateRange; action: string }) {
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 text-sm mb-8">
      <div className="flex border border-[#1a1816]/15 bg-white">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            name="range"
            value={p.value}
            className={`px-4 py-2 ${range.preset === p.value ? "bg-[#6b1f1f] text-white" : "text-[#1a1816]/70 hover:bg-[#1a1816]/5"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-[#1a1816]/55">
          From
          <input type="date" name="from" defaultValue={range.from} className="block border border-[#1a1816]/15 bg-white px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[#1a1816]/55">
          To
          <input type="date" name="to" defaultValue={range.to} className="block border border-[#1a1816]/15 bg-white px-2 py-1.5 text-sm" />
        </label>
        <button
          name="range"
          value="custom"
          className={`px-4 py-2 border ${range.preset === "custom" ? "bg-[#6b1f1f] text-white border-[#6b1f1f]" : "border-[#1a1816]/15 bg-white text-[#1a1816]/70 hover:bg-[#1a1816]/5"}`}
        >
          Custom range
        </button>
      </div>
      <p className="text-xs text-[#1a1816]/45">
        Showing {range.from} to {range.to} (UTC days)
      </p>
    </form>
  );
}

function Row({ label, value, formula }: { label: string; value: string | number; formula: string }) {
  return (
    <tr className="border-t border-[#1a1816]/8 align-top">
      <th scope="row" className="text-left font-normal py-3 pr-4">
        {label}
      </th>
      <td className="py-3 pr-4 text-right tabular-nums font-semibold">{value}</td>
      <td className="py-3 text-xs text-[#1a1816]/55 leading-snug">{formula}</td>
    </tr>
  );
}

export function FunnelTable({ s }: { s: FunnelSummary }) {
  return (
    <div className="border border-[#1a1816]/10 bg-white p-5 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <caption className="sr-only">Funnel metrics and how each is defined</caption>
        <thead>
          <tr className="text-xs uppercase tracking-widest text-[#1a1816]/50">
            <th scope="col" className="text-left font-normal pb-2">Metric</th>
            <th scope="col" className="text-right font-normal pb-2 pr-4">Count</th>
            <th scope="col" className="text-left font-normal pb-2">Exactly what is counted</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Page views" value={s.pageViews} formula="Resource page loads. Repeat loads in the same session within 30 minutes count once." />
          <Row label="Browser sessions" value={s.sessions} formula="Distinct anonymous per-tab session ids among page views. Not unique visitors or people: a return visit in a new tab counts again." />
          <Row label="Online guide starts" value={s.readStarts} formula="Distinct sessions that scrolled past the cover into the first exercise page." />
          <Row label="Online guide completions" value={s.readCompletions} formula="Distinct sessions that reached the final page at least 60 seconds after starting. A proxy for reading, not proof." />
          <Row label="Printable-guide CTA clicks" value={s.ctaClicks} formula={`All clicks, ${s.ctaSessions} distinct sessions.`} />
          <Row label="Form opens" value={s.formOpens} formula="Times the email form was shown." />
          <Row label="Form submissions" value={s.submissions} formula="Valid requests stored (double clicks and retries within 10 minutes count once)." />
          <Row label="Valid opt-ins" value={s.validOptIns} formula={`New sign-ups (${s.newSignups}) + already subscribed (${s.existingSubscribers}). Excludes ${s.consentNotApplied} suppressed. New sign-ups are pending until the reader confirms.`} />
          <Row label="Confirmed community members" value={s.confirmed} formula="Readers who confirmed their email from the guide email (counted on the day they confirmed). Only these are added to community marketing." />
          <Row label="PDF download starts" value={s.downloadStarts} formula="Download endpoint hits (form, backup button or email). Does not prove the file finished; email security scanners can add hits." />
        </tbody>
      </table>
    </div>
  );
}

export function RatesTable({ s }: { s: FunnelSummary }) {
  const rows = [
    { label: "View → opt-in", value: s.rates.viewToOptIn, formula: `valid opt-ins ÷ browser sessions  (${s.validOptIns} ÷ ${s.sessions})` },
    { label: "CTA click → opt-in", value: s.rates.ctaToOptIn, formula: `valid opt-ins ÷ browser sessions with a CTA click  (${s.validOptIns} ÷ ${s.ctaSessions})` },
    { label: "Sign-up → confirmed", value: s.rates.confirmation, formula: `confirmations ÷ new sign-ups in the same period  (${s.confirmed} ÷ ${s.newSignups}); confirmations lag, so recent periods read low` },
    { label: "Opt-in → download", value: s.rates.optInToDownload, formula: `requests with ≥1 download ÷ requests  (${s.requestsWithDownload} ÷ ${s.requests})` },
    { label: "Guide completion", value: s.rates.readCompletion, formula: `completions ÷ starts  (${s.readCompletions} ÷ ${s.readStarts})` },
  ];
  return (
    <div className="border border-[#1a1816]/10 bg-white p-5 overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <caption className="sr-only">Conversion rates and formulas</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t first:border-t-0 border-[#1a1816]/8">
              <th scope="row" className="text-left font-normal py-3 pr-4">{r.label}</th>
              <td className="py-3 pr-4 text-right tabular-nums font-semibold">{formatRate(r.value)}</td>
              <td className="py-3 text-xs text-[#1a1816]/55">{r.formula}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[#1a1816]/45 mt-3">Rates show “—” when the denominator is zero. Small counts make rates unstable; read them with the raw numbers.</p>
    </div>
  );
}

export function CtaTable({ s }: { s: FunnelSummary }) {
  return (
    <div className="border border-[#1a1816]/10 bg-white p-5 overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <caption className="sr-only">Performance by CTA location</caption>
        <thead>
          <tr className="text-xs uppercase tracking-widest text-[#1a1816]/50">
            <th scope="col" className="text-left font-normal pb-2">CTA</th>
            <th scope="col" className="text-right font-normal pb-2">Clicks</th>
            <th scope="col" className="text-right font-normal pb-2">Form opens</th>
            <th scope="col" className="text-right font-normal pb-2">Submissions</th>
            <th scope="col" className="text-right font-normal pb-2">Valid opt-ins</th>
            <th scope="col" className="text-right font-normal pb-2">Click → opt-in</th>
          </tr>
        </thead>
        <tbody>
          {CTA_LOCATIONS.map((loc) => {
            const c = s.byCta[loc];
            return (
              <tr key={loc} className="border-t border-[#1a1816]/8">
                <th scope="row" className="text-left font-normal py-3 capitalize">{loc.replace("-", " ")}</th>
                <td className="py-3 text-right tabular-nums">{c.clicks}</td>
                <td className="py-3 text-right tabular-nums">{c.opens}</td>
                <td className="py-3 text-right tabular-nums">{c.submissions}</td>
                <td className="py-3 text-right tabular-nums">{c.validOptIns}</td>
                <td className="py-3 text-right tabular-nums">{formatRate(c.clickToOptIn)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DeliveryTable({ s }: { s: FunnelSummary }) {
  const order = ["accepted", "queued", "sent", "delivered", "bounced", "failed", "not_tracked"] as const;
  return (
    <div className="border border-[#1a1816]/10 bg-white p-5">
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        {order.map((k) => (
          <li key={k} className="flex justify-between gap-3 border-b border-[#1a1816]/8 pb-2">
            <span>{DELIVERY_STATUS_LABELS[k]}</span>
            <span className="tabular-nums font-semibold">{s.delivery[k]}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-[#1a1816]/45 mt-3 leading-snug">
        “Queued” means the email provider accepted the message. Only “Delivered” (from the provider’s webhook) confirms delivery; if the webhook is not configured, emails stay at “Queued”.
      </p>
    </div>
  );
}

export function TrendChart({ days }: { days: TrendDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.views));
  return (
    <div className="border border-[#1a1816]/10 bg-white p-5">
      <div className="flex items-end gap-px h-28" role="img" aria-label={`Daily page views from ${days[0]?.date} to ${days[days.length - 1]?.date}`}>
        {days.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date}: ${d.views} views, ${d.optIns} opt-ins`}>
            <div className="bg-[#1a1816]/25" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0 }} />
            {d.optIns > 0 && <div className="bg-[#6b1f1f] mt-px" style={{ height: 4 }} />}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#1a1816]/50 mt-2">Grey: page views per day. Maroon marker: a day with at least one opt-in.</p>
      <details className="mt-4">
        <summary className="text-xs uppercase tracking-widest text-[#1a1816]/55 cursor-pointer">Daily table</summary>
        <div className="overflow-x-auto mt-3 max-h-80 overflow-y-auto">
          <table className="w-full text-sm min-w-[20rem]">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-[#1a1816]/50">
                <th scope="col" className="text-left font-normal pb-2">Day (UTC)</th>
                <th scope="col" className="text-right font-normal pb-2">Views</th>
                <th scope="col" className="text-right font-normal pb-2">Opt-ins</th>
                <th scope="col" className="text-right font-normal pb-2">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date} className="border-t border-[#1a1816]/8">
                  <th scope="row" className="text-left font-normal py-2">{d.date}</th>
                  <td className="py-2 text-right tabular-nums">{d.views}</td>
                  <td className="py-2 text-right tabular-nums">{d.optIns}</td>
                  <td className="py-2 text-right tabular-nums">{formatRate(d.conversion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-xs tracking-widest uppercase text-[#1a1816]/50 hover:text-[#1a1816]">
      {children}
    </Link>
  );
}
