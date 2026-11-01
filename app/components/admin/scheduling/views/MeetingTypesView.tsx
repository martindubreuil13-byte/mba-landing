import Link from "next/link";
import CopyLinkButton from "../CopyLinkButton";
import type { AdminBase } from "../admin-base";
import { btnPrimary, label, textLink } from "@/app/components/scheduling/ui";
import { typeLinkPath } from "@/app/lib/scheduling/admin-views";
import type { SchedulingData } from "@/app/lib/scheduling/types";
import { WEEKDAY_NAMES } from "@/app/lib/scheduling/timezone";

const DAYS = [1, 2, 3, 4, 5, 6, 0];
const summary = (weekly: Record<string, unknown[]>) => {
  const open = DAYS.filter((d) => (weekly[String(d)] ?? []).length);
  return open.length ? open.map((d) => WEEKDAY_NAMES[d].slice(0, 3)).join(", ") : "No days open";
};

export default function MeetingTypesView({ base, data }: { base: AdminBase; data: SchedulingData }) {
  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm text-[#1a1816]/60">Each meeting type has its own link, length and weekly availability.</p>
        <Link href={`${base.routes}/meeting-types/new`} className={btnPrimary}>New meeting type</Link>
      </div>
      <ul className="border-t border-[#1a1816]/[.12]">
        {data.meetingTypes.map((t) => (
          <li key={t.id} className={`grid gap-x-10 gap-y-4 border-b border-[#1a1816]/[.12] py-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] ${t.active ? "" : "opacity-55"}`}>
            <div>
              <h2 className="text-2xl font-light tracking-tight">{t.name}{!t.active && <span className="ml-3 align-middle text-[11px] uppercase tracking-[.2em] text-[#8b2525]">Inactive</span>}</h2>
              <p className="mt-1 text-sm text-[#1a1816]/55">{t.durationMinutes} min · Zoom{t.priceLabel ? ` · ${t.priceLabel}` : ""} · {t.visibility === "public" ? "Public" : "Invitation only"}</p>
            </div>
            <div className="text-sm text-[#1a1816]/70">
              <p><span className={label}>Open</span><br />{summary(t.availability.weekly)}</p>
              <p className="mt-3"><span className={label}>Buffers</span><br />{t.bufferBeforeMinutes === 0 ? "No buffer before" : `${t.bufferBeforeMinutes} min before`} · {t.bufferAfterMinutes === 0 ? "none after" : `${t.bufferAfterMinutes} min after`}</p>
              <p className="mt-3"><span className={label}>Link</span><br /><span className="font-mono text-xs">/book/{t.slug}</span> <CopyLinkButton path={typeLinkPath(t)} /></p>
            </div>
            <div className="flex gap-6 text-sm md:flex-col md:gap-2 md:text-right">
              <Link className={textLink} href={`${base.routes}/meeting-types/${t.id}`}>Edit</Link>
              <Link className={textLink} href={`${base.routes}/availability?type=${t.id}`}>Availability</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
