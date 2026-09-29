/**
 * Deterministic generation of the personalized questions and architectural
 * levers that go into the emailed breakdown. Pure and synchronous — no AI
 * involved. Each function picks from a fixed pool of templates based on the
 * submitted answers, so the same inputs always produce the same output.
 */

import type { InterpretationCategory } from "./config";
import type { NapkinInputs } from "./types";

export type PersonalizationInput = {
  inputs: NapkinInputs;
  interpretationCategory: InterpretationCategory;
  gapExpectedVsRequired: number | null;
  gapCapacityVsRequired: number | null;
  weakestAssumptionField: "sellingPrice" | "directCosts" | "monthlyCosts" | null;
};

export function generatePersonalizedQuestions(input: PersonalizationInput): string[] {
  const { inputs } = input;
  const questions: string[] = [];

  // 1. Targets the weakest-supported figure directly.
  if (input.weakestAssumptionField === "sellingPrice") {
    questions.push("Is the expected average selling price supported by evidence from real prospective customers, or is it currently a guess?");
  } else if (input.weakestAssumptionField === "directCosts") {
    questions.push("Which direct cost is most likely to rise as transaction volume grows, and has that cost actually been measured rather than estimated?");
  } else if (input.weakestAssumptionField === "monthlyCosts") {
    questions.push("Which monthly commitment is the least certain right now, and what would it take to pin it down before relying on it?");
  } else {
    questions.push(`What real evidence currently supports the price, direct cost and monthly cost figures used in this calculation?`);
  }

  // 2. Targets reachability / whether the intended channel can produce the volume.
  if (inputs.reachability === "not_yet" || inputs.reachability === "dont_know") {
    questions.push("Are enough reachable customers actually identifiable through the intended location, channel or sales process to produce the required monthly volume?");
  } else {
    questions.push("Can the intended location or channel produce the required monthly volume during an ordinary month — not a best month?");
  }

  // 3. Targets whichever side of the gap is more binding: demand or delivery capacity.
  const gapExpected = input.gapExpectedVsRequired;
  const gapCapacity = input.gapCapacityVsRequired;
  const capacityIsBinding = gapExpected !== null && gapCapacity !== null && gapCapacity < gapExpected;

  if (capacityIsBinding) {
    questions.push("Can the business deliver the required monthly volume without increasing labour, headcount or operating costs?");
  } else {
    questions.push("What must happen upstream — in awareness, traffic, referrals or outreach — to create the required monthly volume?");
  }

  return questions;
}

export function generateArchitecturalLevers(input: PersonalizationInput): string[] {
  const { inputs } = input;
  const levers: string[] = [];

  const contributionWeak = input.interpretationCategory === "fragile" || input.interpretationCategory === "possible_with_changes";
  const gapExpected = input.gapExpectedVsRequired;
  const gapCapacity = input.gapCapacityVsRequired;
  const capacityIsBinding = gapExpected !== null && gapCapacity !== null && gapCapacity < gapExpected;
  const demandIsBinding = gapExpected !== null && gapCapacity !== null && gapExpected < gapCapacity;

  if (contributionWeak) {
    levers.push("The average selling price per transaction");
    levers.push("The direct cost of producing, delivering or supporting one transaction");
  }

  levers.push("The fixed monthly cost of keeping the business running");

  if (capacityIsBinding || inputs.capacityUnits) {
    levers.push(inputs.capacityUnitLabel ? `The number of ${inputs.capacityUnitLabel} available to deliver` : "The available delivery capacity (people, seats, locations or hours)");
  }

  if (demandIsBinding) {
    levers.push("The location, channel or sales process used to reach customers");
    levers.push("How often an existing customer buys again (repeat purchase, not just first purchase)");
  }

  levers.push("The format of the offer itself — what is sold, to whom, and how it is delivered");

  // Keep it to a focused, non-overwhelming list.
  return Array.from(new Set(levers)).slice(0, 5);
}
