import { describe, expect, it } from "vitest";
import {
  computeContribution,
  computeGapRatio,
  computeMonthlyOperatingCost,
  computeObservableUnits,
  computeSurvivalNumber,
  runNapkinCalculation,
  sumLineItems,
} from "./calculations";
import type { CostLineItem } from "./types";

function items(...amounts: number[]): CostLineItem[] {
  return amounts.map((amount, i) => ({ id: `i${i}`, label: `Item ${i}`, amount }));
}

describe("sumLineItems", () => {
  it("sums positive amounts", () => {
    expect(sumLineItems(items(1, 2, 3.5))).toBe(6.5);
  });

  it("returns 0 for an empty list", () => {
    expect(sumLineItems([])).toBe(0);
  });

  it("treats negative amounts as 0 (defensive clamp)", () => {
    expect(sumLineItems(items(5, -10))).toBe(5);
  });

  it("treats NaN/Infinity amounts as 0", () => {
    expect(sumLineItems([{ id: "a", label: "A", amount: NaN }, { id: "b", label: "B", amount: Infinity }])).toBe(0);
  });
});

describe("computeContribution", () => {
  it("computes the coffee-shop worked example", () => {
    const result = computeContribution(4.0, items(0.45, 0.35, 0.3, 0.12, 0.18, 0.25));
    expect(result.totalDirectCost).toBeCloseTo(1.65, 2);
    expect(result.moneyRemainingPerTransaction).toBeCloseTo(2.35, 2);
    expect(result.contributionPercent).toBeCloseTo(58.8, 1);
  });

  it("handles a price of zero without dividing by zero", () => {
    const result = computeContribution(0, items(1));
    expect(result.contributionPercent).toBeNull();
    expect(Number.isFinite(result.moneyRemainingPerTransaction)).toBe(true);
  });

  it("handles direct costs equal to price (zero remaining)", () => {
    const result = computeContribution(10, items(10));
    expect(result.moneyRemainingPerTransaction).toBe(0);
    expect(result.contributionPercent).toBe(0);
  });

  it("handles direct costs greater than price (negative remaining, not NaN/Infinity)", () => {
    const result = computeContribution(10, items(15));
    expect(result.moneyRemainingPerTransaction).toBe(-5);
    expect(Number.isFinite(result.contributionPercent as number)).toBe(true);
  });

  it("handles an empty direct-cost list as zero cost", () => {
    const result = computeContribution(10, []);
    expect(result.totalDirectCost).toBe(0);
    expect(result.moneyRemainingPerTransaction).toBe(10);
  });

  it("never produces NaN or Infinity for very large values", () => {
    const result = computeContribution(1e12, items(1e11));
    expect(Number.isFinite(result.moneyRemainingPerTransaction)).toBe(true);
    expect(Number.isFinite(result.contributionPercent as number)).toBe(true);
  });
});

describe("computeMonthlyOperatingCost", () => {
  it("sums the coffee-shop worked example", () => {
    const total = computeMonthlyOperatingCost(items(9200, 3600, 3400, 620, 500, 480, 340, 260, 210, 190));
    expect(total).toBeCloseTo(18800, 2);
  });

  it("returns 0 for no monthly costs", () => {
    expect(computeMonthlyOperatingCost([])).toBe(0);
  });
});

describe("computeSurvivalNumber", () => {
  it("computes the coffee-shop worked example (8,000 cups/month)", () => {
    const result = computeSurvivalNumber(18800, 2.35);
    expect(result.requiredPerMonthExact).toBeCloseTo(8000, 0);
    expect(result.requiredPerMonthRounded).toBe(8000);
  });

  it("rounds a fractional requirement UP to the next whole transaction", () => {
    const result = computeSurvivalNumber(1000, 3); // 333.33...
    expect(result.requiredPerMonthExact).toBeCloseTo(333.33, 1);
    expect(result.requiredPerMonthRounded).toBe(334);
  });

  it("returns null (not Infinity) when money remaining is zero", () => {
    const result = computeSurvivalNumber(1000, 0);
    expect(result.requiredPerMonthExact).toBeNull();
    expect(result.requiredPerMonthRounded).toBeNull();
  });

  it("returns null (not a negative number) when money remaining is negative", () => {
    const result = computeSurvivalNumber(1000, -1);
    expect(result.requiredPerMonthExact).toBeNull();
    expect(result.requiredPerMonthRounded).toBeNull();
  });

  it("requires zero transactions when monthly cost is zero", () => {
    const result = computeSurvivalNumber(0, 5);
    expect(result.requiredPerMonthExact).toBe(0);
    expect(result.requiredPerMonthRounded).toBe(0);
  });

  it("requires zero transactions when monthly cost is negative (defensive clamp)", () => {
    const result = computeSurvivalNumber(-100, 5);
    expect(result.requiredPerMonthExact).toBe(0);
  });

  it("never produces NaN or Infinity for very large values", () => {
    const result = computeSurvivalNumber(1e12, 0.01, "USD");
    expect(Number.isFinite(result.requiredPerMonthExact as number)).toBe(true);
  });
});

describe("computeObservableUnits", () => {
  it("computes the coffee-shop worked example (320/day)", () => {
    const result = computeObservableUnits(8000, { tradingDaysPerMonth: 25, openingHoursPerDay: 11, capacityUnits: null });
    expect(result.perMonth).toBe(8000);
    expect(result.perTradingDay).toBe(320);
    // The spec's prose rounds this to "approximately 29" (320/11 = 29.09);
    // this module's display rule ceils every derived unit, so 30 here.
    expect(result.perOpeningHour).toBe(30);
  });

  it("does not invent a weekly figure without a trading-weeks input", () => {
    // 100 required/month, 3 trading days/week * ~4.33 => use 13 trading days/month for a clean fractional case
    const result = computeObservableUnits(100, { tradingDaysPerMonth: 13, openingHoursPerDay: null, capacityUnits: null });
    // 100 / 13 = 7.69 -> ceil 8
    expect(result.perTradingDay).toBe(8);
    expect(result.perWeek).toBeNull();
  });

  it("returns nulls for units whose rhythm input was not provided", () => {
    const result = computeObservableUnits(1000, { tradingDaysPerMonth: null, openingHoursPerDay: null, capacityUnits: null });
    expect(result.perTradingDay).toBeNull();
    expect(result.perWeek).toBeNull();
    expect(result.perOpeningHour).toBeNull();
    expect(result.perCapacityUnit).toBeNull();
    expect(result.perMonth).toBe(1000);
  });

  it("returns all nulls when the monthly requirement itself is null (unachievable)", () => {
    const result = computeObservableUnits(null, { tradingDaysPerMonth: 25, openingHoursPerDay: 10, capacityUnits: 2 });
    expect(result.perMonth).toBeNull();
    expect(result.perTradingDay).toBeNull();
    expect(result.perWeek).toBeNull();
    expect(result.perOpeningHour).toBeNull();
    expect(result.perCapacityUnit).toBeNull();
  });

  it("ignores a zero or negative trading-days input rather than dividing by zero", () => {
    const result = computeObservableUnits(1000, { tradingDaysPerMonth: 0, openingHoursPerDay: null, capacityUnits: null });
    expect(result.perTradingDay).toBeNull();
    expect(Number.isFinite(result.perMonth as number)).toBe(true);
  });

  it("computes per-capacity-unit as a per-trading-day figure divided across units", () => {
    const result = computeObservableUnits(300, { tradingDaysPerMonth: 30, openingHoursPerDay: null, capacityUnits: 5 });
    // exact per day = 10, per unit = 10/5 = 2
    expect(result.perCapacityUnit).toBe(2);
  });
});

describe("computeGapRatio", () => {
  it("computes a ratio above 1 when actual exceeds required", () => {
    expect(computeGapRatio(150, 100)).toBe(1.5);
  });

  it("computes a ratio below 1 when actual is short of required", () => {
    expect(computeGapRatio(50, 100)).toBe(0.5);
  });

  it("is null when required is null", () => {
    expect(computeGapRatio(50, null)).toBeNull();
  });

  it("is null when required is zero or negative", () => {
    expect(computeGapRatio(50, 0)).toBeNull();
  });

  it("is null when actual is not provided", () => {
    expect(computeGapRatio(null, 100)).toBeNull();
  });
});

describe("runNapkinCalculation (end-to-end, coffee-shop worked example)", () => {
  it("matches every figure in the spec's worked example", () => {
    const result = runNapkinCalculation({
      sellingPrice: 4.0,
      currency: "USD",
      directCostItems: items(0.45, 0.35, 0.3, 0.12, 0.18, 0.25),
      monthlyCostItems: items(9200, 3600, 3400, 620, 500, 480, 340, 260, 210, 190),
      rhythm: { tradingDaysPerMonth: 25, openingHoursPerDay: 11, capacityUnits: null },
      expectedMonthlyVolume: 100 * 25, // ~100 cups/day realistic street traffic
      maxMonthlyCapacity: 100 * 25,
    });

    expect(result.contribution.moneyRemainingPerTransaction).toBeCloseTo(2.35, 2);
    expect(result.survival.requiredPerMonthRounded).toBe(8000);
    expect(result.observable.perTradingDay).toBe(320);
    expect(result.observable.perOpeningHour).toBe(30);
    // 2,500 expected vs 8,000 required — well short.
    expect(result.gapExpectedVsRequired).toBeLessThan(1);
  });
});

describe("currency precision regression", () => {
  it("keeps the Burger Shop contribution and survival number exact", () => {
    const contribution = computeContribution(4, items(2, 0.1, 0.8, 0.1), "USD");
    const survival = computeSurvivalNumber(1400, contribution.moneyRemainingPerTransaction, "USD");

    expect(contribution.totalDirectCost).toBe(3);
    expect(contribution.moneyRemainingPerTransaction).toBe(1);
    expect(survival.requiredPerMonthExact).toBe(1400);
    expect(survival.requiredPerMonthRounded).toBe(1400);
  });

  it.each([0.08, 0.8, 1.25])("preserves the valid USD decimal %s", (amount) => {
    expect(sumLineItems(items(amount), "USD")).toBe(amount);
  });

  it("sums several decimal line items in integer minor units", () => {
    expect(sumLineItems(items(2, 0.1, 0.8, 0.1), "USD")).toBe(3);
  });

  it("still rounds genuinely fractional transaction requirements upward", () => {
    expect(computeSurvivalNumber(1400, 1.25, "USD").requiredPerMonthRounded).toBe(1120);
    expect(computeSurvivalNumber(1400, 1.2, "USD").requiredPerMonthRounded).toBe(1167);
  });

  it("uses the currency minor-unit convention for zero-decimal JPY", () => {
    const contribution = computeContribution(400, items(200, 10.4, 79.6, 10), "JPY");
    expect(contribution.totalDirectCost).toBe(300);
    expect(contribution.moneyRemainingPerTransaction).toBe(100);
    expect(computeSurvivalNumber(140_000, contribution.moneyRemainingPerTransaction, "JPY").requiredPerMonthRounded).toBe(1400);
  });
});
