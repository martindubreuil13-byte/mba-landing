/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/how-do-i-get-investors-for-my-business-idea";
  const answerTitle = "How Do I Get Investors for My Business Idea?";

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
                  How Do I Get Investors for My Business Idea?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  If you have a business idea and are looking for investors, there is something important to understand first:
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  Having a good idea does not automatically make it investable.
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
                An investor is not simply deciding whether they like your idea.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                They are deciding whether there is enough evidence, potential and credibility to justify putting their money at risk.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                So before asking:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Where do I find investors?"
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Ask:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                "What would an investor need to see before investing in this business?"
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That question can completely change what you should do next.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Can you get investment with only an idea?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Yes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It happens.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Some investors invest extremely early. Founders with a strong track record can sometimes raise money before building much. Certain technologies require significant capital before commercial evidence is even possible. Friends, family, angel investors and specialist early-stage investors may also invest when uncertainty is still very high.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But it is important not to confuse possible with probable.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                If you are an unknown founder with an idea, no customers, no product, no market evidence and no proof that people will pay, you are asking an investor to accept almost all of the uncertainty.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That makes the investment harder to justify.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The more meaningful uncertainty you can remove yourself, the stronger your position can become.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Investors are looking for evidence</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Different investors look for different things.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A local angel investing $50,000 does not necessarily evaluate an opportunity the same way as a venture capital fund considering a multi-million-dollar investment.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The stage matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The industry matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The size of the opportunity matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The founder matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And the type of investment matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But underneath those differences sits a fairly simple question:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Why should someone believe this business has the potential to work?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Your job is not to eliminate every risk.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That would be impossible.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Your job is to show that there is enough evidence to make the remaining risk worth taking.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Start with the problem</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Investors will usually want to understand what problem the business is solving and why that problem matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Is it a real problem?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Who has it?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How painful, expensive, frustrating or important is it?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What are people doing today instead?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Why would they change?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A technically impressive solution to a problem nobody cares enough about is still a weak business proposition.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                This is why customer understanding should begin long before the investor pitch.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You need to understand not only what you built or want to build, but why somebody should care.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Then show that customers care</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This is where the conversation becomes much more interesting.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Suppose you tell an investor:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                &gt; "We believe small manufacturers have this problem."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is an assumption.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Now suppose you say:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                &gt; "We interviewed 30 small manufacturers and 22 described this as a significant operational problem."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Better.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Now:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                &gt; "We built a simple version and five companies agreed to test it."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Better again.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And then:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                &gt; "Three of those companies are now paying us."
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Now you are having a very different conversation.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You are moving from belief toward evidence.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That progression matters.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Traction does not always mean millions in revenue</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Entrepreneurs sometimes hear the word traction and assume investors expect a rapidly growing company with millions in sales.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Not necessarily.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Traction depends on the stage and nature of the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Early evidence might include:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - paying customers;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - paid pilots;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - pre-orders;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - letters of intent;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - repeat purchases;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - active users;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - strong retention;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - meaningful usage;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - partnerships;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - distributors willing to carry the product;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - measurable customer acquisition;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - early recurring revenue;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - or another credible indication that the market is moving toward you.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For an early B2B business, three serious paid pilots might be meaningful evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For a consumer application, three customers probably tell you very little.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Context matters.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The important question is:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                What evidence would meaningfully reduce uncertainty about this particular business?
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>A product is evidence of your ability to build — not necessarily of demand</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This distinction matters enormously today.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It has never been easier to build something.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                AI can help entrepreneurs write code, create websites, design interfaces, produce marketing materials, analyze markets and develop prototypes at extraordinary speed.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is powerful.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But it creates a new trap:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Because we can build faster, we start treating the thing we built as evidence that the business exists.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It isn't.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A working application proves that an application can be built.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A product proves that a product exists.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Neither automatically proves that enough customers want it, will pay for it, can be reached economically, or will continue using it.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Investors understand this distinction.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                You should too.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Investors will also look at the economics</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Customers are important.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But investors will eventually want to understand whether those customers can support a valuable business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What does a customer pay?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much does it cost to serve them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How expensive is it to acquire them?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Do they buy once or repeatedly?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What margins could the business generate?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How large could the market realistically become?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How much capital will be required before the business becomes sustainable?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At an early stage, many of these numbers will still be assumptions.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That is normal.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What matters is whether the assumptions are visible, credible and increasingly supported by evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A spreadsheet does not make a business investable.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                But neither does ignoring the numbers.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Why do you need the investment?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This is one of the most important questions in the entire process.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What exactly will the investor's money do?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build the first prototype?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Complete certification?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Purchase inventory?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Hire a sales team?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Enter another market?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Increase manufacturing capacity?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Acquire customers?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Develop technology?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Provide working capital?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Scale something that is already working?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "We need money to grow" is not enough.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Investment becomes much easier to understand when there is a clear relationship between:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capital → Milestone → Evidence → Increased business value
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                For example:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                &gt; We need $250,000 to complete certification, produce the first commercial batch and supply five distributors who have already expressed documented interest.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That tells a very different story from:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                &gt; We need $250,000 to launch the business.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The clearer the architecture, the clearer the purpose of the capital.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Do you actually need an investor?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                This question is worth asking before spending six months trying to raise money.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Equity investment is only one financing mechanism.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may be able to fund part of the business through customers, bootstrapping, supplier terms, loans, equipment financing, grants, strategic partners, joint ventures, pre-orders or other arrangements.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes a combination works better than a single source of capital.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And sometimes changing the Business Architecture reduces the amount of capital required altogether.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                If you haven't already considered those possibilities, read:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                <Link href="/answers/i-have-a-business-idea-but-no-money-what-should-i-do" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">
                  I Have a Business Idea but No Money. What Should I Do?
                </Link>
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The objective is not to avoid investors.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                The objective is to use the right capital, for the right reason, at the right time.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>An investor can bring much more than money</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                The right investor may provide capital.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But they may also provide something harder to buy:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Experience.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Credibility.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Industry knowledge.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Partners.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Talent.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Distribution.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Future investors.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Access to markets.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Sometimes those contributions are worth as much as the cheque.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This means you should not only ask:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "Will this investor fund me?"
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You should also ask:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                "Is this the right investor for the business I am trying to build?"
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Money creates a relationship.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Choose the relationship carefully.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Understand what you are giving away</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Equity investment has a cost.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You are exchanging part of the future value of your company for resources today.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That can be an excellent trade.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can also become an extraordinarily expensive one.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The earlier the business is, the more uncertainty usually exists.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And greater uncertainty can affect valuation and terms.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                This is another reason <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">evidence matters</Link>.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Evidence does not only help convince investors.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It can potentially improve your position when negotiating with them.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You should also understand the implications of ownership, dilution, governance, investor rights and future fundraising before accepting an investment.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Getting the money is not the end of the decision.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It is the beginning of a long relationship.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>So where do you actually find investors?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Once you have something credible to present, investors can be found through many routes.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Depending on the business, these may include:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - your professional network;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - introductions from other entrepreneurs;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - existing customers or suppliers;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - industry contacts;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - angel investor networks;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - accelerators and incubators;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - venture capital firms;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - family offices;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - strategic corporate investors;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - crowdfunding platforms;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - professional advisers;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - startup and industry events;
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                - and direct outreach to investors whose investment thesis matches your business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But do not start by sending the same pitch deck to hundreds of investors.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Investor fit matters.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                An investor focused on enterprise software may have little interest in a consumer food business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A venture fund looking for companies capable of enormous scale may be completely wrong for a profitable regional business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A strategic investor may care about access to a market or technology that a financial investor does not.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Research investors the same way you would research customers.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Understand what they invest in.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At what stage.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At what size.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                In which industries.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                In which geographies.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                And what they can contribute beyond money.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>The pitch deck is not the business</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Eventually, you will probably need to present the opportunity clearly.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That may include the problem, customer, solution, market, business model, traction, competition, team, economics, funding requirement and what the capital will accomplish.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But remember:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                A beautiful pitch deck cannot compensate for a poorly architected business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The presentation should explain the opportunity.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                It should not manufacture one.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Before polishing slide 37 for the fifteenth time, make sure there is something underneath it worth investing in.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>Becoming investable is part of Business Architecture</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Funding should not be treated as a separate activity that begins after the business has been designed.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Capital affects what can be built.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                When it can be built.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                How quickly.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                At what scale.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                With what ownership.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And with what risk.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                That makes funding part of the <Link href="/answers/what-is-business-architecture" className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors">Business Architecture</Link>.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                The architecture should help answer:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What needs to happen first?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What evidence needs to exist?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What milestones matter?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What resources are required?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What can be funded internally?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What requires external capital?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                What type of capital makes sense?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                And what will become possible after that capital is deployed?
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                When those questions are clear, fundraising becomes much more than:
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                "I have an idea. Who will give me money?"
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                It becomes:
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                "Here is the business we are building. Here is what we have already proven. Here is what remains uncertain. Here is the next milestone. And here is exactly what your capital will allow us to accomplish."
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                That is a much stronger conversation.
              </p>

              <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>So, how do you get investors for your business idea?</h2>

              <p style={{ marginBottom: "1.75rem" }}>
                Start by making the opportunity more investable.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Understand the customer.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Test the problem.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Create evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Demonstrate willingness to pay where possible.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Build only what you need to learn.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Understand the economics.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Know what capital you actually require.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Define what that capital will accomplish.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Then identify investors whose interests, stage, experience and expectations match the business.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may still hear no.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Probably more than once.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Fundraising is difficult.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                But difficulty finding an investor does not automatically mean your business idea should stop.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need more evidence.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need a different investor.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need a different financing mechanism.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                You may need to reach another milestone first.
              </p>

              <p style={{ marginBottom: "1.75rem" }}>
                Or you may need to architect a different route altogether.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Don't make finding an investor the proof that your business deserves to exist.
              </p>

              <p style={{ marginBottom: "3.5rem" }}>
                Build the evidence that gives someone a reason to invest.
              </p>

              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related</p>
                <div className="space-y-6">
                  <Link href="/answers/i-have-a-business-idea-but-no-money-what-should-i-do" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                        I Have a Business Idea but No Money. What Should I Do?
                      </h3>
                      <p className="text-sm text-[#1a1816]/65 leading-relaxed">
                        Discover how to start building your business idea with limited resources.
                      </p>
                    </motion.div>
                  </Link>
                  <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
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
                  <Link href="/answers/what-is-business-architecture" className="group block">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
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
                      transition={{ duration: 0.7, delay: 0.3 }}
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
