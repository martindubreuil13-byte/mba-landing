/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/the-being-economy";
  const articleTitle = "The Being Economy";

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
                  The Being Economy
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  When knowledge becomes cheap and execution abundant, what the hell will people pay you for?
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
                  <p className="text-sm text-[#1a1816]/65">September 5, 2026</p>
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
                For most of modern working life, we have made money in two ways.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                From what we know.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And from what we can do.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn something valuable. Become good at something difficult. Build experience. Develop expertise. Then find someone willing to pay you for it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That was a pretty decent deal.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Until we started building machines that know almost everything and are learning to do almost everything.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And we gave everyone access to them for twenty bucks a month.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Oops.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The Knowing Economy</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                For a long time, knowledge was scarce.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                If you wanted legal knowledge, you went to a lawyer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Financial knowledge? An accountant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Marketing knowledge? A marketer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Strategy? A consultant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You paid people partly because they had spent years accumulating knowledge you didn't have.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Education itself was built around this scarcity.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Go to school.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Acquire knowledge.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Get credentials proving you acquired the knowledge.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Exchange that knowledge for money.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Knowledge created economic value because knowledge was difficult to acquire.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Artificial intelligence is destroying that scarcity at extraordinary speed.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not knowledge itself.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The scarcity of knowledge.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That's an important distinction.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Expertise still matters. Experience still matters. Understanding still matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But access to an enormous amount of human knowledge is becoming almost free.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                I can ask AI about marketing, finance, psychology, logistics, manufacturing, programming, business models, contracts or how the hell my washing machine works.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It doesn't mean the answer will always be right.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But neither was the consultant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The difference is that the consultant charged me $300 an hour.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                So if your economic value comes primarily from knowing things other people don't know, I would pay attention.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Your moat is getting shallower.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Fast.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Then there is doing</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Fine.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Maybe knowledge becomes abundant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At least people still need someone to actually do the work.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                For now.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI agents are already moving artificial intelligence from answering questions to executing tasks.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Writing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Researching.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Coding.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Analyzing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Creating.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Prospecting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Responding.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Organizing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operating software.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Making decisions within defined boundaries.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                We are moving from machines that tell us how to do something to machines that increasingly just do it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And this won't stop with knowledge workers sitting behind laptops.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Robotics and physical automation will continue pushing the same economics into physical work.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Again, this doesn't mean humans suddenly stop doing things.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That's too simplistic.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It means execution also becomes more abundant.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And economics has a funny habit.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                When something becomes abundant, we tend to pay less of a premium for it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Which creates an interesting problem.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                If what you know becomes abundant...
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And what you can do becomes increasingly abundant...
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What exactly are people going to pay you for?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That question has been bothering me.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Especially because I'm an entrepreneur.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And I work with entrepreneurs.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Maybe we're entering the Being Economy</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                I think economic value may be starting to migrate again.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                From knowing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                To doing.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                To being.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And no, I'm not about to tell you to discover your inner light, journal at sunrise and become your authentic self while drinking mushroom coffee.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                I'm talking about economics.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What remains scarce when everybody has access to extraordinary knowledge and extraordinary capability?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You do.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your judgment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your reputation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your agency.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your empathy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your relationships.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your taste.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your character.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your lived experience.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your ability to make a decision when there are 100 perfectly reasonable options sitting on the screen.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your willingness to say:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This one.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And then put your name behind it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That last part matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can generate 100 strategies.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone still has to decide which one deserves to exist.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can recommend a difficult conversation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Someone still has to have it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can produce an answer.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Someone still has to take responsibility for what happens next.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That's not simply knowledge.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That's not simply execution.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's human judgment and accountability.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's being.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Entrepreneurs should pay particular attention</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Because entrepreneurs have something employees have traditionally been able to hide behind.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A company.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People bought IBM.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They hired Deloitte.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They banked with HSBC.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The institution carried much of the trust.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But smaller businesses, consultants, freelancers, creators and founder-led companies work differently.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People increasingly want to know:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who is behind this?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Do I trust them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Do I believe them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Do I like the way they think?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Have they actually lived any of this?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Will they tell me something I don't want to hear?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Will they still be there when something goes wrong?
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Do I want to work with this person?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Those questions become more important when ten competitors can use essentially the same AI tools to produce essentially the same level of technical output.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your competitor can buy the same AI you can.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They can automate the same processes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build a decent website.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Generate content.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Research the market.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Create proposals.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build software.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Run campaigns.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                So can you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Congratulations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                We're all special now.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Which means none of that, by itself, makes you particularly special.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Your business still needs architecture</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                I don't want to swing the pendulum into another stupid extreme.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The mechanics still matter.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You still need a real offer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A viable economic model.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Distribution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Marketing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sales.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Operations.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Delivery.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Systems.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Technology.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Execution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A charming personality attached to a shit business is still a shit business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture</Link> doesn't disappear because artificial intelligence exists.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Quite the opposite.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                When execution gets easier, deciding what deserves to be executed becomes even more important.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But I think another layer is becoming harder to ignore.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The human behind the architecture.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your reputation becomes an asset.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your network becomes infrastructure.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your relationships become distribution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your point of view becomes differentiation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your judgment becomes part of the product.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your community becomes a moat.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And trust becomes something competitors cannot simply generate with another prompt.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is one reason I've been thinking much more seriously about networking and community lately.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not as the awkward business-card-exchanging ritual we've somehow called networking for decades.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Real relationships.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People knowing what you stand for.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People seeing how you think.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People knowing what you build.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People trusting your judgment before they ever need what you're selling.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That takes time.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Which is precisely why it has value.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>There is a catch</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                AI will imitate this too.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can already sound empathetic.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can imitate personality.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can manufacture a personal brand.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can produce opinions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can write a touching LinkedIn story about your courageous journey through adversity before breakfast.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                God help us.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So simply having a "personality" isn't the answer.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Manufactured authenticity will become abundant too.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The real scarcity is harder to fake.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A reputation accumulated over years.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Relationships built through actual interaction.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Judgment tested against reality.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Promises kept.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Mistakes owned.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                People helped when there was nothing to sell them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A body of work with your fingerprints on it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                A network of people willing to say:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                I know this person. I trust this person.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can help you communicate who you are.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It cannot retroactively live your life for you.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>So perhaps we're learning the wrong lesson</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Everywhere I look, people are scrambling to learn AI.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn the tools.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn prompting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn automation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn AI agents.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Learn the next platform before the platform they learned last Tuesday becomes obsolete.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Learn. Learn. Learn.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And yes, learn AI.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You absolutely should.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Use it.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Let it make you faster.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Let it make you smarter.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Let it give you capabilities you couldn't afford five years ago.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But understand the paradox:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                AI can make you dramatically more capable while simultaneously making capability less differentiating.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That's the part I think we're missing.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So maybe we should spend some of our energy developing something else too.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our judgment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our relationships.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our reputation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our ability to communicate.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our empathy.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our courage to have a point of view.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our ability to build trust.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our ability to bring people together.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Our willingness to stand behind our decisions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not because these things sound nice.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Because they may become economically more valuable as everything around them becomes easier to reproduce.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For entrepreneurs, I think this needs to become part of how we architect businesses in the age of AI.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Don't only architect the product.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Don't only architect the systems.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Don't only architect the technology, marketing and sales.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Architect the human layer too.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Because the future may not belong to the person who knows the most.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI ruined that game.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It may not belong to the person who can do the most either.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI agents, automation and robotics are coming for that game too.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It may increasingly belong to the person people choose.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Choose to trust.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Choose to follow.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Choose to buy from.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Choose to recommend.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Choose to work with.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Choose to build with.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Knowledge can be copied.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capability can be automated.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But there is still only one you.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The question is whether you've made that you worth choosing.
              </p>

            </motion.div>

          </div>
        </section>

        {/* ============================================================
            ARTICLE FOOTER
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
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
