"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson, useToasts } from "./Toast";
import { useAdminBase } from "./AdminContext";

/** Prototype-only switches that make the reliability behaviour visible, plus a reset of the sample data. */
export default function PrototypeControls({ googleOutage, zoomFailure }: { googleOutage: boolean; zoomFailure: boolean }) {
  const router = useRouter();
  const { api } = useAdminBase();
  const { push, node } = useToasts();
  const [busy, setBusy] = useState(false);
  const [sim, setSim] = useState({ googleOutage, zoomFailure });

  // Optimistic: the box flips at once and goes back if the server refuses.
  const toggle = async (key: "googleOutage" | "zoomFailure", value: boolean, message: string) => {
    setSim((x) => ({ ...x, [key]: value }));
    setBusy(true);
    const r = await postJson(`${api}/settings`, { simulate: { [key]: value } }, "PUT");
    setBusy(false);
    if (r.ok) { push(message); router.refresh(); } else { setSim((x) => ({ ...x, [key]: !value })); push(String(r.data.error ?? "Could not save."), "error"); }
  };
  const reset = async () => {
    if (!window.confirm("Reset all prototype data (meeting types, bookings, activity) to the sample set?")) return;
    setBusy(true);
    const r = await postJson(`${api}/reset`, {});
    setBusy(false);
    if (r.ok) { push("Sample data restored."); router.refresh(); } else push(String(r.data.error ?? "Could not reset."), "error");
  };

  const row = "flex items-start gap-3 text-sm";
  return (
    <div className="space-y-4">
      {node}
      <label className={row}><input type="checkbox" disabled={busy} checked={sim.googleOutage} onChange={(e) => toggle("googleOutage", e.target.checked, e.target.checked ? "Google Calendar outage simulated: availability is hidden and bookings are refused." : "Google Calendar is back.")} className="mt-1 accent-[#6b1f1f]" />
        <span><span className="font-medium">Simulate a Google Calendar outage</span><br /><span className="text-[#1a1816]/55">Visitors see “availability temporarily unavailable”; no booking can be made.</span></span></label>
      <label className={row}><input type="checkbox" disabled={busy} checked={sim.zoomFailure} onChange={(e) => toggle("zoomFailure", e.target.checked, e.target.checked ? "Zoom failure simulated: new bookings are confirmed with the link pending." : "Zoom is back.")} className="mt-1 accent-[#6b1f1f]" />
        <span><span className="font-medium">Simulate a Zoom failure</span><br /><span className="text-[#1a1816]/55">New bookings still confirm; the Zoom link shows as pending and is logged.</span></span></label>
      <button type="button" disabled={busy} onClick={reset} className="border border-[#1a1816]/25 px-4 py-2 text-xs uppercase tracking-[.15em] hover:border-[#6b1f1f] hover:text-[#6b1f1f] disabled:opacity-50">Reset sample data</button>
    </div>
  );
}
