/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const H2_STYLE = { fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" } as const;
const LINK_CLASS = "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

const COMPONENTS = [
  { name: "Who", text: "The situation they're in, not just the category they belong to. Separate the user, the buyer and the decision-maker." },
  { name: "Problem", text: "What they're experiencing, how often, how intensely, and what it already costs them." },
  { name: "Trigger", text: "Why they would act now rather than tolerate it for another year." },
  { name: "Mind", text: "What they believe, fear, want and doubt, and how that changes as they look for a solution." },
  { name: "Money", text: "Whether they can pay, and separately, whether they will." },
  { name: "Journey", text: "How they actually move from problem to outcome, including the loops and stalls." },
  { name: "Reach", text: "Where you can realistically find them and talk to them." },
  { name: "Outcome", text: "What they're ultimately trying to get, become, avoid or feel." },
  { name: "Not them", text: "Who looks similar but shouldn't be targeted." },
  { name: "Evidence", text: "Which of the above you know, and which you're assuming." },
];

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/how-do-i-define-my-ideal-customer-profile";

  const handleShare = (platform: string) => {
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
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">
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
                  How Do I Define My Ideal Customer Profile?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Define your ideal customer profile by understanding a situation, not inventing a person: who experiences the problem most strongly, why they would act now, whether they can and will pay, and how you can reach them. Then test what you think you know against evidence.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  The name, the age and the face come last.
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
                  <p className="text-sm text-[#1a1816]/65">September 24, 2026</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </article>

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

<h2 style={H2_STYLE}>Most ideal customer profiles describe the wrong things</h2>

<p style={{ marginBottom: "2.5rem" }}>The classic exercise starts with a person. She's 42, lives in London, drives an Audi, does yoga.</p>

<p style={{ marginBottom: "2.5rem" }}>None of that explains why she would buy anything from you.</p>

<p style={{ marginBottom: "2.5rem" }}>An ideal customer profile is only useful if it explains the commercial situation: the problem, the reason to act, the ability to pay and the route to reach them. Demographics belong in it when they change one of those things. Otherwise they're decoration.</p>

<p style={{ marginBottom: "3.5rem" }}>A fictional biography is not customer understanding.</p>

<h2 style={H2_STYLE}>What an ideal customer profile should include</h2>

<div className="not-prose my-8 border-t border-[#1a1816]/10">
  <dl>
    {COMPONENTS.map((c) => (
      <div key={c.name} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-1 md:gap-6 border-b border-[#1a1816]/10 py-4">
        <dt className="text-xs tracking-widest uppercase font-semibold text-[#6b1f1f] md:pt-1.5">{c.name}</dt>
        <dd className="text-base md:text-lg leading-relaxed text-[#1a1816]/85">{c.text}</dd>
      </div>
    ))}
  </dl>
</div>

<p style={{ marginBottom: "3.5rem" }}>If you can only answer three of these well, start with the problem, the trigger and the money. A customer with a real problem, a reason to move now and the ability to pay is worth far more than a detailed description of someone who has none of the three.</p>

<h2 style={H2_STYLE}>ICP, persona and target market are different things</h2>

<p style={{ marginBottom: "1.75rem" }}>A <strong>target market</strong> is the broad group you could sell to. It tells you where to look.</p>

<p style={{ marginBottom: "1.75rem" }}>An <strong>ideal customer profile</strong> defines the customers you're best placed to serve and most likely to succeed with. It tells you who to understand.</p>

<p style={{ marginBottom: "2.5rem" }}>A <strong>customer persona</strong>, avatar or buyer persona is one illustrative person who represents that profile. It makes the profile easier to write for.</p>

<p style={{ marginBottom: "3.5rem" }}>The persona should be the output of the profile, not the starting point.</p>

<h2 style={H2_STYLE}>How to test it</h2>

<p style={{ marginBottom: "2.5rem" }}>Treat your first ideal customer profile as a hypothesis, because that's what it is.</p>

<p style={{ marginBottom: "1.75rem" }}>Mark every statement as something you know from evidence or something you're assuming.</p>

<p style={{ marginBottom: "1.75rem" }}>Find the assumption that would hurt most if it were wrong. Usually it's the trigger, willingness to pay or reachability.</p>

<p style={{ marginBottom: "1.75rem" }}>Talk to people who match the profile about the last time the problem actually happened, and what they did about it.</p>

<p style={{ marginBottom: "2.5rem" }}>Then put a real offer at a real price in front of them.</p>

<p style={{ marginBottom: "3.5rem" }}>What people do tells you more than what they say, and what they pay for tells you more than what they praise.</p>

<h2 style={H2_STYLE}>The longer version</h2>

<p style={{ marginBottom: "2.5rem" }}>I've written a full guide on <Link href="/thinking/how-to-define-your-ideal-customer" className={LINK_CLASS}>how to define your ideal customer</Link>, covering the six questions behind a useful customer profile, why customer psychology changes along the journey, and who you should deliberately exclude.</p>

<p style={{ marginBottom: "3.5rem" }}>It includes a one-page Customer Architecture Map you can print, and an AI prompt that turns a completed map into a realistic persona without making your assumptions sound like facts.</p>

            </motion.div>
          </div>
        </section>

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-12"
            >
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

              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related</p>
                <div className="space-y-6">
                  {[
                    {
                      href: "/thinking/how-to-define-your-ideal-customer",
                      title: "How to Define Your Ideal Customer",
                      summary: "The full guide, with the Customer Architecture Map and two AI persona prompts.",
                    },
                    {
                      href: "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
                      title: "How Do I Know If My Business Idea Is Actually Viable?",
                      summary: "Customer, demand, willingness to pay, reachability and economics, tested with evidence.",
                    },
                    {
                      href: "/answers/what-is-business-architecture",
                      title: "What Is Business Architecture?",
                      summary: "How a business connects customer, offer, economics and execution into one coherent system.",
                    },
                  ].map((item, i) => (
                    <Link key={item.href} href={item.href} className="group block">
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="space-y-2"
                      >
                        <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#1a1816]/65 leading-relaxed">{item.summary}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>

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

        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
