/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/app/components/Navigation";

export default function MartinPage() {
  return (
    <>
      <Navigation />

      {/* PAGE PADDING — Account for fixed navbar */}
      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            OPENING: CREDIBILITY FOUNDATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44">
          <div className="max-w-6xl">

            <div className="max-w-3xl mb-20 md:mb-28">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12"
              >
                A Business Architect
                <br />
                should probably have
                <br />
                built a few things.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-6"
              >
                Some worked.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-6"
              >
                Some didn't.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-12"
              >
                <span className="text-[#6b1f1f] font-semibold">Good.</span>
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 pt-8 md:pt-12 border-t border-[#1a1816]/8"
              >
                Because the real world doesn't always behave the way the books say it should.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.5 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 pt-6"
              >
                I wouldn't trust someone who only knows business in theory.
              </motion.p>
            </div>

          </div>
        </section>

        {/* ============================================================
            01: BOTH SIDES — Conceptual contrast composition
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-12 md:py-20">
          <div className="max-w-6xl">

            {/* BEAT 1: INSIDE — First narrative scene */}
            <div className="max-w-2xl mb-20 md:mb-28">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8"
              >
                INSIDE
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816] mb-6"
              >
                I spent years inside the machine.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-8"
              >
                Corporate leadership. International business. Teams. Budgets. Strategy. P&Ls. Sales. And yes, politics.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-8"
              >
                Been there. Done that. Navigated it.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-8"
              >
                I learned how businesses operate when the architecture already exists.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-2"
              >
                Customers. Processes. Teams. Systems. Capital. Reputation. Infrastructure.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
              >
                Much of what makes the business work is already there.
              </motion.p>
            </div>

            {/* BEAT 2: OUTSIDE — Second narrative scene */}
            <div className="max-w-2xl mb-24 md:mb-36">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8"
              >
                OUTSIDE
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816] mb-6"
              >
                Then I stepped outside the machine.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-8"
              >
                And had to build without it.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
              >
                No existing customers. No established processes. No team waiting. No infrastructure. No reputation to borrow.
              </motion.p>
            </div>

            {/* BEAT 3: RESOLUTION — The insight earned from the story */}
            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl lg:text-4xl font-medium leading-tight text-[#1a1816] mb-6"
              >
                This time, I wasn't managing something that already existed.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl lg:text-4xl font-medium leading-tight text-[#1a1816]"
              >
                I was creating something that didn't.
              </motion.p>
            </div>

          </div>
        </section>

        {/* Lesson learned: Being good at business... — developing the argument */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-16 md:py-28">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] mb-8"
              >
                Being good at business doesn't mean you know how to build one.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] mb-8"
              >
                Starting from zero is a different game.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]"
              >
                I learned that one <span className="text-[#6b1f1f] font-semibold">the expensive way.</span>
              </motion.p>
            </div>

          </div>
        </section>

        {/* ============================================================
            02: EDUCATION + EXPERIENCE
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight"
              >
                Educated enough to understand
                <br />
                how businesses <span className="font-semibold">should work</span>.
                <br />
                Experienced enough to know
                <br />
                how they <span className="text-[#6b1f1f] font-semibold">actually do</span>.
              </motion.h2>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            03: I STILL BUILD — ONE COMPOSITION (text + image)
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <div className="max-w-6xl">

            {/* LAYER 1: Headline — independent of grid below */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12 md:mb-20"
            >
              And I still build.
            </motion.h2>

            {/* LAYER 2: Activities + Portrait — explicit geometry */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
              {/* LEFT: Activity list — narrow column */}
              <div className="md:col-span-4 space-y-8">
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Today, I still run businesses.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Develop products.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Experiment with technology.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Coach.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Write.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Create methodologies.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  Turn ideas into things that have to work outside my head.
                </motion.p>
              </div>

              {/* RIGHT: Portrait with integrated caption — width-driven responsive */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-8"
              >
                <figure className="w-full md:w-[min(100%,570px)] flex flex-col items-start">
                  <Image
                    src="/images/martin-dubreuil-brand-portrait-primary.png"
                    alt="Martin Dubreuil"
                    width={570}
                    height={760}
                    priority
                    className="w-full h-auto block"
                  />
                  <figcaption className="w-full mt-3">
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.6 }}
                      viewport={{ once: true }}
                      className="text-xs md:text-sm tracking-wider uppercase text-[#1a1816]/60"
                    >
                      Serial Entrepreneur · 20+ Years International Business Development · MBA · Certified Business Coach
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.7 }}
                      viewport={{ once: true }}
                      className="flex gap-4 mt-4 text-xs text-[#1a1816]/50"
                    >
                      <a
                        href="https://www.linkedin.com/in/martin-dubreuil-ba643724/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Martin Dubreuil on LinkedIn"
                        className="hover:text-[#1a1816]/70 transition"
                      >
                        LinkedIn
                      </a>
                      <span className="text-[#1a1816]/30">·</span>
                      <a
                        href="https://dubreuil.substack.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Martin Dubreuil's Substack"
                        className="hover:text-[#1a1816]/70 transition"
                      >
                        Substack
                      </a>
                    </motion.div>
                  </figcaption>
                </figure>
              </motion.div>
            </div>

            {/* PRACTITIONER PAYOFF — The realization */}
            <div className="max-w-3xl mt-12 md:mt-16 pt-12 md:pt-16 border-t border-[#1a1816]/8">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-2xl md:text-3xl lg:text-4xl font-medium leading-tight text-[#1a1816] mb-12"
              >
                I still have skin in the game.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                My ideas don't get to live safely in theory.
                <br />
                They have to work in <span className="text-[#6b1f1f]">the real world.</span>
              </motion.p>
            </div>

          </div>
        </section>

        {/* ============================================================
            04: WORKING WITH ME — THREE MOVEMENTS
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              {/* MOVEMENT 1: THE CONTRACT — Establish relationship */}
              <div className="mb-16 md:mb-20">
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-8"
                >
                  If you're looking for someone whose job is to agree with you and keep you motivated, I'm probably not your guy.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                >
                  If you want to find out whether your idea — or your business — can get real, that's where I come in.
                </motion.p>
              </div>

              {/* MOVEMENT 2: THE WORK — Process and progression */}
              <div className="border-t border-[#1a1816]/8 pt-16 md:pt-20 mb-20 md:mb-24">
                <div className="space-y-6 mb-12">
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                  >
                    I'll challenge the idea.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                  >
                    I'll challenge the assumptions behind it.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                  >
                    If you're wrong, I'll tell you.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                  >
                    If you're right, I'll tell you that too.
                  </motion.p>
                </div>

                {/* Progression: Stop → Architect → Make it real */}
                <div className="border-t border-[#1a1816]/8 pt-12 space-y-6 mb-12">
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                  >
                    If the evidence says stop, we stop.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60"
                  >
                    If it's worth building, we architect it.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.8 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-2xl md:text-3xl font-medium leading-tight text-[#1a1816] pt-8 md:pt-12"
                  >
                    Then we <span className="text-[#6b1f1f]">make it real.</span>
                  </motion.p>
                </div>
              </div>

              {/* MOVEMENT 3: THE BOUNDARY — FOR YOU vs WITH YOU */}
              <div className="border-t border-[#1a1816]/8 pt-16 md:pt-20">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-12"
                >
                  One more thing.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-6"
                >
                  If you want someone to build your business <span className="text-[#6b1f1f] font-semibold">FOR YOU</span>, you'll need to find someone else.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 mb-8"
                >
                  But if you want someone to build it <span className="text-[#6b1f1f] font-semibold">WITH YOU</span> —
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
                >
                  we'll architect it together and make it exist.
                </motion.p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            05: FINAL TRANSITION: CASES
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-28 md:py-40">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-16"
              >
                Credentials are nice.
                <br />
                <span className="text-[#6b1f1f] font-semibold">Outcomes are better.</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-8"
              >
                You've heard what I know.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-16"
              >
                You've seen how I work.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-16"
              >
                Now see what happens when Business Architecture meets reality.
              </motion.p>

              {/* Dual exit: evidence path vs conversation path */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 pt-8 md:pt-12">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-sm text-[#1a1816]/70">Need more convincing?</p>
                  <Link href="/cases" className="inline-block w-fit">
                    <motion.span
                      className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      Explore the cases →
                    </motion.span>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-sm text-[#1a1816]/70">Already convinced?</p>
                  <Link href="/lets-talk" className="inline-block w-fit">
                    <motion.span
                      className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      Let's talk →
                    </motion.span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Breathing room for future content */}
        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
