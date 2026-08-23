/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function KillItCasePage() {
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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Case 01</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-20 md:mb-28">
                KILL IT.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  A proven American business model.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  A large Asian organization considering replication.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  Significant investment ready to deploy.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE INVESTIGATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">Six Months</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Before proceeding, the organization wanted evidence that the model could translate into its local environment.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Over approximately six months, the opportunity was examined from multiple angles.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">Investigation examined:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Customer archetypes and behavior</li>
                    <li>Differences between American and local markets</li>
                    <li>Competitive landscape</li>
                    <li>Macro- and microeconomic conditions</li>
                    <li>Market-specific success triggers</li>
                    <li>Why the American model worked</li>
                    <li>The organization's capabilities and constraints</li>
                    <li>What conditions would be required for replication</li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE QUESTION SHIFT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-2xl space-y-12"
            >
              <div>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-8"
                >
                  Can we replicate this business model?
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-12"
              >
                <p className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]">
                  Will the conditions that made this business successful elsewhere travel with it?
                </p>
              </motion.div>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                The question that matters is not whether the model can be copied. It is whether the conditions underneath its success can transfer.
              </p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE EVIDENCE
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
                The evidence increasingly suggested they would not.
              </p>

              <div className="border-t border-[#1a1816]/8 pt-12">
                <p className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-6">The Cost of Proceeding</p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
                    US$10–20 million
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                    The estimated cost of the proof-of-concept and pilot phase.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                    The architecture had provided enough evidence that this investment did not need to be made simply to discover what had already been exposed.
                  </p>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE DECISION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-2xl"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
                  STOP.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The recommendation was not to proceed with the proposed replication.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-12 mt-12 space-y-6"
              >
                <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
                  EXTRACT.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Several of the model's underlying success factors could potentially create value inside the organization's existing business.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Those elements were extracted and considered independently rather than importing the entire model.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE PRINCIPLE
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816] mb-8"
              >
                Good pre-architecture doesn't always tell you what to build.
                <br />
                Sometimes it tells you what not to.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
              >
                Sometimes the most valuable outcome is clarity before commitment.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            RETURN TO CASES
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <Link href="/cases" className="inline-block">
                <motion.button
                  className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                  whileHover={{ x: -2 }}
                >
                  ← All cases
                </motion.button>
              </Link>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            FINAL CTA
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-8"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                You have an idea.
                <br />
                Let's find out what it can become.
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Link href="/lets-talk" className="inline-block">
                  <motion.button
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                    whileHover={{ x: 2 }}
                  >
                    LET'S TALK →
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
