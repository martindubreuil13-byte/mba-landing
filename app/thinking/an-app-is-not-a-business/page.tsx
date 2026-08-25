/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/an-app-is-not-a-business";
  const articleTitle = "An App Is Not a Business";

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
                  An App Is Not a Business
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Building something is not the same as building a business.
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
                  <p className="text-sm text-[#1a1816]/65">August 25, 2026</p>
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
                I keep saying something that irritates software founders more than it probably should.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An app is not a business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Neither is a website.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Neither is a course.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Neither is a consulting offer.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Neither is whatever you managed to build over the weekend after discovering that AI can now write most of the code for you.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Those are products.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some might become very successful products.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But building a product and building a business are not the same achievement.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And as AI makes building ridiculously easy, understanding the difference is becoming more important, not less.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>We confuse building, selling and building a business</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Suppose you spend six months developing an app.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You launch it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Congratulations.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You have a product.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Someone gives you $20 for it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Even better.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You have a transaction.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Then 1,000 people buy it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Now you have $20,000 in revenue.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Excellent.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You have evidence that people are willing to pay for what you created.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But I would still ask some annoying questions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who exactly are those customers?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why did they buy?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you find another 1,000?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much does finding them cost?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you reliably convert them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Does enough money remain after acquiring and serving them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why will customers continue choosing you?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What happens when competitors copy you?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What happens when customer behaviour changes?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What happens when AI makes half your functionality available for free?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And perhaps the most uncomfortable question:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What happens when this product stops being relevant?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Because eventually it will.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Every product has a lifecycle.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A business needs the capacity to survive beyond it.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>So what is a business?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                For entrepreneurs, I use a deliberately simple definition:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>
                A business is a repeatable and sustainable system for creating, delivering and capturing value.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The important word isn't app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It isn't technology.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It isn't even product.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It's system.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A real business has several connected parts.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There is someone with a problem, need or aspiration.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There is something valuable enough for that person to act.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There is a way to reach them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There is a reason for them to choose you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There is a way to deliver what you promised.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There is an economic model that leaves enough money behind for the business to survive.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And there is the ability to learn and adapt when reality changes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The product sits inside that system.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes it is the centre of it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But it is still only one part.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's where Business Architecture begins.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Most entrepreneurs architect backwards</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                The usual sequence looks something like this:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                IDEA → BUILD → LAUNCH → NOW HOW THE HELL DO I SELL THIS THING?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That last question is doing quite a lot of work.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who is it for?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What sufficiently important problem does it solve?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why would somebody change what they're currently doing?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Where are these people?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How do you reach them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What will they pay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why would they choose you?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you acquire them economically?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you deliver consistently?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Can the business make money after all the costs are counted?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                These aren't marketing details to figure out after you've built the product.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                They are the business.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And that's why Business Architecture should happen before, around and beyond product development.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You are not simply deciding what to build.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You are working out how the business itself should work.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A scalable product isn't necessarily a scalable business</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Software founders particularly love this one.
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                "But my app is scalable."
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Wonderful.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                So is a stadium with 50,000 empty seats.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The seats aren't the problem.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The people are.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Your software might technically serve 100,000 customers without much additional infrastructure.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That's useful.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But can your business find those 100,000 people?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can it persuade enough of them to buy?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can it acquire them at a cost that makes sense?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can it retain them?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Can it continue creating enough value for them?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Technical scalability is a characteristic of the product.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Business scalability is the ability of the whole system to grow economically.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Those are very different things.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>AI is making this mistake easier</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                This is where the problem becomes particularly relevant now.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Building used to be expensive.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You needed developers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Designers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Infrastructure.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Money.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Time.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Today, one reasonably capable entrepreneur with AI-assisted coding and a collection of tools can build something surprisingly sophisticated in days.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I think that's extraordinary.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The distance between imagination and creation is collapsing.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But there is a catch.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                When building becomes easier, building the wrong thing becomes easier too.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You prompt it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You build it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You deploy it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You connect Stripe.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You announce your startup.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                There is only one inconvenient participant missing from this beautifully efficient process.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An app at the beginning is essentially an assumption written in code.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An assumption that somebody has the problem.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An assumption that the problem matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An assumption that your solution is better enough for them to change behaviour.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An assumption that they'll pay.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An assumption that you can reach enough of them.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                An assumption that the economics work.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                AI can dramatically accelerate execution.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It cannot magically turn those assumptions into evidence.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The first sale matters. A lot. But as I've written before, as assumptions start looking like evidence, what actually deserves to become a business needs architecture. There's an {" "}
                <Link href="/thinking/your-business-idea-is-worth-nothing" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  earlier piece on testing whether an idea has a real chance of becoming one
                </Link>.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Revenue is evidence. It isn't the whole architecture.</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                The first sale matters.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A lot.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It means reality has finally entered the conversation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                More sales create stronger evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Repeatable acquisition creates stronger evidence again.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Healthy economics tell us something even more interesting.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But revenue alone still doesn't tell us whether we've built something durable.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                If acquiring a $100 customer consistently costs $140, congratulations.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You've created a remarkably efficient machine for converting $140 into $100.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Scale carefully.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A functioning business needs more than revenue.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It needs demand.
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
                Economics.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capabilities.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learning.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Adaptability.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And those pieces need to work together.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's architecture.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Products have lifecycles</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                This is the part entrepreneurs often ignore while things are going well.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Every product changes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some products survive for decades.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some disappear in eighteen months.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some become irrelevant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some get copied.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some are replaced by new technology.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some are destroyed by changing customer behaviour.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And occasionally, a company deliberately kills its own successful product because it has something better coming next.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The question isn't whether your current product will change.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It will.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The better question is:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What remains when it does?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Imagine two companies selling almost identical successful apps.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Both have customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Both generate revenue.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Both are profitable.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Then the market changes and demand begins declining.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Company A understands its app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Company B understands its customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It knows why they bought.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It understands their changing problems.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It has relationships.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Distribution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Market knowledge.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operational capability.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Trust.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Data.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A way to identify new opportunities.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And the ability to develop and commercialise another solution.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Company A asks:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                How do we save the app?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Company B asks:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                What do our customers need next?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Those are two fundamentally different businesses.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>If your product disappeared tomorrow, what would be left?</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                I think this is one of the most useful questions you can ask an entrepreneur.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Take away your current product.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What's left?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Nothing?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's worth thinking about.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Or do you still have:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customers?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Market knowledge?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Distribution?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Relationships?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Trust?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Brand?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Data?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capabilities?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operational knowledge?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Understanding of a valuable problem?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A reliable way to create, test and commercialise something new?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Now we're getting somewhere.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Because those things can survive Product 1.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And they can help create Product 2.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Then Product 3.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The products move through their lifecycles.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The business continues creating value.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>That's what Business Architecture is for</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                Business Architecture is not drawing complicated diagrams about a company.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                At least not the way I practice it with entrepreneurs.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It answers something much more practical:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                How should this business actually work?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who are we creating value for?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What problem are we solving?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are we selling?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why does it matter?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How do customers find us?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why do they buy?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How do we deliver?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How does money move through the business?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What needs to exist operationally?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What capabilities do we need?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What could break?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What needs to happen first?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And how does the business continue adapting as reality changes?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The product is part of those answers.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It isn't all of them.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's why building an app doesn't mean you've built a business.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Build the business around the product</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                So yes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build your app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Launch it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sell it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Celebrate every customer.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Make money.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Please make money.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I'd much rather see an entrepreneur with an ugly product generating real revenue than another founder calling themselves CEO because Canva gave them a nice logo.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But don't stop architecting when the product works.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Ask what needs to exist around it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Demand.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Acquisition.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Delivery.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Economics.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capabilities.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learning.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Adaptation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build those things deliberately.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Because the thing you're selling today will eventually change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Products have lifecycles.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Businesses have the opportunity to survive them.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And the difference between the two is architecture.
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
