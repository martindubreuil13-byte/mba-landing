/**
 * THE NAPKIN PRINCIPLE — deterministic interpretation logic.
 *
 * Translates the calculated survival number and the reality-check answers
 * (step 6) into one of five fixed categories, per the spec's own
 * definitions. No AI is used anywhere in this decision — every branch below
 * is a plain, disclosed threshold. Where the spec describes a category
 * qualitatively without numbers ("close to", "material gap", "mostly
 * unknown assumptions"), the specific threshold chosen is documented inline
 * as a judgment call, the same convention used in the Business Idea Reality
 * Check's scoring engine.
 */

import { CONFIDENCE_RANK, type ConfidenceLevel, type InterpretationCategory } from "./config";
import type { InterpretationResult } from "./types";

export type InterpretationInput = {
  moneyRemainingPerTransaction: number;
  requiredPerMonthExact: number | null;
  expectedMonthlyVolume: number | null;
  maxMonthlyCapacity: number | null;
  gapExpectedVsRequired: number | null;
  gapCapacityVsRequired: number | null;
  priceConfidence: ConfidenceLevel | null;
  directCostConfidence: ConfidenceLevel | null;
  monthlyCostConfidence: ConfidenceLevel | null;
};

const WEAK_CONFIDENCE: ConfidenceLevel[] = ["mostly_assumption", "dont_know"];

/**
 * Picks the single least-supported of the three confidence answers. Ties
 * are broken by a fixed priority (monthly cost > direct cost > price),
 * since an unsupported fixed-cost figure typically drives more error in the
 * survival number than an unsupported price does. Returns null only when
 * none of the three answers were given at all.
 */
export function selectWeakestAssumption(input: {
  priceConfidence: ConfidenceLevel | null;
  directCostConfidence: ConfidenceLevel | null;
  monthlyCostConfidence: ConfidenceLevel | null;
}): InterpretationResult["weakestAssumption"] {
  const candidates: { field: "sellingPrice" | "directCosts" | "monthlyCosts"; label: string; level: ConfidenceLevel | null }[] = [
    { field: "monthlyCosts", label: "The monthly operating cost", level: input.monthlyCostConfidence },
    { field: "directCosts", label: "The direct cost per transaction", level: input.directCostConfidence },
    { field: "sellingPrice", label: "The selling price", level: input.priceConfidence },
  ];

  const withLevel = candidates.filter((c): c is typeof c & { level: ConfidenceLevel } => c.level !== null);
  if (withLevel.length === 0) {
    return { field: null, label: "No confidence level was recorded for price, direct costs or monthly costs.", level: null };
  }

  let weakest = withLevel[0];
  for (const c of withLevel.slice(1)) {
    if (CONFIDENCE_RANK[c.level] < CONFIDENCE_RANK[weakest.level]) weakest = c;
  }
  return weakest;
}

export function classifyInterpretation(input: InterpretationInput): InterpretationResult {
  const weakestAssumption = selectWeakestAssumption(input);

  // The transaction itself never breaks even — no volume, however large,
  // fixes that. This overrides every other signal.
  if (input.moneyRemainingPerTransaction <= 0) {
    return {
      category: "fragile",
      summary:
        "Money remaining per transaction is zero or negative, so no realistic volume of this transaction can cover the monthly cost of existing. The transaction economics need to change before volume is the question worth asking.",
      weakestAssumption,
    };
  }

  const confidences = [input.priceConfidence, input.directCostConfidence, input.monthlyCostConfidence];
  const missingConfidence = confidences.filter((c) => c === null).length;
  const weakConfidenceCount = confidences.filter((c) => c !== null && WEAK_CONFIDENCE.includes(c)).length;
  const essentialInputsMissing =
    input.requiredPerMonthExact === null ||
    input.expectedMonthlyVolume === null ||
    input.maxMonthlyCapacity === null;

  // "Essential inputs missing" or "principal figures are mostly unknown
  // assumptions": read as either any of the three top-level figures being
  // absent, or at least two of the three confidence answers landing on
  // "mostly an assumption" / "I do not know yet".
  if (essentialInputsMissing || missingConfidence + weakConfidenceCount >= 2) {
    return {
      category: "not_enough_evidence",
      summary:
        "Too much of this rests on assumption rather than evidence right now — either a key figure hasn't been entered, or the price, direct costs or monthly costs are mostly guesses. The arithmetic can't say more than the inputs support.",
      weakestAssumption,
    };
  }

  const gapExpected = input.gapExpectedVsRequired as number;
  const gapCapacity = input.gapCapacityVsRequired as number;
  const bindingGap = Math.min(gapExpected, gapCapacity);
  const allConfidenceStrong = confidences.every((c) => c === "supported" || c === "informed_estimate");

  // Capacity headroom above the requirement counts as "only slightly
  // above" (per spec) when it's under 1.15x AND capacity is more binding
  // than expected volume — i.e. capacity, not demand, is the thin margin.
  // The strict `>` keeps the case where expected volume and capacity land
  // on the requirement together (e.g. both exactly 1.0x) out of this
  // branch and into "coherent" below, since there both figures simply meet
  // the number precisely rather than one being uniquely tight.
  const capacityBarelyAbove = gapCapacity >= 1.0 && gapCapacity < 1.15 && gapExpected > gapCapacity;

  // Expected volume and delivery capacity both meet or exceed the survival
  // number, capacity isn't the thin-margin case above, and the inputs
  // behind the number are reasonably supported.
  if (bindingGap >= 1.0 && allConfidenceStrong && !capacityBarelyAbove) {
    return {
      category: "coherent",
      summary:
        "Expected volume and delivery capacity both meet or exceed the survival number, and the figures behind it are reasonably supported. This is a coherent starting case, not proof the business will work.",
      weakestAssumption,
    };
  }

  // Close to the requirement (0.85–1.0x, read as "close"); capacity with
  // only slim headroom above it; or volume comfortably covers the
  // requirement but exactly one of the three confidence answers is weak
  // (two or more would already have triggered "not enough evidence" above)
  // — the number works today, but there isn't much room for that one
  // assumption to be wrong.
  if ((bindingGap >= 0.85 && bindingGap < 1.0) || capacityBarelyAbove || (bindingGap >= 1.0 && !allConfidenceStrong)) {
    return {
      category: "tight",
      summary:
        "Expected volume or delivery capacity is close to the survival number, with little margin for error. A small shortfall in either would be enough to miss it.",
      weakestAssumption,
    };
  }

  // Meaningful but plausibly closeable gap.
  if (bindingGap >= 0.4 && bindingGap < 0.85) {
    return {
      category: "possible_with_changes",
      summary:
        "There is a real gap between what's required and what's expected or deliverable, but it sits in a range that identifiable changes — price, direct cost, fixed cost, capacity, location or delivery model — could plausibly close.",
      weakestAssumption,
    };
  }

  // bindingGap < 0.4
  return {
    category: "fragile",
    summary:
      "Expected volume or maximum delivery capacity is materially below the survival number. As currently architected, the required volume does not look reachable.",
    weakestAssumption,
  };
}

export function isValidInterpretationCategory(value: string): value is InterpretationCategory {
  return (
    value === "not_enough_evidence" ||
    value === "coherent" ||
    value === "tight" ||
    value === "possible_with_changes" ||
    value === "fragile"
  );
}
