/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts";
  const articleTitle = "Your Life Is Perfectly Designed to Kill Your Business Before It Starts";

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
                  Your Life Is Perfectly Designed to Kill Your Business Before It Starts
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Most aspiring entrepreneurs don't have a motivation problem. They have a structural problem. Their current life leaves no room for the business they keep saying they want to build.
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
              style={{ fontSize: "1.125rem", lineHeight: "1.8", color: "#1a1816" }}
            >
<p style={{ marginBottom: "3.5rem" }}>"I'll start when things calm down."</p>
<p style={{ marginBottom: "3.5rem" }}>No, you won't.</p>
<p style={{ marginBottom: "1.75rem" }}>Not because you're lazy.</p>
<p style={{ marginBottom: "1.75rem" }}>Not because you lack ambition.</p>
<p style={{ marginBottom: "1.75rem" }}>And probably not because you need another productivity app.</p>
<p style={{ marginBottom: "2.5rem" }}>You won't start because things aren't temporarily chaotic.</p>
<p style={{ marginBottom: "2.5rem" }}>Your life is working exactly as currently designed.</p>
<p style={{ marginBottom: "1.75rem" }}>Work consumes the day.</p>
<p style={{ marginBottom: "1.75rem" }}>Evenings recover from work.</p>
<p style={{ marginBottom: "1.75rem" }}>Weekends repair whatever the week damaged.</p>
<p style={{ marginBottom: "3.5rem" }}>Monday arrives.</p>
<p style={{ marginBottom: "3.5rem" }}>Repeat.</p>
<p style={{ marginBottom: "2.5rem" }}>Somewhere inside this beautifully functioning machine is a business you're apparently going to build.</p>
<p style={{ marginBottom: "3.5rem" }}>Soon.</p>
<p style={{ marginBottom: "2.5rem" }}>The problem is that "soon" has no structural place to exist.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your life is already optimized</h2>
<p style={{ marginBottom: "2.5rem" }}>This is the uncomfortable part.</p>
<p style={{ marginBottom: "2.5rem" }}>Your current life may feel chaotic.</p>
<p style={{ marginBottom: "3.5rem" }}>Structurally, it probably isn't.</p>
<p style={{ marginBottom: "2.5rem" }}>It has routines.</p>
<p style={{ marginBottom: "1.75rem" }}>Obligations.</p>
<p style={{ marginBottom: "1.75rem" }}>Work.</p>
<p style={{ marginBottom: "1.75rem" }}>Family.</p>
<p style={{ marginBottom: "1.75rem" }}>Financial commitments.</p>
<p style={{ marginBottom: "1.75rem" }}>Habits.</p>
<p style={{ marginBottom: "1.75rem" }}>Recovery.</p>
<p style={{ marginBottom: "1.75rem" }}>Social life.</p>
<p style={{ marginBottom: "3.5rem" }}>Responsibilities.</p>
<p style={{ marginBottom: "2.5rem" }}>Your time already goes somewhere.</p>
<p style={{ marginBottom: "2.5rem" }}>Your energy already goes somewhere.</p>
<p style={{ marginBottom: "3.5rem" }}>Your attention already goes somewhere.</p>
<p style={{ marginBottom: "2.5rem" }}>Then you decide to add entrepreneurship.</p>
<p style={{ marginBottom: "2.5rem" }}>Not replace anything.</p>
<p style={{ marginBottom: "3.5rem" }}>Add it.</p>
<p style={{ marginBottom: "2.5rem" }}>Usually into whatever fragments remain.</p>
<p style={{ marginBottom: "3.5rem" }}>And then we're surprised when progress is inconsistent.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Motivation is a terrible operating system</h2>
<p style={{ marginBottom: "2.5rem" }}>Motivation feels powerful.</p>
<p style={{ marginBottom: "3.5rem" }}>Sunday night:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>This is the week.</p>
<p style={{ marginBottom: "3.5rem" }}>Monday morning:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Let's go.</p>
<p style={{ marginBottom: "1.75rem" }}>Tuesday evening:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Long day.</p>
<p style={{ marginBottom: "1.75rem" }}>Wednesday:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Maybe tomorrow.</p>
<p style={{ marginBottom: "1.75rem" }}>Thursday:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>I deserve Netflix.</p>
<p style={{ marginBottom: "1.75rem" }}>Friday:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Obviously not.</p>
<p style={{ marginBottom: "1.75rem" }}>Saturday:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Life.</p>
<p style={{ marginBottom: "1.75rem" }}>Sunday evening:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>This is the week.</p>
<p style={{ marginBottom: "2.5rem" }}>Nothing is wrong with you.</p>
<p style={{ marginBottom: "3.5rem" }}>The structure won.</p>
<p style={{ marginBottom: "3.5rem" }}>It usually does.</p>
<p style={{ marginBottom: "2.5rem" }}>If building your business depends on repeatedly winning a negotiation against exhaustion, distraction and everything else in your life, you've designed a fragile system.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Time is only the first constraint</h2>
<p style={{ marginBottom: "2.5rem" }}>People say:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"I don't have time."</p>
<p style={{ marginBottom: "3.5rem" }}>Sometimes that's true.</p>
<p style={{ marginBottom: "3.5rem" }}>But I care about three things:</p>
<p style={{ marginBottom: "1.75rem" }}>Time.</p>
<p style={{ marginBottom: "1.75rem" }}>Energy.</p>
<p style={{ marginBottom: "3.5rem" }}>Cognitive space.</p>
<p style={{ marginBottom: "2.5rem" }}>You may technically have two hours available after work.</p>
<p style={{ marginBottom: "3.5rem" }}>Wonderful.</p>
<p style={{ marginBottom: "2.5rem" }}>What kind of two hours?</p>
<p style={{ marginBottom: "1.75rem" }}>Fresh?</p>
<p style={{ marginBottom: "1.75rem" }}>Focused?</p>
<p style={{ marginBottom: "1.75rem" }}>Creative?</p>
<p style={{ marginBottom: "3.5rem" }}>Or are you staring at the laptop with the intellectual capacity of a potato?</p>
<p style={{ marginBottom: "2.5rem" }}>Two available hours and two useful hours are not the same resource.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Energy quality matters</h2>
<p style={{ marginBottom: "2.5rem" }}>Building something new requires a particular kind of energy.</p>
<p style={{ marginBottom: "1.75rem" }}>You need to think.</p>
<p style={{ marginBottom: "1.75rem" }}>Decide.</p>
<p style={{ marginBottom: "1.75rem" }}>Create.</p>
<p style={{ marginBottom: "1.75rem" }}>Learn.</p>
<p style={{ marginBottom: "1.75rem" }}>Handle uncertainty.</p>
<p style={{ marginBottom: "3.5rem" }}>Do things you're not yet good at.</p>
<p style={{ marginBottom: "2.5rem" }}>Corporate work may already consume most of that capacity.</p>
<p style={{ marginBottom: "2.5rem" }}>By evening, you don't necessarily need more discipline.</p>
<p style={{ marginBottom: "3.5rem" }}>You may simply have nothing useful left.</p>
<p style={{ marginBottom: "2.5rem" }}>So the question isn't:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Where can I find more hours?</p>
<p style={{ marginBottom: "3.5rem" }}>It's:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Where in my week does useful entrepreneurial energy actually exist?</p>
<p style={{ marginBottom: "3.5rem" }}>That's a much better design problem.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Then there is cognitive load</h2>
<p style={{ marginBottom: "2.5rem" }}>Your calendar can be empty while your brain is full.</p>
<p style={{ marginBottom: "1.75rem" }}>Deadlines.</p>
<p style={{ marginBottom: "1.75rem" }}>Bills.</p>
<p style={{ marginBottom: "1.75rem" }}>Family.</p>
<p style={{ marginBottom: "1.75rem" }}>Work politics.</p>
<p style={{ marginBottom: "1.75rem" }}>The presentation on Thursday.</p>
<p style={{ marginBottom: "1.75rem" }}>The email you haven't answered.</p>
<p style={{ marginBottom: "1.75rem" }}>The thing you forgot.</p>
<p style={{ marginBottom: "1.75rem" }}>The thing you're trying not to forget.</p>
<p style={{ marginBottom: "1.75rem" }}>The conversation you need to have.</p>
<p style={{ marginBottom: "1.75rem" }}>The possibility of restructuring at work.</p>
<p style={{ marginBottom: "1.75rem" }}>The mortgage.</p>
<p style={{ marginBottom: "1.75rem" }}>The children.</p>
<p style={{ marginBottom: "1.75rem" }}>The parents.</p>
<p style={{ marginBottom: "3.5rem" }}>The future.</p>
<p style={{ marginBottom: "3.5rem" }}>Entrepreneurship arrives and asks:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Excellent. Now, would you like to contemplate customer acquisition economics?</p>
<p style={{ marginBottom: "3.5rem" }}>Your brain would like to decline.</p>
<p style={{ marginBottom: "2.5rem" }}>Building a business needs some cognitive space.</p>
<p style={{ marginBottom: "2.5rem" }}>Not endless meditation in the mountains.</p>
<p style={{ marginBottom: "3.5rem" }}>Space.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>This is why people wait for the trigger</h2>
<p style={{ marginBottom: "2.5rem" }}>Then something happens.</p>
<p style={{ marginBottom: "1.75rem" }}>Layoff.</p>
<p style={{ marginBottom: "1.75rem" }}>Burnout.</p>
<p style={{ marginBottom: "1.75rem" }}>Restructuring.</p>
<p style={{ marginBottom: "1.75rem" }}>A terrible new boss.</p>
<p style={{ marginBottom: "1.75rem" }}>A health scare.</p>
<p style={{ marginBottom: "3.5rem" }}>A birthday that lands slightly harder than expected.</p>
<p style={{ marginBottom: "3.5rem" }}>Suddenly the person who had no time has lots of urgency.</p>
<p style={{ marginBottom: "2.5rem" }}>But urgency isn't preparation.</p>
<p style={{ marginBottom: "2.5rem" }}>Now they're trying to build under pressure.</p>
<p style={{ marginBottom: "1.75rem" }}>The business needs to work.</p>
<p style={{ marginBottom: "1.75rem" }}>Quickly.</p>
<p style={{ marginBottom: "1.75rem" }}>Savings are disappearing.</p>
<p style={{ marginBottom: "1.75rem" }}>Confidence is wobbling.</p>
<p style={{ marginBottom: "3.5rem" }}>Every decision feels heavier.</p>
<p style={{ marginBottom: "2.5rem" }}>The transition that could have been architected becomes an emergency.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Freedom requires preparation</h2>
<p style={{ marginBottom: "2.5rem" }}>People love the freedom narrative around entrepreneurship.</p>
<p style={{ marginBottom: "1.75rem" }}>No boss.</p>
<p style={{ marginBottom: "1.75rem" }}>Work anywhere.</p>
<p style={{ marginBottom: "3.5rem" }}>Control your time.</p>
<p style={{ marginBottom: "3.5rem" }}>Lovely.</p>
<p style={{ marginBottom: "3.5rem" }}>Eventually, perhaps.</p>
<p style={{ marginBottom: "2.5rem" }}>But freedom isn't the starting condition.</p>
<p style={{ marginBottom: "2.5rem" }}>At the beginning, you're exchanging one structure for another that doesn't exist yet.</p>
<p style={{ marginBottom: "3.5rem" }}>That requires deliberate preparation.</p>
<p style={{ marginBottom: "1.75rem" }}>Financially.</p>
<p style={{ marginBottom: "1.75rem" }}>Practically.</p>
<p style={{ marginBottom: "1.75rem" }}>Psychologically.</p>
<p style={{ marginBottom: "3.5rem" }}>Operationally.</p>
<p style={{ marginBottom: "2.5rem" }}>The objective isn't to quit your job dramatically on Friday and become an entrepreneur on Monday.</p>
<p style={{ marginBottom: "3.5rem" }}>LinkedIn already has enough cinematic resignation posts.</p>
<p style={{ marginBottom: "2.5rem" }}>The objective is to create enough room to begin discovering what could come next before circumstances make the decision for you.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Founder Architecture comes before Business Architecture</h2>
<p style={{ marginBottom: "2.5rem" }}>This is why I separate the entrepreneur from the enterprise.</p>
<p style={{ marginBottom: "3.5rem" }}>Before asking:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What business should we build?</p>
<p style={{ marginBottom: "3.5rem" }}>I want to ask:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What business can you realistically build?</p>
<p style={{ marginBottom: "2.5rem" }}>Those aren't always the same thing.</p>
<p style={{ marginBottom: "1.75rem" }}>How much time can you commit?</p>
<p style={{ marginBottom: "1.75rem" }}>How much financial runway exists?</p>
<p style={{ marginBottom: "1.75rem" }}>How much income eventually needs replacing?</p>
<p style={{ marginBottom: "1.75rem" }}>What are your strongest capabilities?</p>
<p style={{ marginBottom: "1.75rem" }}>What drains you?</p>
<p style={{ marginBottom: "1.75rem" }}>How much uncertainty can you tolerate?</p>
<p style={{ marginBottom: "1.75rem" }}>Do you want employees?</p>
<p style={{ marginBottom: "1.75rem" }}>Investors?</p>
<p style={{ marginBottom: "1.75rem" }}>A large organization?</p>
<p style={{ marginBottom: "1.75rem" }}>A small profitable business?</p>
<p style={{ marginBottom: "1.75rem" }}>Location independence?</p>
<p style={{ marginBottom: "1.75rem" }}>Predictability?</p>
<p style={{ marginBottom: "1.75rem" }}>Growth?</p>
<p style={{ marginBottom: "3.5rem" }}>Status?</p>
<p style={{ marginBottom: "2.5rem" }}>Some combinations work.</p>
<p style={{ marginBottom: "3.5rem" }}>Some fight each other.</p>
<p style={{ marginBottom: "2.5rem" }}>A business isn't successful if it makes money while creating a life you hate.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your ambition needs an operating environment</h2>
<p style={{ marginBottom: "2.5rem" }}>Suppose you want to build a business while keeping your job.</p>
<p style={{ marginBottom: "3.5rem" }}>Fine.</p>
<p style={{ marginBottom: "3.5rem" }}>That's possible.</p>
<p style={{ marginBottom: "2.5rem" }}>But where does the business live?</p>
<p style={{ marginBottom: "1.75rem" }}>Tuesday and Thursday mornings from 6:30 to 8:00?</p>
<p style={{ marginBottom: "1.75rem" }}>Saturday from 8:00 to noon?</p>
<p style={{ marginBottom: "1.75rem" }}>One protected evening?</p>
<p style={{ marginBottom: "3.5rem" }}>A reduced workweek?</p>
<p style={{ marginBottom: "3.5rem" }}>A three-month sabbatical?</p>
<p style={{ marginBottom: "3.5rem" }}>Something has to become real.</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"I'll work on it when I have time" is not architecture.</p>
<p style={{ marginBottom: "3.5rem" }}>It's a wish.</p>
<p style={{ marginBottom: "2.5rem" }}>Protected time matters because it removes repeated decision-making.</p>
<p style={{ marginBottom: "2.5rem" }}>You don't ask whether you feel motivated.</p>
<p style={{ marginBottom: "3.5rem" }}>That's simply when the business gets built.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Remove before you add</h2>
<p style={{ marginBottom: "2.5rem" }}>This is another place people get things backwards.</p>
<p style={{ marginBottom: "3.5rem" }}>They add:</p>
<p style={{ marginBottom: "1.75rem" }}>A new project.</p>
<p style={{ marginBottom: "1.75rem" }}>A new course.</p>
<p style={{ marginBottom: "1.75rem" }}>A new AI tool.</p>
<p style={{ marginBottom: "1.75rem" }}>A new morning routine.</p>
<p style={{ marginBottom: "1.75rem" }}>A new productivity system.</p>
<p style={{ marginBottom: "3.5rem" }}>A new business.</p>
<p style={{ marginBottom: "3.5rem" }}>At some point, the architecture collapses under its own enthusiasm.</p>
<p style={{ marginBottom: "2.5rem" }}>Before adding entrepreneurship, ask what can disappear.</p>
<p style={{ marginBottom: "1.75rem" }}>Commitments.</p>
<p style={{ marginBottom: "1.75rem" }}>Meetings.</p>
<p style={{ marginBottom: "1.75rem" }}>Scrolling.</p>
<p style={{ marginBottom: "1.75rem" }}>Projects that no longer matter.</p>
<p style={{ marginBottom: "1.75rem" }}>Obligations you accepted five years ago and never reconsidered.</p>
<p style={{ marginBottom: "3.5rem" }}>Energy leaks.</p>
<p style={{ marginBottom: "1.75rem" }}>Complexity.</p>
<p style={{ marginBottom: "3.5rem" }}>You don't always need better productivity.</p>
<p style={{ marginBottom: "3.5rem" }}>Sometimes you need less life clutter.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Start before you're ready to leave</h2>
<p style={{ marginBottom: "2.5rem" }}>This is especially important for experienced professionals considering entrepreneurship.</p>
<p style={{ marginBottom: "3.5rem" }}>You don't need to resign to start learning.</p>
<p style={{ marginBottom: "1.75rem" }}>Talk to potential customers.</p>
<p style={{ marginBottom: "1.75rem" }}>Explore problems.</p>
<p style={{ marginBottom: "1.75rem" }}>Map your skills.</p>
<p style={{ marginBottom: "1.75rem" }}>Study markets.</p>
<p style={{ marginBottom: "1.75rem" }}>Test an idea.</p>
<p style={{ marginBottom: "3.5rem" }}>Build a tiny offer.</p>
<p style={{ marginBottom: "1.75rem" }}>Understand your financial requirements.</p>
<p style={{ marginBottom: "1.75rem" }}>Learn how customer acquisition actually works.</p>
<p style={{ marginBottom: "3.5rem" }}>Find out whether you enjoy selling.</p>
<p style={{ marginBottom: "2.5rem" }}>That last discovery has ruined a few entrepreneurial fantasies.</p>
<p style={{ marginBottom: "3.5rem" }}>Good.</p>
<p style={{ marginBottom: "3.5rem" }}>Better now.</p>
<p style={{ marginBottom: "2.5rem" }}>The goal isn't secretly operating a second full-time company at midnight.</p>
<p style={{ marginBottom: "3.5rem" }}>It's reducing uncertainty before the transition becomes irreversible.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Architect the transition</h2>
<p style={{ marginBottom: "2.5rem" }}>Think of the move into entrepreneurship as its own architecture.</p>
<p style={{ marginBottom: "1.75rem" }}>Where are you now?</p>
<p style={{ marginBottom: "1.75rem" }}>Where do you want to be?</p>
<p style={{ marginBottom: "3.5rem" }}>What has to become true before the transition makes sense?</p>
<p style={{ marginBottom: "1.75rem" }}>Financial runway?</p>
<p style={{ marginBottom: "1.75rem" }}>Evidence of demand?</p>
<p style={{ marginBottom: "1.75rem" }}>First customer?</p>
<p style={{ marginBottom: "1.75rem" }}>Validated offer?</p>
<p style={{ marginBottom: "1.75rem" }}>A certain revenue level?</p>
<p style={{ marginBottom: "1.75rem" }}>A reduced employment arrangement?</p>
<p style={{ marginBottom: "1.75rem" }}>Specific skills?</p>
<p style={{ marginBottom: "1.75rem" }}>A partner?</p>
<p style={{ marginBottom: "3.5rem" }}>A deadline?</p>
<p style={{ marginBottom: "2.5rem" }}>Then reverse-engineer.</p>
<p style={{ marginBottom: "1.75rem" }}>What can be tested while you're still employed?</p>
<p style={{ marginBottom: "1.75rem" }}>What requires more commitment?</p>
<p style={{ marginBottom: "1.75rem" }}>What risks can be reduced?</p>
<p style={{ marginBottom: "3.5rem" }}>What should you absolutely not spend money on yet?</p>
<p style={{ marginBottom: "3.5rem" }}>Suddenly "I want to start a business someday" becomes something more useful.</p>
<p style={{ marginBottom: "3.5rem" }}>A sequence.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>You don't need a perfect life</h2>
<p style={{ marginBottom: "2.5rem" }}>None of this means waiting until every condition is ideal.</p>
<p style={{ marginBottom: "3.5rem" }}>That's another excellent way to never begin.</p>
<p style={{ marginBottom: "1.75rem" }}>Children will still need things.</p>
<p style={{ marginBottom: "1.75rem" }}>Work will remain irritating.</p>
<p style={{ marginBottom: "3.5rem" }}>Unexpected expenses will continue their proud tradition of arriving unexpectedly.</p>
<p style={{ marginBottom: "2.5rem" }}>Life doesn't clear the runway for entrepreneurship.</p>
<p style={{ marginBottom: "3.5rem" }}>You create enough runway to take off anyway.</p>
<p style={{ marginBottom: "2.5rem" }}>The objective is not perfection.</p>
<p style={{ marginBottom: "3.5rem" }}>It's structural plausibility.</p>
<p style={{ marginBottom: "3.5rem" }}>Can progress happen repeatedly in the life you actually have?</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your business begins before the business</h2>
<p style={{ marginBottom: "2.5rem" }}>This is the larger point.</p>
<p style={{ marginBottom: "2.5rem" }}>People think entrepreneurship begins with the idea.</p>
<p style={{ marginBottom: "3.5rem" }}>Often it begins earlier.</p>
<p style={{ marginBottom: "1.75rem" }}>With capacity.</p>
<p style={{ marginBottom: "1.75rem" }}>With readiness.</p>
<p style={{ marginBottom: "1.75rem" }}>With creating enough room to explore.</p>
<p style={{ marginBottom: "3.5rem" }}>With understanding what kind of business fits the human being who's going to have to build it.</p>
<p style={{ marginBottom: "2.5rem" }}>Because the founder isn't separate from the architecture.</p>
<p style={{ marginBottom: "3.5rem" }}>The founder is one of its most important constraints.</p>
<p style={{ marginBottom: "3.5rem" }}>And one of its greatest assets.</p>
<p style={{ marginBottom: "2.5rem" }}>If you've been telling yourself you'll start when things calm down, stop waiting for calm.</p>
<p style={{ marginBottom: "1.75rem" }}>Look at the structure.</p>
<p style={{ marginBottom: "1.75rem" }}>Where does your time go?</p>
<p style={{ marginBottom: "1.75rem" }}>Where does your energy go?</p>
<p style={{ marginBottom: "1.75rem" }}>What occupies your head?</p>
<p style={{ marginBottom: "1.75rem" }}>What can disappear?</p>
<p style={{ marginBottom: "3.5rem" }}>What needs protecting?</p>
<p style={{ marginBottom: "2.5rem" }}>What needs to become true before you make a bigger move?</p>
<p style={{ marginBottom: "2.5rem" }}>Don't wait for your life to magically create room for the business.</p>
<p style={{ marginBottom: "3.5rem" }}>It won't.</p>
<p style={{ marginBottom: "1.75rem" }}>Architect the room.</p>
<p style={{ marginBottom: "3.5rem" }}>Then start building.</p>
            </motion.div>
          </div>
        </section>

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-50px" }} className="space-y-12">
              <div className="space-y-4">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Share</p>
                <div className="flex flex-wrap gap-6">
                  <button onClick={() => handleShare("linkedin")} className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60">LinkedIn</button>
                  <button onClick={() => handleShare("facebook")} className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60">Facebook</button>
                  <button onClick={() => handleShare("copy")} className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60">{copyFeedback ? "Copied" : "Copy Link"}</button>
                </div>
              </div>
              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related Thinking</p>
                <div className="space-y-6">
                  <Link href="/thinking/your-corporate-experience-may-be-working-against-you" className="group block">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="space-y-2">
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">Your Corporate Experience May Be Working Against You</h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">Leading an established business and creating one from nothing are different games.</p>
                    </motion.div>
                  </Link>
                  <Link href="/thinking/the-fastest-way-to-build-the-wrong-business" className="group block">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }} viewport={{ once: true }} className="space-y-2">
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">The Fastest Way to Build the Wrong Business</h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">Start building before you've worked out what needs to exist.</p>
                    </motion.div>
                  </Link>
                </div>
              </div>
              <div className="pt-8 border-t border-[#1a1816]/8 space-y-4">
                <Link href="/work" className="block">
                  <motion.span className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60" whileHover={{ x: 2 }}>Explore business architecture work →</motion.span>
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
