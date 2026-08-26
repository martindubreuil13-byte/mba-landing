/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function WorkPage() {

  return (
    <>
      <Navigation />

      {/* PAGE PADDING — Account for fixed navbar */}
      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            MOVEMENT II: RECOGNITION / WHERE ARE YOU?
            Editorial Left mode - proper state replacement
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-48">
          <div className="max-w-6xl">

            {/* Opening — strong left anchor, no centering */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-24 md:mb-32 max-w-3xl"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-8">
                Where
                <br />
                are you?
              </h1>
              <p className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed max-w-2xl">
                Most people arrive here from one of a few starting points.
              </p>
            </motion.div>

            {/* Recognition states — ONE AT A TIME, clean replacement */}
            <div className="w-full mb-16 md:mb-20">
              <div className="w-full max-w-3xl">

                {/* State 01 */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.9 } }
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="mb-20"
                >
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-3">Situation 01</p>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
                    I want to start
                    <br />
                    a business.
                  </h3>
                  <p className="text-lg md:text-xl text-[#1a1816]/60 leading-relaxed max-w-2xl">
                    But I don't know what—or how.
                  </p>
                </motion.div>

                {/* State 02 */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.9 } }
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="mb-20"
                >
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-3">Situation 02</p>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
                    I have
                    <br />
                    an idea.
                  </h3>
                  <p className="text-lg md:text-xl text-[#1a1816]/60 leading-relaxed max-w-2xl">
                    But I don't know if it could actually become a business.
                  </p>
                </motion.div>

                {/* State 03 */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.9 } }
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="mb-20"
                >
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-3">Situation 03</p>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
                    I've started
                    <br />
                    building something.
                  </h3>
                  <p className="text-lg md:text-xl text-[#1a1816]/60 leading-relaxed max-w-2xl">
                    But I'm not sure how to turn it into a business—or take it to market.
                  </p>
                </motion.div>

                {/* State 04 */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.9 } }
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="mb-20"
                >
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-3">Situation 04</p>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
                    I've just started
                    <br />
                    a business.
                  </h3>
                  <p className="text-lg md:text-xl text-[#1a1816]/60 leading-relaxed max-w-2xl">
                    But something isn't working.
                  </p>
                </motion.div>

              </div>
            </div>

            {/* SYNTHESIS + QUESTION — One editorial composition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.2 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl mb-16 md:mb-20"
            >
              {/* Synthesis — conclusion of the preceding sequence */}
              <div className="mb-12 md:mb-16">
                <div className="mb-6 h-px w-12 bg-[#6b1f1f]" />
                <motion.h3
                  initial={{ letterSpacing: "0.05em" }}
                  whileInView={{ letterSpacing: "0" }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6"
                >
                  Different
                  <br />
                  starting points.
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0.6 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-light leading-tight"
                >
                  <span className="text-[#6b1f1f] font-semibold">Same question.</span>
                </motion.p>
              </div>

              {/* Question — deliberate editorial question */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-medium leading-tight text-[#1a1816]"
              >
                What do we do next?
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            THE PIVOT: DISORDER → ALIGNMENT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-6 md:py-8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-6">
                <motion.span
                  key="stop"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  viewport={{ once: true }}
                  className="block"
                >
                  Stop
                </motion.span>
                <motion.span
                  key="improvising"
                  initial={{ opacity: 0, letterSpacing: "0.1em" }}
                  whileInView={{
                    opacity: [1, 0.6, 1],
                    letterSpacing: ["0.1em", "0.05em", "0"]
                  }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="block text-[#6b1f1f] font-semibold"
                >
                  improvising.
                </motion.span>
              </h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mt-8 md:mt-10"
              >
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight">
                  <span className="block mb-2">Start</span>
                  <motion.span
                    initial={{ opacity: 0, letterSpacing: "-0.05em" }}
                    whileInView={{
                      opacity: 1,
                      letterSpacing: "0"
                    }}
                    transition={{ duration: 1, delay: 0.7 }}
                    viewport={{ once: true }}
                    className="block text-[#6b1f1f] font-semibold"
                  >
                    architecting.
                  </motion.span>
                </h2>
              </motion.div>

            </motion.div>

          </div>
        </section>

        {/* ============================================================
            BRIDGE: EDITORIAL NARRATIVE (increased authority)
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-16 md:py-20">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-6 md:space-y-8"
            >
              <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                So what happens when we stop improvising?
              </p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
                <span className="text-[#6b1f1f] font-semibold">We get to work.</span>
              </p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                Where we start depends on where you are.
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-8"
              >
                Depending on where you are, we start with one of three things.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ACT 01: PUT THE IDEA ON TRIAL
            Unified LEFT/RIGHT architecture with shared system
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="max-w-6xl">

            {/* LEFT/RIGHT architecture — unified system */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
              {/* LEFT COLUMN — Act anchor */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-4"
              >
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">01</p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                  Put the idea
                  <br />
                  on trial.
                </h2>
              </motion.div>

              {/* RIGHT COLUMN — Content progression */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-8 space-y-8 md:space-y-12"
              >
                {/* Opening condition */}
                <div className="space-y-4">
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    You've got an idea? Great.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    Now let's put it to the test and see if reality agrees.
                  </p>
                </div>

                {/* What we do */}
                <div className="border-t border-[#1a1816]/8 pt-8 space-y-4">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: false, margin: "-100px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    We challenge it. Stress-test it. Investigate the assumptions behind it. Look for enough evidence that there is a market and that the idea deserves to exist.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: false, margin: "-100px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    And if you don't have an idea yet, we'll find one.
                  </motion.p>
                </div>

                {/* Outcome */}
                <div className="border-t border-[#1a1816]/8 pt-8 space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    The outcome is a decision:
                  </motion.p>

                  <div className="flex flex-wrap gap-4 md:gap-6">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                      className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] whitespace-nowrap"
                    >
                      PROCEED.
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      viewport={{ once: true }}
                      className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] whitespace-nowrap"
                    >
                      RESHAPE.
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      viewport={{ once: true }}
                      className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] whitespace-nowrap"
                    >
                      WALK AWAY.
                    </motion.span>
                  </div>
                </div>

                {/* Final thought */}
                <div className="border-t border-[#1a1816]/8 pt-8">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.9 }}
                    viewport={{ once: true }}
                    className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] mb-4"
                  >
                    Finding out now
                    <br />
                    is cheap.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 1.1 }}
                    viewport={{ once: true }}
                    className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
                  >
                    Finding out after you've built
                    <br />
                    the damn thing
                    <br />
                    <span className="text-[#6b1f1f] font-semibold">isn't.</span>
                  </motion.p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            ACT 02: ARCHITECT THE BUSINESS
            Unified LEFT/RIGHT architecture with shared system
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="max-w-6xl">

            {/* LEFT/RIGHT architecture — unified system */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
              {/* LEFT COLUMN — Act anchor */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-4"
              >
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">02</p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                  Architect
                  <br />
                  the business.
                </h2>
              </motion.div>

              {/* RIGHT COLUMN — Content progression */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-8 space-y-8 md:space-y-12"
              >
                {/* Opening condition */}
                <div className="space-y-4">
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    The idea survived.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    We have enough evidence that this can work.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    Now let's architect it.
                  </p>
                </div>

                {/* What we do — Architecture elements */}
                <div className="border-t border-[#1a1816]/8 pt-8 space-y-8">
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    We architect how the pieces work together:
                  </p>

                  {/* Compact two-column architecture list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Offer</p>
                      <p className="text-base text-[#1a1816]/60">What exactly are we putting into the market?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Pricing</p>
                      <p className="text-base text-[#1a1816]/60">What will people pay — and how?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Revenue Streams</p>
                      <p className="text-base text-[#1a1816]/60">Where does the money come from?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Economics</p>
                      <p className="text-base text-[#1a1816]/60">Can the numbers actually work?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Channels</p>
                      <p className="text-base text-[#1a1816]/60">How will we reach the market?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Value Delivery</p>
                      <p className="text-base text-[#1a1816]/60">How do we deliver what we promise?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Go-to-Market</p>
                      <p className="text-base text-[#1a1816]/60">How do we create demand and win customers?</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-tight text-[#1a1816] mb-3">Operations</p>
                      <p className="text-base text-[#1a1816]/60">What has to work behind the scenes?</p>
                    </div>
                  </div>
                </div>

                {/* Final thought */}
                <div className="border-t border-[#1a1816]/8 pt-8 space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    The outcome is an architecture:
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    A business that makes sense on paper before we spend the resources to make it real.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                    viewport={{ once: true }}
                    className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] mb-4"
                  >
                    Every decision
                    <br />
                    affects the others.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.9 }}
                    viewport={{ once: true }}
                    className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
                  >
                    That's why we architect
                    <br />
                    <span className="text-[#6b1f1f] font-semibold">the whole business</span>
                    <br />
                    instead of improvising one piece at a time.
                  </motion.p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            ACT 03: MAKE IT EXIST
            Editorial Left mode — structure aligns with Acts 01 and 02
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="max-w-6xl">

            {/* LEFT/RIGHT structure — unified system */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
              {/* LEFT COLUMN — Act anchor */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-4"
              >
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">03</p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                  Make it
                  <br />
                  exist.
                </h2>
              </motion.div>

              {/* RIGHT COLUMN — Content progression */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-8 space-y-8 md:space-y-12"
              >
                {/* Opening condition */}
                <div className="space-y-4">
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    The architecture works on paper.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                    Now we make it exist.
                  </p>
                </div>

                {/* Execution sequence */}
                <div className="border-t border-[#1a1816]/8 pt-8 space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    We build.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    We launch.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    We sell.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    We learn.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    We adjust.
                  </motion.p>
                </div>

                {/* Reality gets a vote */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 border-t border-[#1a1816]/8 pt-8"
                >
                  Reality gets a vote.
                </motion.p>

                {/* Final thought */}
                <div className="border-t border-[#1a1816]/8 pt-8 space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    The outcome is not another document.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
                  >
                    It's a business operating in the real world.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
                  >
                    Success starts when customers start paying for it.
                  </motion.p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            FINAL REVEAL: BUSINESS ARCHITECTURE
            Monumental Center mode — understanding crystallizes
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 pt-10 md:pt-14 pb-16 md:pb-20">
          <div className="max-w-6xl">

            {/* Three principles — summary, strong contrast */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-2 md:space-y-3 mb-8 md:mb-12 max-w-3xl"
            >
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
              >
                Find what's worth building.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
              >
                Architect how it will work.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
              >
                Make it exist.
              </motion.p>
            </motion.div>

            {/* Final payoff — definition emerges naturally */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              viewport={{ once: true, margin: "-50px" }}
              className="border-t border-[#1a1816]/8 pt-12 md:pt-16 mb-16 md:mb-20 max-w-3xl"
            >
              <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                That is
                <br />
                <span className="text-[#6b1f1f] font-semibold">Business Architecture.</span>
              </p>
            </motion.div>

            {/* Optional — Learn what Business Architecture means */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-12 md:mb-16 max-w-3xl"
            >
              <p className="text-sm text-[#1a1816]/60 mb-3">
                Want a deeper understanding?
              </p>
              <Link href="/answers/what-is-business-architecture" className="inline-block">
                <motion.span
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  whileHover={{ x: 2 }}
                >
                  What Is Business Architecture? →
                </motion.span>
              </Link>
            </motion.div>

            {/* Narrative CTA to Martin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mb-12">
                So, who will you
                <br />
                be architecting with?
              </p>
              <Link href="/martin" className="inline-block">
                <motion.button
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  whileHover={{ x: 2 }}
                >
                  Meet Martin →
                </motion.button>
              </Link>
            </motion.div>

          </div>
        </section>

        {/* Breathing room for future content */}
        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
