import "server-only";
import { z } from "zod";
import {
  BUSINESS_STAGES,
  CONFIDENCE_VALUES,
  CURRENCY_CODES,
  REACHABILITY_VALUES,
  SEASONALITY_VALUES,
  type BusinessStage,
} from "./config";

const BUSINESS_STAGE_VALUES = BUSINESS_STAGES.map((s) => s.value) as [BusinessStage, ...BusinessStage[]];

// A generous but firm ceiling — guards against absurd/garbage input (e.g. a
// pasted spreadsheet value) reaching the calculation engine without
// rejecting any realistic business figure.
const MAX_AMOUNT = 100_000_000;

const money = z.number().finite().min(0).max(MAX_AMOUNT);
const positiveCount = z.number().finite().min(0).max(100_000);

const CostLineItemSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  amount: money,
});

export const NapkinInputsSchema = z.object({
  businessName: z.string().trim().max(200),
  businessStage: z.enum(BUSINESS_STAGE_VALUES),
  whatItSells: z.string().trim().max(400),
  currency: z.enum(CURRENCY_CODES),

  transactionSingular: z.string().trim().min(1).max(80),
  transactionPlural: z.string().trim().min(1).max(80),
  sellingPrice: z.number().finite().gt(0).max(MAX_AMOUNT),
  directCostItems: z.array(CostLineItemSchema).max(30),

  monthlyCostItems: z.array(CostLineItemSchema).max(30),

  tradingDaysPerMonth: positiveCount.nullable(),
  openingHoursPerDay: positiveCount.nullable(),
  capacityUnits: positiveCount.nullable(),
  capacityUnitLabel: z.string().trim().max(60).nullable(),

  expectedMonthlyVolume: positiveCount.nullable(),
  maxMonthlyCapacity: positiveCount.nullable(),
  seasonality: z.enum(SEASONALITY_VALUES).nullable(),
  reachability: z.enum(REACHABILITY_VALUES).nullable(),
  priceConfidence: z.enum(CONFIDENCE_VALUES).nullable(),
  directCostConfidence: z.enum(CONFIDENCE_VALUES).nullable(),
  monthlyCostConfidence: z.enum(CONFIDENCE_VALUES).nullable(),
  volumeEvidence: z.string().trim().max(600),
});

export const NapkinAttributionSchema = z.object({
  source: z.string().max(200).nullable(),
  medium: z.string().max(200).nullable(),
  campaign: z.string().max(200).nullable(),
  referrer: z.string().max(500).nullable(),
  utm_source: z.string().max(200).nullable(),
  utm_medium: z.string().max(200).nullable(),
  utm_campaign: z.string().max(200).nullable(),
  utm_content: z.string().max(200).nullable(),
});
