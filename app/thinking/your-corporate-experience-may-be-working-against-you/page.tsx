/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/your-corporate-experience-may-be-working-against-you";
  const articleTitle = "Your Corporate Experience May Be Working Against You";

  const handleShare = (platform: string) => {
    const text = `${articleTitle} — The Modern Business Architect`;
    const encodedUrl = encodeURIComponent(articleUrl);

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
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Thinking</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Your Corporate Experience May Be Working Against You
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Leading an established business and creating one from nothing are two very different games. The experience that made you successful in one can quietly make you dangerous in the other.
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

<p style={{ marginBottom: "3.5rem" }}>Over the past few months, I've watched several experienced corporate leaders step into entrepreneurship.</p>

<p style={{ marginBottom: "1.75rem" }}>Smart people.</p>

<p style={{ marginBottom: "1.75rem" }}>Successful people.</p>

<p style={{ marginBottom: "1.75rem" }}>People who have managed teams, budgets, departments and complicated businesses.</p>

<p style={{ marginBottom: "3.5rem" }}>And then something strange happens.</p>

<p style={{ marginBottom: "3.5rem" }}>They struggle.</p>

<p style={{ marginBottom: "1.75rem" }}>Not because they've suddenly become less intelligent.</p>

<p style={{ marginBottom: "1.75rem" }}>Not because they lack discipline.</p>

<p style={{ marginBottom: "1.75rem" }}>And certainly not because twenty years of experience somehow disappeared the moment they left the office.</p>

<p style={{ marginBottom: "3.5rem" }}>They struggle because they are playing a different game.</p>

<p style={{ marginBottom: "2.5rem" }}>Leading a business is not the same as creating one.</p>

<p style={{ marginBottom: "3.5rem" }}>And the experience that made you very good at the first can occasionally make you surprisingly bad at the second.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Corporate experience is valuable</h2>

<p style={{ marginBottom: "2.5rem" }}>Let's get this out of the way before somebody from LinkedIn arrives carrying a pitchfork.</p>

<p style={{ marginBottom: "2.5rem" }}>Building a successful corporate career is difficult.</p>

<p style={{ marginBottom: "1.75rem" }}>You learn how to make decisions.</p>

<p style={{ marginBottom: "1.75rem" }}>Manage people.</p>

<p style={{ marginBottom: "1.75rem" }}>Navigate complexity.</p>

<p style={{ marginBottom: "1.75rem" }}>Communicate.</p>

<p style={{ marginBottom: "1.75rem" }}>Negotiate.</p>

<p style={{ marginBottom: "1.75rem" }}>Lead.</p>

<p style={{ marginBottom: "1.75rem" }}>Deal with pressure.</p>

<p style={{ marginBottom: "1.75rem" }}>Allocate resources.</p>

<p style={{ marginBottom: "1.75rem" }}>Understand politics.</p>

<p style={{ marginBottom: "3.5rem" }}>Deliver results when several departments appear professionally committed to preventing them.</p>

<p style={{ marginBottom: "2.5rem" }}>Those are real capabilities.</p>

<p style={{ marginBottom: "3.5rem" }}>They don't disappear when you become an entrepreneur.</p>

<p style={{ marginBottom: "3.5rem" }}>Many of them become enormous advantages.</p>

<p style={{ marginBottom: "2.5rem" }}>The mistake is assuming the environment in which you learned to use those capabilities still exists.</p>

<p style={{ marginBottom: "3.5rem" }}>It doesn't.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Inside a corporation, you inherit a machine</h2>

<p style={{ marginBottom: "2.5rem" }}>Even in a difficult corporate role, you usually arrive inside something that already exists.</p>

<p style={{ marginBottom: "1.75rem" }}>There are customers.</p>

<p style={{ marginBottom: "1.75rem" }}>Revenue.</p>

<p style={{ marginBottom: "1.75rem" }}>Processes.</p>

<p style={{ marginBottom: "1.75rem" }}>Systems.</p>

<p style={{ marginBottom: "1.75rem" }}>Technology.</p>

<p style={{ marginBottom: "1.75rem" }}>People.</p>

<p style={{ marginBottom: "1.75rem" }}>Budgets.</p>

<p style={{ marginBottom: "1.75rem" }}>Suppliers.</p>

<p style={{ marginBottom: "1.75rem" }}>Policies.</p>

<p style={{ marginBottom: "3.5rem" }}>Brand recognition.</p>

<p style={{ marginBottom: "1.75rem" }}>Institutional knowledge.</p>

<p style={{ marginBottom: "3.5rem" }}>Somebody knows how invoices get paid.</p>

<p style={{ marginBottom: "1.75rem" }}>Somebody knows where customers come from.</p>

<p style={{ marginBottom: "3.5rem" }}>Somebody knows what the company sells.</p>

<p style={{ marginBottom: "3.5rem" }}>Hopefully.</p>

<p style={{ marginBottom: "2.5rem" }}>You may be responsible for improving that machine.</p>

<p style={{ marginBottom: "1.75rem" }}>Perhaps transforming it.</p>

<p style={{ marginBottom: "1.75rem" }}>Perhaps fixing a dysfunctional piece of it.</p>

<p style={{ marginBottom: "3.5rem" }}>Perhaps growing it significantly.</p>

<p style={{ marginBottom: "2.5rem" }}>But there is a machine.</p>

<p style={{ marginBottom: "3.5rem" }}>Entrepreneurship can begin with considerably less.</p>

<p style={{ marginBottom: "3.5rem" }}>Sometimes it begins with:</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"I have an idea."</p>

<p style={{ marginBottom: "2.5rem" }}>Wonderful.</p>

<p style={{ marginBottom: "3.5rem" }}>Now we have an assumption.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>In entrepreneurship, there may be no machine</h2>

<p style={{ marginBottom: "1.75rem" }}>You don't inherit customers.</p>

<p style={{ marginBottom: "1.75rem" }}>You have to discover them.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't inherit demand.</p>

<p style={{ marginBottom: "1.75rem" }}>You have to find out whether it exists.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't inherit distribution.</p>

<p style={{ marginBottom: "1.75rem" }}>You have to create it.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't inherit systems.</p>

<p style={{ marginBottom: "1.75rem" }}>You build them when they're actually needed.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't have Finance, Marketing, IT, Legal and HR waiting three floors down.</p>

<p style={{ marginBottom: "3.5rem" }}>You may have you.</p>

<p style={{ marginBottom: "3.5rem" }}>And perhaps ChatGPT.</p>

<p style={{ marginBottom: "3.5rem" }}>Congratulations on the new department.</p>

<p style={{ marginBottom: "3.5rem" }}>This isn't simply a smaller version of corporate life.</p>

<p style={{ marginBottom: "3.5rem" }}>The work itself changes.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Corporate leadership often begins with optimization</h2>

<p style={{ marginBottom: "2.5rem" }}>Established organizations spend enormous amounts of energy improving things that already exist.</p>

<p style={{ marginBottom: "1.75rem" }}>How do we increase margin?</p>

<p style={{ marginBottom: "1.75rem" }}>Reduce cost?</p>

<p style={{ marginBottom: "1.75rem" }}>Improve productivity?</p>

<p style={{ marginBottom: "1.75rem" }}>Grow market share?</p>

<p style={{ marginBottom: "1.75rem" }}>Increase conversion?</p>

<p style={{ marginBottom: "3.5rem" }}>Make operations more efficient?</p>

<p style={{ marginBottom: "3.5rem" }}>Improve the customer experience?</p>

<p style={{ marginBottom: "2.5rem" }}>These are optimization questions.</p>

<p style={{ marginBottom: "3.5rem" }}>Important ones.</p>

<p style={{ marginBottom: "2.5rem" }}>But entrepreneurship often begins before optimization is useful.</p>

<p style={{ marginBottom: "3.5rem" }}>Before asking how to improve the machine, you need to discover whether there should be a machine at all.</p>

<p style={{ marginBottom: "1.75rem" }}>Who is the customer?</p>

<p style={{ marginBottom: "1.75rem" }}>What do they care about?</p>

<p style={{ marginBottom: "1.75rem" }}>What are they doing today?</p>

<p style={{ marginBottom: "1.75rem" }}>Is there a sufficiently important problem?</p>

<p style={{ marginBottom: "1.75rem" }}>Will they pay?</p>

<p style={{ marginBottom: "1.75rem" }}>Can you reach them?</p>

<p style={{ marginBottom: "3.5rem" }}>Can the economics work?</p>

<p style={{ marginBottom: "2.5rem" }}>Those are discovery questions.</p>

<p style={{ marginBottom: "3.5rem" }}>And discovery requires a very different relationship with uncertainty.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Experience can create false confidence</h2>

<p style={{ marginBottom: "2.5rem" }}>This is where successful people can get into trouble.</p>

<p style={{ marginBottom: "2.5rem" }}>Experience creates patterns.</p>

<p style={{ marginBottom: "3.5rem" }}>That's usually useful.</p>

<p style={{ marginBottom: "1.75rem" }}>You've seen situations before.</p>

<p style={{ marginBottom: "1.75rem" }}>You recognize problems.</p>

<p style={{ marginBottom: "1.75rem" }}>You make decisions faster.</p>

<p style={{ marginBottom: "3.5rem" }}>You know what tends to work.</p>

<p style={{ marginBottom: "2.5rem" }}>But pattern recognition has a weakness.</p>

<p style={{ marginBottom: "3.5rem" }}>Sometimes you recognize a pattern that isn't actually there.</p>

<p style={{ marginBottom: "2.5rem" }}>A former executive sees a market and thinks:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>I understand this industry.</p>

<p style={{ marginBottom: "3.5rem" }}>Maybe.</p>

<p style={{ marginBottom: "1.75rem" }}>But do you understand this customer?</p>

<p style={{ marginBottom: "1.75rem" }}>This buying behaviour?</p>

<p style={{ marginBottom: "1.75rem" }}>This price point?</p>

<p style={{ marginBottom: "1.75rem" }}>This distribution model?</p>

<p style={{ marginBottom: "1.75rem" }}>This tiny business with almost no resources?</p>

<p style={{ marginBottom: "3.5rem" }}>This market in 2026 rather than the one you operated in ten years ago?</p>

<p style={{ marginBottom: "2.5rem" }}>Experience should give you better questions.</p>

<p style={{ marginBottom: "3.5rem" }}>It becomes dangerous when it gives you answers before reality has had a chance to speak.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your title doesn't transfer either</h2>

<p style={{ marginBottom: "2.5rem" }}>This one can sting.</p>

<p style={{ marginBottom: "2.5rem" }}>Inside a corporation, your title carries context.</p>

<p style={{ marginBottom: "1.75rem" }}>Vice President.</p>

<p style={{ marginBottom: "1.75rem" }}>Managing Director.</p>

<p style={{ marginBottom: "3.5rem" }}>Chief Something Officer.</p>

<p style={{ marginBottom: "1.75rem" }}>People answer your email.</p>

<p style={{ marginBottom: "1.75rem" }}>Meetings appear.</p>

<p style={{ marginBottom: "1.75rem" }}>Resources move.</p>

<p style={{ marginBottom: "1.75rem" }}>Suppliers return calls.</p>

<p style={{ marginBottom: "3.5rem" }}>Someone prepares the PowerPoint.</p>

<p style={{ marginBottom: "2.5rem" }}>Then you leave.</p>

<p style={{ marginBottom: "3.5rem" }}>Suddenly you're trying to convince your first customer to buy something from a company they've never heard of.</p>

<p style={{ marginBottom: "2.5rem" }}>Nobody particularly cares what your old title was.</p>

<p style={{ marginBottom: "3.5rem" }}>The market is wonderfully disrespectful that way.</p>

<p style={{ marginBottom: "1.75rem" }}>It asks a simpler question:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Can you create value for me?</p>

<p style={{ marginBottom: "2.5rem" }}>That's humbling.</p>

<p style={{ marginBottom: "3.5rem" }}>It's also useful.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Startups require you to become a beginner again</h2>

<p style={{ marginBottom: "2.5rem" }}>This may be the hardest transition.</p>

<p style={{ marginBottom: "3.5rem" }}>The higher you've climbed, the less familiar it can feel to not know.</p>

<p style={{ marginBottom: "1.75rem" }}>But early entrepreneurship is full of not knowing.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't know whether the idea works.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't know exactly who buys.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't know which message lands.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't know the right price.</p>

<p style={{ marginBottom: "1.75rem" }}>You don't know which channel works.</p>

<p style={{ marginBottom: "3.5rem" }}>You don't know whether Customer #1 represents a market or simply has unusually poor judgment.</p>

<p style={{ marginBottom: "1.75rem" }}>You test.</p>

<p style={{ marginBottom: "1.75rem" }}>Learn.</p>

<p style={{ marginBottom: "3.5rem" }}>Adjust.</p>

<p style={{ marginBottom: "3.5rem" }}>Then test again.</p>

<p style={{ marginBottom: "2.5rem" }}>In corporate environments, uncertainty is often something we're expected to reduce before acting.</p>

<p style={{ marginBottom: "3.5rem" }}>In entrepreneurship, you frequently act specifically because that's how uncertainty gets reduced.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Failure changes meaning</h2>

<p style={{ marginBottom: "2.5rem" }}>Corporate careers can train people to avoid visible failure.</p>

<p style={{ marginBottom: "3.5rem" }}>Understandably.</p>

<p style={{ marginBottom: "1.75rem" }}>Failure can affect budgets, bonuses, promotions and reputations.</p>

<p style={{ marginBottom: "3.5rem" }}>Entrepreneurship needs a slightly different interpretation.</p>

<p style={{ marginBottom: "1.75rem" }}>A failed test can be useful.</p>

<p style={{ marginBottom: "1.75rem" }}>A customer saying no can be useful.</p>

<p style={{ marginBottom: "1.75rem" }}>A pricing assumption collapsing can be useful.</p>

<p style={{ marginBottom: "3.5rem" }}>Discovering that your target market doesn't care can be extremely useful.</p>

<p style={{ marginBottom: "3.5rem" }}>Preferably before you've spent $150,000 building for them.</p>

<p style={{ marginBottom: "2.5rem" }}>Failure becomes dangerous when you learn nothing from it.</p>

<p style={{ marginBottom: "3.5rem" }}>Evidence that changes your direction isn't failure.</p>

<p style={{ marginBottom: "3.5rem" }}>It's information.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Don't throw away your experience</h2>

<p style={{ marginBottom: "2.5rem" }}>The answer isn't to pretend your corporate career taught you nothing.</p>

<p style={{ marginBottom: "3.5rem" }}>That would be ridiculous.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring the strategic thinking.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring the leadership.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring the commercial judgment.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring the communication skills.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring the resilience.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring the ability to see systems and dependencies.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring your understanding of people.</p>

<p style={{ marginBottom: "1.75rem" }}>Bring your network.</p>

<p style={{ marginBottom: "3.5rem" }}>Bring your scars.</p>

<p style={{ marginBottom: "2.5rem" }}>Just don't bring every assumption about how businesses are supposed to operate.</p>

<p style={{ marginBottom: "3.5rem" }}>A startup doesn't need a miniature corporate structure.</p>

<p style={{ marginBottom: "3.5rem" }}>It needs enough structure to discover what works.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Architect the entrepreneur before the enterprise</h2>

<p style={{ marginBottom: "2.5rem" }}>This is why, before architecting a business, I increasingly want to understand the person building it.</p>

<p style={{ marginBottom: "1.75rem" }}>What are you actually good at?</p>

<p style={{ marginBottom: "1.75rem" }}>What did your corporate environment provide that you no longer have?</p>

<p style={{ marginBottom: "1.75rem" }}>Where does your confidence come from?</p>

<p style={{ marginBottom: "1.75rem" }}>Where might experience be creating blind spots?</p>

<p style={{ marginBottom: "1.75rem" }}>What kind of business fits your life?</p>

<p style={{ marginBottom: "1.75rem" }}>Your resources?</p>

<p style={{ marginBottom: "1.75rem" }}>Your financial needs?</p>

<p style={{ marginBottom: "1.75rem" }}>Your tolerance for uncertainty?</p>

<p style={{ marginBottom: "1.75rem" }}>Your ambition?</p>

<p style={{ marginBottom: "3.5rem" }}>Your personality?</p>

<p style={{ marginBottom: "2.5rem" }}>Because we can design a perfectly reasonable business that is completely wrong for the person expected to run it.</p>

<p style={{ marginBottom: "3.5rem" }}>That isn't good architecture.</p>

<p style={{ marginBottom: "3.5rem" }}>The entrepreneur is part of the system.</p>

<p style={{ marginBottom: "2.5rem" }}>I call this Founder Architecture. And before building a business, I want to understand whether the founder has actually created structural room for one to exist. If you've been saying you'll start when things calm down, I'd suggest reading about <Link href="/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts" className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 transition-colors">how your current life is likely designed to prevent exactly that</Link>.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Then architect the business</h2>

<p style={{ marginBottom: "2.5rem" }}>Once we understand the builder, we can start working on what should be built.</p>

<p style={{ marginBottom: "1.75rem" }}>Not by immediately ordering a logo.</p>

<p style={{ marginBottom: "1.75rem" }}>Not by creating seventeen social accounts.</p>

<p style={{ marginBottom: "3.5rem" }}>Not by hiring people because that's what a "real company" apparently does.</p>

<p style={{ marginBottom: "1.75rem" }}>We work backwards.</p>

<p style={{ marginBottom: "1.75rem" }}>What are you trying to create?</p>

<p style={{ marginBottom: "1.75rem" }}>For whom?</p>

<p style={{ marginBottom: "1.75rem" }}>What needs to be true?</p>

<p style={{ marginBottom: "1.75rem" }}>What evidence do we have?</p>

<p style={{ marginBottom: "1.75rem" }}>What needs testing?</p>

<p style={{ marginBottom: "1.75rem" }}>How does money move?</p>

<p style={{ marginBottom: "1.75rem" }}>How do customers arrive?</p>

<p style={{ marginBottom: "1.75rem" }}>What capabilities actually need to exist?</p>

<p style={{ marginBottom: "1.75rem" }}>What should happen first?</p>

<p style={{ marginBottom: "3.5rem" }}>What should deliberately wait?</p>

<p style={{ marginBottom: "2.5rem" }}>That's Business Architecture in an entrepreneurial context. And this is where <Link href="/answers/what-does-a-business-architect-do" className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 transition-colors">understanding what a Business Architect actually does</Link> becomes useful.</p>

<p style={{ marginBottom: "3.5rem" }}>It isn't about making the startup look like a company.</p>

<p style={{ marginBottom: "3.5rem" }}>It's about discovering and designing the business that deserves to become one.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your experience isn't the problem</h2>

<p style={{ marginBottom: "2.5rem" }}>Your relationship with it might be.</p>

<p style={{ marginBottom: "2.5rem" }}>Twenty years of corporate experience can be an extraordinary entrepreneurial advantage.</p>

<p style={{ marginBottom: "3.5rem" }}>Or a very expensive collection of assumptions.</p>

<p style={{ marginBottom: "2.5rem" }}>The difference is whether you're willing to examine which lessons still apply.</p>

<p style={{ marginBottom: "2.5rem" }}>Corporate success teaches you how to operate inside systems.</p>

<p style={{ marginBottom: "3.5rem" }}>Entrepreneurship asks you to discover what system should exist.</p>

<p style={{ marginBottom: "1.75rem" }}>One is largely about operating and improving a machine.</p>

<p style={{ marginBottom: "3.5rem" }}>The other begins with an empty floor and a question.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What the hell should we build here?</p>

<p style={{ marginBottom: "2.5rem" }}>That's why the transition can feel harder than expected.</p>

<p style={{ marginBottom: "1.75rem" }}>You're not inexperienced.</p>

<p style={{ marginBottom: "3.5rem" }}>You're experienced in a different game.</p>

<p style={{ marginBottom: "1.75rem" }}>Keep the experience.</p>

<p style={{ marginBottom: "1.75rem" }}>Lose the certainty.</p>

<p style={{ marginBottom: "1.75rem" }}>Become curious again.</p>

<p style={{ marginBottom: "3.5rem" }}>And before you start building the enterprise, architect the entrepreneur who's going to have to make it work.</p>

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
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related Thinking</p>
                <div className="space-y-6">
                  <Link href="/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        Your Life Is Perfectly Designed to Kill Your Business Before It Starts
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Most aspiring entrepreneurs don't have a motivation problem. They have a structural problem.
                      </p>
                    </motion.div>
                  </Link>
                  <Link href="/thinking/the-fastest-way-to-build-the-wrong-business" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        The Fastest Way to Build the Wrong Business
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Most entrepreneurs don't build businesses in the wrong direction because they're lazy. It's because they start building before they've worked out what needs to exist.
                      </p>
                    </motion.div>
                  </Link>
                  <Link href="/answers/what-does-a-business-architect-do" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
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
              </div>
            </motion.div>
          </div>
        </section>

        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
