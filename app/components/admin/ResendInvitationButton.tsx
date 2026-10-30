"use client";
import { useState } from "react";

/** Re-sends the booking invitation for one application. Disabled while a request is in flight so a double click is one request. */
export default function ResendInvitationButton({ id, label = "Resend invitation" }: { id: string; label?: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const resend = async () => {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const r = await fetch(`/api/admin/programs/corporate-transition/${id}/resend`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { location.reload(); return; }
      setMessage(j.error || "The invitation could not be sent.");
    } catch { setMessage("The invitation could not be sent."); }
    setBusy(false);
  };
  return <div className="mt-4">
    <button type="button" onClick={resend} disabled={busy} className="bg-[#1a1816] px-5 py-3 text-xs uppercase tracking-widest text-white disabled:opacity-40">{busy ? "Sending…" : label}</button>
    {message && <p role="alert" className="mt-3 text-sm text-[#8b2525]">{message}</p>}
  </div>;
}
