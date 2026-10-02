"use client";

import { useState } from "react";
import type React from "react";

export type ConfirmCopy = {
  button: string;
  doneHeading?: string;
  /** Shown after confirming when a member benefit was unlocked. */
  doneBody?: string;
  downloadButton?: string;
};

/**
 * The confirmation button. Opening the page only explains; pressing the button POSTs to /api/confirm, which
 * activates membership and (for a member-access resource) unlocks the benefit. Safe to press twice.
 */
export default function ConfirmOptInForm({ token, intro, copy }: { token: string; intro?: React.ReactNode; copy?: ConfirmCopy }) {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [benefit, setBenefit] = useState<{ downloadUrl: string; label: string } | null>(null);

  async function confirm() {
    setState("submitting");
    try {
      const response = await fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not confirm your email.");
      if (data.benefit?.downloadUrl) {
        setBenefit(data.benefit);
        setMessage(copy?.doneBody ?? "You are confirmed. Your download is starting.");
        setState("done");
        // The file is served as an attachment, so the page stays put.
        window.location.assign(data.benefit.downloadUrl);
        return;
      }
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
      <div role="status" className="space-y-5">
        {benefit && copy?.doneHeading && <h2 className="text-2xl font-light text-[#1a1816]">{copy.doneHeading}</h2>}
        <p className="text-base leading-relaxed text-[#1a1816]/75">{message}</p>
        {benefit && (
          <a href={benefit.downloadUrl} className="inline-block text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">
            {copy?.downloadButton ?? "Download →"}
          </a>
        )}
      </div>
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
        {state === "submitting" ? "Confirming…" : copy?.button ?? "Yes, confirm my email →"}
      </button>
      {state === "error" && (
        <p className="mt-4 text-sm text-[#6b1f1f]" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
