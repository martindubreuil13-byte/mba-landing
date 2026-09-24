/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import CustomerArchitectureMap from "@/app/components/customer-architecture/CustomerArchitectureMap";
import CopyablePrompt from "@/app/components/customer-architecture/CopyablePrompt";
import { PERSONA_PROMPT, VISUAL_PERSONA_PROMPT } from "@/app/lib/customer-architecture/prompts";

const H2_STYLE = { fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816", scrollMarginTop: "6rem" } as const;
const LINK_CLASS = "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

const INTENSITY = ["Low irritation", "Recurring frustration", "Meaningful consequence", "Urgent problem", "Must solve"];

const MIND_STATES = [
  { stage: "Before recognising the problem", thought: "It's fine. Everyone deals with this." },
  { stage: "After recognising it", thought: "OK. This is actually costing me." },
  { stage: "While researching", thought: "Why does every option look the same, and why is every one of them the best?" },
  { stage: "After a failed attempt", thought: "I've been burned once. Prove it." },
  { stage: "Discovering a possible solution", thought: "This might be it. But is it for someone like me?" },
  { stage: "Just before buying", thought: "What if I'm wrong about this?" },
  { stage: "After experiencing it", thought: "Was that worth it? Would I tell anyone?" },
];

const JOURNEY: { step: string; loop?: string }[] = [
  { step: "Problem exists" },
  { step: "They tolerate it", loop: "sometimes for years" },
  { step: "Something changes" },
  { step: "They start searching" },
  { step: "They get confused", loop: "stop, delay, get distracted" },
  { step: "They try something" },
  { step: "It half works", loop: "back to searching, or back to tolerating it" },
  { step: "They find you" },
  { step: "Trust develops" },
  { step: "They compare alternatives", loop: "try a competitor, or do nothing" },
  { step: "They buy" },
  { step: "They get an outcome" },
  { step: "They reassess", loop: "stay, leave, buy more, or tell someone" },
];

const DAVID_MAP = [
  { label: "Move", line: "Restructuring close to him turns a someday question into a this-year question.", status: "K" },
  { label: "Mind", line: "More afraid of making the wrong decision than of making no decision.", status: "A" },
  { label: "Money", line: "Can afford expert help. Will only pay if it reduces the risk of a bad decision.", status: "A" },
  { label: "Reach", line: "Searches and asks AI privately before he mentions it to anyone at work.", status: "A" },
  { label: "Not them", line: "People looking for motivation, or for someone to build the business for them.", status: "K" },
];

const FAQ = [
  {
    q: "What should an ideal customer profile include?",
    a: "Who experiences the problem and in what situation; what they are experiencing and how intensely; what triggers them to act now; what they believe, fear and expect; whether they can and will pay; how they move from problem to solution; where you can reach them; the outcome they want; who is excluded; and which parts are evidence rather than assumption. Demographics belong in it only where they change the problem, the behaviour or the ability to buy.",
  },
  {
    q: "What is the difference between an ICP, a customer persona and a target market?",
    a: "A target market is the broad group you could sell to. An ideal customer profile defines the customers you are best placed to serve and most likely to succeed with. A customer persona, also called a customer avatar or buyer persona, is one illustrative person who represents that profile, so it becomes easier to write and decide for.",
  },
  {
    q: "Do demographics matter when defining a customer?",
    a: "Sometimes. Age, location, income, gender, profession or company size matter when they change the problem, the buying behaviour or the ability to pay. When they don't, they're decoration, and they can make a profile look precise while telling you nothing about why anyone would buy.",
  },
  {
    q: "How do I know if a customer problem is important enough?",
    a: "Look at frequency, intensity and consequence, and above all at behaviour. People already spending time or money on workarounds, or who have tried and failed to fix it, are telling you it matters. A problem people complain about but never act on is usually not strong enough to overcome inertia.",
  },
  {
    q: "How do I validate an ideal customer profile?",
    a: "Treat it as a hypothesis and test the most dangerous assumptions first, usually the trigger, willingness to pay and reachability. Talk to people who match the profile about the last time the problem happened and what they did about it. Then put a real offer at a real price in front of them. Behaviour beats opinion, and payment beats praise.",
  },
  {
    q: "Can I use AI to create a customer persona?",
    a: "Yes, as long as the AI works from your research rather than replacing it. Ask it to separate evidence from assumption, flag gaps and contradictions, and mark assumptions in what it writes. Otherwise it will turn your guesses into a confident, well-written fiction.",
  },
  {
    q: "How many ideal customer profiles should a new business have?",
    a: "Usually one to start. A new business rarely has the money, time or attention to win several customer groups at once, and trying to usually produces messaging that fits none of them. You can widen later, once the first customer is genuinely understood and served.",
  },
];

export default function ArticlePage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const articleUrl = "https://modernbusinessarchitect.com/thinking/how-to-define-your-ideal-customer";

  const handleShare = (platform: string) => {
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

        {/* ============================================================
            ARTICLE OPENING
        */}

        <article className="w-full px-6 md:px-12 lg:px-16 pt-40 md:pt-56 pb-16 md:pb-24">
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
                  How to Define Your Ideal Customer
                </h1>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                  And no, giving them a name and an age isn't enough.
                </p>
                <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/65 mt-6">
                  A practical way to understand who you're actually building for, before you turn them into a persona. Includes a one-page <a href="#the-customer-architecture-map" className={LINK_CLASS}>Customer Architecture Map</a> and two AI prompts you can use today.
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
                  <p className="text-sm text-[#1a1816]/65">September 24, 2026</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero visual: the demographic box versus the question that matters */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              viewport={{ once: true }}
              role="img"
              aria-label="A customer avatar description, 'Female. 42. London. Two kids. Audi. Yoga.', crossed out and replaced by the question 'What is she trying to change?'"
              className="mt-20 md:mt-28 border-t border-b border-[#1a1816]/10 py-14 md:py-20"
            >
              <p
                aria-hidden="true"
                className="text-sm md:text-base tracking-widest uppercase text-[#1a1816]/35 line-through decoration-[#6b1f1f]/70 decoration-2"
              >
                Female. 42. London. Two kids. Audi. Yoga.
              </p>
              <p aria-hidden="true" className="mt-6 md:mt-8 text-3xl md:text-5xl font-light leading-tight text-[#1a1816]">
                What is she trying to <span className="text-[#6b1f1f]">change</span>?
              </p>
            </motion.div>

          </div>
        </article>

        {/* ============================================================
            ARTICLE BODY
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-16 md:py-24">
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

<p style={{ marginBottom: "1.75rem" }}>You've probably done this exercise. Maybe in a workshop, maybe on a course, maybe alone at the kitchen table with a template you downloaded at midnight.</p>

<p style={{ marginBottom: "2.5rem" }}>It goes something like this.</p>

<p style={{ marginBottom: "2.5rem" }}>Sarah is 42. She lives in London. She has two children, drives an Audi, does yoga twice a week and drinks Sauvignon Blanc, though only on Fridays, and only once the kids are asleep. Somebody has even found her a stock photo. She is laughing at a salad.</p>

<p style={{ marginBottom: "2.5rem" }}>Excellent.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Now tell me why the hell Sarah would buy from you.</p>

<p style={{ marginBottom: "2.5rem" }}>There's usually a pause. Then something like "well, she's busy," which is true of roughly every adult on the planet, including the ones who will never buy anything from you.</p>

<p style={{ marginBottom: "2.5rem" }}>That's the problem with most customer-avatar exercises. They describe a person in loving detail and skip the only thing that matters commercially: the situation that makes this person relevant to your business. Nothing in Sarah's biography tells you what she's struggling with, what would make her act this month instead of never, or whether she'd pay for any of it.</p>

<p style={{ marginBottom: "3.5rem" }}>You've written a character. Not a customer.</p>

<p style={{ marginBottom: "3.5rem" }}><strong>A fictional biography is not customer understanding.</strong></p>

<p style={{ marginBottom: "2.5rem" }}>To be clear, I'm not against Sarah. By the end of this piece you'll have built a Sarah of your own. I'm against Sarah arriving first.</p>

<p style={{ marginBottom: "3.5rem" }}>Don't start by inventing a person. Start by understanding a human situation.</p>

<h2 id="why-the-customer-matters" style={H2_STYLE}>Why everything comes back to the customer</h2>

<p style={{ marginBottom: "2.5rem" }}>Almost every decision in a business is quietly a decision about the customer. What to build, what to leave out, what to charge, what to say and where to say it.</p>

<p style={{ marginBottom: "2.5rem" }}>If you don't know who you're building for, every one of those decisions becomes a guess dressed up as strategy.</p>

<p style={{ marginBottom: "2.5rem" }}>And the guesses compound. Change the customer and you've probably changed the offer. Change the offer and the price moves. Change the price and the acquisition channel you could afford last month may no longer be affordable. That's what I mean by <Link href="/answers/what-is-business-architecture" className={LINK_CLASS}>Business Architecture</Link>. The pieces aren't separate documents. They're one system, and the customer sits underneath most of it.</p>

<p style={{ marginBottom: "2.5rem" }}>It's also why so many marketing problems aren't marketing problems. The ads don't convert, the website doesn't land, the content gets polite likes and no enquiries. Sometimes the copy really is bad. More often the founder doesn't actually know who they're talking to, so they talk to everyone, in language carefully designed not to exclude anybody, and it lands with nobody.</p>

<p style={{ marginBottom: "3.5rem" }}>In my Business Architecture Series I call this the <strong>Everyone Fallacy</strong>. Focus on everyone, reach no one. Just because everyone could use something doesn't mean everyone is your customer.</p>

<h2 id="icp-vs-persona" style={H2_STYLE}>Ideal customer profile, persona, avatar: what's the difference?</h2>

<p style={{ marginBottom: "2.5rem" }}>A quick bit of vocabulary, because these terms get used interchangeably and it causes real confusion.</p>

<p style={{ marginBottom: "1.75rem" }}>Your <strong>target market</strong> is the broad group you could sell to. "Independent restaurants." It tells you where to look.</p>

<p style={{ marginBottom: "1.75rem" }}>Your <strong>ideal customer profile</strong>, or ICP, defines the customers you're best placed to serve: the people who have the problem most strongly, a reason to act, the ability to buy and a realistic chance of getting value from what you do. It tells you who to understand.</p>

<p style={{ marginBottom: "2.5rem" }}>A <strong>customer persona</strong>, customer avatar or buyer persona is a human representation of that profile. One illustrative person, with a name and a face, standing in for the thinking behind them.</p>

<p style={{ marginBottom: "2.5rem" }}>Most founders try to build the third without doing the second. That's how you get Sarah.</p>

<p style={{ marginBottom: "3.5rem" }}>The rest of this piece is about building the profile properly, which I think of as the customer architecture, and only then turning it into a person.</p>

<h2 id="six-questions" style={H2_STYLE}>Six questions that build a customer</h2>

<p style={{ marginBottom: "2.5rem" }}>This isn't a methodology with a trademark and a certificate at the end. It's six questions I keep coming back to whenever I'm trying to understand a customer, whether that's for a founder's first idea or for a business that has been running for years and has quietly lost track of who it's for.</p>

<p style={{ marginBottom: "3.5rem" }}>They overlap. You'll answer one and realise it changed another. That's normal. It's architecture, not a form.</p>

<h2 id="who-experiences-the-problem" style={H2_STYLE}>1. Who actually experiences the problem?</h2>

<p style={{ marginBottom: "2.5rem" }}>Not "who could use this." Who actually experiences the problem, in a way you'd recognise if they walked past you in the street.</p>

<p style={{ marginBottom: "2.5rem" }}>Start with the situation rather than the category. "Small businesses" is a category. So is "parents," and so is "professionals." None of them is a customer. Compare:</p>

<p style={{ marginBottom: "1.75rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Restaurants.</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Owner-run restaurants in a sustained weekday decline, already trying promotions that aren't working.</p>

<p style={{ marginBottom: "2.5rem" }}>The first tells you where to look. The second tells you who to understand.</p>

<p style={{ marginBottom: "2.5rem" }}>So describe the situation. Their role, their life stage or business stage, their economic situation, the environment they operate in. For a business customer, the firmographics: size, sector, maturity, how decisions actually get made.</p>

<p style={{ marginBottom: "3.5rem" }}>Then separate the roles, because they're often different people. The person who experiences the problem isn't always the person who pays. Parents buy and children use. HR buys and employees use. The operations manager feels the pain and the finance director signs. The beneficiary, the user, the buyer and the decision-maker can be four different humans, each wanting something slightly different from you.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>So do demographics matter?</strong></p>

<p style={{ marginBottom: "2.5rem" }}>Sometimes. But include them because they explain something, not because the template has an empty box.</p>

<p style={{ marginBottom: "2.5rem" }}>Age matters if you sell retirement planning. Geography matters if you run a physiotherapy clinic and people won't drive more than twenty minutes to see you. Company size matters if anything above fifty employees triggers a procurement process that takes six months. Income matters if your product costs more than a month's rent.</p>

<p style={{ marginBottom: "2.5rem" }}>The test is simple. Keep a characteristic if it changes the problem, the behaviour, the buying situation or the ability to pay. Otherwise it's decoration.</p>

<p style={{ marginBottom: "3.5rem" }}>Sarah's Audi only matters if you're selling Audi servicing.</p>

<h2 id="what-they-experience" style={H2_STYLE}>2. What are they actually experiencing?</h2>

<p style={{ marginBottom: "2.5rem" }}>Now the problem itself. Or the frustration, or the aspiration, because not every customer is running away from pain. Some are running toward something.</p>

<p style={{ marginBottom: "2.5rem" }}>Be specific. How often does it happen? How intense is it? What does it cost them, in money, time, stress, reputation or missed opportunity? What are they doing about it today? What have they already tried, and why didn't it work?</p>

<p style={{ marginBottom: "2.5rem" }}>That last question is badly underrated. Existing workarounds are some of the best evidence you'll ever find. The spreadsheet held together with hope. The nephew who "does computers." The WhatsApp group. The Sunday evening spent chasing invoices. A workaround is a customer telling you, through behaviour, that the problem matters enough to do something about.</p>

<p style={{ marginBottom: "2.5rem" }}>Pay attention to intensity too, because two people can technically have the same problem and live completely different lives with it.</p>

<p style={{ marginBottom: "2.5rem" }}>A freelance designer who finds invoicing tedious and an agency owner whose late invoicing leaves the business short of cash before payroll both have "an invoicing problem." One of them sighs about it. The other is awake at 3am.</p>

<p style={{ marginBottom: "1.75rem" }}>It helps to picture it as a spectrum.</p>

<div className="not-prose my-10 border-t border-b border-[#1a1816]/10 py-8 md:py-10">
  <ol className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-3">
    {INTENSITY.map((level, i) => (
      <li key={level} className="flex md:flex-col items-center md:items-start gap-4 md:gap-3">
        <span aria-hidden="true" className="block h-1.5 w-12 md:w-full shrink-0" style={{ background: `rgba(107, 31, 31, ${0.12 + i * 0.22})` }} />
        <span className="text-sm text-[#1a1816]/80">{level}</span>
      </li>
    ))}
  </ol>
  <p className="mt-8 text-xs tracking-widest uppercase text-[#1a1816]/40">Intensity affects movement. It doesn't guarantee a purchase.</p>
</div>

<p style={{ marginBottom: "3.5rem" }}>The further right someone sits, the more likely they are to move. It's not a guarantee. Plenty of people live with urgent problems for years. But a business built for people at the far left of that line is going to spend a great deal of money persuading them to care.</p>

<h2 id="why-move-now" style={H2_STYLE}>3. Why would they move now?</h2>

<p style={{ marginBottom: "2.5rem" }}>This is the question most customer profiles skip, and it's the one that decides whether anything happens at all.</p>

<p style={{ marginBottom: "2.5rem" }}>People tolerate problems every day. The squeaky door. The software everyone hates. The job that's fine. Inertia is the default setting for human beings and for most businesses, and it isn't laziness. The current situation is usually acceptable, change is effort, and whatever future you're promising is a bit abstract from where they're standing.</p>

<p style={{ marginBottom: "2.5rem" }}>That's the <strong>Inertia Equation</strong>, from the same series. A customer needs a reason to move that's stronger than the comfort of staying. They might be moving away from something, like frustration, loss or risk, or toward something, like growth, freedom or status. Either works. Neither works if it's weak.</p>

<p style={{ marginBottom: "2.5rem" }}>So a problem existing doesn't create a customer. Something usually has to change.</p>

<p style={{ marginBottom: "2.5rem" }}>A deadline. A lost client. A new regulation. A bad quarter. A birthday with a zero at the end. A colleague made redundant. A child leaving home. A competitor doing something that makes you look slow. A new boss, new money, or new information that suddenly makes an old problem look expensive.</p>

<p style={{ marginBottom: "2.5rem" }}>These are triggers, and they're gold, because they tell you <em>when</em> someone becomes a customer rather than just who they are. The same person can be completely uninterested in March and actively searching in May. Their demographics didn't change. Their situation did.</p>

<p style={{ marginBottom: "3.5rem" }}>Ask, too, what doing nothing costs them. Most people pay for their problems in instalments, a little every week, and a cost that arrives in small pieces stops feeling like a cost. It starts feeling normal. Part of your job is understanding whether that cost is large enough, and visible enough, to eventually make staying more painful than moving.</p>

<h2 id="inside-their-head" style={H2_STYLE}>4. What is happening inside their head?</h2>

<p style={{ marginBottom: "2.5rem" }}>Marketers call this psychographics. I'd rather not hide it behind the word. It's what they believe, fear, want and expect. Who they think they are. What they're sceptical about, usually because somebody has disappointed them before. How risky this feels. And the language they use when they describe the problem to a friend, which is almost never the language on your website.</p>

<p style={{ marginBottom: "3.5rem" }}>Nobody says "I'm experiencing inefficiencies in my accounts receivable process." They say "I spend every Sunday night chasing invoices and I want my life back."</p>

<p style={{ marginBottom: "2.5rem" }}>Here's what most customer profiles get wrong, though. They treat psychology as fixed, as if Sarah has one set of beliefs that sits there waiting to be targeted.</p>

<p style={{ marginBottom: "1.75rem" }}>Real psychology moves. What someone thinks before they've admitted the problem is very different from what they think after they've tried to fix it and failed.</p>

<div className="not-prose my-10 border-t border-[#1a1816]/10">
  <dl>
    {MIND_STATES.map((m) => (
      <div key={m.stage} className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-1 md:gap-8 border-b border-[#1a1816]/10 py-5">
        <dt className="text-xs tracking-widest uppercase text-[#1a1816]/50 md:pt-1">{m.stage}</dt>
        <dd className="text-lg font-light italic text-[#1a1816]/85">"{m.thought}"</dd>
      </div>
    ))}
  </dl>
</div>

<p style={{ marginBottom: "2.5rem" }}>Psychologically, each of those is a different person, even though it's the same human. They need to hear different things. Talk to the "I've been burned" version with the enthusiasm you'd use on the "this might be it" version and you'll sound exactly like every vendor who let them down.</p>

<p style={{ marginBottom: "3.5rem" }}>This is where good messaging actually comes from. Not clever copywriting. When a customer reads something and thinks <em>how the hell did they know I was thinking that?</em>, it's usually because someone understood which stage they were in and what they were privately saying to themselves while they were there.</p>

<h2 id="can-they-buy" style={H2_STYLE}>5. Can they buy, and will they buy?</h2>

<p style={{ marginBottom: "2.5rem" }}>Two different questions, and founders merge them constantly.</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Can they pay?</strong> Do they have the money, the budget and the authority to spend it? Who has to approve it? Is there a procurement process, a spouse, a board, a finance director with opinions? Is this the right moment in their year, their cash cycle, their life?</p>

<p style={{ marginBottom: "2.5rem" }}><strong>Will they pay?</strong> Is what you're offering worth more to them than what it costs? And cost means more than price. It's the effort of switching, the learning curve, the risk of choosing badly, the internal politics, and the time before anything actually improves.</p>

<p style={{ marginBottom: "3.5rem" }}>The mistake here is what I call the <strong>Wallet Fallacy</strong>: the belief that if something is valuable enough, people will buy it. Value is a reason to want something. It isn't a reason to buy it. Every purchase is a quiet comparison between two pains, the pain of staying and the pain of paying, and nothing moves until the first is clearly heavier.</p>

<p style={{ marginBottom: "2.5rem" }}>This is where commercial reality bites.</p>

<p style={{ marginBottom: "2.5rem" }}>Someone can desperately want a solution and still be a terrible customer for your business. The first-time founder with no money who needs a full brand strategy. The small charity that would benefit enormously from your software and has a budget of nothing. Real need, real desire, no realistic purchase.</p>

<p style={{ marginBottom: "2.5rem" }}>Likewise, someone can easily afford something and have absolutely no reason to buy it. The finance director could pay for your product out of petty cash. She's never going to, because the problem you solve sits three layers below anything she's measured on.</p>

<p style={{ marginBottom: "3.5rem" }}>So look at where they already spend money: on this problem, on adjacent problems, on workarounds. Existing spending is one of the most useful clues you'll get, because it tells you the problem has already cleared the bar of being worth paying for. Then look at what competes for the same money, including doing nothing, which is always the cheapest option on the table.</p>

<h2 id="how-they-move" style={H2_STYLE}>6. How do they move?</h2>

<p style={{ marginBottom: "2.5rem" }}>Finally, the customer journey. How does this person actually get from "the problem exists" to "the problem is solved"?</p>

<p style={{ marginBottom: "2.5rem" }}>The textbook version is a tidy funnel. Awareness, interest, consideration, decision, purchase. Five stages, one direction, a neat arrow pointing down.</p>

<p style={{ marginBottom: "2.5rem" }}>Real customer journeys aren't funnels drawn by marketing departments. They're messy.</p>

<p style={{ marginBottom: "1.75rem" }}>A more honest version looks something like this.</p>

<div className="not-prose my-10 border-t border-b border-[#1a1816]/10 py-8 md:py-10">
  <p className="text-base md:text-lg leading-loose text-[#1a1816]/85">
    {JOURNEY.map((j, i) => (
      <React.Fragment key={j.step}>
        <span className="whitespace-nowrap">{j.step}</span>
        {j.loop && (
          <span className="text-sm italic text-[#6b1f1f]"> (↺ {j.loop})</span>
        )}
        {i < JOURNEY.length - 1 && <span aria-hidden="true" className="text-[#1a1816]/30"> → </span>}
      </React.Fragment>
    ))}
  </p>
</div>

<p style={{ marginBottom: "2.5rem" }}>People stop, reconsider, try their brother-in-law, fail, learn something and come back. Some of them reach you on their second or third lap, still carrying the disappointment of the first.</p>

<p style={{ marginBottom: "3.5rem" }}>Mapping this matters for a practical reason. It tells you where you're likely to meet the customer, what they already believe by the time they arrive, and where they'll stall. Someone who finds you after a failed attempt with a competitor needs something very different from someone who has just realised the problem exists. And the stall points, where people quietly give up, deserve more attention than they usually get. That's often where a business is leaking customers it already earned.</p>

<h2 id="define-the-transformation" style={H2_STYLE}>Define the transformation</h2>

<p style={{ marginBottom: "1.75rem" }}>Once you've worked through the six questions, step back and ask what change you're actually helping someone make.</p>

<div className="not-prose my-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-4 md:gap-6 border-t border-b border-[#1a1816]/10 py-8 md:py-10">
  {[
    { name: "Current state", question: "Where is this person today?" },
    { name: "Intervention", question: "What needs to happen in between?" },
    { name: "Desired state", question: "Where are they trying to get?" },
  ].map((stage, i) => (
    <React.Fragment key={stage.name}>
      <div>
        <p className="text-xs tracking-widest uppercase font-semibold text-[#6b1f1f] mb-2">{stage.name}</p>
        <p className="text-base text-[#1a1816]/70 leading-relaxed">{stage.question}</p>
      </div>
      {i < 2 && <p aria-hidden="true" className="text-2xl font-light text-[#1a1816]/30 md:pt-3 rotate-90 md:rotate-0 w-fit">→</p>}
    </React.Fragment>
  ))}
</div>

<p style={{ marginBottom: "2.5rem" }}>Your product or service is the intervention. It's the bridge, not the destination.</p>

<p style={{ marginBottom: "2.5rem" }}>And the destination is rarely the product. Nobody wakes up wanting accounting software. They want to stop dreading the end of the month. The outcome someone is after might be functional, financial, emotional, social or about identity, and it's usually more than one of those at once.</p>

<p style={{ marginBottom: "3.5rem" }}>People end up paying for time, certainty, relief, status, control, confidence, progress or less risk. The product is how they get there. It usually isn't the thing they value.</p>

<h2 id="can-you-reach-them" style={H2_STYLE}>Can you actually reach them?</h2>

<p style={{ marginBottom: "2.5rem" }}>This question quietly kills otherwise attractive customers.</p>

<p style={{ marginBottom: "2.5rem" }}>Suppose you've found them. They have the problem. They have a reason to act now. They have the money and they're willing to spend it. They can still be a poor customer for your business if reaching them costs more than they're worth to you.</p>

<p style={{ marginBottom: "2.5rem" }}>So, where are they?</p>

<p style={{ marginBottom: "2.5rem" }}>Where do they look for answers? What do they type into Google, or ask ChatGPT at 11pm? Who do they listen to? Which communities, associations, forums, newsletters, podcasts or group chats are they part of? Who influences the decision: a peer, an accountant, a trade body, their partner? Where do they already spend money on related problems? How do people like them normally discover solutions like yours? And what words do they use to describe the problem, because those are the words they'll search with.</p>

<p style={{ marginBottom: "2.5rem" }}>I've written before that <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className={LINK_CLASS}>a business with willing customers you cannot economically reach is a very frustrating hobby</Link>, and I stand by it.</p>

<p style={{ marginBottom: "3.5rem" }}>This is where customer architecture turns directly into go-to-market strategy. Your channels should follow the customer, not your preferences. If your customers live in private WhatsApp groups and industry dinners, your beautifully optimised Instagram strategy is a diary.</p>

<h2 id="who-is-not-your-customer" style={H2_STYLE}>Who is not your customer?</h2>

<p style={{ marginBottom: "2.5rem" }}>A useful customer profile has edges. If it doesn't exclude anybody, it isn't doing its job.</p>

<p style={{ marginBottom: "1.75rem" }}>So ask the uncomfortable version:</p>

<ul className="list-disc pl-6 space-y-2" style={{ marginBottom: "2.5rem" }}>
  <li>Who looks like a fit but actually isn't?</li>
  <li>Who has the problem but no urgency?</li>
  <li>Who needs the solution but can't realistically buy it?</li>
  <li>Who is expensive to acquire?</li>
  <li>Who really needs a completely different product?</li>
  <li>Who would create operational complexity you'd regret?</li>
  <li>Who is unlikely to get the value you're promising?</li>
</ul>

<p style={{ marginBottom: "2.5rem" }}>Founders resist this because choosing feels like losing. It isn't. Every group you rule out makes the ones you keep easier to see, easier to talk to and cheaper to reach.</p>

<p style={{ marginBottom: "3.5rem" }}>Exclusion also means "not for now," not "not ever." You can widen later. You can't start everywhere. And knowing who you won't serve makes your positioning dramatically sharper, because you finally get to say something specific.</p>

<h2 id="evidence-versus-assumption" style={H2_STYLE}>What do you know, and what are you assuming?</h2>

<p style={{ marginBottom: "2.5rem" }}>Here's the trap in everything above.</p>

<p style={{ marginBottom: "2.5rem" }}>If you're thoughtful and a decent writer, you can work through all six questions in an afternoon, produce something detailed, coherent and convincing, and have almost no idea whether any of it is true.</p>

<p style={{ marginBottom: "3.5rem" }}>That's worse than Sarah. Sarah is at least obviously fictional. A sophisticated fictional customer is dangerous precisely because it doesn't look fictional.</p>

<p style={{ marginBottom: "2.5rem" }}>So for every line you write, ask: do I know this, or am I assuming it? Mark it <strong>K</strong> if you know it from evidence, or <strong>A</strong> if you're assuming it.</p>

<p style={{ marginBottom: "2.5rem" }}>The first time you do this honestly, don't be surprised if the page is covered in A's. That's uncomfortable. It's also the most useful thing the exercise produces, because the A's are your research plan. They tell you exactly what to go and find out.</p>

<p style={{ marginBottom: "2.5rem" }}>A K comes from somewhere: customer interviews, observed behaviour, existing purchases, real enquiries, sales conversations, complaints, search behaviour, product usage, willingness-to-pay tests and, best of all, actual transactions.</p>

<p style={{ marginBottom: "2.5rem" }}>An A often sounds like "I think," "they probably," "most people," "obviously," and anything you know mainly because you are, or used to be, the customer. That last one deserves care. Being your own customer is a useful starting point and a terrible sample size. Feeling the problem yourself doesn't mean thousands of other people do.</p>

<p style={{ marginBottom: "2.5rem" }}>Not all evidence is equal, either. What people say is weaker than what they do. What they do for free is weaker than what they pay for. The rule I use is simple: behaviour beats opinion, payment beats praise, evidence beats assumptions.</p>

<p style={{ marginBottom: "3.5rem" }}>Treat your ideal customer profile as a hypothesis. It gets stronger when evidence confirms it, and more useful when evidence breaks it, because that's when you learn something you didn't already believe. It's the same discipline that sits behind the Reality-Test stage of <Link href="/thinking/the-business-architects-frame" className={LINK_CLASS}>The Business Architect's FRAME</Link>, and behind any honest answer to <Link href="/answers/how-do-i-know-if-my-business-idea-is-actually-viable" className={LINK_CLASS}>whether a business idea is actually viable</Link>.</p>

<h2 id="the-customer-architecture-map" style={H2_STYLE}>The Customer Architecture Map</h2>

<p style={{ marginBottom: "2.5rem" }}>Now the practical part. The map below puts everything above onto one page. Print it, copy it into a document, or fill it in on a whiteboard with whoever you're building with.</p>

<p style={{ marginBottom: "1.75rem" }}>A few rules for using it:</p>

<ul className="list-disc pl-6 space-y-3" style={{ marginBottom: "2.5rem" }}>
  <li>Write plainly. Short sentences, specific details, the customer's own words wherever you have them.</li>
  <li>Mark every line K or A. An A isn't a failure. An A disguised as a K is.</li>
  <li>One map per customer. If you keep writing "or" in the Who block, you probably have two customers, and they probably need two maps.</li>
  <li>Come back to it. Version one is mostly guesswork. Version five, after thirty conversations and a few sales, is starting to become knowledge.</li>
</ul>

<CustomerArchitectureMap />

<div className="not-prose mb-16 border-l-2 border-[#6b1f1f] pl-6 py-1">
  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/80">Want to work on this away from the screen? The Customer Architecture Map is also available as a clean, printable PDF, with a one-page guide to using it.</p>
  <Link href="/resources/the-customer-architecture-map" className="inline-block mt-4 text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60">
    Download the Map →
  </Link>
</div>

<h2 id="create-the-persona" style={H2_STYLE}>Now create the human</h2>

<p style={{ marginBottom: "2.5rem" }}>Only now does it make sense to give your customer a name. And an age, a job, a location, a situation, a personality, a history and a face.</p>

<p style={{ marginBottom: "2.5rem" }}>Not because your entire market consists of this one person. It doesn't. The purpose is cognitive. Humans find it much easier to communicate with another human than with a spreadsheet of demographic ranges. We write better, decide better and argue more usefully when there's a person in the room, even an imaginary one.</p>

<p style={{ marginBottom: "3.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>It is much easier to ask "Would David understand this?" than "Would males aged 50 to 60 in our target demographic understand this?"</p>

<p style={{ marginBottom: "3.5rem" }}>That's the whole idea. The persona isn't the research. It's a human representation of the architecture. Every meaningful detail you give them should trace back to something on the map. Anything that doesn't, like a first name, is there only to make them easier to picture, and you should know which is which.</p>

<h2 id="example" style={H2_STYLE}>A short example: David</h2>

<p style={{ marginBottom: "2.5rem" }}>Here's a compact one, loosely based on the kind of person I often work with.</p>

<p style={{ marginBottom: "2.5rem" }}>David is 53. He has spent more than twenty-five years in a corporate career that has gone well by any measure his parents would recognise. Senior title. Good salary. A team. A calendar other people fill for him.</p>

<p style={{ marginBottom: "2.5rem" }}>He also has a business idea. He's had some version of it for about four years.</p>

<p style={{ marginBottom: "2.5rem" }}>He doesn't hate his job. That actually makes the decision harder. If he hated it, the pain of staying would do the arithmetic for him.</p>

<p style={{ marginBottom: "2.5rem" }}>What changed was small and cumulative: a restructuring that took out two people he respected, and a growing sense that too much of his future depends on decisions made by somebody else. Since then he has consumed an enormous amount of startup content. He now has far more information and not noticeably better judgment.</p>

<p style={{ marginBottom: "2.5rem" }}>He's curious about entrepreneurship and wary of throwing away the financial security he spent a career building. He doesn't lack motivation. He lacks evidence. He doesn't need anyone shouting "take the leap." He needs to know whether there's actually a business worth moving toward.</p>

<p style={{ marginBottom: "1.75rem" }}>A few lines from David's map might read like this:</p>

<div className="not-prose my-8 border border-[#1a1816]/15">
  {DAVID_MAP.map((row) => (
    <div key={row.label} className="grid grid-cols-[5.5rem_1fr_auto] md:grid-cols-[7rem_1fr_auto] gap-3 md:gap-5 items-baseline border-b last:border-b-0 border-[#1a1816]/10 px-4 md:px-6 py-4">
      <p className="text-xs tracking-widest uppercase font-semibold text-[#6b1f1f]">{row.label}</p>
      <p className="text-base leading-relaxed text-[#1a1816]/85">{row.line}</p>
      <p className="text-xs font-semibold tabular-nums text-[#1a1816]/55 border border-[#1a1816]/25 px-2 py-0.5">{row.status}</p>
    </div>
  ))}
  <p className="px-4 md:px-6 py-3 text-xs text-[#1a1816]/50 bg-[#f7f4ef]">Illustrative. The K and A marks show how a map should read, not research findings.</p>
</div>

<p style={{ marginBottom: "3.5rem" }}>Notice that almost nothing about David is demographic, and none of it concerns his car. His age appears because it's relevant: it shapes his obligations, how the job market treats him, and his growing sense that "someday" is running out of decades. Everything else is situation, trigger, psychology and buying reality. That's what makes David useful. You could write an email to David. You could tell whether a headline would make him lean in or roll his eyes.</p>

<h2 id="ai-persona-prompt" style={H2_STYLE}>Using AI to build the persona</h2>

<p style={{ marginBottom: "2.5rem" }}>AI is genuinely useful here. It's excellent at pulling scattered notes into a coherent picture. It's also extremely good at making whatever you give it sound true.</p>

<p style={{ marginBottom: "2.5rem" }}>Give it a half-finished map and ask for a persona, and you'll get a beautifully written person with confident opinions about things you've never checked. Your assumptions come back to you with better grammar. That feels like progress. It isn't.</p>

<p style={{ marginBottom: "2.5rem" }}>So the prompt below works differently. It asks the AI to audit your map before it writes anything: to separate what you know from what you assume, flag contradictions and gaps, and refuse to invent the commercially important parts. Then it writes one realistic persona, marks every assumption, and finishes by telling you what you still don't know.</p>

<p style={{ marginBottom: "1.75rem" }}>Paste it into ChatGPT, Claude or any capable assistant, then paste your completed map underneath.</p>

<CopyablePrompt id="persona-prompt" label="Prompt 1: Written customer persona" text={PERSONA_PROMPT} />

<p style={{ marginBottom: "3.5rem" }}>When the result comes back, spend more time on the open questions than on the persona. The persona is useful. The open questions show you where the business is still exposed. The AI should help you assemble the customer. It shouldn't manufacture one.</p>

<h2 id="visual-persona-prompt" style={H2_STYLE}>Optional: give them a face</h2>

<p style={{ marginBottom: "2.5rem" }}>If you want to go one step further, you can generate a portrait of your persona.</p>

<p style={{ marginBottom: "2.5rem" }}>Let's be clear about what this is. The image is not evidence. It doesn't mean every customer looks like this, and nothing about your market becomes more true because a picture of it exists. A photograph doesn't make David real. It makes the architecture easier to hold in your head while you work.</p>

<p style={{ marginBottom: "2.5rem" }}>The prompt below uses only the visual, non-sensitive details from the persona: approximate age, role, setting, realistic clothing. It deliberately leaves out psychology, finances and behaviour, because an image model will happily turn "anxious about money" into a stereotype. You want a real-looking person in a real environment, not an advert.</p>

<p style={{ marginBottom: "1.75rem" }}>If your customers vary in how they look, and they usually do, generate a few and pick one. Don't read meaning into the one you choose.</p>

<CopyablePrompt id="visual-prompt" label="Prompt 2: Visual portrait (optional)" text={VISUAL_PERSONA_PROMPT} />

<p style={{ marginBottom: "2.5rem" }}>Then print it. Put it next to your screen, or on the wall where you plan. Look at it when you're writing website copy, emails, offers, sales messages and social posts, and when you're deciding whether a feature is worth building.</p>

<p style={{ marginBottom: "2.5rem", fontStyle: "italic", marginLeft: "1.5rem" }}>Would David understand this? Would he care? Would he believe it?</p>

<p style={{ marginBottom: "3.5rem" }}>If the answer is no, it doesn't matter how clever it sounded in the meeting.</p>

<h2 id="what-changes" style={H2_STYLE}>What changes once you know who you're building for</h2>

<p style={{ marginBottom: "2.5rem" }}>Once the customer becomes clearer, something useful happens to the rest of the business.</p>

<p style={{ marginBottom: "2.5rem" }}>The problem gets clearer, because you can see it through someone's actual life instead of your idea of it. The offer gets sharper, because you know what to leave out. Positioning improves, because you've finally chosen someone to be relevant to. Pricing becomes better informed, because you understand what staying costs them and what paying feels like. Messaging gets specific, because you know which version of their thinking you're talking to. Channel decisions improve, because you know where they actually are. Product decisions improve, because you can ask whether a feature helps them move or just makes you feel busy. And go-to-market stops being a list of tactics and starts to hang together.</p>

<p style={{ marginBottom: "3.5rem" }}>The customer doesn't solve any of those pieces for you. But every one of them becomes easier to architect once the customer is real.</p>

<p style={{ marginBottom: "1.75rem" }}>You're no longer marketing to "a market."</p>

<p style={{ marginBottom: "3.5rem" }}>You're building for someone.</p>

<p style={{ marginBottom: "1.75rem" }}>Which is what Sarah was supposed to be all along.</p>

<p style={{ marginBottom: "3.5rem" }}>She just showed up before anyone had done the work.</p>

<div className="not-prose border-t border-[#1a1816]/10 pt-10 mt-4">
  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/70">
    If you're trying to work out whether an idea has a real customer, whether the problem is worth solving, or how the customer, offer, economics and go-to-market fit together, that's the work <Link href="/thinking/the-business-architects-frame" className={LINK_CLASS}>The Business Architect's FRAME</Link> is built for. If you'd rather start with a quick self-check, the <Link href="/resources/business-idea-reality-check" className={LINK_CLASS}>Business Idea Reality Check</Link> takes about five minutes and shows how much of your idea currently rests on evidence and how much on assumption.
  </p>
</div>

            </motion.div>

          </div>
        </section>

        {/* ============================================================
            QUESTIONS
        */}

        <section id="faq" className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8" style={{ scrollMarginTop: "6rem" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Questions</p>
            <h2 className="text-3xl md:text-4xl font-light leading-tight mb-12">Common questions about defining an ideal customer</h2>
            <div className="border-t border-[#1a1816]/10">
              {FAQ.map((item) => (
                <div key={item.q} className="border-b border-[#1a1816]/10 py-8">
                  <h3 className="text-xl font-light leading-snug text-[#1a1816] mb-3">{item.q}</h3>
                  <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/75">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            ARTICLE FOOTER
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

              {/* Related */}
              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related</p>

                <div className="space-y-6">
                  {[
                    {
                      href: "/answers/how-do-i-define-my-ideal-customer-profile",
                      title: "How Do I Define My Ideal Customer Profile?",
                      summary: "The short answer: what an ICP should include, and what it shouldn't.",
                    },
                    {
                      href: "/thinking/the-business-architects-frame",
                      title: "The Business Architect's FRAME™",
                      summary: "The five-question discipline that decides whether an idea deserves to become a business.",
                    },
                    {
                      href: "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
                      title: "How Do I Know If My Business Idea Is Actually Viable?",
                      summary: "Customer, demand, willingness to pay, reachability and economics, tested with evidence.",
                    },
                    {
                      href: "/thinking/an-app-is-not-a-business",
                      title: "An App Is Not a Business",
                      summary: "Why the product is only one part of the business around it.",
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
                Let's find out who it's really for.
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
