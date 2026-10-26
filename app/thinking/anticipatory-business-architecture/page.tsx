/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

const linkClass =
  "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

// Spacing follows the other Thinking articles: tight inside a thought, wide between thoughts.
function P({ children, tight = false }: { children: React.ReactNode; tight?: boolean }) {
  return <p style={{ marginBottom: tight ? "1.75rem" : "3.5rem" }}>{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "1.25rem", fontWeight: "400", marginTop: "2.5rem", marginBottom: "1.5rem", lineHeight: "1.4", color: "#1a1816" }}>
      {children}
    </h3>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ marginBottom: "3.5rem", paddingLeft: "1.25rem", listStyleType: "disc" }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: "0.75rem", paddingLeft: "0.25rem" }}>{item}</li>
      ))}
    </ul>
  );
}

const cycleSteps = [
  { name: "Observe", question: "What is changing around the business?" },
  { name: "Interpret", question: "What could it mean?" },
  { name: "Anticipate", question: "What plausible futures follow?" },
  { name: "Architect", question: "What should we design differently?" },
  { name: "Validate", question: "What does the evidence say?" },
  { name: "Adapt", question: "What should we change, and when?" },
];

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/anticipatory-business-architecture";
  const articleTitle = "Will Your Business Still Be Relevant Tomorrow?";

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(articleUrl);

    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
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

        {/* ARTICLE OPENING */}
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
                  Will Your Business Still Be Relevant Tomorrow?
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  Why the next evolution of Business Architecture must include anticipation, adaptability, and continuous intelligence.
                </p>
              </div>

              <div className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-[#1a1816]/75">Martin Dubreuil | The Modern Business Architect™</p>
                  <p className="text-sm text-[#1a1816]/65"><time dateTime="2026-10-26">October 26, 2026</time></p>
                </div>
              </div>
            </motion.div>

          </div>
        </article>

        {/* ARTICLE BODY */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">

            <div
              className="prose prose-lg max-w-none"
              style={{ fontSize: "1.125rem", lineHeight: "1.8", color: "#1a1816" }}
            >

              <H2>The business you're building today might belong to yesterday.</H2>

              <P tight>Imagine spending eighteen months building a business. You've done your homework. Identified a customer problem. Developed a solution. Built your product. Worked on pricing, marketing, operations, and everything else you're supposed to do.</P>

              <P>You launch. And discover that the world has moved on.</P>

              <P tight>Perhaps AI has made your solution dramatically cheaper. Perhaps customers no longer behave the way they did when you started. Perhaps a completely different business model has emerged, making yours unnecessarily complicated. Or perhaps the problem still exists, but customers now expect it to be solved in an entirely different way.</P>

              <P>Congratulations. You've built a perfectly reasonable business for a world that no longer exists.</P>

              <P tight>A little dramatic? Perhaps. But I believe this is becoming one of the most important challenges facing entrepreneurs and business leaders.</P>

              <P tight>For decades, we've been taught to identify problems, develop solutions, and build businesses around them. That advice isn't wrong.</P>

              <P tight>
                <strong>It's becoming incomplete.</strong>
              </P>

              <P>And I think Business Architecture needs to evolve accordingly.</P>

              <H2>1. We've changed the way we build businesses before.</H2>

              <P tight>For much of the last century, the conventional business playbook emphasized planning, organization, capital investment, execution, and control. Understand your market. Build a competitive advantage. Establish operations. Defend your position. Grow. It was never quite as predictable as business textbooks suggested, but the underlying logic made sense.</P>

              <P tight>
                Then the startup movement challenged much of that thinking. Entrepreneurs were encouraged to move faster, experiment, question established assumptions, and challenge entire industries. Lean Startup principles helped popularize the idea that businesses should test hypotheses instead of treating business plans as unquestionable truth. The minimum viable product changed the conversation from <em>How do we build the complete product?</em> to <em>What's the smallest thing we can build to learn whether anyone actually wants it?</em>
              </P>

              <P tight>These were important advances. They made entrepreneurship more accessible. They reduced some forms of waste. They challenged the idea that building a business required years of planning before anything reached a customer. But they didn't eliminate uncertainty. And they certainly didn't eliminate the possibility of building the wrong business.</P>

              <P tight>Today, we're facing another shift.</P>

              <P>
                <strong>What happens when the environment changes faster than even a relatively agile startup can respond?</strong>
              </P>

              <H2>2. AI is changing more than the speed of execution.</H2>

              <P tight>Much of the conversation around artificial intelligence focuses on productivity. Write faster. Code faster. Analyze faster. Automate more. Useful, certainly. But I think we're missing a more consequential question.</P>

              <P>
                <strong>What happens to the value of a business when the thing it sells becomes dramatically easier for someone else to produce?</strong>
              </P>

              <P tight>Consider a company whose competitive advantage is producing information, analysis, content, or software that previously required substantial specialist effort. If AI reduces the cost of producing something comparable, the company's underlying economics may change. That doesn't automatically mean the company disappears. It means the source of its value may need to change.</P>

              <P tight>And this is where things become interesting. AI doesn't simply introduce new tools into existing markets. It can change what customers are willing to pay for, what they consider acceptable, and what they expect to receive as standard.</P>

              <P tight>A service that once justified a premium price might become a basic feature. A product that once required a team of developers might become feasible for a much smaller competitor. A task that customers previously outsourced might become something they can perform themselves.</P>

              <P tight>Not every industry will change at the same speed. Physical infrastructure, regulation, trust, human relationships, and operational complexity still matter. But for entrepreneurs, the important question is no longer simply whether a problem exists today. It's whether the conditions that make solving that problem commercially valuable are likely to remain in place.</P>

              <P>And if they don't, what happens to the business?</P>

              <H2>3. The difference between prediction and anticipation.</H2>

              <P tight>I don't believe entrepreneurs need to become fortune-tellers. In fact, I would be deeply suspicious of anyone claiming to know exactly what business will look like in five years. We have enough people confidently predicting the future on LinkedIn already. Most can't predict what their customers will do next Tuesday.</P>

              <P tight>Prediction attempts to establish what will happen.</P>

              <P>
                <strong>Anticipation explores what could happen, what it would mean, and how we should prepare.</strong>
              </P>

              <P tight>That distinction matters. Anticipation isn't about selecting one fashionable trend and betting the company on it. It's about recognizing signals, questioning assumptions, examining plausible scenarios, and understanding how changes might affect the architecture of a business.</P>

              <P tight>Suppose you're developing a service that helps small companies produce marketing content. Today, you might identify a genuine problem: business owners don't have the time, expertise, or resources to produce consistent content. You could build a business around solving that problem.</P>

              <P tight>But looking ahead, you might reasonably ask: What happens when AI makes content production nearly effortless? Will customers still pay for content itself? Or will they increasingly pay for strategy, differentiation, distribution, credibility, and measurable commercial outcomes?</P>

              <P tight>The underlying aspiration hasn't disappeared. The business owner still wants customers and revenue. But the valuable solution may be moving. That's the point.</P>

              <P>
                <strong>Sometimes technology doesn't eliminate the customer's problem. It changes where the value of solving it resides.</strong>
              </P>

              <P>A business architect should be looking for that movement. Not just the opportunity visible today, but the opportunity that may emerge as today's solution becomes ordinary.</P>

              <H2>4. Three capabilities I believe entrepreneurs will need.</H2>

              <P>I see three capabilities becoming increasingly important. Not because they guarantee success. Nothing does. But because together they offer a more intelligent way to build businesses under uncertainty.</P>

              <H3>Anticipation: seeing beyond the immediate problem.</H3>

              <P tight>Most entrepreneurs begin with a problem they can observe. That's sensible. Real problems are a better foundation than imaginary ones. But observation should be followed by a second question:</P>

              <P tight>
                <em>How might this problem evolve?</em>
              </P>

              <P tight>What is changing in the customer's environment? Which technologies could alter their behavior? What new constraints might appear? What will become cheaper, faster, easier, more difficult, or more valuable?</P>

              <P tight>Anticipation requires curiosity, imagination, and the ability to connect developments that initially seem unrelated. It also requires intellectual discipline. A possible future isn't evidence that customers will pay for it.</P>

              <P>We still need to test our assumptions.</P>

              <H3>Adaptability: designing for change rather than resisting it.</H3>

              <P tight>Entrepreneurs are frequently told to believe in their ideas. I agree, to a point. But belief becomes dangerous when it prevents someone from recognizing that the original idea no longer makes sense.</P>

              <P tight>A business idea is not a sacred object. It's a hypothesis about how value can be created, delivered, and captured. Sometimes that hypothesis is correct. Sometimes it needs adjustment.</P>

              <P>And sometimes it deserves a dignified funeral.</P>

              <P tight>Adaptability isn't simply the willingness to pivot when everything goes wrong. It should influence how the business is designed from the beginning.</P>

              <P tight>Can the offer evolve without rebuilding the entire operation? Can the business serve a different customer segment? Are costs flexible enough to withstand changes in demand? Which capabilities should be developed internally, and which should remain accessible through partners or technology?</P>

              <P>These are architectural decisions. And they can make the difference between an intelligent adjustment and an expensive reconstruction.</P>

              <H3>Continuous intelligence: turning change into better decisions.</H3>

              <P tight>This is perhaps the most misunderstood of the three. Continuous intelligence doesn't mean consuming endless articles, following every AI announcement, or asking ChatGPT what the next trillion-dollar industry will be.</P>

              <P tight>It means building a habit, and eventually a capability, of observing what matters. Listening to customers. Monitoring changes in their behavior. Understanding competitors and substitutes. Examining emerging technology. Learning from experiments, commercial results, and operational failures. Then interpreting that information and using it to make decisions.</P>

              <P tight>
                <strong>Information is not intelligence. Intelligence emerges when information improves judgment and action.</strong>
              </P>

              <P tight>AI can be extraordinarily useful here. It can help entrepreneurs investigate markets, compare scenarios, organize evidence, identify patterns, and challenge assumptions. But it should expand their capacity to think, not relieve them of the responsibility to think.</P>

              <P>And importantly, continuous intelligence is not something you do once before launching. It should remain active throughout the life of the business.</P>

              <H2>5. Introducing Anticipatory Business Architecture.</H2>

              <P tight>
                This brings me to an idea I've been developing within my work as a Business Architect. Traditionally, the architecture of a business addresses fundamental questions. (If you're new to the term, I explain it in{" "}
                <Link href="/answers/what-is-business-architecture" className={linkClass}>What Is Business Architecture?</Link>.)
              </P>

              <P tight>Who is the customer? What problem are we solving? What value are we offering? How will we reach customers? How will the business make money? How will it deliver its promises? What capabilities, resources, partnerships, and operations must work together?</P>

              <P tight>
                Together, those questions cover the customer, the problem, the offer, the business model, the economics, go-to-market, delivery, operations, and execution. These questions remain essential. But every one of those answers rests on assumptions about the world the business will operate in: how technology will behave, what the market will pay for, and how customers will choose.
              </P>

              <P tight>I believe we need to add another dimension:</P>

              <P>
                <strong>How might the conditions supporting this business change, and what should we architect today to prepare for those changes?</strong>
              </P>

              <P tight>
                I call this <em>Anticipatory Business Architecture</em>. Not as a replacement for established Business Architecture, strategic foresight, or business-model innovation. Rather, as a way to integrate forward-looking intelligence into the practical work of creating and evolving a business.
              </P>

              <P tight>
                Anticipatory Business Architecture is the practice of integrating anticipation, adaptability, and continuous intelligence into the architecture and re-architecture of a business. It adds a dimension to the decisions above rather than replacing any of them: it challenges whether the assumptions supporting them will remain valid as technology, markets, and customer behavior evolve.
              </P>

              <P tight>The objective is not to design a business for one predicted future. It is to design a business that can create value today while retaining the capacity to respond to several plausible futures.</P>

              <P tight>
                That changes the conversation. Instead of asking only whether an idea is{" "}
                <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className={linkClass}>viable</Link>, we also examine what might threaten its viability. Instead of evaluating only current competitors, we consider emerging substitutes and alternative ways customers might solve the problem. Instead of building operations solely for today's model, we consider which components should remain flexible. Instead of treating a business plan as a finished document, we establish a process for continuously challenging the assumptions behind it.
              </P>

              <P tight>In other words:</P>

              <P>
                <strong>Architect for the future. Validate in the present. Build in small steps. Adapt continuously.</strong>
              </P>

              <P>That is the principle. But principles are only useful when they change what we actually do.</P>

              <H2>6. How would this work in practice?</H2>

              <P>I would approach Anticipatory Business Architecture as a continuous cycle of six activities.</P>

              <ol
                aria-label="The six-step Anticipatory Business Architecture cycle"
                className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1a1816]/10 border border-[#1a1816]/10"
                style={{ marginBottom: "1.5rem", listStyle: "none", paddingLeft: 0 }}
              >
                {cycleSteps.map((step, i) => (
                  <li key={step.name} className="bg-white p-6" style={{ margin: 0 }}>
                    <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-2">Step {i + 1}</p>
                    <p className="text-xl font-light mb-1">{step.name}</p>
                    <p className="text-base text-[#1a1816]/70" style={{ lineHeight: "1.5" }}>{step.question}</p>
                  </li>
                ))}
              </ol>

              <p className="text-xs tracking-widest uppercase text-[#1a1816]/50" style={{ marginBottom: "3.5rem" }}>
                Observe → Interpret → Anticipate → Architect → Validate → Adapt, and the cycle begins again
              </p>

              <H3>First: Observe.</H3>

              <P tight>Start by collecting signals from the environment surrounding the business. Customer behavior. Technology. Regulation. Economic conditions. Competitors. Adjacent industries. Emerging alternatives.</P>

              <P tight>The objective isn't to collect everything. It's to identify developments that could materially change the problem, the customer, the value proposition, or the economics of the business.</P>

              <P>A founder building an AI-powered software product might need to observe changes weekly. Someone operating a local physical service business may need a different rhythm. The discipline matters more than the frequency.</P>

              <H3>Second: Interpret.</H3>

              <P tight>Signals alone don't tell us what to do. We need to ask what they could mean. If technology makes a service cheaper, does that reduce our opportunity or expand the market? If customers begin doing something themselves, what will they still need help with? If an established competitor changes its business model, what does that suggest about the market?</P>

              <P>Interpretation is where experience, judgment, and imagination become valuable. It's also where we should challenge our own biases. We are remarkably good at interpreting new information in ways that confirm decisions we've already made.</P>

              <H3>Third: Anticipate.</H3>

              <P tight>Develop a small number of plausible scenarios. Not elaborate science fiction. Practical possibilities that would materially affect the business. For example:</P>

              <Ul
                items={[
                  "What if our current solution becomes widely available at a fraction of the cost?",
                  "What if customer expectations shift from purchasing a product to purchasing an outcome?",
                  "What if a new technology creates an entirely different way to solve the underlying problem?",
                ]}
              />

              <P>For each scenario, ask what happens to customer demand, pricing, delivery, costs, and competitive advantage. And importantly, identify what evidence would suggest that scenario is beginning to unfold.</P>

              <H3>Fourth: Architect.</H3>

              <P tight>Use those insights to make better design decisions. Perhaps the business should avoid investing heavily in a capability likely to become commoditized. Perhaps it should develop stronger customer relationships rather than compete exclusively on production speed. Perhaps the offer should be modular, allowing new services to be introduced without redesigning the entire operation. Perhaps the business needs more than one route to market.</P>

              <P>This doesn't mean building unnecessary complexity in preparation for every imaginable future. Quite the opposite. It means understanding where flexibility has value and where simplicity should prevail.</P>

              <H3>Fifth: Validate.</H3>

              <P tight>This is where anticipation meets reality. A plausible scenario is not a customer order. An exciting technology trend is not proof of demand. And an elegant business architecture doesn't guarantee commercial viability.</P>

              <P tight>So we test. Talk to customers. Investigate alternatives. Run small experiments. Test willingness to pay. Challenge the assumptions with the greatest financial consequences. Commit resources progressively as evidence improves.</P>

              <P>
                If something is inexpensive and reversible, experimentation may be the smartest move. If it requires substantial money, time, or irreversible commitments, deeper architecture and{" "}
                <Link href="/thinking/the-business-architects-frame" className={linkClass}>validation</Link> become more important.
              </P>

              <H3>Sixth: Adapt.</H3>

              <P tight>Finally, establish a way to revisit decisions. What signals would tell us the market is changing? What evidence would justify revising the offer? When should we invest further, change direction, or stop? Without these questions, even the best initial architecture can become obsolete.</P>

              <P tight>Adaptation should not depend exclusively on the founder waking up one morning with a sudden feeling that something is wrong. It should be informed by evidence.</P>

              <P>And the cycle begins again.</P>

              <H2>7. This applies to existing businesses, too.</H2>

              <P tight>Although much of this discussion focuses on entrepreneurs and startups, I believe the implications for established businesses may be even greater. Established companies often accumulate complexity over time. Processes are added. Systems are introduced. Departments develop their own ways of working. Decisions made years earlier become embedded in the organization.</P>

              <P tight>Eventually, the business may be exceptionally good at operating a model that no longer fits its environment. AI can make that problem worse if it is simply introduced to accelerate existing activities without questioning whether those activities still make sense.</P>

              <P>Automating an outdated process doesn't make the business more relevant. It simply makes the outdated process faster.</P>

              <P tight>
                This is territory I'm exploring in my ongoing work on <em>Architecting Intelligence</em>, the body of ideas behind a book I'm developing. Over time, businesses accumulate systems, processes, departments, and operating habits without reconsidering the architecture that connects them. Adding AI to those structures may accelerate activities without improving the underlying business.
              </P>

              <P tight>
                The harder challenge is to rethink how human intelligence, artificial intelligence, judgment, processes, and decision-making work together. I've set out the core of that argument in{" "}
                <Link href="/thinking/architecting-intelligence" className={linkClass}>Architecting Intelligence</Link>. Anticipatory Business Architecture extends that thinking by asking a further question: how can the business continuously recognize and respond to changes in its environment?
              </P>

              <P tight>
                <Link href="/work/business-re-architecture" className={linkClass}>Re-architecture</Link> should begin with more fundamental questions. What value does the business need to create now? What might customers expect next? Which capabilities remain essential? Which activities should disappear, evolve, or be redesigned around a combination of human and artificial intelligence? And how should the organization be structured to keep learning?
              </P>

              <P>The objective isn't to turn every company into a startup. It's to ensure that experience, resources, and operational maturity don't become excuses for standing still.</P>

              <H2>8. The danger of trying to build for the future.</H2>

              <P tight>There's an obvious objection to everything I've argued. What if we spend so much time anticipating tomorrow that we forget to build something customers want today? It's a fair criticism.</P>

              <P tight>Entrepreneurs can easily become fascinated by emerging technology, hypothetical markets, and opportunities that might exist someday. They can spend years preparing for a future that never arrives.</P>

              <P tight>That isn't architecture. It's speculation with a business card.</P>

              <P tight>The discipline I'm proposing must avoid that trap. A business needs a credible path to creating value in the present. Anticipation should improve that path, not replace it.</P>

              <P tight>We should distinguish between what we know, what we reasonably suspect, and what we're merely imagining. We should design inexpensive ways to learn before making expensive commitments. And we should be prepared to abandon an anticipated opportunity when evidence contradicts it.</P>

              <P>The future matters. But today's customers still pay today's invoices.</P>

              <H2>9. The real competitive advantage may be the ability to remain relevant.</H2>

              <P tight>I find something encouraging about this shift. The conversation around AI often suggests that the future belongs exclusively to technology specialists, young founders, or companies with enormous amounts of capital. I don't believe that. Technology matters, of course.</P>

              <P tight>But anticipating change requires more than technological knowledge. It requires understanding people. Recognizing patterns. Questioning assumptions. Connecting experiences from different industries. Understanding how businesses actually create value. And knowing when not to follow the crowd.</P>

              <P tight>These are capabilities that experienced entrepreneurs, professionals, and business leaders can develop and strengthen. In some cases, years of experience may provide an advantage, provided that experience doesn't become a prison of old assumptions.</P>

              <P tight>The entrepreneurs of tomorrow won't necessarily be those who adopt every new technology first. Nor will they automatically be those who build the fastest. I suspect the more durable advantage will belong to those who understand how customer needs are evolving, make intelligent commitments, and redesign their businesses when reality demands it.</P>

              <P tight>That is where I believe Business Architecture has an increasingly important role to play. Not simply helping people turn ideas into viable businesses. But helping them build businesses capable of remaining viable as the world changes.</P>

              <P tight>Because the greatest risk isn't always that your business idea fails.</P>

              <P>
                <strong>Sometimes the greater risk is that it succeeds—just long enough for you to become completely committed to a business model the world is already leaving behind.</strong>
              </P>

              <P tight>We cannot predict the future perfectly. But we can stop pretending that the future has nothing to do with the businesses we're architecting today.</P>

              <P>And that, to me, is a good place to start.</P>

              <p
                className="border-t border-[#1a1816]/8 pt-8"
                style={{ fontSize: "1rem", lineHeight: "1.7", color: "rgba(26,24,22,0.7)", marginBottom: "3.5rem" }}
              >
                <strong>About the author.</strong> Martin Dubreuil is The Modern Business Architect™. He works with entrepreneurs to turn ideas into coherent businesses and helps make them exist. His work explores how business models, people, technology, and intelligence can be architected to create value.
              </p>

            </div>

          </div>
        </section>

        {/* ARTICLE FOOTER */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto space-y-12">

            <nav aria-label="Related reading" className="space-y-4">
              <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related reading</p>
              <ul className="space-y-3 text-lg font-light">
                <li>
                  <Link href="/answers/what-is-business-architecture" className={linkClass}>What Is Business Architecture?</Link>
                </li>
                <li>
                  <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className={linkClass}>How Do I Know If My Business Idea Is Actually Viable?</Link>
                </li>
                <li>
                  <Link href="/thinking/the-business-architects-frame" className={linkClass}>The Business Architect's FRAME™</Link>
                </li>
                <li>
                  <Link href="/thinking/architecting-intelligence" className={linkClass}>Architecting Intelligence</Link>
                </li>
                <li>
                  <Link href="/work/business-re-architecture" className={linkClass}>Business Re-Architecture</Link>
                </li>
              </ul>
            </nav>

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
                  aria-label={`Copy link to ${articleTitle}`}
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                >
                  {copyFeedback ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-[#1a1816]/8 space-y-4">
              <Link href="/work" className="block">
                <span className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60">
                  Explore business architecture work →
                </span>
              </Link>
              <Link href="/martin" className="block">
                <span className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60">
                  About Martin Dubreuil →
                </span>
              </Link>
            </div>

          </div>
        </section>

        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
