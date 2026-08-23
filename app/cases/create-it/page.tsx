/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function CreateItCasePage() {
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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Case 05</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-20 md:mb-28">
                CREATE IT.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  There was no business idea.
                </p>

                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  Just an asset.
                </p>

                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  And the ambition to build something.
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
                An investor was considering acquiring a relatively inexpensive piece of land in the American Southwest.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                He wanted to become an entrepreneur and saw the property as a possible starting point.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                His question was essentially:
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]"
              >
                What business could we build here?
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-6 space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  There was no defined product.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  No business model.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Not even a developed business idea.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  There was an asset and an ambition.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            FINDING THE OPPORTUNITY
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">Investigation</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  We began by looking outward rather than immediately deciding what should be constructed on the land.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">The work explored:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Location</li>
                    <li>Population</li>
                    <li>Demographic trends</li>
                    <li>Regional activity</li>
                    <li>Reasons people travelled to or through the area</li>
                    <li>Lifestyle trends</li>
                    <li>Existing and emerging needs</li>
                    <li>Potential commercial uses of the location</li>
                  </ul>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="border-t border-[#1a1816]/8 pt-6 space-y-4"
                >
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    Several observations began connecting.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    One involved the popularity of RV and mobile lifestyles.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    Another involved the large aging population sometimes described as the Silver Tsunami.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE HUMAN INSIGHT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
              >
                A particular tension emerged among long-term travellers and mobile retirees:
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-12 border-t border-[#1a1816]/8"
              >
                As mobility becomes more difficult with age, people may eventually be forced to abandon not simply a vehicle but a lifestyle, community and identity.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CREATING THE CONCEPT
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">The Concept</h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  From those observations, a business concept began to emerge.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The idea was to develop a community capable of evolving with its residents through later stages of life rather than forcing them to abruptly abandon the lifestyle they valued.
                </p>

                <div className="space-y-3 pt-6 border-t border-[#1a1816]/8">
                  <p className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/50 font-medium">The concept combined:</p>
                  <ul className="text-lg md:text-lg leading-relaxed text-[#1a1816]/60 space-y-2">
                    <li>Mobile/RV-oriented living</li>
                    <li>Community</li>
                    <li>Wellness</li>
                    <li>Retreat experiences</li>
                    <li>Progressive support services</li>
                    <li>Other services appropriate to the needs of an aging population</li>
                  </ul>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="border-t border-[#1a1816]/8 pt-8 space-y-4"
                >
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    The underlying principle became:
                  </p>

                  <p className="text-xl md:text-2xl lg:text-3xl font-light leading-tight text-[#1a1816]">
                    You don't necessarily move away
                    <br />
                    from your lifestyle as you age.
                  </p>

                  <p className="text-xl md:text-2xl lg:text-3xl font-light leading-tight text-[#1a1816]">
                    The lifestyle evolves with you.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            VALIDATION
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">Testing</h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                Further market and economic work supported the commercial potential of the concept.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                Then the architecture exposed a critical location-specific constraint involving access to an essential resource required for long-term development.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                The uncertainty was significant enough to threaten the viability of the entire property-based project.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE REVERSAL — PROPERTY REJECTED
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
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#6b1f1f]"
              >
                THE PROPERTY WAS REJECTED.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-8"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  But the business concept was not.
                </p>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-8 space-y-4"
                >
                  The investigation had separated the business opportunity from the original asset.
                </motion.p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The concept could potentially be adapted to a different location where the underlying conditions were stronger.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CURRENT STATUS
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
              <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-8">Status</h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                The concept remains in development, with potential partnership and development opportunities being explored in another U.S. market.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]"
              >
                It should not currently be represented as investor-ready or as a completed development.
              </motion.p>
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
                CREATE / VALIDATE / STOP / RELOCATE
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  An asset generated an investigation.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The investigation generated an idea.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The idea developed into a potentially viable business concept.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The original asset failed an important condition.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The asset was rejected.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  The business survived.
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
                We killed the property.
                <br />
                <span className="text-[#6b1f1f]">Not the business.</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Sometimes the thing you start with
                  <br />
                  isn't the business.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  It's simply how you discover it.
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
