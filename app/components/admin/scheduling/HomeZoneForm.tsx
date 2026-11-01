"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TimeZoneSelect from "@/app/components/scheduling/TimeZoneSelect";
import { postJson, useToasts } from "./Toast";
import { useAdminBase } from "./AdminContext";

/** The zone in which every availability time on this page is written. Visitors see the result converted to their own zone. */
export default function HomeZoneForm({ value }: { value: string }) {
  const router = useRouter();
  const { api } = useAdminBase();
  const { push, node } = useToasts();
  const [tz, setTz] = useState(value);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const r = await postJson(`${api}/settings`, { homeTimeZone: tz }, "PUT");
    setBusy(false);
    if (r.ok) { push(`Home time zone is now ${tz.replace(/_/g, " ")}. Visitors’ times move accordingly.`); router.refresh(); } else push(String(r.data.error ?? "Could not save."), "error");
  };
  return (
    <div className="flex flex-wrap items-center gap-4">
      {node}
      <TimeZoneSelect id="home-tz" value={tz} onChange={setTz} />
      <button type="button" disabled={busy || tz === value} onClick={save} className="border border-[#6b1f1f] px-4 py-2 text-xs uppercase tracking-[.15em] text-[#6b1f1f] hover:bg-[#6b1f1f] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6b1f1f]">Save zone</button>
    </div>
  );
}
