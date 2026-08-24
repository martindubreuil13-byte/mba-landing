/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function CasesPage() {
  const cases = [
    {
      number: "01",
      outcome: "KILL IT",
      slug: "kill-it",
      situation: "A business model that had already worked in another market.",
      tension: "The assumption was that it could be introduced here.",
      discovery: "Market structure and economics changed the answer.",
      keyline: "The opportunity did not survive scrutiny.",
    },
    {
      number: "02",
      outcome: "FIND IT",
      slug: "find-it",
      situation: "A large Asian retailer examining international expansion opportunities across Southeast Asia.",
      tension: "Several markets were obvious candidates. One had received considerably less attention.",
      discovery: "An initially overlooked market became a credible expansion opportunity supported by evidence.",
      keyline: "Sometimes the opportunity is sitting somewhere everyone else walked past.",
    },
    {
      number: "03",
      outcome: "VALIDATE IT",
      slug: "validate-it",
      situation: "An entrepreneur with a product idea wanted to create an import business from Vietnam to Canada.",
      tension: "The obvious reaction was to teach him how to import. We asked a different question first: should he?",
      discovery: "The idea survived validation. The economics supported a business. The architecture was developed.",
      keyline: "First determine whether there is a business. Then earn the right to build it.",
    },
    {
      number: "04",
      outcome: "EVOLVE IT",
      slug: "evolve-it",
      situation: "An entrepreneur carried an unusually ambitious vision for several years but couldn't translate it into something testable.",
      tension: "The first route failed. The lesson was not that the vision was wrong, but that the first move was.",
      discovery: "The ambition survived. The architecture changed. A narrower first business emerged that could move toward the larger vision.",
      keyline: "You don't need to shrink the ambition. You need to shrink the first move.",
    },
    {
      number: "05",
      outcome: "CREATE IT",
      slug: "create-it",
      situation: "An investor was considering land acquisition and wanted to become an entrepreneur. There was no business idea, just an asset and ambition.",
      tension: "Research and market work supported the concept. Architecture exposed a critical location-specific constraint that threatened the project viability.",
      discovery: "The property was rejected. But the business concept was not. The investigation had separated the opportunity from the original asset.",
      keyline: "We killed the property. Not the business. Sometimes the thing you start with isn't the business. It's simply how you discover it.",
    },
  ];

  return (
    <>
      <Navigation />

      {/* PAGE PADDING — Account for fixed navbar */}
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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Cases</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                Not every good outcome
                <br />
                ends with a business.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  Sometimes the right business gets built.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  Sometimes it changes.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  Sometimes we discover a different opportunity.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 max-w-2xl">
                  And sometimes the smartest thing we do is kill it.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CREDIBILITY BLOCK
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl space-y-8"
            >
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                These are real cases.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                Real businesses. Real decisions. Real work.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                Some required pre-architecture. Some business architecture. Some execution.
              </p>

              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                Details have been anonymized and, where necessary, simplified to protect confidentiality.
              </p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            TRANSITION — FIVE SITUATIONS CHAPTER
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-16 md:space-y-24"
            >
              {/* Opening statement */}
              <div className="max-w-3xl">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Five situations.
                </h2>
                <p className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816]">
                  Five different answers.
                </p>
              </div>

              {/* Outcomes — linear sequence desktop, stacked mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {/* Desktop: horizontal sequence */}
                <div className="hidden md:flex gap-6 md:gap-8">
                  <div className="flex items-center gap-6 md:gap-8">
                    <p className="text-lg md:text-xl font-light text-[#6b1f1f] whitespace-nowrap">KILL IT.</p>
                    <div className="h-6 w-px bg-[#1a1816]/20" />
                    <p className="text-lg md:text-xl font-light text-[#1a1816] whitespace-nowrap">FIND IT.</p>
                    <div className="h-6 w-px bg-[#1a1816]/20" />
                    <p className="text-lg md:text-xl font-light text-[#6b1f1f] whitespace-nowrap">VALIDATE IT.</p>
                    <div className="h-6 w-px bg-[#1a1816]/20" />
                    <p className="text-lg md:text-xl font-light text-[#1a1816] whitespace-nowrap">EVOLVE IT.</p>
                    <div className="h-6 w-px bg-[#1a1816]/20" />
                    <p className="text-lg md:text-xl font-light text-[#6b1f1f] whitespace-nowrap">CREATE IT.</p>
                  </div>
                </div>

                {/* Mobile: vertical sequence */}
                <div className="md:hidden space-y-4">
                  <div className="flex items-center gap-4">
                    <p className="text-base font-light text-[#6b1f1f]">KILL IT.</p>
                    <div className="flex-1 h-px bg-[#1a1816]/20" />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-base font-light text-[#1a1816]">FIND IT.</p>
                    <div className="flex-1 h-px bg-[#1a1816]/20" />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-base font-light text-[#6b1f1f]">VALIDATE IT.</p>
                    <div className="flex-1 h-px bg-[#1a1816]/20" />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-base font-light text-[#1a1816]">EVOLVE IT.</p>
                    <div className="flex-1 h-px bg-[#1a1816]/20" />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-base font-light text-[#6b1f1f]">CREATE IT.</p>
                    <div className="flex-1 h-px bg-[#1a1816]/20" />
                  </div>
                </div>
              </motion.div>

              {/* Principle statement */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60 pt-12 border-t border-[#1a1816]/8 max-w-2xl"
              >
                Same architect. Different situations. Different answers.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CASE CHAPTERS
        */}

        {cases.map((caseItem) => (
          <section key={caseItem.slug} className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
            <div className="max-w-6xl">

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                {/* Left column — case number and outcome */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="md:col-span-4"
                >
                  <p className="text-6xl md:text-7xl lg:text-8xl font-light text-[#1a1816]/10 leading-none mb-8">
                    {caseItem.number}
                  </p>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#6b1f1f] tracking-tight">
                    {caseItem.outcome}
                  </h2>
                </motion.div>

                {/* Right column — case details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="md:col-span-8 space-y-8"
                >
                  {/* Situation */}
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-3">Situation</p>
                    <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                      {caseItem.situation}
                    </p>
                  </div>

                  {/* Tension */}
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-3">The Tension</p>
                    <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                      {caseItem.tension}
                    </p>
                  </div>

                  {/* Discovery */}
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-medium mb-3">Discovery</p>
                    <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                      {caseItem.discovery}
                    </p>
                  </div>

                  {/* Key line */}
                  <div className="pt-8 border-t border-[#1a1816]/8">
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      viewport={{ once: true }}
                      className="text-lg md:text-xl leading-relaxed text-[#1a1816] font-light"
                    >
                      {caseItem.keyline}
                    </motion.p>
                  </div>

                  {/* CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="pt-8"
                  >
                    <Link href={`/cases/${caseItem.slug}`} className="inline-block">
                      <motion.button
                        className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                        whileHover={{ x: 2 }}
                      >
                        Read the case →
                      </motion.button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>

            </div>
          </section>
        ))}

        {/* ============================================================
            CLOSING ARGUMENT
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-20 md:mb-28">
                The answer isn't always yes.
              </h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-12 md:space-y-16"
              >
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#6b1f1f]">
                  That's the point.
                </h3>

                <div className="space-y-6">
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    Ideas don't need someone to agree with them.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    They need someone willing to find out what reality thinks.
                  </p>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-lg md:text-xl leading-relaxed text-[#1a1816] pt-8 border-t border-[#1a1816]/8"
                >
                  Build it. Change it. Find something better. Or walk away before the mistake gets expensive.
                </motion.p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            TRANSITION TO CONVERSATION
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
