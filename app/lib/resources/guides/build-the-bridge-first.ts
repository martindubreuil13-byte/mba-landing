import type { GuideContent } from "./types";

/**
 * Source of truth: "Build-the-Bridge-First-FINAL-corrected.pdf" (9 pages). The accepted
 * FINAL PDF printed "before before" and "credible credible" across line breaks and had a
 * stray image after "ARCHITECT" in two footers (the PPTX source was correct); the corrected
 * PDF removes those, so the PDF and this page now agree word for word.
 * See docs/resource-lead-capture/content-comparison.md for the page-by-page comparison.
 * Deliberate differences from the PDF:
 *   1. Page 4: item names are the row headers (first column) instead of the middle column,
 *      so the table works on a phone and for screen readers. Wording unchanged.
 *   2. Table captions (screen-reader only) and the column labels "Activity", "Item",
 *      "Condition" are added.
 *   3. "page N" references link to the matching section.
 */
export const buildTheBridgeFirst: GuideContent = {
  slug: "build-the-bridge-first",
  stageLabels: { you: "You", direction: "Direction", evidence: "Evidence" },
  sections: [
    {
      kind: "cover",
      id: "page-1",
      page: 1,
      kicker: "A field guide for experienced professionals",
      heading: ["Build the bridge ", { em: "first." }],
      subtitle: "A short guide to finding an entrepreneurial direction before you commit to an idea.",
      byline: "Martin Dubreuil · The Modern Business Architect",
      meta: "For experienced professionals considering a second act · About 30 minutes · A pen",
      lead: "In about 30 minutes, move from “I want to build something of my own” to a credible direction worth investigating, and one clear next step.",
      intro:
        "Most people start with the wrong question: what business should I start? It picks a destination before you know who is travelling, what they can carry, or what they are prepared to leave behind. This guide asks the earlier questions, in the right order.",
      stages: [
        {
          label: "Stage 1",
          title: "You",
          subtitle: "Understand yourself",
          questions: ["What do I want it to change?", "What role do I want?", "What is genuinely mine?"],
          output: "My Entrepreneur Profile",
        },
        {
          label: "Stage 2",
          title: "Direction",
          subtitle: "Find a direction",
          questions: [
            "What business fits my life and economics?",
            "Where is my unusual advantage?",
            "What could emerge from it?",
          ],
          output: "My Opportunity Territory",
        },
        {
          label: "Stage 3",
          title: "Evidence",
          subtitle: "Move toward evidence",
          questions: ["What do I know?", "What am I assuming?", "What should I test first?"],
          output: "My Entrepreneurial Direction",
        },
      ],
      closing:
        "You finish with one page: your Entrepreneurial Direction Brief. “Worth investigating,” “try a different direction,” “not yet” and “not entrepreneurship” are all legitimate conclusions.",
      beforeYouBegin: {
        label: "Before you begin",
        text: "In one sentence, what do you currently tell people about your plans? You will return to it on page 8.",
      },
    },
    {
      kind: "standard",
      id: "page-2",
      page: 2,
      kicker: "Understand yourself",
      stage: "you",
      heading: ["Clarify what you want entrepreneurship to ", { em: "change" }, "."],
      body: [
        "You may not want a business. You may want something a business could give you: ownership, control of your time, income beyond a salary, relevance, protection from the next restructuring.",
        "Each points to a different kind of business, and some point away from having one at all. The person who wants freedom often builds a practice and discovers a new boss: the customer.",
      ],
      aside: {
        label: "Claire’s example",
        paragraphs: [
          "Claire is 49. She led operations in regional logistics for 18 years and thinks: “I could probably become a consultant.” Her two outcomes: ownership and meaningful work. She will not give up working with senior decision-makers. She does not want to manage a large team.",
        ],
      },
      exercise: {
        instruction: "Choose the two outcomes that matter most and number them 1 and 2.",
        blocks: [
          {
            type: "choice-grid",
            items: ["Ownership", "Time control", "Escape", "Income above salary", "Authorship", "Relevance", "Security from layoffs", "Meaning"],
          },
          { type: "fields", items: [{ label: "The one thing I will not sacrifice to get them" }] },
          { type: "choice-row", label: "Could I get most of this without starting a business?", options: ["Yes", "Partly", "No"] },
          { type: "fields", items: [{ label: "If partly or yes, what would a business add that justifies the risk?", tall: true }] },
        ],
      },
      outputs: [
        {
          label: "The future I am trying to create",
          blocks: [{ type: "sentence", text: "I want ______ and ______, without giving up ______.", lines: 2 }],
        },
      ],
    },
    {
      kind: "standard",
      id: "page-3",
      page: 3,
      kicker: "Understand yourself",
      stage: "you",
      heading: ["Design the ", { em: "role" }, " you would have inside the business."],
      body: [
        "Businesses are described by what they sell. They are lived as a calendar.",
        "Before it hires anyone else, a business hires you, and the job is rarely the one you would have written: selling, delivering, chasing invoices, answering the complaint nobody else will. Strategy happens in the gaps. You may not have asked a stranger for money since your early thirties.",
      ],
      aside: {
        label: "Claire’s Tuesday",
        schedule: [
          { time: "8:30", text: "Forecast call with a finance director" },
          { time: "11:00", text: "Review a client’s planning data" },
          { time: "14:00", text: "Write a short diagnostic" },
          { time: "16:00", text: "Follow up two introductions" },
        ],
        closing: "Mostly diagnosis. Some selling. No payroll.",
      },
      exercise: {
        instruction:
          "Picture an ordinary Tuesday, three months in. Mark how each activity would feel over a year, then tick the ones you would have to do yourself at the start. A tick is not forever: the business should not permanently depend on you for anything in the last column.",
        blocks: [
          {
            type: "matrix",
            caption: "Activities in an ordinary week, and how each would feel",
            rowHeader: "Activity",
            columns: [
              { label: "Want to do regularly", mark: "circle" },
              { label: "Will tolerate", mark: "circle" },
              { label: "Delegate or avoid eventually", mark: "circle" },
              { label: "Must do at first", mark: "square" },
            ],
            rows: [
              { label: "Selling and asking for money" },
              { label: "Delivering the work myself" },
              { label: "Managing people" },
              { label: "Creating content, staying visible" },
              { label: "Building systems and process" },
              { label: "Handling problems and complaints" },
              { label: "Finance and admin" },
              { label: "Doing similar work repeatedly" },
            ],
          },
        ],
      },
      outputs: [
        {
          label: "The role I want to have inside the business",
          blocks: [
            {
              type: "fields",
              items: [
                { label: "Most of my week I want to be" },
                { label: "At first I will also have to" },
                { label: "The business should not permanently depend on me for" },
              ],
            },
          ],
        },
      ],
    },
    {
      kind: "standard",
      id: "page-4",
      page: 4,
      kicker: "Understand yourself",
      stage: "you",
      heading: ["Separate your ", { em: "experience" }, " from the company around you."],
      body: [
        "Some of your success belongs to you. Some belonged to the organisation around you.",
        "Try the kitchen-table test: put the item on a table on Monday morning with no logo, no title, no budget and no team. Does it still work? Relationships often fail it. Some people took your call because of what you could do for them, others because of who you represented.",
      ],
      aside: {
        label: "Claire’s example",
        paragraphs: [
          "Claire can carry her sector knowledge, her eye for planning failures and real relationships with finance and operations leaders. She cannot carry her former company’s brand, analysts, data, travel budget or automatic access to decision-makers.",
        ],
      },
      exercise: {
        instruction:
          "For each item, mark what is true today. If it is partly both, mark both. Be hardest on credibility and access to customers.",
        blocks: [
          {
            type: "matrix",
            caption: "What you can carry, and what the company provided",
            rowHeader: "Item",
            columns: [
              { label: "I can carry it", mark: "circle" },
              { label: "The company provided it", mark: "circle" },
            ],
            rows: [
              { label: "Judgment" },
              { label: "Expertise" },
              { label: "Relationships" },
              { label: "Credibility" },
              { label: "Access to customers" },
              { label: "A team" },
              { label: "Budget" },
              { label: "Data" },
              { label: "Systems" },
              { label: "Authority" },
              { label: "Brand" },
            ],
          },
        ],
      },
      outputs: [
        {
          label: "My portable advantages and the support I would need to replace",
          blocks: [
            {
              type: "fields",
              items: [{ label: "My three strongest portable advantages" }, { label: "Support I would have to replace" }],
            },
          ],
        },
      ],
      footnote: "Stage 1 complete: you now have My Entrepreneur Profile (pages 2 to 4).",
    },
    {
      kind: "standard",
      id: "page-5",
      page: 5,
      kicker: "Find a direction",
      stage: "direction",
      heading: ["Choose a business shape that fits your ", { em: "ambition" }, "."],
      body: [
        "The same income can come from very different businesses, and each creates a different working life.",
        "Start with what the business must eventually earn. Then ask who delivers the work, how many customers it needs and how much of your week it takes. If it pays the income but breaks the future you described on page 2, it has not worked.",
      ],
      aside: {
        label: "Claire’s example",
        paragraphs: [
          "Claire wants about $180,000 a year. Add $30,000 for costs, $25,000 for specialist help and $35,000 for uncertainty: the business must eventually earn about $270,000. As a practice, that is nine $30,000 diagnostics a year, delivered by her, with no team. It fits the future she described.",
        ],
      },
      exercise: {
        instruction: "Work backwards from the income you want, then circle the shape closest to how you would like to work.",
        blocks: [
          {
            type: "fields",
            items: [
              { label: "Desired personal income" },
              { label: "+ delivery and operating costs" },
              { label: "+ people or specialist support" },
              { label: "+ room for uncertainty" },
              { label: "= revenue the business must eventually produce", strong: true },
            ],
          },
          {
            type: "cards",
            items: [
              {
                title: "Expertise-led practice",
                details: [
                  "Delivers: you, or a small network",
                  "Your week: selling and doing",
                  "Capital before proof: low",
                  "Time to evidence: weeks",
                ],
              },
              {
                title: "Small operating business",
                details: [
                  "Delivers: a team you manage",
                  "Your week: managing and selling",
                  "Capital before proof: moderate",
                  "Time to evidence: months",
                ],
              },
              {
                title: "Scalable product or platform",
                details: [
                  "Delivers: software or systems",
                  "Your week: building, then marketing",
                  "Capital before proof: higher",
                  "Time to evidence: long",
                ],
              },
            ],
          },
          { type: "note", text: "Buying an existing business is another route. It changes the capital and the risk, not the questions." },
          { type: "choice-row", label: "Does this business still create the future you described on page 2?", options: ["Yes", "Partly", "No"] },
        ],
      },
      outputs: [
        {
          label: "A business shape that could fit my ambition and desired life",
          blocks: [{ type: "sentence", text: "I could see myself building ______ that earns about ______ a year through ______.", lines: 1 }],
        },
      ],
    },
    {
      kind: "standard",
      id: "page-6",
      page: 6,
      kicker: "Find a direction",
      stage: "direction",
      heading: ["Find where you may have an ", { em: "unusual advantage" }, "."],
      body: [
        "Promising areas appear where four things overlap. Enthusiasm is common. An unusual advantage is not.",
        "Be specific to the point of discomfort. “Mid-sized manufacturers” is a category. “The thirty finance directors I worked with, whose forecasting still lives in spreadsheets” is a place to start.",
      ],
      aside: {
        label: "Claire’s area",
        paragraphs: [
          "I may be unusually well placed to help finance and operations leaders in mid-sized logistics companies address recurring forecasting and planning failures, especially now that demand is harder to predict, because I bring sector knowledge and relationships built over 18 years.",
        ],
      },
      exercise: {
        instruction: "Use names, firms, events and numbers. A category does not count.",
        blocks: [
          {
            type: "quadrants",
            items: [
              { n: 1, label: "People I understand and may be able to reach" },
              { n: 2, label: "A meaningful problem I have repeatedly witnessed" },
              { n: 3, label: "A change making that problem more urgent" },
              { n: 4, label: "An advantage I genuinely own" },
            ],
          },
        ],
      },
      outputs: [
        {
          label: "One or two promising areas to investigate",
          blocks: [
            {
              type: "sentence",
              text: "I may be unusually well placed to help [specific people] address [specific recurring problem], especially now that [relevant change], because I bring [portable advantage].",
            },
            { type: "numbered-lines", count: 2 },
          ],
        },
      ],
      footnote: "Stage 2 complete: you now have My Opportunity Territory (pages 5 and 6).",
    },
    {
      kind: "standard",
      id: "page-7",
      page: 7,
      kicker: "Move toward evidence",
      stage: "evidence",
      heading: ["Separate the ", { em: "opportunity" }, " from the assumptions."],
      body: [
        "An idea is something you could build. An opportunity is an idea that has met reality and survived.",
        "Grade each condition for your leading area. K: known, you have seen it, or someone with money at stake told you. I: inferred, deduced from similar situations. M: imagined, true because you would like it to be. Most areas are mostly imagined at this stage. The risk is not knowing which parts.",
      ],
      aside: {
        label: "Claire’s grades",
        grades: [
          { grade: "K", text: "Buyer: she knows them by name" },
          { grade: "I", text: "Problem matters: seen it, not tested it" },
          { grade: "M", text: "Urgent now" },
          { grade: "M", text: "Willing and able to pay" },
          { grade: "I", text: "Why me: will they engage without her old title?" },
        ],
        closing: "Heaviest imagined: who owns the budget.",
      },
      exercise: {
        instruction:
          "Grade each condition, then add one line on what makes you say so. A compliment is not evidence. Check the economics against the shape you chose on page 5.",
        blocks: [
          {
            type: "matrix",
            caption: "Conditions graded K (known), I (inferred) or M (imagined)",
            rowHeader: "Condition",
            columns: [
              { label: "K", mark: "circle" },
              { label: "I", mark: "circle" },
              { label: "M", mark: "circle" },
              { label: "What makes me say so", mark: "line" },
            ],
            rows: [
              { label: "A buyer I can identify and realistically reach" },
              { label: "A problem that matters enough for action" },
              { label: "A reason the problem is urgent now" },
              { label: "A willingness and ability to pay" },
              { label: "A credible reason to choose me" },
              { label: "The imagined condition carrying the most weight", strong: true, lineOnly: true },
            ],
          },
        ],
      },
      outputs: [
        {
          label: "What I currently believe, and what remains unproven",
          blocks: [{ type: "fields", items: [{ label: "I currently believe" }, { label: "What remains unproven" }] }],
        },
      ],
    },
    {
      kind: "brief",
      id: "page-8",
      page: 8,
      kicker: "Move toward evidence",
      stage: "evidence",
      heading: ["Choose what to test ", { em: "next" }, "."],
      body: [
        "“Do more research” is not a next move. Choose the assumption that could end the direction, then design the cheapest test involving someone with real money or a decision at stake.",
        "A compliment is free. A meeting, an introduction or a deposit costs them something. Decide now what result would change your mind, before you see it.",
      ],
      aside: {
        label: "Claire’s example",
        paragraphs: [
          "Claire’s next test: five structured conversations with former industry contacts, testing the problem, its urgency, budget ownership and current alternatives. Not a pitch. If nobody would pay for diagnosis, she changes the area, not the wording. Within 14 days: book three calls.",
        ],
      },
      direction: {
        label: "My Entrepreneurial Direction",
        hint: "One line from each page.",
        items: [
          { label: "Where I started (my sentence from page 1)", italic: true },
          { label: "The future I want (p.2)" },
          { label: "The role I want (p.3)" },
          { label: "The advantage I genuinely own (p.4)" },
          { label: "The business shape that may fit (p.5)" },
          { label: "The people and problem to investigate (p.6)" },
          { label: "What remains assumed (p.7)" },
          { label: "The evidence I will seek next" },
        ],
      },
      nextMove: {
        label: "My next move",
        items: [
          { label: "What has to be true" },
          { label: "The cheapest credible test" },
          { label: "Who can give meaningful evidence" },
          { label: "A result that would strengthen it" },
          { label: "A result that would make me change or stop" },
          { label: "My action within 14 days, and by when" },
        ],
      },
      footnote: "Stage 3 complete: you now have My Entrepreneurial Direction.",
    },
    {
      kind: "invitation",
      id: "page-9",
      page: 9,
      kicker: "The invitation",
      heading: "You began with “I want to start something, but I don’t know what.”",
      paragraphs: [
        {
          text: "You now have a future you are designing toward, a founder role you understand, an honest view of what you bring, a business shape, a possible opportunity and the next evidence you need.",
        },
        { text: "That is a beginning, not yet a business.", strong: true },
        {
          text: "Business Architecture takes the work further. Together, we can sharpen the opportunity, challenge the assumptions, architect the operating model, build what matters and help make the business exist.",
        },
      ],
      closing: "You remain the entrepreneur. But you do not have to build alone.",
      link: { label: "Continue the conversation →", display: "modernbusinessarchitect.com/lets-talk", href: "/lets-talk" },
      signature: "Martin Dubreuil · The Modern Business Architect",
    },
  ],
};
