/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function FindItCasePage() {
  return (
    <>
      <Navigation />

      {/* PAGE PADDING */}
      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Case 02</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-20 md:mb-28">
                FIND IT.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  The most interesting market
                  <br />
                  wasn't the obvious one.
                </h2>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  A large Asian retailer was examining international expansion opportunities across Southeast Asia.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  Several markets were obvious candidates.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  One market had received considerably less attention.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  Initial analysis suggested it deserved another look.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE FIRST LOOK — DESKTOP RESEARCH
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">The First Look</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The work began with desktop research.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">We examined:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Market landscape</li>
                    <li>Economic conditions</li>
                    <li>Consumer characteristics</li>
                    <li>Competition</li>
                    <li>Commercial potential</li>
                    <li>Market development</li>
                    <li>Potential barriers and opportunities</li>
                  </ul>
                </div>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-6 border-t border-[#1a1816]/8">
                  The purpose was not to prove the market attractive.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  It was to determine whether enough evidence existed to justify deeper investigation.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  There was.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THEN WE LEFT THE DESK — MAJOR TRANSITION
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
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
              >
                Then we left the desk.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                The next stage moved from reports and spreadsheets into the market itself.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ON THE GROUND — ECOSYSTEM EXPLORATION
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
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Several weeks were spent on the ground speaking with people across the potential ecosystem.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">Conversations with:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Potential customers</li>
                    <li>Suppliers</li>
                    <li>Logistics providers</li>
                    <li>Property and development interests</li>
                    <li>Potential commercial partners</li>
                    <li>Other relevant local stakeholders</li>
                  </ul>
                </div>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-6 border-t border-[#1a1816]/8">
                  The findings were documented and progressively connected.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            WHAT WE FOUND — DISCOVERY MOMENT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-8"
            >
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
              >
                The research identified an underserved market space and a potentially viable route into it.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                The opportunity was not simply about entering another country.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            MARKET-ENTRY ARCHITECTURE
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">The Architecture</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The architecture had to determine:
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-3">
                    <li>The appropriate market-entry structure</li>
                    <li>Which capabilities were required locally</li>
                    <li>What should be built internally</li>
                    <li>Where partnership created greater leverage</li>
                    <li>How the opportunity could fit the organization's broader expansion strategy</li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE DECISION — JOINT VENTURE
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
                  The evidence ultimately supported proceeding.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-12 mt-12 space-y-6"
              >
                <motion.p
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                >
                  A joint venture with an established local corporation was proposed and approved by the board.
                </motion.p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The initiative moved into development.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            DISCOVER / PROCEED OUTCOME
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
              <p className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-6">Outcome</p>

              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-4"
              >
                DISCOVER / PROCEED
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                An initially overlooked market became a credible expansion opportunity supported by evidence and an executable entry architecture.
              </motion.p>
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
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816] mb-12"
              >
                Sometimes the opportunity
                <br />
                is sitting somewhere
                <br />
                everyone else walked past.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Desktop research provided signals.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Reality on the ground provided evidence.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Architecture connected the evidence into a viable route forward.
                </p>
              </motion.div>
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

      </main>
    </>
  );
}
