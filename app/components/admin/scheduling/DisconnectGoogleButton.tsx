"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson, useToasts } from "./Toast";
import { btnQuiet } from "@/app/components/scheduling/ui";
import { useAdminBase } from "./AdminContext";

export default function DisconnectGoogleButton() {
  const router = useRouter();
  const { api } = useAdminBase();
  const { push, node } = useToasts();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const go = async () => {
    setBusy(true);
    const r = await postJson(`${api}/google/disconnect`, {});
    setBusy(false); setConfirm(false);
    if (r.ok) { push("Google Calendar disconnected. Existing bookings are not changed."); router.refresh(); } else push(String(r.data.error ?? "Could not disconnect."), "error");
  };
  return (
    <span>
      {node}
      {!confirm ? <button type="button" onClick={() => setConfirm(true)} className={btnQuiet}>Disconnect</button> : (
        <span className="inline-flex flex-wrap items-center gap-3 text-sm">Revoke access and forget the stored token?
          <button type="button" disabled={busy} onClick={go} className={btnQuiet}>{busy ? "Disconnecting…" : "Yes, disconnect"}</button>
          <button type="button" onClick={() => setConfirm(false)} className="underline underline-offset-4">Cancel</button></span>
      )}
    </span>
  );
}
