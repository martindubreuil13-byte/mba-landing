"use client";

import { useState } from "react";

/** The confirmation button. Opening the page only explains; pressing the button POSTs the token. Safe to press twice. */
export default function CommunityVerifyForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function confirm() {
    setState("submitting");
    try {
      const response = await fetch("/api/community/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We could not confirm your email.");
      setMessage(data.status === "already_confirmed" ? "You are already confirmed. You will hear from me occasionally." : "Thank you. You are confirmed, and you will hear from me occasionally. You can unsubscribe at any time.");
      setState("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not confirm your email.");
      setState("error");
    }
  }

  if (state === "done") return <p role="status" className="text-base leading-relaxed text-[#1a1816]/80">{message}</p>;
  return (
    <div>
      <button type="button" onClick={confirm} disabled={state === "submitting"} className="border border-[#6b1f1f] bg-[#6b1f1f] px-8 py-4 text-xs uppercase tracking-[.22em] text-white transition hover:bg-[#561919] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">
        {state === "submitting" ? "Confirming…" : "Yes, confirm my email"}
      </button>
      {state === "error" && <p role="alert" className="mt-5 text-sm text-[#8b2525]">{message}</p>}
    </div>
  );
}
