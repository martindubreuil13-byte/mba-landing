/**
 * Copy and data for /business-rearchitecture. One file so the visible page, the FAQ structured data and the tests all read the same strings.
 *
 * Rules this content follows (from the brief): no invented testimonials, results, prices, durations or contractual promises; every
 * example is labelled illustrative; every internal link points at a page that exists in this repository (checked by content.test.ts).
 */

export const PAGE_PATH = "/business-rearchitecture";
export const PAGE_NAME = "Business Re-Architecture";

export const HERO_HEADLINE = "AI is changing business. What could it do for yours?";

export const OUTCOMES = [
  { id: "profit", title: "Improve profitability", body: "Find opportunities to increase value and strengthen margins." },
  { id: "time", title: "Save time", body: "Reduce unnecessary work, delays, and manual coordination." },
  { id: "cost", title: "Reduce costs", body: "Identify waste, inefficiencies, and avoidable expenses." },
  { id: "compete", title: "Compete smarter", body: "Improve customer experience, responsiveness, and business capabilities." },
] as const;

// ---------------------------------------------------------------------------------------------------------------------------------
// Opportunity Explorer
// ---------------------------------------------------------------------------------------------------------------------------------

export type FunctionId = "sales" | "production" | "inventory" | "logistics" | "finance" | "people";

export type BusinessFunction = {
  id: FunctionId;
  /** Full label, used on the tab and as the panel heading. */
  label: string;
  /** Short label for the diagram. */
  short: string;
  today: string;
  change: string;
  benefit: string;
  /** What else this function touches, and why. Drives the diagram's highlighted links and the "Connected to" list. */
  ripples: { to: FunctionId; note: string }[];
};

export const FUNCTIONS: readonly BusinessFunction[] = [
  {
    id: "sales",
    label: "Sales & Customer Experience",
    short: "Sales",
    today:
      "Quotes take days because prices, stock levels and lead times live in different spreadsheets and in people’s heads. Customers chase for updates, and your sales team chases colleagues.",
    change:
      "One shared view of price, stock and lead time lets your team answer in the same conversation. Routine enquiries and order-status questions can be handled by simple automation or an AI assistant, so your people spend their time on the customers and negotiations that need judgement.",
    benefit: "Faster responses, fewer lost enquiries, and more of your team’s time with the customers who matter most.",
    ripples: [
      { to: "inventory", note: "Quoting from live stock only works if inventory records can be trusted." },
      { to: "production", note: "Promising shorter lead times needs a realistic view of production capacity." },
      { to: "people", note: "The know-how behind a good quote often sits with a few experienced people." },
    ],
  },
  {
    id: "production",
    label: "Production & Operations",
    short: "Production",
    today:
      "The production plan changes daily as orders, materials and breakdowns shift. Supervisors hold it together through experience and phone calls, so one absence creates real risk.",
    change:
      "A shared, visible schedule connected to confirmed orders and material availability. Even simple machine and shift records can reveal the recurring causes of stoppages. The supervisors’ expertise is captured and supported, not replaced.",
    benefit: "Less downtime and rework, steadier delivery dates, and less dependence on a handful of key people.",
    ripples: [
      { to: "inventory", note: "A better schedule only helps if the right materials arrive when it needs them." },
      { to: "logistics", note: "More predictable finish dates let dispatch plan loads instead of reacting." },
      { to: "people", note: "Production know-how is among the most valuable knowledge to capture." },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Procurement",
    short: "Inventory",
    today:
      "Stock is counted occasionally and ordered by gut feel. Some items run out while others sit for months, tying up cash and storage space.",
    change:
      "Reordering based on actual consumption and supplier lead times, informed by sales history. Clearer supplier information makes comparing and negotiating easier, and unusual patterns can be flagged to a person for a decision.",
    benefit: "Less cash tied up in stock, fewer stock-outs, and stronger purchasing terms.",
    ripples: [
      { to: "finance", note: "Every unit on the shelf is cash that is not available elsewhere." },
      { to: "production", note: "A missing part stops a line, however good the plan was." },
      { to: "sales", note: "What you can promise a customer depends on what you can actually supply." },
    ],
  },
  {
    id: "logistics",
    label: "Logistics & Fulfillment",
    short: "Logistics",
    today:
      "Deliveries are planned by hand each morning. Customers call to ask where their order is, and dispatch and drivers rely on messages and memory.",
    change:
      "Routes and loads planned from confirmed orders, with proactive delivery updates sent to customers. Delivery notes and proof of delivery captured once and reused, rather than retyped.",
    benefit: "Lower delivery cost per order, fewer “where is my order?” calls, and faster invoicing after delivery.",
    ripples: [
      { to: "sales", note: "Customers judge the whole business by whether the delivery arrives as promised." },
      { to: "finance", note: "Invoicing can only start once delivery is confirmed." },
      { to: "production", note: "Dispatch needs finished goods when production says they will be ready." },
    ],
  },
  {
    id: "finance",
    label: "Finance & Management",
    short: "Finance",
    today:
      "Month-end figures arrive weeks late and are assembled by re-keying data from several systems. Owners decide on instinct because the numbers are already old.",
    change:
      "Sales, purchases and stock feed one set of figures automatically, so margin by product, customer and channel is visible while there is still time to act. Routine reconciliation and reporting can be automated, leaving people to interpret the results.",
    benefit: "Earlier, clearer decisions, and a better view of where margin is made and where it quietly leaks.",
    ripples: [
      { to: "inventory", note: "Reliable margin figures depend on reliable stock and purchase records." },
      { to: "sales", note: "Pricing decisions need to see the real cost to serve each customer." },
      { to: "logistics", note: "Delivery costs are part of true profitability, and rarely visible per order." },
    ],
  },
  {
    id: "people",
    label: "People & Knowledge",
    short: "People",
    today:
      "Critical know-how sits with a few long-serving people. Training new staff is slow, and the same questions are answered again and again.",
    change:
      "Capturing how experienced people actually work (procedures, decisions and exceptions) in a form others can use. Searchable internal knowledge and AI-assisted guidance can help newcomers get up to speed, while your experts remain in charge of the judgement calls.",
    benefit: "Faster onboarding, more consistent quality, and less risk when key people are away or move on.",
    ripples: [
      { to: "production", note: "Shop-floor knowledge is where capturing it pays off first." },
      { to: "sales", note: "Customer knowledge held by one person is a risk for the whole account." },
      { to: "finance", note: "Management decisions improve when the reasoning behind them is recorded, not remembered." },
    ],
  },
];

export const EXPLORER_DISCLAIMER =
  "Illustrative examples of the kinds of opportunity we look for. They are not results from actual clients, and every business is different.";

// ---------------------------------------------------------------------------------------------------------------------------------
// Whole-business schematic (isolated optimisation vs integrated architecture)
// ---------------------------------------------------------------------------------------------------------------------------------

export type SystemNodeId = "sales" | "procurement" | "inventory" | "operations" | "logistics" | "finance" | "management";

export type SystemNode = {
  id: SystemNodeId;
  label: string;
  /** What tends to happen when only this part is optimised. */
  isolated: string;
  /** What changes when it is designed together with the rest. */
  integrated: string;
};

/** The ring order is also the order the work flows: whatever is improved here pushes load onto the next node. */
export const SYSTEM_NODES: readonly SystemNode[] = [
  {
    id: "sales",
    label: "Sales",
    isolated: "Sales promises faster delivery. Procurement and stock can’t keep up, so customers wait longer, not less.",
    integrated: "Sales targets are set with supplier lead times and stock in view, so the promises made can be kept.",
  },
  {
    id: "procurement",
    label: "Procurement",
    isolated: "Purchasing wins a lower unit price with bulk orders. Stock piles up and cash is tied up in the warehouse.",
    integrated: "Purchasing decisions reflect demand, storage and cash together, so savings aren’t paid back elsewhere.",
  },
  {
    id: "inventory",
    label: "Inventory",
    isolated: "Tight stock targets cut holding costs. Production stops the day a part runs out.",
    integrated: "Stock levels are set from the production plan and customer demand together.",
  },
  {
    id: "operations",
    label: "Operations",
    isolated: "Production runs faster. Finished goods wait for dispatch, and delivery becomes the new bottleneck.",
    integrated: "Production pace is matched to confirmed orders and to what logistics can deliver.",
  },
  {
    id: "logistics",
    label: "Logistics",
    isolated: "Routes are packed tight to save fuel. Urgent orders are delayed, and customers notice.",
    integrated: "Delivery plans balance cost against the promises Sales has made.",
  },
  {
    id: "finance",
    label: "Finance",
    isolated: "Tighter credit control protects cash. Good customers get frustrated, and sales slow down.",
    integrated: "Credit and payment policies are designed with the customer relationship in mind.",
  },
  {
    id: "management",
    label: "Management",
    isolated: "Each department is measured on its own targets. Local wins hide company-wide losses.",
    integrated: "Shared measures show how the whole business performs, not just each part of it.",
  },
];

// ---------------------------------------------------------------------------------------------------------------------------------
// Three-phase approach
// ---------------------------------------------------------------------------------------------------------------------------------

export const PHASES = [
  {
    number: "01",
    name: "Decode",
    tagline: "Find risks and opportunities.",
    body: "We examine how the business works today, identify vulnerabilities and friction, and discover opportunities to improve performance.",
    deliverable: "Business Opportunity & Risk Assessment",
  },
  {
    number: "02",
    name: "Architect",
    tagline: "Design a smarter business.",
    body: "Starting from the value delivered to customers, we rethink how the entire organization should operate, including people, decisions, processes, information, and technology.",
    deliverable: "Future Business Architecture Schematics & Roadmap",
  },
  {
    number: "03",
    name: "Make It Exist",
    tagline: "Turn the design into results.",
    body: "We help the business introduce improvements progressively, evaluate or develop the right tools, support implementation, and measure outcomes.",
    deliverable: "Implementation Support & Measurable Progress",
  },
] as const;

export const PHASES_NOTE =
  "Each phase is a separately scoped engagement. You can complete Decode without committing to Architect or Make It Exist.";

// ---------------------------------------------------------------------------------------------------------------------------------
// How engagements work
// ---------------------------------------------------------------------------------------------------------------------------------

export const ENGAGEMENT_POINTS = [
  { title: "Scoped and priced phase by phase", body: "Each phase is scoped and priced individually, so you commit to one step at a time." },
  { title: "A standalone, paid first step", body: "The initial assessment is a standalone, paid engagement. It does not oblige you to continue." },
  { title: "Remote and on site", body: "Work can combine remote collaboration with on-site visits, depending on what the business needs." },
  { title: "The whole business in view", body: "The architecture covers the whole business, so improvements in one area don’t create problems in another." },
  { title: "Progressive implementation", body: "Implementation is progressive and adapted to your organization’s priorities, not a single big-bang change." },
] as const;

// ---------------------------------------------------------------------------------------------------------------------------------
// Founding Client Program
// ---------------------------------------------------------------------------------------------------------------------------------

export const FOUNDING = {
  heading: "Help shape a new approach to business transformation.",
  body: "We’re inviting three established manufacturing or retail businesses to participate in the first applications of our consulting approach.",
  terms:
    "Founding clients receive preferential introductory terms in exchange for structured feedback and permission to develop an approved, anonymized business case.",
  noCommitment: "Participation in the initial assessment does not require commitment to later phases.",
  paid: "The initial assessment is still a paid engagement; introductory terms are a preference on its terms, not a free trial.",
} as const;

// ---------------------------------------------------------------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------------------------------------------------------------

export type Faq = { q: string; a: string };

export const FAQS: readonly Faq[] = [
  {
    q: "Can AI really help a business like mine?",
    a: "It may, but it depends on your business. AI is one possible enabler, not necessarily the answer. Often the first improvements come from clearer information flows and simpler processes, with technology supporting them. Looking at the business first is how we find out where, and whether, AI is worth using.",
  },
  {
    q: "Do I need to understand AI or technology?",
    a: "No. We start from your business, your customers and the way your people work, and explain any technology in plain language. Your knowledge of the business is what matters most.",
  },
  {
    q: "Will I have to replace my existing software?",
    a: "Not necessarily. We begin with what you already use and look at how well it supports the way you work. If something new is worth considering, we help you evaluate options against your needs, rather than starting from a product.",
  },
  {
    q: "What if my business is already performing well?",
    a: "That is a good time to look. Strong businesses still carry hidden friction, dependencies on key people and risks that grow with scale. Decode is as much about protecting what works as about finding what could work better.",
  },
  {
    q: "Will the assessment disrupt daily operations?",
    a: "We plan the work around your operations and aim to keep demands on your team light. It does need some of your people’s time, mainly for conversations, observation and access to information, and we agree how that will work beforehand.",
  },
  {
    q: "Do you look at the whole company or only one department?",
    a: "The whole company. Sales, procurement, inventory, operations, logistics, finance and management depend on each other, so improving one in isolation can create a bottleneck in another. We design the whole business, then implement progressively.",
  },
  {
    q: "What do I receive at the end of Decode?",
    a: "A Business Opportunity & Risk Assessment: a clear picture of how the business works today, where the friction and vulnerabilities are, and which opportunities may be worth pursuing. The detailed scope is agreed with you before the work starts.",
  },
  {
    q: "Am I required to proceed with the other phases?",
    a: "No. Each phase is a separately scoped engagement. You can complete Decode and stop there, or continue to Architect and Make It Exist when and if it makes sense for you.",
  },
  {
    q: "Can you help us implement the recommendations?",
    a: "Yes. Make It Exist is about introducing improvements progressively, evaluating or developing the right tools, supporting implementation and measuring the outcomes. It is scoped separately from the earlier phases.",
  },
  {
    q: "Do you work remotely or visit our business?",
    a: "Both. Work can combine remote collaboration with on-site visits. We agree the mix with you based on what each phase needs.",
  },
  {
    q: "How much does an engagement cost?",
    a: "Each phase is scoped and priced individually, and we don’t publish fixed prices. After an introductory conversation we can tell you whether we can help and how an engagement would be scoped. The initial assessment is a paid, standalone engagement.",
  },
  {
    q: "How do we get started?",
    a: "Book an introductory conversation. We’ll talk about your business and what you’d like to improve, and agree together whether a Decode engagement makes sense. If you’d rather write first, you can send a message instead.",
  },
];

// ---------------------------------------------------------------------------------------------------------------------------------
// Related content. Only pages that exist in this repository; verified by content.test.ts.
// ---------------------------------------------------------------------------------------------------------------------------------

export const EXPLORE_FURTHER = [
  {
    href: "/answers/what-is-business-architecture",
    kicker: "Answer",
    title: "What is business architecture?",
    blurb: "How the customer, offer, economics, delivery and execution fit together into one coherent business system.",
  },
  {
    href: "/thinking/architecting-intelligence",
    kicker: "Thinking",
    title: "Architecting Intelligence",
    blurb: "How to design a business around human expertise, AI, decisions and workflows.",
  },
  {
    href: "/answers/how-should-i-use-ai-in-my-business",
    kicker: "Answer",
    title: "How should I use AI in my business?",
    blurb: "Starting with value, process and intelligence rather than with tools.",
  },
] as const;

// ---------------------------------------------------------------------------------------------------------------------------------
// Audience and reach (used in visible copy and in structured data, so the two cannot drift apart)
// ---------------------------------------------------------------------------------------------------------------------------------

export const AUDIENCE = "Established manufacturing and retail businesses, including family-owned SMEs of roughly 25–150 employees";
export const MARKETS = ["Vietnam", "the Philippines", "Cambodia"] as const;

// ---------------------------------------------------------------------------------------------------------------------------------
// Call-to-action wording for each destination (see booking-destination.ts). The button label is the same either way.
// ---------------------------------------------------------------------------------------------------------------------------------

export const CTA_COPY = {
  booking: {
    /** Sentence under the hero buttons, before the audience. */
    hero: "An introductory conversation of about 45 minutes, online.",
    /** Small print under the final call to action. */
    footnote:
      "Booking asks for your name and email, plus an optional note. The introductory conversation is not the assessment: the initial assessment is a separate, paid engagement.",
  },
  message: {
    hero: "Send a short message and we will reply to arrange an introductory conversation.",
    footnote:
      "The message form asks for your name, email, where you are right now and a few words about your business. The introductory conversation is not the assessment: the initial assessment is a separate, paid engagement.",
  },
} as const;
