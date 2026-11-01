"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import SlotPicker, { type PickerSlot } from "@/app/components/scheduling/SlotPicker";
import TimeZoneSelect from "@/app/components/scheduling/TimeZoneSelect";
import { btnPrimary, eyebrow, textLink } from "@/app/components/scheduling/ui";
import { useAdminBase } from "./AdminContext";
import type { BookingRow } from "@/app/lib/scheduling/admin-views";
import { formatDateLong, formatTime, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

/** Pick a new time from the slots the engine actually offers (the booking's own current time counts as free). */
export default function RescheduleDialog({ booking, homeTimeZone, onClose, onConfirm }: { booking: BookingRow; homeTimeZone: string; onClose: () => void; onConfirm: (startUtc: string) => Promise<string | null> }) {
  const { api } = useAdminBase();
  const [tz, setTz] = useState(homeTimeZone);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async (from: string, to: string): Promise<PickerSlot[]> => {
    const q = new URLSearchParams({ typeId: booking.typeId, from, to, exclude: booking.id });
    const r = await fetch(`${api}/slots?${q}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Availability could not be loaded.");
    return j.slots as PickerSlot[];
  }, [api, booking.typeId, booking.id]);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const confirm = async () => {
    if (!picked) return;
    setBusy(true); setError("");
    const problem = await onConfirm(picked);
    setBusy(false);
    if (problem) setError(problem);
  };

  const cur = Date.parse(booking.startUtc);
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#1a1816]/50 p-4 sm:p-10" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="resched-title" className="relative w-full max-w-3xl bg-[#f5f1ed] p-6 outline-none sm:p-12">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center text-[#1a1816]/45 hover:text-[#6b1f1f]"><X aria-hidden className="h-5 w-5" /></button>
        <p className={eyebrow}>Reschedule</p>
        <h2 id="resched-title" className="mt-3 text-3xl font-light tracking-tight">{booking.guestName}</h2>
        <p className="mt-1 text-[#1a1816]/60">{booking.typeName}</p>
        <p className="mt-4 text-sm text-[#1a1816]/55">Currently {formatDateLong(cur, tz)}, {formatTime(cur, tz)} ({zoneOffsetLabel(cur, tz)}).</p>
        <div className="mt-8"><SlotPicker key={tz} load={load} timeZone={tz} value={picked} onChange={setPicked} /></div>
        <div className="mt-6"><TimeZoneSelect id="resched-tz" value={tz} onChange={(z) => { setTz(z); setPicked(null); }} /></div>
        {error && <p role="alert" className="mt-5 border-l-2 border-[#8b2525] pl-3 text-sm text-[#8b2525]">{error}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-6">
          <button type="button" onClick={onClose} className={textLink}>Keep current time</button>
          <button type="button" disabled={!picked || busy} onClick={confirm} className={btnPrimary}>{busy ? "Moving…" : "Move booking"}</button>
        </div>
      </div>
    </div>
  );
}
