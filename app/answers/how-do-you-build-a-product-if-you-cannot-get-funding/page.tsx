/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const H2_STYLE = { fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" } as const;
const LINK_CLASS = "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

const INVESTOR_PROOF = [
  "The problem is real and significant.",
  "The target customer is clear.",
  "The problem has been validated through real conversations and behaviour.",
  "There is a credible solution.",
  "The economics can work.",
  "Customers are interested enough to pay at a viable price.",
  "There is a practical path to reach more customers.",
];

const MVP_EXAMPLES = [
  "A consultant delivering a service manually before turning it into software",
  "A physical-product founder using a 3D-printed prototype rather than paying for full manufacturing",
  "A platform founder matching the first customers and suppliers manually before building an automated marketplace",
  "A new product tested through a short video, product visuals, sample, or landing page",
  "A business securing pre-orders or paid pilots before committing to inventory",
  "A founder using interviews and a survey to test whether the problem is genuinely urgent and widespread",
];

const FUNDING_ROUTES = [
  "Personal savings, used carefully and against clear learning milestones",
  "A bank or business loan",
  "An equity partner who brings capital, capability, or access to the market",
  "Supplier credit or supplier investment, especially where a supplier benefits from your growth",
  "Customer prepayments, deposits, paid pilots, or purchase commitments",
  "A strategic partner that wants the solution and is willing to help fund its development",
  "Grants or sector-specific funding programmes",
  "Revenue from a simpler, manual, or service-based version of the offer",
];

function Sequence({ steps, label, emphasis = false }: { steps: string[]; label: string; emphasis?: boolean }) {
  return (
    <div
      className={`not-prose border-l-2 pl-5 md:pl-6 py-1 ${emphasis ? "border-[#6b1f1f]" : "border-[#1a1816]/20"}`}
      style={{ marginBottom: "2.5rem" }}
    >
      <p className="text-xs tracking-widest uppercase text-[#1a1816]/60 font-semibold mb-2">{label}</p>
      <p className={`text-lg md:text-xl font-semibold leading-snug ${emphasis ? "text-[#6b1f1f]" : "text-[#1a1816]"}`}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            {index > 0 && <span aria-hidden="true"> → </span>}
            {index > 0 && <span className="sr-only">, then </span>}
            {step}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/how-do-you-build-a-product-if-you-cannot-get-funding";

  const handleShare = (platform: string) => {
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
                  How Do You Build a Product If You Cannot Get Funding?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Many people approach this question backwards.
                </p>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 mt-6">
                  They believe they need funding before they can start building a business. In reality, the first task is not raising money. It is understanding whether there is a real problem worth solving—and whether people will pay for a solution.
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
                  <p className="text-sm text-[#1a1816]/65">September 26, 2026</p>
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

<p style={{ marginBottom: "2.5rem" }}>If you have held an idea for a long time, this can be hard to hear. You can see the potential of the product, but you need money to build it. You speak to investors and nobody seems to care. It is easy to conclude that you are stuck.</p>

<p style={{ marginBottom: "3.5rem" }}>You are not stuck. But you may be in the wrong sequence.</p>

<p style={{ marginBottom: "1.75rem" }}>A mistake I see all the time is this:</p>

<Sequence label="The common sequence" steps={["Idea", "build the product", "try to market it", "try to make money from it"]} />

<p style={{ marginBottom: "2.5rem" }}>It is an understandable sequence. We fall in love with the solution, imagine what it could be, and want to bring it to life. Many founders then put their own savings into building it—only to discover, after months or years of work, that there is no meaningful market, that the customer's pain is not urgent enough, or that the market is simply not ready to adopt the solution.</p>

<p style={{ marginBottom: "3.5rem" }}>That is an expensive way to learn.</p>

<p style={{ marginBottom: "1.75rem" }}>A stronger sequence is:</p>

<Sequence label="A stronger sequence" emphasis steps={["Problem", "evidence", "test", "proof of concept", "funding", "build and scale"]} />

<p style={{ marginBottom: "2.5rem" }}>This does not mean you should never build before raising money. It means you should first build enough evidence to understand <em>what</em> to build, <em>for whom</em>, <em>why they would buy it</em>, and <em>what type of funding—if any—is appropriate</em>.</p>

<p style={{ marginBottom: "3.5rem" }}>That is where <Link href="/thinking/the-business-architects-frame" className={LINK_CLASS}>FRAME™</Link> begins.</p>

<h2 style={H2_STYLE}>Start with the problem, not the product</h2>

<p style={{ marginBottom: "2.5rem" }}>Before thinking about investors, get close to the people you want to serve. What problem do they have? How do they solve it today? What does it cost them—in money, time, risk, frustration, or missed opportunity? And, most importantly: is the pain strong enough for them to pay to make it go away?</p>

<p style={{ marginBottom: "2.5rem" }}>This is not just research for a business plan. It is the foundation of the business.</p>

<p style={{ marginBottom: "2.5rem" }}>Talk to potential customers. Run surveys. Conduct interviews. Observe how people currently work around the problem. Ask what they have tried, what they spend today, and what would make them change.</p>

<p style={{ marginBottom: "2.5rem" }}>The goal is to turn an assumption—"I think people need this"—into evidence: "I have spoken to this group of people, the problem is consistent, and they are looking for a better way."</p>

<p style={{ marginBottom: "2.5rem" }}>That distinction matters because ideas are plentiful. Even innovative ideas, by themselves, are not enough.</p>

<p style={{ marginBottom: "3.5rem" }}>If you want a quick first read on where your own idea stands, the <Link href="/resources/business-idea-reality-check" className={LINK_CLASS}>Business Idea Reality Check</Link> takes about five minutes and shows how much of it currently rests on evidence and how much on assumption.</p>

<h2 style={H2_STYLE}>Why investors are not looking for "a great idea"</h2>

<p style={{ marginBottom: "2.5rem" }}>Serious investors know that an idea is only the beginning. They are not mainly buying innovation; innovation without demand can be very risky.</p>

<p style={{ marginBottom: "2.5rem" }}>They are trying to assess a business case.</p>

<p style={{ marginBottom: "2.5rem" }}>In simple terms, they want to know: if I put one dollar into this business, is there a credible path for it to return many more dollars within a reasonable time?</p>

<p style={{ marginBottom: "1.75rem" }}>That requires more than an impressive concept. It requires proof:</p>

<ul className="list-disc pl-6 space-y-3" style={{ marginBottom: "2.5rem" }}>
  {INVESTOR_PROOF.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>

<p style={{ marginBottom: "2.5rem" }}>When you arrive with that kind of evidence, the conversation changes. You are no longer saying, "I have an idea and I need money to build it." You are saying, "Here is a validated opportunity, here is how it can make money, here is the minimum amount needed to unlock the next stage, and here is how that capital can produce a return."</p>

<p style={{ marginBottom: "3.5rem" }}>That is what earns serious attention.</p>

<h2 style={H2_STYLE}>Build proof before you build everything</h2>

<p style={{ marginBottom: "2.5rem" }}>Of course, some products require capital. A physical product may need manufacturing, tooling, inventory, certification, or a production run. A technology product may require specialist development, infrastructure, data, or regulatory work.</p>

<p style={{ marginBottom: "2.5rem" }}>But even then, you do not always need to build the full product before you can test whether it deserves investment.</p>

<p style={{ marginBottom: "2.5rem" }}>That is the purpose of an MVP: a minimum viable product.</p>

<p style={{ marginBottom: "2.5rem" }}>An MVP is not simply a cheaper or incomplete version of the final product. It is the smallest, most practical way to test the most important assumption.</p>

<p style={{ marginBottom: "2.5rem" }}>If the biggest uncertainty is whether customers care, your MVP may be a survey, customer interviews, or a landing page describing the offer.</p>

<p style={{ marginBottom: "2.5rem" }}>If the biggest uncertainty is whether they will pay, it may be a pre-order, deposit, letter of intent, or pilot agreement.</p>

<p style={{ marginBottom: "2.5rem" }}>If the biggest uncertainty is whether the product can work, it may be a basic demonstration, clickable prototype, mock-up, video, or 3D-printed model.</p>

<p style={{ marginBottom: "2.5rem" }}>If the biggest uncertainty is whether the service can create value, deliver it manually first. Do the work behind the scenes before you automate it. This can be one of the most powerful MVPs: customers experience the outcome, you learn what matters, and you avoid spending heavily on features nobody needs.</p>

<p style={{ marginBottom: "1.75rem" }}>Examples of useful MVPs include:</p>

<ul className="list-disc pl-6 space-y-3" style={{ marginBottom: "2.5rem" }}>
  {MVP_EXAMPLES.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>

<p style={{ marginBottom: "2.5rem" }}>The principle is simple: <strong>do not spend heavily to create certainty. Use the smallest test that reduces the biggest uncertainty.</strong></p>

<p style={{ marginBottom: "3.5rem" }}>If you are not sure which uncertainty is the biggest, I've written about <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className={LINK_CLASS}>how to know if a business idea is actually viable</Link>: customer, demand, willingness to pay, reachability and economics, tested with evidence.</p>

<h2 style={H2_STYLE}>Funding can come from more than investors</h2>

<p style={{ marginBottom: "2.5rem" }}>Investors are one source of capital. They are not the only source, and for many businesses they are not the best first source.</p>

<p style={{ marginBottom: "1.75rem" }}>If you have done the homework, validated the problem, and built a credible proof of concept, you may have several routes available:</p>

<ul className="list-disc pl-6 space-y-3" style={{ marginBottom: "2.5rem" }}>
  {FUNDING_ROUTES.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>

<p style={{ marginBottom: "2.5rem" }}>The right route depends on the business model, the amount of capital required, the risks involved, and the evidence you can show.</p>

<p style={{ marginBottom: "2.5rem" }}>But the work is the same: arrive with something concrete.</p>

<p style={{ marginBottom: "3.5rem" }}>Show that the problem is real. Show that customers care. Show how the solution could work. Show that people are willing to pay. Show how the business can generate a return.</p>

<h2 style={H2_STYLE}>The real first investment</h2>

<p style={{ marginBottom: "2.5rem" }}>So, if you cannot get funding right now, do not treat that as a verdict on your idea.</p>

<p style={{ marginBottom: "2.5rem" }}>Treat it as an invitation to do the work that makes the idea stronger.</p>

<p style={{ marginBottom: "2.5rem" }}>Start with the problem. Validate it in the real world. Build the smallest proof of concept you can. Test what people will pay. Shape the business architecture around what you learn. Then decide whether you need funding, how much you need, and which source makes sense.</p>

<p style={{ marginBottom: "0.5rem" }}>The first investment is not always money.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic" }}>Often, it is the discipline to test reality before you spend it.</p>

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
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816]">
                Ready to turn an idea into a validated business case?
              </h2>
              <Link href="/thinking/the-business-architects-frame" className="inline-block">
                <motion.span
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  whileHover={{ x: 2 }}
                >
                  Explore FRAME™ →
                </motion.span>
              </Link>
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
                  {[
                    {
                      href: "/answers/i-have-a-business-idea-but-no-money-what-should-i-do",
                      title: "I Have a Business Idea but No Money. What Should I Do?",
                      summary: "How much money you actually need to take the next meaningful step, and how to break the idea into smaller tests.",
                    },
                    {
                      href: "/answers/how-do-i-get-investors-for-my-business-idea",
                      title: "How Do I Get Investors for My Business Idea?",
                      summary: "What makes a business investable, and why evidence of demand matters more than the idea itself.",
                    },
                    {
                      href: "/thinking/the-brutal-truth-about-startup-fundraising",
                      title: "The Brutal Truth About Startup Fundraising",
                      summary: "Most early founders who think they have a fundraising problem have a business-readiness problem.",
                    },
                    {
                      href: "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
                      title: "How Do I Know If My Business Idea Is Actually Viable?",
                      summary: "Customer, demand, willingness to pay, reachability and economics, tested with evidence.",
                    },
                  ].map((item, i) => (
                    <Link key={item.href} href={item.href} className="group block">
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="space-y-2"
                      >
                        <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#1a1816]/65 leading-relaxed">{item.summary}</p>
                      </motion.div>
                    </Link>
                  ))}
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
                <Link href="/work-with-me" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    Explore ways to work together →
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
