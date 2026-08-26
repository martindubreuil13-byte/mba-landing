/* eslint-disable react/no-unescaped-entities */
"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/the-brutal-truth-about-startup-fundraising";
  const articleTitle = "The Brutal Truth About Startup Fundraising";

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
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-50px" }} className="space-y-8">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Thinking</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">The Brutal Truth About Startup Fundraising</h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">Most early founders who think they have a fundraising problem don't. They have a business-readiness problem — and investors can usually see it before they can.</p>
              </div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12">
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
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-50px" }} className="prose prose-lg max-w-none" style={{ fontSize: "1.125rem", lineHeight: "1.8", color: "#1a1816" }}>

<p style={{ marginBottom: "2.5rem" }}>One of the most common reasons startup founders approach me is fundraising.</p>
<p style={{ marginBottom: "3.5rem" }}>Which is slightly inconvenient.</p>
<p style={{ marginBottom: "2.5rem" }}>Because I'm not a fundraising expert.</p>
<p style={{ marginBottom: "3.5rem" }}>I'm a Business Architect.</p>
<p style={{ marginBottom: "2.5rem" }}>I help entrepreneurs work out what business should exist, how it should work and what needs to happen to make it real.</p>
<p style={{ marginBottom: "2.5rem" }}>Yet somehow, sooner or later, many startup conversations arrive at the same sentence:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We need to raise money."</p>
<p style={{ marginBottom: "2.5rem" }}>Maybe.</p>
<p style={{ marginBottom: "2.5rem" }}>But quite often, within a few minutes, I'm thinking something else.</p>
<p style={{ marginBottom: "3.5rem" }}>You're not ready to raise money.</p>
<p style={{ marginBottom: "3.5rem" }}>Not yet.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>An idea and a funding requirement are not an investment case</h2>
<p style={{ marginBottom: "2.5rem" }}>The idea may be excellent.</p>
<p style={{ marginBottom: "1.75rem" }}>The market may be enormous.</p>
<p style={{ marginBottom: "1.75rem" }}>The technology may be impressive.</p>
<p style={{ marginBottom: "3.5rem" }}>The founder may be brilliant.</p>
<p style={{ marginBottom: "2.5rem" }}>None of that automatically means the business is ready for external capital.</p>
<p style={{ marginBottom: "2.5rem" }}>Founders sometimes arrive with two things:</p>
<p style={{ marginBottom: "1.75rem" }}>An idea.</p>
<p style={{ marginBottom: "3.5rem" }}>And a number.</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We're raising $750,000."</p>
<p style={{ marginBottom: "3.5rem" }}>Fine.</p>
<p style={{ marginBottom: "3.5rem" }}>What does $750,000 make true?</p>
<p style={{ marginBottom: "3.5rem" }}>Silence.</p>
<p style={{ marginBottom: "3.5rem" }}>That's the problem.</p>
<p style={{ marginBottom: "2.5rem" }}>Capital is not a business model.</p>
<p style={{ marginBottom: "3.5rem" }}>It's fuel.</p>
<p style={{ marginBottom: "2.5rem" }}>And before adding fuel, it helps to know whether we've built a vehicle, where it's going and whether any of the wheels are attached.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Investors aren't buying your enthusiasm</h2>
<p style={{ marginBottom: "2.5rem" }}>Founders are understandably excited about their businesses.</p>
<p style={{ marginBottom: "3.5rem" }}>They should be.</p>
<p style={{ marginBottom: "2.5rem" }}>You may have spent a year thinking about the opportunity.</p>
<p style={{ marginBottom: "1.75rem" }}>You see what it could become.</p>
<p style={{ marginBottom: "1.75rem" }}>You understand the vision.</p>
<p style={{ marginBottom: "1.75rem" }}>You can imagine the market.</p>
<p style={{ marginBottom: "3.5rem" }}>You can see the future.</p>
<p style={{ marginBottom: "2.5rem" }}>An investor has a slightly different problem.</p>
<p style={{ marginBottom: "3.5rem" }}>They need to decide whether giving you money increases the probability of getting considerably more money back.</p>
<p style={{ marginBottom: "3.5rem" }}>Romantic, isn't it?</p>
<p style={{ marginBottom: "2.5rem" }}>So while you're explaining possibility, they're evaluating probability.</p>
<p style={{ marginBottom: "1.75rem" }}>Can this team execute?</p>
<p style={{ marginBottom: "1.75rem" }}>Does this market exist?</p>
<p style={{ marginBottom: "1.75rem" }}>Do customers care?</p>
<p style={{ marginBottom: "1.75rem" }}>Can this scale?</p>
<p style={{ marginBottom: "1.75rem" }}>Are the economics plausible?</p>
<p style={{ marginBottom: "1.75rem" }}>What has already been proven?</p>
<p style={{ marginBottom: "1.75rem" }}>What remains assumption?</p>
<p style={{ marginBottom: "1.75rem" }}>What does the capital achieve?</p>
<p style={{ marginBottom: "3.5rem" }}>What happens after this round?</p>
<p style={{ marginBottom: "2.5rem" }}>Your excitement may get attention.</p>
<p style={{ marginBottom: "3.5rem" }}>Evidence survives diligence.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The problem often isn't fundraising. It's readiness.</h2>
<p style={{ marginBottom: "2.5rem" }}>Founders can become obsessed with:</p>
<p style={{ marginBottom: "1.75rem" }}>Which investors?</p>
<p style={{ marginBottom: "1.75rem" }}>Warm introductions?</p>
<p style={{ marginBottom: "1.75rem" }}>Pitch events?</p>
<p style={{ marginBottom: "1.75rem" }}>Deck design?</p>
<p style={{ marginBottom: "3.5rem" }}>Valuation?</p>
<p style={{ marginBottom: "2.5rem" }}>Meanwhile, more basic questions remain strangely homeless.</p>
<p style={{ marginBottom: "1.75rem" }}>Who exactly is the customer?</p>
<p style={{ marginBottom: "1.75rem" }}>What sufficiently important problem are you solving?</p>
<p style={{ marginBottom: "1.75rem" }}>Why will they change?</p>
<p style={{ marginBottom: "1.75rem" }}>What will they pay?</p>
<p style={{ marginBottom: "1.75rem" }}>How do you reach them?</p>
<p style={{ marginBottom: "1.75rem" }}>What does acquisition cost?</p>
<p style={{ marginBottom: "1.75rem" }}>What does delivery cost?</p>
<p style={{ marginBottom: "1.75rem" }}>What is the business model?</p>
<p style={{ marginBottom: "1.75rem" }}>What evidence supports the assumptions?</p>
<p style={{ marginBottom: "1.75rem" }}>What milestone makes this company meaningfully more valuable?</p>
<p style={{ marginBottom: "3.5rem" }}>Those aren't fundraising questions.</p>
<p style={{ marginBottom: "3.5rem" }}>They're business questions.</p>
<p style={{ marginBottom: "2.5rem" }}>And if they're fuzzy before the investor meeting, the investor meeting rarely makes them clearer.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Build the pitch deck before you're ready to pitch</h2>
<p style={{ marginBottom: "2.5rem" }}>This is an exercise I like.</p>
<p style={{ marginBottom: "3.5rem" }}>Build the deck.</p>
<p style={{ marginBottom: "2.5rem" }}>Not because you should start sending it.</p>
<p style={{ marginBottom: "3.5rem" }}>Don't.</p>
<p style={{ marginBottom: "2.5rem" }}>Build it because a good pitch deck is a rather efficient interrogation device.</p>
<p style={{ marginBottom: "1.75rem" }}>Problem.</p>
<p style={{ marginBottom: "3.5rem" }}>Fine. What problem?</p>
<p style={{ marginBottom: "1.75rem" }}>For whom?</p>
<p style={{ marginBottom: "3.5rem" }}>How important?</p>
<p style={{ marginBottom: "1.75rem" }}>Solution.</p>
<p style={{ marginBottom: "3.5rem" }}>Fine. Why this?</p>
<p style={{ marginBottom: "1.75rem" }}>Why now?</p>
<p style={{ marginBottom: "3.5rem" }}>Market. How big?</p>
<p style={{ marginBottom: "1.75rem" }}>According to whom?</p>
<p style={{ marginBottom: "3.5rem" }}>Reachable by you?</p>
<p style={{ marginBottom: "1.75rem" }}>Competition.</p>
<p style={{ marginBottom: "1.75rem" }}>What are customers doing today?</p>
<p style={{ marginBottom: "3.5rem" }}>Why change?</p>
<p style={{ marginBottom: "1.75rem" }}>Business model.</p>
<p style={{ marginBottom: "3.5rem" }}>How exactly does money appear?</p>
<p style={{ marginBottom: "1.75rem" }}>Go-to-market.</p>
<p style={{ marginBottom: "3.5rem" }}>How exactly do customers appear?</p>
<p style={{ marginBottom: "1.75rem" }}>Traction.</p>
<p style={{ marginBottom: "3.5rem" }}>What evidence exists?</p>
<p style={{ marginBottom: "1.75rem" }}>Financials.</p>
<p style={{ marginBottom: "3.5rem" }}>What assumptions are hiding underneath them?</p>
<p style={{ marginBottom: "1.75rem" }}>Team.</p>
<p style={{ marginBottom: "3.5rem" }}>Why you?</p>
<p style={{ marginBottom: "1.75rem" }}>Use of funds.</p>
<p style={{ marginBottom: "3.5rem" }}>What does the money actually achieve?</p>
<p style={{ marginBottom: "1.75rem" }}>Roadmap.</p>
<p style={{ marginBottom: "3.5rem" }}>What becomes true next?</p>
<p style={{ marginBottom: "2.5rem" }}>Slide by slide, the business is forced to explain itself.</p>
<p style={{ marginBottom: "2.5rem" }}>That's useful even if no investor ever sees the deck.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A beautiful deck can still describe a terrible business</h2>
<p style={{ marginBottom: "2.5rem" }}>Let's not get carried away.</p>
<p style={{ marginBottom: "2.5rem" }}>The deck isn't evidence either.</p>
<p style={{ marginBottom: "2.5rem" }}>A founder can create a gorgeous presentation describing an economically impossible fantasy.</p>
<p style={{ marginBottom: "2.5rem" }}>AI has made this easier.</p>
<p style={{ marginBottom: "2.5rem" }}>We can now generate market analysis, financial projections, competitive landscapes and investor narratives with impressive speed.</p>
<p style={{ marginBottom: "2.5rem" }}>The PowerPoint may look like McKinsey spent three months on it.</p>
<p style={{ marginBottom: "3.5rem" }}>The customer still hasn't bought anything.</p>
<p style={{ marginBottom: "2.5rem" }}>Artifacts are not evidence.</p>
<p style={{ marginBottom: "2.5rem" }}>A deck should expose the architecture.</p>
<p style={{ marginBottom: "3.5rem" }}>It doesn't replace it.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>What does the money actually do?</h2>
<p style={{ marginBottom: "2.5rem" }}>This question matters enormously.</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We need money to grow."</p>
<p style={{ marginBottom: "3.5rem" }}>Grow what?</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We need to hire."</p>
<p style={{ marginBottom: "3.5rem" }}>Why?</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We need marketing."</p>
<p style={{ marginBottom: "3.5rem" }}>To acquire whom at what economics?</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We need to finish the product."</p>
<p style={{ marginBottom: "3.5rem" }}>What evidence says the finished product deserves finishing?</p>
<p style={{ marginBottom: "2.5rem" }}>Capital should move the business from one meaningful state to another.</p>
<p style={{ marginBottom: "1.75rem" }}>Perhaps:</p>
<p style={{ marginBottom: "1.75rem" }}>Prototype to validated product.</p>
<p style={{ marginBottom: "1.75rem" }}>Initial demand to repeatable acquisition.</p>
<p style={{ marginBottom: "1.75rem" }}>Local proof to geographic expansion.</p>
<p style={{ marginBottom: "1.75rem" }}>Manual delivery to scalable operations.</p>
<p style={{ marginBottom: "3.5rem" }}>Early revenue to a repeatable commercial engine.</p>
<p style={{ marginBottom: "2.5rem" }}>The amount should connect to milestones.</p>
<p style={{ marginBottom: "2.5rem" }}>The milestones should reduce risk or increase value.</p>
<p style={{ marginBottom: "2.5rem" }}>Otherwise the use-of-funds slide becomes a shopping list with percentages.</p>
<p style={{ marginBottom: "1.75rem" }}>35% product.</p>
<p style={{ marginBottom: "1.75rem" }}>30% marketing.</p>
<p style={{ marginBottom: "1.75rem" }}>20% team.</p>
<p style={{ marginBottom: "3.5rem" }}>15% miscellaneous optimism.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Raise against a sequence</h2>
<p style={{ marginBottom: "2.5rem" }}>This is where <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] hover:border-[#6b1f1f]/60 transition-colors">Business Architecture</Link> becomes useful.</p>
<p style={{ marginBottom: "2.5rem" }}>Instead of asking:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>How much can we raise?</p>
<p style={{ marginBottom: "3.5rem" }}>Ask:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What needs to become true next?</p>
<p style={{ marginBottom: "3.5rem" }}>Then:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>What work makes that true?</p>
<p style={{ marginBottom: "1.75rem" }}>What resources does that require?</p>
<p style={{ marginBottom: "1.75rem" }}>What can be proven without external capital?</p>
<p style={{ marginBottom: "1.75rem" }}>What genuinely requires capital?</p>
<p style={{ marginBottom: "3.5rem" }}>How long should it take?</p>
<p style={{ marginBottom: "1.75rem" }}>What evidence should exist at the end?</p>
<p style={{ marginBottom: "3.5rem" }}>Now the funding requirement starts coming from the business rather than the founder's preferred round size.</p>
<p style={{ marginBottom: "3.5rem" }}>That's a much healthier direction.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Sometimes you should raise less</h2>
<p style={{ marginBottom: "2.5rem" }}>Founders often treat larger rounds as evidence of greater success.</p>
<p style={{ marginBottom: "3.5rem" }}>They're not.</p>
<p style={{ marginBottom: "3.5rem" }}>They are evidence that you raised more money.</p>
<p style={{ marginBottom: "3.5rem" }}>That's it.</p>
<p style={{ marginBottom: "2.5rem" }}>More capital can create opportunity.</p>
<p style={{ marginBottom: "2.5rem" }}>It also creates expectations.</p>
<p style={{ marginBottom: "1.75rem" }}>Dilution.</p>
<p style={{ marginBottom: "1.75rem" }}>Pressure.</p>
<p style={{ marginBottom: "1.75rem" }}>Governance.</p>
<p style={{ marginBottom: "1.75rem" }}>A larger machine.</p>
<p style={{ marginBottom: "3.5rem" }}>A faster clock.</p>
<p style={{ marginBottom: "2.5rem" }}>If you can cheaply remove a major business risk before raising, you may enter fundraising from a considerably stronger position.</p>
<p style={{ marginBottom: "1.75rem" }}>Better evidence.</p>
<p style={{ marginBottom: "1.75rem" }}>Clearer economics.</p>
<p style={{ marginBottom: "1.75rem" }}>More leverage.</p>
<p style={{ marginBottom: "1.75rem" }}>Possibly a better valuation.</p>
<p style={{ marginBottom: "1.75rem" }}>Possibly less capital required.</p>
<p style={{ marginBottom: "3.5rem" }}>Possibly the discovery that you shouldn't raise at all.</p>
<p style={{ marginBottom: "3.5rem" }}>Also useful.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Sometimes you shouldn't raise</h2>
<p style={{ marginBottom: "2.5rem" }}>Not every good business should become a venture-backed startup.</p>
<p style={{ marginBottom: "3.5rem" }}>This seems obvious until you spend time in startup culture.</p>
<p style={{ marginBottom: "1.75rem" }}>Some businesses can grow from revenue.</p>
<p style={{ marginBottom: "1.75rem" }}>Some can remain small and extremely profitable.</p>
<p style={{ marginBottom: "2.5rem" }}>Some founders don't actually want the company that venture capital requires them to build.</p>
<p style={{ marginBottom: "1.75rem" }}>They want independence.</p>
<p style={{ marginBottom: "1.75rem" }}>Control.</p>
<p style={{ marginBottom: "1.75rem" }}>A good income.</p>
<p style={{ marginBottom: "1.75rem" }}>Interesting work.</p>
<p style={{ marginBottom: "3.5rem" }}>Perhaps a team of eight.</p>
<p style={{ marginBottom: "2.5rem" }}>Then somebody tells them they should raise $3 million and chase a billion-dollar outcome.</p>
<p style={{ marginBottom: "3.5rem" }}>Why?</p>
<p style={{ marginBottom: "2.5rem" }}>Capital architecture should fit business architecture.</p>
<p style={{ marginBottom: "2.5rem" }}>And business architecture should fit founder architecture.</p>
<p style={{ marginBottom: "2.5rem" }}>Otherwise you can successfully finance yourself into a business you never wanted.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Traction changes the conversation</h2>
<p style={{ marginBottom: "2.5rem" }}>Imagine two founders.</p>
<p style={{ marginBottom: "3.5rem" }}>Founder A says:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We believe agencies will pay $500 a month for this."</p>
<p style={{ marginBottom: "2.5rem" }}>Founder B says:</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We have twelve agencies paying $500 a month, eight renewed, three referred another customer, and here's what we've learned about acquisition."</p>
<p style={{ marginBottom: "2.5rem" }}>Same market.</p>
<p style={{ marginBottom: "2.5rem" }}>Same basic idea.</p>
<p style={{ marginBottom: "3.5rem" }}>Very different conversation.</p>
<p style={{ marginBottom: "2.5rem" }}>Evidence changes the investor's job.</p>
<p style={{ marginBottom: "2.5rem" }}>They're no longer being asked to believe everything.</p>
<p style={{ marginBottom: "3.5rem" }}>Some things have already happened.</p>
<p style={{ marginBottom: "2.5rem" }}>That's why early traction can matter far beyond the revenue itself.</p>
<p style={{ marginBottom: "3.5rem" }}>It reduces uncertainty.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Revenue isn't the only evidence</h2>
<p style={{ marginBottom: "2.5rem" }}>This needs nuance.</p>
<p style={{ marginBottom: "2.5rem" }}>Some businesses require significant capital before meaningful revenue can exist.</p>
<p style={{ marginBottom: "1.75rem" }}>Deep technology.</p>
<p style={{ marginBottom: "1.75rem" }}>Biotech.</p>
<p style={{ marginBottom: "1.75rem" }}>Infrastructure.</p>
<p style={{ marginBottom: "3.5rem" }}>Certain hardware businesses.</p>
<p style={{ marginBottom: "2.5rem" }}>You cannot always bootstrap reality into existence for $47 and a Canva subscription.</p>
<p style={{ marginBottom: "2.5rem" }}>But even then, evidence exists in different forms.</p>
<p style={{ marginBottom: "1.75rem" }}>Technical feasibility.</p>
<p style={{ marginBottom: "1.75rem" }}>Customer commitments.</p>
<p style={{ marginBottom: "1.75rem" }}>Partnerships.</p>
<p style={{ marginBottom: "1.75rem" }}>Pilots.</p>
<p style={{ marginBottom: "1.75rem" }}>Regulatory progress.</p>
<p style={{ marginBottom: "1.75rem" }}>Research.</p>
<p style={{ marginBottom: "1.75rem" }}>Team capability.</p>
<p style={{ marginBottom: "1.75rem" }}>Market proof.</p>
<p style={{ marginBottom: "3.5rem" }}>Intellectual property.</p>
<p style={{ marginBottom: "2.5rem" }}>The question remains:</p>
<p style={{ marginBottom: "3.5rem" }}>What has moved from assumption toward evidence?</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Fundraising can hide the real problem</h2>
<p style={{ marginBottom: "2.5rem" }}>There is another uncomfortable possibility.</p>
<p style={{ marginBottom: "2.5rem" }}>Sometimes founders pursue investment because raising money feels like progress.</p>
<p style={{ marginBottom: "1.75rem" }}>Investor meetings.</p>
<p style={{ marginBottom: "1.75rem" }}>Pitch competitions.</p>
<p style={{ marginBottom: "1.75rem" }}>Accelerators.</p>
<p style={{ marginBottom: "1.75rem" }}>Deck revisions.</p>
<p style={{ marginBottom: "3.5rem" }}>Networking.</p>
<p style={{ marginBottom: "1.75rem" }}>Introductions.</p>
<p style={{ marginBottom: "3.5rem" }}>Months disappear.</p>
<p style={{ marginBottom: "2.5rem" }}>The company becomes very busy trying to sell itself to investors while barely selling anything to customers.</p>
<p style={{ marginBottom: "2.5rem" }}>Sometimes that's necessary.</p>
<p style={{ marginBottom: "3.5rem" }}>Sometimes it's avoidance wearing a blazer.</p>
<p style={{ marginBottom: "2.5rem" }}>The founder doesn't need another investor conversation.</p>
<p style={{ marginBottom: "3.5rem" }}>They need another customer conversation.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Investors don't fix architecture</h2>
<p style={{ marginBottom: "2.5rem" }}>Money can amplify a good business.</p>
<p style={{ marginBottom: "3.5rem" }}>It can also amplify confusion.</p>
<p style={{ marginBottom: "1.75rem" }}>If acquisition doesn't work, capital can help you lose money faster.</p>
<p style={{ marginBottom: "1.75rem" }}>If the offer is wrong, a larger marketing budget distributes the wrong offer more efficiently.</p>
<p style={{ marginBottom: "1.75rem" }}>If operations are broken, growth makes them more broken.</p>
<p style={{ marginBottom: "3.5rem" }}>If nobody sufficiently wants the product, hiring twelve people doesn't make the customer more interested.</p>
<p style={{ marginBottom: "2.5rem" }}>Capital doesn't repair weak architecture automatically.</p>
<p style={{ marginBottom: "2.5rem" }}>It increases your ability to execute whatever architecture already exists.</p>
<p style={{ marginBottom: "3.5rem" }}>Good or bad.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Fundraising is not the milestone</h2>
<p style={{ marginBottom: "2.5rem" }}>This is where startup language has distorted things.</p>
<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>"We raised $2 million."</p>
<p style={{ marginBottom: "3.5rem" }}>Congratulations.</p>
<p style={{ marginBottom: "3.5rem" }}>Now what?</p>
<p style={{ marginBottom: "2.5rem" }}>The money isn't the outcome.</p>
<p style={{ marginBottom: "3.5rem" }}>It's an input.</p>
<p style={{ marginBottom: "2.5rem" }}>The milestone is what becomes possible because the money exists.</p>
<p style={{ marginBottom: "1.75rem" }}>More evidence.</p>
<p style={{ marginBottom: "1.75rem" }}>More customers.</p>
<p style={{ marginBottom: "1.75rem" }}>More capability.</p>
<p style={{ marginBottom: "1.75rem" }}>More defensibility.</p>
<p style={{ marginBottom: "1.75rem" }}>More revenue.</p>
<p style={{ marginBottom: "3.5rem" }}>More scale.</p>
<p style={{ marginBottom: "2.5rem" }}>A materially stronger business.</p>
<p style={{ marginBottom: "2.5rem" }}>The round should create the conditions for the next meaningful state.</p>
<p style={{ marginBottom: "3.5rem" }}>Otherwise you've simply acquired an expensive bank balance.</p>

<h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Build something worth funding</h2>
<p style={{ marginBottom: "2.5rem" }}>So before chasing investors, architect the business.</p>
<p style={{ marginBottom: "1.75rem" }}>Understand the customer.</p>
<p style={{ marginBottom: "1.75rem" }}>The problem.</p>
<p style={{ marginBottom: "1.75rem" }}>The offer.</p>
<p style={{ marginBottom: "1.75rem" }}>The market.</p>
<p style={{ marginBottom: "1.75rem" }}>The economics.</p>
<p style={{ marginBottom: "1.75rem" }}>The acquisition logic.</p>
<p style={{ marginBottom: "1.75rem" }}>The delivery model.</p>
<p style={{ marginBottom: "1.75rem" }}>The capabilities.</p>
<p style={{ marginBottom: "1.75rem" }}>The assumptions.</p>
<p style={{ marginBottom: "1.75rem" }}>The evidence.</p>
<p style={{ marginBottom: "3.5rem" }}>The sequence.</p>
<p style={{ marginBottom: "2.5rem" }}>Then ask what capital changes.</p>
<p style={{ marginBottom: "1.75rem" }}>Perhaps you're ready.</p>
<p style={{ marginBottom: "1.75rem" }}>Perhaps you're three milestones away.</p>
<p style={{ marginBottom: "1.75rem" }}>Perhaps you need less money than you thought.</p>
<p style={{ marginBottom: "3.5rem" }}>Perhaps you don't need investors at all.</p>
<p style={{ marginBottom: "3.5rem" }}>All four are useful answers.</p>
<p style={{ marginBottom: "2.5rem" }}>The brutal truth about startup fundraising is that many founders don't have a funding problem.</p>
<p style={{ marginBottom: "2.5rem" }}>They have a clarity problem.</p>
<p style={{ marginBottom: "2.5rem" }}>A readiness problem.</p>
<p style={{ marginBottom: "3.5rem" }}>An architecture problem.</p>
<p style={{ marginBottom: "1.75rem" }}>Fix those first.</p>
<p style={{ marginBottom: "2.5rem" }}>Not because investors demand it.</p>
<p style={{ marginBottom: "3.5rem" }}>Because the business does.</p>
<p style={{ marginBottom: "2.5rem" }}>Then, if capital really is the next logical move, you're no longer asking investors to fund an idea and your enthusiasm.</p>
<p style={{ marginBottom: "3.5rem" }}>You're showing them what exists, what you've learned, what needs to happen next and exactly what their capital is going to help make true.</p>
<p style={{ marginBottom: "3.5rem" }}>That's a considerably better conversation.</p>

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
                  <Link href="/thinking/your-business-idea-is-worth-nothing" className="group block">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="space-y-2">
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">Your Business Idea Is Worth Nothing</h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">Why an idea needs evidence before it deserves greater commitment.</p>
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
