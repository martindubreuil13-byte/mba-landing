import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { NapkinInputsSchema } from "./validation";

const valid = {
  businessName: "Test business",
  businessStage: "idea",
  whatItSells: "Coffee",
  currency: "USD",
  transactionSingular: "cup",
  transactionPlural: "cups",
  sellingPrice: 4,
  directCostItems: [{ id: "beans", label: "Beans", amount: 1 }],
  monthlyCostItems: [{ id: "rent", label: "Rent", amount: 1000 }],
  tradingDaysPerMonth: 25,
  openingHoursPerDay: 8,
  capacityUnits: 1,
  capacityUnitLabel: "location",
  expectedMonthlyVolume: 500,
  maxMonthlyCapacity: 800,
  seasonality: "not_seasonal",
  reachability: "yes_clearly",
  priceConfidence: "supported",
  directCostConfidence: "supported",
  monthlyCostConfidence: "supported",
  volumeEvidence: "Past sales",
} as const;

describe("NapkinInputsSchema", () => {
  it("accepts a complete valid submission", () => {
    expect(NapkinInputsSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["negative price", { sellingPrice: -1 }],
    ["missing price", { sellingPrice: undefined }],
    ["negative direct cost", { directCostItems: [{ id: "x", label: "Cost", amount: -1 }] }],
    ["negative expected volume", { expectedMonthlyVolume: -1 }],
    ["non-finite capacity", { maxMonthlyCapacity: Infinity }],
    ["unbounded amount", { monthlyCostItems: [{ id: "x", label: "Cost", amount: 100_000_001 }] }],
  ])("rejects %s", (_label, patch) => {
    expect(NapkinInputsSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});
