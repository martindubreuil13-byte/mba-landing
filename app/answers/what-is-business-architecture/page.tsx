/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/what-is-business-architecture";
  const answerTitle = "What Is Business Architecture?";

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
                  What Is Business Architecture?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Business Architecture is the work of designing how a business should actually work before its parts are built, marketed or scaled independently.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  For an entrepreneur, that means connecting the customer, offer, pricing, economics, delivery, acquisition, operations and execution into one coherent business.
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
                  <p className="text-sm text-[#1a1816]/65">August 26, 2026</p>
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

              <p style={{ marginBottom: "1.75rem" }}>
                A business is not a website.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is not an app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is not a logo.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is not a business plan.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And it is not a collection of marketing tactics held together by optimism.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A business is a system.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Business Architecture works out how that system should fit together.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What does that mean in practice?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Imagine someone has an idea for a new product.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                They could immediately build the website, develop the product, create a brand and start advertising.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That feels like progress.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But several important questions still exist.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who is the customer?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What problem matters enough for them to act?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What exactly are they buying?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why would they choose this offer?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What will they pay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can they be reached economically?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How will the value be delivered?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Will enough money remain after the costs are counted?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What has to happen first?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What should wait?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Those questions are connected.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Change the customer and the offer may change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Change the offer and pricing may change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Change pricing and the economics may change.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Change the delivery model and operations may change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is why I think of a business as architecture rather than a collection of tasks.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Isn't Business Architecture already an established discipline?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Yes.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Business Architecture already exists as a professional discipline, particularly inside established organizations.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It is often used to understand or design things such as business capabilities, operating models, value streams, organizational structures and how strategy becomes execution.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I use the same basic architectural idea in a different context:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                entrepreneurship and business creation.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The starting question is different.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Traditional Business Architecture often begins with:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>
                How should this existing organization work or change?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Entrepreneurial Business Architecture begins earlier:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>
                What business should exist in the first place?
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>
                And then: How should that business work?
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Business Architecture for entrepreneurs</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                With entrepreneurs, I see the work in five connected stages.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>Founder Architecture</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What kind of business makes sense for this entrepreneur?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>Business Idea Architecture</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Can the idea actually become a business?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>Business Architecture</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                How should the business work?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>Execution Architecture</strong>
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                How do we make it exist?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>Success Architecture</strong>
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Is it working, and what needs to change?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The words are simple because the thinking underneath them is complicated enough already.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Why does this matter now?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Because building has become incredibly easy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can help create:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                apps
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                websites
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                research
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                financial models
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                business plans
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                branding
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                content
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                code
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                prototypes
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes in hours.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That is useful.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But faster building does not remove the need for judgment.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It makes judgment more important.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                If you can build the wrong thing five times faster, congratulations.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You are now five times faster in the wrong direction.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Business Architecture slows down the expensive mistakes without slowing down useful action.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The objective is not endless planning.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The objective is to understand enough of the business to make the next move intelligently.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What is the difference between Business Architecture and a business plan?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                A business plan describes what you expect the business to do.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Business Architecture works out how the parts of the business need to fit together for that expectation to have a chance of becoming real.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A plan can say:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                "We will acquire customers through digital marketing."
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Architecture asks:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Which customers?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Where are they?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why will they care?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What will acquisition cost?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are they buying?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At what price?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What conversion rate would make the economics work?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What needs to be proven before spending heavily?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The plan records the intention.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The architecture tests and connects the logic underneath it.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What is the difference between a Business Architect, a consultant and a coach?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                The boundaries can overlap.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A coach may help the entrepreneur think and act.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A consultant may bring expertise and recommend what to do.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A Business Architect looks across the connected business and asks:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                What should exist, how should it work, and what needs to happen next?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                In my own work, that sometimes includes coaching.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes consulting.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes practical execution support.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The category matters less than the outcome: a business that makes sense as a system and can survive contact with reality.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A simple way to think about it</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Business Architecture answers three practical questions:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can this become a business?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How should that business work?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                How do we make it exist?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That is the simplest explanation I know.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And if those answers change when customers, economics or reality give us new evidence? Good. Architecture should change too.
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

              {/* Related THINKING */}
              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related Thinking</p>

                <div className="space-y-6">
                  <Link href="/thinking/your-business-idea-is-worth-nothing" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        Your Business Idea Is Worth Nothing
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Why an idea needs evidence before it deserves greater commitment.
                      </p>
                    </motion.div>
                  </Link>

                  <Link href="/thinking/an-app-is-not-a-business" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        An App Is Not a Business
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Why the product is only one part of the business around it.
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
