/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/i-built-an-app-how-do-i-turn-it-into-a-business";
  const answerTitle = "I Built an App. How Do I Turn It Into a Business?";

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
                  I Built an App. How Do I Turn It Into a Business?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  If you built an app, you have built an app.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  You have not necessarily built a business.
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
                That distinction can be frustrating, especially after months of designing, coding, testing and finally getting the product to work.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The app exists.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It looks good.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It does what you intended.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe people have even told you they like it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then comes the uncomfortable question:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Where are the customers?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                This is where many founders discover that building the product was only one part of building the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The next step is not simply to market the app harder.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is to determine whether you can architect a viable business around what you have built.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>An app is a product, not a business</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                A product is something people can use or buy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A business is the system around it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That system needs customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An offer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Pricing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A way to acquire customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A way to deliver value.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Economics that make sense.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Resources.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And eventually, enough revenue to sustain what you are building.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your app may become the centre of that system.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But the app alone is not the system.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This distinction matters because founders often respond to weak traction by improving the product.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Another feature.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A better interface.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                More integrations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A redesigned website.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A new onboarding flow.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Version 2.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Version 3.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes those changes are necessary.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But sometimes you are improving the wrong part of the business.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Don't immediately assume you have a marketing problem</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                You launched.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Nobody bought.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Therefore:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                We need marketing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But before spending money on advertising, hiring a salesperson, producing content or paying an agency, ask a more uncomfortable question:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Is marketing actually where the problem begins?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps the wrong customers are being targeted.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps the problem is not important enough.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps the offer is unclear.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps people like the product but do not value it enough to pay.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps the pricing does not match the customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps there is no compelling reason to switch from what they already use.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps the market is too small.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Perhaps the buying process is more complicated than expected.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or perhaps the product genuinely needs to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Marketing can amplify a business that makes sense.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It can also amplify the fact that nobody wants what you built.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Before increasing the volume, understand the signal.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Go back to the customer</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                If you built before deeply understanding the customer, this is where I would return.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not to another brainstorming session.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                To actual people.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who did you build this for?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Be specific.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Small businesses" is not a customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Entrepreneurs" is not a customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Everyone who wants to be more productive" is definitely not a customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who experiences the problem strongly enough to care?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are they doing today?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What does the current solution cost them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why is the current solution inadequate?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What would make them change?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who makes the buying decision?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who actually uses the product?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What would prevent them from adopting yours?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The objective is not to convince people that your app is good.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is to understand their reality well enough to determine whether your app deserves a place inside it.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Talk to people who did not buy</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Founders naturally like talking to people who love the product.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The more valuable conversations may be with the people who didn't.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone visited your website and disappeared.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone tested the app and never returned.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone attended the demo and didn't buy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone said the product was interesting but would not pay for it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone chose a competitor.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone decided to continue using a spreadsheet instead.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                These conversations can hurt.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Good.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You are looking for information, not applause.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The purpose of customer research is not to prove that you built the right thing.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is to discover what is actually happening.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Find the reason to move</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Your customer already has a solution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Even if that solution is terrible.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They may use another application.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A spreadsheet.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                WhatsApp.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Email.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An employee.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An agency.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A notebook.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A complicated manual process.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or they may simply tolerate the problem.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That existing behaviour matters.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Because your app is not competing only against other apps.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is competing against doing nothing differently.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                So ask:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why would somebody change what they are already doing to use this?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Saving three minutes per month probably isn't enough.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Saving a company $50,000 might be.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Removing a serious operational risk might be.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Helping someone generate substantially more revenue might be.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Making something previously impossible possible might be.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The stronger the reason to move, the easier the rest of the business becomes to architect.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Turn the app into an offer</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                A product and an offer are not quite the same thing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your app may contain 25 features.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your customer does not necessarily want 25 features.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They want an outcome.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So instead of explaining everything the app does, determine what you are actually selling.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                To whom?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For what problem?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For what outcome?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At what price?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Under what conditions?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why this solution rather than the alternatives?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is where positioning, packaging and pricing begin to matter.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may even discover that different customers need different versions of the offer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The underlying technology may remain the same.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The business around it may change significantly.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Find out whether people will actually pay</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Downloads can feel exciting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Registrations can feel exciting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Website traffic can feel exciting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                None of them necessarily mean you have a business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Eventually, somebody needs to pay.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is why one of the most valuable things you can do is create an opportunity for real customers to make a real purchasing decision.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Not:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Would you pay $29 per month for this?"
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "It costs $29 per month. Would you like to start?"
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The difference is enormous.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                One asks for an opinion.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The other asks for a decision.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You do not necessarily need thousands of customers at this stage.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You need enough real behaviour to begin learning what the market is telling you.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your first customers are research</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Early customers matter for revenue.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But they are also an extraordinary source of evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How did they find you?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why did they buy?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What almost stopped them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Which feature do they actually use?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Which features do they ignore?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What outcome are they trying to achieve?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How quickly do they experience value?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Do they stay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Would they recommend it?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What would make them cancel?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What else are they comparing you with?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your first customers can help reveal the business hidden around the product.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Listen carefully.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Understand how you will acquire customers</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                A viable business needs a credible path from:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone who does not know you exist
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                to:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Someone who pays you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How will that happen?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Search?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Content?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Direct sales?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Partnerships?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Referrals?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Marketplaces?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Communities?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Distributors?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Paid advertising?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Outbound prospecting?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Product-led growth?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Something else?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The correct answer depends heavily on the customer, product, price and buying process.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A $9 consumer app and a $50,000 enterprise platform should not have the same customer acquisition architecture.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is another reason copying another startup's growth strategy can be dangerous.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Their business may look similar from the outside while operating completely differently underneath.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Check whether the economics work</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Suppose people buy.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Good.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Now ask whether the business can make economic sense.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What does a customer pay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Monthly?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Annually?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Once?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How long might they stay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What does it cost to serve them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What infrastructure costs increase as usage grows?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much customer support is required?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much does it cost to acquire a customer?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How many paying customers would you need to support the business?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You do not need perfect answers yet.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You need enough visibility to identify dangerous assumptions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A business that acquires a customer for $200, earns $20 from them and loses them after two months does not have a marketing problem.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It has mathematics.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Be willing to change what you built</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This is often the hardest part.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You spent months building the app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe years.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You are proud of it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You should be.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Building something from nothing is difficult.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But the amount of time you invested does not obligate the market to want it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And it does not obligate you to keep defending the original version.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may discover that the customer needs only 20% of what you built.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or that a different customer values it much more.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or that the technology should support a service rather than be sold as standalone software.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or that one small feature is more valuable than the entire platform.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or that the pricing model needs to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or that the app should become something completely different.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That does not necessarily mean the original work was wasted.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It means the market gave you new information.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The question becomes:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Are you building the product you originally imagined, or are you building the business the evidence is revealing?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Those are not always the same thing.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>AI makes this problem more important, not less</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                AI has dramatically reduced the barrier to building software.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People who could never have created an application alone can now prototype and launch products remarkably quickly.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is extraordinary.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But when building becomes easier, more things get built.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And when more things get built, simply having a product becomes less distinctive.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The difficult questions move somewhere else.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who needs this?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why now?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why yours?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Will they pay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How will you reach them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you deliver the promised value?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can the economics work?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you create enough evidence to justify continuing?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can help you build the product.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can help you research, analyze, calculate, write, prototype and iterate.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But it cannot manufacture genuine customer demand simply because the application exists.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The market still gets a vote.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                As <Link href="/thinking/the-being-economy" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">execution becomes easier</Link>, what you choose to build — and why — becomes more important, not less.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>This is where Business Architecture begins</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                If you already built the app, you do not necessarily need to throw it away and start again.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You need to step back far enough to see the system around it.
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
                Product.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Pricing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Value delivery.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customer acquisition.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Economics.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Resources.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Each part affects the others.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture</Link>.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The objective is not to produce a beautiful diagram of the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It is to make the pieces coherent enough that the business has a credible way to work.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes the existing product fits beautifully.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes it needs to evolve.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes the business around it needs to change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And occasionally, the evidence tells you that <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">there is not a viable business</Link> there at all.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That possibility should not be hidden.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It should be discovered before you spend another year building.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>So, how do you turn your app into a business?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Stop looking only at the app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Look at the business around it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Identify the specific customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Understand why they would move.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Turn the product into a clear offer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Test whether people will actually pay.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn aggressively from the first customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Determine how customers can be acquired.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Understand the economics.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Look at how the value will actually be delivered.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Expose your assumptions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Collect evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And be willing to change what you built when reality tells you something important.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You have already done something difficult.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You built the product.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Now comes the next challenge:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Build the business around it.
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
                    Have you built something and are now trying to figure out the business around it?
                  </p>
                  <p className="text-lg font-light leading-relaxed text-[#1a1816]/70">
                    If you're trying to determine who the customer really is, how to commercialize what you've built, or what needs to change before you invest further,{" "}
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
