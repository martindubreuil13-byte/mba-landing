"use client";

import React from "react";
import Link from "next/link";
import { validateEmail } from "@/app/lib/resources/validation";

type Props = { consent: { id: string; intro: string; note: string; buttonLabel: string; disclosure: string; privacyLinkText: string } };

/**
 * Explicit rejoin for someone who unsubscribed. It only REQUESTS a confirmation email: nothing changes until the
 * recipient presses the button on the confirmation page. The answer is the same for every address.
 */
export default function RejoinForm({ consent }: Props) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "error" | "done">("idle");
  const [error, setError] = React.useState("");
  const id = React.useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    const check = validateEmail(email);
    if (!check.ok) {
      setError(check.message);
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/membership/rejoin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: check.email, consentVersion: consent.id, website: "" }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="space-y-3">
        <h2 className="text-2xl font-light text-[#1a1816]">Check your inbox</h2>
        <p className="text-base leading-relaxed text-[#1a1816]/75">If this address can rejoin, a confirmation email is on its way. Nothing changes until you confirm.</p>
      </div>
    );
  }

  const at = consent.disclosure.indexOf(consent.privacyLinkText);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-base leading-relaxed text-[#1a1816]/75">{consent.intro}</p>
      <p className="text-sm leading-relaxed text-[#1a1816]/60">{consent.note}</p>
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-semibold text-[#1a1816] mb-2">Email address</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status === "error" && error ? true : undefined}
          className="w-full max-w-xl border border-[#1a1816]/25 bg-white px-4 py-3 text-base text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] focus:ring-1 focus:ring-[#6b1f1f]"
        />
        <p role="alert" className={`text-sm text-[#6b1f1f] mt-2 ${error ? "" : "sr-only"}`}>{error}</p>
      </div>
      <button type="submit" disabled={status === "submitting"} className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">
        {status === "submitting" ? "Sending…" : `${consent.buttonLabel} →`}
      </button>
      <p className="text-xs leading-relaxed text-[#1a1816]/60 max-w-xl">
        {at < 0 ? consent.disclosure : (<>{consent.disclosure.slice(0, at)}<Link href="/privacy" className="underline underline-offset-2">{consent.privacyLinkText}</Link>{consent.disclosure.slice(at + consent.privacyLinkText.length)}</>)}
      </p>
    </form>
  );
}
