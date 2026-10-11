/**
 * Single source of truth for the visible copy of this Answer. The page renders it and the layout derives its
 * structured data from the same strings. Inline markup: **bold**, *italic*, [text](href). Blank line = new paragraph.
 */

export const STANDFIRST =
  "You know the restaurant industry. You believe you can help restaurant owners improve their businesses. But how do you turn that knowledge into a consulting practice people will actually pay for?";

export const DIRECT_ANSWER =
  "The short answer: Start by identifying exactly which restaurants you want to serve, what problems they have, and why they would pay you to solve them. Then validate whether enough of those customers exist, whether they can afford your services, and how you'll reach them. Only then should you start designing your consulting offers and building the business around them.";

export const INTRO = `Someone recently submitted a question through the *Pick My Brain* section of my website:

"I'm trying to build a business doing consulting for restaurants."

Interesting. And a good starting point.

But if we were sitting together having a coffee, my first reaction would probably be to ask a few more questions.

Consulting for restaurants?

Doing what, exactly?

And for whom?

Because there's quite a difference between knowing something about the restaurant industry and having a viable restaurant consulting business.

Let's explore that.`;

export type Section = { heading: string; body: string };

export const SECTIONS: Section[] = [
  {
    heading: "First, restaurants are an industry. Not your customer.",
    body: `When I work with people who want to start a consulting business, there are two questions I almost always bring them back to.

**What problem are you solving? And for whom?**

Everything else starts there.

You see, saying you want to consult for restaurants is a little like saying you want to sell something to people who own cars.

Fine. But what are you selling, and to whom?

A McDonald's franchise operator, a Michelin-starred restaurant, and Roger's Burger Shack somewhere in Michigan all operate in the restaurant industry.

But that's pretty much where the similarities end.

They have different business models, customers, operating structures, financial resources, and problems.

The McDonald's franchise operator may be concerned with operational efficiency, franchise standards, labor costs, and profitability across several locations.

A Michelin-starred restaurant may be focused on service excellence, reputation, culinary positioning, or maintaining the standards that justify its premium prices.

Roger, meanwhile, might simply be wondering why his restaurant is busy every Friday night but barely covers its expenses at the end of the month.

Three restaurants. Three completely different consulting conversations.

And probably three very different consulting businesses.

You cannot realistically approach all three with the same message, the same offer, and the same expectations.

So before doing anything else, I would encourage you to narrow your focus.

Are you targeting independent restaurants? Family-owned businesses? Restaurant groups? Franchise operators? Fine dining? Quick-service restaurants? New restaurants preparing to open?

And where are these businesses located?

The more clearly you define your potential customers, the easier it becomes to understand their problems, communicate with them, and eventually design something they're willing to buy.

That doesn't mean you can never serve other types of restaurants.

It simply means you need somewhere sensible to start.`,
  },
  {
    heading: "What problem are you actually solving?",
    body: `Now that we have a clearer picture of whom you want to serve, let's talk about why they would need you.

This is where I see many aspiring consultants struggle.

They describe what they know rather than the problem they solve.

"I have twenty years of restaurant experience."

"I understand restaurant operations."

"I help restaurants grow."

That's all very nice.

But none of those statements necessarily gives a restaurant owner a compelling reason to open their wallet.

Let's take the last one.

"I help restaurants grow."

Grow what? Revenue? Profit? Number of locations? Customer traffic? Average order value?

And how?

Through marketing? Menu engineering? Cost management? Operational improvements? New sales channels? Expansion planning?

Now compare that vague statement with something more specific.

**"I help independent, family-owned restaurants increase revenue by developing new sales channels beyond their dining rooms."**

We're getting somewhere.

We have a more identifiable customer, a recognizable business objective, and a clearer idea of how the consultant intends to create value.

Or perhaps your expertise is operational.

"I help independent restaurant owners improve profitability by identifying food-cost leakage, reducing waste, and improving purchasing practices."

That's another possible direction.

Neither statement automatically makes a viable business.

But at least now we have something we can investigate.

And that's important, because your consulting business should not be built around what you happen to enjoy advising people about.

It should be built around problems your target customers actually have, consider important, and are willing to pay someone to solve.`,
  },
  {
    heading: "Why you?",
    body: `Here's another question I would ask before we go much further.

Why should anyone hire you?

I don't mean that sarcastically.

I mean it quite literally.

What makes you the right person to solve this particular problem?

Perhaps you've spent fifteen years managing restaurant operations. Maybe you've opened several successful locations. Perhaps you've helped a restaurant group improve its margins or developed a particularly effective approach to attracting customers.

Excellent.

Those experiences may give you credibility.

But you still need to connect that credibility to the problem your prospective customer wants solved.

If you're offering to improve restaurant profitability, can you demonstrate that you understand the economics?

If you're advising owners on expansion, have you successfully navigated the operational and financial challenges of opening additional locations?

If you're helping restaurants attract customers, can you explain your approach and provide evidence that it works?

You don't necessarily need to have worked for a famous brand or managed a hundred restaurants.

But you do need a credible reason for someone to trust your judgment.

And here's something worth remembering.

**Being knowledgeable about a subject doesn't automatically make you a consultant people will pay.**

A consulting business exists when someone sees enough value in your expertise to exchange money for your help.

Which brings us to the next question.`,
  },
  {
    heading: "Is there actually a viable market for your consulting services?",
    body: `This is where [Business Architecture](/answers/what-is-business-architecture) comes into play.

Because starting a consulting practice is still starting a business.

You have customers, a value proposition, operating costs, delivery requirements, revenue expectations, and a business model that needs to make economic sense.

The fact that you're selling knowledge instead of physical products doesn't eliminate any of those considerations.

Let's say you've decided to help independent restaurants improve profitability.

Sounds promising.

But how many restaurants in your target market actually have the problems you're equipped to solve?

Where are they located?

Can you reach them?

Can you serve them remotely, or will you need to visit their premises?

And perhaps most importantly, can they afford you?

This last question matters more than many aspiring consultants realize.

A large corporate restaurant group may have substantial consulting budgets, but that doesn't mean it will hire an independent consultant. It may already have internal specialists, established suppliers, or preferred consulting firms.

At the other end of the market, a struggling mom-and-pop restaurant may desperately need your expertise.

But needing your help and being able to pay for it are two different things.

Roger might genuinely benefit from a consultant who could improve his restaurant's profitability.

Unfortunately, if he's barely making payroll, convincing him to spend several thousand dollars on consulting may be a rather difficult conversation.

So the real market isn't simply the number of restaurants that exist.

**It's the number of restaurants that have a problem you can solve, recognize the value of solving it, can afford your services, and are realistically accessible to you.**

That's a much smaller and more useful number.

Before investing too much time or money into building your consulting practice, I would investigate that market.

Talk to restaurant owners. Understand their challenges. Learn how they currently deal with those problems. Find out whether they've hired consultants before, what they paid, and what results they expected.

Don't assume that because a problem exists, there's automatically a market willing to pay you to solve it.

You need evidence.`,
  },
  {
    heading: "Now let's architect your consulting offer.",
    body: `Once you've identified a target customer, a meaningful problem, and a potentially viable market, we can start designing what you're actually going to sell.

And no, "restaurant consulting services" isn't quite enough.

What does the customer receive when they hire you?

Are you offering an hourly consultation? A one-time operational assessment? A structured improvement program? A fixed-price project? An ongoing advisory relationship?

Or perhaps a customized engagement built around a specific business challenge?

There isn't one universally correct model.

But there are important differences.

Selling your time by the hour may be relatively straightforward, especially when you're starting. The customer pays for access to your knowledge and experience.

A fixed-scope diagnostic could be more tangible. You examine a restaurant's operations, identify specific problems, and provide recommendations.

A structured consulting package might take the customer through a defined process, from assessment to implementation.

An ongoing advisory arrangement could make sense for restaurant owners who need continuous support.

And an outcome-based arrangement might be appropriate in some circumstances, provided the results can be measured and the responsibilities are clearly understood.

Each approach affects your pricing, delivery, capacity, and potential profitability.

But I would encourage you to think beyond the number of hours you're going to spend with a client.

**What transformation are you actually selling?**

Perhaps a restaurant owner comes to you because food costs are getting out of control.

Your offer isn't simply ten hours of consulting.

It's a structured process to understand where money is being lost, identify corrective actions, and help the owner implement improvements.

The value isn't the ten hours.

It's what those ten hours could help the restaurant achieve.

Of course, you should be careful about promising results you cannot control.

But you should be able to explain what changes your customer can reasonably expect from working with you, how you'll help create those changes, and what the engagement includes.

That's how a vague consulting service starts becoming a recognizable commercial offer.`,
  },
  {
    heading: "Architect the customer journey, not just the service.",
    body: `Here's another area that deserves attention.

What actually happens when someone decides to work with you?

Imagine Roger contacts you because his restaurant is generating decent sales but not enough profit.

What happens next?

Do you have an initial conversation? Do you review financial information? Visit the restaurant? Conduct an assessment? Present a proposal?

Once the engagement begins, what are the stages?

What information do you need? What work will you perform? What will the customer be responsible for? How will progress be measured?

And when the project ends, what does success look like?

This is what I mean by architecting the customer journey.

You're not simply designing a consulting package. You're designing the experience of working with your business, from the first conversation to the final outcome.

That matters for two reasons.

First, it gives prospective customers confidence. They understand what they're buying and what to expect.

Second, it makes your business easier to operate.

If every engagement is improvised from scratch, you're going to spend an enormous amount of time figuring out how to deliver the work.

That might be manageable with your first client.

It becomes considerably less attractive when you're trying to serve five or ten.

A clear delivery process doesn't mean every customer receives the same solution.

It means you have a structured way of diagnosing problems, developing recommendations, implementing improvements, and evaluating results.

The solution can still be tailored to the client.

The business behind it shouldn't have to reinvent itself every Monday morning.`,
  },
  {
    heading: "And now comes the big one: How are you going to get customers?",
    body: `This is probably one of the most important questions for anyone starting a consulting business.

And, surprisingly, one of the questions people often leave until last.

They spend weeks designing a website, choosing a logo, preparing presentations, and deciding what to charge.

Then everything is ready.

Wonderful.

Now what?

Where are the customers?

**You can be the most knowledgeable restaurant consultant in the world, but if nobody knows you exist, you don't have much of a consulting business.**

This is your go-to-market strategy.

And it needs to be architected just as carefully as your consulting offer.

How will potential customers discover you?

How will they recognize that you understand their problems?

What will convince them to trust you?

And how will that interest turn into a paying engagement?

For some consultants, the answer may involve building relationships with restaurant owners, industry associations, accountants, suppliers, or other professionals who already serve their target market.

For others, it might involve educational content, workshops, speaking engagements, referrals, or demonstrating expertise through practical case studies.

Perhaps your target customers are highly active on LinkedIn.

Perhaps they're not.

Maybe they attend local restaurant association meetings. Maybe they rely heavily on recommendations from suppliers and fellow operators.

You need to understand how your particular customers find help and make purchasing decisions.

There's no point spending six months becoming a LinkedIn celebrity if the restaurant owners you're targeting aren't looking for consultants there.

And there's another distinction.

Visibility is not the same as customer acquisition.

Having followers, receiving compliments, or generating website traffic doesn't necessarily mean people are willing to hire you.

You need a practical path from being discovered to having a conversation, establishing trust, presenting an offer, and securing a customer.

And the economics need to work.

If it costs you more time and money to acquire a client than you can reasonably earn from the engagement, you have another problem to solve.

Your go-to-market strategy isn't something you add after building the business.

It's part of the business architecture itself.`,
  },
  {
    heading: "How I would approach building this consulting business.",
    body: `When I work with entrepreneurs developing a new business, I use a methodology called the [Business Architect's FRAME](/thinking/the-business-architects-frame).

It follows five stages:

**Find → Reality Check → Architect → Make It Exist → Evolve.**

And it applies just as much to a consulting practice as it does to a startup developing software or a company launching a physical product.

In your situation, I would approach it like this.

**Find:** Identify the type of restaurant you want to serve, the problems you're equipped to solve, and the value you believe you can create.

**Reality Check:** Investigate whether those problems are real, sufficiently important, and commercially attractive. Talk to potential customers. Test your assumptions about demand, affordability, competition, and your ability to reach the market.

**Architect:** Design your positioning, consulting offers, pricing, customer journey, delivery model, and go-to-market strategy. Make sure the pieces work together economically and operationally.

**Make It Exist:** Start engaging real prospects, selling your services, delivering projects, and gathering evidence of the results you can create.

**Evolve:** Learn from the market. Refine your offers, improve your processes, strengthen your positioning, and adjust your business model as you discover what works.

Notice something?

We haven't started by building a website.

We haven't spent three weeks debating whether your company should be called Restaurant Growth Partners or Culinary Performance Advisors.

And we certainly haven't ordered five hundred business cards.

Those things may have their place eventually.

But first, we need to establish whether there's a business worth building.`,
  },
  {
    heading: "My advice: Stop trying to sell consulting. Start solving a specific problem.",
    body: `If you came to me and said, "Martin, I want to start a business consulting for restaurants," I wouldn't discourage you.

There may be a perfectly good business opportunity there.

But I wouldn't tell you to rush out and start selling restaurant consulting either.

I would encourage you to get specific.

Find a group of restaurant owners whose businesses you understand.

Identify a problem that matters to them.

Determine whether you have the expertise and credibility to help solve it.

Find out how many potential customers have that problem, whether they can afford your help, and whether you can reach them economically.

Then build an offer around the value you can deliver.

And finally, architect a practical way to attract, convert, and serve those customers.

You may discover that your original idea is excellent.

You may also discover that the restaurant segment you initially wanted to serve isn't commercially attractive, that your offer needs to change, or that a different type of customer would be a much better fit.

That's precisely why we do this work before committing too many resources.

Because the objective isn't to become someone who calls themselves a restaurant consultant.

**The objective is to build a consulting business with real customers, a clear value proposition, and a model that can sustain itself.**

There's a difference.

And it's a rather important one.`,
  },
];

export const CTA_HEADING = "Thinking about starting your own consulting business?";
export const CTA_BODY = `Before investing too much time and money, you can start by taking my free [Business Idea Reality Check](/resources/business-idea-reality-check).

And if you have expertise you want to turn into a viable consulting business, but could use someone on your side to challenge your thinking, structure your offer, and architect the business around it, [let's talk](/lets-talk).`;
