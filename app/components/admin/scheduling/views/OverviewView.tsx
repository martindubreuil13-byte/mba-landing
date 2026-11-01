import Link from "next/link";
import Agenda from "../Agenda";
import CopyLinkButton from "../CopyLinkButton";
import { isProductionDeployment } from "@/app/lib/deployment";
import PrototypeControls from "../PrototypeControls";
import type { AdminBase } from "../admin-base";
import { eyebrow, label, textLink } from "@/app/components/scheduling/ui";
import { bookingRows, needsAttention, typeLinkPath } from "@/app/lib/scheduling/admin-views";
import { DEMO_REFERENCE } from "@/app/lib/scheduling/constants";
import type { SchedulingData } from "@/app/lib/scheduling/types";
import { formatDateShort, formatTime, localDate } from "@/app/lib/scheduling/timezone";

export default function OverviewView({ base, data, now }: { base: AdminBase; data: SchedulingData; now: number }) {
  const tz = data.settings.homeTimeZone;
  const rows = bookingRows(data, now);
  const attention = rows.filter(needsAttention);
  const nowIso = new Date(now).toISOString();
  const today = localDate(now, tz);
  const upcoming = rows.filter((r) => r.status === "confirmed" && Date.parse(r.endUtc) >= now);
  const todayCount = upcoming.filter((r) => localDate(Date.parse(r.startUtc), tz) === today).length;
  const canceled = rows.filter((r) => r.status === "canceled").length;
  const sim = data.settings.simulate;

  return (
    <div className="space-y-14">
      <p className="text-sm text-[#1a1816]/60">
        <span className="text-[#1a1816]">{upcoming.length}</span> upcoming · <span className="text-[#1a1816]">{todayCount}</span> today · <span className="text-[#1a1816]">{canceled}</span> canceled · <span className="text-[#1a1816]">{data.meetingTypes.filter((t) => t.active).length}</span> meeting types
      </p>

      {attention.length > 0 && (
        <section role="status" aria-label="Needs attention" className="border-l-2 border-[#8b2525] pl-4 text-sm text-[#1a1816]/80">
          <p><span className="text-[#1a1816]">{attention.length}</span> {attention.length === 1 ? "booking needs" : "bookings need"} attention. <Link href={`${base.routes}/bookings`} className={textLink}>Open Bookings</Link></p>
          <ul className="mt-2 space-y-1 text-[#1a1816]/65">{attention.slice(0, 5).map((r) => <li key={r.id}>{r.guestName} · {r.typeName} · {[r.recovery.state !== "ok" ? r.recovery.label : null, r.conflict && r.status === "confirmed" ? "Calendar conflict" : null].filter(Boolean).join(" · ")}</li>)}</ul>
        </section>
      )}

      {(sim.googleOutage || sim.zoomFailure) && (
        <p role="status" className="border-l-2 border-[#8b2525] pl-4 text-sm text-[#1a1816]/80">Simulations are on:{sim.googleOutage ? " Google Calendar outage." : ""}{sim.zoomFailure ? " Zoom failure." : ""} Turn them off under Prototype tools below.</p>
      )}

      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Agenda rows={rows} homeTimeZone={tz} nowIso={nowIso} />

        <div className="space-y-12">
          <section aria-labelledby="mt-h">
            <div className="flex items-baseline justify-between"><h2 id="mt-h" className={eyebrow}>Booking links</h2><Link href={`${base.routes}/meeting-types`} className={`text-xs ${textLink}`}>Manage</Link></div>
            <ul className="mt-4 divide-y divide-[#1a1816]/[.12] border-y border-[#1a1816]/[.12]">
              {data.meetingTypes.map((t) => (
                <li key={t.id} className={`py-4 text-sm ${t.active ? "" : "opacity-50"}`}>
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-0.5 text-[#1a1816]/50">{t.durationMinutes} min · {t.visibility === "public" ? "Public" : "Invitation only"}{t.active ? "" : " · Inactive"}</p>
                  <p className="mt-2 flex gap-5"><CopyLinkButton path={typeLinkPath(t)} /><a className={textLink} href={typeLinkPath(t)} target="_blank" rel="noreferrer">Open ↗</a></p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="act-h">
            <h2 id="act-h" className={eyebrow}>Recent activity</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {data.activity.slice(0, 5).map((a) => <li key={a.id}><span className="block text-[#1a1816]/85">{a.summary}</span><time className="text-xs text-[#1a1816]/40" dateTime={a.at}>{formatDateShort(Date.parse(a.at), tz)} · {formatTime(Date.parse(a.at), tz)}</time></li>)}
              {data.activity.length === 0 && <li className="text-[#1a1816]/50">No activity yet.</li>}
            </ul>
          </section>
        </div>
      </div>

      <details className="border-t border-[#1a1816]/[.12] pt-6">
        <summary className="cursor-pointer text-sm tracking-wide text-[#1a1816]/70 marker:text-[#6b1f1f]">Prototype tools <span className="text-[#1a1816]/40">· simulations, outbox, reset</span></summary>
        <div className="mt-8 grid gap-14 lg:grid-cols-2">
          <div><h3 className={label}>Simulations</h3><div className="mt-4">{!isProductionDeployment() && <PrototypeControls googleOutage={sim.googleOutage} zoomFailure={sim.zoomFailure} />}</div>
            <p className="mt-8 text-xs text-[#1a1816]/50">Sample confirmation for design review: <a className={textLink} href={`/book/confirmed/${DEMO_REFERENCE}`} target="_blank" rel="noreferrer">/book/confirmed/{DEMO_REFERENCE} ↗</a></p></div>
          <div><h3 className={label}>Simulated outbox</h3><p className="mt-1 text-xs text-[#1a1816]/45">Messages the system would have sent. Nothing is emailed in Phase 1.</p>
            <ul className="mt-3 divide-y divide-[#1a1816]/[.12]">
              {data.outbox.slice(0, 6).map((m) => (
                <li key={m.id} className="py-3 text-sm"><details><summary className="cursor-pointer"><span className="font-medium">{m.subject}</span> <span className="text-[#1a1816]/50">→ {m.to}</span></summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-[#1a1816]/[.04] p-3 font-sans text-xs leading-relaxed text-[#1a1816]/75">{m.body}</pre></details></li>
              ))}
              {data.outbox.length === 0 && <li className="py-3 text-sm text-[#1a1816]/50">No messages yet. Make a booking to see one.</li>}
            </ul></div>
        </div>
      </details>
    </div>
  );
}
