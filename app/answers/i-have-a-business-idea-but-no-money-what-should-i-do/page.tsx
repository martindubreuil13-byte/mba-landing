/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/i-have-a-business-idea-but-no-money-what-should-i-do";
  const answerTitle = "I Have a Business Idea but No Money. What Should I Do?";

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
                  I Have a Business Idea but No Money. What Should I Do?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  If you have a business idea but do not have enough money to build it, your first question should probably not be:
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-4">
                  "Where do I find the money?"
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-4">
                  It should be:
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-4">
                  "How much money do I actually need to take the next meaningful step?"
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
                  <p className="text-sm text-[#1a1816]/65">September 4, 2026</p>
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

              <p style={{ marginBottom: "1.75rem" }}>
                Those are two very different questions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Many entrepreneurs look at the finished version of the business they imagine, calculate everything required to build it, and conclude that they need funding before they can start.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes they are right.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Often, they are trying to fund the entire journey before proving the first step.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>You may not need to fund the whole business yet</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Imagine your complete business would eventually require $500,000.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That does not necessarily mean you need $500,000 today.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need $5,000 to test the first important assumption.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or $500.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes you may need almost nothing except time, conversations and access to potential customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The objective at the beginning is not necessarily to build the entire business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is to create enough evidence to justify the next commitment of money, time and resources.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                This is an important principle in <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture</Link>:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Do not automatically architect the business around the resources you wish you had. Start by understanding what can be done with the resources you actually have.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Then determine what additional resources are genuinely required.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Break the business into smaller pieces</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Large business ideas become intimidating when you treat them as one giant project.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So break the idea down.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What needs to be true for this business to work?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What do you need to know first?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What could you test before building the full product?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What is the smallest credible version that could create value for a customer?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Could part of the service initially be delivered manually?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Could you sell to five customers before building technology for 5,000?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Could you test one market before launching nationally?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Could you import a small commercial quantity before committing to a container?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Could you prove demand before investing heavily in infrastructure?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is not about thinking small.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is about making the first move small enough to learn from it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You can keep the big vision.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You do not necessarily need to fund the big vision on day one.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Investors are only one source of capital</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                When entrepreneurs tell me they need funding, they often mean:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "I need an investor."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But equity investment is only one way of funding a business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Depending on the business, its stage and what the money is needed for, alternatives may include:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - bootstrapping from your own income or savings;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - generating revenue from early customers;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - pre-orders or deposits;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - customer-funded pilots;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - supplier credit or extended payment terms;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - negotiating deposits and payment schedules;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - strategic partners;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - joint ventures;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - bank or business loans;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - asset or equipment financing;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - grants and government programs;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - revenue from a simpler first offer that helps finance the larger business;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - or a combination of several of these.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                None of these is automatically better than investment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And not every option will be appropriate for every business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The point is that "I don't have an investor" and "I cannot build this business" are not the same statement.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Sometimes the architecture itself can reduce how much money you need</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This is where the problem becomes more interesting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Instead of only asking:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How do we finance this business?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Ask:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can we architect the business differently so it requires less financing?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe you manufacture instead of owning a factory.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe you use an existing distribution network instead of building one.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe a strategic partner already owns an asset you need.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe suppliers will give you 60-day terms while customers pay deposits.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe the first version is a service before becoming software.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe the marketplace begins manually before expensive automation is built.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe you launch in one city instead of five countries.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe you sell before you scale.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Those are not simply financing decisions.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                They are Business Architecture decisions.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The way the business is designed changes the amount of capital it requires.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Customer money is also money</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This sounds obvious.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But it is surprisingly easy to forget.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Entrepreneurs sometimes spend months looking for someone to invest in their business before seriously attempting to find someone willing to buy from it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customers can be one of the most powerful sources of early capital.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A paying customer does more than provide cash.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They also provide evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They demonstrate that someone outside your friends, family and pitch deck sees enough value to exchange money for what you are offering.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That evidence can help you improve the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And if you eventually decide to raise investment, it can also make a very different conversation with investors possible.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Compare:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "I have an idea and need $500,000 to build it."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                with:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                "We tested the idea with 13 customers. Five paid for the first version. Here is what we learned, here is what they are asking for next, and here is what additional capital would allow us to accelerate."
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Those are not the same proposition.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>But some businesses genuinely need capital</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                We should not romanticize bootstrapping.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some businesses cannot realistically be started with a laptop and determination.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Manufacturing may require equipment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Import businesses may require inventory.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Restaurants need premises and fit-outs.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Regulated industries may require certifications.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Hardware businesses may require tooling and production.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Technology businesses may require specialist development.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Working capital alone can become substantial.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes the conclusion really is:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This business requires capital before it can move forward.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is perfectly legitimate.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But even then, <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture asks another question</Link>:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What can we prove before asking someone else to finance the expensive part?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps customer demand.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps willingness to pay.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps technical feasibility.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps supplier capability.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps a prototype.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps letters of intent.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps a small pilot.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Perhaps early revenue.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Every important uncertainty you remove can change both the amount of capital you need and the strength of your case for receiving it.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Be careful about giving away equity too early</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Investment is not free money.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An investor receives something in return.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Usually ownership.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes influence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes governance rights.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes expectations about growth, timing and eventual exit.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That may be exactly what the business needs.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A strong investor can bring far more than capital: experience, relationships, credibility, distribution and access to future financing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But raising equity simply because you cannot think of another way to fund the first step can become very expensive capital.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Before giving away part of the business, understand what the money is actually buying.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Is it helping you discover whether the business works?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Or is it accelerating something for which you already have meaningful evidence?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Those are very different uses of capital.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Money is part of the architecture</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Funding should not sit outside the business model as something you figure out after everything else.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is part of the architecture.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                If the business requires resources you cannot access, the current architecture may not be executable.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That does not automatically mean the idea is dead.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It may mean the sequence needs to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The first product may need to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The delivery model may need to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The partners may need to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The market entry strategy may need to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or the business may need to generate evidence before it earns the right to consume more capital.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is why I prefer to think in stages:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What do we need to prove?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What do we need to build?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What resources does that require?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What is the most appropriate way to fund those resources?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Not automatically:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                I have an idea → I need an investor.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>So what should you do if you have a business idea but no money?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Do not abandon the idea simply because you cannot finance the finished version today.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But do not assume somebody else should finance it either.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Start by understanding the business you are actually trying to create.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Identify the assumptions that matter most.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Determine what you can test without major investment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Break the journey into smaller stages.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Look at the resources already available to you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Explore different ways of financing different parts of the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Generate customer evidence as early as possible.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And only then determine how much outside capital you genuinely need.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may discover that you need an investor.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may discover that you need a loan.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need a partner.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need $500,000.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or you may discover that what you really needed was a different first move.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Lack of money does not automatically kill a business idea.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Sometimes it forces you to architect it properly.
              </p>

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
                  <Link href="/answers/what-does-a-business-architect-do" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        What Does a Business Architect Do?
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        How a Business Architect works from entrepreneur and idea through architecture and execution.
                      </p>
                    </motion.div>
                  </Link>
                  <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        How Do I Know If My Business Idea Is Actually Viable?
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Learn how to test whether a business idea is viable using evidence, customer demand, willingness to pay, reachability and basic business economics.
                      </p>
                    </motion.div>
                  </Link>
                  <Link href="/answers/how-do-i-get-investors-for-my-business-idea" className="group block" style={{ marginTop: "2rem" }}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        How Do I Get Investors for My Business Idea?
                      </h3>
                    </motion.div>
                  </Link>
                </div>
              </div>

              <div className="pt-8 border-t border-[#1a1816]/8 space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <p className="text-lg font-light leading-relaxed text-[#1a1816]">
                    Have an idea you're trying to figure out?
                  </p>
                  <p className="text-lg font-light leading-relaxed text-[#1a1816]/70">
                    If you're trying to determine what to build, how to fund it, or whether there is a viable business inside the idea,{" "}
                    <Link href="/lets-talk" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">
                      let's talk about your idea
                    </Link>.
                  </p>
                </motion.div>
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
