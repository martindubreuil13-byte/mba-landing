"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FeaturedAssessmentCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true, margin: "-50px" }}
      className="mb-20 md:mb-28"
    >
      <Link href="/resources/business-idea-reality-check" className="group block">
        <div className="border border-[#1a1816]/15 bg-[#1a1816] text-white px-8 py-10 md:px-14 md:py-16">
          <p className="text-xs tracking-widest uppercase text-[#e8b4b4] font-semibold mb-6">
            Interactive · 13 questions · 4–6 minutes · Free
          </p>
          <h2 className="text-3xl md:text-4xl font-light leading-tight mb-5 group-hover:text-white/85 transition-colors">
            The Business Idea Reality Check
          </h2>
          <p className="text-lg leading-relaxed text-white/70 max-w-2xl mb-8">
            Is there actually a business behind your idea? Behaviour beats opinion. Payment beats
            praise. Evidence beats assumptions.
          </p>
          <motion.span
            className="inline-block text-sm font-semibold tracking-widest uppercase text-white border-b-2 border-white pb-1 transition-all"
            whileHover={{ x: 2 }}
          >
            Assess my idea →
          </motion.span>
        </div>
      </Link>
    </motion.div>
  );
}
