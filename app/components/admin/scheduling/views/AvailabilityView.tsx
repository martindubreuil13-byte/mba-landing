import Link from "next/link";
import AvailabilityEditor from "../AvailabilityEditor";
import HomeZoneForm from "../HomeZoneForm";
import type { AdminBase } from "../admin-base";
import { label } from "@/app/components/scheduling/ui";
import { isSchedulingError, type SchedulingService } from "@/app/lib/scheduling/service";
import type { SchedulingData } from "@/app/lib/scheduling/types";
import { formatDateShort, formatTime, localDate, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

export default async function AvailabilityView({ base, service, data, now, typeId }: { base: AdminBase; service: SchedulingService; data: SchedulingData; now: number; typeId?: string }) {
  const type = data.meetingTypes.find((t) => t.id === typeId) ?? data.meetingTypes[0];
  const tz = data.settings.homeTimeZone;
  if (!type) return <p className="text-[#1a1816]/55">Create a meeting type first.</p>;

  let preview: { startUtc: string }[] = [];
  let previewError = "";
  try { preview = await service.adminSlots(type.id, new Date(now).toISOString(), new Date(now + 30 * 86_400_000).toISOString()); }
  catch (e) { previewError = isSchedulingError(e) ? e.message : "Preview unavailable."; }
  const days = [...new Set(preview.map((s) => localDate(Date.parse(s.startUtc), tz)))];

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-x-8 gap-y-2 border-b border-[#1a1816]/[.12]" role="tablist" aria-label="Meeting type">
        {data.meetingTypes.map((t) => <Link key={t.id} role="tab" aria-selected={t.id === type.id} href={`${base.routes}/availability?type=${t.id}`} className={`-mb-px border-b pb-3 text-sm tracking-wide transition ${t.id === type.id ? "border-[#6b1f1f] text-[#6b1f1f]" : "border-transparent text-[#1a1816]/55 hover:text-[#1a1816]"}`}>{t.name}</Link>)}
      </div>
      <div className="mb-12 max-w-3xl">
        <p className={label}>Home time zone</p>
        <p className="mb-4 mt-2 text-sm leading-relaxed text-[#1a1816]/55">All times below are written in this zone. Daylight saving is applied automatically, so 9:00 stays 9:00 for you all year while visitors’ times shift correctly.</p>
        <HomeZoneForm value={tz} />
      </div>
      <div className="grid gap-16 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AvailabilityEditor key={`${type.id}-${tz}`} typeId={type.id} initial={type.availability} homeTimeZone={tz} />
        <aside aria-labelledby="pv-h" className="h-fit border-l-2 border-[#6b1f1f] pl-6">
          <h3 id="pv-h" className={label}>What visitors can book</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#1a1816]/45">{type.name} · next 30 days · {tz.replace(/_/g, " ")}. Saved settings only; reflects bookings and the simulated calendar.</p>
          {previewError ? <p role="alert" className="mt-4 text-sm text-[#8b2525]">{previewError}</p> : days.length === 0 ? <p className="mt-4 text-sm text-[#1a1816]/50">No open times in the next 30 days.</p> : (
            <ul className="mt-5 space-y-4 text-sm">
              {days.slice(0, 8).map((d) => { const list = preview.filter((s) => localDate(Date.parse(s.startUtc), tz) === d); return (
                <li key={d}><p className="font-medium">{formatDateShort(Date.parse(list[0].startUtc), tz)} <span className="font-normal text-[#1a1816]/40">{zoneOffsetLabel(Date.parse(list[0].startUtc), tz)}</span></p><p className="mt-0.5 leading-relaxed text-[#1a1816]/65">{list.map((s) => formatTime(Date.parse(s.startUtc), tz)).join(" · ")}</p></li>
              ); })}
              {days.length > 8 && <li className="text-xs text-[#1a1816]/45">…and {days.length - 8} more days.</li>}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
