/**
 * Canonical data for the eight Modern Business Architect programs.
 *
 * This is the single source of truth for names, prices, durations, copy and CTAs. The selector, the
 * summary table, metadata and tests all read from here; nothing else may hard-code a price.
 *
 * The eight programs are independent entry points, not a sequence or a maturity score. `number` is a
 * label only and must never be used to imply rank or order of purchase.
 *
 * Not to be confused with app/lib/programs/ (the corporate-transition intake workflow).
 */

export type ProgramPricing =
  | { kind: "fixed"; usd: number }
  | { kind: "bespoke" };

export type ProgramCta = {
  label: string;
  /** What the visitor is actually doing. No program has a checkout integration yet; see ctaHref(). */
  intent: "inquiry" | "assessment" | "consultation";
};

export type ServiceProgram = {
  /** Two-digit label, e.g. "03". Display only. */
  number: string;
  /** URL-safe id; deep link is /programs#program-<number>. */
  slug: string;
  name: string;
  /** Short label for the selector stops (secondary to `hook`). */
  shortName: string;
  /** First-person situation label for the selector stop. The visitor picks a situation, not a product. */
  hook: string;
  /** Shorter version of `hook` for tablet-width stops. Same meaning, fewer words. */
  hookShort: string;
  /** One concise sentence describing the visitor ("Who it's for" on the selector card). The longer `fit` stays in details. */
  who: string;
  pricing: ProgramPricing;
  /** Shown beside the price, e.g. what is free before a proposal. */
  priceNote?: string;
  duration: string;
  /** Condition that must stay visible next to the duration (e.g. Program 07's seven-day qualifier). */
  durationQualifier?: string;
  /** How the work is delivered, in plain terms. Never the headline. */
  delivery: string;
  /** Page title for the dedicated program page (the site title template appends the brand). */
  seoTitle: string;
  /** One or two plain sentences on how the program helps. Used in the selector and meta descriptions. */
  help: string;
  /** The principal outcome in a single line, for the selector. The full deliverable stays in `deliverable`. */
  receive: string;
  /** First-person, plain-English statement of the visitor's situation. */
  situation: string;
  /** Who this is for, one or two sentences. */
  fit: string;
  /** Optional positioning line. */
  positioning?: string;
  /** What the work consists of, in order. Concise: details go in `more`. */
  process: string[];
  /** What the client leaves with. */
  outcome: string;
  /** The named deliverable. */
  deliverable: string;
  /** What this is not / not included. Honest scope boundaries. */
  boundaries: string[];
  /** Expandable detail. */
  more?: { title: string; items: string[] };
  /** Optional closing note (follow-ups, rescoping). */
  note?: string;
  cta: ProgramCta;
};

/**
 * CTA language is deliberately about starting a conversation, never a purchase. No CTA may imply checkout.
 * Fixed-fee programs still show their price; expressing interest commits to nothing.
 */
export const CTA_FIXED = "I\u2019m interested \u2014 Let\u2019s talk";
export const CTA_BESPOKE = "Discuss my project";
export const CTA_REASSURANCE = "Free initial conversation. No payment or commitment.";

export const PROGRAMS: readonly ServiceProgram[] = [
  {
    number: "01",
    slug: "architecting-the-entrepreneur",
    name: "Architecting the Entrepreneur",
    shortName: "The Entrepreneur",
    hook: "I'm thinking about starting a business",
    hookShort: "Thinking of starting",
    who: "An employed or job-seeking professional considering entrepreneurship who isn't sure what kind of entrepreneurial life fits them.",
    seoTitle: "Architecting the Entrepreneur: Find the Entrepreneurial Life That Fits",
    help: "Two private sessions to work out what kind of entrepreneurial life would actually fit you, before you choose a business.",
    receive: "A Personal Entrepreneurial Profile, co-created with me.",
    pricing: { kind: "fixed", usd: 199 },
    duration: "1–2 weeks",
    delivery: "Two private 1:1 sessions, with reflection work and my synthesis in between.",
    situation: "I'm tired of my corporate life and I'm thinking about building something of my own. I don't know what kind of entrepreneurial life would actually fit me.",
    fit: "An employed or job-seeking professional, perhaps disillusioned with corporate life, who is considering entrepreneurship and wants to understand what fits them before choosing a business.",
    process: [
      "Session one explores your motivations, frustrations, aspirations, lifestyle, income needs, strengths, constraints and non-negotiables.",
      "Between sessions you reflect on your future self while I look for patterns and contradictions in what you've said.",
      "Session two brings it together: your entrepreneurial direction, capabilities, assets and gaps.",
    ],
    outcome: "A clear picture of the entrepreneur you would need to be, and where you stand against it.",
    deliverable: "A co-created Personal Entrepreneurial Profile.",
    boundaries: [
      "Not a business idea.",
      "Not a verdict on whether a business would be viable.",
      "Not a generic personality test.",
    ],
    cta: { label: CTA_FIXED, intent: "inquiry" },
  },
  {
    number: "02",
    slug: "discovering-business-opportunities",
    name: "Discovering Business Opportunities",
    shortName: "Opportunities",
    hook: "I want a business, but have no idea",
    hookShort: "No idea yet",
    who: "Someone who knows the life and income they want but has no business idea yet.",
    seoTitle: "Discovering Business Opportunities: Find a Business Idea",
    help: "We look for ideas in what you already know, own and can do, and in problems you observe, then challenge them together.",
    receive: "An annotated Working List of Business Ideas.",
    pricing: { kind: "fixed", usd: 299 },
    duration: "2–3 weeks",
    delivery: "Two private sessions, with one to two weeks of opportunity-observation work on your side in between.",
    situation: "I know the life and income I want. I just don't have a business idea.",
    fit: "Someone who is clear about the lifestyle and income they want but has no business idea yet.",
    process: [
      "We explore two routes to an idea: Repackage (turn expertise you already have into something people pay for) and Recycle (apply your skills, experience, networks or assets in a different field).",
      "You spend one to two weeks observing real problems, unmet needs and frustrations around you.",
      "We discuss and challenge the ideas together.",
    ],
    outcome: "A set of ideas worth taking seriously, with my notes on each.",
    deliverable: "An annotated Working List of Business Ideas.",
    boundaries: [
      "Not a validated opportunity portfolio.",
      "Not a polished feasibility study.",
    ],
    cta: { label: CTA_FIXED, intent: "inquiry" },
  },
  {
    number: "03",
    slug: "pre-architecture",
    name: "Pre-Architecture",
    shortName: "Pre-Architecture",
    hook: "I have an idea. Will it work?",
    hookShort: "Will my idea work?",
    who: "A founder whose concept needs real money, time or personal risk, and who wants it challenged before committing.",
    seoTitle: "Pre-Architecture: Challenge Your Business Idea Before You Commit",
    help: "I investigate your concept independently and challenge your assumptions, so you decide on evidence before committing money, time or personal risk.",
    receive: "An Evidence-Based Business Assessment: proceed, rethink or walk away.",
    pricing: { kind: "fixed", usd: 1999 },
    duration: "4–6 weeks",
    delivery: "You do the field work. I investigate independently and challenge what you find.",
    situation: "I have a concept that will cost real money, time or personal risk. Before I commit, I want someone to try to break it.",
    fit: "A founder whose concept requires meaningful investment, time, operational commitment or personal financial risk, and who wants it challenged before proceeding.",
    positioning: "You're not hiring me to validate your idea. You're hiring me to challenge it.",
    process: [
      "You carry out the field, customer and competitor research that matters for your concept.",
      "I investigate independently, challenge your assumptions, run counter-research and probe for blind spots.",
      "We assess the evidence together. The method adapts to the concept.",
    ],
    outcome: "A clear, evidence-based recommendation you can act on or argue with.",
    deliverable: "An Evidence-Based Business Assessment with one of three recommendations: proceed to architecture, rethink or reframe the opportunity, or walk away.",
    boundaries: [
      "The recommendation is not a guarantee. The final decision is yours.",
      "Not required before every architecture program. Simple, cheap-to-test ventures can skip it.",
    ],
    cta: { label: CTA_FIXED, intent: "inquiry" },
  },
  {
    number: "04",
    slug: "lean-business-architecture",
    name: "Lean Business Architecture",
    shortName: "Lean Architecture",
    hook: "I have an idea. I want to launch fast",
    hookShort: "Launch fast",
    who: "A solopreneur, consultant, coach or founder of a straightforward business that is cheap to test.",
    seoTitle: "Lean Business Architecture: Design a Simple Business Worth Testing",
    help: "We design a simple, cheap-to-test business properly: customer, offer, pricing, economics, delivery and a first go-to-market test.",
    receive: "A Lean Business Architecture, ready for activation. Launch, website, MVP and campaigns are not included.",
    pricing: { kind: "fixed", usd: 1399 },
    duration: "3–4 weeks",
    delivery: "About four private working sessions, plus meaningful work between them.",
    situation: "My business is simple and cheap to test: a solo practice, a service, a first version I can build for little. I need it designed properly before I start.",
    fit: "A low-complexity, low-cost-to-test business: solopreneur, consultant, coach, independent service provider, or an app whose first version can be built inexpensively. Complexity matters more than industry.",
    process: [
      "Just enough customer, competitor, offer and pricing discovery to make sound design choices.",
      "We architect your customer, problem, positioning, offer, differentiation, pricing, basic economics, delivery and acquisition channels.",
      "We finish with an initial go-to-market test plan.",
    ],
    outcome: "A business designed well enough to start testing in the market.",
    deliverable: "A co-created Lean Business Architecture, ready for activation.",
    boundaries: [
      "Launch, website build, campaigns, CRM, MVP and other implementation work are not included. They can be agreed separately.",
    ],
    cta: { label: CTA_FIXED, intent: "inquiry" },
  },
  {
    number: "05",
    slug: "business-architecture",
    name: "Business Architecture",
    shortName: "Architecture",
    hook: "I'm building something more complex",
    hookShort: "Something complex",
    who: "A founder with an investigated, complex business concept whose parts depend on each other.",
    seoTitle: "Business Architecture: Design a Complex Business Before You Build It",
    help: "We co-design the whole business across six dimensions and sequence what to build first.",
    receive: "An implementation-ready Business Architecture with a sequenced plan.",
    pricing: { kind: "fixed", usd: 5999 },
    duration: "8–12 weeks",
    delivery: "Co-design with me, with substantial work on your side between sessions.",
    situation: "My concept is investigated and complex. It has many moving parts that depend on each other, and I need the whole thing designed before I build it.",
    fit: "A founder with a sufficiently investigated or validated, complex business concept with multiple operational dependencies. The validation may have been done independently; Pre-Architecture is not compulsory.",
    process: [
      "You and I co-design the integrated business across six dimensions.",
      "Work between sessions is substantial, and iteration within the concept is part of the program.",
      "We close with priorities and a sequenced implementation plan.",
    ],
    outcome: "A complete picture of the business, and the order in which to build it.",
    deliverable: "A complete, integrated, implementation-ready Business Architecture, including priorities and a sequenced implementation plan.",
    boundaries: [
      "Covers one defined business concept. Normal iteration is included; a fundamental pivot or major expansion needs rescoping.",
      "Implementation is outside scope and agreed separately.",
      "No guarantee of viability.",
    ],
    more: {
      title: "The six dimensions",
      items: [
        "Customer architecture",
        "Value and offer architecture",
        "Business model and economics",
        "Operating architecture",
        "Market and go-to-market architecture",
        "Implementation architecture and sequencing",
      ],
    },
    cta: { label: CTA_FIXED, intent: "inquiry" },
  },
  {
    number: "06",
    slug: "business-activation",
    name: "Business Activation",
    shortName: "Activation",
    hook: "I have a plan. I need to make it happen",
    hookShort: "Make my plan happen",
    who: "A founder whose business architecture is complete, or close to it, and who needs help making it real.",
    seoTitle: "Business Activation: Turn a Business Architecture Into Reality",
    help: "Coaching, consulting and hands-on work to turn the architecture into real things, scoped in a written proposal after a free assessment.",
    receive: "Tangible implementation against the deliverables we agree.",
    pricing: { kind: "bespoke" },
    priceNote: "The initial assessment is free.",
    duration: "Depends on the agreed scope",
    delivery: "Coaching, consulting and hands-on doing, as agreed.",
    situation: "The architecture is done, or close to it. Now I need help turning it into something real.",
    fit: "A founder whose business architecture is sufficiently complete but who needs help making it operational. It can be an architecture created elsewhere.",
    process: [
      "A free assessment of your readiness, destination, capabilities, gaps and resources.",
      "We work backwards from the outcome you want to an execution roadmap, at whatever level of detail helps: year, quarter, month, week or day.",
      "We define who does what: you, me or third parties.",
      "I send a written, tailored proposal with scope, deliverables, timing, milestones and fees. You accept or decline freely, and work starts after agreement.",
    ],
    outcome: "Tangible implementation against the deliverables we agree.",
    deliverable: "Whatever the proposal specifies. That can include a website, MVP, commercial offer, campaigns, content, social presence, pitch deck, a first workshop, operational systems, or help recruiting and developing partners.",
    boundaries: [
      "Priced by proposal after the free assessment.",
      "Revenue and customer numbers are not promised as results.",
    ],
    cta: { label: CTA_BESPOKE, intent: "assessment" },
  },
  {
    number: "07",
    slug: "business-evolution",
    name: "Business Evolution",
    shortName: "Evolution",
    hook: "My business is running, but something's wrong",
    hookShort: "Something's wrong",
    who: "The owner of an operating business who needs an objective view of what is working, what isn't and why.",
    seoTitle: "Business Evolution: An Objective Diagnostic of Your Operating Business",
    help: "I analyze your records and results, work out what is working, what isn't and why, and we agree the changes worth making.",
    receive: "A Business Diagnostic & Corrective Action Plan. Follow-up implementation help is separate.",
    pricing: { kind: "fixed", usd: 699 },
    duration: "Approximately 7 days",
    durationQualifier: "Normally delivered within seven days of the initial consultation, provided the necessary information is available. Missing information may extend the timeline.",
    delivery: "Two private sessions, with my independent analysis between them.",
    situation: "My business is running, but I don't know what's working, what isn't, or why. I want an outside view.",
    fit: "The owner of an operating business who needs an objective understanding of what is working, what isn't, why, and what should change.",
    process: [
      "A founder interview about your objectives, performance and concerns. You share the records you already have: financial statements, product and pricing information, sales, customer and marketing results. There is no long questionnaire.",
      "I analyze performance, market, offers, operations, customer feedback and likely causes, within the evidence available.",
      "A second private session to go through the findings and the corrective actions.",
    ],
    outcome: "An honest account of how the business is doing and a short list of changes worth making first.",
    deliverable: "A personalized Business Diagnostic & Corrective Action Plan: strengths, underperformance, likely causes, prioritized changes and practical next steps. Confirmed findings are kept separate from hypotheses.",
    boundaries: [
      "Not a forensic audit.",
      "Not an enterprise-wide turnaround study.",
    ],
    note: "Optional follow-up coaching, consulting or implementation support is available at US$200 an hour, agreed separately and with no obligation. If the diagnosis points to a fundamental structural redesign, Business Re-Architecture may be the better fit.",
    cta: { label: CTA_FIXED, intent: "inquiry" },
  },
  {
    number: "08",
    slug: "business-re-architecture",
    name: "Business Re-Architecture",
    shortName: "Re-Architecture",
    hook: "My company needs a major change",
    hookShort: "Major company change",
    who: "An established company or executive team facing significant strategic, operational or technological change.",
    seoTitle: "Business Re-Architecture: Strategic Change for Established Companies",
    help: "I help your organization design and manage a major change, from AI adoption to a new operating model, while accounting for existing operations, people and systems.",
    receive: "Defined in a written proposal: roadmap, change priorities and execution support.",
    pricing: { kind: "bespoke" },
    priceNote: "The initial consultation is free.",
    duration: "Depends on complexity and scope",
    delivery: "Scoped consulting, coaching, architecture and agreed implementation support.",
    situation: "We're an established company and something big has to change: AI, a restructure, a new market, a new operating model. We need to do it without breaking what works.",
    fit: "Established SMEs, mid-sized and larger enterprises, and executive teams managing substantial strategic, operational, organizational, commercial or technological change. Not tied to headcount: it could be a 10-person company introducing a new system or a 200-person company architecting AI adoption.",
    process: [
      "A free initial discussion to understand the challenge and the outcomes you want.",
      "A tailored written proposal, followed by a conversation about it.",
      "You decide. If you proceed, we scope the work and agree the implementation support.",
    ],
    outcome: "Defined in the proposal. It can include a redesigned business architecture, a transformation roadmap, change priorities and help with execution. Unlike Business Architecture, it has to account for existing operations, people, systems, customers and continuity.",
    deliverable: "Whatever the proposal specifies.",
    boundaries: [
      "Priced by proposal after the free initial discussion.",
    ],
    more: {
      title: "Typical themes",
      items: [
        "AI implementation and transformation",
        "Redesigning people, process and technology",
        "Restructuring",
        "Operating model redesign",
        "New market entry",
        "Business development and partnerships",
        "Strategic transformation",
      ],
    },
    cta: { label: CTA_BESPOKE, intent: "consultation" },
  },
] as const;

export const DEFAULT_PROGRAM_NUMBER = "01";

/**
 * Program CTAs deliberately route to the inquiry form (/lets-talk), not straight to a calendar, so this stays null.
 * The introductory-booking link used in emails and buttons is centralized in app/lib/booking.ts.
 */
export const BOOKING_URL: string | null = null;

/**
 * TODO(integration): there is no checkout. Fixed-price programs route to the inquiry form until a
 * payment flow is approved. /lets-talk does not read `program` yet; wiring it into the qualify API
 * (and into lead attribution) is part of the lead-capture change, not this presentation feature.
 */
export function ctaHref(program: ServiceProgram): string {
  if (BOOKING_URL && program.cta.intent !== "inquiry") return BOOKING_URL;
  return `/lets-talk?program=${program.slug}`;
}

export function programByNumber(number: string): ServiceProgram | undefined {
  return PROGRAMS.find((p) => p.number === number);
}

export function hashFor(program: ServiceProgram): string {
  return `#program-${program.number}`;
}

/** Parses "#program-03" (or "program-03"). Returns undefined for anything else. */
export function programFromHash(hash: string): ServiceProgram | undefined {
  const m = /^#?program-(\d{2})$/.exec(hash);
  return m ? programByNumber(m[1]) : undefined;
}

export function formatPrice(program: ServiceProgram): string {
  return program.pricing.kind === "fixed"
    ? `US$${program.pricing.usd.toLocaleString("en-US")}`
    : "By proposal";
}

export function priceKindLabel(program: ServiceProgram): string {
  return program.pricing.kind === "fixed" ? "Fixed fee" : "Bespoke proposal";
}

/** Shown directly below every CTA and on the inquiry form: one sentence, one place. */
export function ctaExplainer(): string {
  return CTA_REASSURANCE;
}

/** What follows the conversation, for bespoke programs only. Fixed-fee programs state their price and scope up front. */
export function bespokeFollowUp(program: ServiceProgram): string | null {
  return program.pricing.kind === "bespoke"
    ? "The initial conversation is an assessment, not a consulting engagement. If we go further, you receive a written, tailored proposal that you are free to accept or decline."
    : null;
}

export function programBySlug(slug: string): ServiceProgram | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export function programPath(program: ServiceProgram): string {
  return `/work/${program.slug}`;
}

/** Meta description derived from catalog facts so it can never disagree with the visible price or timeline. */
export function metaDescription(program: ServiceProgram): string {
  const price = program.pricing.kind === "fixed" ? formatPrice(program) : "Priced by written proposal";
  return `${program.help} ${price}. ${program.duration}.`;
}
