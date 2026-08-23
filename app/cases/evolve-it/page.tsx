/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function EvolveItCasePage() {
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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Case 04</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-20 md:mb-28">
                EVOLVE IT.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  The idea wasn't necessarily too big.
                </p>

                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  The first move was.
                </p>
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
                An entrepreneur had carried an unusually ambitious idea for several years.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                The vision was much larger than a conventional product. He believed it could eventually create meaningful impact at significant scale.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                But the idea remained largely trapped in his head.
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                He could describe the future he imagined but struggled to translate it into something concrete enough to understand, test, build and sell.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE FIRST ARCHITECTURE
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">Translation</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The first job was translation.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  We worked together to extract the vision and turn it into something more tangible.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">We explored:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>What the vision actually meant</li>
                    <li>Who might care</li>
                    <li>Which problems it could solve</li>
                    <li>What the market might look like</li>
                    <li>Which assumptions could be researched</li>
                    <li>Which assumptions required testing</li>
                  </ul>
                </div>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-6 border-t border-[#1a1816]/8">
                  Because the concept was novel, existing market evidence could answer only so much.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Eventually, reality needed to answer the remaining questions.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE FIRST TEST
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
                The first test
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  A small MVP and limited market test were developed.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The test did not validate the original route as expected.
                </p>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] pt-6 border-t border-[#1a1816]/8"
                >
                  Good.
                </motion.p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  It produced something more valuable than false reassurance.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  It demonstrated that the ambition was too large to realize in one move.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE PIVOT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56 border-t border-[#1a1816]/8">
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
                The lesson was not necessarily:
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <p className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]">
                    THE VISION IS WRONG.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="border-t border-[#1a1816]/8 pt-8"
                >
                  <p className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]">
                    It was:
                  </p>

                  <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#6b1f1f] mt-6">
                    THE FIRST MOVE IS WRONG.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            RETURN TO ARCHITECTURE
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
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                We returned to the architecture.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The problem was narrowed.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The initial audience became more specific.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The technical ambition was reduced.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-6 pt-8 border-t border-[#1a1816]/8"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  A smaller opportunity emerged that could potentially function as a business on its own while remaining strategically connected to the larger ambition.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Instead of asking:
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  How do we build the entire vision?
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  the question became:
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  What is the first viable business we can build that moves us toward it?
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            MAKING IT EXIST
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">Development</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  A simpler functional MVP was developed.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  It is something potential customers can actually experience, register for, use and ultimately pay for.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Early market interest is emerging, including inquiries from people interested in using and paying for the solution.
                </p>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="border-t border-[#1a1816]/8 pt-8 space-y-4"
                >
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    The entrepreneur remains responsible for building his business.
                  </p>

                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    The Business Architect role has shifted between challenging, coaching, advising, architecture and practical execution support according to what the project required.
                  </p>
                </motion.div>
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
                TEST / LEARN / EVOLVE / BUILD
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The first route failed.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The ambition survived.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  A narrower first business was architected.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Something concrete now exists that can generate the evidence, customers, capabilities and potentially revenue required to support larger ambitions later.
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
                You don't need to shrink the ambition.
                <br />
                You need to shrink the first move.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The original idea didn't necessarily fail.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The original route to it did.
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

      </div>
    </>
  );
}
