"use client";

import React from "react";
import Link from "next/link";
import { collectAttribution } from "@/app/lib/attribution";
import { getSessionId, sendResourceEvent } from "@/app/lib/resources/client-events";
import type { CtaLocation } from "@/app/lib/resources/events";
import { validateEmail } from "@/app/lib/resources/validation";
import { useGuideExperience } from "./ResourceGuideProvider";

type Status = "idle" | "submitting" | "error";

function Disclosure({ text, linkText }: { text: string; linkText: string }) {
  const at = text.indexOf(linkText);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Link href="/privacy" className="underline underline-offset-2 hover:text-[#1a1816]">
        {linkText}
      </Link>
      {text.slice(at + linkText.length)}
    </>
  );
}

/**
 * The one email + consent form for every printable resource. Consent comes from
 * an explicit button that states both actions plus a disclosure shown directly
 * beside it; the server stores the exact wording by version id.
 */
export default function ResourceLeadForm({ location }: { location: CtaLocation }) {
  const { slug, consent, closeForm, completeDelivery } = useGuideExperience();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const baseId = React.useId();
  const errorId = `${baseId}-error`;
  const disclosureId = `${baseId}-disclosure`;

  React.useEffect(() => {
    inputRef.current?.focus();
    sendResourceEvent("resource_form_opened", slug, location);
  }, [slug, location]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    const check = validateEmail(email);
    if (!check.ok) {
      setError(check.message);
      setStatus("error");
      inputRef.current?.focus();
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/resources/printable-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: check.email,
          slug,
          ctaLocation: location,
          consentVersion: consent.id,
          sessionId: getSessionId(),
          pagePath: window.location.pathname,
          attribution: collectAttribution(),
          website: "", // honeypot
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        inputRef.current?.focus();
        return;
      }

      completeDelivery({ downloadUrl: data.downloadUrl, backupUrl: data.backupUrl, emailStatus: data.emailStatus, consent: data.consent, location });
      // Start the download immediately. The file is served as an attachment, so the page stays put.
      if (data.downloadUrl) window.location.assign(data.downloadUrl);
    } catch {
      setError("I could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={disclosureId} className="space-y-5">
      <div>
        <h3 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-3">Get the printable guide</h3>
        <p className="text-base leading-relaxed text-[#1a1816]/75 mb-3 max-w-xl">
          Receive the complete PDF to download, print, complete and keep.
        </p>
        <p className="text-sm leading-relaxed text-[#1a1816]/60 max-w-xl">{consent.communityNote}</p>
      </div>

      {/* Honeypot: hidden from people and assistive tech */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor={`${baseId}-website`}>Website</label>
        <input id={`${baseId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor={`${baseId}-email`} className="block text-sm font-semibold text-[#1a1816] mb-2">
          Email address
        </label>
        <input
          ref={inputRef}
          id={`${baseId}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status === "error" && error ? true : undefined}
          aria-describedby={status === "error" && error ? `${errorId} ${disclosureId}` : disclosureId}
          className="w-full max-w-xl border border-[#1a1816]/25 bg-white px-4 py-3 text-base text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] focus:ring-1 focus:ring-[#6b1f1f] transition-colors"
        />
        <p id={errorId} role="alert" className={`text-sm text-[#6b1f1f] mt-2 ${error ? "" : "sr-only"}`}>
          {error}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-6 sm:px-8 py-4 text-left transition-colors hover:bg-[#6b1f1f]/90 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
        >
          {status === "submitting" ? "Sending…" : `${consent.buttonLabel} →`}
        </button>
        <button
          type="button"
          onClick={closeForm}
          className="self-start sm:self-auto text-xs tracking-widest uppercase text-[#1a1816]/55 hover:text-[#1a1816] underline underline-offset-4 py-2"
        >
          Not now
        </button>
      </div>

      <p id={disclosureId} className="text-xs leading-relaxed text-[#1a1816]/60 max-w-xl">
        <Disclosure text={consent.disclosure} linkText={consent.privacyLinkText} />
      </p>
    </form>
  );
}
