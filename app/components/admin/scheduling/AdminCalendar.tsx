"use client";
import { useMemo, useState } from "react";
import { useBookingDrawer } from "./BookingDrawer";
import { btnQuiet } from "@/app/components/scheduling/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BookingRow } from "@/app/lib/scheduling/admin-views";
import { addDays, formatTime, localDate, MONTH_NAMES, pad, weekdayOf, WEEKDAY_NAMES, zonedParts, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

type View = "day" | "week" | "month";
const HOUR_PX = 56;
const startOfWeek = (d: string) => addDays(d, -((weekdayOf(d) + 6) % 7)); // Monday
const daysIn = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
const shiftMonth = (d: string, by: number) => { const [y, m] = d.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1 + by, 1)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-01`; };
const dayLabel = (d: string) => { const [, m, day] = d.split("-").map(Number); return `${WEEKDAY_NAMES[weekdayOf(d)].slice(0, 3)} ${MONTH_NAMES[m - 1].slice(0, 3)} ${day}`; };

/** Day, week and month views of confirmed (and optionally canceled) bookings, laid out in the administrator's home time zone. */
export default function AdminCalendar({ rows, homeTimeZone, today, nowIso }: { rows: BookingRow[]; homeTimeZone: string; today: string; nowIso: string }) {
  const tz = homeTimeZone;
  const { open, node } = useBookingDrawer(rows, tz);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(today);
  const [showCanceled, setShowCanceled] = useState(false);

  const events = useMemo(() => rows.filter((r) => showCanceled || r.status === "confirmed").map((r) => ({ r, date: localDate(Date.parse(r.startUtc), tz) })), [rows, showCanceled, tz]);
  const byDate = useMemo(() => { const m = new Map<string, typeof events>(); for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]); return m; }, [events]);

  const now = Date.parse(nowIso);
  const nextDate = useMemo(() => { const n = rows.filter((r) => r.status === "confirmed" && Date.parse(r.endUtc) >= now).sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc))[0]; return n ? localDate(Date.parse(n.startUtc), tz) : null; }, [rows, now, tz]);
  const move = (dir: -1 | 1) => setAnchor(view === "day" ? addDays(anchor, dir) : view === "week" ? addDays(anchor, 7 * dir) : shiftMonth(anchor, dir));
  const title = view === "month" ? `${MONTH_NAMES[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}` : view === "week" ? `${dayLabel(startOfWeek(anchor))} – ${dayLabel(addDays(startOfWeek(anchor), 6))}` : `${WEEKDAY_NAMES[weekdayOf(anchor)]}, ${dayLabel(anchor)} ${anchor.slice(0, 4)}`;
  const cols = useMemo(() => (view === "day" ? [anchor] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))), [view, anchor]);

  // Hour range for the time grid: 8-19 by default, widened to include anything scheduled in view.
  const grid = useMemo(() => {
    let lo = 8, hi = 19;
    for (const d of cols) for (const e of byDate.get(d) ?? []) {
      const s = zonedParts(Date.parse(e.r.startUtc), tz), f = zonedParts(Date.parse(e.r.endUtc), tz);
      lo = Math.min(lo, s.hour); hi = Math.max(hi, f.hour + (f.minute ? 1 : 0));
    }
    return { lo, hi };
  }, [cols, byDate, tz]);

  const pill = (e: { r: BookingRow }) => `${e.r.status === "canceled" ? "border-[#8b2525]/40 bg-white text-[#8b2525] line-through" : "border-[#6b1f1f]/30 bg-[#6b1f1f]/10 text-[#4d1616]"}`;
  const btn = "grid h-10 w-10 place-items-center border border-[#1a1816]/25 transition hover:border-[#6b1f1f] hover:text-[#6b1f1f]";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous" className={btn} onClick={() => move(-1)}><ChevronLeft aria-hidden className="h-4 w-4" /></button>
          <button type="button" aria-label="Next" className={btn} onClick={() => move(1)}><ChevronRight aria-hidden className="h-4 w-4" /></button>
          <button type="button" className={`ml-1 px-4 py-2 ${btnQuiet}`} onClick={() => setAnchor(today)}>Today</button>
          {nextDate && <button type="button" className={`px-4 py-2 ${btnQuiet}`} onClick={() => setAnchor(nextDate)}>Next booking</button>}
          <h2 className="ml-3 text-2xl font-light tracking-tight" aria-live="polite">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[#1a1816]/65"><input type="checkbox" checked={showCanceled} onChange={(e) => setShowCanceled(e.target.checked)} className="accent-[#6b1f1f]" />Show canceled</label>
          <div role="group" aria-label="Calendar view" className="flex">
            {(["day", "week", "month"] as View[]).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`border px-4 py-2 text-xs uppercase tracking-[.15em] ${view === v ? "border-[#6b1f1f] bg-[#6b1f1f] text-white" : "border-[#1a1816]/25 text-[#1a1816]/70 hover:border-[#6b1f1f]"}`}>{v}</button>)}
          </div>
        </div>
      </div>
      <p className="mb-4 text-xs text-[#1a1816]/45">Times in {tz.replace(/_/g, " ")} ({zoneOffsetLabel(Date.parse(`${anchor}T12:00:00Z`), tz)}).</p>

      {view === "month" ? (
        <div className="overflow-x-auto"><div className="min-w-[640px] border-l border-t border-[#1a1816]/[.12] bg-white/60">
          <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-[.18em] text-[#1a1816]/45">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="border-b border-r border-[#1a1816]/10 py-2">{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {(() => {
              const first = `${anchor.slice(0, 7)}-01`;
              const lead = (weekdayOf(first) + 6) % 7;
              const total = Math.ceil((lead + daysIn(anchor.slice(0, 7))) / 7) * 7;
              return Array.from({ length: total }, (_, i) => addDays(first, i - lead)).map((d) => {
                const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
                const list = byDate.get(d) ?? [];
                return (
                  <div key={d} className={`min-h-[104px] border-b border-r border-[#1a1816]/10 p-1.5 ${inMonth ? "" : "bg-[#f5f1ed]/60 text-[#1a1816]/35"}`}>
                    <button type="button" onClick={() => { setAnchor(d); setView("day"); }} className={`mb-1 grid h-6 w-6 place-items-center text-xs ${d === today ? "rounded-full bg-[#6b1f1f] text-white" : "hover:text-[#6b1f1f]"}`} aria-label={`Open ${d}`}>{Number(d.slice(8))}</button>
                    <ul className="space-y-1">
                      {list.slice(0, 3).map((e) => <li key={e.r.id}><button type="button" onClick={() => open(e.r.id)} className={`block w-full truncate border px-1.5 py-0.5 text-left text-[11px] ${pill(e)}`}>{formatTime(Date.parse(e.r.startUtc), tz)} {e.r.guestName}</button></li>)}
                      {list.length > 3 && <li><button type="button" onClick={() => { setAnchor(d); setView("day"); }} className="text-[11px] text-[#6b1f1f] underline">+{list.length - 3} more</button></li>}
                    </ul>
                  </div>
                );
              });
            })()}
          </div>
        </div></div>
      ) : (
        <div className="overflow-x-auto"><div className="min-w-[640px] border border-[#1a1816]/[.12] bg-white/60">
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(0, 1fr))` }}>
            <div className="border-b border-[#1a1816]/10" />
            {cols.map((d) => <div key={d} className={`border-b border-l border-[#1a1816]/10 py-2 text-center text-xs uppercase tracking-[.15em] ${d === today ? "text-[#6b1f1f]" : "text-[#1a1816]/55"}`}>{dayLabel(d)}</div>)}
            <div className="relative" style={{ height: (grid.hi - grid.lo) * HOUR_PX }}>
              {Array.from({ length: grid.hi - grid.lo }, (_, i) => <span key={i} className="absolute right-2 -translate-y-1/2 text-[11px] text-[#1a1816]/40" style={{ top: i * HOUR_PX + 0 }}>{i === 0 ? "" : formatHour(grid.lo + i)}</span>)}
            </div>
            {cols.map((d) => (
              <div key={d} className="relative border-l border-[#1a1816]/10" style={{ height: (grid.hi - grid.lo) * HOUR_PX }}>
                {Array.from({ length: grid.hi - grid.lo }, (_, i) => <div key={i} className="absolute inset-x-0 border-t border-[#1a1816]/[.07]" style={{ top: i * HOUR_PX }} />)}
                {(byDate.get(d) ?? []).map((e) => {
                  const s = zonedParts(Date.parse(e.r.startUtc), tz), f = zonedParts(Date.parse(e.r.endUtc), tz);
                  const top = ((s.hour - grid.lo) * 60 + s.minute) / 60 * HOUR_PX;
                  const h = Math.max(24, (((f.hour - s.hour) * 60 + (f.minute - s.minute)) / 60) * HOUR_PX - 2);
                  return <button key={e.r.id} type="button" onClick={() => open(e.r.id)} style={{ top, height: h }} className={`absolute inset-x-1 overflow-hidden border px-2 py-1 text-left text-[11px] leading-tight ${pill(e)}`}><span className="font-medium">{formatTime(Date.parse(e.r.startUtc), tz)}</span> {e.r.guestName}<br /><span className="opacity-70">{e.r.typeName}</span></button>;
                })}
              </div>
            ))}
          </div>
        </div></div>
      )}

      {node}
    </div>
  );
}

function formatHour(h: number) { const x = h % 12 === 0 ? 12 : h % 12; return `${x} ${h < 12 ? "AM" : "PM"}`; }
