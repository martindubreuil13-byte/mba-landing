"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson, useToasts } from "./Toast";
import { useAdminBase } from "./AdminContext";
import type { Availability, TimeWindow } from "@/app/lib/scheduling/types";
import { WEEKDAY_NAMES } from "@/app/lib/scheduling/timezone";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const TIME = "border border-[#1a1816]/20 bg-white px-2 py-1.5 text-sm focus:border-[#6b1f1f] focus:outline-none";
const SMALL = "text-xs text-[#6b1f1f] underline underline-offset-4 hover:text-[#4d1616]";
const H = "text-xs uppercase tracking-widest text-[#1a1816]/55";

function Windows({ label, windows, onChange }: { label: string; windows: TimeWindow[]; onChange: (w: TimeWindow[]) => void }) {
  const set = (i: number, patch: Partial<TimeWindow>) => onChange(windows.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {windows.map((w, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          <input aria-label={`${label} start`} type="time" step={300} className={TIME} value={w.start} onChange={(e) => set(i, { start: e.target.value })} />
          <span aria-hidden className="text-[#1a1816]/40">to</span>
          <input aria-label={`${label} end`} type="time" step={300} className={TIME} value={w.end} onChange={(e) => set(i, { end: e.target.value })} />
          <button type="button" aria-label={`Remove ${label} window`} className="px-1 text-[#1a1816]/40 hover:text-[#8b2525]" onClick={() => onChange(windows.filter((_, j) => j !== i))}>✕</button>
        </span>
      ))}
      <button type="button" className={SMALL} onClick={() => onChange([...windows, windows.length ? { start: windows[windows.length - 1].end, end: "17:00" } : { start: "09:00", end: "17:00" }])}>+ Add window</button>
    </div>
  );
}

/** Weekly hours, breaks, days off, date overrides and the booking window for one meeting type, all in the home time zone. */
export default function AvailabilityEditor({ typeId, initial, homeTimeZone }: { typeId: string; initial: Availability; homeTimeZone: string }) {
  const router = useRouter();
  const { api } = useAdminBase();
  const { push, node } = useToasts();
  const [a, setA] = useState<Availability>(() => structuredClone(initial));
  const [dayOff, setDayOff] = useState("");
  const [override, setOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setDay = (day: number, w: TimeWindow[]) => setA((x) => { const weekly = { ...x.weekly }; if (w.length) weekly[String(day)] = w; else delete weekly[String(day)]; return { ...x, weekly }; });

  const save = async () => {
    setBusy(true); setError("");
    const r = await postJson(`${api}/availability/${typeId}`, a, "PUT");
    setBusy(false);
    if (!r.ok) { setError(String(r.data.error ?? "Could not save.")); push("Not saved. Check the highlighted message.", "error"); return; }
    push("Availability saved. The preview now reflects it."); router.refresh();
  };

  return (
    <div className="space-y-9">
      {node}
      <section aria-labelledby="wk-h">
        <h3 id="wk-h" className={H}>Weekly hours <span className="normal-case tracking-normal text-[#1a1816]/40">· {homeTimeZone.replace(/_/g, " ")}</span></h3>
        <div className="mt-4 divide-y divide-[#1a1816]/10 border-y border-[#1a1816]/10 bg-white">
          {ORDER.map((d) => {
            const w = a.weekly[String(d)] ?? [];
            return (
              <div key={d} className="grid gap-3 px-4 py-3 md:grid-cols-[150px_1fr] md:items-center">
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="accent-[#6b1f1f]" checked={w.length > 0} onChange={(e) => setDay(d, e.target.checked ? [{ start: "09:00", end: "17:00" }] : [])} />{WEEKDAY_NAMES[d]}</label>
                {w.length ? <Windows label={WEEKDAY_NAMES[d]} windows={w} onChange={(x) => setDay(d, x)} /> : <span className="text-sm text-[#1a1816]/40">Closed</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="br-h">
        <h3 id="br-h" className={H}>Breaks <span className="normal-case tracking-normal text-[#1a1816]/40">· removed from every working day</span></h3>
        <div className="mt-3"><Windows label="Break" windows={a.breaks} onChange={(breaks) => setA({ ...a, breaks })} /></div>
      </section>

      <section aria-labelledby="off-h">
        <h3 id="off-h" className={H}>Days off</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input aria-label="Day off date" type="date" className={TIME} value={dayOff} onChange={(e) => setDayOff(e.target.value)} />
          <button type="button" disabled={!dayOff} className={SMALL} onClick={() => { setA({ ...a, daysOff: [...new Set([...a.daysOff, dayOff])].sort() }); setDayOff(""); }}>+ Add day off</button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">{a.daysOff.map((d) => <li key={d} className="inline-flex items-center gap-2 border border-[#1a1816]/15 bg-white px-3 py-1 text-sm">{d}<button type="button" aria-label={`Remove day off ${d}`} className="text-[#1a1816]/40 hover:text-[#8b2525]" onClick={() => setA({ ...a, daysOff: a.daysOff.filter((x) => x !== d) })}>✕</button></li>)}
          {a.daysOff.length === 0 && <li className="text-sm text-[#1a1816]/40">None</li>}</ul>
      </section>

      <section aria-labelledby="ov-h">
        <h3 id="ov-h" className={H}>Date-specific hours <span className="normal-case tracking-normal text-[#1a1816]/40">· replace that day’s weekly hours</span></h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input aria-label="Override date" type="date" className={TIME} value={override} onChange={(e) => setOverride(e.target.value)} />
          <button type="button" disabled={!override || !!a.overrides[override]} className={SMALL} onClick={() => { setA({ ...a, overrides: { ...a.overrides, [override]: [{ start: "10:00", end: "12:00" }] } }); setOverride(""); }}>+ Add date</button>
        </div>
        <div className="mt-3 space-y-3">
          {Object.entries(a.overrides).sort(([x], [y]) => x.localeCompare(y)).map(([date, w]) => (
            <div key={date} className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-[#1a1816]/10 bg-white px-4 py-3">
              <span className="w-28 text-sm font-medium">{date}</span>
              <Windows label={`Override ${date}`} windows={w} onChange={(x) => { const o = { ...a.overrides }; if (x.length) o[date] = x; else delete o[date]; setA({ ...a, overrides: o }); }} />
              <button type="button" className="ml-auto text-xs text-[#8b2525] underline underline-offset-4" onClick={() => { const o = { ...a.overrides }; delete o[date]; setA({ ...a, overrides: o }); }}>Remove date</button>
            </div>
          ))}
          {Object.keys(a.overrides).length === 0 && <p className="text-sm text-[#1a1816]/40">None</p>}
        </div>
      </section>

      <section aria-labelledby="bw-h">
        <h3 id="bw-h" className={H}>Booking window</h3>
        <p className="mt-3 flex items-center gap-3 text-sm">Visitors can book up to <input aria-label="Booking window in days" inputMode="numeric" className={`${TIME} w-20`} value={a.bookingWindowDays} onChange={(e) => setA({ ...a, bookingWindowDays: Number(e.target.value.replace(/\D/g, "")) || 0 })} /> days ahead.</p>
      </section>

      {error && <p role="alert" className="border-l-2 border-[#8b2525] pl-3 text-sm text-[#8b2525]">{error}</p>}
      <button type="button" disabled={busy} onClick={save} className="bg-[#6b1f1f] px-8 py-3 text-xs uppercase tracking-[.2em] text-white disabled:opacity-50">{busy ? "Saving…" : "Save availability"}</button>
    </div>
  );
}
