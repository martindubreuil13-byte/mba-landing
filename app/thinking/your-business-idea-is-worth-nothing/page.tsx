/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/your-business-idea-is-worth-nothing";
  const articleTitle = "Your Business Idea Is Worth Nothing";

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
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Business Idea Architecture</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Your Business Idea Is Worth Nothing
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  An idea doesn't become valuable because you had it. First, it has to survive reality.
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
                Every day, millions of people have business ideas.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                In the shower. On the train. Over dinner. During another meeting they don't particularly want to be in.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A service.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A product.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                A better way of doing something.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And then comes the dangerous thought:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>
                This could be big.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Maybe.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But right now, it's worth absolutely nothing.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Not because it's a bad idea.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Because it's still an idea.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Ideas are a commodity</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                We give ideas far too much importance.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People protect them. Hide them. Refuse to talk about them. Some want an NDA signed before they'll even tell you what they're thinking.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They're terrified somebody might steal their idea.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Relax.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There's a pretty good chance somebody, somewhere, has already thought about something remarkably similar.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Ideas aren't particularly rare.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People who turn them into businesses are.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Until your idea leaves your head, it creates no value for a customer. It generates no revenue. It employs nobody. It solves no problem.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It's a thought.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Maybe a bloody good one.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But still a thought.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>There is a huge gap between an idea and a business</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Having an idea feels like progress because suddenly you can see something.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You can imagine the product.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The success.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You can probably already see the website.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And, naturally, the logo.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Because apparently every business desperately needs a logo before it needs a customer.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But imagination is the easy part.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Somewhere between:
              </p>

              <p style={{ marginBottom: "1.75rem", marginLeft: "1.5rem", fontStyle: "italic" }}>
                "I've got an idea."
              </p>

              <p style={{ marginBottom: "2.5rem", marginLeft: "1.5rem", fontStyle: "italic" }}>
                and
              </p>

              <p style={{ marginBottom: "2.5rem", marginLeft: "1.5rem", fontStyle: "italic" }}>
                "I've got a business."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                something important has to happen.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The idea has to leave the comfort of your head and meet reality.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And reality isn't particularly interested in how excited you are.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who is this really for?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What problem are you solving?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Does that problem matter enough for someone to do something about it?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are they doing today instead?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can you reach them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Will they pay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Can the economics work?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are you assuming?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And perhaps the most uncomfortable question:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>
                What evidence would prove that you're wrong?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is where enthusiasm starts becoming something more useful.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Evidence.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>I call this Business Idea Architecture</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Not because entrepreneurs desperately need another impressive-sounding framework.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                We have enough of those.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                I call it Business Idea Architecture because there is real work between having an idea and deciding that it deserves to become a business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The idea needs to be challenged.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Pulled apart.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Looked at from angles you probably haven't considered.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some assumptions will survive.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Others won't.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The customer may change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The offer may change.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The economics may change.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes the original idea changes so much that what eventually gets built barely resembles what started the conversation.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Good.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The objective isn't to protect the idea.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                The objective is to find the business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And sometimes we discover there isn't one.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Sometimes the best outcome is killing it</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This is part of what I do for a living.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People come to me because they want to build something.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes they have a reasonably developed idea.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes it's a collection of thoughts they've been carrying around for years.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes it's three thoughts held together by enthusiasm.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That's fine.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                We start there.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                My job isn't to tell someone their idea is brilliant.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                There are already plenty of people — and a few AI models — willing to do that for free.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                My job is to explore it with them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Challenge it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Push against it.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Find the things we're assuming simply because nobody has bothered questioning them yet.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not because I'm trying to kill the idea.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I'm trying to find out whether it has a real chance of becoming a business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes it gets stronger.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes it changes.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes we discover the real opportunity was sitting somewhere beside the original idea all along.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And sometimes, after enough evidence, we realize:
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                No.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This one doesn't deserve to be built.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Good.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That isn't necessarily failure.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That may be six months of work, thousands of dollars and a rather expensive education we just avoided.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Kill it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn from it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Move on.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                There will be another idea.
              </p>

              <p style={{ marginBottom: "3.5rem" }} />

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Execution isn't everything</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                There's an old entrepreneurial line:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>
                Ideas are worthless. Execution is everything.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                I've never completely bought it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Executing a bad idea extremely well doesn't magically turn it into a good business.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You can work incredibly hard in the wrong direction.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                People do it every day.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And AI is making this problem more interesting.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                We can now build incredibly quickly.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An app.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A website.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A pitch deck.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A financial model.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A brand.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Market research.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Code.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A prototype.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Sometimes in hours.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That's extraordinary.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                But being able to build something faster doesn't answer the most important question:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>
                Should we be building it at all?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Speed is useful when you're moving in the right direction.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                In the wrong direction, it simply gets you lost faster.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That's why I think the space between idea and execution matters more than ever.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Architecture.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not another 52-page business plan.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not six months sitting in a room predicting what your company will look like in Year Five.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And definitely not asking ChatGPT whether your idea has "massive potential."
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Architecture means figuring out what would actually need to be true for this idea to work as a business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Then testing those assumptions against reality.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your idea needs to earn the next commitment</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                I don't believe every business idea needs months of research before you do anything.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Quite the opposite.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You need enough evidence to justify the next commitment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe that's ten customer conversations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe it's a crude landing page.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe it's trying to sell the service manually before building the platform that will eventually deliver it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe it's putting some numbers on a napkin and discovering the economics are ridiculous.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Maybe it's building a tiny prototype because that's the cheapest way to answer the next important question.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The point isn't to eliminate uncertainty.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                You can't.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The point is to stop making increasingly expensive commitments based purely on increasingly elaborate assumptions.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                An idea should earn its way forward.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Evidence before commitment.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And if it survives?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Now we can start architecting the business around it.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A business is bigger than the idea</h2>

              <p style={{ marginBottom: "2.5rem" }}>
                This distinction matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The idea may describe what you want to create.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                It doesn't automatically tell you:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who the customer really is.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why they will buy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How you'll reach them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What you'll charge.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How you'll make money.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                How you'll deliver the value.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What resources you'll need.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What has to happen first.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What can wait.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                What needs proving before you spend more.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That's the next architectural problem.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Business Architecture.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Business Idea Architecture asks:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>
                Can this idea become a business?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">How do I know if my business idea is actually viable?</Link>
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Business Architecture asks:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic" }}>
                How should that business work?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                {" "}
                <Link href="/answers/what-is-business-architecture" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  Business Architecture
                </Link>
                {" "} answers that question by connecting the customer, offer, pricing, economics, delivery, acquisition and execution into one coherent system.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It's the question of whether building an app, service or platform actually means you've built a business—or whether {" "}
                <Link href="/thinking/an-app-is-not-a-business" className="border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 text-[#6b1f1f] transition-colors">
                  the real architecture lies in what surrounds the product
                </Link>.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then comes another question:
              </p>

              <p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>
                How do we make it exist?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's execution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not random activity.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not collecting software subscriptions.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Not spending three weeks choosing fonts.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Deliberate movement from what we know now toward what needs to become true next.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Then reality gets a vote</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Eventually something has to exist outside your head.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Something another human being can see, touch, use, experience, reject — or buy.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                That's when things get interesting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Because your friends liking the idea isn't evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A beautiful pitch deck isn't evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A 52-page business plan isn't evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A prototype isn't automatically evidence.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And ChatGPT telling you:
              </p>

              <p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>
                "This idea has incredible potential."
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                is most definitely not evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customers behaving differently because what you created exists?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Now we're getting somewhere.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone paying?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Better.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                More people paying?
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Better still.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Finding those customers repeatedly and making the economics work?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Now perhaps we're starting to build a business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Reality gets a vote.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And unlike your mother, your best friend and your favorite AI assistant, reality has very little interest in protecting your feelings.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Useful quality.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Make the idea earn the right to exist</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                So if you have a business idea sitting in your head, don't fall in love with it yet.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                And please don't spend the next three months choosing the perfect name.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Put it on trial.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Challenge it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Let someone disagree with you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Look for evidence.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Be willing to discover that part of it is wrong.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Maybe all of it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And if it survives?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Architect the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Work out how it should work.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Work out what needs to happen first.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build enough to meet reality.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sell.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Adjust.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Make it exist.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                Because the world isn't short of ideas.
              </p>

              <p style={{ marginBottom: "2.5rem" }}>
                We're drowning in them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What's rare is someone willing to take an idea out of the safety of their imagination, challenge the hell out of it, and find out whether there is actually a business hiding inside it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An idea isn't valuable because you had it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It becomes valuable when reality proves there is something worth building.
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
