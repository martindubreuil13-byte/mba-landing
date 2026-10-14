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

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "1.25rem", fontWeight: "400", marginTop: "2.5rem", marginBottom: "1.5rem", lineHeight: "1.4", color: "#1a1816" }}>
      {children}
    </h3>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ marginBottom: "3.5rem", paddingLeft: "1.25rem", listStyleType: "disc" }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: "0.75rem", paddingLeft: "0.25rem" }}>{item}</li>
      ))}
    </ul>
  );
}

const restaurantRows = [
  ["Concept and menu development", "Creative, culinary, commercial", "Chef and owner supported by AI"],
  ["Demand forecasting", "Analytical, mathematical", "Forecasting software and AI"],
  ["Purchasing and inventory", "Operational, predictive", "Inventory systems with human oversight"],
  ["Pricing", "Financial, analytical, strategic", "Pricing models and management"],
  ["Marketing and branding", "Creative, visual, psychological", "People supported by AI tools"],
  ["Kitchen operations", "Practical, procedural, situational", "Staff, equipment, and software"],
  ["Customer experience", "Emotional, social, relational", "Primarily people, supported by technology"],
  ["Performance analysis", "Analytical, strategic", "AI analysis and management decisions"],
];

const tableHeads = ["Business activity", "Intelligence required", "Possible allocation"];

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/architecting-intelligence";
  const articleTitle = "Architecting Intelligence";

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
                  Architecting Intelligence: How to Design a Business Around Human and Artificial Intelligence
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  The future of business isn't about replacing people with AI. It's about understanding what intelligence a business needs, where it creates value, and how to put it to work.
                </p>
              </div>

              <div className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-[#1a1816]/75">Martin Dubreuil</p>
                  <p className="text-sm text-[#1a1816]/65"><time dateTime="2026-10-14">October 14, 2026</time></p>
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

              <H2>What is Architecting Intelligence?</H2>

              <P>
                Architecting Intelligence is the deliberate process of identifying where intelligence is required across a business, determining which forms of intelligence create value, and designing how people, artificial intelligence, software, and systems work together.
              </P>

              <P tight>The objective isn't to automate everything.</P>

              <P>It's to make the business itself more intelligent.</P>

              <P>
                That means examining the entire business: how it develops products, attracts customers, makes decisions, manages operations, delivers value, learns from experience, and evolves.
              </P>

              <P tight>At every stage, the question is the same:</P>

              <P>
                <strong>What kind of intelligence does this activity require, and what is the best way to provide it?</strong>
              </P>

              <P tight>Sometimes the answer is AI. Sometimes it's conventional technology. Sometimes it's a human being with twenty years of experience.</P>

              <P>Often, it's a combination.</P>

              <P>
                This is what I call <em>Architecting Intelligence</em>, and I believe it represents an important evolution in how we design and operate businesses.
              </P>

              <H2>The problem with how businesses approach AI</H2>

              <P tight>Everywhere I look, companies are asking how they can use AI to replace people, reduce costs, or automate operations.</P>

              <P tight>Fair questions.</P>

              <P>But I think we're starting from the wrong end.</P>

              <P>
                We're treating artificial intelligence as a technology that needs somewhere to be installed, rather than examining the business to understand where intelligence is actually required.
              </P>

              <P tight>It's a little like buying an expensive industrial machine and then walking around the factory trying to figure out what to manufacture with it.</P>

              <P tight>You might eventually find something.</P>

              <P>But that's hardly a sensible way to design a business.</P>

              <P tight>The problem becomes clearer when we recognize something fundamental.</P>

              <P>
                <strong>Intelligence isn't one thing.</strong>
              </P>

              <H2>Intelligence comes in different forms</H2>

              <P tight>Think about the people you've encountered throughout your life.</P>

              <P tight>Some are brilliant mathematicians but terrible communicators.</P>

              <P tight>Some can understand a customer's needs within minutes.</P>

              <P tight>Others are exceptional at designing products, organizing complex operations, negotiating agreements, or recognizing opportunities that nobody else sees.</P>

              <P>And some people develop extraordinary judgment through years of experience, mistakes, and occasionally spectacular failures.</P>

              <P tight>We use the word <em>intelligence</em> to describe all these capabilities.</P>

              <P>But they are not interchangeable.</P>

              <P tight>A business may depend on several forms of intelligence:</P>

              <Ul
                items={[
                  <><strong>Analytical intelligence:</strong> Interpreting information, identifying patterns, and understanding relationships.</>,
                  <><strong>Mathematical intelligence:</strong> Calculating, forecasting, optimizing, and modeling possibilities.</>,
                  <><strong>Creative intelligence:</strong> Developing original ideas, products, experiences, and solutions.</>,
                  <><strong>Practical intelligence:</strong> Applying knowledge to real operating conditions.</>,
                  <><strong>Emotional and social intelligence:</strong> Understanding people, relationships, motivations, and situations.</>,
                  <><strong>Strategic intelligence:</strong> Evaluating alternatives, consequences, risks, and opportunities.</>,
                  <><strong>Experiential judgment:</strong> Drawing on accumulated knowledge, context, and lessons learned.</>,
                ]}
              />

              <P tight>These categories overlap. They aren't a scientific classification or a rigid division between humans and machines.</P>

              <P>They're a useful way to examine what a business actually needs.</P>

              <P tight>AI can contribute to many of them, including creative and strategic work.</P>

              <P tight>But the fact that AI can perform an activity doesn't automatically mean it should own that activity.</P>

              <P>That's a business architecture decision.</P>

              <H2>Architecting Intelligence in practice: Let's open a restaurant</H2>

              <P tight>Consider an ordinary restaurant.</P>

              <P tight>Nothing particularly futuristic.</P>

              <P>Just a business trying to create good food, attract customers, operate efficiently, and make a profit.</P>

              <P>Now look at how many forms of intelligence are involved.</P>

              <H3>1. Product development: Creativity and commercial understanding</H3>

              <P tight>Before serving the first customer, someone needs to develop the concept.</P>

              <P tight>What kind of restaurant? Which customers? What menu? Which recipes? What makes the food worth choosing?</P>

              <P>This requires culinary expertise, creativity, market understanding, and commercial judgment.</P>

              <P tight>AI can research trends, analyze competing menus, suggest recipes, and estimate ingredient costs.</P>

              <P>But somebody still needs to taste the food, understand the intended customer, and decide what the restaurant should stand for.</P>

              <P tight>AI contributes intelligence.</P>

              <P tight>Human expertise provides another kind.</P>

              <P>The architecture determines how they work together.</P>

              <H3>2. Purchasing and inventory: Prediction and optimization</H3>

              <P tight>Now we need ingredients.</P>

              <P tight>How much chicken should we purchase next week?</P>

              <P tight>How many burger buns?</P>

              <P>How do we avoid running out of stock on Saturday while throwing away unsold ingredients on Monday?</P>

              <P tight>This is a different intelligence problem.</P>

              <P>Historical sales, weather, seasonality, supplier reliability, and purchasing patterns can all contribute to demand forecasting.</P>

              <P>AI, forecasting models, and inventory software may be far better suited to processing these variables than someone manually updating spreadsheets.</P>

              <P>Here, automation can improve accuracy, reduce waste, and free employees for more valuable work.</P>

              <P>But we still need someone accountable for supplier relationships, unexpected disruptions, and operational decisions.</P>

              <H3>3. Pricing: Mathematics meets market judgment</H3>

              <P tight>How much should we charge for a burger?</P>

              <P tight>A pricing system can calculate ingredient costs, labor allocation, margins, and different scenarios.</P>

              <P>AI can help model demand and compare competitive positioning.</P>

              <P tight>But the calculation alone doesn't determine whether a customer will pay $18 for that burger.</P>

              <P>Customer perception, experience, brand positioning, and local competition matter.</P>

              <P tight>This is where mathematical intelligence meets commercial judgment.</P>

              <P>Neither should be ignored.</P>

              <H3>4. Marketing: Creativity, psychology, and communication</H3>

              <P tight>Now we need customers.</P>

              <P>Brand identity, menu design, photography, advertising, social media, promotions, and even interior decoration all influence demand.</P>

              <P>AI can generate visuals, develop campaign concepts, analyze results, and help a small business produce sophisticated marketing material.</P>

              <P tight>But there's a danger.</P>

              <P>If every restaurant uses the same tools to generate the same generic advertising, everyone starts looking alike.</P>

              <P tight>Congratulations.</P>

              <P>We've automated away our differentiation.</P>

              <P>AI should strengthen the business's identity, not replace it with something forgettable.</P>

              <H3>5. Service: Operational intelligence meets human relationships</H3>

              <P tight>A reservation system can optimize table allocation.</P>

              <P tight>Software can coordinate orders.</P>

              <P>AI can help anticipate busy periods and support staff scheduling.</P>

              <P tight>But what happens when a customer is disappointed?</P>

              <P tight>When someone is celebrating an anniversary?</P>

              <P>When a regular walks in and the waiter remembers their favorite table?</P>

              <P>Now we're dealing with situational awareness, empathy, hospitality, and trust.</P>

              <P tight>Technology can support these interactions.</P>

              <P>But automating them away might eliminate the very reason customers return.</P>

              <P>Efficiency and customer value aren't always the same thing.</P>

              <H3>6. Learning: Analysis, interpretation, and decisions</H3>

              <P tight>The customer leaves.</P>

              <P>The business continues learning.</P>

              <P>Sales statistics, reviews, complaints, food costs, waste, employee performance, and customer retention all provide information.</P>

              <P>AI can identify patterns and highlight problems.</P>

              <P tight>Perhaps the most popular dish is barely profitable.</P>

              <P tight>Perhaps customers love the food but consistently complain about waiting times.</P>

              <P>Perhaps a promotion increases traffic without increasing profit.</P>

              <P tight>The system can reveal the problem.</P>

              <P>But should the restaurant change its menu, raise prices, redesign the kitchen, or hire more employees?</P>

              <P tight>Those decisions require business judgment.</P>

              <P>And business decisions have consequences.</P>

              <H2>The intelligence architecture of a restaurant</H2>

              <div style={{ marginBottom: "2rem" }}>
                <table className="w-full text-left border-collapse">
                  <caption className="sr-only">
                    Illustrative allocation of intelligence across the activities of a restaurant
                  </caption>
                  <thead className="sr-only md:not-sr-only">
                    <tr className="border-b border-[#1a1816]/25">
                      {tableHeads.map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="py-3 pr-6 text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold align-bottom"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantRows.map(([activity, intelligence, allocation]) => (
                      <tr
                        key={activity}
                        className="block md:table-row border-b border-[#1a1816]/10 py-4 md:py-0"
                      >
                        <th
                          scope="row"
                          className="block md:table-cell md:py-4 md:pr-6 text-base font-semibold md:align-top"
                        >
                          {activity}
                        </th>
                        <td className="block md:table-cell md:py-4 md:pr-6 text-base md:align-top text-[#1a1816]/85">
                          <span className="md:hidden text-xs tracking-widest uppercase text-[#1a1816]/55 mr-2">Intelligence required:</span>
                          {intelligence}
                        </td>
                        <td className="block md:table-cell md:py-4 text-base md:align-top text-[#1a1816]/85">
                          <span className="md:hidden text-xs tracking-widest uppercase text-[#1a1816]/55 mr-2">Possible allocation:</span>
                          {allocation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <P tight>These are illustrative allocations, not universal rules.</P>

              <P>A fast-food operation, a neighborhood café, and a luxury restaurant may architect the same activities very differently.</P>

              <P tight>And that's precisely the point.</P>

              <P>
                <strong>There is no single correct distribution of intelligence for every business.</strong>
              </P>

              <P>The architecture should reflect the business model, customers, economics, operating conditions, and intended experience.</P>

              <H2>How does Intelligence Architecture relate to Business Architecture?</H2>

              <P>
                <Link href="/answers/what-is-business-architecture" className={linkClass}>Business Architecture</Link> is concerned with how the different elements of a business fit together to create a coherent, viable operation.
              </P>

              <P>The customer, offer, product, economics, operations, technology, people, delivery model, and route to market must work together.</P>

              <P tight>Intelligence Architecture examines a specific dimension of that system:</P>

              <P>
                <strong>How intelligence is distributed, connected, and applied throughout the business.</strong>
              </P>

              <P tight>Business Architecture asks:</P>

              <P>
                <em>How should this business work?</em>
              </P>

              <P tight>Intelligence Architecture asks:</P>

              <P>
                <em>What intelligence does this business need to work well, and how should that intelligence be organized?</em>
              </P>

              <P tight>The distinction matters.</P>

              <P tight>A business can have excellent AI tools and still have a terrible business model.</P>

              <P tight>It can automate operations while delivering a poor customer experience.</P>

              <P>It can generate endless market analysis without knowing which customers it actually serves.</P>

              <P tight>Technology doesn't compensate for a badly architected business.</P>

              <P>Sometimes it simply helps the business make the same mistakes faster.</P>

              <H2>A practical framework for Architecting Intelligence</H2>

              <P>
                I approach the problem through six connected questions. They sit comfortably alongside the five questions of <Link href="/thinking/the-business-architects-frame" className={linkClass}>the Business Architect's FRAME™</Link>, which asks whether a business idea deserves to exist and how it should be built.
              </P>

              <H3>1. Where is value created?</H3>

              <P tight>Map the business from beginning to end.</P>

              <P>From understanding customer needs and developing an offer to attracting customers, delivering the product or service, managing operations, and maintaining relationships.</P>

              <P tight>Don't begin with the software.</P>

              <P>Begin with the business.</P>

              <H3>2. Where is intelligence required?</H3>

              <P>Identify the activities that depend on information, interpretation, prediction, creativity, judgment, or decisions.</P>

              <P tight>Not every activity requires sophisticated intelligence.</P>

              <P>And not every problem deserves an AI solution.</P>

              <H3>3. What kind of intelligence is needed?</H3>

              <P tight>Is the activity primarily analytical?</P>

              <P tight>Creative?</P>

              <P tight>Predictive?</P>

              <P tight>Relational?</P>

              <P>Does it require real-time decisions, accumulated experience, or specialized technical knowledge?</P>

              <P>Understanding the requirement helps prevent the wrong solution from being applied.</P>

              <H3>4. Who or what should provide it?</H3>

              <P tight>Consider the available capabilities.</P>

              <P>People, teams, conventional software, specialized models, generative AI, reasoning systems, or autonomous agents.</P>

              <P>Evaluate them against quality, cost, speed, reliability, risk, accountability, and customer value.</P>

              <P>The best answer isn't necessarily the newest technology.</P>

              <H3>5. How should everything connect?</H3>

              <P tight>An intelligent business isn't a collection of disconnected tools.</P>

              <P>Information needs to flow between activities.</P>

              <P tight>A restaurant's demand forecast should inform purchasing.</P>

              <P tight>Purchasing costs should inform pricing.</P>

              <P tight>Sales performance should inform menu decisions.</P>

              <P>Customer feedback should inform product development and service improvements.</P>

              <P>The connections are part of the architecture.</P>

              <H3>6. How will the system learn and evolve?</H3>

              <P tight>Technology changes.</P>

              <P tight>Customer expectations change.</P>

              <P>Business conditions change.</P>

              <P>An intelligence architecture should be tested against actual results and revised when evidence shows something isn't working.</P>

              <P tight>Architecture isn't a permanent diagram.</P>

              <P>It's a deliberate design that must survive contact with reality.</P>

              <H2>Intelligence Architecture is not the same as AI automation</H2>

              <P>The two concepts are related, but they are not interchangeable.</P>

              <P tight>
                <strong>AI automation</strong> focuses on using technology to perform tasks or processes with less manual involvement.
              </P>

              <P>
                <strong>Intelligence Architecture</strong> examines how the business should obtain, apply, and coordinate the intelligence required to operate effectively.
              </P>

              <P tight>Automation may be one outcome.</P>

              <P>So may better decision-making, improved customer experiences, new products, different employee responsibilities, or an entirely redesigned business model.</P>

              <P tight>An intelligence architecture might recommend automating a process.</P>

              <P tight>It might also recommend keeping an experienced human in control.</P>

              <P>Or eliminating the process entirely because it serves no useful purpose.</P>

              <P>That's a very different starting point.</P>

              <H2>Why access to AI isn't a sustainable competitive advantage</H2>

              <P>Here's something businesses should consider.</P>

              <P>Your competitors can access many of the same AI models, software platforms, and automation tools.</P>

              <P>They can generate similar content, analyze similar information, and build similar workflows.</P>

              <P>Technology that is widely available rarely remains a differentiator on its own.</P>

              <P>The more interesting advantage is how the business combines its capabilities.</P>

              <P tight>Its expertise.</P>

              <P tight>Its customer relationships.</P>

              <P tight>Its operating model.</P>

              <P tight>Its information.</P>

              <P tight>Its decisions.</P>

              <P>And the way people and technology work together.</P>

              <P tight>Two businesses can use exactly the same AI tools and achieve dramatically different results.</P>

              <P tight>Because the tools aren't the business.</P>

              <P>
                <strong>The architecture is what determines how those tools contribute to value.</strong>
              </P>

              <H2>The future isn't human versus AI</H2>

              <P tight>I don't believe the future belongs to businesses that replace the most people with artificial intelligence.</P>

              <P>Nor to those that stubbornly refuse to use it.</P>

              <P>I believe it belongs to businesses that understand which forms of intelligence they need, where they create value, and how to combine them effectively.</P>

              <P tight>Sometimes the answer is a person.</P>

              <P tight>Sometimes it's AI.</P>

              <P tight>Sometimes it's a combination.</P>

              <P>And sometimes the smartest decision is to leave something alone.</P>

              <P tight>The objective isn't to build a company with the most artificial intelligence.</P>

              <P>It's to build a more intelligent company.</P>

              <P tight>That's the thinking behind Architecting Intelligence.</P>

              <P>And it's why I believe the conversation needs to move beyond installing AI tools and automating individual tasks.</P>

              <P>We should be designing businesses around the intelligence they actually need.</P>

              <P>
                <strong>Don't just automate your business. Architect its intelligence.</strong>
              </P>

              <p
                className="border-t border-[#1a1816]/8 pt-8"
                style={{ fontSize: "1rem", lineHeight: "1.7", color: "rgba(26,24,22,0.7)", marginBottom: "1.5rem" }}
              >
                A shorter, more conversational version of this argument was first published as an essay on Substack:{" "}
                <a
                  href="https://dubreuil.substack.com/p/ai-isnt-taking-over-intelligence"
                  className={linkClass}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AI Isn't Taking Over Intelligence
                </a>
                .
              </p>

              <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "rgba(26,24,22,0.7)", marginBottom: "3.5rem" }}>
                <strong>About the author.</strong> Martin Dubreuil is The Modern Business Architect™. He works with entrepreneurs to turn ideas into coherent businesses and helps make them exist. His work explores how business models, people, technology, and intelligence can be architected to create value.
              </p>

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
                  <Link href="/thinking/the-being-economy" className={linkClass}>The Being Economy</Link>
                </li>
                <li>
                  <Link href="/thinking/your-next-customer-might-not-visit-your-website" className={linkClass}>Your Next Customer Might Not Visit Your Website</Link>
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
