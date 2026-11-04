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
  const articleUrl = "https://modernbusinessarchitect.com/thinking/your-next-customer-might-not-be-human";
  const articleTitle = "Your Next Customer Might Not Be Human";

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
                  Your Next Customer Might Not Be Human
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Why Business-to-Agent commerce could change retail, e-commerce, and the way we architect businesses.
                </p>
              </div>

              <div className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-[#1a1816]/75">Martin Dubreuil | The Modern Business Architect™</p>
                  <p className="text-sm text-[#1a1816]/65"><time dateTime="2026-11-03">November 3, 2026</time></p>
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

              <P>For more than 20 years, I've been involved in retail and distribution, directly or indirectly, across different markets and business models. I've seen retailers reinvent themselves, distribution channels evolve, and technology change the way businesses reach their customers.</P>

              <P tight>But something particularly interesting is happening now.</P>

              <P>
                <strong>For the first time, the person buying your product might not be the one shopping for it.</strong>
              </P>

              <P>And I'm not talking about someone asking their spouse to pick up a few things at the supermarket. I'm talking about artificial intelligence. More specifically, AI agents acting on behalf of consumers and businesses.</P>

              <P>I believe this will become one of the most important developments in retail and e-commerce over the next few years. And by 2027, businesses should be seriously considering what it means for their commercial architecture.</P>

              <H2>From B2B and B2C to B2A</H2>

              <P tight>Anyone familiar with retail knows the traditional business models.</P>

              <P tight>B2B: Business to Business.</P>

              <P tight>B2C: Business to Consumer.</P>

              <P>B2B2C: Business to Business to Consumer.</P>

              <P>These models describe how businesses connect with their markets, who they sell to, and how products and services reach the end customer. But there's another model beginning to emerge.</P>

              <P>
                <strong>B2A: Business to Agent.</strong>
              </P>

              <P>The term already exists in discussions about agentic commerce, but I suspect we'll be hearing considerably more about it.</P>

              <P>The principle is simple. Instead of a person visiting your website, browsing products, comparing options, and completing a purchase, an AI agent performs some or all of those activities on their behalf.</P>

              <P>And that seemingly small change could have enormous consequences.</P>

              <H2>When Your Customer Sends an Agent Shopping</H2>

              <P>Imagine you need a new washing machine. Today, you might search Google, visit several retailers, read reviews, compare prices, check delivery conditions, and eventually make a decision.</P>

              <P>Perhaps an advertisement catches your attention. Maybe a promotion influences your choice. Or perhaps one retailer simply has a better website.</P>

              <P tight>Now imagine telling your AI assistant:</P>

              <blockquote
                style={{
                  margin: "0 0 3.5rem 0",
                  paddingLeft: "1.5rem",
                  borderLeft: "2px solid rgba(107,31,31,0.4)",
                  fontStyle: "normal",
                  color: "#1a1816",
                }}
              >
                "Find me the best washing machine under $800. I want something reliable, energy-efficient, and available for delivery before Friday. Compare the options and recommend the best choice."
              </blockquote>

              <P>The agent searches, evaluates the available products, compares specifications and prices, checks delivery conditions, and returns with a recommendation. Eventually, with the appropriate permissions and safeguards, it may also complete the transaction.</P>

              <P tight>The consumer still makes the decision about what matters. But the process of discovering and evaluating products is increasingly delegated.</P>

              <P tight>
                <strong>The customer hasn't disappeared. The buying process has changed.</strong>
              </P>

              <P>And that's where things get interesting.</P>

              <H2>We've Spent Decades Building Websites for Humans</H2>

              <P tight>Retailers invest enormous amounts of money designing digital experiences around human behaviour.</P>

              <P tight>Beautiful product photography.</P>

              <P tight>Emotional storytelling.</P>

              <P tight>Brand positioning.</P>

              <P tight>Promotional campaigns.</P>

              <P tight>Sales funnels.</P>

              <P>Customer journeys designed to move visitors from curiosity to purchase.</P>

              <P>And there's nothing wrong with that. These approaches have helped businesses grow for decades. But an AI agent doesn't necessarily respond to those same influences.</P>

              <P>It doesn't admire your homepage. It doesn't get emotionally attached to your carefully selected brand ambassador. And it probably doesn't appreciate being interrupted by a pop-up asking it to subscribe to your newsletter.</P>

              <P>It needs something different. Accurate product specifications. Structured information. Reliable pricing. Real-time availability. Delivery conditions. Return policies. Compatibility information.</P>

              <P>It also needs to determine whether that information is trustworthy. And, when authorized to purchase, it needs a reliable way to complete the transaction.</P>

              <P tight>Here's the challenge.</P>

              <P>
                <strong>A business can have an excellent website for humans and still be remarkably difficult for an AI agent to understand or transact with.</strong>
              </P>

              <P>That creates a new kind of commercial vulnerability.</P>

              <P>
                I've previously explored how{" "}
                <Link href="/thinking/your-next-customer-might-not-visit-your-website" className={linkClass}>AI agents could change the way customers discover businesses</Link>. But discovery is only the beginning. The bigger question is what happens when those agents begin evaluating, selecting, and purchasing products on our behalf.
              </P>

              <H2>This Is a Business Architecture Problem</H2>

              <P>When people discuss AI in retail, the conversation often revolves around chatbots, automated customer service, personalized recommendations, or marketing content. Those are applications of AI. B2A raises a much more fundamental question.</P>

              <P>
                <strong>How should a business be designed when some of its commercial interactions are conducted by intelligent software rather than directly by people?</strong>
              </P>

              <P>
                That's{" "}
                <Link href="/answers/what-is-business-architecture" className={linkClass}>Business Architecture</Link>.
              </P>

              <P>Consider a retailer with thousands of products. Its website might display attractive descriptions and photographs, but its underlying product information could be inconsistent, incomplete, or scattered across multiple systems.</P>

              <P>Its inventory might update only periodically. Its delivery estimates might depend on manual processes. Its promotional pricing might not be accessible outside the website. Its checkout process might require interactions that only a human can reasonably complete.</P>

              <P>None of these problems necessarily prevents a person from buying. But together, they could make the business difficult for an AI agent to evaluate, recommend, or purchase from.</P>

              <P tight>Preparing for B2A means examining how the different parts of the business work together.</P>

              <P tight>
                <strong>Product and information architecture.</strong> Is product information complete, consistent, structured, and accessible? Can an agent reliably distinguish between similar products and understand their specifications?
              </P>

              <P tight>
                <strong>Commercial architecture.</strong> Can pricing, promotions, stock availability, delivery conditions, and purchasing rules be communicated accurately across different channels?
              </P>

              <P tight>
                <strong>Technology and integration architecture.</strong> Can authorized external systems interact with the business through appropriate interfaces, APIs, and transaction mechanisms?
              </P>

              <P tight>
                <strong>Operational architecture.</strong> Can inventory, fulfillment, customer service, returns, and order management support transactions initiated through a new intermediary?
              </P>

              <P>
                <strong>Trust and governance.</strong> How does the business verify authorization, protect customer information, prevent fraudulent transactions, and establish accountability when an agent acts on someone's behalf?
              </P>

              <P>These aren't five separate technology projects. They're interconnected components of the same business.</P>

              <P>And that's precisely why simply installing another AI tool won't solve the problem. The business itself needs to be architected for the interaction.</P>

              <H2>What Happens to Marketing and Brand Loyalty?</H2>

              <P>There's another dimension I find fascinating. For decades, retailers have competed not only through their products and prices but through their ability to influence purchasing decisions. Brand recognition, advertising, emotional connections, loyalty programs, and shopping experiences all play a role.</P>

              <P>But what happens when consumers increasingly delegate product comparisons to AI agents?</P>

              <P>Imagine two retailers offering essentially the same washing machine. One has an exceptional website, impressive advertising, and beautiful photography. The other has reliable product information, accurate availability, competitive pricing, transparent delivery conditions, and systems that an agent can easily interact with.</P>

              <P>Which one gets recommended? Not necessarily the one with the better marketing campaign.</P>

              <P>Of course, brand reputation, customer preferences, service quality, and trust will still matter. An intelligent agent may consider all of them. But the way those advantages are discovered and evaluated could change.</P>

              <P>
                <strong>Brand loyalty won't necessarily disappear. But businesses may need to earn the recommendation of an agent before they ever get the attention of a human.</strong>
              </P>

              <P tight>That's a very different competitive environment. And it raises an uncomfortable possibility.</P>

              <P>Your competitor might not have a better product. Their business might simply be easier for an AI agent to understand, compare, and buy from.</P>

              <H2>Why I Believe 2027 Matters</H2>

              <P>I'm not suggesting that consumers will suddenly stop visiting websites or that every transaction will be completed by an AI agent.</P>

              <P>Shopping is also an experience. People enjoy discovering products, exploring brands, visiting stores, and making emotional decisions. Those behaviours aren't disappearing.</P>

              <P>And agentic commerce still has important challenges to overcome, particularly around trust, payments, permissions, reliability, and consumer protection.</P>

              <P tight>But I believe 2027 could mark an important transition. Not necessarily the year B2A becomes dominant.</P>

              <P>
                <strong>The year when preparing for AI agents starts moving from an interesting technology discussion to a serious business strategy consideration.</strong>
              </P>

              <P>Retailers have spent years optimizing for search engines, mobile commerce, marketplaces, and social platforms. Each new channel required businesses to reconsider how they present products, reach customers, manage transactions, and organize operations.</P>

              <P>AI agents could represent another such shift, with one important difference. This time, the intermediary isn't simply another platform displaying your products. It's software that can evaluate alternatives, make recommendations, and potentially act on behalf of the buyer.</P>

              <P>That changes the relationship.</P>

              <H2>The Question Business Leaders Should Be Asking</H2>

              <P>I wouldn't recommend that every retailer rush out tomorrow and rebuild its entire technology infrastructure. That would be expensive, premature, and probably unnecessary. I would recommend something much simpler.</P>

              <P tight>Start examining your business from the perspective of an AI agent.</P>

              <P tight>Can it discover your products?</P>

              <P tight>Can it understand what you're selling?</P>

              <P tight>Can it access accurate prices and availability?</P>

              <P tight>Can it compare your offering with competitors?</P>

              <P tight>Can it determine whether your business is trustworthy?</P>

              <P>And eventually, could it complete a purchase safely and reliably?</P>

              <P>If the answer to several of those questions is no, you may have identified an architectural weakness worth investigating.</P>

              <P>Not because AI agents are guaranteed to become your biggest customers tomorrow. But because the ability to serve them may become an important part of how your business competes.</P>

              <P>
                <strong>The next evolution of retail isn't simply about where people buy. It's about who, or what, does the shopping.</strong>
              </P>

              <P tight>B2B. B2C. B2B2C.</P>

              <P tight>And increasingly, B2A.</P>

              <P>Business to Agent.</P>

              <P>I believe it's a model worth paying attention to.</P>

              <P tight>Because your next customer might not be human.</P>

              <P>And your business should be ready for both.</P>

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
                  <Link href="/answers/what-is-business-architecture" className={linkClass}>What Is Business Architecture?</Link>
                </li>
                <li>
                  <Link href="/thinking/your-next-customer-might-not-visit-your-website" className={linkClass}>Your Next Customer Might Not Visit Your Website</Link>
                </li>
                <li>
                  <Link href="/thinking/architecting-intelligence" className={linkClass}>Architecting Intelligence</Link>
                </li>
                <li>
                  <Link href="/thinking/anticipatory-business-architecture" className={linkClass}>Will Your Business Still Be Relevant Tomorrow?</Link>
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
