/**
 * THE NAPKIN PRINCIPLE — configuration and shared constants.
 *
 * Governing statement: "A business is not viable because one transaction is
 * profitable. It is viable because enough profitable transactions can
 * realistically happen." This is a preliminary commercial-arithmetic
 * exercise, not a complete financial forecast or a promise of viability.
 *
 * Bump FORM_VERSION when the question set/copy changes in a way that
 * affects what was asked. Bump CALCULATION_VERSION when the formulas or
 * interpretation thresholds in calculations.ts / interpretation.ts change.
 * They are tracked separately (and stored separately on every submission)
 * because the two can change independently of each other.
 */

export const FORM_VERSION = "napkin-principle-v1.1";
export const CALCULATION_VERSION = "napkin-calc-v1.1";

export const BUSINESS_STAGES = [
  { value: "idea", label: "An idea" },
  { value: "preparing", label: "A business being prepared" },
  { value: "operating", label: "An operating business" },
] as const;
export type BusinessStage = (typeof BUSINESS_STAGES)[number]["value"];

/** Common currencies. Currency choice affects display formatting only — no exchange rates are applied anywhere in this feature. */
export const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "NZD", label: "New Zealand Dollar (NZD)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "SEK", label: "Swedish Krona (SEK)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]];

export const DIRECT_COST_CATEGORY_PRESETS = [
  "Materials or product cost",
  "Direct labour",
  "Packaging",
  "Delivery or fulfilment",
  "Payment or platform fees",
  "Sales commission",
  "Customer acquisition",
  "Support",
  "Waste, refunds, or rework",
] as const;

export const MONTHLY_COST_CATEGORY_PRESETS = [
  "Salaries",
  "Founder's required income",
  "Rent or premises",
  "Utilities",
  "Software",
  "Insurance",
  "Equipment or vehicle commitments",
  "Basic marketing",
  "Accounting and administration",
  "Financing",
  "Professional fees",
] as const;

export const CONFIDENCE_LEVELS = [
  { value: "supported", label: "Supported by existing results or direct evidence" },
  { value: "informed_estimate", label: "Based on informed estimates" },
  { value: "mostly_assumption", label: "Mostly an assumption" },
  { value: "dont_know", label: "I do not know yet" },
] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]["value"];
export const CONFIDENCE_VALUES = CONFIDENCE_LEVELS.map((c) => c.value) as [ConfidenceLevel, ...ConfidenceLevel[]];

/** Fixed ranking used to pick the single "weakest assumption" when several confidence answers tie. Lower index = weaker. */
export const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  dont_know: 0,
  mostly_assumption: 1,
  informed_estimate: 2,
  supported: 3,
};

export const SEASONALITY_OPTIONS = [
  { value: "not_seasonal", label: "No, demand is fairly steady" },
  { value: "somewhat_seasonal", label: "Somewhat — there are slower and busier periods" },
  { value: "highly_seasonal", label: "Yes, demand swings significantly by season" },
  { value: "dont_know", label: "I don't know yet" },
] as const;
export type SeasonalityAnswer = (typeof SEASONALITY_OPTIONS)[number]["value"];
export const SEASONALITY_VALUES = SEASONALITY_OPTIONS.map((s) => s.value) as [SeasonalityAnswer, ...SeasonalityAnswer[]];

export const REACHABILITY_OPTIONS = [
  { value: "yes_clearly", label: "Yes — enough reachable customers are clearly identifiable" },
  { value: "partially", label: "Partially — some are reachable, some are not yet confirmed" },
  { value: "not_yet", label: "Not yet established" },
  { value: "dont_know", label: "I don't know yet" },
] as const;
export type ReachabilityAnswer = (typeof REACHABILITY_OPTIONS)[number]["value"];
export const REACHABILITY_VALUES = REACHABILITY_OPTIONS.map((r) => r.value) as [ReachabilityAnswer, ...ReachabilityAnswer[]];

export const INTERPRETATION_CATEGORIES = [
  "not_enough_evidence",
  "coherent",
  "tight",
  "possible_with_changes",
  "fragile",
] as const;
export type InterpretationCategory = (typeof INTERPRETATION_CATEGORIES)[number];

export const INTERPRETATION_LABELS: Record<InterpretationCategory, string> = {
  not_enough_evidence: "Not enough evidence yet",
  coherent: "Economically coherent at first view",
  tight: "Potentially workable, but tight",
  possible_with_changes: "Possible only with specific changes",
  fragile: "Economically fragile in its current form",
};

export const PRELIMINARY_DISCLAIMER =
  "This is a preliminary arithmetic screen based entirely on the information you entered. It does not validate customer demand, verify your assumptions, model cash flow, account for tax, or replace professional financial advice.";

export const GOVERNING_STATEMENT =
  "A business is not viable because one transaction is profitable. It is viable because enough profitable transactions can realistically happen.";

/** Coffee-shop worked example — static reference content, no calculation dependency. */
export const COFFEE_SHOP_EXAMPLE = {
  transaction: {
    price: 4.0,
    costs: [
      { label: "Beans", amount: 0.45 },
      { label: "Milk", amount: 0.35 },
      { label: "Cup and lid", amount: 0.3 },
      { label: "Card fee", amount: 0.12 },
      { label: "Waste and remakes", amount: 0.18 },
      { label: "Loyalty discount", amount: 0.25 },
    ],
    totalDirectCost: 1.65,
    moneyRemaining: 2.35,
  },
  month: {
    costs: [
      { label: "Salaries", amount: 9200 },
      { label: "Rent", amount: 3600 },
      { label: "Owner income", amount: 3400 },
      { label: "Utilities", amount: 620 },
      { label: "Maintenance", amount: 500 },
      { label: "Equipment lease", amount: 480 },
      { label: "Accounting and administration", amount: 340 },
      { label: "Cleaning and waste", amount: 260 },
      { label: "Insurance", amount: 210 },
      { label: "Internet and software", amount: 190 },
    ],
    total: 18800,
  },
  tradingDaysPerMonth: 25,
  openingHoursPerDay: 11,
  requiredPerMonth: 8000,
  requiredPerDay: 320,
  requiredPerHour: 29,
  streetCapacityPerDay: 100,
  conclusion: "The coffee is profitable. The proposed business is not.",
} as const;
