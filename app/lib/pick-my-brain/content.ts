/**
 * Pick My Brain discovery index: one record per public, published page that
 * search should be able to surface. Published Free Resources are not listed
 * here — they come live from the `resources` table (see ./index.ts), so a
 * resource becomes searchable the moment it's published in Admin.
 *
 * When a new ANSWER, THINKING piece or case is published, add it here (the
 * same moment it's added to the sitemap and its index page). Only published
 * pages belong here: this is the site's actual knowledge, not the plan.
 *
 * - `description` is shown in results, so keep it to one plain sentence.
 * - `intents` are the questions the page genuinely answers, phrased the way a
 *   visitor would ask them. They carry the most ranking weight.
 * - `topics` are short keywords and phrases the page is about.
 */

export type DiscoveryType =
  | "Answer"
  | "Thinking"
  | "Methodology"
  | "Case"
  | "Free Resource"
  | "Work With Me"
  | "About";

export type DiscoveryRecord = {
  href: string;
  type: DiscoveryType;
  title: string;
  description: string;
  intents: string[];
  topics: string[];
  /** Lower-weight supporting text (e.g. a resource's long description). */
  body?: string;
};

export const STATIC_DISCOVERY_RECORDS: DiscoveryRecord[] = [
  // ANSWERS
  {
    href: "/answers/how-do-i-find-a-business-idea",
    type: "Answer",
    title: "How Do I Find a Business Idea?",
    description: "A practical way to find business ideas by observing real problems, desires, changes and opportunities.",
    intents: [
      "How do I find a business idea?",
      "I want to start a business but don't have an idea",
      "What business should I start?",
      "How do I come up with a business idea?",
      "How do I find a business opportunity?",
      "How do entrepreneurs find business ideas?",
      "Should I start a business based on my existing skills?",
      "How do I turn a problem into a business idea?",
    ],
    topics: ["business idea", "business ideas", "no idea", "no business idea", "idea generation", "opportunity", "observation", "skills", "aspiring entrepreneur", "what to start"],
  },
  {
    href: "/answers/how-do-i-define-my-ideal-customer-profile",
    type: "Answer",
    title: "How Do I Define My Ideal Customer Profile?",
    description: "An ideal customer profile that explains why someone would buy: the problem, the trigger, ability to pay and reachability.",
    intents: [
      "How do I define my ideal customer profile?",
      "Who is my target customer?",
      "What is the difference between an ICP, a persona and a target market?",
      "How do I create a customer avatar?",
    ],
    topics: ["ideal customer profile", "ICP", "target customer", "persona", "avatar", "target market", "customer"],
  },
  {
    href: "/answers/the-10-signs-youre-serious-about-starting-a-business",
    type: "Answer",
    title: "The 10 Signs You're Serious About Starting a Business",
    description: "The mindset and behaviours that separate a serious founder from someone who just likes the idea of starting a business.",
    intents: [
      "Am I ready to start a business?",
      "How do I know if I'm serious about starting a business?",
      "Do I have what it takes to be an entrepreneur?",
    ],
    topics: ["ready", "readiness", "mindset", "serious founder", "entrepreneur", "starting a business"],
  },
  {
    href: "/answers/i-built-an-app-how-do-i-turn-it-into-a-business",
    type: "Answer",
    title: "I Built an App. How Do I Turn It Into a Business?",
    description: "How to find customers, validate the offer, understand the economics and architect the business around a product you've already built.",
    intents: [
      "I built an app, now what?",
      "How do I turn my app into a business?",
      "Nobody is buying my app",
      "How do I get customers for my app?",
      "I built a product but have no customers",
    ],
    topics: ["app", "software", "SaaS", "product", "no customers", "monetize", "acquisition", "offer"],
  },
  {
    href: "/answers/how-do-i-get-investors-for-my-business-idea",
    type: "Answer",
    title: "How Do I Get Investors for My Business Idea?",
    description: "What makes a business investable, what investors look for, and why evidence matters more than the idea.",
    intents: [
      "How do I get investors for my business idea?",
      "Do I need investors?",
      "Can I get investment with only an idea?",
      "Where do I find investors?",
      "What do investors look for?",
    ],
    topics: ["investors", "investment", "funding", "fundraising", "raise money", "traction", "equity", "pitch deck", "angel investors", "venture capital"],
  },
  {
    href: "/answers/i-have-a-business-idea-but-no-money-what-should-i-do",
    type: "Answer",
    title: "I Have a Business Idea but No Money. What Should I Do?",
    description: "How to start with limited resources: test assumptions, break the business into smaller pieces, and find funding beyond investors.",
    intents: [
      "I have a business idea but no money",
      "Can I start a business with no money?",
      "How do I fund my business idea?",
      "How much money do I need to start a business?",
      "How do I start a business on a small budget?",
    ],
    topics: ["no money", "funding", "bootstrapping", "capital", "budget", "customer money", "equity", "cash"],
  },
  {
    href: "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
    type: "Answer",
    title: "How Do I Know If My Business Idea Is Actually Viable?",
    description: "Test a business idea with evidence: customer demand, willingness to pay, reachability and basic economics.",
    intents: [
      "How do I know if my business idea is viable?",
      "Is my business idea any good?",
      "How do I validate a business idea?",
      "How do I test my business idea?",
      "When should I kill my business idea?",
      "Will people pay for my idea?",
    ],
    topics: ["viability", "viable", "validation", "validate", "test", "willingness to pay", "demand", "economics", "evidence", "kill the idea"],
  },
  {
    href: "/answers/what-does-a-business-architect-do",
    type: "Answer",
    title: "What Does a Business Architect Do?",
    description: "How a Business Architect works from entrepreneur and idea through architecture and execution.",
    intents: [
      "What does a business architect do?",
      "What is the difference between a business architect, a consultant and a coach?",
      "What does a business architect produce?",
    ],
    topics: ["business architect", "role", "consultant", "coach", "founder architecture", "execution"],
  },
  {
    href: "/answers/what-is-business-architecture",
    type: "Answer",
    title: "What Is Business Architecture?",
    description: "How a business connects customer, offer, pricing, economics and execution into one coherent system.",
    intents: [
      "What is business architecture?",
      "What is the difference between business architecture and a business plan?",
      "What is entrepreneurial business architecture?",
    ],
    topics: ["business architecture", "business plan", "business model", "business system", "definition"],
  },

  // THINKING
  {
    href: "/thinking/how-to-define-your-ideal-customer",
    type: "Thinking",
    title: "How to Define Your Ideal Customer",
    description: "The full guide to a customer profile built on problem, trigger, psychology, buying reality and reach.",
    intents: [
      "How do I define my ideal customer?",
      "Who is not my customer?",
      "How do I understand my customer's psychology?",
    ],
    topics: ["ideal customer", "ICP", "persona", "avatar", "customer psychology", "customer journey", "Customer Architecture Map"],
  },
  {
    href: "/thinking/the-fastest-way-to-build-the-wrong-business",
    type: "Thinking",
    title: "The Fastest Way to Build the Wrong Business",
    description: "Why entrepreneurs start building before they've worked out what needs to exist, and how to reverse-engineer instead.",
    intents: [
      "What should I build first?",
      "Should I build an MVP first?",
      "Where do I start building my business?",
      "When should I start marketing?",
    ],
    topics: ["MVP", "build", "sequence", "dangerous assumption", "reverse-engineer", "marketing", "website", "logo"],
  },
  {
    href: "/thinking/your-business-idea-is-worth-nothing",
    type: "Thinking",
    title: "Your Business Idea Is Worth Nothing",
    description: "An idea has no value simply because you had it. How to challenge it and make it earn the right to exist.",
    intents: [
      "Is my business idea valuable?",
      "Should I protect my business idea?",
      "Will someone steal my business idea?",
    ],
    topics: ["business idea", "value", "commodity", "execution", "business idea architecture", "kill the idea"],
  },
  {
    href: "/thinking/an-app-is-not-a-business",
    type: "Thinking",
    title: "An App Is Not a Business",
    description: "Building an app doesn't mean you've built a business. The difference is customers, acquisition, economics and architecture.",
    intents: [
      "Is an app a business?",
      "What is the difference between a product and a business?",
    ],
    topics: ["app", "product", "software", "AI", "scalable", "revenue", "product lifecycle"],
  },
  {
    href: "/thinking/your-corporate-experience-may-be-working-against-you",
    type: "Thinking",
    title: "Your Corporate Experience May Be Working Against You",
    description: "Leading an established business and creating one from nothing are different games.",
    intents: [
      "I'm leaving corporate to start a business",
      "Does my corporate experience help me as an entrepreneur?",
      "Going from employee to entrepreneur",
    ],
    topics: ["corporate", "corporate experience", "executive", "career change", "professional", "employee", "leaving my job"],
  },
  {
    href: "/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts",
    type: "Thinking",
    title: "Your Life Is Perfectly Designed to Kill Your Business Before It Starts",
    description: "Most aspiring entrepreneurs don't have a motivation problem. Their life leaves no room for the business.",
    intents: [
      "Should I quit my job to start a business?",
      "How do I find time to start a business?",
      "I keep saying I'll start a business but never do",
      "How do I start a business while working full time?",
    ],
    topics: ["quit my job", "time", "motivation", "energy","side business", "founder architecture", "transition"],
  },
  {
    href: "/thinking/the-brutal-truth-about-startup-fundraising",
    type: "Thinking",
    title: "The Brutal Truth About Startup Fundraising",
    description: "Most early founders with a fundraising problem actually have a business-readiness problem.",
    intents: [
      "Why can't I raise money for my startup?",
      "Should I raise money?",
      "How much should I raise?",
      "Why do investors say no?",
    ],
    topics: ["fundraising", "investors", "startup funding", "pitch deck", "raise money", "traction", "readiness", "venture capital"],
  },
  {
    href: "/thinking/the-being-economy",
    type: "Thinking",
    title: "The Being Economy",
    description: "As AI makes knowledge cheaper, judgment, trust, reputation and relationships may become more valuable.",
    intents: [
      "How will AI change business?",
      "What will be valuable in the age of AI?",
    ],
    topics: ["AI", "artificial intelligence", "future of work", "trust", "reputation", "judgment", "knowledge economy"],
  },

  // METHODOLOGY
  {
    href: "/thinking/the-business-architects-frame",
    type: "Methodology",
    title: "The Business Architect's FRAME™",
    description: "Find, Reality-Test, Architect, Make, Evolve: the methodology for turning an idea into a business.",
    intents: [
      "What is the FRAME method?",
      "What are the steps to start a business?",
      "What should I do next with my business idea?",
      "How do I turn an idea into a business?",
    ],
    topics: ["FRAME", "methodology", "framework", "process", "find", "reality test", "architect", "make", "evolve"],
  },
  {
    href: "/work",
    type: "Methodology",
    title: "Business Architecture",
    description: "How the work moves ideas from uncertainty through validation, structure and execution.",
    intents: ["What is your approach?", "What is the business architecture process?"],
    topics: ["business architecture", "approach", "process", "validation", "execution"],
  },

  // CASES
  {
    href: "/cases/create-it",
    type: "Case",
    title: "Create It",
    description: "An asset and entrepreneurial ambition, no business idea — and how research created a concept.",
    intents: ["I have land but no business idea", "What business can I build with an asset?"],
    topics: ["case study", "asset", "property", "land", "no business idea", "research", "concept"],
  },
  {
    href: "/cases/kill-it",
    type: "Case",
    title: "Kill It",
    description: "Investigation showed a proven business model should not be replicated in a different market.",
    intents: ["When should I kill a business idea?", "Can I copy a business model from another country?"],
    topics: ["case study", "kill the idea", "replicate", "business model", "new market"],
  },
  {
    href: "/cases/find-it",
    type: "Case",
    title: "Find It",
    description: "Research revealed a credible international expansion opportunity in an overlooked market.",
    intents: ["How do I find an international expansion opportunity?"],
    topics: ["case study", "international expansion", "new market", "opportunity", "research"],
  },
  {
    href: "/cases/validate-it",
    type: "Case",
    title: "Validate It",
    description: "Testing whether a specialized import product could support a viable business before building the operation.",
    intents: ["How do I validate an import business?"],
    topics: ["case study", "validation", "import", "product", "viability"],
  },
  {
    href: "/cases/evolve-it",
    type: "Case",
    title: "Evolve It",
    description: "An ambitious vision survived while its first move evolved into a narrower, testable business.",
    intents: ["My idea is too big, where do I start?"],
    topics: ["case study", "vision", "first move", "narrow", "pivot"],
  },

  // FREE RESOURCES (static routes — database resources are merged in live)
  {
    href: "/resources/business-idea-reality-check",
    type: "Free Resource",
    title: "The Business Idea Reality Check",
    description: "13 questions, 4–6 minutes: how much evidence exists that there may be a viable business inside your idea.",
    intents: ["Is my business idea viable?", "Assess my business idea", "Test my business idea"],
    topics: ["assessment", "quiz", "score", "viability", "evidence", "reality check"],
  },

  // WORK WITH ME / ABOUT
  {
    href: "/work-with-me",
    type: "Work With Me",
    title: "Ways to Work Together",
    description: "From Pre-Architecture and idea validation to business architecture, execution support and advisory.",
    intents: ["Can you help me build my business?", "How can I work with you?", "What is Pre-Architecture?"],
    topics: ["services", "Pre-Architecture", "advisory", "engagement", "hire", "help"],
  },
  {
    href: "/martin",
    type: "About",
    title: "Martin Dubreuil",
    description: "Business architect, serial entrepreneur and international business development practitioner.",
    intents: ["Who is Martin Dubreuil?"],
    topics: ["Martin", "about", "background", "experience"],
  },
];

/**
 * Optional hand-written hints for database resources, keyed by slug. The
 * resource's own title and descriptions are always indexed; these only add
 * the questions it answers, which the table doesn't hold.
 */
export const RESOURCE_HINTS: Record<string, Pick<DiscoveryRecord, "intents" | "topics">> = {
  "the-business-architects-frame": {
    intents: ["I have a business idea, now what?", "What should I do next with my business idea?"],
    topics: ["guide", "FRAME", "first-time founder", "next steps"],
  },
  "the-customer-architecture-map": {
    intents: ["How do I define my ideal customer?", "Ideal customer profile template"],
    topics: ["worksheet", "template", "ICP", "customer profile", "persona"],
  },
};
