/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ValidateItCasePage() {
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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Case 03</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-20 md:mb-28">
                VALIDATE IT.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  He wanted to import a product.
                </p>

                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  The obvious question was:
                </p>

                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  How?
                </p>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="border-t border-[#1a1816]/8 pt-8"
                >
                  <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                    We started with a different one:
                  </p>

                  <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#6b1f1f] mt-6">
                    Should he?
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CONTEXT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-6"
            >
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                An entrepreneur wanted to create a new business importing a specialized product from Vietnam into Canada.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                He had never operated an import business before and believed the product represented a strong opportunity.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                The obvious reaction would have been to begin teaching him how to import it.
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816] font-light"
              >
                We didn't.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            GATE ONE — VALIDATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-12"
            >
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
              >
                Does the product have potential?
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Before discussing logistics, suppliers or distribution, we examined whether the product had sufficient reason to exist in the target market.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">The work included:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Customer and market signals</li>
                    <li>Existing alternatives</li>
                    <li>Potential demand</li>
                    <li>Relevant regulatory and import considerations</li>
                    <li>Practical feasibility of moving the product into the market</li>
                  </ul>
                </div>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-6 border-t border-[#1a1816]/8">
                  Enough positive evidence existed to continue.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
                className="space-y-2"
              >
                <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#6b1f1f]">
                  PROCEED.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            GATE TWO — ECONOMICS
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-12"
            >
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
              >
                Can there be a profitable business around it?
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Next came the economics.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Using what I call the <span className="font-semibold text-[#1a1816]">Napkin Principle</span>, we examined the business at its simplest level:
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Product cost</li>
                    <li>Logistics and landed costs</li>
                    <li>Expected selling price</li>
                    <li>Potential margins</li>
                    <li>Setup and operating requirements</li>
                    <li>Realistic sales potential</li>
                    <li>Volume required to create a worthwhile business</li>
                  </ul>
                </div>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-6 border-t border-[#1a1816]/8">
                  The economics passed the second gate.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
                className="space-y-2"
              >
                <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#6b1f1f]">
                  PROCEED.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE TURN — ARCHITECTURE
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
                Only then:
                <br />
                How do we build it?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                Only then did we move into the how.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ARCHITECTURE COMPONENTS
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
                  The architecture began connecting:
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-3">
                    <li>Supplier</li>
                    <li>Logistics</li>
                    <li>Import requirements</li>
                    <li>Distribution</li>
                    <li>Go-to-market</li>
                    <li>Required capabilities</li>
                    <li>External expertise</li>
                    <li>Commercial relationships</li>
                    <li>Operational gaps</li>
                  </ul>
                </div>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-6 border-t border-[#1a1816]/8">
                  We identified what the entrepreneur could reasonably develop himself, what needed external support, and which relationships had to exist on both sides of the supply chain.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CURRENT STATUS
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
                className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8"
              >
                Status
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                The business is currently in development.
              </motion.p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                Required pieces are being put into place, gaps are being closed, external capabilities are being secured where necessary, and commercial relationships are being established.
              </p>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-8 space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  This is not yet a completed commercial success.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Its proof lies in the progression from idea through evidence, economics and architecture into execution.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            OUTCOME
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
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-12"
              >
                VALIDATE / ARCHITECT / BUILD
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The entrepreneur arrived with a product idea.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The idea survived validation.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The economics supported a business.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The architecture was developed.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Now the work is to make it exist.
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
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816] mb-12"
              >
                Knowing how to execute an idea
                <br />
                is useless if the idea should never
                <br />
                have been executed in the first place.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  First determine whether there is a business.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Then earn the right to build it.
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
