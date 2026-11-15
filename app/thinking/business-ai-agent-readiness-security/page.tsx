/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const linkClass =
  "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

// Spacing follows the other Thinking articles: tight inside a thought, wide between thoughts.
function P({ children, tight = false }: { children: React.ReactNode; tight?: boolean }) {
  return <p style={{ marginBottom: tight ? "1.75rem" : "3.5rem" }}>{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>
      {children}
    </h2>
  );
}

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/business-ai-agent-readiness-security";
  const articleTitle = "Is Your Business Ready for AI Agents? The Security Dilemma Nobody Expected";

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(articleUrl);

    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
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

      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* ARTICLE OPENING */}
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
                  Is Your Business Ready for AI Agents? The Security Dilemma Nobody Expected
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  AI agents are changing how businesses are discovered and evaluated. But what happens when the systems designed to protect your business prevent those agents from accessing it?
                </p>
              </div>

              <div className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-[#1a1816]/75">Martin Dubreuil | The Modern Business Architect™</p>
                  <p className="text-sm text-[#1a1816]/65"><time dateTime="2026-11-15">November 15, 2026</time></p>
                </div>
              </div>
            </motion.div>

          </div>
        </article>

        {/* ARTICLE BODY */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">

            <div
              className="prose prose-lg max-w-none"
              style={{ fontSize: "1.125rem", lineHeight: "1.8", color: "#1a1816" }}
            >

              <H2>Can AI agents actually access your business?</H2>

              <P>Recently, I started experimenting with an AI agent designed to evaluate how prepared online stores are for AI-assisted shopping.</P>

              <P>The objective was simple: visit a website, identify its products, retrieve information about pricing and availability, and assess whether an AI agent could understand and evaluate what the business offers.</P>

              <P tight>It seemed straightforward.</P>

              <P>Until the agent couldn't get in.</P>

              <P>The website was functioning perfectly. The products were available. The business was open.</P>

              <P tight>But the security system had decided that an automated visitor wasn't welcome.</P>

              <P>Which, technically speaking, is exactly what it was designed to do.</P>

              <P>For years, we've invested in protecting websites from bots. Firewalls, automated traffic detection, CAPTCHAs, and those wonderful little challenges where we have to identify every bicycle hiding in nine blurry photographs.</P>

              <P>Apparently, identifying bicycles is still one of humanity's essential qualifications for accessing the internet.</P>

              <P tight>The irony is that we're now building AI agents capable of recognizing those bicycles, researching products, comparing offers, and helping us make purchasing decisions.</P>

              <P>And some of our digital infrastructure is designed to keep those agents out.</P>

              <P>That creates an interesting question for business owners.</P>

              <P>
                <strong>Could the technology protecting your business also be limiting its ability to participate in the next generation of commerce?</strong>
              </P>

              <H2>Why do websites block AI agents?</H2>

              <P tight>Website security systems were developed to address legitimate threats.</P>

              <P>Malicious bots can attempt fraud, overwhelm infrastructure, collect sensitive information, or abuse online services. Businesses have every reason to protect themselves.</P>

              <P>The difficulty is that not all automated traffic has the same purpose.</P>

              <P>
                An AI crawler collecting information for model training is not necessarily performing the same activity as an AI assistant <Link href="/thinking/your-next-customer-might-not-visit-your-website" className={linkClass}>researching a product on behalf of a customer</Link>. Neither should automatically be treated like a malicious bot attempting to compromise a website.
              </P>

              <P>Yet distinguishing between these activities is not always straightforward.</P>

              <P>
                Companies such as Cloudflare are already developing more sophisticated approaches to <a href="https://developers.cloudflare.com/bots/concepts/bot/verified-bots/" target="_blank" rel="noopener noreferrer" className={linkClass}>identifying and managing different categories of automated traffic</a>, including legitimate AI agents.
              </P>

              <P>This matters because it demonstrates that the challenge is being recognized at the infrastructure level.</P>

              <P>But it doesn't mean business owners should simply wait for technology providers to solve everything.</P>

              <P>Website security is only one part of a much larger business architecture question.</P>

              <H2>What happens when an AI agent cannot access your online store?</H2>

              <P>Imagine a customer asking an AI assistant to find three pairs of running shoes in their size, within a specific budget, with good reviews and delivery before Friday.</P>

              <P>The assistant researches available products, compares options, and prepares recommendations.</P>

              <P>One retailer happens to offer exactly the right product at the best price.</P>

              <P>Unfortunately, the AI agent cannot retrieve the information it needs from that retailer's website.</P>

              <P tight>The store has successfully blocked an automated visitor.</P>

              <P tight>Congratulations. The security system works.</P>

              <P>The commercial outcome may be less impressive.</P>

              <P>Of course, blocking an agent does not automatically make a business invisible to AI. Products might still be discovered through search engines, structured product feeds, merchant integrations, or other accessible sources.</P>

              <P>Nor does allowing an agent into a website guarantee that it will recommend the business.</P>

              <P>But if an AI system cannot reliably discover, access, or understand your offer, that creates a potential disadvantage.</P>

              <P>And the problem goes beyond e-commerce.</P>

              <P>As AI agents become more capable of researching suppliers, comparing services, evaluating businesses, and supporting purchasing decisions, the accessibility and quality of business information may become increasingly important.</P>

              <P tight>The question is no longer simply whether your website works for human visitors.</P>

              <P>It's whether your business can also be understood by the systems those humans increasingly use.</P>

              <H2>Is AI readiness a technology problem or a business architecture problem?</H2>

              <P>This is where I believe many businesses risk looking at the problem from the wrong direction.</P>

              <P>They see a technical issue and immediately look for a technical solution.</P>

              <P>Should we change our firewall settings? Should we create an API? Should we improve our structured data? Should we allow certain AI crawlers?</P>

              <P tight>These may all be legitimate questions.</P>

              <P>But they come after a more fundamental one.</P>

              <P>
                <strong>How is the way customers discover, evaluate, and purchase from our business changing, and is our current business architecture prepared for it?</strong>
              </P>

              <P>A website is not an isolated technology asset. It is part of a larger system connecting customers, products, information, marketing, operations, security, and revenue.</P>

              <P>Changing one part of that system can affect the others.</P>

              <P>A security decision can influence discoverability. Poor product information can undermine recommendations. Inaccurate inventory data can make an otherwise attractive offer unreliable.</P>

              <P>And an excellent product can become commercially irrelevant to a particular purchasing journey if the systems supporting that journey cannot evaluate it.</P>

              <P tight>
                This is why <Link href="/answers/what-is-business-architecture" className={linkClass}>business architecture</Link> matters.
              </P>

              <P tight>Traditional optimization asks how to improve an existing process.</P>

              <P>Business architecture asks whether the overall system is still appropriate for the environment in which the business operates.</P>

              <P>Those are two very different questions.</P>

              <H2>How should businesses prepare for AI agents?</H2>

              <P>I wouldn't recommend that business owners suddenly remove their security protections or rebuild their websites because AI agents are becoming more capable.</P>

              <P>That would be a spectacularly bad interpretation of the problem.</P>

              <P>Instead, I would start with an investigation.</P>

              <P>Can AI systems discover your business through the channels they use? Can they retrieve accurate information about your products and services? Can they understand pricing, availability, delivery conditions, and other important details?</P>

              <P>Are legitimate automated visitors being blocked unnecessarily? Are there alternative ways for AI systems to access reliable information without compromising security?</P>

              <P>
                And perhaps most importantly, do you understand where your current architecture creates friction for <Link href="/thinking/your-next-customer-might-not-be-human" className={linkClass}>emerging customer behaviours</Link>?
              </P>

              <P>These are questions worth testing, not guessing about.</P>

              <P>A business may discover that its website security is perfectly appropriate and that its products are already accessible through other channels.</P>

              <P>Another may discover that critical information is missing, inconsistent, or inaccessible.</P>

              <P tight>The objective isn't to make every website accessible to every bot.</P>

              <P>It's to identify potential weaknesses before they become commercial problems.</P>

              <H2>Why business owners must think beyond today's systems</H2>

              <P>One of the most common mistakes in business is assuming that a system remains appropriate simply because it continues to function.</P>

              <P>A sales process may be efficient but designed for a disappearing customer journey. A distribution model may be profitable but increasingly vulnerable to new intermediaries. A website may perform beautifully for human visitors while being difficult for emerging AI systems to interpret.</P>

              <P tight>None of these systems is necessarily broken.</P>

              <P>That's what makes the problem interesting.</P>

              <P>
                <strong>A business can be operating exactly as designed and still be poorly designed for what comes next.</strong>
              </P>

              <P>
                <Link href="/thinking/anticipatory-business-architecture" className={linkClass}>Architecting a business for the future</Link> does not require predicting every technological development.
              </P>

              <P>It requires understanding the assumptions behind the current model, investigating how the environment is changing, and identifying which parts of the business may need to evolve.</P>

              <P>The arrival of AI agents creates new questions about security, discoverability, information accessibility, customer journeys, and commercial competitiveness.</P>

              <P tight>Some of those questions will be answered by technology providers.</P>

              <P>Others will require business owners to rethink how their organizations are structured and how they deliver value.</P>

              <P>And that responsibility cannot be delegated entirely to IT.</P>

              <H2>The real question: Is your business architecture ready to evolve?</H2>

              <P>My experiment began with a relatively simple objective: see whether an AI agent could evaluate an online store.</P>

              <P>It ended with a much more interesting observation.</P>

              <P tight>The security system wasn't malfunctioning.</P>

              <P>It was doing precisely what it had been designed to do.</P>

              <P>And that's the architectural dilemma.</P>

              <P>Businesses are built around assumptions about how customers behave, how information moves, how transactions happen, and how technology should support those activities.</P>

              <P>When those assumptions change, yesterday's good decisions can become tomorrow's limitations.</P>

              <P tight>The answer isn't to abandon what works.</P>

              <P>It's to investigate whether it will continue working under different conditions.</P>

              <P>
                <strong>Because protecting your business from threats and preparing your business for opportunities are not competing objectives.</strong>
              </P>

              <P>A well-architected business needs to do both.</P>

              <P>And if your next commercial opportunity happens to arrive through an AI agent, you might want something more sophisticated than a request to identify three bicycles before letting it in.</P>

            </div>

          </div>
        </section>

        {/* ARTICLE FOOTER */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto space-y-12">

            <nav aria-label="Related reading" className="space-y-4">
              <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related reading</p>
              <ul className="space-y-3 text-lg font-light">
                <li>
                  <Link href="/thinking/architecting-intelligence" className={linkClass}>Architecting Intelligence</Link>
                </li>
                <li>
                  <Link href="/answers/how-should-i-use-ai-in-my-business" className={linkClass}>How Should I Use AI in My Business?</Link>
                </li>
              </ul>
            </nav>

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
                  aria-label={`Copy link to ${articleTitle}`}
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                >
                  {copyFeedback ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-[#1a1816]/8 space-y-4">
              <Link href="/work" className="block">
                <span className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60">
                  Explore business architecture work →
                </span>
              </Link>
              <Link href="/martin" className="block">
                <span className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60">
                  About Martin Dubreuil →
                </span>
              </Link>
            </div>

          </div>
        </section>

        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
