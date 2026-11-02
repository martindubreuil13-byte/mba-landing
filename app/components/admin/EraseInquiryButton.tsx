"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Permanently deletes one saved inquiry (the person's record and consent history are untouched). Asks first. */
export default function EraseInquiryButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const erase = async () => {
    if (!window.confirm("Delete this inquiry permanently? The person's record stays. This cannot be undone.")) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/inquiries/erase", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch { setError("Could not delete. Try again."); setBusy(false); }
  };
  return <><button type="button" onClick={erase} disabled={busy} className="text-xs uppercase tracking-widest text-[#1a1816]/45 hover:text-[#6b1f1f] disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>{error ? <span className="ml-2 text-xs text-[#6b1f1f]">{error}</span> : null}</>;
}
