import "server-only";
import { Resend } from "resend";
import { SITE_URL } from "@/app/lib/seo";
import { INTERPRETATION_LABELS, PRELIMINARY_DISCLAIMER } from "./config";
import { formatCount, formatCurrency } from "./format";
import { generateArchitecturalLevers, generatePersonalizedQuestions } from "./personalization";
import { createUnsubscribeToken } from "./unsubscribe";
import type { NapkinCalculationResult, NapkinInputs } from "./types";

export type NapkinBreakdownEmailParams = {
  firstName: string;
  submissionId: string;
  leadId: string;
  inputs: NapkinInputs;
  result: NapkinCalculationResult;
  completedAt: string;
};

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#555;font-size:13px;">${esc(label)}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1816;font-size:13px;">${value}</td></tr>`;
}

export function buildNapkinBreakdownEmailHtml(params: NapkinBreakdownEmailParams): string {
  const { firstName, inputs, result } = params;
  const currency = inputs.currency;
  const { contribution, survival, observable, interpretation, gapExpectedVsRequired, gapCapacityVsRequired } = result;
  const resultUrl = `${SITE_URL}/resources/napkin-principle`;
  const unsubscribeUrl = `${SITE_URL}/unsubscribe/napkin?token=${encodeURIComponent(createUnsubscribeToken(params.leadId))}`;
  const dateLabel = new Date(params.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const questions = generatePersonalizedQuestions({
    inputs,
    interpretationCategory: interpretation.category,
    gapExpectedVsRequired,
    gapCapacityVsRequired,
    weakestAssumptionField: interpretation.weakestAssumption.field,
  });
  const levers = generateArchitecturalLevers({
    inputs,
    interpretationCategory: interpretation.category,
    gapExpectedVsRequired,
    gapCapacityVsRequired,
    weakestAssumptionField: interpretation.weakestAssumption.field,
  });

  const directCostRows = inputs.directCostItems
    .filter((i) => i.amount > 0)
    .map((i) => row(i.label, formatCurrency(i.amount, currency)))
    .join("");
  const monthlyCostRows = inputs.monthlyCostItems
    .filter((i) => i.amount > 0)
    .map((i) => row(i.label, formatCurrency(i.amount, currency)))
    .join("");

  const observableRows = [
    observable.perTradingDay !== null ? row("Per trading day", formatCount(observable.perTradingDay)) : "",
    observable.perOpeningHour !== null ? row("Per opening hour", formatCount(observable.perOpeningHour)) : "",
    observable.perCapacityUnit !== null
      ? row(`Per ${inputs.capacityUnitLabel || "capacity unit"}`, formatCount(observable.perCapacityUnit))
      : "",
  ].join("");

  return `<!doctype html>
  <html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Your Napkin Principle breakdown</title></head><body style="margin:0;padding:24px 12px;background:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your survival number, operating requirement, gaps, assumptions and next questions.</div>
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1816;">
    <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b1f1f;font-weight:600;margin:0 0 12px;">The Napkin Principle — Full Breakdown</p>
    <p style="font-size:16px;">Hi ${esc(firstName)},</p>
    <p style="font-size:15px;line-height:1.6;color:#333;">
      Here is the complete breakdown${inputs.businessName ? ` for <strong>${esc(inputs.businessName)}</strong>` : ""},
      completed ${dateLabel}. This goes further than the on-screen snapshot — it includes your full calculation,
      the assumptions carrying the most weight, and the questions worth investigating next.
    </p>

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">Core transaction economics</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${row("Core item or transaction", esc(inputs.transactionSingular || "Not specified"))}
      ${row("Selling price", formatCurrency(inputs.sellingPrice, currency))}
      ${directCostRows}
      ${row("Total direct cost", formatCurrency(contribution.totalDirectCost, currency))}
      ${row("Money remaining per transaction", formatCurrency(contribution.moneyRemainingPerTransaction, currency))}
      ${contribution.contributionPercent !== null ? row("Contribution", `${contribution.contributionPercent}%`) : ""}
    </table>

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">One ordinary month</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${monthlyCostRows}
      ${row("Total monthly operating cost", formatCurrency(survival.monthlyOperatingCost, currency))}
    </table>

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">Your survival number</h2>
    ${
      survival.requiredPerMonthRounded === null
        ? `<p style="font-size:14px;line-height:1.6;color:#6b1f1f;">Money remaining per transaction is zero or negative — no transaction volume, however large, can cover the monthly cost at this price and cost structure.</p>`
        : `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${row("Required monthly volume", formatCount(survival.requiredPerMonthRounded))}
      ${observableRows}
      ${row("Expected realistic volume (per month)", formatCount(inputs.expectedMonthlyVolume))}
      ${row("Maximum delivery capacity (per month)", formatCount(inputs.maxMonthlyCapacity))}
    </table>`
    }

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">Preliminary interpretation</h2>
    <p style="font-size:15px;font-weight:600;color:#6b1f1f;margin-bottom:4px;">${esc(INTERPRETATION_LABELS[interpretation.category])}</p>
    <p style="font-size:14px;line-height:1.6;color:#333;">${esc(interpretation.summary)}</p>

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">The assumption carrying the most weight</h2>
    <p style="font-size:14px;line-height:1.6;color:#333;">${esc(interpretation.weakestAssumption.label)}</p>

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">Three questions worth investigating next</h2>
    <ol style="font-size:14px;line-height:1.7;color:#333;padding-left:18px;margin:8px 0;">
      ${questions.map((q) => `<li>${esc(q)}</li>`).join("")}
    </ol>

    <h2 style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1816;border-bottom:1px solid #e5e0dc;padding-bottom:8px;margin-top:32px;">Possible architectural levers</h2>
    <ul style="font-size:14px;line-height:1.7;color:#333;padding-left:18px;margin:8px 0;">
      ${levers.map((l) => `<li>${esc(l)}</li>`).join("")}
    </ul>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:28px;">${esc(PRELIMINARY_DISCLAIMER)}</p>

    <div style="margin-top:32px;padding:24px;background:#faf8f6;border:1px solid #e5e0dc;">
      <p style="font-size:16px;font-weight:600;margin:0 0 8px;">The calculation is simple. The decision may not be.</p>
      <p style="font-size:14px;line-height:1.6;color:#333;margin:0 0 16px;">
        The Napkin Principle shows what must be true for the economics to work. It does not prove that customers
        will buy, that the required volume can be reached, or that the business can deliver it sustainably. If the
        result exposed a gap — or an assumption you cannot yet defend — the next step is to examine the architecture
        of the business.
      </p>
      <a href="${SITE_URL}/lets-talk" style="display:inline-block;background:#6b1f1f;color:#fff;text-decoration:none;padding:12px 24px;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Discuss the business with Martin →</a>
    </div>

    <p style="font-size:13px;color:#888;margin-top:24px;"><a href="${resultUrl}" style="color:#6b1f1f;">Run the calculator again →</a></p>

    <p style="font-size:13px;color:#333;margin-top:24px;">— Martin</p>

    <hr style="border:none;border-top:1px solid #e5e0dc;margin:32px 0 16px;" />
    <p style="font-size:11px;color:#999;line-height:1.6;">
      The Modern Business Architect · Martin Dubreuil<br/>
      You're receiving this because you joined the community after completing The Napkin Principle at ${esc(resultUrl)}.
      <a href="${SITE_URL}/privacy" style="color:#999;">Privacy</a> · <a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a>
    </p>
  </div></body></html>`;
}

export function buildNapkinBreakdownEmailText(params: NapkinBreakdownEmailParams): string {
  const { inputs, result } = params;
  const { contribution, survival, observable, interpretation } = result;
  const questions = generatePersonalizedQuestions({
    inputs,
    interpretationCategory: interpretation.category,
    gapExpectedVsRequired: result.gapExpectedVsRequired,
    gapCapacityVsRequired: result.gapCapacityVsRequired,
    weakestAssumptionField: interpretation.weakestAssumption.field,
  });
  const levers = generateArchitecturalLevers({
    inputs,
    interpretationCategory: interpretation.category,
    gapExpectedVsRequired: result.gapExpectedVsRequired,
    gapCapacityVsRequired: result.gapCapacityVsRequired,
    weakestAssumptionField: interpretation.weakestAssumption.field,
  });
  const unsubscribeUrl = `${SITE_URL}/unsubscribe/napkin?token=${encodeURIComponent(createUnsubscribeToken(params.leadId))}`;

  return [
    "THE NAPKIN PRINCIPLE — FULL BREAKDOWN",
    "",
    `Hi ${params.firstName},`,
    inputs.businessName ? `Business or idea: ${inputs.businessName}` : "",
    `Core item or transaction: ${inputs.transactionSingular || "Not specified"}`,
    `Selling price: ${formatCurrency(inputs.sellingPrice, inputs.currency)}`,
    `Direct cost: ${formatCurrency(contribution.totalDirectCost, inputs.currency)}`,
    `Money remaining per transaction: ${formatCurrency(contribution.moneyRemainingPerTransaction, inputs.currency)}`,
    `Contribution: ${contribution.contributionPercent === null ? "Not available" : `${contribution.contributionPercent}%`}`,
    `Monthly operating cost: ${formatCurrency(survival.monthlyOperatingCost, inputs.currency)}`,
    `Survival number: ${formatCount(survival.requiredPerMonthRounded)} transactions per month`,
    `Operating requirement: ${formatCount(observable.perTradingDay)} per trading day; ${formatCount(observable.perOpeningHour)} per opening hour; ${formatCount(observable.perCapacityUnit)} per capacity unit/day`,
    `Expected volume: ${formatCount(inputs.expectedMonthlyVolume)} per month (gap ratio: ${result.gapExpectedVsRequired ?? "not available"})`,
    `Maximum capacity: ${formatCount(inputs.maxMonthlyCapacity)} per month (gap ratio: ${result.gapCapacityVsRequired ?? "not available"})`,
    "",
    `${INTERPRETATION_LABELS[interpretation.category]}: ${interpretation.summary}`,
    `Weakest assumption: ${interpretation.weakestAssumption.label}`,
    "",
    "Three questions worth investigating next:",
    ...questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "Possible architectural levers:",
    ...levers.map((lever) => `- ${lever}`),
    "",
    PRELIMINARY_DISCLAIMER,
    `Discuss the business with Martin: ${SITE_URL}/lets-talk`,
    `Privacy: ${SITE_URL}/privacy`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].filter(Boolean).join("\n");
}

/**
 * Best-effort send — mirrors the Business Idea Reality Check's confirmation
 * email pattern (app/api/assessment/submit/route.ts): failures never throw,
 * they're returned as a { ok, error } result so the caller can persist the
 * outcome without ever blocking or failing the visitor-facing response.
 */
export async function sendNapkinBreakdownEmail(
  params: NapkinBreakdownEmailParams & { email: string }
): Promise<{ ok: boolean; error: string | null }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = buildNapkinBreakdownEmailHtml(params);
    const text = buildNapkinBreakdownEmailText(params);
    const result = await resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: params.email,
      replyTo: "martin@mindrasolutions.com",
      subject: `Your Napkin Principle breakdown${params.inputs.businessName ? ` — ${params.inputs.businessName}` : ""}`,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${SITE_URL}/unsubscribe/napkin?token=${encodeURIComponent(createUnsubscribeToken(params.leadId))}>`,
      },
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
