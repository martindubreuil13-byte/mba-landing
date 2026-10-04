/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { collectAttribution } from "@/app/lib/attribution";
import { optinCopy, resourceNoun, validateOptinFields, type MarketingChoice, type OptinFieldErrors } from "@/app/lib/resources/optin";

type Props = {
  resourceSlug: string;
  resourceTitle: string;
  /** The resource's type (Guide, Checklist, ...). Used only to name the resource in the form copy. */
  resourceType?: string | null;
};

type Status = "idle" | "submitting" | "success" | "error";

const INPUT_CLASS =
  "w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors";

/**
 * The standard lead form for every gated resource: first name + email, then two explicit actions. Both deliver the
 * resource; only the first also records marketing consent. Nothing is pre-selected and Enter does not submit, so
 * consent is only ever given by deliberately clicking the first button.
 */
export default function ResourceRequestForm({ resourceSlug, resourceTitle, resourceType }: Props) {
  const copy = optinCopy(resourceType);
  const noun = resourceNoun(resourceType);

  const [status, setStatus] = React.useState<Status>("idle");
  const [pendingChoice, setPendingChoice] = React.useState<MarketingChoice | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<OptinFieldErrors>({});
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [firstNameResult, setFirstNameResult] = React.useState("");
  const [onShortlist, setOnShortlist] = React.useState(false);

  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [country, setCountry] = React.useState("");

  const submit = async (choice: MarketingChoice) => {
    if (status === "submitting") return;

    setErrorMessage("");
    const checked = validateOptinFields({ firstName, email });
    if (!checked.ok) {
      setFieldErrors(checked.errors);
      return;
    }
    setFieldErrors({});
    setStatus("submitting");
    setPendingChoice(choice);

    const attribution = collectAttribution();

    try {
      const res = await fetch("/api/resources/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: checked.firstName,
          email: checked.email,
          country: country.trim(),
          marketingChoice: choice,
          resourceSlug,
          website: "", // honeypot, left blank by real visitors
          ...attribution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMessage(data.fieldErrors ? "" : data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setDownloadUrl(data.downloadUrl);
      setFirstNameResult(data.firstName || checked.firstName);
      setOnShortlist(Boolean(data.onShortlist) && choice === "join");
      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success" && downloadUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <h3 className="text-2xl md:text-3xl font-light text-[#1a1816]">
          It's yours{firstNameResult ? `, ${firstNameResult}` : ""}.
        </h3>
        <p className="text-[#1a1816]/70">
          Your copy of <span className="italic">{resourceTitle}</span> is ready.
        </p>
        <a href={downloadUrl} className="inline-block">
          <motion.span
            className="inline-block text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90"
            whileHover={{ x: 2 }}
          >
            Download the {noun} →
          </motion.span>
        </a>
        {onShortlist && (
          <p className="text-sm text-[#1a1816]/60">You're on the shortlist. Every email has an unsubscribe link.</p>
        )}
      </motion.div>
    );
  }

  const busy = status === "submitting";

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-6">
      {/* Honeypot — hidden from real visitors */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm text-[#1a1816]/70 mb-2">
          First name<span aria-hidden="true">*</span>
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={INPUT_CLASS}
          autoComplete="given-name"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.firstName)}
          aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
        />
        {fieldErrors.firstName && (
          <p id="firstName-error" className="text-sm text-[#6b1f1f] mt-1">{fieldErrors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-[#1a1816]/70 mb-2">
          Email address<span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASS}
          autoComplete="email"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && <p id="email-error" className="text-sm text-[#6b1f1f] mt-1">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="country" className="block text-sm text-[#1a1816]/70 mb-2">
          Country <span className="text-[#1a1816]/40">(optional)</span>
        </label>
        <input
          id="country"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={INPUT_CLASS}
          autoComplete="country-name"
        />
      </div>

      <div className="border-t border-[#1a1816]/8 pt-6 space-y-5">
        <p id="optin-explanation" className="text-sm text-[#1a1816]/70 leading-relaxed">
          {copy.explanation}{" "}
          <Link href="/privacy" className="underline hover:text-[#1a1816]">
            Privacy Policy
          </Link>
          .
        </p>

        {errorMessage && <p className="text-sm text-[#6b1f1f]" role="alert">{errorMessage}</p>}

        <div className="flex flex-col md:flex-row gap-3" role="group" aria-describedby="optin-explanation">
          <button
            type="button"
            onClick={() => submit("join")}
            disabled={busy}
            className="w-full md:w-auto text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-6 py-4 transition-all hover:bg-[#6b1f1f]/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy && pendingChoice === "join" ? "Sending…" : copy.primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => submit("resource_only")}
            disabled={busy}
            className="w-full md:w-auto text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border border-[#6b1f1f] bg-white px-6 py-4 transition-all hover:bg-[#6b1f1f]/5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy && pendingChoice === "resource_only" ? "Sending…" : copy.secondaryLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
