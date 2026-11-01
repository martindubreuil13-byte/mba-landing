"use client";
import { useEffect, useMemo, useState } from "react";
import { FALLBACK_TIME_ZONES, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";
import { focusRing, label } from "./ui";

/** IANA zone picker. The visitor's zone is detected by the parent; this lets them change it. */
export default function TimeZoneSelect({ value, onChange, id = "tz" }: { value: string; onChange: (tz: string) => void; id?: string }) {
  const zones = useMemo(() => {
    let all: string[] = FALLBACK_TIME_ZONES;
    try { const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] }; if (intl.supportedValuesOf) all = intl.supportedValuesOf("timeZone"); } catch { /* keep the fallback list */ }
    return all.includes(value) ? all : [value, ...all];
  }, [value]);
  // Read the clock after mount so server and browser markup agree.
  const [offset, setOffset] = useState("");
  useEffect(() => { setOffset(zoneOffsetLabel(Date.now(), value)); }, [value]);
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <label htmlFor={id} className={label}>Time zone</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`max-w-full cursor-pointer rounded-none border-0 border-b border-[#1a1816]/25 bg-transparent py-1 pr-6 text-sm text-[#1a1816] transition hover:border-[#6b1f1f] focus:border-[#6b1f1f] focus:outline-none ${focusRing}`}>
        {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
      </select>
      <span className="text-xs tabular-nums text-[#1a1816]/45">{offset}</span>
    </div>
  );
}
