/**
 * THE NAPKIN PRINCIPLE — deterministic calculation engine.
 *
 * Every function here is pure and synchronous. Nothing in this file calls
 * an LLM, reads from a database, or depends on request/response objects —
 * that is deliberate, so the formulas can be unit-tested in isolation (see
 * calculations.test.ts) and so the server route can recompute everything
 * from raw inputs rather than trusting client-calculated numbers.
 *
 * Rounding rule (per spec): required-transaction figures are rounded UP
 * (Math.ceil) to the next whole transaction for display. The unrounded
 * figure is preserved internally and used as the basis for every derived
 * unit (per day/hour/capacity-unit) — each of those is independently
 * ceiled from the exact monthly figure rather than from an already-rounded
 * number, so rounding error never compounds across units.
 */

import type { CostLineItem, ContributionResult, NapkinCalculationResult, ObservableUnits, SurvivalNumberResult } from "./types";

/** True for finite, non-negative numbers — the only amounts this module treats as real money. */
function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Sums line-item amounts, defensively. Invalid entries (negative, NaN,
 * Infinity, non-numeric) are treated as 0 rather than propagated — this is
 * a last line of defense; the API route rejects negative/invalid amounts
 * outright before they ever reach this function, but the calculation
 * module must never produce NaN/Infinity even if called directly with bad
 * data (e.g. from a test, or a future caller).
 */
export function currencyMinorUnitDigits(currency = "USD"): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

function moneyFactor(currency: string): number {
  return 10 ** currencyMinorUnitDigits(currency);
}

function toMinorUnits(value: unknown, currency: string): number {
  return isValidAmount(value) ? Math.round(value * moneyFactor(currency)) : 0;
}

function fromMinorUnits(value: number, currency: string): number {
  return value / moneyFactor(currency);
}

export function sumLineItems(items: CostLineItem[], currency = "USD"): number {
  const minorUnits = items.reduce((sum, item) => sum + toMinorUnits(item.amount, currency), 0);
  return fromMinorUnits(minorUnits, currency);
}

/**
 * Selling price → money remaining per transaction.
 *
 * contributionPercent is null when sellingPrice <= 0, since "remaining as a
 * percentage of price" is not a meaningful figure with no price. This is
 * one of the explicit invalid states the flow must display gracefully
 * rather than compute (a zero price is rejected at the input-validation
 * layer; this function only needs to not blow up if it ever sees one).
 */
export function computeContribution(sellingPrice: number, directCostItems: CostLineItem[], currency = "USD"): ContributionResult {
  const priceMinor = toMinorUnits(sellingPrice, currency);
  const directCostMinor = directCostItems.reduce((sum, item) => sum + toMinorUnits(item.amount, currency), 0);
  const price = fromMinorUnits(priceMinor, currency);
  const totalDirectCost = fromMinorUnits(directCostMinor, currency);
  const moneyRemainingPerTransaction = fromMinorUnits(priceMinor - directCostMinor, currency);
  const contributionPercent = price > 0 ? round1((moneyRemainingPerTransaction / price) * 100) : null;

  return { totalDirectCost, moneyRemainingPerTransaction, contributionPercent };
}

/**
 * Monthly operating cost is a plain sum of the monthly line items — no
 * division involved, so there is no invalid-state to guard beyond the
 * defensive clamp already inside sumLineItems.
 */
export function computeMonthlyOperatingCost(monthlyCostItems: CostLineItem[], currency = "USD"): number {
  return sumLineItems(monthlyCostItems, currency);
}

/**
 * The survival number: how many profitable transactions cover the monthly
 * cost of existing.
 *
 * requiredPerMonthExact/Rounded are both null when moneyRemainingPerTransaction
 * <= 0 — at that price and cost structure, no transaction volume, however
 * large, can ever cover the monthly cost (dividing by a non-positive number
 * would otherwise silently produce a negative or Infinity "requirement",
 * which the spec explicitly forbids). A monthlyOperatingCost of 0 or less
 * legitimately requires 0 transactions.
 */
export function computeSurvivalNumber(monthlyOperatingCost: number, moneyRemainingPerTransaction: number, currency = "USD"): SurvivalNumberResult {
  const costMinor = toMinorUnits(monthlyOperatingCost, currency);
  const contributionMinor = moneyRemainingPerTransaction > 0 ? toMinorUnits(moneyRemainingPerTransaction, currency) : 0;
  const cost = fromMinorUnits(costMinor, currency);

  if (contributionMinor <= 0) {
    return { monthlyOperatingCost: cost, requiredPerMonthExact: null, requiredPerMonthRounded: null };
  }

  if (cost <= 0) {
    return { monthlyOperatingCost: cost, requiredPerMonthExact: 0, requiredPerMonthRounded: 0 };
  }

  const exact = costMinor / contributionMinor;
  return { monthlyOperatingCost: cost, requiredPerMonthExact: exact, requiredPerMonthRounded: Math.ceil(exact) };
}

export type Rhythm = {
  tradingDaysPerMonth: number | null;
  openingHoursPerDay: number | null;
  capacityUnits: number | null;
};

/**
 * Translates the exact monthly requirement into observable operational
 * units. Each unit is derived independently from the exact monthly figure
 * (never from another already-rounded unit) and then ceiled on its own —
 * see the file-level note on why. A unit is null when its rhythm input
 * wasn't provided/is not positive, or when the monthly requirement itself
 * is null (unachievable — see computeSurvivalNumber).
 *
 * "Per capacity unit" is read as the exact monthly requirement divided
 * across the number of people/locations/seats, expressed per trading day —
 * i.e. "how many transactions must each unit deliver on an ordinary
 * trading day" — since that is the operationally legible reading a business
 * owner can compare against a single person/location's real capacity. This
 * is a disclosed judgment call: the spec's wording ("per person, location,
 * seat, or capacity unit, when applicable") does not itself specify a time
 * base.
 */
export function computeObservableUnits(requiredPerMonthExact: number | null, rhythm: Rhythm): ObservableUnits {
  if (requiredPerMonthExact === null) {
    return { perMonth: null, perWeek: null, perTradingDay: null, perOpeningHour: null, perCapacityUnit: null };
  }

  const perMonth = Math.ceil(requiredPerMonthExact);

  const tradingDays = rhythm.tradingDaysPerMonth;
  const hasTradingDays = isValidAmount(tradingDays) && tradingDays > 0;
  const exactPerTradingDay = hasTradingDays ? requiredPerMonthExact / (tradingDays as number) : null;
  const perTradingDay = exactPerTradingDay !== null ? Math.ceil(exactPerTradingDay) : null;

  // The questionnaire does not collect trading weeks or trading days per
  // week, so a weekly requirement would imply an unsupported assumption.
  // Keep the legacy result field null for stored-result compatibility.
  const perWeek = null;

  const openingHours = rhythm.openingHoursPerDay;
  const hasOpeningHours = isValidAmount(openingHours) && openingHours > 0;
  const perOpeningHour =
    exactPerTradingDay !== null && hasOpeningHours ? Math.ceil(exactPerTradingDay / (openingHours as number)) : null;

  const capacityUnits = rhythm.capacityUnits;
  const hasCapacityUnits = isValidAmount(capacityUnits) && capacityUnits > 0;
  const perCapacityUnit =
    exactPerTradingDay !== null && hasCapacityUnits ? Math.ceil(exactPerTradingDay / (capacityUnits as number)) : null;

  return { perMonth, perWeek, perTradingDay, perOpeningHour, perCapacityUnit };
}

/** Gap ratio helper: how the actual figure compares to what's required. Null when required is null/0 (undefined ratio) or actual is null (not provided). */
export function computeGapRatio(actual: number | null, requiredPerMonth: number | null): number | null {
  if (actual === null || requiredPerMonth === null || requiredPerMonth <= 0) return null;
  if (!isValidAmount(actual)) return null;
  return round2(actual / requiredPerMonth);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function runNapkinCalculation(input: {
  sellingPrice: number;
  currency: string;
  directCostItems: CostLineItem[];
  monthlyCostItems: CostLineItem[];
  rhythm: Rhythm;
  expectedMonthlyVolume: number | null;
  maxMonthlyCapacity: number | null;
}): Pick<NapkinCalculationResult, "contribution" | "survival" | "observable" | "gapExpectedVsRequired" | "gapCapacityVsRequired"> {
  const contribution = computeContribution(input.sellingPrice, input.directCostItems, input.currency);
  const monthlyOperatingCost = computeMonthlyOperatingCost(input.monthlyCostItems, input.currency);
  const survival = computeSurvivalNumber(monthlyOperatingCost, contribution.moneyRemainingPerTransaction, input.currency);
  const observable = computeObservableUnits(survival.requiredPerMonthExact, input.rhythm);
  // Gap ratios use the exact (unrounded) requirement, not the display-rounded
  // one, so interpretation thresholds aren't skewed by the ceiling applied
  // for on-screen presentation.
  const gapExpectedVsRequired = computeGapRatio(input.expectedMonthlyVolume, survival.requiredPerMonthExact);
  const gapCapacityVsRequired = computeGapRatio(input.maxMonthlyCapacity, survival.requiredPerMonthExact);

  return { contribution, survival, observable, gapExpectedVsRequired, gapCapacityVsRequired };
}
