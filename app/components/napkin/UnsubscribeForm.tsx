"use client";

import { useState } from "react";

export default function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function unsubscribe() {
    setState("submitting");
    try {
      const response = await fetch("/api/napkin/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not update your preference.");
      setMessage(data.alreadyUnsubscribed ? "You were already unsubscribed. No further community emails will be sent." : "You have been unsubscribed. No further community emails will be sent.");
      setState("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not update your preference.");
      setState("error");
    }
  }

  if (state === "done") return <p className="text-base leading-relaxed text-[#1a1816]/75" role="status">{message}</p>;

  return (
    <div>
      <button type="button" onClick={unsubscribe} disabled={state === "submitting"} className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 disabled:opacity-60">
        {state === "submitting" ? "Updating…" : "Unsubscribe me"}
      </button>
      {state === "error" && <p className="mt-4 text-sm text-[#6b1f1f]" role="alert">{message}</p>}
    </div>
  );
}
