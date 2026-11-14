import { ArrowDownRight, ArrowUpRight, CalendarDays, Mail, MousePointer2 } from "lucide-react";
import { bookingConversion, reachMetrics } from "@/app/lib/email-studio/visual-metrics";

type Engagement = { clicks: number; unique: number; suspected: number; bookings: number;
  destinations: { destination: string; clicks: number; unique_clicks: number }[] };
const format = new Intl.NumberFormat("en-GB");
const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const panel = "min-w-0 rounded-[1.6rem] bg-[#fffcf8] p-5 shadow-[0_8px_28px_#4b25200c] sm:p-7";
const palette = ["bg-[#792e39]", "bg-[#ae7868]", "bg-[#e6d7ca]"];

function Metric({ label, value }: { label: string; value: number | string | null }) {
  return <div className="min-w-0">
    <dt className="text-sm text-[#61514c]">{label}</dt>
    <dd className={typeof value === "number" ? "mt-1 font-serif text-4xl tabular-nums" : "mt-2 text-sm font-medium"}>
      {typeof value === "number" ? format.format(value) : value ?? "Unavailable"}
    </dd>
  </div>;
}

export default function CampaignIntelligence({ reach, failed, tracked, engagement, complaints, unsubscribes }: {
  reach: ReturnType<typeof reachMetrics>; failed: number; tracked: boolean;
  engagement: Engagement | null; complaints: number; unsubscribes: number;
}) {
  const { accepted, delivered, rejected, unconfirmed } = reach;
  const deliveryKnown = delivered + rejected > 0;
  const conversion = bookingConversion(engagement?.bookings, engagement?.unique);
  const segments = [["Confirmed delivered", delivered], ["Rejected after acceptance", rejected], ["Unconfirmed", unconfirmed]] as const;
  const links = [...(engagement?.destinations ?? [])].filter(({ clicks }) => clicks > 0).sort((a, b) => b.clicks - a.clicks);
  return <section aria-labelledby="campaign-intelligence" className="grid min-w-0 gap-4 text-[#30211f]">
    <header className="rounded-[1.7rem] bg-gradient-to-br from-[#661d2c] to-[#411521] p-6 text-[#fff8ef] shadow-lg sm:p-8">
      <h2 id="campaign-intelligence" className="font-serif text-3xl sm:text-4xl">Campaign Intelligence</h2>
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[[Mail, "Confirmed delivered", delivered || "Unconfirmed"], [MousePointer2, "Observed clicks", engagement?.clicks ?? "Unavailable"],
          [CalendarDays, "Attributed bookings", engagement?.bookings ?? "Unavailable"]].map(([Icon, label, value]) => {
          const Symbol = Icon as typeof Mail;
          return <div key={String(label)} className="rounded-2xl bg-white/10 p-4">
            <Symbol size={17} aria-hidden="true" className="text-[#e9c6b5]" />
            <dt className="mt-2 text-sm text-[#f2dbd0]">{String(label)}</dt>
            <dd className={typeof value === "number" ? "font-serif text-4xl tabular-nums" : "mt-1 text-sm font-medium"}>{String(value)}</dd>
          </div>;
        })}
      </dl>
    </header>

    <section className={panel} aria-labelledby="reach-heading">
      <h3 id="reach-heading" className="font-serif text-2xl text-[#661d2c]">Reach</h3>
      <p className="text-sm text-[#61514c]">Did our message arrive?</p>
      <dl className="my-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Metric label="Accepted by Resend" value={accepted} />
        <Metric label="Confirmed delivered" value={deliveryKnown ? delivered : "Unconfirmed"} />
        <Metric label="Bounced / failed" value={failed + rejected || (tracked && deliveryKnown ? 0 : null)} />
        <Metric label="Unsubscribed" value={tracked ? unsubscribes : null} />
      </dl>
      {accepted > 0 && deliveryKnown ? <>
        <div className="flex h-3 overflow-hidden rounded-full bg-[#e6d7ca]" aria-hidden="true">
          {segments.map(([label, value], index) => value > 0 && <span key={label} className={palette[index]} style={{ width: `${100 * value / accepted}%` }} title={`${label} · ${value}`} />)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {segments.map(([label, value], index) => <li key={label} className="flex items-center gap-2"><span aria-hidden="true" className={`size-2 rounded-full ${palette[index]}`} />{label} · {value}</li>)}
        </ul>
      </> : <p className="rounded-xl bg-[#f3ebe3] p-4 text-sm">The delivery breakdown appears when Resend records delivery outcomes. Provider acceptance alone does not confirm delivery.</p>}
      <p className="mt-3 text-sm text-[#61514c]">{complaints ? `${complaints} complaints recorded` : "No complaints recorded"}</p>
    </section>

    <section className={panel} aria-labelledby="engagement-heading">
      <h3 id="engagement-heading" className="font-serif text-2xl text-[#661d2c]">Engagement</h3>
      <p className="text-sm text-[#61514c]">Did anyone take action?</p>
      {engagement ? <>
        <dl className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Metric label="Total observed clicks" value={engagement.clicks} />
          <Metric label="Unique email copies clicked" value={engagement.unique} />
          <Metric label="Likely automated requests" value={engagement.suspected} />
        </dl>
        {links.length ? <ol className="grid gap-3" aria-label="Links ranked by observed clicks">
          {links.map((link) => <li key={link.destination} className="rounded-xl bg-[#f8f0e9] p-3 hover:bg-[#f0e3da]">
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 break-all">{link.destination}</span>
              <span className="shrink-0 tabular-nums">{link.clicks} clicks</span>
            </div>
            <div aria-hidden="true" className="mt-2 h-2 rounded-full bg-[#e8d9ce]"><div className="h-full rounded-full bg-[#792e39]" style={{ width: `${100 * link.clicks / links[0].clicks}%` }} /></div>
            <p className="mt-1 text-xs text-[#61514c]">{link.unique_clicks} unique email copies</p>
          </li>)}
        </ol> : <p className="rounded-xl bg-[#f3ebe3] p-4 text-sm">No observed clicks have been recorded for this campaign.</p>}
        <p className="mt-3 text-xs text-[#61514c]">Some automated requests may still appear in observed clicks.</p>
      </> : <p className="mt-4 rounded-xl bg-[#f3ebe3] p-4 text-sm">Click data is unavailable for this campaign. Tracked campaigns show observed engagement by destination.</p>}
    </section>

    <section className={panel} aria-labelledby="impact-heading">
      <div className="flex items-start justify-between gap-4">
        <div><h3 id="impact-heading" className="font-serif text-2xl text-[#661d2c]">Business impact</h3><p className="text-sm text-[#61514c]">Did it create opportunities?</p></div>
        <ArrowUpRight className="text-[#792e39]" aria-hidden="true" />
      </div>
      {engagement ? <>
        <dl className="my-5 grid gap-4 sm:grid-cols-2">
          <Metric label="Attributed complimentary-session bookings" value={engagement.bookings} />
          <Metric label="Bookings per clicked email copy" value={conversion === null ? "Unavailable" : percent.format(conversion)} />
        </dl>
        {deliveryKnown && <ol aria-label="Campaign journey" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["Sent (accepted)", accepted], ["Delivered", delivered], ["Clicked (unique)", engagement.unique], ["Booked", engagement.bookings]] as const).map(([label, value], index) =>
            <li key={label} className="relative rounded-xl bg-[#f3ebe3] p-3"><span className="text-xs">{label}</span><p className="font-serif text-2xl">{value}</p>
              {index < 3 && <ArrowDownRight aria-hidden="true" size={14} className="absolute right-2 top-3 text-[#792e39]" />}</li>)}
        </ol>}
        <p className="mt-3 text-xs text-[#61514c]">Stages are recorded independently. Bookings show confirmed attribution only.</p>
      </> : <p className="mt-4 rounded-xl bg-[#f3ebe3] p-4 text-sm">Booking attribution is unavailable for this campaign. Future tracked campaigns can connect email clicks to complimentary-session bookings.</p>}
    </section>
  </section>;
}
