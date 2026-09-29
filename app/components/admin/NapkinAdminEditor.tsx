"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_STATUSES, ADMIN_STATUS_LABELS, type NapkinAdminStatus } from "@/app/lib/napkin/admin-model";

export default function NapkinAdminEditor({ id, email, initialStatus, initialNotes }: {
  id: string; email: string | null; initialStatus: NapkinAdminStatus; initialNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(nextStatus = status) {
    setState("saving");
    const response = await fetch(`/api/admin/napkin/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus, notes }),
    });
    setState(response.ok ? "saved" : "error");
    if (response.ok) { setStatus(nextStatus); router.refresh(); }
  }

  return (
    <section className="border border-[#1a1816]/10 bg-white p-5 space-y-4">
      <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold">Internal follow-up</h2>
      {email && <div className="flex flex-wrap gap-4 text-sm">
        <button type="button" onClick={() => navigator.clipboard.writeText(email)} className="text-[#6b1f1f] underline">Copy email address</button>
        <a href={`mailto:${email}`} className="text-[#6b1f1f] underline">Open new email</a>
        <button type="button" onClick={() => save("reviewed")} className="text-[#6b1f1f] underline">Mark as reviewed</button>
      </div>}
      <label className="block text-sm">Status
        <select value={status} onChange={(e) => setStatus(e.target.value as NapkinAdminStatus)} className="mt-1 block w-full border border-[#1a1816]/20 bg-white px-3 py-2">
          {ADMIN_STATUSES.map((value) => <option key={value} value={value}>{ADMIN_STATUS_LABELS[value]}</option>)}
        </select>
      </label>
      <label className="block text-sm">Private notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} maxLength={10000} className="mt-1 block w-full border border-[#1a1816]/20 px-3 py-2" />
      </label>
      <div className="flex items-center gap-3">
        <button type="button" disabled={state === "saving"} onClick={() => save()} className="bg-[#6b1f1f] text-white px-5 py-2 text-xs tracking-widest uppercase disabled:opacity-50">{state === "saving" ? "Saving…" : "Save"}</button>
        {state === "saved" && <span className="text-sm text-green-700">Saved</span>}
        {state === "error" && <span className="text-sm text-[#6b1f1f]">Could not save. Please try again.</span>}
      </div>
    </section>
  );
}

