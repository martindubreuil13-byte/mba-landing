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

      <div className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            OPENING: CREDIBILITY FOUNDATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl mb-20 md:mb-28"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                A business architect
                <br />
                should probably have
                <br />
                built a few things.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-6"
              >
                <p className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]">
                  Some worked.
                </p>
                <p className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]">
                  Some didn't.
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl font-light leading-tight"
                >
                  <span className="text-[#6b1f1f] font-semibold">Good.</span>
                </motion.p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 pt-12 md:pt-16"
              >
                I would not trust someone who only understood business in theory.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            01: BOTH SIDES
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36">
          <div className="max-w-6xl">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-5 space-y-16 md:space-y-24"
              >
                <div>
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Inside</p>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-12">
                    I spent years inside
                    <br />
                    the machine.
                  </h2>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                    Corporate leadership. International business. Teams. Budgets. Strategy. Organizations where infrastructure already existed.
                  </p>
                </div>

                <div className="h-px w-12 bg-[#1a1816]/20" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-7"
              >
                <div>
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Outside</p>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-12">
                    Then I had to build
                    <br />
                    without
                    <br />
                    the machine.
                  </h2>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                    Creating something when the organization, systems and certainty do not yet exist. That teaches you what actually matters.
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            02: THE REALIZATION
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
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-16"
              >
                Being good at business
                <br />
                doesn't mean you know
                <br />
                how to build one.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-8 mb-16 pb-16 border-b border-[#1a1816]/8"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  Inside an established organization, much of the architecture already exists. Customers. Processes. Teams. Systems. Capital. Reputation. Infrastructure.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  Starting from zero is different.
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
              >
                I learned that one
                <br />
                <span className="text-[#6b1f1f] font-semibold">the expensive way.</span>
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            03: EDUCATION + EXPERIENCE
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
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-20"
              >
                Educated enough to understand
                <br />
                how businesses <span className="font-semibold">should work</span>.
                <br />
                Experienced enough to know
                <br />
                how they <span className="text-[#6b1f1f] font-semibold">actually do</span>.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-16 md:pt-20 border-t border-[#1a1816]/8"
              >
                <div>
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Foundation</p>
                  <ul className="space-y-4 text-lg leading-relaxed text-[#1a1816]/70">
                    <li>Master of Business Administration (MBA)</li>
                    <li>Certified Business Coach</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Operating Experience</p>
                  <ul className="space-y-4 text-lg leading-relaxed text-[#1a1816]/70">
                    <li>20+ years corporate leadership</li>
                    <li>International business development</li>
                    <li>Serial entrepreneur & builder</li>
                    <li>Built and worked across 10+ countries</li>
                    <li>Across multiple industries</li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            04: I STILL BUILD — with visual presence
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36">
          <div className="max-w-6xl">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="md:col-span-6"
              >
                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-16"
                >
                  I still build.
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="space-y-8 mb-16 pb-16 border-b border-[#1a1816]/8"
                >
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    Businesses. Products. Experiments. Technology. Ideas that work. Ideas that don't.
                  </p>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]"
                >
                  Advice gets very comfortable
                  <br />
                  <span className="text-[#6b1f1f] font-semibold">when it stops meeting reality.</span>
                </motion.p>
              </motion.div>

              {/* Martin portrait — right column */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="md:col-span-6 flex items-center justify-center"
              >
                <div className="relative w-full h-[400px] md:h-[500px]">
                  <Image
                    src="/images/martin-dubreuil-brand-portrait-primary.png"
                    alt="Martin Dubreuil"
                    fill
                    priority
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-contain object-center"
                  />
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            05: WHAT WORKING WITH MARTIN FEELS LIKE
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
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-16"
              >
                I'm not here
                <br />
                to cheer for your idea.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-8 mb-16 pb-16 border-b border-[#1a1816]/8"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  I will challenge it. If you're wrong, I'll tell you. If the evidence says stop, we stop. If it deserves building, we architect it.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  When execution gets difficult, I don't disappear. I guide. I show. I help build.
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]"
              >
                But I will not build your business
                <br />
                <span className="text-[#6b1f1f] font-semibold">for you.</span>
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] pt-16"
              >
                We architect it
                <br />
                <span className="text-[#6b1f1f] font-semibold">together.</span>
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            06: HUMAN SIDE / THE COST
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
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-16"
              >
                I know what it costs.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-6 mb-12 pb-12 border-b border-[#1a1816]/8"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  To leave stability for uncertainty. To go from salary, title, infrastructure and a system around you to realizing:
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]"
                >
                  "Everything is now on you."
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  I have actually stood on this side of the decision.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  And on the other side: freedom, creation, ownership, building something that belongs to you.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            FINAL TRANSITION: CASES
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
                className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] mb-16"
              >
                See what happens
                <br />
                when the architecture
                <br />
                meets reality.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Link href="/cases" className="inline-block">
                  <motion.button
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                    whileHover={{ x: 2 }}
                  >
                    Explore the cases →
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* Breathing room for future content */}
        <div className="h-24 md:h-32" />

      </div>
    </>
  );
}
