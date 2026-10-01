import { runNapkinCalculation } from "./calculations";
import { classifyInterpretation } from "./interpretation";
import { NapkinInputsSchema } from "./validation";

/** Minimal valid Napkin input/result, only for tests of the email builders. */
export function calculateFixtureForTest() {
  const inputs = NapkinInputsSchema.parse({
    businessName: "Test", businessStage: "idea", whatItSells: "Coffee", currency: "USD", transactionSingular: "cup", transactionPlural: "cups",
    sellingPrice: 4, directCostItems: [{ id: "beans", label: "Beans", amount: 1 }], monthlyCostItems: [{ id: "rent", label: "Rent", amount: 1000 }],
    tradingDaysPerMonth: 25, openingHoursPerDay: 8, capacityUnits: 1, capacityUnitLabel: "location", expectedMonthlyVolume: 500, maxMonthlyCapacity: 800,
    seasonality: "not_seasonal", reachability: "yes_clearly", priceConfidence: "supported", directCostConfidence: "supported", monthlyCostConfidence: "supported", volumeEvidence: "x",
  });
  const calc = runNapkinCalculation({
    sellingPrice: inputs.sellingPrice, currency: inputs.currency, directCostItems: inputs.directCostItems, monthlyCostItems: inputs.monthlyCostItems,
    rhythm: { tradingDaysPerMonth: inputs.tradingDaysPerMonth, openingHoursPerDay: inputs.openingHoursPerDay, capacityUnits: inputs.capacityUnits },
    expectedMonthlyVolume: inputs.expectedMonthlyVolume, maxMonthlyCapacity: inputs.maxMonthlyCapacity,
  });
  const interpretation = classifyInterpretation({
    moneyRemainingPerTransaction: calc.contribution.moneyRemainingPerTransaction, requiredPerMonthExact: calc.survival.requiredPerMonthExact,
    expectedMonthlyVolume: inputs.expectedMonthlyVolume, maxMonthlyCapacity: inputs.maxMonthlyCapacity, gapExpectedVsRequired: calc.gapExpectedVsRequired,
    gapCapacityVsRequired: calc.gapCapacityVsRequired, priceConfidence: inputs.priceConfidence, directCostConfidence: inputs.directCostConfidence, monthlyCostConfidence: inputs.monthlyCostConfidence,
  });
  return { firstName: "Alex", submissionId: "s1", leadId: "lead-1", inputs, result: { ...calc, interpretation }, completedAt: "2026-10-01T00:00:00Z" };
}
