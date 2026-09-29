/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/app/lib/analytics";
import { CONSENT_STATEMENT } from "@/app/lib/napkin/consent";

export type CommunityJoinValues = { firstName: string; email: string };

type Props = {
  submissionId: string;
  onJoin: (values: CommunityJoinValues) => Promise<void>;
  submitting: boolean;
  errorMessage?: string;
  fieldErrors?: Record<string, string>;
  joined: boolean;
  declined: boolean;
  onDecline: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CommunityInvite({ onJoin, submitting, errorMessage, fieldErrors, joined, declined, onDecline }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const viewedTracked = useRef(false);

  useEffect(() => {
    if (viewedTracked.current) return;
    viewedTracked.current = true;
    trackEvent("napkin_invitation_viewed");
  }, []);

  if (joined) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[#1a1816]/10 pt-10 mt-14">
        <p className="text-sm tracking-widest uppercase text-[#6b1f1f] font-semibold mb-2">Check your inbox</p>
        <p className="text-base text-[#1a1816]/75 leading-relaxed">
          Your full Napkin Breakdown is on its way, along with confirmation that you've joined the community.
        </p>
      </motion.div>
    );
  }

  if (declined) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Enter a valid email address.";
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});
    onJoin({ firstName: firstName.trim(), email: email.trim() });
  };

  const errors = { ...localErrors, ...fieldErrors };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[#1a1816]/10 pt-10 mt-14 max-w-xl">
      <h2 className="text-2xl font-light text-[#1a1816] mb-3">Keep your full Napkin Breakdown</h2>
      <p className="text-base leading-relaxed text-[#1a1816]/70 mb-2">
        Join The Modern Business Architecture Community and we&rsquo;ll email you a complete breakdown of your
        results, including your calculations, key assumptions, pressure points, and the questions your business
        needs to answer next.
      </p>
      <p className="text-sm leading-relaxed text-[#1a1816]/55 mb-8">
        As a member, you&rsquo;ll also receive occasional practical guides, business architecture insights, updates,
        and relevant offers from Martin Dubreuil. You can unsubscribe at any time.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="np-join-website">Website</label>
          <input id="np-join-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="np-join-firstName" className="block text-sm text-[#1a1816]/70 mb-2">
              First name
            </label>
            <input
              id="np-join-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-sm text-[#6b1f1f] mt-1" role="alert">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="np-join-email" className="block text-sm text-[#1a1816]/70 mb-2">
              Email
            </label>
            <input
              id="np-join-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-[#6b1f1f] mt-1" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-[#6b1f1f]" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : "Join the community and email my breakdown"}
          </button>
          <button
            type="button"
            onClick={() => {
              trackEvent("napkin_invitation_declined");
              onDecline();
            }}
            className="text-sm text-[#1a1816]/50 hover:text-[#1a1816] transition-colors"
          >
            Not now — continue with my on-screen snapshot
          </button>
        </div>

        <p className="text-xs text-[#1a1816]/45 leading-relaxed pt-2">
          {CONSENT_STATEMENT} See the{" "}
          <a href="/privacy" className="underline hover:text-[#1a1816]">
            privacy policy
          </a>
          .
        </p>
      </form>
    </motion.div>
  );
}
