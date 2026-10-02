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

              <p style={{ marginBottom: "1.75rem" }}>
                Here is the simple version.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                People can increasingly ask an AI assistant to research a product, compare the alternatives and recommend what to buy. If that becomes normal, some businesses will be looked at by a machine before they are ever looked at by a person.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And when a machine is interpreting your business on someone else's behalf, it needs something different from a person browsing your website. It has to work out what you sell, what it costs, whether you have it and whether it can believe you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That reaches well beyond the website. It touches how products are described, where prices and stock levels live, what the policies say, and whether all of it agrees with itself.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                I have seen a change like this before. I spent a large part of my corporate career in retail, through the shift from stores to e-commerce, then websites, mobile, social, multichannel and omnichannel. This article is about what that experience suggests for the next shift, while it is still a question rather than an emergency. I don't know how fast it will arrive or what shape it will take. That is rather the point.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>I've seen this movie before</h2>

              <p style={{ marginBottom: "3.5rem" }}>
                Back then, e-commerce was the new thing. Then websites became more important, social media arrived and mobile exploded. We talked about multichannel, then omnichannel.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is tempting to tell that story as retailers learning to build websites. That was never the hard part.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The hard part started when customers began moving between channels as if they were one thing. They looked at something online, checked it in a store, ordered on a phone and returned it somewhere else. And they expected the business behind all of that to behave like one business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Most could not. They had grown up as separate things, stores, e-commerce, marketing, logistics and technology, each with its own systems, targets and version of the truth. Inventory, pricing, customer information, returns and fulfillment worked well inside each channel. Nobody had designed them to work across all of them.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The customer never asked for a better data architecture. They just noticed when it was missing.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The new channel was not the real change. The real change was what it did to the relationships inside the business. The business had to be rebuilt around how customers actually behaved, not around how the org chart happened to be drawn.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The next channel isn't another screen</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Now imagine a customer saying something like this to an AI agent:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Find me the best option for this. My budget is that. These things matter to me. I need it by Friday. Compare the alternatives and tell me what you'd choose."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Two hours across 14 websites could become a conversation, with part of the research and shortlisting done by something other than the human.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                I don't know how far this goes. How much people will trust agents, and whether they will ever hand over the purchase itself, is still being worked out. Anyone who claims to know is guessing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But let's be precise about one thing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <strong>The AI agent is not the customer.</strong>
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The human remains the customer. They still have the need, the budget, the taste and the final say. The agent is an intermediary, acting on their behalf.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The customer hasn't changed. The intermediary has.</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                For a long time, businesses have spoken to human customers more or less directly: through stores, advertising, salespeople, websites, apps and marketplaces. Even where intermediaries existed, the person was the one reading, comparing and deciding.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An agent can add an intelligent layer between demand and supply. It does not just show a person a list of options. It reads them, weighs them against a brief and comes back with a view.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So ask what changes when the first thing to evaluate your product, your price, your reputation and your availability may not be a person.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A person can be distracted, charmed or hurried. An agent working to a brief is doing a different job, and if you don't make the shortlist you may never know you were considered.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The customer is still human. But the path between the customer and the business is changing — and whatever sits in the middle increasingly matters.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your beautiful homepage may be answering the wrong question</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Design still matters. Brand still matters. Humans choose based on trust, preference, identity, aspiration, aesthetics and emotion, and they will keep doing so. An agent acting for a human may well take those preferences into account too.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The argument is narrower than that. <strong>Businesses may no longer be able to rely on presentation alone.</strong>
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your homepage is very good at persuading someone who is looking at the lifestyle photograph you spent three weeks approving. An agent comparing options needs information it can find, interpret, compare and trust.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What exactly is the product, and what does it cost? Is it available? What are the specifications, and who is it for? What are the conditions and limitations? What is the return policy, and when can it be delivered? What evidence supports the claims? How does it compare?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                If the answers are scattered, contradictory or missing, there is not much for an agent to work with. It is unlikely to be charmed into filling in the gaps.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The machine-readable business</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                For years, businesses have asked: can customers understand us? Increasingly, they may also need to ask:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <strong>Can machines understand us well enough to represent us accurately to customers?</strong>
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The word that matters is accurately. If a machine cannot find a clear answer from you, it may use whatever else it can find: a marketplace listing, an old review, a competitor's comparison table. Or it may move on to a business that is easier to read.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Being machine-readable means product information, pricing, availability and inventory; specifications, delivery, policies and terms; reviews, reputation and evidence; structured data and APIs; service descriptions that say something specific rather than aspirational. And all of it findable.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                None of that is glamorous. Most of it already lives somewhere in your business, in systems built for other purposes and owned by different people.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <strong>The information underneath the experience becomes part of the experience.</strong>
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                We spent the last 20 years architecting digital businesses to be understood by humans. The next 20 may require them to be understood by humans and machines.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>This isn't a website problem</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Imagine a retailer. This one is invented, but I suspect you will recognize pieces of it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The website says a product costs $129. A marketplace feed says $119. Store inventory is 24 hours behind. The return policy is buried in a PDF. The marketing description makes claims the underlying product information does not clearly support. And the delivery information depends on where you look.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A human can tolerate some of this. They spot the discrepancy, call someone, or make an assumption and hope for the best.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                An agent comparing dozens of alternatives may behave differently. It might take the lowest price at face value. It might treat the inconsistency as a reason to trust you less. It might skip you for a business whose information agrees with itself. I don't know which, and neither does the retailer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The tempting question is: how do we optimize our website for AI? Reasonable, but the wrong place to start, because the website is only where the mess becomes visible.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Each of those inconsistencies has a different cause and a different owner. So the problem touches data architecture, product architecture, pricing, inventory, operations, fulfillment, policy, customer experience, reputation, technology, governance and ownership.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Who owns the fact that this product costs $129? In a lot of businesses, the honest answer is several people, which means nobody.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That is why this is a Business Architecture question, not a website question. It is the omnichannel lesson again: the mess was always there, and a new participant makes it visible.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Why established companies get caught</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                I've worked inside large organizations. The problem isn't that the people running them are stupid. Usually, the opposite is true.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The problem is structural. A company is architected around its current operating model. Budgets, KPIs, ownership, technology, incentives and priorities are all designed around how the business works today. That is what makes it work. It is also what makes a change that crosses several functions so hard to own: it belongs clearly to none of them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                I've sat in those boardrooms. Someone spots it, and it appears on a slide.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Interesting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Important.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But not urgent.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                There are another 31 priorities.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So it gets pushed six months.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Then another year.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Until one day the change is obvious, competitors have moved, customer behavior has shifted and what could have been handled through a series of relatively small architectural decisions becomes a bloody transformation program.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Nobody in that room was being foolish. Each decision was reasonable on its own. The sum of them was not.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Individually sensible decisions can add up to an incoherent system, and nobody's job was to look at the sum.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Retail is only the obvious example</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Retail makes this easy to see, but it is not fundamentally a retail story.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Think about travel, where an agent could compare hotels, flights, policies and reviews. Professional services, where it could research consultants, lawyers or agencies on expertise, evidence, pricing and fit. (I include my own world in that. Plenty of firms describe what they do in language that would not survive being placed next to a competitor's.) Financial services, where the questions are fees, conditions and eligibility. B2B, where an agent could help evaluate suppliers on specifications, capabilities, terms and evidence.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Any business whose customers research and compare before choosing has the same exposure.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What this has to do with Business Architecture</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This is what I mean by <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture</Link>. It is not business planning, and it is not technology architecture. Nor is it only for people starting businesses, although I spend a lot of time helping them. It applies just as much to a company that has been running for decades.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It means looking at a business as a connected system (customer, offer, technology, data, revenue, operations, channels, capabilities, people, economics, execution) and asking whether the pieces still make sense together as the environment changes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Putting AI inside an existing business can be relatively easy. A tool here, a pilot there.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <strong>Architecting a business for a world in which intelligence itself becomes part of the infrastructure is much harder.</strong>
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So instead of only asking where we can add AI, ask:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <strong>What changes about the architecture of this business when customers, employees, suppliers and competitors all have access to increasingly capable artificial intelligence?</strong>
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Before the questions get expensive</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                I don't know what agentic commerce will look like in three years. It may arrive more slowly than the enthusiasts expect, or in a shape nobody has described yet. I am not claiming every customer will have an autonomous shopping agent.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But Business Architecture was never about predicting the future perfectly. It is about recognizing structural change early enough to ask the right questions, before they become expensive ones.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Retailers once had to rebuild around customers who moved freely between physical and digital. Another participant may now be entering that system, one that reads, compares and recommends on the customer's behalf.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That is not a reason to panic. It is a reason to look.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Not simply at the business you need to run today, but far enough ahead to ask:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
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
                Your business already has an architecture. The question is whether it was designed for what's coming next.
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
