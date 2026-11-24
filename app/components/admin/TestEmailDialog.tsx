"use client";

import { useState, type FormEvent, type RefObject } from "react";

export default function TestEmailDialog({ dialog, subject, operations, kind = "newsletter" }: {
  dialog: RefObject<HTMLDialogElement | null>;
  kind?: "newsletter" | "outreach";
  subject: string;
  operations: RefObject<unknown[]>;
}) {
  const [recipient, setRecipient] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ error: boolean; text: string }>();
  async function send(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setResult(undefined);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, subject, kind, confirmed: true, operations: operations.current }),
      });
      const data = await res.json();
      setResult({ error: !res.ok || data.ok !== true, text: res.ok && data.ok ? "Resend accepted the test email." : data.error ?? "The test could not be confirmed." });
    } catch {
      setResult({ error: true, text: "The test could not be confirmed. Check delivery before retrying." });
    } finally {
      setBusy(false);
    }
  }
  return <dialog ref={dialog} aria-labelledby="test-email-title" className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-6 text-[#27211d] shadow-xl backdrop:bg-black/35"
    onCancel={(event) => { if (busy) event.preventDefault(); }}
    onClose={() => { setResult(undefined); setRecipient(""); }}>
    <form onSubmit={send} className="grid gap-4">
      <h2 id="test-email-title" className="font-serif text-2xl">Send a test email</h2>
      <p className="break-words text-sm"><strong>Subject</strong> · [TEST] {subject.trim() || "Add a subject in Compose"}</p>
      <label className="grid gap-1 text-sm">Recipient email
        <input type="email" required maxLength={254} autoFocus value={recipient} disabled={busy}
          onChange={(event) => setRecipient(event.target.value)} className="rounded-lg border border-[#daccc1] bg-white px-3 py-2" />
      </label>
      {result && <p role={result.error ? "alert" : "status"} className="text-sm">{result.text}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || !subject.trim() || (result && !result.error)} className="rounded-lg bg-[#6b1f1f] px-4 py-2 text-white disabled:opacity-50">{busy ? "Sending…" : "Send test email"}</button>
        <button type="button" disabled={busy} onClick={() => dialog.current?.close()}>{result && !result.error ? "Done" : "Cancel"}</button>
      </div>
    </form>
  </dialog>;
}
