// The Customer Architecture Map, as data.
//
// Kept separate from any rendering so the same framework can back the
// Thinking article, a future standalone resource, a PDF export or an
// interactive version without being rewritten.

export type CustomerMapSection = {
  key: string;
  label: string;
  question: string;
  prompts: string;
  // Brief version of the prompts, for printed and PDF versions where the
  // box needs to stay writable.
  cue: string;
};

export const CUSTOMER_ARCHITECTURE_MAP_TITLE = "The Customer Architecture Map";

export const CUSTOMER_ARCHITECTURE_MAP_INSTRUCTION =
  "Fill it in plainly. Mark every line K if you know it from evidence, or A if you are assuming it.";

export const CUSTOMER_ARCHITECTURE_MAP: CustomerMapSection[] = [
  {
    key: "who",
    label: "Who",
    question: "Who are they?",
    prompts:
      "Situation, role, life or business stage. Buyer, user and decision-maker. Demographics only where they change the problem, the behaviour or the ability to buy.",
    cue: "Situation, role, stage. Buyer, user, decision-maker.",
  },
  {
    key: "now",
    label: "Now",
    question: "What is happening in their life or business today?",
    prompts: "Current state. What they do about it today. Workarounds, alternatives, or nothing at all.",
    cue: "Current state. What they do about it today.",
  },
  {
    key: "problem",
    label: "Problem",
    question: "What are they trying to solve, change or achieve?",
    prompts: "How often, how intensely, with what consequence. What they have already tried. What it costs them.",
    cue: "How often, how intense, what it costs. What they've tried.",
  },
  {
    key: "move",
    label: "Move",
    question: "Why would they do something now rather than later?",
    prompts: "Trigger, deadline, change in circumstance. The cost of doing nothing.",
    cue: "The trigger. The deadline. The cost of doing nothing.",
  },
  {
    key: "mind",
    label: "Mind",
    question: "What do they believe, fear, want, question and expect?",
    prompts: "Identity, scepticism, past disappointments. The words they actually use. How their thinking changes along the way.",
    cue: "Beliefs, fears, doubts. Their words, not yours.",
  },
  {
    key: "money",
    label: "Money",
    question: "Can they buy? Will they buy? What represents value to them?",
    prompts: "Budget, authority, approval. What they already spend. Switching cost, risk, competing priorities.",
    cue: "Can they pay? Will they? Who decides?",
  },
  {
    key: "journey",
    label: "Journey",
    question: "What happens between recognising the problem and achieving the outcome?",
    prompts: "Where they stall, loop back, try something else. Where you are likely to meet them.",
    cue: "Where they search, stall, loop and give up.",
  },
  {
    key: "reach",
    label: "Reach",
    question: "Where can we realistically find them and communicate with them?",
    prompts: "What they search for and ask AI. Communities, people they listen to, media, platforms, where they already spend.",
    cue: "Searches, communities, influences, channels.",
  },
  {
    key: "outcome",
    label: "Outcome",
    question: "What are they ultimately trying to get, become, avoid or feel?",
    prompts: "Functional, financial, emotional, social, identity. The thing behind the thing they buy.",
    cue: "What they want to get, become, avoid or feel.",
  },
  {
    key: "not-them",
    label: "Not them",
    question: "Who looks similar but should not be targeted?",
    prompts: "Has the problem but no urgency. Needs it but cannot buy. Too expensive to reach. Needs a different product.",
    cue: "Looks like a fit but isn't. Why not?",
  },
  {
    key: "evidence",
    label: "Evidence",
    question: "What do we know? What are we still assuming?",
    prompts: "Sources behind the K lines. The most dangerous A. The cheapest way to test it next.",
    cue: "The most dangerous A, and how you'll test it.",
  },
];

// Plain-text version of the blank map, for copying into a document or
// straight into the persona prompt.
export function customerArchitectureMapAsText(): string {
  const lines: string[] = [
    CUSTOMER_ARCHITECTURE_MAP_TITLE.toUpperCase(),
    CUSTOMER_ARCHITECTURE_MAP_INSTRUCTION,
    "",
  ];

  CUSTOMER_ARCHITECTURE_MAP.forEach((section, index) => {
    const number = String(index + 1).padStart(2, "0");
    lines.push(`${number} ${section.label.toUpperCase()} — ${section.question}`);
    lines.push(`(${section.prompts})`);
    lines.push("- ");
    lines.push("");
  });

  return lines.join("\n").trimEnd() + "\n";
}
