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

function Section({ title }: { title: string }) {
  return (
    <tr>
      <th colSpan={3} scope="colgroup" className="text-left text-xs uppercase tracking-widest text-[#6b1f1f] font-semibold pt-5 pb-1">
        {title}
      </th>
    </tr>
  );
}

/** Shown above the numbers whenever a comparison could not be made safely. */
export function IntegrityBanner({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div role="alert" className="border border-[#6b1f1f]/40 bg-[#6b1f1f]/5 p-4 mb-8 text-sm">
      <p className="font-semibold text-[#6b1f1f]">Analytics integrity warning</p>
      <p className="text-[#1a1816]/70 mt-1">Some figures below cannot be compared safely, so their rates show “—” instead of a misleading number.</p>
      <ul className="list-disc pl-5 mt-2 space-y-1 text-[#1a1816]/75">
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  );
}

export function FunnelTable({ s, benefitLabel }: { s: FunnelSummary; benefitLabel: string }) {
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
          <Section title="Public layer (no email needed)" />
          <Row label="Public views" value={s.pageViews} formula="Resource page loads. Repeat loads in the same session within 30 minutes count once." />
          <Row label="Browser sessions" value={s.sessions} formula="Distinct anonymous per-tab session ids among page views. Not unique people: a return visit in a new tab counts again." />
          <Row label="Online guide starts" value={s.readStarts} formula="Distinct sessions that scrolled past the cover into the first exercise page." />
          <Row label="Online guide completions" value={s.readCompletions} formula="Distinct sessions that reached the final page at least 60 seconds after starting. A proxy for reading, not proof." />
          <Section title="Member-benefit interest" />
          <Row label={`${benefitLabel} CTA clicks`} value={s.ctaClicks} formula={`All clicks, from ${s.ctaSessions} distinct sessions.`} />
          <Row label="Form opens" value={s.formOpens} formula="Times the email form was shown." />
          <Section title="Membership" />
          <Row label="Membership requests" value={s.membershipRequests} formula={`Requests that asked to become a member (new or pending addresses). A further ${s.existingMemberRequests} came from confirmed members asking again.`} />
          <Row label="Pending confirmations" value={s.pendingConfirmations} formula="Membership requests in this range that are still locked and whose address has neither confirmed nor unsubscribed." />
          <Row label="Confirmed members" value={s.confirmedMembers} formula="Distinct people who pressed the confirmation button in this range. Only they are added to community marketing." />
          <Section title="Benefit" />
          <Row label={`${benefitLabel} unlocked`} value={s.benefitsFulfilled} formula={`${s.fulfilledByConfirmation} at confirmation · ${s.fulfilledExistingMember} for members who asked again. Counted once per request.`} />
          <Row label="Download starts" value={s.downloadStarts} formula={`Download endpoint hits (confirmation page, email link). ${s.requestsDownloaded} unlocked requests downloaded at least once. Does not prove the file finished; email security scanners can add hits.`} />
          <Section title="Delivery and outcomes" />
          <Row label="Delivery failures" value={s.deliveryFailures} formula="Requests whose latest email bounced or failed (details below)." />
          <Row label="Unsubscribed since requesting" value={s.unsubscribedMembers} formula="Requests in this range whose person has since unsubscribed. They keep anything already unlocked." />
          <Row label="Suppressed since requesting" value={s.suppressedMembers} formula="Requests whose person was suppressed (e.g. a spam complaint). Never re-added by a form." />
          <Row label="Attempts ignored (never shown to visitors)" value={s.blockedAttempts.unsubscribed + s.blockedAttempts.suppressed} formula={`${s.blockedAttempts.unsubscribed} from unsubscribed addresses and ${s.blockedAttempts.suppressed} from suppressed addresses submitted the form; nothing was sent or changed. Unsubscribed people can rejoin deliberately at /rejoin.`} />
        </tbody>
      </table>
    </div>
  );
}

export function RatesTable({ s }: { s: FunnelSummary }) {
  const c = s.conversions;
  const rows = [c.viewToReadStart, c.readStartToCompletion, c.viewToCta, c.ctaToRequest, c.viewToRequest, c.requestToConfirmed, c.confirmedToFulfilled, c.fulfilledToDownloaded];
  return (
    <div className="border border-[#1a1816]/10 bg-white p-5 overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <caption className="sr-only">Conversion rates and formulas</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t first:border-t-0 border-[#1a1816]/8">
              <th scope="row" className="text-left font-normal py-3 pr-4">{r.label}</th>
              <td className="py-3 pr-4 text-right tabular-nums font-semibold">{formatRate(r.rate)}</td>
              <td className="py-3 text-xs text-[#1a1816]/55">{r.numerator} ÷ {r.denominator} {r.unit}s{r.rate === null && r.denominator > 0 ? " — not comparable (see warning)" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[#1a1816]/45 mt-3">Every rate compares the same unit on both sides (sessions with sessions, requests with requests, members with members) and is never capped. “—” means there is no denominator or the numerator is not a subset of it. Small counts make rates unstable.</p>
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
            <th scope="col" className="text-right font-normal pb-2">Membership requests</th>
            <th scope="col" className="text-right font-normal pb-2">Session click → request</th>
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
                <td className="py-3 text-right tabular-nums">{c.requests}</td>
                <td className="py-3 text-right tabular-nums">{formatRate(c.clickToRequest.rate)}</td>
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
        The state of the LATEST email for each request (the confirmation email, then the benefit email once unlocked). “Queued” means the provider accepted it; only “Delivered” (from the provider’s webhook) confirms delivery.
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
          <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date}: ${d.views} views, ${d.requests} membership requests`}>
            <div className="bg-[#1a1816]/25" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0 }} />
            {d.requests > 0 && <div className="bg-[#6b1f1f] mt-px" style={{ height: 4 }} />}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#1a1816]/50 mt-2">Grey: page views per day. Maroon marker: a day with at least one membership request.</p>
      <details className="mt-4">
        <summary className="text-xs uppercase tracking-widest text-[#1a1816]/55 cursor-pointer">Daily table</summary>
        <div className="overflow-x-auto mt-3 max-h-80 overflow-y-auto">
          <table className="w-full text-sm min-w-[20rem]">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-[#1a1816]/50">
                <th scope="col" className="text-left font-normal pb-2">Day (UTC)</th>
                <th scope="col" className="text-right font-normal pb-2">Views</th>
                <th scope="col" className="text-right font-normal pb-2">Requests</th>
                <th scope="col" className="text-right font-normal pb-2">Sessions with a request ÷ sessions</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date} className="border-t border-[#1a1816]/8">
                  <th scope="row" className="text-left font-normal py-2">{d.date}</th>
                  <td className="py-2 text-right tabular-nums">{d.views}</td>
                  <td className="py-2 text-right tabular-nums">{d.requests}</td>
                  <td className="py-2 text-right tabular-nums">{formatRate(d.conversion.rate)}</td>
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
