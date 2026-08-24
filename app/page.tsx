/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const PREFERS_REDUCED_MOTION = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export default function Home() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    const prefersReduced = PREFERS_REDUCED_MOTION();
    if (prefersReduced !== reducedMotion) {
      setReducedMotion(prefersReduced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HERO CHOREOGRAPHY — ONE VERTICAL COMPOSITION
  // All three elements (statement 1, statement 2, CTA) are in the same container
  // Progressive animation via Framer Motion timing, not scroll transforms
  // At scrollY=0, all three are visible in the 1440×810 viewport

  const glassOpacity = useTransform(scrollY, [0, 150, 300], [0, 0.2, 0.1]);

  return (
    <>
      <Navigation />

      {/* HERO — ONE VERTICAL COMPOSITION */}
      <motion.div
        ref={heroRef}
        className="sticky top-0 w-full h-screen bg-[#f5f1ed] text-[#1a1816] flex flex-col justify-center relative px-6 md:px-12 lg:px-16 overflow-hidden"
      >
        {/* BACKGROUND GRID — ULTRA SUBTLE ARCHITECTURAL REFERENCE */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="arch-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#6b1f1f" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#arch-grid)" />
          </svg>
        </div>

        {/* GLASS LAYER — Subtle depth */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none"
          style={{ opacity: glassOpacity }}
        />

        {/* OPENING COMPOSITION — All elements in one vertical group */}
        <div className="relative max-w-2xl z-10 flex flex-col gap-12">
          {/* STATEMENT 1: YOU'VE GOT AN IDEA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : 0.2,
              duration: reducedMotion ? 0 : 0.7,
              ease: "easeOut",
            }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-light leading-tight tracking-tight">
              You've got
              <br />
              an idea.
            </h1>
          </motion.div>

          {/* STATEMENT 2: AND INSIDE THAT IDEA */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : 1.4,
              duration: reducedMotion ? 0 : 0.7,
              ease: "easeOut",
            }}
          >
            <motion.div
              className="absolute -left-6 md:-left-8 top-0 w-6 h-px bg-[#6b1f1f]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: reducedMotion ? 0 : 1.5,
                duration: reducedMotion ? 0 : 0.5,
              }}
              style={{ transformOrigin: "left" }}
            />

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
              And inside that idea,
              <br />
              there might be a{" "}
              <span className="text-[#6b1f1f] font-semibold">business</span>.
            </h2>
          </motion.div>

          {/* CTA: LET'S FIND OUT → */}
          <motion.div
            className="pt-12 border-t border-[#1a1816]/20"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : 2.2,
              duration: reducedMotion ? 0 : 0.6,
              ease: "easeOut",
            }}
          >
            <Link href="/work">
              <motion.button
                className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                whileHover={reducedMotion ? {} : { x: 3 }}
              >
                Let's find out →
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* SCROLL BUFFER — Space for Movement I scroll choreography completion */}
      <div className="h-[120vh] bg-gradient-to-b from-[#f5f1ed] via-[#faf8f6] to-white" />

    </>
  );
}
