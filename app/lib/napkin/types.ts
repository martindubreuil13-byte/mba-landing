import type {
  BusinessStage,
  ConfidenceLevel,
  InterpretationCategory,
  ReachabilityAnswer,
  SeasonalityAnswer,
} from "./config";

export type CostLineItem = {
  id: string;
  label: string;
  amount: number;
};

export type NapkinInputs = {
  businessName: string;
  businessStage: BusinessStage;
  whatItSells: string;
  currency: string;

  transactionSingular: string;
  transactionPlural: string;
  sellingPrice: number;
  directCostItems: CostLineItem[];

  monthlyCostItems: CostLineItem[];

  tradingDaysPerMonth: number | null;
  openingHoursPerDay: number | null;
  capacityUnits: number | null;
  capacityUnitLabel: string | null;

  expectedMonthlyVolume: number | null;
  maxMonthlyCapacity: number | null;
  seasonality: SeasonalityAnswer | null;
  reachability: ReachabilityAnswer | null;
  priceConfidence: ConfidenceLevel | null;
  directCostConfidence: ConfidenceLevel | null;
  monthlyCostConfidence: ConfidenceLevel | null;
  volumeEvidence: string;
};

export type ContributionResult = {
  totalDirectCost: number;
  moneyRemainingPerTransaction: number;
  /** Null when sellingPrice <= 0 (division is not meaningful). */
  contributionPercent: number | null;
};

export type SurvivalNumberResult = {
  monthlyOperatingCost: number;
  /**
   * Null when moneyRemainingPerTransaction <= 0 — no volume of this
   * transaction, however large, can cover the monthly cost, so a finite
   * "required transactions" figure does not exist.
   */
  requiredPerMonthExact: number | null;
  requiredPerMonthRounded: number | null;
};

export type ObservableUnits = {
  perMonth: number | null;
  perWeek: number | null;
  perTradingDay: number | null;
  perOpeningHour: number | null;
  perCapacityUnit: number | null;
};

export type NapkinCalculationResult = {
  contribution: ContributionResult;
  survival: SurvivalNumberResult;
  observable: ObservableUnits;
  gapExpectedVsRequired: number | null;
  gapCapacityVsRequired: number | null;
  interpretation: InterpretationResult;
};

export type InterpretationResult = {
  category: InterpretationCategory;
  summary: string;
  weakestAssumption: {
    field: "sellingPrice" | "directCosts" | "monthlyCosts" | null;
    label: string;
    level: ConfidenceLevel | null;
  };
};

export type NapkinAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
};

/** Row shape of the `napkin_submissions` table. */
export type NapkinSubmissionRow = {
  id: string;
  form_version: string;
  calculation_version: string;
  lead_id: string | null;
  created_at: string;
  joined_at: string | null;

  business_name: string | null;
  currency: string;
  selling_price: number;
  money_remaining_per_transaction: number;
  monthly_operating_cost: number;
  required_transactions_per_month: number | null;
  interpretation_category: InterpretationCategory;

  raw_inputs: NapkinInputs;
  calculation_result: NapkinCalculationResult;

  consent_copy_version: string | null;
  consent_at: string | null;
  marketing_consent: boolean;

  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;

  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;

  cta_clicked: string | null;
  cta_clicked_at: string | null;
};
