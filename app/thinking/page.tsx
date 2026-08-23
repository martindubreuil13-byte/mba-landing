/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
  return (
    <>
      <Navigation />

      {/* PAGE PADDING */}
      <div className="h-16" />

      <div className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            OPENING
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Perspective</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                Ideas worth thinking about.
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]/60"
              >
                Coming soon.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            DESCRIPTION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-8"
            >
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                This will eventually become the home for Martin's writing, principles, Substack essays, business observations and intellectual work.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
                className="pt-12 border-t border-[#1a1816]/8"
              >
                <Link href="/" className="inline-block">
                  <motion.button
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                    whileHover={{ x: -2 }}
                  >
                    ← Back to home
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* Breathing room */}
        <div className="h-24 md:h-32" />

      </div>
    </>
  );
}
