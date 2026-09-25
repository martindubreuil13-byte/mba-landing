/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const SIGNS = [
  "You're willing to be wrong.",
  "You want evidence, not reassurance.",
  "You'll change the idea if reality says so.",
  "You're ready to talk to real customers.",
  "You're willing to look at the numbers.",
  "You know a product isn't automatically a business.",
  "You're prepared to invest time before wasting money.",
  "You'll make decisions instead of researching forever.",
  "You're willing to do the work.",
  "You want to build something real — not just talk about it.",
];

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/the-10-signs-youre-serious-about-starting-a-business";
  const answerTitle = "The 10 Signs You're Serious About Starting a Business";

  const handleShare = (platform: string) => {
    const text = `${answerTitle} — The Modern Business Architect`;
    const encodedUrl = encodeURIComponent(answerUrl);

    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      copy: answerUrl,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(answerUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } else if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <>
      <Navigation />

      {/* PAGE PADDING */}
      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            ANSWER OPENING
        */}

        <article className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-3xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-8"
            >
              <div>
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Answer</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  The 10 Signs You're Serious About Starting a Business
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Having an idea is easy. Wanting to be an entrepreneur is easy.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  Turning that desire into a real business — one that exists, finds customers and makes money — is something else entirely.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-[#1a1816]/75">Martin Dubreuil</p>
                  <p className="text-sm text-[#1a1816]/65">September 22, 2026</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </article>

        {/* ============================================================
            ANSWER BODY
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="prose prose-lg max-w-none"
              style={{
                fontSize: "1.125rem",
                lineHeight: "1.8",
                color: "#1a1816",
              }}
            >

              <p style={{ marginBottom: "3.5rem" }}>
                So how do you know you're actually ready?
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>10 signs you're ready</h2>

              {/* Numbered signs — scannable, single sentence each */}
              <ol className="not-prose list-none m-0 p-0 my-4 border-t border-b border-[#1a1816]/10 divide-y divide-[#1a1816]/8">
                {SIGNS.map((sign, index) => (
                  <motion.li
                    key={sign}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.03 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex items-baseline gap-5 md:gap-6 py-5 md:py-6"
                  >
                    <span
                      className="text-xl md:text-2xl font-light text-[#6b1f1f] shrink-0 w-8 md:w-10 tabular-nums"
                      style={{ fontFamily: "Georgia, serif" }}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-lg md:text-xl font-light leading-snug text-[#1a1816]">
                      {sign}
                    </p>
                  </motion.li>
                ))}
              </ol>

              <p style={{ marginTop: "3rem", marginBottom: "1.75rem" }}>
                You don't need an MBA.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You don't need a perfect idea.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You don't need a fifty-page business plan.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And you certainly don't need to have all the answers.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You need to be willing to find the answers that matter.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                If you want a more structured way to pressure-test where you actually stand, I built{" "}
                <Link href="/resources/business-idea-reality-check" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  the Business Idea Reality Check
                </Link>{" "}
                — thirteen questions, four to six minutes, no right answers.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>This is where Business Architecture comes in</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                A business doesn't appear because you had a good idea.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It has to be discovered, challenged, designed, built and exposed to reality.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I call that discipline Business Architecture. Rather than treating the customer, product, offer, pricing, economics, go-to-market and execution as separate problems, it connects those decisions into one system. If you want the fuller explanation, I lay out{" "}
                <Link href="/answers/what-is-business-architecture" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  what Business Architecture actually is
                </Link>{" "}
                separately — and what{" "}
                <Link href="/answers/what-does-a-business-architect-do" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  a Business Architect actually does
                </Link>.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The objective is simple: turn an idea, an opportunity or an existing product into a coherent business that can meet reality.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The Business Architect's FRAME</h2>

              <p style={{ marginBottom: "3.5rem" }}>
                The practical method I use for moving from entrepreneurial intention toward a real business is what I call{" "}
                <Link href="/thinking/the-business-architects-frame" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  The Business Architect's FRAME
                </Link>.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                FRAME stands for Find, Reality-Test, Architect, Make, Evolve.
              </p>

              <p style={{ marginBottom: "1.25rem" }}>
                <strong>F — FIND</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Find what we're really dealing with. That may mean{" "}
                <Link href="/answers/how-do-i-find-a-business-idea" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  finding the right business idea
                </Link>, defining an existing idea properly, identifying the real problem and customer, or discovering the business opportunity hidden inside something that's already been built.
              </p>

              <p style={{ marginBottom: "1.25rem" }}>
                <strong>R — REALITY-TEST</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Put the idea on trial. Challenge assumptions. Look for evidence. Understand the customer, the market, willingness to pay and the basic economics. The objective isn't to prove the founder right. It's to find out what reality agrees with.
              </p>

              <p style={{ marginBottom: "1.25rem" }}>
                <strong>A — ARCHITECT</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Design how the business works. Connect the customer, offer, pricing, economics, value delivery, positioning, go-to-market, product, resources and execution into one coherent system.
              </p>

              <p style={{ marginBottom: "1.25rem" }}>
                <strong>M — MAKE</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Move from architecture into reality. Build the smallest credible version. Put it in front of customers. Make an offer. Generate transactions, behaviour and evidence. Planning eventually has to meet the market.
              </p>

              <p style={{ marginBottom: "1.25rem" }}>
                <strong>E — EVOLVE</strong>
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Listen to what reality tells us. Keep what works. Change what doesn't. Learn from customers and evidence. Then FRAME the next move.
              </p>

              <p style={{ marginBottom: "0.5rem" }}>
                Find it.
              </p>

              <p style={{ marginBottom: "0.5rem" }}>
                Reality-test it.
              </p>

              <p style={{ marginBottom: "0.5rem" }}>
                Architect it.
              </p>

              <p style={{ marginBottom: "0.5rem" }}>
                Make it exist.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Evolve it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's Business Architecture in practice.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>If you're serious</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                If you're serious about building a business, you don't need to arrive with all the answers.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You do need to be willing to question some of yours.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                If that sounds like where you are,{" "}
                <Link href="/lets-talk" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  let's talk about your idea
                </Link>.
              </p>

            </motion.div>

          </div>
        </section>

        {/* ============================================================
            SHARING & ACTIONS
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8">
          <div className="max-w-3xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-12"
            >
              {/* Share Section */}
              <div className="space-y-4">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Share</p>
                <div className="flex flex-wrap gap-6">
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare("facebook")}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  >
                    {copyFeedback ? "Copied" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* Related */}
              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related</p>

                <div className="space-y-6">
                  <Link href="/answers/what-is-business-architecture" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        What Is Business Architecture?
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        How a business connects customer, offer, economics and execution into one coherent system.
                      </p>
                    </motion.div>
                  </Link>

                  <Link href="/answers/what-does-a-business-architect-do" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        What Does a Business Architect Do?
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        How a Business Architect works from entrepreneur and idea through architecture and execution.
                      </p>
                    </motion.div>
                  </Link>

                  <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        How Do I Know If My Business Idea Is Actually Viable?
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Learn how to test whether a business idea is viable using evidence, customer demand, willingness to pay, reachability and basic business economics.
                      </p>
                    </motion.div>
                  </Link>

                  <Link href="/thinking/the-business-architects-frame" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        The Business Architect's FRAME™
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        The five-question methodology for turning an idea into a business that can exist, learn and evolve.
                      </p>
                    </motion.div>
                  </Link>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="pt-8 border-t border-[#1a1816]/8 space-y-4">
                <Link href="/work" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    Explore business architecture work →
                  </motion.span>
                </Link>
                <Link href="/work-with-me" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    Explore ways to work together →
                  </motion.span>
                </Link>
                <Link href="/martin" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    About Martin Dubreuil →
                  </motion.span>
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Breathing room */}
        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
