/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/how-do-i-know-if-my-business-idea-is-actually-viable";
  const answerTitle = "How Do I Know If My Business Idea Is Actually Viable?";

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
                  How Do I Know If My Business Idea Is Actually Viable?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  A business idea is viable when there is enough evidence that real customers want it, can be reached, will pay enough for it, and the economics can work.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  That sounds simple.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  It isn't.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Because most bad ideas don't announce themselves as bad ideas.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  They usually arrive looking exciting.
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

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>An idea can be good and still not become a business</h2>

<p style={{ marginBottom: "3.5rem" }}>This is the first distinction that matters.</p>

<p style={{ marginBottom: "1.75rem" }}>You can have a clever idea.</p>

<p style={{ marginBottom: "1.75rem" }}>A useful idea.</p>

<p style={{ marginBottom: "1.75rem" }}>An original idea.</p>

<p style={{ marginBottom: "3.5rem" }}>Even an idea that people genuinely like.</p>

<p style={{ marginBottom: "2.5rem" }}>And still not have a viable business.</p>

<p style={{ marginBottom: "2.5rem" }}>Why?</p>

<p style={{ marginBottom: "2.5rem" }}>Because a business has to do more than create something interesting.</p>

<p style={{ marginBottom: "1.75rem" }}>It needs customers.</p>

<p style={{ marginBottom: "1.75rem" }}>Those customers need a reason to act.</p>

<p style={{ marginBottom: "1.75rem" }}>They need to be reachable.</p>

<p style={{ marginBottom: "1.75rem" }}>They need to pay enough.</p>

<p style={{ marginBottom: "1.75rem" }}>You need to be able to deliver what you promised.</p>

<p style={{ marginBottom: "2.5rem" }}>And after all the costs are counted, something economically sensible needs to remain.</p>

<p style={{ marginBottom: "2.5rem" }}>If one of those pieces breaks badly enough, the whole thing can fall apart.</p>

<p style={{ marginBottom: "2.5rem" }}>That's why I don't ask:</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Is this a good idea?</p>

<p style={{ marginBottom: "2.5rem" }}>I ask:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Can this idea actually become a business?</p>

<p style={{ marginBottom: "3.5rem" }}>Very different question.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Start with the customer, not the product</h2>

<p style={{ marginBottom: "2.5rem" }}>Entrepreneurs naturally fall in love with what they're building.</p>

<p style={{ marginBottom: "1.75rem" }}>The app.</p>

<p style={{ marginBottom: "1.75rem" }}>The service.</p>

<p style={{ marginBottom: "1.75rem" }}>The product.</p>

<p style={{ marginBottom: "1.75rem" }}>The platform.</p>

<p style={{ marginBottom: "2.5rem" }}>The clever feature nobody has thought of.</p>

<p style={{ marginBottom: "2.5rem" }}>Unfortunately, customers are rarely waiting around hoping somebody will build your feature.</p>

<p style={{ marginBottom: "3.5rem" }}>They're busy dealing with their own problems.</p>

<p style={{ marginBottom: "2.5rem" }}>So before obsessing over what you're going to build, ask:</p>

<p style={{ marginBottom: "1.75rem" }}>Who is this for?</p>

<p style={{ marginBottom: "1.75rem" }}>What are they trying to achieve?</p>

<p style={{ marginBottom: "1.75rem" }}>What is frustrating them today?</p>

<p style={{ marginBottom: "1.75rem" }}>What are they already doing instead?</p>

<p style={{ marginBottom: "2.5rem" }}>How painful, expensive or annoying is the current situation?</p>

<p style={{ marginBottom: "2.5rem" }}>And most importantly:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Is the problem important enough for them to do something about it?</p>

<p style={{ marginBottom: "2.5rem" }}>A problem can be real and still not matter enough to create a business.</p>

<p style={{ marginBottom: "2.5rem" }}>People tolerate irritating problems every day.</p>

<p style={{ marginBottom: "3.5rem" }}>Sometimes fixing them isn't worth the money, effort or change in behaviour.</p>

<p style={{ marginBottom: "2.5rem" }}>That's not a customer problem.</p>

<p style={{ marginBottom: "3.5rem" }}>That's your business problem.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Will they actually pay?</h2>

<p style={{ marginBottom: "2.5rem" }}>This is where a surprising amount of "validation" becomes theatre.</p>

<p style={{ marginBottom: "2.5rem" }}>People ask:</p>

<p style={{ marginBottom: "1.75rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"Would you use this?"</p>

<p style={{ marginBottom: "1.75rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"Do you like this idea?"</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"Would this be useful?"</p>

<p style={{ marginBottom: "3.5rem" }}>And people say yes.</p>

<p style={{ marginBottom: "2.5rem" }}>Of course they do.</p>

<p style={{ marginBottom: "3.5rem" }}>It costs them nothing.</p>

<p style={{ marginBottom: "2.5rem" }}>The useful question is closer to:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Would you exchange something valuable for this?</p>

<p style={{ marginBottom: "2.5rem" }}>Usually money.</p>

<p style={{ marginBottom: "1.75rem" }}>Sometimes time.</p>

<p style={{ marginBottom: "1.75rem" }}>Sometimes effort.</p>

<p style={{ marginBottom: "2.5rem" }}>Sometimes switching from an existing solution.</p>

<p style={{ marginBottom: "2.5rem" }}>Because interest is cheap.</p>

<p style={{ marginBottom: "3.5rem" }}>Commitment is more revealing.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone saying:</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"That's a great idea."</p>

<p style={{ marginBottom: "2.5rem" }}>is pleasant.</p>

<p style={{ marginBottom: "3.5rem" }}>Someone saying:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"Where do I pay?"</p>

<p style={{ marginBottom: "3.5rem" }}>is more interesting.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Can you actually reach enough customers?</h2>

<p style={{ marginBottom: "2.5rem" }}>This one kills good ideas quietly.</p>

<p style={{ marginBottom: "2.5rem" }}>Suppose you've found a genuine problem.</p>

<p style={{ marginBottom: "2.5rem" }}>Customers care.</p>

<p style={{ marginBottom: "2.5rem" }}>They will pay.</p>

<p style={{ marginBottom: "3.5rem" }}>Excellent.</p>

<p style={{ marginBottom: "1.75rem" }}>Now:</p>

<p style={{ marginBottom: "1.75rem" }}>Where are they?</p>

<p style={{ marginBottom: "1.75rem" }}>Can you identify them?</p>

<p style={{ marginBottom: "1.75rem" }}>Can you reach them?</p>

<p style={{ marginBottom: "1.75rem" }}>How expensive is it?</p>

<p style={{ marginBottom: "1.75rem" }}>How long does it take?</p>

<p style={{ marginBottom: "2.5rem" }}>Can you do it repeatedly?</p>

<p style={{ marginBottom: "2.5rem" }}>A business with willing customers you cannot economically reach is a very frustrating hobby.</p>

<p style={{ marginBottom: "3.5rem" }}>This is why I care about reachability almost as much as demand.</p>

<p style={{ marginBottom: "2.5rem" }}>The market may exist.</p>

<p style={{ marginBottom: "3.5rem" }}>That doesn't mean you have practical access to it.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Does the math work?</h2>

<p style={{ marginBottom: "2.5rem" }}>Eventually the romance has to meet arithmetic.</p>

<p style={{ marginBottom: "1.75rem" }}>How much will customers pay?</p>

<p style={{ marginBottom: "1.75rem" }}>How often?</p>

<p style={{ marginBottom: "1.75rem" }}>What does it cost to acquire them?</p>

<p style={{ marginBottom: "1.75rem" }}>What does it cost to serve them?</p>

<p style={{ marginBottom: "1.75rem" }}>What are your fixed costs?</p>

<p style={{ marginBottom: "2.5rem" }}>How much margin remains?</p>

<p style={{ marginBottom: "2.5rem" }}>You do not need a 52-page financial model.</p>

<p style={{ marginBottom: "3.5rem" }}>I usually want the first version on something closer to a napkin.</p>

<p style={{ marginBottom: "2.5rem" }}>If the basic math is ugly before we've even added reality, making the spreadsheet more sophisticated won't improve the business.</p>

<p style={{ marginBottom: "3.5rem" }}>It will just make the bad news look professionally formatted.</p>

<p style={{ marginBottom: "2.5rem" }}>This is why one of my favourite principles is:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>If the math doesn't work on a napkin, it probably won't work in reality.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Look for evidence, not encouragement</h2>

<p style={{ marginBottom: "2.5rem" }}>This is where founders get themselves into trouble.</p>

<p style={{ marginBottom: "2.5rem" }}>They ask people who want them to succeed.</p>

<p style={{ marginBottom: "1.75rem" }}>Friends.</p>

<p style={{ marginBottom: "1.75rem" }}>Family.</p>

<p style={{ marginBottom: "1.75rem" }}>Colleagues.</p>

<p style={{ marginBottom: "2.5rem" }}>Mentors who don't want to sound negative.</p>

<p style={{ marginBottom: "2.5rem" }}>And increasingly, AI.</p>

<p style={{ marginBottom: "3.5rem" }}>Then they collect encouragement and call it validation.</p>

<p style={{ marginBottom: "3.5rem" }}>It isn't.</p>

<p style={{ marginBottom: "2.5rem" }}>Useful evidence is behavioural.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone booked the call.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone joined the waitlist.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone introduced you to the decision-maker.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone agreed to a pilot.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone paid a deposit.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone bought.</p>

<p style={{ marginBottom: "1.75rem" }}>Someone came back.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone referred another customer.</p>

<p style={{ marginBottom: "2.5rem" }}>Those things are not perfect proof.</p>

<p style={{ marginBottom: "3.5rem" }}>But they are much more useful than applause.</p>

<p style={{ marginBottom: "3.5rem" }}>The stronger the commitment, the stronger the evidence.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>You don't need certainty</h2>

<p style={{ marginBottom: "2.5rem" }}>This is important.</p>

<p style={{ marginBottom: "2.5rem" }}>The objective of validation is not to eliminate risk.</p>

<p style={{ marginBottom: "2.5rem" }}>You can't.</p>

<p style={{ marginBottom: "3.5rem" }}>Entrepreneurship doesn't come with a certainty button.</p>

<p style={{ marginBottom: "2.5rem" }}>The objective is to reduce the biggest unknowns enough to justify the next commitment.</p>

<p style={{ marginBottom: "1.75rem" }}>Maybe the next commitment is ten customer conversations.</p>

<p style={{ marginBottom: "1.75rem" }}>Maybe it is a landing page.</p>

<p style={{ marginBottom: "1.75rem" }}>Maybe it is manually delivering the service before automating it.</p>

<p style={{ marginBottom: "1.75rem" }}>Maybe it is a prototype.</p>

<p style={{ marginBottom: "2.5rem" }}>Maybe it is asking someone to pay before building the expensive version.</p>

<p style={{ marginBottom: "2.5rem" }}>The test should match the uncertainty.</p>

<p style={{ marginBottom: "3.5rem" }}>You do not need to prove the entire business before moving.</p>

<p style={{ marginBottom: "3.5rem" }}>You need enough evidence to earn the next step.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Test the dangerous assumptions first</h2>

<p style={{ marginBottom: "2.5rem" }}>Not all assumptions matter equally.</p>

<p style={{ marginBottom: "2.5rem" }}>Suppose your business requires:</p>

<p style={{ marginBottom: "1.75rem" }}>1,000 paying customers.</p>

<p style={{ marginBottom: "1.75rem" }}>You can build the product.</p>

<p style={{ marginBottom: "1.75rem" }}>You can deliver it.</p>

<p style={{ marginBottom: "2.5rem" }}>The technology works.</p>

<p style={{ marginBottom: "2.5rem" }}>But nobody has demonstrated that you can find those 1,000 customers at a sensible cost.</p>

<p style={{ marginBottom: "3.5rem" }}>That's probably the dangerous assumption.</p>

<p style={{ marginBottom: "2.5rem" }}>Test that before spending six months polishing the product.</p>

<p style={{ marginBottom: "2.5rem" }}>Or perhaps customers clearly exist, but your entire model requires them to pay $500 and nobody will pay more than $75.</p>

<p style={{ marginBottom: "3.5rem" }}>Again, dangerous assumption.</p>

<p style={{ marginBottom: "2.5rem" }}>Or perhaps people will pay, but the service costs $600 to deliver.</p>

<p style={{ marginBottom: "3.5rem" }}>That's not a marketing problem.</p>

<p style={{ marginBottom: "3.5rem" }}>That's economics.</p>

<p style={{ marginBottom: "3.5rem" }}>The smartest validation work attacks the assumptions that can kill the business first.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Be willing to change the idea</h2>

<p style={{ marginBottom: "2.5rem" }}>This is where validation becomes emotionally difficult.</p>

<p style={{ marginBottom: "2.5rem" }}>People say they want validation.</p>

<p style={{ marginBottom: "2.5rem" }}>What they often mean is:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Please confirm that the thing I already want to build is brilliant.</p>

<p style={{ marginBottom: "3.5rem" }}>That's not validation.</p>

<p style={{ marginBottom: "3.5rem" }}>That's reassurance.</p>

<p style={{ marginBottom: "2.5rem" }}>Real validation may tell you:</p>

<p style={{ marginBottom: "1.75rem" }}>Wrong customer.</p>

<p style={{ marginBottom: "1.75rem" }}>Wrong problem.</p>

<p style={{ marginBottom: "1.75rem" }}>Wrong price.</p>

<p style={{ marginBottom: "1.75rem" }}>Wrong channel.</p>

<p style={{ marginBottom: "1.75rem" }}>Wrong business model.</p>

<p style={{ marginBottom: "2.5rem" }}>Wrong product.</p>

<p style={{ marginBottom: "2.5rem" }}>Or occasionally:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Wrong idea.</p>

<p style={{ marginBottom: "3.5rem" }}>Good.</p>

<p style={{ marginBottom: "3.5rem" }}>That information is valuable.</p>

<p style={{ marginBottom: "2.5rem" }}>The objective is not to prove the original idea correct.</p>

<p style={{ marginBottom: "3.5rem" }}>The objective is to find the business.</p>

<p style={{ marginBottom: "2.5rem" }}>Sometimes <Link href="/answers/i-built-an-app-how-do-i-turn-it-into-a-business" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">the real opportunity is sitting beside the idea you started with</Link>.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>When should you kill the idea?</h2>

<p style={{ marginBottom: "2.5rem" }}>There isn't one universal rule.</p>

<p style={{ marginBottom: "2.5rem" }}>But I become concerned when several things happen at once:</p>

<p style={{ marginBottom: "1.75rem" }}>People understand the problem but don't care enough to act.</p>

<p style={{ marginBottom: "1.75rem" }}>Customers like the idea but consistently refuse to pay.</p>

<p style={{ marginBottom: "1.75rem" }}>The economics only work under heroic assumptions.</p>

<p style={{ marginBottom: "1.75rem" }}>Acquiring customers appears prohibitively expensive.</p>

<p style={{ marginBottom: "1.75rem" }}>The problem exists, but the market is too small for what the entrepreneur wants.</p>

<p style={{ marginBottom: "1.75rem" }}>The business requires capabilities, capital or risk the founder does not realistically have.</p>

<p style={{ marginBottom: "2.5rem" }}>The evidence keeps contradicting the story, and the only thing keeping the idea alive is the founder's attachment to it.</p>

<p style={{ marginBottom: "2.5rem" }}>At that point, continuing is not perseverance.</p>

<p style={{ marginBottom: "3.5rem" }}>Sometimes it's denial with a logo.</p>

<p style={{ marginBottom: "3.5rem" }}>Killing an idea can be an excellent business decision.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What does "viable" actually mean?</h2>

<p style={{ marginBottom: "2.5rem" }}>For me, viability sits at the intersection of several things:</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Customer</strong></p>

<p style={{ marginBottom: "2.5rem" }}>A clear enough group of people with something they care about.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Demand</strong></p>

<p style={{ marginBottom: "2.5rem" }}>A reason for those people to act.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Willingness to pay</strong></p>

<p style={{ marginBottom: "2.5rem" }}>Enough economic value for a transaction to make sense.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Reachability</strong></p>

<p style={{ marginBottom: "2.5rem" }}>A practical way to find enough customers.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Economics</strong></p>

<p style={{ marginBottom: "2.5rem" }}>Pricing, acquisition, delivery and costs that can work together.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Founder fit</strong></p>

<p style={{ marginBottom: "2.5rem" }}>A business the entrepreneur can realistically build and wants to live with.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Evidence</strong></p>

<p style={{ marginBottom: "3.5rem" }}>Real-world behaviour supporting the important assumptions.</p>

<p style={{ marginBottom: "2.5rem" }}>You do not need all of this perfectly proven before starting.</p>

<p style={{ marginBottom: "3.5rem" }}>But if too many of these are built entirely on hope, you don't have a viable business yet.</p>

<p style={{ marginBottom: "2.5rem" }}>You have a hypothesis.</p>

<p style={{ marginBottom: "3.5rem" }}>If you want to understand how these components—customer, offer, economics, delivery, and acquisition—connect into a coherent whole, I <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 transition-colors">explain that separately in What Is Business Architecture</Link>.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A simple way to test your idea</h2>

<p style={{ marginBottom: "2.5rem" }}>Ask yourself:</p>

<p style={{ marginBottom: "1.75rem" }}>Who is the customer?</p>

<p style={{ marginBottom: "1.75rem" }}>What problem matters enough for them to act?</p>

<p style={{ marginBottom: "1.75rem" }}>What are they doing today instead?</p>

<p style={{ marginBottom: "1.75rem" }}>Why would they choose this?</p>

<p style={{ marginBottom: "1.75rem" }}>Will they pay?</p>

<p style={{ marginBottom: "1.75rem" }}>Can I reach enough of them?</p>

<p style={{ marginBottom: "1.75rem" }}>Can the economics work?</p>

<p style={{ marginBottom: "1.75rem" }}>What am I assuming?</p>

<p style={{ marginBottom: "1.75rem" }}>What evidence do I actually have?</p>

<p style={{ marginBottom: "2.5rem" }}>What is the cheapest next test?</p>

<p style={{ marginBottom: "2.5rem" }}>And finally:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What evidence would make me change or kill this idea?</p>

<p style={{ marginBottom: "2.5rem" }}>That last question matters.</p>

<p style={{ marginBottom: "2.5rem" }}>Because if the answer is:</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"Nothing."</p>

<p style={{ marginBottom: "3.5rem" }}>you aren't validating the idea anymore.</p>

<p style={{ marginBottom: "3.5rem" }}>You're defending it.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The simplest answer</h2>

<p style={{ marginBottom: "2.5rem" }}>So how do you know whether a business idea is viable?</p>

<p style={{ marginBottom: "2.5rem" }}>You don't know because it sounds clever.</p>

<p style={{ marginBottom: "2.5rem" }}>You don't know because people like it.</p>

<p style={{ marginBottom: "2.5rem" }}>You don't know because ChatGPT tells you it has "strong market potential."</p>

<p style={{ marginBottom: "2.5rem" }}>You know because enough evidence starts connecting:</p>

<p style={{ marginBottom: "1.75rem" }}>a real customer, a meaningful problem, willingness to pay, practical reachability and economics that have a chance of working.</p>

<p style={{ marginBottom: "3.5rem" }}>And until those things start appearing?</p>

<p style={{ marginBottom: "2.5rem" }}>Don't fall in love yet.</p>

<p style={{ marginBottom: "3.5rem" }}>The idea still has something to prove.</p>

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
                  <Link href="/thinking/your-business-idea-is-worth-nothing" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
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
                      transition={{ duration: 0.7, delay: 0.3 }}
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
