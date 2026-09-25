/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const H2_STYLE = { fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" } as const;
const LINK_CLASS = "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

const OBSERVATION_QUESTIONS = [
  "What did I notice?",
  "Who experiences it?",
  "What are they trying to accomplish?",
  "What do they do about it today?",
  "What does the current situation cost them in money, time, effort, inconvenience or frustration?",
  "What happens if they do nothing?",
];

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/how-do-i-find-a-business-idea";

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
                  How Do I Find a Business Idea?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  You don't need to wait for a brilliant business idea. Start by observing real problems, frustrations, aspirations and changes around you, identify the ones people care enough to act on, then explore possible solutions and validate the strongest opportunities.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  Business ideas aren't something you wait to have. They're something you learn to notice.
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
                  <p className="text-sm text-[#1a1816]/65">September 25, 2026</p>
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

<h2 style={H2_STYLE}>What if I want to start a business but don't have an idea?</h2>

<p style={{ marginBottom: "1.75rem" }}>You want to start a business.</p>

<p style={{ marginBottom: "1.75rem" }}>There's just one small problem.</p>

<p style={{ marginBottom: "3.5rem" }}>You have no idea what business to start.</p>

<p style={{ marginBottom: "2.5rem" }}>The popular story of entrepreneurship doesn't help. Someone is in the shower, or on a plane, or staring out of a window, and a brilliant idea arrives fully formed. If that hasn't happened to you, it's easy to conclude you're not the entrepreneurial type.</p>

<p style={{ marginBottom: "2.5rem" }}>In reality, business opportunities usually begin with something far less dramatic: noticing that something doesn't work particularly well.</p>

<p style={{ marginBottom: "2.5rem" }}>A frustration. An inefficient workaround. Something unnecessarily expensive, or painfully slow. A complaint you keep hearing. Something people clearly want that nobody is giving them properly. A change in an industry, in behaviour or in technology that suddenly makes something possible that wasn't before.</p>

<p style={{ marginBottom: "2.5rem" }}>You can, of course, open ChatGPT and type: "Give me 50 business ideas I can start."</p>

<p style={{ marginBottom: "2.5rem" }}>You'll get fifty. Some will even sound good. None of them will have come from the world you actually live in, the people you actually know or the problems you've actually seen. AI can generate ideas. It can't replace observing reality.</p>

<p style={{ marginBottom: "3.5rem" }}>So the better starting point is less glamorous. Go look at the real world.</p>

<h2 style={H2_STYLE}>Stop trying to invent a business</h2>

<p style={{ marginBottom: "2.5rem" }}>For one week, stop trying to invent businesses. Observe instead.</p>

<p style={{ marginBottom: "2.5rem" }}>Look at your work and your industry. Your customers, your colleagues, your family, your neighbourhood and your daily routines. The things you personally struggle with, and the things other people repeatedly complain about. The inefficient processes, the workarounds, and the existing solutions that are expensive, mediocre or both.</p>

<p style={{ marginBottom: "2.5rem" }}>You're looking for friction.</p>

<p style={{ marginBottom: "1.75rem" }}>What annoys people?</p>

<p style={{ marginBottom: "1.75rem" }}>What takes too long?</p>

<p style={{ marginBottom: "1.75rem" }}>What is unnecessarily complicated?</p>

<p style={{ marginBottom: "1.75rem" }}>What are people doing manually that seems ridiculous?</p>

<p style={{ marginBottom: "1.75rem" }}>Where are people using spreadsheets, WhatsApp messages, pieces of paper and three different apps to accomplish one relatively simple task?</p>

<p style={{ marginBottom: "1.75rem" }}>What are people paying too much for, simply because the alternatives aren't much better?</p>

<p style={{ marginBottom: "3.5rem" }}>What do you keep thinking should be easier?</p>

<p style={{ marginBottom: "2.5rem" }}>But don't restrict yourself to problems. People don't only spend money to make pain go away. They also spend it because they want convenience, speed, status, enjoyment, better experiences, health, security, knowledge, freedom, income, transformation or a different way of living. A strong desire can be as commercially real as a strong frustration.</p>

<p style={{ marginBottom: "2.5rem" }}>And look at change. Technology, AI, demographics, regulation, consumer behaviour, the way people work and the way people live are all moving. When they move, new needs appear, old ones fade, and existing solutions stop fitting quite as well as they used to.</p>

<p style={{ marginBottom: "3.5rem" }}>Change creates gaps.</p>

<h2 style={H2_STYLE}>Collect 10 observations in seven days</h2>

<p style={{ marginBottom: "2.5rem" }}>Here's the practical exercise. For seven days, keep a note on your phone and collect at least ten observations. They can be frustrations, desires, inefficient behaviours, changing needs or possible opportunities.</p>

<p style={{ marginBottom: "1.75rem" }}>At this stage, don't judge them.</p>

<p style={{ marginBottom: "1.75rem" }}>Don't build anything.</p>

<p style={{ marginBottom: "1.75rem" }}>Don't calculate the market size.</p>

<p style={{ marginBottom: "1.75rem" }}>Don't obsess about competitors.</p>

<p style={{ marginBottom: "3.5rem" }}>And please don't design the logo.</p>

<p style={{ marginBottom: "1.75rem" }}>For each observation, capture six things:</p>

<ol className="not-prose list-none m-0 p-0 my-4 border-t border-b border-[#1a1816]/10 divide-y divide-[#1a1816]/8">
  {OBSERVATION_QUESTIONS.map((question, index) => (
    <li key={question} className="flex items-baseline gap-5 md:gap-6 py-5 md:py-6">
      <span
        className="text-xl md:text-2xl font-light text-[#6b1f1f] shrink-0 w-8 md:w-10 tabular-nums"
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="text-lg md:text-xl font-light leading-snug text-[#1a1816]">
        {question}
      </p>
    </li>
  ))}
</ol>

<p style={{ marginTop: "3rem", marginBottom: "2.5rem" }}>The last question matters more than it looks.</p>

<p style={{ marginBottom: "2.5rem" }}>People tolerate problems every day. They grumble, they work around them, and they carry on. The existence of a problem does not automatically mean a business should exist to solve it. There has to be enough tension, desire, consequence or aspiration to make somebody actually act.</p>

<p style={{ marginBottom: "3.5rem" }}>A problem people complain about is interesting. A problem people do something about is an opportunity.</p>

<h2 style={H2_STYLE}>How do I know which ideas are worth investigating?</h2>

<p style={{ marginBottom: "2.5rem" }}>At the end of the week, start eliminating.</p>

<p style={{ marginBottom: "2.5rem" }}>Some observations will be trivial. Some will affect people who don't care enough. Some already have excellent solutions. Some will be real problems and terrible business opportunities.</p>

<p style={{ marginBottom: "2.5rem" }}>That's fine. The objective isn't to prove that every observation is a business. It's to find perhaps two or three worth investigating further.</p>

<p style={{ marginBottom: "1.75rem" }}>For those, start asking:</p>

<p style={{ marginBottom: "1.75rem" }}>Is this actually happening, or does it just feel like it is?</p>

<p style={{ marginBottom: "1.75rem" }}>Does it happen often enough to matter?</p>

<p style={{ marginBottom: "1.75rem" }}>Who cares about it most?</p>

<p style={{ marginBottom: "1.75rem" }}>How are people dealing with it today?</p>

<p style={{ marginBottom: "3.5rem" }}>Are they already spending money, time or effort trying to deal with it?</p>

<p style={{ marginBottom: "2.5rem" }}>Be careful with "Would you pay for this?" It's the question everyone wants to ask, and it tends to produce the least reliable answer. What people say they would pay for and what they actually pay for are often very different things. People are polite, optimistic and remarkably generous with hypothetical money.</p>

<p style={{ marginBottom: "2.5rem" }}>Existing behaviour is stronger evidence. What are people already buying? What workaround are they already using? What does that workaround cost them? What have they already tried, and why didn't it work?</p>

<p style={{ marginBottom: "2.5rem" }}>This is the point where you stop generating business ideas and start validating a business opportunity. It's a different activity with a different mindset. Idea generation rewards openness. Validation rewards scepticism, including about your own favourite.</p>

<p style={{ marginBottom: "3.5rem" }}>If you already have a candidate and want to test it properly, I've written about <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className={LINK_CLASS}>how to know if a business idea is actually viable</Link>.</p>

<h2 style={H2_STYLE}>When should I start thinking about solutions?</h2>

<p style={{ marginBottom: "2.5rem" }}>Only now. Once you've identified a promising problem, aspiration or opportunity, the question to ask is:</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>How could this be solved better?</p>

<p style={{ marginBottom: "2.5rem" }}>Not:</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>What business should I build?</p>

<p style={{ marginBottom: "2.5rem" }}>Those sound similar. They aren't. One underlying problem can support many possible solutions, and many different business models. It might be solved by a service, software, a physical product, a marketplace, a subscription, a specialist consultancy, education, an intermediary, a technology-enabled service, or simply a better process that someone will pay you to run.</p>

<p style={{ marginBottom: "2.5rem" }}>Don't fall in love with the first solution. It's usually the most obvious one, which often means other people have already tried it. Committing to it before you've explored the alternatives is, in my experience, <Link href="/thinking/the-fastest-way-to-build-the-wrong-business" className={LINK_CLASS}>the fastest way to build the wrong business</Link>.</p>

<p style={{ marginBottom: "3.5rem" }}>At this stage you're exploring possibilities, not committing to a company.</p>

<h2 style={H2_STYLE}>Should I start a business based on my existing skills?</h2>

<p style={{ marginBottom: "2.5rem" }}>Your existing experience matters. Your skills, knowledge, relationships, reputation, industry access, assets, location, capital and credibility can all give you a significant advantage. They affect which problems you can see clearly, which customers will return your call and which opportunities you can realistically pursue.</p>

<p style={{ marginBottom: "2.5rem" }}>But existing skills shouldn't become a prison.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>Your current skills should influence where you look, not dictate what you're allowed to build.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone who has spent twenty years in finance doesn't automatically need to start a financial consultancy. They may have commercial judgment, relationships, management ability, customer understanding, negotiation experience or industry access that could be applied somewhere else entirely.</p>

<p style={{ marginBottom: "1.75rem" }}>When you examine an opportunity, ask:</p>

<p style={{ marginBottom: "1.75rem" }}>What do I already know?</p>

<p style={{ marginBottom: "1.75rem" }}>What could I learn?</p>

<p style={{ marginBottom: "3.5rem" }}>What could I access through a partner, an employee, a specialist, technology or AI?</p>

<p style={{ marginBottom: "2.5rem" }}>An entrepreneur doesn't need to personally possess every capability the future company will require. They need to understand which capabilities are required, and whether those capabilities can realistically be assembled.</p>

<p style={{ marginBottom: "3.5rem" }}>Working that out before the business exists, along with what kind of business actually makes sense for the person who will run it, is a large part of <Link href="/answers/what-does-a-business-architect-do" className={LINK_CLASS}>what a Business Architect does</Link>.</p>

<h2 style={H2_STYLE}>A real example: an asset, an ambition and no business idea</h2>

<p style={{ marginBottom: "2.5rem" }}>An investor was considering buying a relatively inexpensive piece of land. He wanted to become an entrepreneur. There was an asset and there was ambition. There was no developed business idea.</p>

<p style={{ marginBottom: "2.5rem" }}>So we didn't start by deciding what to build on the land. We started by looking outward: the location, the population, demographic trends, regional activity, why people travelled to and through the area, lifestyle trends, and existing and emerging needs.</p>

<p style={{ marginBottom: "2.5rem" }}>Several observations began connecting. One was the popularity of RV and mobile lifestyles. Another was a large aging population. Among long-term travellers and mobile retirees, a particular tension emerged: as mobility becomes more difficult with age, people may eventually be forced to give up not just a vehicle but a lifestyle, a community and an identity.</p>

<p style={{ marginBottom: "2.5rem" }}>From those observations, a business concept emerged. Further market and economic work supported its commercial potential.</p>

<p style={{ marginBottom: "2.5rem" }}>Then the work exposed a location-specific constraint involving access to an essential resource. The uncertainty was significant enough to threaten the viability of the whole property-based project. The property was rejected.</p>

<p style={{ marginBottom: "2.5rem" }}>The business concept wasn't.</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>Sometimes the thing you start with isn't the business. It's simply how you discover it.</p>

<p style={{ marginBottom: "3.5rem" }}>It's also why <Link href="/answers/what-is-business-architecture" className={LINK_CLASS}>Business Architecture</Link> can begin before a business idea exists. The full story is in the <Link href="/cases/create-it" className={LINK_CLASS}>Create It case</Link>.</p>

<h2 style={H2_STYLE}>What if I still don't have a business idea?</h2>

<p style={{ marginBottom: "2.5rem" }}>Entrepreneurship doesn't have to begin with a lightning bolt.</p>

<p style={{ marginBottom: "2.5rem" }}>It can begin with curiosity. Ambition. An asset. A capability. A relationship. Unusual knowledge of an industry. An observation. A change. A frustration. An unmet aspiration.</p>

<p style={{ marginBottom: "2.5rem" }}>The objective isn't to discover the mythical perfect business idea. It's to identify something worth investigating.</p>

<p style={{ marginBottom: "2.5rem" }}>Then reality gets a vote.</p>

<p style={{ marginBottom: "2.5rem" }}>Investigating means looking properly at the problem, the customer, the existing alternatives, how people actually behave, whether there's real demand, whether people will pay, the market, the economics and whether the thing is feasible at all.</p>

<p style={{ marginBottom: "3.5rem" }}>Some ideas should die during that process. That's a good outcome. An idea that dies after a few weeks of investigation is far cheaper than one that dies after two years, your savings and a lease.</p>

<h2 style={H2_STYLE}>Where Business Architecture fits</h2>

<p style={{ marginBottom: "2.5rem" }}>It helps to keep four activities separate, because they're easy to blur together.</p>

<p style={{ marginBottom: "1.75rem" }}><strong>Finding an opportunity</strong> means noticing something worth investigating. That's most of this article.</p>

<p style={{ marginBottom: "1.75rem" }}><strong>Generating solutions</strong> means exploring the different ways that opportunity could be served.</p>

<p style={{ marginBottom: "1.75rem" }}><strong>Validating the opportunity</strong> means testing it against evidence rather than enthusiasm.</p>

<p style={{ marginBottom: "3.5rem" }}><strong>Architecting the business</strong> means designing how it actually works: the customer, offer, pricing, economics, go-to-market and execution, connected into one system.</p>

<p style={{ marginBottom: "2.5rem" }}>The method I use to move through those stages is <Link href="/thinking/the-business-architects-frame" className={LINK_CLASS}>The Business Architect's FRAME</Link>: Find, Reality-Test, Architect, Make, Evolve. This article helps you find something worth investigating. FRAME is the broader process for turning that opportunity into an actual business.</p>

<p style={{ marginBottom: "3.5rem" }}>When I do the early investigation with an entrepreneur, before they commit serious time, money or identity to building anything, I call it <Link href="/work-with-me" className={LINK_CLASS}>Pre-Architecture</Link>.</p>

<p style={{ marginBottom: "0.5rem" }}>Stop looking for business ideas.</p>

<p style={{ marginBottom: "3.5rem" }}>Start looking for reasons a business should exist.</p>

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
                      href: "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
                      title: "How Do I Know If My Business Idea Is Actually Viable?",
                      summary: "Customer, demand, willingness to pay, reachability and economics, tested with evidence.",
                    },
                    {
                      href: "/thinking/the-business-architects-frame",
                      title: "The Business Architect's FRAME™",
                      summary: "The five-question methodology for turning an idea into a business that can exist, learn and evolve.",
                    },
                    {
                      href: "/answers/the-10-signs-youre-serious-about-starting-a-business",
                      title: "The 10 Signs You're Serious About Starting a Business",
                      summary: "The mindset and behaviours that separate a serious founder from someone who just likes the idea of starting a business.",
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

        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
