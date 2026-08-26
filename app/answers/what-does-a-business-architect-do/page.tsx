/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/what-does-a-business-architect-do";
  const answerTitle = "What Does a Business Architect Do?";

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
                  What Does a Business Architect Do?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  A Business Architect works out how a business should actually work — and what needs to happen to make it real.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  For an entrepreneur, that means looking beyond the product or idea and connecting the customer, offer, pricing, economics, acquisition, delivery, operations and execution into one coherent business.
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
                The job is not to make the business look organized.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is to make the business make sense.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A Business Architect starts before there is much to architect</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                This is where my interpretation of Business Architecture differs from the traditional corporate discipline.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Inside an established organization, a Business Architect may already have customers, products, teams, systems, processes and strategy to work with.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                An entrepreneur may arrive with this:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                "I have an idea."
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Excellent.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Now we have an assumption.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes they don't even have the idea.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                They have expertise. Experience. Frustration with corporate life. A problem they've noticed. Something they want to change.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And somewhere inside that mess there might be a business.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The first job isn't building it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It's finding out.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>1. Architect the entrepreneur</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Before asking what business should be built, I want to understand who is going to build it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                This gets ignored surprisingly often.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What does the entrepreneur actually want?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What kind of life are they trying to create?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are they good at?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What do they hate doing?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What resources do they have?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What risks can they realistically take?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much money do they need the business to produce?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                How quickly?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Do they want five employees or five hundred?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Do they even want employees?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Because you can design a perfectly viable business that creates a miserable life for the person running it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That isn't particularly clever architecture.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The business has to work economically.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But it also has to make sense for the entrepreneur behind it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I call this Founder Architecture.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Architect the entrepreneur before the enterprise.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>2. Architect the idea</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Then we can become annoying.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Someone has a brilliant idea.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Maybe it is brilliant.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Maybe it isn't.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                At this stage, neither of us knows.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                So instead of immediately turning the idea into a website, app, company or pitch deck, we start removing assumptions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who might buy this?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What problem does it solve?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How important is that problem?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are people doing today instead?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why would they change?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Are there enough potential customers?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can we reach them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What might they pay?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Can the economics plausibly work?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What would have to be true for this idea to become a business?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                This isn't about proving the entrepreneur right.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Quite the opposite.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                We're trying to discover where they might be wrong before being wrong becomes expensive.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes the result is:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                Yes. Keep going.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                Yes, but not like this.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And sometimes:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                No.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That last answer can be enormously valuable.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Killing a weak idea before spending six months building it is progress, even if it doesn't produce a particularly exciting LinkedIn announcement.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>3. Architect the business</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Once an idea survives enough contact with reality, the question changes.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It is no longer simply:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                Is there something here?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Now we ask:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                How should this business actually work?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                This is the core Business Architecture work.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                We connect things entrepreneurs often treat as separate projects:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Problem.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Offer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Value.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Pricing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Revenue.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Acquisition.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Conversion.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Delivery.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capabilities.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Economics.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Execution.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                None of these decisions lives alone.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Change the customer and the offer may need to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Change the offer and pricing may change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Change pricing and the acquisition economics may stop working.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Change the delivery model and suddenly you need different capabilities.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                This is why randomly "working on the business" can create a lot of activity without creating much business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The parts need to fit.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That is architecture.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                If you want the fuller definition, I {" "}
                <Link href="/answers/what-is-business-architecture" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  explain that separately in What Is Business Architecture?
                </Link>
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>4. Architect the sequence</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Knowing what the business should eventually look like still isn't enough.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Because you probably shouldn't build all of it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Not yet.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A Business Architect asks:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What needs to happen first?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What depends on something else?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are we still assuming?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Which assumption could kill the business?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What is the cheapest useful way to test it?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What should we deliberately not build yet?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That last question matters more now because AI has made building almost ridiculously easy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Website?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Prototype?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                App?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Probably build that too.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The danger is that entrepreneurs can now execute bad decisions at extraordinary speed.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                So execution needs sequence.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I like to work backwards from the desired outcome and identify the milestones that need to become true along the way.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Then we move forward through them.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Not because the roadmap will survive reality perfectly.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It won't.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But because deliberate movement beats entrepreneurial pinball.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>5. Help make it exist</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                This is where the distinction becomes particularly important to me.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Architecture cannot end with a beautiful plan.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                At some point somebody has to do the bloody work.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Talk to customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Test the proposition.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build the first version.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Create the website.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Develop the sales process.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Set up operations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Find prospects.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Make the offer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Get rejected.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Adjust.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Try again.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Get the first customer.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Then find out whether the first customer was evidence or luck.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                This is why my own work overlaps coaching, consulting and execution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes the entrepreneur needs a question.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes expertise.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes a framework.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes someone beside them saying:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                No. Don't spend three weeks doing that. Do this first.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And sometimes they need practical help making something exist.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The architecture becomes useful only when reality starts answering back.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What doesn't a Business Architect do?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                A Business Architect is not simply:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A business coach.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A consultant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A strategist.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A project manager.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A marketer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A financial modeller.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A product manager.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A web developer.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Any of those disciplines may become relevant.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But the Business Architect's job is not to optimize one piece independently.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It is to understand how the pieces affect one another and keep the whole business coherent.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A brilliant marketing campaign attached to terrible economics is not a win.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Neither is a beautiful product nobody sufficiently wants.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Neither is rapid growth the business cannot operationally deliver.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Local optimization can make the whole system worse.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Architecture keeps looking at the whole.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Business Architect versus consultant versus coach</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                There is overlap, and pretending otherwise would be silly.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A coach typically helps someone think, decide and act.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A consultant typically brings expertise, analysis and recommendations.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A Business Architect may do both.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But the orientation is different.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The Business Architect keeps asking:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What should exist?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How should it work?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What needs to happen next?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And then keeps connecting the answers.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                In my own practice, there is another difference.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                I don't particularly like disappearing when execution starts.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A strategy that cannot survive implementation wasn't much of a strategy.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                So the work can continue from thinking into making.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Not doing the entrepreneur's business for them.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Building it with them.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What does a Business Architect actually produce?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes diagrams.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes financial models.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes research.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes roadmaps.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes customer hypotheses, offer structures, pricing logic, validation experiments, operating models or execution plans.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But those are artifacts.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                They are not the job.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The real outputs are better decisions and a more coherent business.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Ideally, we move from:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                I have an idea.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                to:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                We have evidence.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                to:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                We understand how this business should work.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                to:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                Now let's make it exist.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And eventually:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                It's working. What needs to change next?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Because architecture doesn't end at launch.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Reality has an irritating habit of continuing.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A simple way to think about the role</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                If someone asks me what a Business Architect does for an entrepreneur, my shortest answer is:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                A Business Architect helps determine what business should exist, how it should work, and what needs to happen to make it real.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That can begin before the business exists.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can continue through validation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Through design.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Through execution.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And through adaptation once customers and the market start telling us what we got wrong.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Because they will.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That's not failure.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's evidence.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And good architecture knows what to do with it.
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

              {/* Related Answers & Content */}
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

                  <Link href="/thinking/an-app-is-not-a-business" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
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
