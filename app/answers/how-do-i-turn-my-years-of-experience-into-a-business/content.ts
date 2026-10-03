/**
 * Single source of truth for the visible copy of this Answer. The page renders
 * it and the layout derives FAQ structured data from the same strings, so the
 * schema can never drift from what a visitor reads.
 *
 * Inline markup: **bold**, *italic*, [text](href). Blank line = new paragraph.
 * Block markup: lines starting "- " form a bulleted list, "1. " a numbered
 * list, and "> " a quotation.
 */

export const DIRECT_ANSWER =
  "You turn your experience into a business by using it to solve a specific, valuable problem for a specific customer, then designing an offer, delivery model and way to reach that customer.";

export const INTRO = `You do not sell your years of experience.

You sell what those years enable you to see, solve or improve.

Your experience is an asset. It is not yet a business.

The work of turning one into the other is [business architecture](/answers/what-is-business-architecture).`;

export type Section = {
  heading: string;
  body: string;
};

export const SECTIONS: Section[] = [
  {
    heading: "Start with the problem, not your résumé",
    body: `Inside a company, your experience has context. People know your role, responsibilities and reputation. They know when to involve you.

Outside that environment, the context disappears. A potential customer is not trying to understand everything you have done. They are asking a much simpler question:

**Can this person solve a problem that matters enough for me to pay them?**

That is why a list of skills rarely becomes a compelling offer:

- leadership;
- strategy;
- operations;
- transformation;
- negotiation;
- change management.

These may all be real strengths, but customers do not normally buy them in isolation. They buy help because growth has stalled, margins are shrinking, a transformation is failing, teams cannot make decisions or an important project is consuming money without producing results.

To find the business hidden inside your experience, ask:

1. What problems did people repeatedly bring to me?
2. Which of those problems could I solve unusually well?
3. Where did my judgment save time, money or risk?
4. Who still experiences those problems today?
5. Which problems are important enough for someone to pay to solve?

The goal is not to catalog everything you know. It is to identify where your experience creates commercial value.`,
  },
  {
    heading: "Translate experience into an outcome",
    body: `Corporate language often describes activity rather than value.

"I led a cross-functional transformation program" tells people what you did. It does not tell them what became better because you did it.

Did you help the company enter a market faster? Recover a stalled project? Avoid a poor technology investment? Reduce operating costs? Improve the handover between sales and delivery?

A useful translation looks like this:

**Experience → problem → customer → outcome**

For example:

> I have years of supply-chain experience.

Could become:

> I help growing manufacturers reduce excess inventory without damaging customer service.

The second statement gives a potential buyer something to recognize. It identifies a customer, a problem and a result.

That is the beginning of an offer.`,
  },
  {
    heading: "Design the business around the offer",
    body: `Once the problem is clear, you need to decide how the business should work.

Your experience could become consulting, fractional leadership, a productized service, a diagnostic, training, coaching, a licensed method or a technology-enabled service.

The right model depends on how customers prefer to buy, how much trust the sale requires, how repeatable the work is and what kind of business you want to own.

A useful first offer should answer five questions:

1. **Who is it for?**
2. **What problem does it solve?**
3. **What outcome does it create?**
4. **How will you deliver that outcome?**
5. **Why is the outcome worth more than the price?**

Compare:

> I provide strategic and transformation consulting based on extensive international experience.

With:

> I help mid-sized companies diagnose why strategic transformation programs have stalled and build a practical recovery plan before more money is committed.

The second is easier to understand because the architecture is visible. The customer can recognize the situation, understand the result and decide whether a conversation is relevant.`,
  },
  {
    heading: "Test the business before polishing it",
    body: `Do not begin with a logo, a company name or a large website.

Begin with the assumptions on which the business depends.

Speak with people who resemble the intended customer. Ask how they handle the problem today, what happens if it remains unresolved, what they have already tried, who owns the decision and whether money is already being spent on it.

Then look for behavior rather than encouragement.

Will someone introduce you to the decision-maker? Share information about the problem? Review a proposed diagnostic? Agree to a paid pilot?

Compliments are pleasant. Commitment is evidence.

This matters because your former salary was attached to a role inside an existing system. Your new business must find customers, communicate value, deliver an outcome and capture enough of that value to survive.

You are not starting from zero. You are starting with valuable raw material—but it still needs architecture.`,
  },
  {
    heading: "What should you do first?",
    body: `Write down five expensive, frustrating or risky problems you understand unusually well because of your experience.

For each one, identify:

- the person who feels the problem;
- the organization that would pay to solve it;
- the consequence of doing nothing;
- the outcome you could help create;
- the evidence that the problem matters.

Choose the strongest candidate and shape a simple offer around it. Then test it in real conversations before building the wider business.

The question is not, "How do I monetize everything I know?"

It is:

**What valuable problem am I unusually equipped to solve—and what business should I architect around it?**`,
  },
];

export type Faq = { question: string; answer: string };

export const FAQ_HEADING = "Frequently asked questions";

export const FAQS: Faq[] = [
  {
    question: "Do I have to become a consultant?",
    answer:
      "No. Consulting may be the quickest model to test, but your expertise could also become a productized service, fractional role, diagnostic, training offer, licensed methodology or technology-enabled service. Choose the model that fits the customer, the outcome and the business you want to build.",
  },
  {
    question: "How do I know whether people will pay?",
    answer:
      "You cannot know through reflection alone. Look for existing spending and real commitments: access to decision-makers, a paid diagnostic, a pilot or an initial engagement. Interest in your story is not the same as willingness to pay for an outcome.",
  },
];

export const CLOSING = `If you have substantial experience but cannot yet see the business inside it, that does not mean there is nothing there.

It means the raw material still needs architecture.`;

/** Strips the inline markup so schema text matches what a visitor reads. */
export function toPlainText(markup: string): string {
  return markup
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
