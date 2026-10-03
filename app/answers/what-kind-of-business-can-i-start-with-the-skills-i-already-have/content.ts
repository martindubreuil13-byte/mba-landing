/**
 * Single source of truth for the visible copy of this Answer. The page renders
 * it and the layout derives its structured data from the same strings, so the
 * schema can never drift from what a visitor reads.
 *
 * Inline markup: **bold**, *italic*, [text](href). Blank line = new paragraph;
 * a single newline inside a paragraph is a line break.
 * Block markup: lines starting "- " form a bulleted list, "### " a sub-heading.
 */

export const DIRECT_ANSWER =
  "You can start a business that uses your existing skills to solve a specific problem for a specific group of people.";

export const INTRO = `That business might begin as a service, advisory offer, productized service, workshop, training program, digital product, or tool. But the format is not the first decision.

The first decision is this:

**Whose problem can you solve—and what valuable result can you help them achieve?**

Your skills are the raw material. They are not yet the business.`;

export type Section = {
  heading: string;
  body: string;
};

export const SECTIONS: Section[] = [
  {
    heading: "Start with problems, not business ideas",
    body: `When people ask what kind of business they can start, they often begin with business models:

Should I become a consultant?
Should I create a course?
Should I start an agency?
Should I build an app?

Those questions come too early.

A business does not begin with a format. It begins when something you know how to do becomes useful enough that someone is willing to pay for the result.

Suppose you are good at project management. You could use that skill to:

- Help small companies deliver complex projects
- Set up operating systems for growing teams
- Manage product launches
- Train first-time managers
- Create project templates and playbooks
- Build software for a recurring project problem

The skill is the same. The businesses are different because the customer, problem, outcome, delivery method, and economics are different.`,
  },
  {
    heading: "Look for evidence in what you already do",
    body: `You do not need to invent your value from nothing. There are probably clues throughout your working life.

Ask yourself:

- What do people regularly ask me for help with?
- What problems feel straightforward to me but difficult to other people?
- What have I learned through experience that would help someone avoid expensive mistakes?
- What can I diagnose faster than most people?
- What have I repeatedly improved, fixed, built, or simplified?
- What results have I helped create?
- Which problems do I understand from the inside?

Do not only list formal qualifications.

Being able to negotiate, organize uncertainty, calm a difficult client, simplify a technical subject, recognize a bad decision early, or move a project through a complicated organization may be commercially valuable—even if it never appeared in your job title.

Often, your most valuable skills are the ones you no longer notice because they have become natural to you.`,
  },
  {
    heading: "Translate the skill into a result",
    body: `People rarely buy a skill in isolation.

They buy progress.

They may pay to increase revenue, reduce costs, save time, lower risk, make a decision, build confidence, develop a capability, or get through a difficult transition.

"I am good at strategy" is not yet an offer.

"I help independent experts turn what they know into a focused business offer" is much closer.

"I understand retail operations" is experience.

"I help growing retailers fix the operational gaps between online sales, inventory, and fulfillment" describes a problem and a result.

A useful way to frame the opportunity is:

**I help [a specific type of person] solve [a specific problem] so they can achieve [a valuable result].**

You do not need perfect wording at the beginning. But if you cannot identify the person, problem, and result, you probably do not have a business yet.`,
  },
  {
    heading: "Choose the simplest way to deliver the result",
    body: `Once you understand the problem, you can decide what kind of business to build.

### A service

You do the work for the customer.

This is often the fastest place to begin because it requires little infrastructure and gives you direct exposure to real customer problems.

Examples include consulting, design, writing, implementation, research, recruitment, financial support, project delivery, or specialist freelance work.

### An advisory offer

You help the customer make better decisions while they remain responsible for execution.

This can work when your judgment, pattern recognition, or experience is more valuable than your ability to complete the work yourself.

### A productized service

You solve a defined problem through a repeatable process, with a clearer scope, timeline, and price.

Instead of offering general marketing support, for example, you might provide a two-week positioning sprint for professional-services firms.

Productizing a service can make it easier to explain, sell, deliver, and eventually delegate.

### Training or education

You teach people how to produce the result themselves.

This could take the form of workshops, cohort programs, internal company training, courses, or practical guides.

Education works best when the customer wants to build a capability—not simply consume information.

### A product or tool

You turn part of your knowledge into something people can use without your direct involvement.

That might be a template, assessment, diagnostic, methodology, dataset, digital product, or piece of software.

This can create scale, but it normally requires clearer evidence of a recurring problem. Building the product before learning what customers actually need is an expensive way to discover that the idea was wrong.

These are not necessarily separate paths. A business might begin with a service, become a productized service, develop training, and later produce tools or software.

The sequence matters.`,
  },
  {
    heading: "Do not try to monetize everything you know",
    body: `If you have [substantial experience](/answers/how-do-i-turn-my-years-of-experience-into-a-business), your problem may not be a shortage of possibilities. It may be that you can see too many.

You might be able to advise different customers, solve several problems, and deliver the work in multiple ways.

Trying to include all of it usually produces a vague business:

"I help people and organizations unlock their potential through strategy, innovation, transformation, and leadership."

It sounds broad because it is broad. A potential customer cannot easily tell whether it is meant for them, what problem it solves, or why they should act now.

Choosing one entry point does not erase the rest of your experience.

It makes your value easier to recognize.

You can use everything you know behind the scenes while presenting the market with one clear reason to begin a conversation.`,
  },
  {
    heading: "Test the problem before building the business around it",
    body: `You do not need a website, logo, course, or complete product to test whether your skills can become a business.

Start with conversations.

Find people who appear to have the problem you want to solve. Ask how they handle it now, what makes it difficult, what happens when it remains unresolved, and whether they have paid for help before.

Then try to solve the problem for a small number of customers.

You are looking for evidence:

- Do people recognize the problem?
- Is it important enough to act on?
- Can you reach the people who have it?
- Do they trust you to help?
- Can you produce a meaningful result?
- Will they pay enough for the business to work?
- Can the result be delivered repeatedly?

Interest is encouraging. Payment and outcomes are stronger evidence.`,
  },
  {
    heading: "Architect the business, not just the offer",
    body: `A valuable skill and an attractive offer are not enough on their own.

The business also needs a way to attract customers, earn trust, deliver consistently, cover its costs, and create enough value for both the customer and the owner.

That is where [Business Architecture](/answers/what-is-business-architecture) becomes useful.

You are designing a connected system:

- **Customer:** Who are you serving?
- **Problem:** What matters enough for them to address?
- **Outcome:** What changes after working with you?
- **Offer:** What exactly are they buying?
- **Delivery:** How will you produce the result?
- **Acquisition:** How will the right people discover and trust you?
- **Economics:** Can you charge enough to make the business sustainable?
- **Capabilities:** What must you do well—and what is currently missing?

A weakness in one part affects the whole business.

You may have a strong offer but no reliable way to find customers. You may attract interest but choose a delivery model that consumes too much time. You may solve a real problem for customers who cannot afford the solution.

The question is not simply, "What business fits my skills?"

It is:

**What business can be architected around the value my skills create?**`,
  },
  {
    heading: "Start narrower than feels comfortable",
    body: `Choose one type of customer, one meaningful problem, and one result you believe you can help produce.

Then select the simplest offer that allows you to test those assumptions with real people.

Do not wait until you have converted everything you know into a perfect business model. Your first offer is an entry point, not a permanent definition of your future.

The best business you can start with your existing skills is not necessarily the most impressive idea.

It is the clearest valuable problem you can solve, for people you can reach, through a model you can deliver sustainably.

Your skills give you somewhere to begin.

Business Architecture turns them into a business.`,
  },
];

export const CTA_HEADING =
  "You already have skills. The next step is deciding what valuable problem—and what viable business—to architect around them.";
