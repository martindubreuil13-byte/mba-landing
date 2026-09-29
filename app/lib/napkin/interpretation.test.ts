import { describe, expect, it } from "vitest";
import { classifyInterpretation, selectWeakestAssumption, type InterpretationInput } from "./interpretation";

function base(overrides: Partial<InterpretationInput> = {}): InterpretationInput {
  return {
    moneyRemainingPerTransaction: 2.35,
    requiredPerMonthExact: 8000,
    expectedMonthlyVolume: 8000,
    maxMonthlyCapacity: 8000,
    gapExpectedVsRequired: 1.0,
    gapCapacityVsRequired: 1.0,
    priceConfidence: "supported",
    directCostConfidence: "supported",
    monthlyCostConfidence: "supported",
    ...overrides,
  };
}

describe("classifyInterpretation", () => {
  it("returns 'fragile' when money remaining per transaction is zero", () => {
    const result = classifyInterpretation(base({ moneyRemainingPerTransaction: 0 }));
    expect(result.category).toBe("fragile");
  });

  it("returns 'fragile' when money remaining per transaction is negative", () => {
    const result = classifyInterpretation(base({ moneyRemainingPerTransaction: -1 }));
    expect(result.category).toBe("fragile");
  });

  it("returns 'fragile' regardless of volume when the transaction itself never breaks even", () => {
    const result = classifyInterpretation(
      base({ moneyRemainingPerTransaction: -1, expectedMonthlyVolume: 1_000_000, maxMonthlyCapacity: 1_000_000 })
    );
    expect(result.category).toBe("fragile");
  });

  it("returns 'not_enough_evidence' when expected volume is missing", () => {
    const result = classifyInterpretation(base({ expectedMonthlyVolume: null, gapExpectedVsRequired: null }));
    expect(result.category).toBe("not_enough_evidence");
  });

  it("returns 'not_enough_evidence' when capacity is missing", () => {
    const result = classifyInterpretation(base({ maxMonthlyCapacity: null, gapCapacityVsRequired: null }));
    expect(result.category).toBe("not_enough_evidence");
  });

  it("returns 'not_enough_evidence' when at least two confidence answers are weak", () => {
    const result = classifyInterpretation(
      base({ priceConfidence: "dont_know", directCostConfidence: "mostly_assumption" })
    );
    expect(result.category).toBe("not_enough_evidence");
  });

  it("does NOT downgrade to 'not_enough_evidence' for a single weak confidence answer", () => {
    const result = classifyInterpretation(base({ priceConfidence: "mostly_assumption" }));
    expect(result.category).not.toBe("not_enough_evidence");
  });

  it("returns 'coherent' when expected volume and capacity both meet the requirement with strong confidence", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 1.2, gapCapacityVsRequired: 1.5 }));
    expect(result.category).toBe("coherent");
  });

  it("returns 'tight' (not 'coherent') when volume covers the requirement but one confidence answer is weak", () => {
    const result = classifyInterpretation(
      base({ gapExpectedVsRequired: 1.2, gapCapacityVsRequired: 1.5, priceConfidence: "informed_estimate", directCostConfidence: "mostly_assumption" })
    );
    expect(result.category).toBe("tight");
  });

  it("returns 'tight' when expected volume is just under the requirement (0.9x)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 0.9, gapCapacityVsRequired: 1.5 }));
    expect(result.category).toBe("tight");
  });

  it("returns 'tight' when capacity headroom above the requirement is slim (1.05x)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 1.2, gapCapacityVsRequired: 1.05 }));
    expect(result.category).toBe("tight");
  });

  it("returns 'possible_with_changes' for a moderate gap (0.6x)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 0.6, gapCapacityVsRequired: 0.6 }));
    expect(result.category).toBe("possible_with_changes");
  });

  it("returns 'fragile' for a large gap (0.2x)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 0.2, gapCapacityVsRequired: 0.2 }));
    expect(result.category).toBe("fragile");
  });

  it("uses the weaker of expected-volume gap and capacity gap as the binding constraint", () => {
    // Expected volume comfortably covers it, but capacity is the real ceiling.
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 2.0, gapCapacityVsRequired: 0.3 }));
    expect(result.category).toBe("fragile");
  });

  it("is exactly at the coherent/tight boundary at 1.0x with strong confidence (coherent)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 1.0, gapCapacityVsRequired: 1.0 }));
    expect(result.category).toBe("coherent");
  });

  it("is exactly at the tight/possible boundary at 0.85x (tight)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 0.85, gapCapacityVsRequired: 1.5 }));
    expect(result.category).toBe("tight");
  });

  it("is exactly at the possible/fragile boundary at 0.4x (possible_with_changes)", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 0.4, gapCapacityVsRequired: 1.5 }));
    expect(result.category).toBe("possible_with_changes");
  });

  it("just below the 0.4x boundary is fragile", () => {
    const result = classifyInterpretation(base({ gapExpectedVsRequired: 0.39, gapCapacityVsRequired: 1.5 }));
    expect(result.category).toBe("fragile");
  });
});

describe("selectWeakestAssumption", () => {
  it("picks the lowest-confidence answer", () => {
    const result = selectWeakestAssumption({
      priceConfidence: "supported",
      directCostConfidence: "dont_know",
      monthlyCostConfidence: "informed_estimate",
    });
    expect(result.field).toBe("directCosts");
    expect(result.level).toBe("dont_know");
  });

  it("breaks ties by preferring monthly costs, then direct costs, then price", () => {
    const result = selectWeakestAssumption({
      priceConfidence: "mostly_assumption",
      directCostConfidence: "mostly_assumption",
      monthlyCostConfidence: "mostly_assumption",
    });
    expect(result.field).toBe("monthlyCosts");
  });

  it("returns a null field when no confidence answers were provided", () => {
    const result = selectWeakestAssumption({ priceConfidence: null, directCostConfidence: null, monthlyCostConfidence: null });
    expect(result.field).toBeNull();
  });
});
