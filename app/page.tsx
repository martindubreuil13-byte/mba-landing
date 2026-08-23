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

  // APPROVED HERO CHOREOGRAPHY
  // Phase 1 (opening) → completely dissolves to 0% opacity before Phase 2 becomes readable
  // No ghost text, no collision, clean handoff

  const phase1Opacity = useTransform(scrollY, [0, 100, 250, 280], [1, 1, 0.15, 0]);
  const phase1Y = useTransform(scrollY, [0, 100, 250], [0, 0, -30]);

  // Glass layer: architectural separation between phases
  const glassOpacity = useTransform(scrollY, [100, 200, 280, 350], [0, 0.3, 0.4, 0.2]);

  // Phase 2 (closing): emerges after Phase 1 is completely gone
  const newMessageOpacity = useTransform(scrollY, [200, 280, 350], [0, 0.2, 1]);
  const newMessageY = useTransform(scrollY, [200, 280, 350], [60, 30, 0]);

  // CTA: appears after message is active
  const ctaOpacity = useTransform(scrollY, [320, 360], [0, 1]);
  const ctaY = useTransform(scrollY, [320, 360], [20, 0]);

  return (
    <>
      <Navigation />

      {/* APPROVED HERO — STICKY DURING SCROLL TRANSFORMATION */}
      <motion.div
        ref={heroRef}
        className="sticky top-0 w-full h-screen bg-[#f5f1ed] text-[#1a1816] flex flex-col relative pt-24 px-6 md:px-12 lg:px-16 overflow-hidden"
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

        {/* GLASS LAYER — Separates outgoing from incoming */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none"
          style={{ opacity: glassOpacity }}
        />

        {/* PHASE 1: OPENING COMPOSITION — FULLY DISAPPEARS BEFORE PHASE 2 BECOMES READABLE */}
        <motion.div
          className="relative max-w-2xl h-full flex flex-col justify-center z-10"
          style={{
            opacity: phase1Opacity,
            y: phase1Y,
          }}
        >
          {/* YOU HAVE AN IDEA */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : 0.2,
              duration: reducedMotion ? 0 : 0.7,
              ease: "easeOut",
            }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-light leading-tight tracking-tight">
              You have
              <br />
              an idea.
            </h1>
          </motion.div>

          {/* THAT DOESN'T MEAN YOU HAVE A BUSINESS */}
          <motion.div
            className="mb-6 relative"
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
              That doesn't mean
              <br />
              you have a{" "}
              <span className="text-[#6b1f1f] font-semibold">business</span>.
            </h2>
          </motion.div>

          {/* YET */}
          <motion.div
            className="ml-6 md:ml-8 mb-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : 2.8,
              duration: reducedMotion ? 0 : 0.5,
              ease: "easeOut",
            }}
          >
            <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#6b1f1f] tracking-widest uppercase">
              Yet.
            </p>
          </motion.div>
        </motion.div>

        {/* PHASE 2: CLOSING COMPOSITION — EMERGES AFTER PHASE 1 IS 0% OPACITY */}
        <motion.div
          className="absolute top-1/3 left-6 md:left-12 lg:left-16 max-w-2xl z-20"
          style={{
            opacity: newMessageOpacity,
            y: newMessageY,
          }}
        >
          {/* Intro line */}
          <motion.div
            className="mb-6 h-px w-12 bg-[#1a1816]/40"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              delay: reducedMotion ? 0 : 2.0,
              duration: reducedMotion ? 0 : 0.5,
            }}
            style={{ transformOrigin: "left" }}
          />

          {/* MAIN CLOSING STATEMENT */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight tracking-tight mb-8">
            <span className="text-[#6b1f1f] font-semibold">But</span> inside that idea,
            <br />
            there might be a{" "}
            <span className="text-[#6b1f1f] font-semibold">business</span>.
          </h2>

          {/* CTA: LET'S FIND OUT → */}
          <motion.div
            style={{
              opacity: ctaOpacity,
              y: ctaY,
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
        </motion.div>
      </motion.div>

      {/* SCROLL BUFFER — Space for Movement I scroll choreography completion */}
      <div className="h-[120vh] bg-gradient-to-b from-[#f5f1ed] via-[#faf8f6] to-white" />

    </>
  );
}
