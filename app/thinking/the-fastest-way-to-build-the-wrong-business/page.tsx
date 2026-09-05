/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/the-fastest-way-to-build-the-wrong-business";
  const articleTitle = "The Fastest Way to Build the Wrong Business";

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
                  The Fastest Way to Build the Wrong Business
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Most entrepreneurs don't build businesses in the wrong direction because they're lazy. They do it because they start building before they've worked out what needs to exist.
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

<p style={{ marginBottom: "3.5rem" }}>Starting a business is easy.</p>

<p style={{ marginBottom: "1.75rem" }}>Pick a name.</p>

<p style={{ marginBottom: "1.75rem" }}>Buy a domain.</p>

<p style={{ marginBottom: "1.75rem" }}>Make a logo.</p>

<p style={{ marginBottom: "1.75rem" }}>Open an Instagram account.</p>

<p style={{ marginBottom: "1.75rem" }}>Build a website.</p>

<p style={{ marginBottom: "3.5rem" }}>Tell everyone you're "excited to announce your new venture."</p>

<p style={{ marginBottom: "3.5rem" }}>Congratulations.</p>

<p style={{ marginBottom: "3.5rem" }}>You've built...</p>

<p style={{ marginBottom: "3.5rem" }}>possibly nothing.</p>

<p style={{ marginBottom: "3.5rem" }}>This is one of the strangest things about entrepreneurship.</p>

<p style={{ marginBottom: "2.5rem" }}>You can be extraordinarily busy while making almost no progress toward creating a business.</p>

<p style={{ marginBottom: "3.5rem" }}>The problem usually isn't effort.</p>

<p style={{ marginBottom: "3.5rem" }}>It's sequence.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>We build whatever is easiest to see</h2>

<p style={{ marginBottom: "2.5rem" }}>A website is easy to understand.</p>

<p style={{ marginBottom: "3.5rem" }}>You can see it.</p>

<p style={{ marginBottom: "2.5rem" }}>A logo is easy to understand.</p>

<p style={{ marginBottom: "3.5rem" }}>There it is.</p>

<p style={{ marginBottom: "2.5rem" }}>A product is tangible.</p>

<p style={{ marginBottom: "3.5rem" }}>You can build it.</p>

<p style={{ marginBottom: "3.5rem" }}>Marketing feels like action.</p>

<p style={{ marginBottom: "1.75rem" }}>Post something.</p>

<p style={{ marginBottom: "1.75rem" }}>Run an ad.</p>

<p style={{ marginBottom: "3.5rem" }}>Send an email.</p>

<p style={{ marginBottom: "2.5rem" }}>The harder questions are less satisfying.</p>

<p style={{ marginBottom: "1.75rem" }}>Who exactly is the customer?</p>

<p style={{ marginBottom: "1.75rem" }}>What do they care enough about to pay for?</p>

<p style={{ marginBottom: "1.75rem" }}>What are they buying?</p>

<p style={{ marginBottom: "1.75rem" }}>Why this offer?</p>

<p style={{ marginBottom: "1.75rem" }}>Why this price?</p>

<p style={{ marginBottom: "3.5rem" }}>Why you?</p>

<p style={{ marginBottom: "2.5rem" }}>Those questions don't produce something pretty at the end of the afternoon.</p>

<p style={{ marginBottom: "2.5rem" }}>So people skip them.</p>

<p style={{ marginBottom: "2.5rem" }}>Then six months later they have a beautiful website and one rather awkward question:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Now how the hell do I sell this thing?</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>That's backwards</h2>

<p style={{ marginBottom: "2.5rem" }}>A conversation with an aspiring business coach illustrates this perfectly.</p>

<p style={{ marginBottom: "3.5rem" }}>The idea was roughly:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"I want to sell a three-month coaching program for $5,000."</p>

<p style={{ marginBottom: "3.5rem" }}>Fine.</p>

<p style={{ marginBottom: "2.5rem" }}>Maybe that's an excellent business.</p>

<p style={{ marginBottom: "3.5rem" }}>Maybe nobody on Earth wants it.</p>

<p style={{ marginBottom: "2.5rem" }}>We don't know yet.</p>

<p style={{ marginBottom: "3.5rem" }}>But instead of starting with the website, let's work backwards.</p>

<p style={{ marginBottom: "2.5rem" }}>If somebody gives you $5,000, what exactly are they buying?</p>

<p style={{ marginBottom: "1.75rem" }}>How many sessions?</p>

<p style={{ marginBottom: "1.75rem" }}>What happens between them?</p>

<p style={{ marginBottom: "1.75rem" }}>What changes during those three months?</p>

<p style={{ marginBottom: "3.5rem" }}>What outcome are they trying to achieve?</p>

<p style={{ marginBottom: "2.5rem" }}>What makes that outcome valuable enough to justify $5,000?</p>

<p style={{ marginBottom: "3.5rem" }}>Now we're getting closer to an offer.</p>

<p style={{ marginBottom: "2.5rem" }}>But where does the offer come from?</p>

<p style={{ marginBottom: "1.75rem" }}>What methodology?</p>

<p style={{ marginBottom: "1.75rem" }}>What expertise?</p>

<p style={{ marginBottom: "1.75rem" }}>What process?</p>

<p style={{ marginBottom: "1.75rem" }}>What happens first?</p>

<p style={{ marginBottom: "1.75rem" }}>What happens next?</p>

<p style={{ marginBottom: "3.5rem" }}>Why should anyone believe this works?</p>

<p style={{ marginBottom: "2.5rem" }}>Now we're getting closer to delivery.</p>

<p style={{ marginBottom: "2.5rem" }}>But delivery exists because somebody has a problem worth solving.</p>

<p style={{ marginBottom: "3.5rem" }}>So:</p>

<p style={{ marginBottom: "1.75rem" }}>What problem?</p>

<p style={{ marginBottom: "1.75rem" }}>How painful is it?</p>

<p style={{ marginBottom: "1.75rem" }}>What happens if they do nothing?</p>

<p style={{ marginBottom: "1.75rem" }}>What have they already tried?</p>

<p style={{ marginBottom: "3.5rem" }}>Why hasn't that worked?</p>

<p style={{ marginBottom: "2.5rem" }}>Now we're getting closer to demand.</p>

<p style={{ marginBottom: "2.5rem" }}>And then:</p>

<p style={{ marginBottom: "1.75rem" }}>Whose problem is this?</p>

<p style={{ marginBottom: "1.75rem" }}>Who has it badly enough?</p>

<p style={{ marginBottom: "1.75rem" }}>Who has money?</p>

<p style={{ marginBottom: "1.75rem" }}>Who has authority to buy?</p>

<p style={{ marginBottom: "3.5rem" }}>Who is actively trying to solve it?</p>

<p style={{ marginBottom: "2.5rem" }}>Now we're getting closer to a customer.</p>

<p style={{ marginBottom: "3.5rem" }}>Notice what we still haven't discussed?</p>

<p style={{ marginBottom: "3.5rem" }}>The logo.</p>

<p style={{ marginBottom: "3.5rem" }}>It seems to be coping remarkably well without us.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Reverse-engineer before you build forward</h2>

<p style={{ marginBottom: "2.5rem" }}>This is one of the simplest principles in the way I work.</p>

<p style={{ marginBottom: "3.5rem" }}>Start with the outcome.</p>

<p style={{ marginBottom: "3.5rem" }}>Then work backwards.</p>

<p style={{ marginBottom: "3.5rem" }}>If this business succeeds, what has to be true?</p>

<p style={{ marginBottom: "1.75rem" }}>There are customers.</p>

<p style={{ marginBottom: "3.5rem" }}>Fine.</p>

<p style={{ marginBottom: "3.5rem" }}>Which customers?</p>

<p style={{ marginBottom: "1.75rem" }}>They buy something.</p>

<p style={{ marginBottom: "3.5rem" }}>What?</p>

<p style={{ marginBottom: "1.75rem" }}>Why?</p>

<p style={{ marginBottom: "1.75rem" }}>At what price?</p>

<p style={{ marginBottom: "1.75rem" }}>How did they find you?</p>

<p style={{ marginBottom: "1.75rem" }}>Why did they choose you?</p>

<p style={{ marginBottom: "1.75rem" }}>What did it cost to acquire them?</p>

<p style={{ marginBottom: "1.75rem" }}>How did you deliver the value?</p>

<p style={{ marginBottom: "3.5rem" }}>What capabilities were required?</p>

<p style={{ marginBottom: "1.75rem" }}>What economics made the business sustainable?</p>

<p style={{ marginBottom: "3.5rem" }}>What evidence would have told us early that this could work?</p>

<p style={{ marginBottom: "2.5rem" }}>Now we have dependencies.</p>

<p style={{ marginBottom: "3.5rem" }}>And once we understand the dependencies, we can start moving forward intelligently.</p>

<p style={{ marginBottom: "2.5rem" }}>That's very different from entrepreneurial pinball.</p>

<p style={{ marginBottom: "1.75rem" }}>Website.</p>

<p style={{ marginBottom: "1.75rem" }}>AI tool.</p>

<p style={{ marginBottom: "1.75rem" }}>LinkedIn.</p>

<p style={{ marginBottom: "1.75rem" }}>New idea.</p>

<p style={{ marginBottom: "1.75rem" }}>Logo adjustment.</p>

<p style={{ marginBottom: "1.75rem" }}>Podcast.</p>

<p style={{ marginBottom: "1.75rem" }}>Another AI tool.</p>

<p style={{ marginBottom: "3.5rem" }}>Back to website.</p>

<p style={{ marginBottom: "1.75rem" }}>Three months disappear.</p>

<p style={{ marginBottom: "1.75rem" }}>Busy as hell.</p>

<p style={{ marginBottom: "3.5rem" }}>Business still missing.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A business is not a shopping trolley</h2>

<p style={{ marginBottom: "2.5rem" }}>Imagine inviting people for dinner.</p>

<p style={{ marginBottom: "3.5rem" }}>You go to the supermarket.</p>

<p style={{ marginBottom: "1.75rem" }}>Into the trolley goes:</p>

<p style={{ marginBottom: "1.75rem" }}>A bottle of red wine.</p>

<p style={{ marginBottom: "1.75rem" }}>Coconut milk.</p>

<p style={{ marginBottom: "1.75rem" }}>A whole salmon.</p>

<p style={{ marginBottom: "1.75rem" }}>Three apples.</p>

<p style={{ marginBottom: "1.75rem" }}>Orange juice.</p>

<p style={{ marginBottom: "1.75rem" }}>A wheel of Brie.</p>

<p style={{ marginBottom: "1.75rem" }}>Frozen pizza.</p>

<p style={{ marginBottom: "3.5rem" }}>A bag of limes.</p>

<p style={{ marginBottom: "2.5rem" }}>Everything looked useful individually.</p>

<p style={{ marginBottom: "3.5rem" }}>Then the first guest arrives.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"So... what are we having?"</p>

<p style={{ marginBottom: "2.5rem" }}>And you realize something.</p>

<p style={{ marginBottom: "3.5rem" }}>You didn't plan dinner.</p>

<p style={{ marginBottom: "3.5rem" }}>You went shopping.</p>

<p style={{ marginBottom: "2.5rem" }}>That's how many businesses are built.</p>

<p style={{ marginBottom: "1.75rem" }}>Entrepreneurs collect components.</p>

<p style={{ marginBottom: "1.75rem" }}>Website.</p>

<p style={{ marginBottom: "1.75rem" }}>CRM.</p>

<p style={{ marginBottom: "1.75rem" }}>AI subscriptions.</p>

<p style={{ marginBottom: "1.75rem" }}>Accounting software.</p>

<p style={{ marginBottom: "1.75rem" }}>Content.</p>

<p style={{ marginBottom: "1.75rem" }}>Branding.</p>

<p style={{ marginBottom: "1.75rem" }}>Sales tools.</p>

<p style={{ marginBottom: "1.75rem" }}>Product features.</p>

<p style={{ marginBottom: "3.5rem" }}>Automations.</p>

<p style={{ marginBottom: "2.5rem" }}>Then reality arrives and asks:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What exactly is the business?</p>

<p style={{ marginBottom: "3.5rem" }}>And suddenly the trolley looks less impressive.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Every decision changes another decision</h2>

<p style={{ marginBottom: "3.5rem" }}>This is why I use the word architecture.</p>

<p style={{ marginBottom: "2.5rem" }}>Suppose you change the customer.</p>

<p style={{ marginBottom: "1.75rem" }}>That may change the problem.</p>

<p style={{ marginBottom: "1.75rem" }}>Which may change the offer.</p>

<p style={{ marginBottom: "1.75rem" }}>Which may change the price.</p>

<p style={{ marginBottom: "1.75rem" }}>Which may change the sales process.</p>

<p style={{ marginBottom: "1.75rem" }}>Which may change the acquisition channel.</p>

<p style={{ marginBottom: "1.75rem" }}>Which may change the economics.</p>

<p style={{ marginBottom: "1.75rem" }}>Which may change the delivery model.</p>

<p style={{ marginBottom: "3.5rem" }}>Which may change the capabilities you need.</p>

<p style={{ marginBottom: "2.5rem" }}>These are not independent tasks.</p>

<p style={{ marginBottom: "3.5rem" }}>They're connected decisions.</p>

<p style={{ marginBottom: "2.5rem" }}>You cannot optimize one piece intelligently while ignoring everything around it.</p>

<p style={{ marginBottom: "2.5rem" }}>That's why a business isn't a checklist.</p>

<p style={{ marginBottom: "3.5rem" }}>It's a system. This is what <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 transition-colors">Business Architecture</Link> means—understanding how these connected decisions actually work together.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Architecture doesn't mean planning forever</h2>

<p style={{ marginBottom: "2.5rem" }}>This is where people occasionally misunderstand me.</p>

<p style={{ marginBottom: "2.5rem" }}>If I say "architect before building," somebody imagines six months of workshops, diagrams and a 52-page business plan.</p>

<p style={{ marginBottom: "3.5rem" }}>Absolutely not.</p>

<p style={{ marginBottom: "2.5rem" }}>The purpose of architecture is not to postpone reality.</p>

<p style={{ marginBottom: "3.5rem" }}>It's to reach reality intelligently.</p>

<p style={{ marginBottom: "1.75rem" }}>Sometimes the next architectural decision is:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Talk to ten customers.</p>

<p style={{ marginBottom: "3.5rem" }}>Good.</p>

<p style={{ marginBottom: "1.75rem" }}>Do that.</p>

<p style={{ marginBottom: "1.75rem" }}>Sometimes:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Put up a crude landing page and see whether anybody responds.</p>

<p style={{ marginBottom: "3.5rem" }}>Do it.</p>

<p style={{ marginBottom: "1.75rem" }}>Sometimes:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Sell the service manually before building the platform.</p>

<p style={{ marginBottom: "3.5rem" }}>Excellent.</p>

<p style={{ marginBottom: "1.75rem" }}>Sometimes:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Build the prototype.</p>

<p style={{ marginBottom: "3.5rem" }}>Fine.</p>

<p style={{ marginBottom: "2.5rem" }}>Architecture should help determine the next useful action.</p>

<p style={{ marginBottom: "3.5rem" }}>Not create an elegant excuse for avoiding one.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Build only what the next question requires</h2>

<p style={{ marginBottom: "2.5rem" }}>AI makes this principle more important.</p>

<p style={{ marginBottom: "1.75rem" }}>We can build incredibly quickly now.</p>

<p style={{ marginBottom: "1.75rem" }}>Website?</p>

<p style={{ marginBottom: "1.75rem" }}>Hours.</p>

<p style={{ marginBottom: "1.75rem" }}>Prototype?</p>

<p style={{ marginBottom: "1.75rem" }}>Maybe a day.</p>

<p style={{ marginBottom: "1.75rem" }}>Research?</p>

<p style={{ marginBottom: "1.75rem" }}>Minutes.</p>

<p style={{ marginBottom: "3.5rem" }}>Code?</p>

<p style={{ marginBottom: "3.5rem" }}>Increasingly ridiculous.</p>

<p style={{ marginBottom: "2.5rem" }}>This is fantastic.</p>

<p style={{ marginBottom: "2.5rem" }}>But cheaper execution doesn't automatically produce better decisions.</p>

<p style={{ marginBottom: "2.5rem" }}>If anything, it makes bad sequencing more tempting.</p>

<p style={{ marginBottom: "2.5rem" }}>Why spend three days validating something when you can spend Saturday building it?</p>

<p style={{ marginBottom: "3.5rem" }}>Because Sunday may reveal nobody wants it.</p>

<p style={{ marginBottom: "2.5rem" }}>Speed is valuable after direction.</p>

<p style={{ marginBottom: "3.5rem" }}>Before direction, speed simply gets you lost faster.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Find the dangerous assumption</h2>

<p style={{ marginBottom: "2.5rem" }}>Every early business contains assumptions.</p>

<p style={{ marginBottom: "1.75rem" }}>Customers have this problem.</p>

<p style={{ marginBottom: "1.75rem" }}>They care.</p>

<p style={{ marginBottom: "1.75rem" }}>They'll pay.</p>

<p style={{ marginBottom: "1.75rem" }}>You can reach them.</p>

<p style={{ marginBottom: "1.75rem" }}>Your solution works.</p>

<p style={{ marginBottom: "1.75rem" }}>The price works.</p>

<p style={{ marginBottom: "1.75rem" }}>Delivery works.</p>

<p style={{ marginBottom: "3.5rem" }}>The economics work.</p>

<p style={{ marginBottom: "2.5rem" }}>Some assumptions are relatively harmless.</p>

<p style={{ marginBottom: "3.5rem" }}>Others can kill the entire business.</p>

<p style={{ marginBottom: "2.5rem" }}>Find those first. I've written a guide on <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 transition-colors">testing whether your business idea is actually viable</Link>—identifying which assumptions matter most comes before polishing the rest.</p>

<p style={{ marginBottom: "2.5rem" }}>If the business requires customers to pay $500 and nobody will pay more than $50, I would quite like to know that before building the premium platform.</p>

<p style={{ marginBottom: "2.5rem" }}>If the market exists but costs $700 to acquire a $300 customer, that's useful information too.</p>

<p style={{ marginBottom: "3.5rem" }}>If the entrepreneur needs $15,000 a month from a market that realistically supports a $3,000 lifestyle business, we have another architectural problem.</p>

<p style={{ marginBottom: "2.5rem" }}>Test the things capable of killing you before polishing the things incapable of saving you.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Sequence is strategy made executable</h2>

<p style={{ marginBottom: "2.5rem" }}>A good roadmap isn't a list of everything you eventually want.</p>

<p style={{ marginBottom: "3.5rem" }}>It's an order of learning and commitment.</p>

<p style={{ marginBottom: "1.75rem" }}>First we need to know this.</p>

<p style={{ marginBottom: "1.75rem" }}>Then we can justify that.</p>

<p style={{ marginBottom: "1.75rem" }}>If that becomes true, we invest here.</p>

<p style={{ marginBottom: "3.5rem" }}>If it doesn't, we change direction.</p>

<p style={{ marginBottom: "2.5rem" }}>This creates a very different relationship with execution.</p>

<p style={{ marginBottom: "2.5rem" }}>You're not trying to build the finished business immediately.</p>

<p style={{ marginBottom: "1.75rem" }}>You're progressively earning the right to build more of it.</p>

<p style={{ marginBottom: "1.75rem" }}>Evidence increases.</p>

<p style={{ marginBottom: "1.75rem" }}>Commitment increases.</p>

<p style={{ marginBottom: "3.5rem" }}>Investment increases.</p>

<p style={{ marginBottom: "3.5rem" }}>The business becomes more real.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Marketing belongs surprisingly late</h2>

<p style={{ marginBottom: "2.5rem" }}>Not all marketing.</p>

<p style={{ marginBottom: "1.75rem" }}>Customer conversations can happen immediately.</p>

<p style={{ marginBottom: "1.75rem" }}>Testing messages can happen immediately.</p>

<p style={{ marginBottom: "3.5rem" }}>Building an audience can be useful early.</p>

<p style={{ marginBottom: "2.5rem" }}>But the instinct to "start marketing" before understanding what you're marketing, to whom and why they should care is wonderfully efficient at producing noise.</p>

<p style={{ marginBottom: "2.5rem" }}>Marketing amplifies something.</p>

<p style={{ marginBottom: "3.5rem" }}>Make sure you know what that something is.</p>

<p style={{ marginBottom: "2.5rem" }}>Otherwise you're paying to distribute confusion.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The business should become obvious before it becomes complicated</h2>

<p style={{ marginBottom: "2.5rem" }}>Not certain.</p>

<p style={{ marginBottom: "3.5rem" }}>Not perfect.</p>

<p style={{ marginBottom: "2.5rem" }}>But understandable.</p>

<p style={{ marginBottom: "1.75rem" }}>Who?</p>

<p style={{ marginBottom: "1.75rem" }}>What problem?</p>

<p style={{ marginBottom: "1.75rem" }}>What offer?</p>

<p style={{ marginBottom: "1.75rem" }}>Why buy?</p>

<p style={{ marginBottom: "1.75rem" }}>How reach them?</p>

<p style={{ marginBottom: "1.75rem" }}>How deliver?</p>

<p style={{ marginBottom: "3.5rem" }}>How make money?</p>

<p style={{ marginBottom: "1.75rem" }}>If you cannot explain those things simply, adding more components rarely helps.</p>

<p style={{ marginBottom: "3.5rem" }}>Complexity should be earned.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Build forward after thinking backwards</h2>

<p style={{ marginBottom: "2.5rem" }}>Entrepreneurship requires action.</p>

<p style={{ marginBottom: "3.5rem" }}>Lots of it.</p>

<p style={{ marginBottom: "2.5rem" }}>But action isn't automatically progress.</p>

<p style={{ marginBottom: "1.75rem" }}>You can spend months building the wrong thing beautifully.</p>

<p style={{ marginBottom: "1.75rem" }}>You can automate a process nobody needs.</p>

<p style={{ marginBottom: "1.75rem" }}>Scale an offer nobody sufficiently wants.</p>

<p style={{ marginBottom: "1.75rem" }}>Market something with terrible economics.</p>

<p style={{ marginBottom: "3.5rem" }}>Hire people into a business that hasn't figured itself out.</p>

<p style={{ marginBottom: "2.5rem" }}>That's why I like reverse-engineering.</p>

<p style={{ marginBottom: "1.75rem" }}>Start with the business you're trying to create.</p>

<p style={{ marginBottom: "1.75rem" }}>Work backwards through what needs to be true.</p>

<p style={{ marginBottom: "1.75rem" }}>Identify the dangerous assumptions.</p>

<p style={{ marginBottom: "1.75rem" }}>Determine the sequence.</p>

<p style={{ marginBottom: "3.5rem" }}>Then move forward.</p>

<p style={{ marginBottom: "1.75rem" }}>Build.</p>

<p style={{ marginBottom: "1.75rem" }}>Test.</p>

<p style={{ marginBottom: "1.75rem" }}>Learn.</p>

<p style={{ marginBottom: "3.5rem" }}>Adjust.</p>

<p style={{ marginBottom: "2.5rem" }}>Build again.</p>

<p style={{ marginBottom: "2.5rem" }}>Great businesses can look obvious once they exist.</p>

<p style={{ marginBottom: "2.5rem" }}>They rarely were.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone had to connect the pieces.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone had to decide what mattered first.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone had to resist buying everything in the entrepreneurial supermarket simply because it was on sale.</p>

<p style={{ marginBottom: "3.5rem" }}>That's Business Architecture.</p>

<p style={{ marginBottom: "1.75rem" }}>Not making business more complicated.</p>

<p style={{ marginBottom: "3.5rem" }}>Making the sequence make sense.</p>

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
                  <Link href="/thinking/your-business-idea-is-worth-nothing" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
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
                      transition={{ duration: 0.7, delay: 0.1 }}
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
