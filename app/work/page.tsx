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

      <div className="w-full bg-white text-[#1a1816]">

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
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-8">
                Where
                <br />
                are you?
              </h2>
              <p className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed max-w-2xl">
                Most people arrive here from one of a few starting points.
              </p>
            </motion.div>

            {/* Recognition states — ONE AT A TIME, clean replacement */}
            <div className="min-h-[50vh] flex items-center mb-16 md:mb-20">
              <div className="w-full max-w-3xl">

                {/* State 01 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  viewport={{ once: false, margin: "-200px" }}
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
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                  viewport={{ once: false, margin: "-200px" }}
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
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.8 }}
                  viewport={{ once: false, margin: "-200px" }}
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
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, delay: 1.2 }}
                  viewport={{ once: false, margin: "-200px" }}
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

            {/* Convergence — theatrical settling effect, compressed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-12 md:mb-16"
            >
              <div className="mb-6 h-px w-12 bg-[#6b1f1f]" />
              <motion.h3
                initial={{ letterSpacing: "0.05em" }}
                whileInView={{ letterSpacing: "0" }}
                transition={{ duration: 0.9, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4"
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
                className="text-2xl md:text-3xl font-light leading-tight"
              >
                <span className="text-[#6b1f1f] font-semibold">Same question.</span>
              </motion.p>
            </motion.div>

            {/* Final question — flows naturally from convergence */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-50px" }}
              className="py-12 md:py-16 max-w-3xl"
            >
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                What should
                <br />
                happen next?
              </h3>
            </motion.div>

          </div>
        </section>

        {/* Transition pause — compressed, flows directly as answer */}
        <div className="h-4 md:h-6" />

        {/* ============================================================
            THE PIVOT: DISORDER → ALIGNMENT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-12 md:py-16">
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
            ACT 01: PUT THE IDEA ON TRIAL
            Editorial Left mode — stable headline, evolving investigation
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-48">
          <div className="max-w-6xl">

            {/* Stable left anchor */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
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

              {/* Evolving right stage */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-8 space-y-12 md:space-y-16"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  You've got an idea.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  Great.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Now let's see if reality agrees.
                </p>

                {/* Investigation — progressive reveal */}
                <div className="pt-8 md:pt-12 min-h-[30vh]">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: false, margin: "-100px" }}
                    className="text-xl md:text-2xl font-light text-[#1a1816]"
                  >
                    We challenge it.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: false, margin: "-100px" }}
                    className="text-xl md:text-2xl font-light text-[#1a1816] mt-12"
                  >
                    Stress-test it.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    viewport={{ once: false, margin: "-100px" }}
                    className="text-xl md:text-2xl font-light text-[#1a1816] mt-12"
                  >
                    Investigate the assumptions behind it.
                  </motion.p>
                </div>

                {/* Evidence */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-8 md:pt-12 border-t border-[#1a1816]/8"
                >
                  Look for evidence that there is a market—
                  <br />
                  and that the idea deserves to exist in it.
                </motion.p>
              </motion.div>
            </div>

            {/* Three outcomes — full width, structured grid */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 my-24 md:my-32 py-16 md:py-20 border-y border-[#1a1816]/10"
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816]">
                  Proceed.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816]">
                  Reshape.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816]">
                  Walk away.
                </p>
              </motion.div>
            </motion.div>

            {/* Sting — conclusion with strong authority */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl border-t border-[#1a1816]/8 pt-20 md:pt-28 my-24 md:my-32"
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816] mb-6"
              >
                Finding out now
                <br />
                is cheap.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
              >
                Finding out after
                <br />
                you've built the damn thing
                <br />
                <span className="text-[#6b1f1f] font-semibold">isn't.</span>
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ACT 02: ARCHITECT THE BUSINESS
            Structured Field mode — components assemble into architecture
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-28 md:py-40">
          <div className="max-w-6xl">

            {/* Act 02 using consistent grammar: LEFT anchor + RIGHT process */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
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

              {/* Right stage: architecture assembly */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-8 space-y-12 md:space-y-16"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                  A promising idea still isn't a business.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Now we give it structure.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 pt-8 border-t border-[#1a1816]/8">
                  The pieces might include:
                </p>
              </motion.div>
            </div>

            {/* ASSEMBLY COMPOSITION — Business architecture decisions (8 items) */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 py-32 md:py-48"
            >

              {/* Offer */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Offer
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  What exactly are we putting into the market?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Pricing */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Pricing
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.35 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  What will people pay — and how?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Revenue Streams */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Revenue Streams
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  Where does the money come from?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Economics */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Economics
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.45 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  Can the numbers actually work?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.65 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Channels */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Channels
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  How will we reach the market?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Value Delivery */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Value Delivery
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.55 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  How do we deliver what we promise?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.75 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Go-to-Market */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Go-to-Market
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.65 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  How do we create demand and win customers?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.85 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

              {/* Operations */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.7 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-light leading-tight text-[#1a1816] mb-4">
                  Operations
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.75 }}
                  viewport={{ once: true }}
                  className="text-base md:text-lg text-[#1a1816]/60 leading-relaxed mb-6"
                >
                  What has to work behind the scenes?
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.95 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-16 bg-[#1a1816]/20"
                />
              </motion.div>

            </motion.div>

            {/* Assembly completion — full-width resolution */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="border-t border-[#1a1816]/8 pt-24 md:pt-32 max-w-3xl"
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] mb-6"
              >
                Every decision
                <br />
                affects the others.
              </motion.p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
                That's why we architect
                <br />
                <span className="text-[#6b1f1f] font-semibold">the whole business.</span>
              </p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ACT 03: MAKE IT EXIST
            Editorial Left mode — structure transitions to motion
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-48">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-20 md:mb-28 max-w-3xl"
            >
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">03</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-12">
                Make it
                <br />
                exist.
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 max-w-3xl">
                Because a beautifully architected business
                <br />
                that never meets the market
                <br />
                is still an idea.
              </p>
            </motion.div>

            {/* Execution sequence — momentum, not isolation */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mb-16 md:mb-20"
            >
              <div className="text-2xl md:text-3xl font-light text-[#1a1816] leading-relaxed">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0 }}
                  viewport={{ once: true }}
                  className="inline"
                >
                  We build →{" "}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="inline"
                >
                  We launch →{" "}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="inline"
                >
                  We sell →{" "}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="inline"
                >
                  We learn →{" "}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="inline"
                >
                  We adjust.
                </motion.span>
              </div>
            </motion.div>

            {/* Resolution — evidence → conclusion */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl border-t border-[#1a1816]/8 pt-20 md:pt-28"
            >
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-12">
                Until reality answers.
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-[#1a1816] mb-6"
              >
                Someone buys.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight"
              >
                <span className="text-[#6b1f1f] font-semibold">Now it's a business.</span>
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            FINAL REVEAL: BUSINESS ARCHITECTURE
            Monumental Center mode — understanding crystallizes
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-6xl">

            {/* Three principles — summary, strong contrast */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-2 md:space-y-3 mb-12 md:mb-16 max-w-3xl"
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
              className="border-t border-[#1a1816]/8 pt-16 md:pt-24 mb-24 md:mb-32 max-w-3xl"
            >
              <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                That is
                <br />
                <span className="text-[#6b1f1f] font-semibold">Business Architecture.</span>
              </p>
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

      </div>
    </>
  );
}
