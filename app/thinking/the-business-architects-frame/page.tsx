/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/the-business-architects-frame";
  const articleTitle = "The Business Architect's FRAME™";

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
                  The Business Architect's FRAME™
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  An idea is not a business. Between the two sit five questions most entrepreneurs skip on the way to building.
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
                  <p className="text-sm text-[#1a1816]/65">September 19, 2026</p>
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

<p style={{ marginBottom: "1.75rem" }}>Most entrepreneurs move from idea to building faster than they move from idea to understanding.</p>

<p style={{ marginBottom: "3.5rem" }}>That's not laziness.</p>

<p style={{ marginBottom: "1.75rem" }}>Building feels like progress. A logo exists. A website exists. A product exists. You can point at it.</p>

<p style={{ marginBottom: "2.5rem" }}>An idea is harder to point at. So people rush past it, straight into construction, and ask the important question far too late.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What exactly are we building here?</p>

<p style={{ marginBottom: "2.5rem" }}>I've written before about what happens when that question arrives too late — when <Link href="/thinking/an-app-is-not-a-business" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">a product gets mistaken for a business</Link>, or when a founder builds forward for months without ever working out what needs to be true first. What I haven't done, until now, is name the discipline I actually use to stop it from happening — in my own work, and in the work I do with founders.</p>

<p style={{ marginBottom: "1.75rem" }}>I call it The Business Architect's FRAME.</p>

<p style={{ marginBottom: "3.5rem" }}>Not because the acronym is clever. Because five questions kept showing up, in roughly the same order, across almost every founder, product and pivot I've worked with — and naming them made the discipline easier to teach, easier to repeat, and much harder to quietly skip.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Five questions, not five steps</h2>

<p style={{ marginBottom: "2.5rem" }}>FRAME stands for Find, Reality-Test, Architect, Make, Evolve.</p>

{/* FRAME diagram */}
<div className="not-prose my-4 border-t border-b border-[#1a1816]/10 py-10 md:py-12">
  <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-6">
    {[
      { letter: "F", name: "Find", question: "Is there something here?" },
      { letter: "R", name: "Reality-Test", question: "What is the evidence?" },
      { letter: "A", name: "Architect", question: "How does it work?" },
      { letter: "M", name: "Make", question: "What makes it real?" },
      { letter: "E", name: "Evolve", question: "What is the market saying?" },
    ].map((stage) => (
      <div key={stage.letter} className="text-left md:text-center">
        <p className="text-4xl md:text-5xl font-light text-[#6b1f1f] mb-3" style={{ fontFamily: "Georgia, serif" }}>{stage.letter}</p>
        <p className="text-xs tracking-widest uppercase text-[#1a1816]/80 font-semibold mb-2">{stage.name}</p>
        <p className="text-sm text-[#1a1816]/55 leading-relaxed">{stage.question}</p>
      </div>
    ))}
  </div>
  <p className="mt-10 md:mt-12 text-center text-xs tracking-widest uppercase text-[#1a1816]/35">Evolve feeds back into Find, Reality-Test, Architect or Make</p>
</div>

<p style={{ marginBottom: "1.75rem" }}>Each letter is a question, not a task to check off:</p>

<p style={{ marginBottom: "1.25rem" }}><strong>FIND</strong> — Is there a real problem or opportunity here, and does it have meaningful potential?</p>

<p style={{ marginBottom: "1.25rem" }}><strong>REALITY-TEST</strong> — What is the evidence that this is a good idea?</p>

<p style={{ marginBottom: "1.25rem" }}><strong>ARCHITECT</strong> — How does the business need to work, as one coherent system?</p>

<p style={{ marginBottom: "1.25rem" }}><strong>MAKE</strong> — What needs to happen, in what order, to make that architecture exist?</p>

<p style={{ marginBottom: "3.5rem" }}><strong>EVOLVE</strong> — What is the market saying, and what should change because of it?</p>

<p style={{ marginBottom: "2.5rem" }}>FRAME is not a business plan. A business plan describes a business, usually the way you'd like it to look once it's finished. FRAME doesn't describe. It decides — what deserves further investigation, what deserves evidence, what deserves architecture, what deserves to be built, and what the business should become once it meets people who don't work for you.</p>

<p style={{ marginBottom: "2.5rem" }}>And it isn't a linear checklist. You don't complete FIND, graduate, and never think about it again. Reality doesn't cooperate that neatly. EVOLVE, the last letter, exists specifically to send you back into any of the other four the moment the market tells you something your plan didn't.</p>

<p style={{ marginBottom: "3.5rem" }}>The defining principle is simple. Evidence before commitment. Architecture before execution. Reality before certainty.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>FIND — is there something here?</h2>

<p style={{ marginBottom: "2.5rem" }}>Is there a real problem or opportunity here, and does it have meaningful potential?</p>

<p style={{ marginBottom: "3.5rem" }}>That's the only question FIND is trying to answer.</p>

<p style={{ marginBottom: "1.75rem" }}>Not "is my idea good." Not "will this make me rich." Just: is there something here worth spending more time on?</p>

<p style={{ marginBottom: "2.5rem" }}>FIND starts wherever the entrepreneur actually is. Sometimes that's an observation — something is clearly broken, inconvenient, or badly served. Sometimes it's a skill looking for a problem to attach itself to. Sometimes it's a product that already exists, built by a founder who never quite got around to asking whether anyone needed it.</p>

<p style={{ marginBottom: "2.5rem" }}>Wherever it starts, the job is the same. Separate the problem from the founder's preferred solution. Identify who might actually experience it. Look for real signals — urgency, existing behavior, money already being spent, workarounds already being cobbled together — rather than plausible-sounding stories.</p>

<p style={{ marginBottom: "2.5rem" }}>FIND is discovery, not validation. Its job is to produce a focused opportunity: what might be worth solving, for whom, why it might matter, and which assumptions now need to survive contact with reality.</p>

<p style={{ marginBottom: "3.5rem" }}>It does not earn the right to build. That comes later. FIND earns the right to test.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>REALITY-TEST — what's the evidence?</h2>

<p style={{ marginBottom: "2.5rem" }}>What is the evidence that this is a good idea, and what evidence could prove us wrong?</p>

<p style={{ marginBottom: "3.5rem" }}>This is where the idea leaves the founder's head and meets people who have no reason to be polite about it.</p>

<p style={{ marginBottom: "2.5rem" }}>I call this putting the idea on trial, because that's closer to what actually happens than "research" or "validation." A trial has two sides. Somebody has to argue against the idea, not just for it. You go looking for the customer, the alternative, the willingness to pay, the actual behavior — and you go looking, deliberately, for the evidence that could kill the thing you're excited about.</p>

<p style={{ marginBottom: "2.5rem" }}>Most founders skip that second half. They collect confirming evidence and call it research. Somebody said something encouraging in a coffee chat, and the idea quietly graduates to "validated" in their own head.</p>

<p style={{ marginBottom: "3.5rem" }}>That's not evidence. That's a compliment.</p>

<p style={{ marginBottom: "2.5rem" }}>Real reality-testing asks harder questions. Who actually has this problem, and how much does it cost them? What have they already tried, and why didn't it work? What would they need to see before they'd pay for this? What are the alternatives — real competitors and improvised workarounds — doing instead? Does the size of the opportunity justify the size of the commitment being asked of you?</p>

<p style={{ marginBottom: "3.5rem" }}>Evidence doesn't produce certainty. Nothing does, this early. What it produces is a better decision than the one conviction alone would have made for you.</p>

<p style={{ marginBottom: "1.75rem" }}>That decision has three honest outcomes.</p>

<p style={{ marginBottom: "1.25rem" }}><strong>PROCEED</strong> — enough evidence exists to justify the work of architecture.</p>

<p style={{ marginBottom: "1.25rem" }}><strong>EVOLVE</strong> — the opportunity still has potential, but something important has to change first: the customer, the offer, or the model.</p>

<p style={{ marginBottom: "3.5rem" }}><strong>STOP</strong> — the evidence doesn't justify further commitment.</p>

<p style={{ marginBottom: "2.5rem" }}>Stopping is not failure, and neither is evolving. An idea doesn't earn commitment simply by existing, and I've written elsewhere about why <Link href="/thinking/your-business-idea-is-worth-nothing" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">a business idea needs evidence before it deserves greater commitment</Link>. Refusing to keep funding a bad idea with more of your time is not the same as giving up on entrepreneurship. It's the same discipline, aimed at a different idea. If you want the longer version of how to actually run this stage, I've written a separate guide on <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">how to know if a business idea is actually viable</Link>.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>ARCHITECT — how does the business work?</h2>

<p style={{ marginBottom: "2.5rem" }}>How does the business need to work, as one coherent system?</p>

<p style={{ marginBottom: "3.5rem" }}>This is the part of FRAME that does the most work, and the part most often skipped entirely — which is strange, because it's also the part most people think they're already doing when they write a "business plan" or sketch a go-to-market slide.</p>

<p style={{ marginBottom: "3.5rem" }}>They're not. A business plan describes pieces. Architecture designs how the pieces work together.</p>

<p style={{ marginBottom: "1.75rem" }}>Here's what that means in practice.</p>

<p style={{ marginBottom: "1.75rem" }}>Change the customer, and you may have just changed the offer.</p>

<p style={{ marginBottom: "1.75rem" }}>Change the offer, and you may have just changed the price.</p>

<p style={{ marginBottom: "1.75rem" }}>Change the price, and the economics change with it.</p>

<p style={{ marginBottom: "1.75rem" }}>Change the economics, and the acquisition channel you could previously afford is suddenly out of reach.</p>

<p style={{ marginBottom: "3.5rem" }}>Change the acquisition channel, and the delivery model built for word-of-mouth customers may not survive paid ones.</p>

<p style={{ marginBottom: "2.5rem" }}>None of that is a list. It's a system. Customer, offer, positioning, pricing, journey, delivery, operating model, resources, partners, financial logic, revenue model, cash requirements — <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture</Link> is the discipline of designing how all of it holds together, not producing a folder of separate documents about each piece in isolation.</p>

<p style={{ marginBottom: "3.5rem" }}>This is also where the smallest credible version of the business gets defined, and the roadmap gets reverse-engineered from it. Not "what could we eventually build," but what has to become true first, and what that means has to happen before it.</p>

<p style={{ marginBottom: "2.5rem" }}>It's worth being precise about what this isn't. It isn't consulting, where someone studies your business from the outside and hands you a set of recommendations to implement yourself. It isn't coaching, where someone helps you find your own answers through better questions. Business Architecture is the work of actually designing the system, alongside the entrepreneur rather than instead of them, so that when the pieces meet reality, they're built to hold together — not to each look reasonable on their own.</p>

<p style={{ marginBottom: "2.5rem" }}>Architecture doesn't mean months of planning before anything happens. Sometimes the next architectural decision is talk to ten more customers. Sometimes it's build the smallest version that can take a payment. The point of architecture isn't to postpone reality. It's to reach reality with the fewest unnecessary casualties.</p>

<p style={{ marginBottom: "3.5rem" }}>The gate here is simple: <strong>READY TO BUILD</strong>. Not certain. Not risk-free. Coherent enough that moving into execution becomes a deliberate decision, not a hopeful one.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>MAKE — what needs to happen to make it exist?</h2>

<p style={{ marginBottom: "2.5rem" }}>What needs to happen, in what order, to make that architecture exist in reality?</p>

<p style={{ marginBottom: "3.5rem" }}>Architecture that never leaves the whiteboard is theory with good production values. MAKE is where it stops being theory.</p>

<p style={{ marginBottom: "2.5rem" }}>This is not "build everything the architecture describes." Most of it, at this stage, still doesn't deserve to exist yet. MAKE means sequencing execution around what the architecture says is necessary right now — building only what's required to reach the next real customer, the next transaction, the next piece of evidence — and resisting the urge to build the rest simply because you finally can.</p>

<p style={{ marginBottom: "2.5rem" }}>Go-to-market. First customers. The operating capability required to actually deliver what was promised. MAKE moves all of it from decision into consequence. Revenue starts. Delivery starts. And with them, real constraints show up that no amount of planning could have surfaced, because some things only become visible once customers, cash and time are all moving at once.</p>

<p style={{ marginBottom: "2.5rem" }}>Capital fits here too, when it fits at all. Not as a milestone every business is assumed to need on the way to legitimacy, but as one resource among several — used when the architecture has already shown why it's required and what it's meant to unlock. Raising money isn't a stage of MAKE. It's occasionally a tool inside it. If you built the product before you built the business around it, I've written a longer answer on <Link href="/answers/i-built-an-app-how-do-i-turn-it-into-a-business" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">how to turn an app into an actual business</Link> — most of it lives inside ARCHITECT and MAKE.</p>

<p style={{ marginBottom: "3.5rem" }}>The output of MAKE is a business that's no longer theoretical. It's exposed — to customers who owe you nothing, to operating constraints nobody warned you about, to transactions that either happen or don't. That exposure is the point.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>EVOLVE — what is the market saying?</h2>

<p style={{ marginBottom: "2.5rem" }}>What is the market saying, and what should we change, strengthen, scale, simplify or re-architect because of it?</p>

<p style={{ marginBottom: "3.5rem" }}>Once something exists, reality starts talking back.</p>

<p style={{ marginBottom: "1.75rem" }}>Customers behave differently than they said they would.</p>

<p style={{ marginBottom: "1.75rem" }}>Something sells that you almost didn't build.</p>

<p style={{ marginBottom: "1.75rem" }}>Something you were proud of sits there, unbought.</p>

<p style={{ marginBottom: "1.75rem" }}>Friction shows up in places the architecture never anticipated.</p>

<p style={{ marginBottom: "1.75rem" }}>Competitors move.</p>

<p style={{ marginBottom: "3.5rem" }}>The economics look different at ten customers than they did on a spreadsheet.</p>

<p style={{ marginBottom: "2.5rem" }}>I think of this as the market's echo. You built something, sent it out, and now something is coming back. EVOLVE is the discipline of actually listening to it, instead of defending the original plan out of attachment to having made it.</p>

<p style={{ marginBottom: "2.5rem" }}>Listening means watching what customers do, not only what they say. It means comparing the architecture against what's actually happening in the field, and being honest about the gap. Sometimes the honest answer is strengthen what's working, and leave the rest alone. Sometimes it's simplify, because half of what got built is now dead weight. Sometimes it's this needs to scale, carefully, before the constraints it's about to expose become the whole story. And sometimes the honest answer is a pivot, or a return to an earlier question entirely.</p>

<p style={{ marginBottom: "3.5rem" }}>That's the part people misunderstand about EVOLVE. It isn't only optimization — the comfortable work of tightening what already works. It's also the less comfortable work: admitting a piece of the architecture was wrong, and doing something about it before the market makes the decision for you.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>FRAME is a cycle, not a funnel</h2>

<p style={{ marginBottom: "2.5rem" }}>The letters are ordered. Businesses are not nearly so cooperative.</p>

<p style={{ marginBottom: "3.5rem" }}>Reality can send you backward, sideways, or straight into another FRAME entirely — and none of that means the method failed.</p>

<p style={{ marginBottom: "1.75rem" }}>If the problem turns out weaker than expected, you return to FIND or REALITY-TEST.</p>

<p style={{ marginBottom: "1.75rem" }}>If the customer was right but the offer wasn't, you return to ARCHITECT.</p>

<p style={{ marginBottom: "1.75rem" }}>If the architecture was sound but execution is failing, you return to MAKE.</p>

<p style={{ marginBottom: "1.75rem" }}>If traction exposes a constraint nobody saw coming, you EVOLVE the architecture before you scale straight into it.</p>

<p style={{ marginBottom: "3.5rem" }}>And if a genuinely new opportunity shows up along the way, you begin another FRAME.</p>

<p style={{ marginBottom: "2.5rem" }}>I call this Re-FRAME, and it isn't a failure state. It's what using new evidence to improve a business actually looks like in practice, as opposed to in a pitch deck.</p>

<p style={{ marginBottom: "3.5rem" }}>A funnel only moves in one direction, and calls anything else churn. FRAME expects to be revisited — because the business it's describing is alive, and living things don't hold still just because you've finished writing a chapter about them.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Who this is for</h2>

<p style={{ marginBottom: "2.5rem" }}>FRAME isn't only for the idea-stage founder staring at a blank page, although it works there too.</p>

<p style={{ marginBottom: "1.75rem" }}>It works for the aspiring entrepreneur asking whether there's actually a business inside an idea they can't stop thinking about.</p>

<p style={{ marginBottom: "1.75rem" }}>It works for the experienced professional who knows exactly what they're capable of, and has no idea yet what business should be built around it.</p>

<p style={{ marginBottom: "1.75rem" }}>It works for the founder who already built the product, and is only now discovering that shipping it was the easy part.</p>

<p style={{ marginBottom: "1.75rem" }}>It works for the existing small business where the pieces no longer fit together the way they used to.</p>

<p style={{ marginBottom: "1.75rem" }}>It works for the pivot — what's actually changed, and what that means has to be re-architected.</p>

<p style={{ marginBottom: "3.5rem" }}>And it works for growth, where the harder question isn't can we get bigger, but what has to change in the architecture before we do — so that getting bigger doesn't break the thing that made us worth scaling in the first place.</p>

<p style={{ marginBottom: "3.5rem" }}>Different entry points. Same five questions, asked in whatever order reality currently requires.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What FRAME is not</h2>

<p style={{ marginBottom: "1.75rem" }}>It's not a guaranteed formula. Evidence reduces avoidable guessing. It doesn't eliminate uncertainty, and nobody should promise you it will.</p>

<p style={{ marginBottom: "1.75rem" }}>It's not a rigid five-step funnel. It's closer to five lenses you keep picking back up, in whatever order the business currently needs.</p>

<p style={{ marginBottom: "1.75rem" }}>It's not a business plan with a better name. A plan describes. Architecture designs how the parts actually work together.</p>

<p style={{ marginBottom: "3.5rem" }}>And it's not permission to build first and think later. Execution follows architecture, and stays answerable to whatever evidence shows up next.</p>

<p style={{ marginBottom: "1.75rem" }}>An idea is not a business. A product isn't automatically one either, and neither is an MVP, a logo, or a business plan sitting quietly in a folder nobody reads.</p>

<p style={{ marginBottom: "2.5rem" }}>A business is what's left once an idea has survived evidence, been designed as a system, made to exist, and adjusted based on what actually happened.</p>

<p style={{ marginBottom: "1.75rem" }}>FRAME is the discipline I use to get there.</p>

<p style={{ marginBottom: "3.5rem" }}>And the one I keep using once we arrive — because arriving is never quite as permanent as it looks from the outside.</p>

            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ARTICLE FOOTER
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
                  <Link href="/thinking/the-fastest-way-to-build-the-wrong-business" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        The Fastest Way to Build the Wrong Business
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Why sequence, not effort, is what separates a business from a pile of components.
                      </p>
                    </motion.div>
                  </Link>

                  <Link href="/thinking/your-business-idea-is-worth-nothing" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
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

                  <Link href="/thinking/the-being-economy" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        The Being Economy
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        What becomes economically valuable as knowledge and execution grow more abundant.
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
