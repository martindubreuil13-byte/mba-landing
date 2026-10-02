/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/your-next-customer-might-not-visit-your-website";
  const articleTitle = "Your Next Customer Might Not Visit Your Website";

  const handleShare = (platform: string) => {
    const text = `${articleTitle} — The Modern Business Architect`;
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedText = encodeURIComponent(text);

    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      copy: articleUrl,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(articleUrl);
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
            ARTICLE OPENING
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
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Business Architecture</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Your Next Customer Might Not Visit Your Website
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Their AI agent will.
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
                  <p className="text-sm text-[#1a1816]/65">October 2, 2026</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </article>

        {/* ============================================================
            ARTICLE BODY
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
                I spent a large part of my corporate career in retail.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Back then, e-commerce was the new thing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then websites became more important. Social media arrived. Mobile exploded.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                We talked about multichannel.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Then omnichannel.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The big question became:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How do we create one coherent customer experience across stores, websites, apps, social media and everything in between?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                I think we're about to add another channel.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And this one is very different.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <strong>AI agents.</strong>
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Increasingly, people can ask AI to research products, compare alternatives, shortlist suppliers and help them decide what to buy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Eventually, in many categories, the customer may not spend two hours browsing 14 websites.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Their agent will do part of that work for them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And here's where things get interesting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your AI customer doesn't give a shit about your beautiful homepage.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It doesn't get emotionally seduced by the lifestyle photograph you spent three weeks approving.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It wants information.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What exactly is the product?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much does it cost?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Is it available?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are the specifications?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are the conditions?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How does it compare?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Can the information be found, understood and trusted?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For 20 years, companies have been architecting digital experiences primarily for <strong>human eyes</strong>.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Now we also need to start architecting them for <strong>machine intelligence acting on behalf of those humans.</strong>
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That changes things.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Data architecture.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Product information.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Search.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Content.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                APIs.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Structured information.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Pricing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Availability.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Reviews.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Reputation.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Even the way a business describes what it actually sells.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And this is where large companies can get into trouble.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                I've sat in those boardrooms.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Something like this appears on a slide.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Interesting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Important.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But not urgent.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There are another 37 priorities.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So it gets pushed six months.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then another year.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Until one day the change is obvious, competitors have moved, customer behaviour has shifted and what could have been a relatively small architectural decision becomes a bloody transformation program.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That's Business Architecture to me.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not simply designing the business you need today.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Looking far enough ahead to ask:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>What is changing around us — and what needs to be re-architected before everybody else can see why?</strong>
              </p>

            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ARTICLE FOOTER
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
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

        {/* ============================================================
            FINAL CTA
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44">
          <div className="max-w-3xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
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

      </main>
    </>
  );
}
