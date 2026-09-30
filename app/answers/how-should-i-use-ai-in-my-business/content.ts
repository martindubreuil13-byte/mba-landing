/**
 * Single source of truth for the visible copy of this Answer. The page renders
 * it and the layout derives FAQ structured data from the same strings, so the
 * schema can never drift from what a visitor reads.
 *
 * Inline markup: **bold**, *italic*, [text](href). Blank line = new paragraph.
 */

export const DIRECT_ANSWER =
  "The best way to use AI in your business is not to start with AI tools. Start by understanding how your business creates and delivers value, then identify where intelligence can improve the outcome. Decide whether that intelligence should be human, artificial, or a combination of both. Only then should you choose the technology.";

export const INTRO = `I call this **Architecting Intelligence**.

It is a Business Architecture approach to artificial intelligence: instead of plugging AI into existing processes simply because something can be automated, you deliberately design where human intelligence and artificial intelligence belong across the business.

That distinction matters.

AI is becoming easier to access. Almost every business can use the same large language models, AI agents, automation platforms and increasingly intelligent software.

Simply having AI is therefore becoming less interesting.

**How you architect intelligence into the business is where things get interesting.**`;

export type Section = {
  heading: string;
  body: string;
  /** Included in FAQPage structured data (the heading is a real question). */
  faq: boolean;
};

export const SECTIONS: Section[] = [
  {
    heading: "Should I use AI in my business?",
    faq: true,
    body: `In most businesses today, the answer is worth exploring seriously.

Artificial intelligence can already help businesses research, analyze information, recognize patterns, generate content, classify data, monitor activity, automate repetitive work, support decisions, personalize experiences and communicate with customers.

But that doesn't mean every business process should use AI.

And it certainly doesn't mean everything should be automated.

The wrong question is:

**Where can we put AI?**

A better question is:

**Where would intelligence improve the way this business creates value?**

Sometimes the answer will be AI.

Sometimes it will be a human.

Quite often, it will be both.`,
  },
  {
    heading: "Why shouldn't I start with AI tools?",
    faq: true,
    body: `Because starting with the tool reverses the logic.

A company discovers an AI platform and asks:

“What can we automate with this?”

Now the technology is driving the design of the business.

That's backwards.

If a process is unnecessary, badly designed or creates a poor customer experience, adding artificial intelligence doesn't solve the underlying problem.

You may simply automate a bad process.

Congratulations. It is now bad much faster.

This is one reason I believe **[Business Architecture](/answers/what-is-business-architecture) becomes more important as AI becomes more capable**, not less.

Before deciding what AI should do, you need to understand what the business itself should do.`,
  },
  {
    heading: "How do I identify where AI belongs in my business?",
    faq: true,
    body: `Start with value.

Take a piece of paper and map how value actually travels through your business.

Don't think about AI yet.

Look first at what happens **before value is delivered**.

Depending on the business, that could include research, procurement, planning, scheduling, inventory, preparation, production or coordination.

Then map the **delivery of value**.

How does a customer discover the business?

How do they evaluate the offer?

How do they buy?

What happens after they say yes?

How are they onboarded?

How is the product or service delivered?

Where do people, technology, suppliers, partners and systems interact?

Then look at what happens **after delivery**.

Support.

Follow-up.

Feedback.

Retention.

Repeat purchases.

Referrals.

Re-engagement.

Customer relationships do not magically disappear because an invoice was paid.

Now you have something far more useful than a list of AI tools.

You have a basic architecture of how your business creates and delivers value.`,
  },
  {
    heading: "What does “Architecting Intelligence” mean?",
    faq: true,
    body: `**Architecting Intelligence means deliberately deciding where intelligence is required within a business, what kind of intelligence is appropriate, and how human and artificial intelligence should work together to create value.**

It starts with the business rather than the technology.

Once the value journey is visible, go through it again and ask:

**Where does intelligence materially improve the outcome?**

Perhaps you need to recognize patterns across thousands of transactions.

Perhaps you need to predict demand.

Perhaps somebody needs immediate access to information scattered across different systems.

Perhaps a customer needs a fast answer at 2 a.m.

Perhaps a decision requires judgment.

Perhaps a difficult conversation requires empathy.

Perhaps a negotiation requires context that cannot be reduced to a prompt.

Perhaps somebody simply needs to look at an unusual situation and say:

“Something isn't right here.”

These are intelligence questions before they are technology questions.

That is the difference.`,
  },
  {
    heading: "What is human intelligence better at in business?",
    faq: true,
    body: `Humans remain particularly valuable where the work depends heavily on judgment, empathy, accountability, negotiation, relationships, contextual understanding, trust and wisdom.

Not every customer interaction should become a chatbot.

Not every decision should become an algorithm.

And not every piece of human work that *can* technically be automated should be.

The objective of AI in business should not be to remove humans wherever possible.

The objective should be to design a better business.

Sometimes removing human work helps achieve that.

Sometimes adding better human interaction does.`,
  },
  {
    heading: "What is artificial intelligence better at in business?",
    faq: true,
    body: `Artificial intelligence can be particularly powerful where a business needs speed, scale, computation, memory, classification, monitoring, synthesis, pattern recognition or consistent repetition.

AI can process quantities of information that would be impractical for a person to review manually.

It can continuously monitor activity.

It can prepare information before a decision.

It can detect patterns.

It can handle repetitive interactions.

It can make organizational knowledge easier to access.

And increasingly, AI agents can perform sequences of actions rather than simply generate an answer.

But capability alone is not a reason to deploy it.

The question remains:

**Does using AI here improve the architecture of the business and the value delivered to the customer?**`,
  },
  {
    heading: "Should humans and AI work together?",
    faq: true,
    body: `Very often, yes.

Some of the most useful applications of AI in business will not be “human versus AI.”

They will be combinations of both.

**AI prepares. A human decides.**

**AI detects. A human interprets.**

**AI remembers. A human understands why it matters.**

**AI handles repetition. A human handles exceptions.**

**AI provides information. A human takes accountability.**

**AI supports the interaction. A human builds the relationship.**

This is why I prefer talking about **Architecting Intelligence** rather than simply AI automation.

Automation asks what work technology can perform.

Architecting Intelligence asks **what combination of intelligence creates the best business outcome.**

Those are not the same question.`,
  },
  {
    heading: "What should I automate with AI?",
    faq: true,
    body: `Automate something because automation improves the business, not because automation is possible.

Good candidates often include repetitive, high-volume, rules-based or information-heavy work where the consequences of an error can be appropriately controlled.

But before automating any business process, ask:

**Should this process exist in its current form at all?**

You may discover that it should be simplified, redesigned, combined with another process or eliminated entirely.

Only after that should you decide whether AI automation belongs there.

Otherwise you risk spending money to make an unnecessary process more efficient.

Businesses have been doing that with technology for decades.

AI simply gives us the opportunity to do it much faster.`,
  },
  {
    heading: "Are AI agents the future of business?",
    faq: true,
    body: `AI agents are likely to become an increasingly important part of how businesses operate because they can do more than generate text or analyze information. They can be designed to perform actions, interact with systems and participate in workflows.

But an AI agent is still a component of a business.

It is not the business architecture.

Giving five AI agents access to a badly designed workflow doesn't suddenly create a well-designed company.

Before introducing agents, determine what outcome is required, what process should produce it, what decisions exist inside that process, what information is required, where accountability sits and what should happen when something goes wrong.

Then determine whether an AI agent is the appropriate way to perform part of that architecture.

The agent comes after the thinking.`,
  },
  {
    heading: "Can AI still create a competitive advantage?",
    faq: true,
    body: `Yes, but increasingly the advantage is unlikely to come simply from **having access to AI**.

Your competitors can access many of the same models and tools.

The differentiation can come from how those capabilities are applied.

Your processes.

Your proprietary knowledge.

Your customer understanding.

Your data.

Your decisions.

Your speed of learning.

Your customer experience.

And, increasingly, **how effectively human and artificial intelligence are architected together.**

AI can absolutely contribute to competitive advantage.

But AI itself is not the architecture.`,
  },
  {
    heading: "What is an AI-first business?",
    faq: true,
    body: `I would be careful with the phrase.

“AI-first” can easily become another way of saying “technology first.”

I prefer **intelligence-first**.

An intelligence-first business asks what intelligence is required to create the desired outcome and then determines the best source of that intelligence.

Human.

Artificial.

Or both.

That allows AI to play a major role without forcing every business problem through an AI-shaped hole.

The goal isn't to build the company with the most AI.

The goal is to build the better company.`,
  },
  {
    heading: "A simple framework for using AI in business",
    faq: false,
    body: `When deciding how to use artificial intelligence in a business, I would work in this order:

**Value → Process → Intelligence → Responsibility → Technology**

**Value:** What outcome are we creating for the customer?

**Process:** How should the business create and deliver that value?

**Intelligence:** Where is intelligence required to improve the outcome?

**Responsibility:** Should that intelligence or decision belong to a human, AI, or both? Who remains accountable?

**Technology:** What AI model, agent, automation or other technology best supports that architecture?

Notice where the AI tool appears.

Last.

That's deliberate.

Tools will change.

Models will improve.

Today's impressive AI product may be a standard feature inside another piece of software next year.

A business should not need to reinvent its architecture every time the technology changes.`,
  },
  {
    heading: "So, how should you use AI in your business?",
    faq: true,
    body: `Don't begin by asking which AI tools your business should use.

Begin by understanding how your business creates value.

Map what happens before, during and after that value reaches the customer.

Identify where intelligence can materially improve the outcome.

Then decide whether that intelligence should be human, artificial, or both.

Only after that should you select the AI, automation or technology required to make it happen.

**That is Architecting Intelligence.**

And I believe it is becoming part of what modern Business Architecture needs to do.

Artificial intelligence gives businesses extraordinary new capabilities.

The job of the [Business Architect](/answers/what-does-a-business-architect-do) is not to put AI everywhere.

It is to determine **where intelligence belongs, how the pieces work together, and how that architecture creates a better business.**`,
  },
];

/** Plain-text form of a marked-up string (for structured data). */
export function toPlainText(markup: string): string {
  return markup
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "");
}
