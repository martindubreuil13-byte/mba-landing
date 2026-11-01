"use client";
import { useMemo, useState } from "react";
import { useBookingDrawer } from "./BookingDrawer";
import { field, label } from "@/app/components/scheduling/ui";
import { needsAttention, type BookingRow } from "@/app/lib/scheduling/admin-views";
import { formatDateShort, formatTime, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

type Filter = "attention" | "upcoming" | "past" | "canceled" | "all";
const FILTERS: { id: Filter; label: string }[] = [{ id: "attention", label: "Needs attention" }, { id: "upcoming", label: "Upcoming" }, { id: "past", label: "Past" }, { id: "canceled", label: "Canceled" }, { id: "all", label: "All" }];

export default function BookingsTable({ rows, homeTimeZone, nowIso }: { rows: BookingRow[]; homeTimeZone: string; nowIso: string }) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const { open, node } = useBookingDrawer(rows, homeTimeZone);
  const now = Date.parse(nowIso);

  const inFilter = (r: BookingRow, f: Filter) => f === "attention" ? needsAttention(r) : f === "all" ? true : f === "canceled" ? r.status === "canceled" : f === "past" ? r.status === "confirmed" && Date.parse(r.endUtc) < now : r.status === "confirmed" && Date.parse(r.endUtc) >= now;
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, rows.filter((r) => inFilter(r, f.id)).length])) as Record<Filter, number>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, now]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = rows.filter((r) => inFilter(r, filter) && (!q || `${r.guestName} ${r.guestEmail} ${r.typeName}`.toLowerCase().includes(q)));
    return filter === "past" ? [...f].reverse() : f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter, query, now]);

  return (
    <div>
      {node}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div role="tablist" aria-label="Filter bookings" className="flex flex-wrap gap-x-7 gap-y-2">
          {FILTERS.filter((f) => f.id !== "attention" || counts.attention > 0).map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} type="button" onClick={() => setFilter(f.id)} className={`border-b pb-2 text-sm tracking-wide transition ${filter === f.id ? "border-[#6b1f1f] text-[#6b1f1f]" : "border-transparent text-[#1a1816]/55 hover:text-[#1a1816]"}`}>{f.label} <span className="text-[#1a1816]/35">{counts[f.id]}</span></button>
          ))}
        </div>
        <div className="w-full sm:w-64"><label htmlFor="bk-search" className={label}>Search bookings</label><input id="bk-search" type="search" placeholder="Name, email or meeting" value={query} onChange={(e) => setQuery(e.target.value)} className={`${field} py-2 text-sm`} /></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-[#1a1816]/[.12] text-left"><th className={`${label} pb-3 font-normal`}>Client</th><th className={`${label} pb-3 font-normal`}>Meeting</th><th className={`${label} pb-3 font-normal`}>When · {homeTimeZone.replace(/_/g, " ")}</th><th className={`${label} pb-3 font-normal`}>Status</th><th className={`${label} pb-3 font-normal`}>Source</th></tr></thead>
          <tbody>
            {shown.map((r) => {
              const s = Date.parse(r.startUtc);
              const canceled = r.status === "canceled";
              return (
                <tr key={r.id} onClick={() => open(r.id)} className={`group cursor-pointer border-b border-[#1a1816]/[.12] transition hover:bg-[#1a1816]/[.025] ${canceled ? "text-[#1a1816]/50" : ""}`}>
                  <td className="py-5 pr-4"><button type="button" onClick={(e) => { e.stopPropagation(); open(r.id); }} className="text-left"><span className="font-medium group-hover:text-[#6b1f1f]">{r.guestName}</span><br /><span className="text-[#1a1816]/50">{r.guestEmail}</span></button></td>
                  <td className="pr-4">{r.typeName}<br /><span className="text-[#1a1816]/45">{r.durationMinutes} min</span></td>
                  <td className="whitespace-nowrap pr-4">{formatDateShort(s, homeTimeZone)}<br /><span className="text-[#1a1816]/55">{formatTime(s, homeTimeZone)}</span> <span className="text-xs text-[#1a1816]/35">{zoneOffsetLabel(s, homeTimeZone)}</span></td>
                  <td className="pr-4"><span className="inline-flex items-center gap-2"><span aria-hidden className={`h-2 w-2 rounded-full ${canceled ? "bg-[#8b2525]" : "bg-[#2f5d3a]"}`} />{canceled ? "Canceled" : "Confirmed"}</span>{r.rescheduled && !canceled && <span className="ml-2 text-xs text-[#1a1816]/45">moved</span>}{r.zoom.status === "pending" && r.recovery.state === "ok" && <span className="ml-2 text-xs text-[#8b2525]">Zoom pending</span>}{r.recovery.state !== "ok" && <span className={`mt-1 block text-xs ${r.recovery.state === "syncing" ? "text-[#1a1816]/45" : "text-[#8b2525]"}`}>{r.recovery.label}</span>}{r.conflict && !canceled && <span className="mt-1 block text-xs text-[#8b2525]">Calendar conflict</span>}</td>
                  <td className="text-[#1a1816]/60">{r.source ?? "Unknown"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="py-12 text-[#1a1816]/50">{query ? "No bookings match that search." : "Nothing to show here."}</p>}
      </div>
      <p className="mt-6 text-xs text-[#1a1816]/40">Select a booking to reschedule, resend, copy its link or cancel it.</p>
    </div>
  );
}
