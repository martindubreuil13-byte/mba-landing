"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { trackEvent } from "@/app/lib/analytics";

export default function FeaturedNapkinCard() {
  const tracked = useRef(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => {
        if (tracked.current) return;
        tracked.current = true;
        trackEvent("napkin_resource_card_viewed");
      }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true, margin: "-50px" }}
      className="mb-12 md:mb-16"
    >
      <Link href="/resources/napkin-principle" className="group block">
        <div className="border border-[#1a1816]/15 bg-white px-8 py-10 md:px-14 md:py-16">
          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">
            Interactive business viability exercise · Approximately 5–10 minutes
          </p>
          <h2 className="text-3xl md:text-4xl font-light leading-tight mb-5 text-[#1a1816] group-hover:text-[#1a1816]/80 transition-colors">
            The Napkin Principle
          </h2>
          <p className="text-lg leading-relaxed text-[#1a1816]/70 max-w-2xl mb-8">
            Calculate how many profitable transactions your business needs—and whether that number appears possible
            in the real world.
          </p>
          <motion.span
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all"
            whileHover={{ x: 2 }}
          >
            Calculate your survival number →
          </motion.span>
        </div>
      </Link>
    </motion.div>
  );
}
