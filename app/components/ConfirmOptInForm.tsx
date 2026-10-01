"use client";

import { useState } from "react";
import type React from "react";

export default function ConfirmOptInForm({ token, intro }: { token: string; intro?: React.ReactNode }) {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function confirm() {
    setState("submitting");
    try {
      const response = await fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not confirm your email.");
      setMessage(
        data.status === "already_confirmed"
          ? "You are already confirmed. You will receive occasional emails from Martin."
          : "You are confirmed. You will now receive occasional emails from Martin with practical ideas, new resources, updates and relevant offers. You can unsubscribe at any time, and anything you have already received stays yours."
      );
      setState("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not confirm your email.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="text-base leading-relaxed text-[#1a1816]/75">
        {message}
      </p>
    );
  }

  return (
    <div>
      {intro}
      <button
        type="button"
        onClick={confirm}
        disabled={state === "submitting"}
        className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
      >
        {state === "submitting" ? "Confirming…" : "Yes, confirm my email →"}
      </button>
      {state === "error" && (
        <p className="mt-4 text-sm text-[#6b1f1f]" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
