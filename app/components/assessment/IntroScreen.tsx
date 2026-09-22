/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl"
    >
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">
        The Business Idea Reality Check
      </p>
      <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-[#1a1816] mb-8">
        A good idea is not necessarily a good business.
      </h1>
      <p className="text-lg leading-relaxed text-[#1a1816]/75 mb-6">
        This looks beyond enthusiasm, assumptions and how attractive the solution sounds — at how
        much evidence currently exists that there may be a viable business inside the idea.
      </p>
      <p className="text-base leading-relaxed text-[#1a1816]/60 mb-10">
        13 questions · 4–6 minutes. There are no "right" answers. Answer based on what you know
        today, not what you hope will eventually be true — "I don't know yet" is a legitimate
        answer.
      </p>

      <button
        onClick={onStart}
        className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90"
      >
        Start the Reality Check →
      </button>

      <p className="text-sm leading-relaxed text-[#1a1816]/50 mt-6">
        Not sure you're ready for 13 questions yet? Read{" "}
        <Link href="/answers/the-10-signs-youre-serious-about-starting-a-business" className="underline hover:text-[#1a1816]/80">
          the 10 signs you're serious about starting a business
        </Link>{" "}
        first.
      </p>

      <p className="text-xs leading-relaxed text-[#1a1816]/45 mt-10 max-w-xl">
        Your individual responses are kept confidential and are not published as individual
        research data. Anonymized, aggregated information may be used to improve this methodology
        and create broader research or educational material. Completing this is not marketing
        consent — that's a separate, explicit choice later. See the{" "}
        <a href="/privacy" className="underline hover:text-[#1a1816]">
          privacy policy
        </a>
        .
      </p>
    </motion.div>
  );
}
