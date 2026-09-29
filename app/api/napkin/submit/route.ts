import { NextResponse } from "next/server";
import { runNapkinCalculation } from "@/app/lib/napkin/calculations";
import { classifyInterpretation } from "@/app/lib/napkin/interpretation";
import { createNapkinSubmission } from "@/app/lib/napkin/queries";
import { NapkinAttributionSchema, NapkinInputsSchema } from "@/app/lib/napkin/validation";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import type { NapkinCalculationResult } from "@/app/lib/napkin/types";

// Cheap endpoint (no LLM, no email) — the rate limit here is purely an
// abuse/DB-write guard, generous enough for legitimate retakes.
const RATE_LIMIT_WINDOW_SECONDS = 30 * 60;
const RATE_LIMIT_MAX_REQUESTS = 30;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot, same convention as every other lead-capture-adjacent form.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const allowed = await checkRateLimit(`napkin_submit:${ip}`, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a little while and try again." }, { status: 429 });
  }

  const parsedInputs = NapkinInputsSchema.safeParse(body.inputs);
  if (!parsedInputs.success) {
    return NextResponse.json({ error: "Some of the numbers entered aren't valid. Please check and try again." }, { status: 400 });
  }
  const inputs = parsedInputs.data;

  const parsedAttribution = NapkinAttributionSchema.safeParse(body.attribution ?? {});
  const attribution = parsedAttribution.success
    ? parsedAttribution.data
    : { source: null, medium: null, campaign: null, referrer: null, utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null };

  // Recalculate everything server-side — the client's own numbers (shown
  // live during the flow for UX) are never trusted or persisted directly.
  const calc = runNapkinCalculation({
    sellingPrice: inputs.sellingPrice,
    currency: inputs.currency,
    directCostItems: inputs.directCostItems,
    monthlyCostItems: inputs.monthlyCostItems,
    rhythm: {
      tradingDaysPerMonth: inputs.tradingDaysPerMonth,
      openingHoursPerDay: inputs.openingHoursPerDay,
      capacityUnits: inputs.capacityUnits,
    },
    expectedMonthlyVolume: inputs.expectedMonthlyVolume,
    maxMonthlyCapacity: inputs.maxMonthlyCapacity,
  });

  const interpretation = classifyInterpretation({
    moneyRemainingPerTransaction: calc.contribution.moneyRemainingPerTransaction,
    requiredPerMonthExact: calc.survival.requiredPerMonthExact,
    expectedMonthlyVolume: inputs.expectedMonthlyVolume,
    maxMonthlyCapacity: inputs.maxMonthlyCapacity,
    gapExpectedVsRequired: calc.gapExpectedVsRequired,
    gapCapacityVsRequired: calc.gapCapacityVsRequired,
    priceConfidence: inputs.priceConfidence,
    directCostConfidence: inputs.directCostConfidence,
    monthlyCostConfidence: inputs.monthlyCostConfidence,
  });

  const result: NapkinCalculationResult = { ...calc, interpretation };

  let submission;
  try {
    submission = await createNapkinSubmission({ inputs, result, attribution });
  } catch (error) {
    console.error("Failed to store Napkin Principle submission:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ submissionId: submission.id, inputs, result });
}
