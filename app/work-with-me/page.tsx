/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function WorkWithMePage() {
  return (
    <>
      <Navigation />

      {/* PAGE PADDING — Account for fixed navbar */}
      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            HERO
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-48">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Ways to Work Together</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-8">
                You don't need to know which service you need.
              </h1>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-6"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  Tell me where you are.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 max-w-2xl">
                  We'll figure out the right starting point.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 max-w-2xl">
                  Some people arrive with nothing more than the feeling that they should build something of their own. Others already have an idea. Some have built the product and discovered that a product is not yet a business. And some already know what needs to exist — they just need help architecting the route from here to there.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 max-w-2xl">
                  The work starts from where you actually are.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ENTRY STATE ORIENTATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-tight mb-16 max-w-3xl"
            >
              Where are you now?
            </motion.h2>

            <div className="max-w-3xl space-y-8 md:space-y-12">
              {[
                {
                  num: "01",
                  statement: "I want to build something of my own. I'm not sure what yet.",
                  service: "Exploration",
                },
                {
                  num: "02",
                  statement: "I have an idea. I don't know whether I should bet on it.",
                  service: "Pre-Architecture",
                },
                {
                  num: "03",
                  statement: "There's a business here. Now we need to architect it.",
                  service: "Business Architecture",
                },
                {
                  num: "04",
                  statement: "It's architected. Now I need help making it real.",
                  service: "Make It Exist",
                },
                {
                  num: "05",
                  statement: "I just need your brain on something.",
                  service: "Flash Advisory",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.05 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="pb-8 md:pb-12 border-b border-[#1a1816]/8"
                >
                  <p className="text-sm md:text-base text-[#1a1816]/50 mb-3">
                    {item.num}
                  </p>
                  <p className="text-xl md:text-2xl font-light leading-tight text-[#1a1816] mb-3">
                    "{item.statement}"
                  </p>
                  <p className="text-base md:text-lg text-[#6b1f1f] font-semibold">
                    {item.service}
                  </p>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* ============================================================
            EXPLORATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-16"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Exploration
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  For when entrepreneurship is becoming real — but the business isn't clear yet.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-8 md:space-y-12 border-t border-[#1a1816]/8 pt-12 md:pt-16"
              >
                <div>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    This is for experienced professionals who are seriously considering building something of their own but do not yet have a sufficiently defined opportunity to investigate.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mt-4">
                    We start with the entrepreneur before the enterprise.
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-sm text-[#1a1816]/60">
                    The first conversation looks at you: your ambition, experience, skills, assets, relationships, constraints, appetite for risk, financial reality and the kind of role and life you actually want to create.
                  </p>
                  <p className="text-sm text-[#1a1816]/60">
                    The second turns toward possibilities: the ideas, directions and opportunities that could make sense for you — and which of them deserve further investigation.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-lg md:text-xl font-light leading-tight mb-4">
                    Outcome
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    You leave with a clearer entrepreneurial direction and one or more opportunities worth investigating.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-sm text-[#1a1816]/60 mb-2">
                    Investment
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    Two sessions · <span className="font-semibold">US$390</span>
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            PRE-ARCHITECTURE
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-16"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Pre-Architecture
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Does this idea deserve to become a business?
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-8 md:space-y-12 border-t border-[#1a1816]/8 pt-12 md:pt-16"
              >
                <div>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    Ideas are cheap. Commitment is expensive.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mt-4">
                    Pre-Architecture is where we investigate an idea before you commit serious time, money or identity to building it.
                  </p>
                </div>

                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    This is not a report commissioned from the sidelines. We work through the idea together — examining assumptions, customer reality, contradictory evidence, the size of the opportunity, purchase behaviour and whether the basic economics make sense.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    Where evidence is missing, we identify what needs to be learned and test what can reasonably be tested.
                  </p>
                </div>

                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    The objective is not to prove that your idea is good. It is to make a better decision.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-[#1a1816]/60">
                    Core areas may include:
                  </p>
                  <ul className="text-sm text-[#1a1816]/60 space-y-2">
                    <li className="list-disc list-inside">Your reason to move — and the inertia working against it</li>
                    <li className="list-disc list-inside">Customer reality</li>
                    <li className="list-disc list-inside">Field evidence</li>
                    <li className="list-disc list-inside">The size of the prize</li>
                    <li className="list-disc list-inside">Purchase reality</li>
                    <li className="list-disc list-inside">Napkin economics</li>
                  </ul>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-lg md:text-xl font-light leading-tight mb-4">
                    Outcome
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-6">
                    The work ends with one of three decisions:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-lg mb-2">PROCEED</p>
                      <p className="text-sm text-[#1a1816]/60">There is enough evidence to justify moving into Business Architecture.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">EVOLVE</p>
                      <p className="text-sm text-[#1a1816]/60">Something may be there, but the idea needs to change before further commitment makes sense.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">STOP</p>
                      <p className="text-sm text-[#1a1816]/60">The evidence does not justify continuing. Stopping can be a successful outcome. The purpose is not to protect the idea. It is to protect the entrepreneur from unnecessary commitment.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-sm text-[#1a1816]/60 mb-2">
                    Investment
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    Typically 3–5 weeks · <span className="font-semibold">US$1,990</span>
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            BUSINESS ARCHITECTURE
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-16"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Business Architecture
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  What exactly should we build — and how should the business work?
                </p>
                <p className="text-sm text-[#1a1816]/60 mt-4">
                  <Link href="/answers/what-is-business-architecture" className="hover:text-[#1a1816] transition-colors border-b border-[#1a1816]/60 hover:border-[#1a1816]">
                    Learn what Business Architecture means →
                  </Link>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-8 md:space-y-12 border-t border-[#1a1816]/8 pt-12 md:pt-16"
              >
                <div>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    Once there is sufficient reason to believe a business should exist, we architect it.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mt-4">
                    Business Architecture turns evidence and entrepreneurial intent into a coherent business and a credible route to build it.
                  </p>
                </div>

                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    This is not a business plan written about a hypothetical future. We make the important choices, connect the pieces and expose contradictions before those contradictions become expensive.
                  </p>
                </div>

                <div>
                  <p className="text-base md:text-lg font-light leading-relaxed text-[#1a1816] mb-6">
                    The architecture works across five connected areas:
                  </p>
                  <div className="space-y-6">
                    <div>
                      <p className="font-semibold text-lg mb-2">Offer & Customer</p>
                      <p className="text-sm text-[#1a1816]/60">What are we actually offering, to whom, and what are they really buying?</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">Value & Delivery</p>
                      <p className="text-sm text-[#1a1816]/60">How does the business create and deliver that value in reality?</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">Go-to-Market</p>
                      <p className="text-sm text-[#1a1816]/60">How will the right people discover, understand, trust and buy it?</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">Financial Model</p>
                      <p className="text-sm text-[#1a1816]/60">Can the economics support the business we are designing?</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">MVP & First Customers</p>
                      <p className="text-sm text-[#1a1816]/60">What is the smallest credible version we can put into reality to create value, learn and generate evidence?</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    These are not five isolated consulting modules. They are one architecture. A decision in one area changes the others. That is the point.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-lg md:text-xl font-light leading-tight mb-4">
                    Outcome
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-6">
                    You leave with two primary things:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-lg mb-2">A coherent Business Architecture</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-2">A Reverse-Engineered Roadmap</p>
                      <p className="text-sm text-[#1a1816]/60">The roadmap starts with the business we intend to create and works backwards through the milestones, dependencies and decisions required to get from there to where you are today.</p>
                    </div>
                  </div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mt-6">
                    The objective is not another document sitting in a folder. It is knowing what should exist, why it should exist, and what happens next.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-sm text-[#1a1816]/60 mb-2">
                    Investment
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    Typically 6–8 weeks · <span className="font-semibold">US$5,990</span>
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            MAKE IT EXIST
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-16"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Make It Exist
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Architecture is useful only if something eventually exists.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-8 md:space-y-12 border-t border-[#1a1816]/8 pt-12 md:pt-16"
              >
                <div>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    Once the architecture and roadmap are clear, you may choose to execute independently.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mt-4">
                    Or I can stay involved.
                  </p>
                </div>

                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    That involvement depends on what the business actually needs. It may include ongoing advisory, direct involvement in selected pieces of execution, working alongside you or your team, coordinating specialist capabilities, using AI where it creates meaningful leverage, or some combination of these.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    This is deliberately not packaged in advance. The architecture tells us what needs to be built. Only then does it make sense to decide how I should be involved in building it.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-lg md:text-xl font-light leading-tight mb-4">
                    Outcome
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    Move from architecture into disciplined execution without losing the logic that shaped the business in the first place.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-sm text-[#1a1816]/60 mb-2">
                    Investment
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    Scoped around the work required
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            FLASH ADVISORY
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-16"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Flash Advisory
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Sometimes you don't need an architecture engagement. You need a useful hour.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-8 md:space-y-12 border-t border-[#1a1816]/8 pt-12 md:pt-16"
              >
                <div>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]">
                    Flash Advisory is for a specific business question, decision, problem or opportunity where concentrated outside thinking can help.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mt-4">
                    Bring the problem. We work on the problem. No programme. No artificial journey designed to turn one conversation into six months of consulting.
                  </p>
                </div>

                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    If the problem reveals something bigger, we can discuss it. If it doesn't, we solved what we came to solve.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-lg md:text-xl font-light leading-tight mb-4">
                    Outcome
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    Focused thinking, challenge and practical direction around the issue you brought into the room.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-sm text-[#1a1816]/60 mb-2">
                    Investment
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    Approximately 60 minutes · <span className="font-semibold">US$250</span>
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            THE FIRST CONVERSATION
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-16"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  The first conversation
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Let's see if we should work together.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-8 md:space-y-12 border-t border-[#1a1816]/8 pt-12 md:pt-16"
              >
                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    I keep the practice deliberately small.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    The first conversation is not free consulting and it is not a miniature version of Pre-Architecture. It is simply a conversation about where you are, what you are trying to do, whether I can materially help, and whether we are a good fit to work together.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70 mb-4">
                    You do not need to diagnose yourself before we speak. You do not need to choose a package. You do not need to arrive with a polished pitch deck or a 52-page business plan.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
                    Come with the situation as it actually is. We'll work out the right starting point from there.
                  </p>
                </div>

                <div className="border-t border-[#1a1816]/8 pt-12">
                  <p className="text-sm text-[#1a1816]/60 mb-2">
                    Price
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    Fit conversation · <span className="font-semibold">Free</span>
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ============================================================
            FINAL CTA
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-48 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                There's an idea.
              </h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816] mb-12"
              >
                Somewhere inside it, there may be a business.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70 mb-12"
              >
                Together, we find it, architect it, and make it exist.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <Link href="/lets-talk">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer inline-block"
                    whileHover={{ x: 3 }}
                  >
                    Let's talk about your idea →
                  </motion.span>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-sm text-[#1a1816]/50"
              >
                No pitch required. Just tell me where you are.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* Breathing room */}
        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
