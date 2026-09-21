/**
 * THE BUSINESS IDEA REALITY CHECK — deterministic assessment configuration.
 *
 * Source of truth: "The Business Idea Reality Check — Assessment, Scoring &
 * Interpretation Framework v1.0" (master spec). This file encodes the
 * questions, answer options, exact point values and dimension mapping
 * verbatim from that document. It is intentionally NOT editable through the
 * CMS/Admin — scoring, contradiction logic and LLM interpretation are
 * structurally coupled, and arbitrary editing here would silently break the
 * assessment (per the spec's own "Admin / CMS decision").
 *
 * Bump ASSESSMENT_VERSION whenever this file's methodology changes; every
 * stored assessment row carries the version it was scored under.
 */

export const ASSESSMENT_VERSION = "business-idea-reality-check-v1.0";

// ============================================================
// STAGE (context question C5) — not scored, but drives stage sensitivity
// ============================================================

export const STAGE_OPTIONS = [
  { code: "A", label: "Idea" },
  { code: "B", label: "Researching / talking to customers" },
  { code: "C", label: "Testing concept / prototype / manual version" },
  { code: "D", label: "MVP / product / service, no paying customers" },
  { code: "E", label: "First paying customers" },
  { code: "F", label: "Operating and improving / growing" },
] as const;

export type StageCode = (typeof STAGE_OPTIONS)[number]["code"];

const STAGE_ORDER: Record<StageCode, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };

export function stageAtLeast(stage: StageCode, threshold: StageCode) {
  return STAGE_ORDER[stage] >= STAGE_ORDER[threshold];
}

// ============================================================
// QUESTIONS
// ============================================================

export type ClosedChoiceOption = { value: string; label: string; points: number };

export type ClosedQuestion = {
  code: string;
  kind: "closed";
  dimension: DimensionKey;
  prompt: string;
  helper?: string;
  maxPoints: number;
  options: ClosedChoiceOption[];
};

/** Rubric level → points, for open-answer questions the LLM classifies. */
export type OpenRubricLevel = { level: number; description: string };

export type OpenQuestion = {
  code: string;
  kind: "open";
  dimension: DimensionKey;
  prompt: string;
  helper?: string;
  example?: string;
  maxPoints: number;
  rubric: OpenRubricLevel[];
};

export type AssessmentQuestion = ClosedQuestion | OpenQuestion;

export type DimensionKey =
  | "problem"
  | "customer"
  | "purchase"
  | "market_economic"
  | "real_world";

export const DIMENSIONS: Record<
  DimensionKey,
  { name: string; questionCodes: string[]; maxPoints: number }
> = {
  problem: { name: "Problem Reality", questionCodes: ["q01", "q02", "q04"], maxPoints: 18 },
  customer: { name: "Customer Reality", questionCodes: ["q03", "q05", "q06"], maxPoints: 22 },
  purchase: { name: "Purchase Reality", questionCodes: ["q07", "q08", "q09"], maxPoints: 25 },
  market_economic: {
    name: "Market & Economic Reality",
    questionCodes: ["q10", "q11", "q12"],
    maxPoints: 22,
  },
  real_world: { name: "Real-World Evidence", questionCodes: ["q13"], maxPoints: 13 },
};

export const OVERALL_MAX_SCORE = 100;

export const QUESTIONS: AssessmentQuestion[] = [
  {
    code: "q01",
    kind: "open",
    dimension: "problem",
    prompt: "What problem are you actually solving?",
    helper: "Describe the problem without describing your product or solution.",
    example:
      'Instead of "I\'m building an AI platform for consultants," try "Independent consultants lose potential business because they don\'t consistently follow up with prospects."',
    maxPoints: 5,
    rubric: [
      { level: 0, description: "Undefined" },
      { level: 1, description: "Solution disguised as problem" },
      { level: 3, description: "Genuine but general problem" },
      { level: 5, description: "Specific problem, context and consequence without relying on solution" },
    ],
  },
  {
    code: "q02",
    kind: "closed",
    dimension: "problem",
    prompt: "How much does this problem actually matter?",
    maxPoints: 8,
    options: [
      { value: "A", label: "Useful or nice to solve; most people can live with it.", points: 2 },
      {
        value: "B",
        label: "Noticeable frustration, wasted time, lost money, missed opportunity, or another meaningful consequence.",
        points: 5,
      },
      { value: "C", label: "Significant recurring consequence and a strong reason to change something now.", points: 8 },
      { value: "D", label: "I don't know yet.", points: 0 },
    ],
  },
  {
    code: "q03",
    kind: "open",
    dimension: "customer",
    prompt: "Who has this problem most strongly?",
    helper: "Describe the first group of people or businesses that experiences it most strongly.",
    example:
      'Instead of "Small businesses," try "Owner-run restaurants experiencing sustained weak weekday traffic and already trying promotions that are not working."',
    maxPoints: 5,
    rubric: [
      { level: 0, description: "Undefined" },
      { level: 1, description: 'Extremely broad ("everyone")' },
      { level: 3, description: "Recognizable category" },
      { level: 5, description: "Recognizable first customer in context" },
    ],
  },
  {
    code: "q04",
    kind: "closed",
    dimension: "problem",
    prompt: "Why would they do something about it now?",
    maxPoints: 5,
    options: [
      { value: "A", label: "No particular reason; it can probably wait.", points: 1 },
      { value: "B", label: "Circumstances make it more important at certain moments.", points: 3 },
      { value: "C", label: "A specific identifiable trigger makes solving it timely or urgent.", points: 5 },
      { value: "D", label: "I don't know yet.", points: 0 },
    ],
  },
  {
    code: "q05",
    kind: "open",
    dimension: "customer",
    prompt: "What are these people doing about the problem today?",
    helper:
      "Tell us what they currently do instead of buying your solution. Include doing nothing if that is the reality: another product, spreadsheet, manual work, hiring, asking friends, building internally, tolerating it, or nothing.",
    maxPoints: 7,
    rubric: [
      { level: 0, description: "Unknown" },
      { level: 1, description: "Assumed" },
      { level: 3, description: "Known alternative" },
      { level: 5, description: "Observable effort / workaround / spending" },
      { level: 7, description: "Demonstrated costly behaviour" },
    ],
  },
  {
    code: "q06",
    kind: "closed",
    dimension: "customer",
    prompt: "What evidence do you have that this problem really exists beyond your own experience?",
    maxPoints: 10,
    options: [
      { value: "A", label: "Mainly my own experience, observation, or belief.", points: 2 },
      { value: "B", label: "Research, industry data, or other external sources support it.", points: 5 },
      { value: "C", label: "I have spoken directly with or observed intended customers and repeatedly encountered it.", points: 8 },
      {
        value: "D",
        label: "I have behavioural evidence: people are already actively trying, spending, or changing something because of it.",
        points: 10,
      },
      { value: "E", label: "I have not investigated this yet.", points: 0 },
    ],
  },
  {
    code: "q07",
    kind: "closed",
    dimension: "purchase",
    prompt: "What evidence do you have that people would pay for a solution?",
    maxPoints: 12,
    options: [
      { value: "A", label: "I believe they would pay because it is useful or valuable.", points: 1 },
      { value: "B", label: "Potential customers say they would consider paying.", points: 4 },
      {
        value: "C",
        label: "People have taken a meaningful step toward buying: requested pricing, joined a paid pilot, pre-ordered, paid a deposit, signed an agreement, or made another real commitment.",
        points: 9,
      },
      { value: "D", label: "Customers have already paid.", points: 12 },
      { value: "E", label: "I have not tested this yet.", points: 0 },
    ],
  },
  {
    code: "q08",
    kind: "closed",
    dimension: "purchase",
    prompt: "Can your intended customer realistically afford and approve the purchase?",
    maxPoints: 7,
    options: [
      { value: "A", label: "I have not investigated budget, purchasing capacity, or decision process.", points: 0 },
      { value: "B", label: "I have a reasonable idea of affordability and who decides.", points: 3 },
      { value: "C", label: "I have evidence that budget exists near my intended price and understand when and how they buy.", points: 6 },
      { value: "D", label: "Customers have already purchased at or near that level.", points: 7 },
    ],
  },
  {
    code: "q09",
    kind: "open",
    dimension: "purchase",
    prompt: "Why would someone choose this instead of what they already do?",
    helper:
      "What would make changing worth the money, effort, risk, inconvenience, or disruption? Answer from the customer's perspective rather than simply saying the solution is better.",
    maxPoints: 6,
    rubric: [
      { level: 0, description: "Unknown" },
      { level: 1, description: "Founder-centric superiority" },
      { level: 3, description: "Customer benefit" },
      { level: 5, description: "Credible switching proposition" },
      { level: 6, description: "Evidence-supported switching" },
    ],
  },
  {
    code: "q10",
    kind: "closed",
    dimension: "market_economic",
    prompt: "How well do you understand the market you could realistically serve?",
    maxPoints: 8,
    options: [
      { value: "A", label: "Broad industry/global figures, general statistics, or rough assumptions.", points: 2 },
      { value: "B", label: "Relevant market researched and narrowed by customer type, geography, behaviour, or other real constraints.", points: 5 },
      { value: "C", label: "I can estimate relevant customers I could realistically reach and explain the basis.", points: 8 },
      { value: "D", label: "I have not sized the market yet.", points: 0 },
    ],
  },
  {
    code: "q11",
    kind: "closed",
    dimension: "market_economic",
    prompt: "Do you understand the economics of one sale?",
    maxPoints: 6,
    options: [
      { value: "A", label: "Not yet.", points: 0 },
      { value: "B", label: "I have estimated price, but not the full cost of acquiring and delivering it.", points: 2 },
      { value: "C", label: "I have estimated price, direct costs, and approximately what remains per transaction.", points: 5 },
      { value: "D", label: "I have actual transaction data from customers.", points: 6 },
    ],
  },
  {
    code: "q12",
    kind: "closed",
    dimension: "market_economic",
    prompt: "Do you know how many sales or customers the business would need to sustain itself?",
    maxPoints: 8,
    options: [
      { value: "A", label: "I have not calculated this yet.", points: 0 },
      { value: "B", label: "I have a rough revenue target, but not required transactions/customers.", points: 2 },
      { value: "C", label: "I know approximate required profitable volume and believe market and operation can support it.", points: 6 },
      { value: "D", label: "I have tested this against actual sales, traffic, conversion, capacity, or operating data.", points: 8 },
    ],
  },
  {
    code: "q13",
    kind: "closed",
    dimension: "real_world",
    prompt: "How far has this idea touched reality?",
    maxPoints: 13,
    options: [
      { value: "A", label: "It mostly exists in my head, notes, research, or planning.", points: 0 },
      { value: "B", label: "I have shown or discussed it with potential customers and gathered reactions.", points: 3 },
      { value: "C", label: "Potential customers have experienced real value: prototype, manual service, pilot, test, workshop, sample, or similar.", points: 7 },
      { value: "D", label: "Someone has paid for or made a meaningful commitment to the real experience.", points: 11 },
      { value: "E", label: "The business is already operating with customers.", points: 13 },
    ],
  },
];

export const QUESTION_BY_CODE: Record<string, AssessmentQuestion> = Object.fromEntries(
  QUESTIONS.map((q) => [q.code, q])
);

export const OPEN_QUESTION_CODES = QUESTIONS.filter((q) => q.kind === "open").map((q) => q.code);
export const CLOSED_QUESTION_CODES = QUESTIONS.filter((q) => q.kind === "closed").map((q) => q.code);

// ============================================================
// BANDS
// ============================================================

export type Band = { min: number; max: number; label: string; description: string };

/** Dimension bands (0-100 normalized). Never call the top band "validated". */
export const DIMENSION_BANDS: Band[] = [
  { min: 0, max: 29, label: "Mostly Unknown", description: "Important parts remain unsupported or unexplored." },
  { min: 30, max: 54, label: "Assumption-Heavy", description: "Some support exists, but major parts depend on assumptions." },
  { min: 55, max: 74, label: "Developing Evidence", description: "Meaningful evidence exists, with important uncertainties remaining." },
  { min: 75, max: 100, label: "Stronger Evidence", description: "Multiple meaningful signals support this part of the business case." },
];

/** Overall score bands (0-100 raw). */
export const OVERALL_BANDS: Band[] = [
  { min: 0, max: 29, label: "Early Evidence", description: "Much of the business case is unknown or assumption-based." },
  { min: 30, max: 49, label: "Some Signals", description: "Early support exists; important parts remain untested." },
  { min: 50, max: 69, label: "Developing Case", description: "Several elements are supported alongside meaningful exposures or unknowns." },
  { min: 70, max: 84, label: "Substantial Evidence", description: "A significant part is supported; remaining exposures require attention." },
  { min: 85, max: 100, label: "Strong Evidence Base", description: "Substantial support exists across several dimensions and real-world interaction." },
];

export function bandFor(bands: Band[], value: number): Band {
  return bands.find((b) => value >= b.min && value <= b.max) ?? bands[0];
}

// ============================================================
// EVIDENCE HIERARCHY / DIRECTION / TAGS
// ============================================================

export const EVIDENCE_LEVELS = [
  "unknown",
  "assumption",
  "supporting",
  "direct",
  "behavioural_commercial",
] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

export const EVIDENCE_TAGS = [
  "ASSUMPTION",
  "EXTERNAL_SUPPORT",
  "DIRECT_EVIDENCE",
  "BEHAVIOURAL_EVIDENCE",
  "COMMERCIAL_EVIDENCE",
  "UNKNOWN",
  "NEGATIVE_EVIDENCE",
  "CONTRADICTORY_EVIDENCE",
] as const;
export type EvidenceTag = (typeof EVIDENCE_TAGS)[number];

export const EVIDENCE_DIRECTIONS = ["POSITIVE", "UNKNOWN", "NEGATIVE", "CONTRADICTORY"] as const;
export type EvidenceDirection = (typeof EVIDENCE_DIRECTIONS)[number];

export const MATERIAL_NEGATIVE_EVIDENCE_CATEGORIES = [
  "REPEATED_QUALIFIED_REJECTION",
  "CONSISTENT_PRICE_REFUSAL",
  "PROBLEM_RARELY_EXPERIENCED",
  "IMPOSSIBLE_REQUIRED_VOLUME",
  "REPEATED_ABANDONMENT_AFTER_TRIAL",
  "ORDINARY_ECONOMICS_LOSE_MONEY",
] as const;
export type MaterialNegativeEvidenceCategory = (typeof MATERIAL_NEGATIVE_EVIDENCE_CATEGORIES)[number];

// ============================================================
// CRITICAL-GAP FLAGS
// ============================================================

export const CRITICAL_GAP_FLAGS = [
  "WEAK_PROBLEM_TENSION",
  "CUSTOMER_EVIDENCE_GAP",
  "PURCHASE_EVIDENCE_GAP",
  "MARKET_REALITY_GAP",
  "ECONOMIC_VISIBILITY_GAP",
  "REALITY_GAP",
] as const;
export type CriticalGapFlag = (typeof CRITICAL_GAP_FLAGS)[number];

export const CRITICAL_GAP_FLAG_TEXT: Record<CriticalGapFlag, string> = {
  WEAK_PROBLEM_TENSION: "Problem may not create enough tension for meaningful change.",
  CUSTOMER_EVIDENCE_GAP: "Founder belief is carrying a hypothesis beyond the appropriate stage.",
  PURCHASE_EVIDENCE_GAP: "Material commitment exists without strong commercial evidence.",
  MARKET_REALITY_GAP: "Market case relies on broad figures, assumptions or unknowns.",
  ECONOMIC_VISIBILITY_GAP: "Commercial activity lacks sufficient visibility into sustainability.",
  REALITY_GAP: "Development commitment has outpaced equivalent real-world exposure.",
};

// ============================================================
// CONTRADICTION FLAGS
// ============================================================

export const CONTRADICTION_FLAGS = [
  "PROBLEM_TENSION_WITHOUT_BEHAVIOUR",
  "STATED_WILLINGNESS_NO_COMMITMENT",
  "MARKET_UNDERSTANDING_WITHOUT_CUSTOMER",
  "ECONOMICS_WITHOUT_PURCHASE_EVIDENCE",
  "WEAK_THEORY_STRONG_REALITY",
] as const;
export type ContradictionFlag = (typeof CONTRADICTION_FLAGS)[number];

export const CONTRADICTION_FLAG_TEXT: Record<ContradictionFlag, string> = {
  PROBLEM_TENSION_WITHOUT_BEHAVIOUR:
    "The problem is described as significant and urgent, but there is no evidence anyone has done anything about it yet.",
  STATED_WILLINGNESS_NO_COMMITMENT:
    "Customers say they would consider paying, but the idea has not reached any real commitment.",
  MARKET_UNDERSTANDING_WITHOUT_CUSTOMER:
    "The reachable market is well understood, but the first customer is not clearly defined.",
  ECONOMICS_WITHOUT_PURCHASE_EVIDENCE:
    "Transaction economics or required volume are worked out in detail, but there is little evidence people will actually pay.",
  WEAK_THEORY_STRONG_REALITY:
    "The formal case (problem definition, customer specificity or market sizing) is weak, yet the idea has meaningfully touched reality. Behaviour can be stronger than explanation — worth understanding why before treating this as a weakness.",
};

// ============================================================
// PRIORITY INVESTIGATION — recommended next action per dimension
// ============================================================

/**
 * Verbatim from the master spec's "Selecting diagnostic priorities" table,
 * which lists five conditions (problem / purchase / market / economics /
 * reality) but does not explicitly cover the "Customer Reality" dimension.
 * The `customer` entry below is our own addition, modeled directly on the
 * spec's Q03/Q05 assessment intents (customer specificity + existing
 * behaviour) — flagged here as a disclosed gap-fill, not silently invented.
 */
export const PRIORITY_INVESTIGATION_ACTIONS: Record<DimensionKey | "market" | "economics", string> = {
  problem: "Speak with 8–10 people matching the first-customer definition. Ask when it last occurred, what happened and what they did.",
  customer:
    "Identify a specific, recognizable first-customer segment and confirm — through direct conversation, not assumption — what they actually do about this today.",
  purchase: "Put a real offer and real price before qualified customers. Measure commitment, not compliments.",
  market: "Build a bottom-up estimate from the specific customer you can realistically reach.",
  economics: "Calculate price, direct delivery cost, acquisition cost and contribution for one ordinary transaction.",
  market_economic: "Build a bottom-up estimate from the specific customer you can realistically reach, then calculate price, direct delivery cost, acquisition cost and contribution for one ordinary transaction.",
  real_world: "Create the smallest real experience a customer can interact with in the next 30 days.",
};
