/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { collectAttribution } from "@/app/lib/attribution";

type Props = {
  resourceSlug: string;
  resourceTitle: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export default function ResourceRequestForm({ resourceSlug, resourceTitle }: Props) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [firstNameResult, setFirstNameResult] = React.useState("");

  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [optIn, setOptIn] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    setFieldErrors({});
    setErrorMessage("");

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("submitting");

    const attribution = collectAttribution();

    try {
      const res = await fetch("/api/resources/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          country: country.trim(),
          ongoingContentOptIn: optIn,
          resourceSlug,
          website: "", // honeypot, left blank by real visitors
          ...attribution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setDownloadUrl(data.downloadUrl);
      setFirstNameResult(data.firstName || firstName.trim());
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
            Download the guide →
          </motion.span>
        </a>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot — hidden from real visitors */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm text-[#1a1816]/70 mb-2">
          First name
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
          autoComplete="given-name"
        />
        {fieldErrors.firstName && (
          <p className="text-sm text-[#6b1f1f] mt-1">{fieldErrors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-[#1a1816]/70 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
          autoComplete="email"
        />
        {fieldErrors.email && <p className="text-sm text-[#6b1f1f] mt-1">{fieldErrors.email}</p>}
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
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
          autoComplete="country-name"
        />
      </div>

      <div className="border-t border-[#1a1816]/8 pt-6 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[#6b1f1f]"
          />
          <span className="text-sm font-semibold tracking-wide uppercase text-[#1a1816]">
            Keep me on Martin's shortlist for useful stuff.
          </span>
        </label>
        <p className="text-sm text-[#1a1816]/55 leading-relaxed pl-7">
          From time to time, I send people who follow my work something worth opening — Business
          Architecture snapshots, practical advice, articles, new guides, PDFs, useful tools and
          occasionally an offer. No content for the sake of content. Unsubscribe whenever you want.
          See the{" "}
          <a href="/privacy" className="underline hover:text-[#1a1816]">
            privacy policy
          </a>
          .
        </p>
      </div>

      {errorMessage && <p className="text-sm text-[#6b1f1f]">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full md:w-auto text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Sending…" : "Get it free"}
      </button>
    </form>
  );
}
