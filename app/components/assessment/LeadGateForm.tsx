/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type LeadGateSubmission = {
  firstName: string;
  email: string;
  ongoingContentOptIn: boolean;
};

type Props = {
  onSubmit: (values: LeadGateSubmission) => Promise<void> | void;
  submitting: boolean;
  errorMessage?: string;
  fieldErrors?: Record<string, string>;
};

export default function LeadGateForm({ onSubmit, submitting, errorMessage, fieldErrors }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});
    onSubmit({ firstName: firstName.trim(), email: email.trim(), ongoingContentOptIn: optIn });
  };

  const errors = { ...localErrors, ...fieldErrors };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl">
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Your assessment is ready.</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-4">Where should I send it?</h2>
      <p className="text-base text-[#1a1816]/65 leading-relaxed mb-10">
        You'll see the full result immediately below, and a copy will land in your inbox too.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="ac-website">Website</label>
          <input id="ac-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label htmlFor="ac-firstName" className="block text-sm text-[#1a1816]/70 mb-2">First name</label>
          <input
            id="ac-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
            autoComplete="given-name"
          />
          {errors.firstName && <p className="text-sm text-[#6b1f1f] mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="ac-email" className="block text-sm text-[#1a1816]/70 mb-2">Email</label>
          <input
            id="ac-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
            autoComplete="email"
          />
          {errors.email && <p className="text-sm text-[#6b1f1f] mt-1">{errors.email}</p>}
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
            <a href="/privacy" className="underline hover:text-[#1a1816]">privacy policy</a>.
          </p>
        </div>

        {errorMessage && <p className="text-sm text-[#6b1f1f]">{errorMessage}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Preparing…" : "Show me my result"}
        </button>
      </form>
    </motion.div>
  );
}
