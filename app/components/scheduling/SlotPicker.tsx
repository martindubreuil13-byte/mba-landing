"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDateLong, formatTime, localDate, localToInstant, MONTH_NAMES, WEEKDAY_NAMES, weekdayOf, zonedParts } from "@/app/lib/scheduling/timezone";
import { focusRing, label } from "./ui";

export type PickerSlot = { startUtc: string; endUtc: string };
/** Loads open slots for [from, to). Reject with an Error whose message is safe to show. */
export type SlotLoader = (fromIso: string, toIso: string) => Promise<PickerSlot[]>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthShift = (ym: string, by: number) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + by, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
const daysIn = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };

/**
 * Month calendar plus the day's times, in a chosen zone. Used by the public booking page and by the admin's reschedule dialog.
 * It mounts only on the client after the zone is known, so nothing here reads the clock during server rendering.
 * Visual language: no boxes. Hairlines, plain numerals, a small oxblood mark for a day that can be booked, a thin ring for the
 * chosen day, and times as quiet ruled rows.
 */
export default function SlotPicker({ load, timeZone, value, onChange, hour12 = true }: { load: SlotLoader; timeZone: string; value: string | null; onChange: (startUtc: string) => void; hour12?: boolean }) {
  const today = useMemo(() => localDate(Date.now(), timeZone), [timeZone]);
  // The server only answers for dates up to a little over a year ahead (400 days); the last month wholly inside that is as far forward as the picker goes.
  const lastYm = useMemo(() => monthShift(localDate(Date.now() + 399 * 86_400_000, timeZone).slice(0, 7), -1), [timeZone]);
  const [ym, setYm] = useState(() => (value ? localDate(Date.parse(value), timeZone) : today).slice(0, 7));
  const [date, setDate] = useState<string | null>(() => (value ? localDate(Date.parse(value), timeZone) : null));
  const [slots, setSlots] = useState<PickerSlot[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [problem, setProblem] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [hops, setHops] = useState(0); // how many empty months we skipped to find the first availability

  useEffect(() => {
    let live = true;
    setState("loading");
    const first = `${ym}-01`;
    const from = new Date(localToInstant(first, "00:00", timeZone)).toISOString();
    const to = new Date(localToInstant(addDays(`${ym}-${String(daysIn(ym)).padStart(2, "0")}`, 1), "00:00", timeZone)).toISOString();
    load(from, to).then((s) => {
      if (!live) return;
      if (s.length === 0 && !value && date === null && hops < 3 && ym < lastYm) { setHops((h) => h + 1); setYm(monthShift(ym, 1)); return; }
      setSlots(s); setState("ready");
    }).catch((e: unknown) => { if (live) { setProblem(e instanceof Error ? e.message : "Availability could not be loaded."); setState("error"); } });
    return () => { live = false; };
    // `load` is intentionally not a dependency: callers pass a new closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, timeZone, attempt]);

  const byDate = useMemo(() => {
    const m = new Map<string, PickerSlot[]>();
    for (const s of slots) { const d = localDate(Date.parse(s.startUtc), timeZone); m.set(d, [...(m.get(d) ?? []), s]); }
    return m;
  }, [slots, timeZone]);

  const lead = (weekdayOf(`${ym}-01`) + 6) % 7; // Monday first
  const [y, m] = ym.split("-").map(Number);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn(ym) }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)];
  const canGoBack = ym > today.slice(0, 7);
  const dayTimes = date ? byDate.get(date) ?? [] : [];
  const arrow = `grid h-11 w-11 place-items-center text-[#1a1816]/60 transition hover:text-[#6b1f1f] disabled:opacity-20 ${focusRing}`;

  return (
    <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_240px] md:gap-16">
      <div>
        <div className="mb-8 flex items-end justify-between">
          <h2 className="whitespace-nowrap text-3xl font-light tracking-tight md:text-4xl" aria-live="polite">{MONTH_NAMES[m - 1]} <span className="text-[#1a1816]/30">{y}</span></h2>
          <div className="-mr-3 flex">
            <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => setYm(monthShift(ym, -1))} className={arrow}><ChevronLeft aria-hidden className="h-5 w-5" strokeWidth={1.25} /></button>
            <button type="button" aria-label="Next month" disabled={ym >= lastYm} onClick={() => setYm(monthShift(ym, 1))} className={arrow}><ChevronRight aria-hidden className="h-5 w-5" strokeWidth={1.25} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-[#1a1816]/[.12] pb-3 text-center text-[10px] uppercase tracking-[.26em] text-[#1a1816]/40">{WEEKDAYS.map((d) => <div key={d}>{d}</div>)}</div>
        <div className={`grid grid-cols-7 transition-opacity duration-300 ${state === "loading" ? "opacity-40" : "opacity-100"}`} aria-busy={state === "loading"}>
          {cells.map((d, i) => {
            if (!d) return <div key={`b${i}`} />;
            const n = byDate.get(d)?.length ?? 0;
            const selected = d === date;
            const available = n > 0 && d >= today;
            return (
              <div key={d} className="grid place-items-center py-1.5 md:py-2">
                <button type="button" disabled={!available} aria-pressed={selected}
                  aria-label={`${formatDateLong(localToInstant(d, "12:00", timeZone), timeZone)}${available ? `, ${n} ${n === 1 ? "time" : "times"} available` : ", unavailable"}`}
                  onClick={() => setDate(d)}
                  className={`relative grid h-11 w-11 place-items-center rounded-full text-[15px] tabular-nums transition duration-200 md:h-12 md:w-12 ${focusRing} ${selected ? "bg-[#6b1f1f]/[.07] text-[#6b1f1f] ring-1 ring-[#6b1f1f]" : available ? "text-[#1a1816] hover:ring-1 hover:ring-[#6b1f1f]/40" : "text-[#1a1816]/20"}`}>
                  {Number(d.slice(8))}
                  {available && !selected && <span aria-hidden className="absolute bottom-1.5 h-[3px] w-[3px] rounded-full bg-[#6b1f1f]" />}
                  {d === today && !available && <span aria-hidden className="absolute bottom-1.5 h-px w-3 bg-[#1a1816]/25" />}
                </button>
              </div>
            );
          })}
        </div>
        {state === "ready" && byDate.size === 0 && <p className="mt-6 text-sm text-[#1a1816]/55">No times are open this month. Try the next month.</p>}
        {state === "error" && (
          <div role="alert" className="mt-6 border-l-2 border-[#8b2525] pl-4 text-sm text-[#1a1816]/75">
            {problem} <button type="button" onClick={() => setAttempt((a) => a + 1)} className="ml-1 underline underline-offset-2 hover:text-[#6b1f1f]">Try again</button>
          </div>
        )}
      </div>

      <div className="min-h-[120px] md:border-l md:border-[#1a1816]/[.12] md:pl-10" aria-live="polite">
        {!date && state !== "error" && <p className="pt-2 text-sm italic text-[#1a1816]/45">{state === "loading" ? "Checking availability…" : "Choose a day to see the times."}</p>}
        {date && (() => {
          const noon = localToInstant(date, "12:00", timeZone);
          const p = zonedParts(noon, timeZone);
          return (
            <>
              <p className={label}>{WEEKDAY_NAMES[p.weekday]}</p>
              <p className="mt-1 text-2xl font-light tracking-tight">{MONTH_NAMES[p.month - 1]} {p.day}</p>
              <p className="sr-only">{formatDateLong(noon, timeZone)}</p>
              <div role="group" aria-label="Available times" className="mt-6 flex max-h-[440px] flex-col overflow-y-auto border-t border-[#1a1816]/[.12]">
                {dayTimes.map((s) => {
                  const on = s.startUtc === value;
                  return (
                    <button key={s.startUtc} type="button" aria-pressed={on} onClick={() => onChange(s.startUtc)}
                      className={`group relative flex items-center justify-between border-b border-[#1a1816]/[.12] py-4 pl-4 pr-2 text-left text-[15px] tabular-nums tracking-wide transition duration-200 ${focusRing} ${on ? "text-[#6b1f1f]" : "text-[#1a1816]/80 hover:text-[#6b1f1f]"}`}>
                      <span aria-hidden className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[#6b1f1f] transition-opacity duration-200 ${on ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                      <span>{formatTime(Date.parse(s.startUtc), timeZone, hour12)}</span>
                      <span aria-hidden className={`text-xs transition-opacity duration-200 ${on ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}>{on ? "Selected" : "→"}</span>
                    </button>
                  );
                })}
                {dayTimes.length === 0 && <p className="py-4 text-sm text-[#1a1816]/50">No times left on this day.</p>}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
