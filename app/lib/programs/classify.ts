import "server-only";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { CLASSIFY_MODEL, getOpenAIClient } from "@/app/lib/openai/client";
import type { TransitionAnswers } from "./corporate-transition";

const Schema = z.object({
  route: z.enum(["INVITE", "REVIEW", "NOT_FIT"]), confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  reasoning: z.array(z.string().max(240)).max(5), concerns: z.array(z.string().max(240)).max(5),
  preCallSummary: z.string().max(1200), reviewDraft: z.string().max(2400),
});
export type Qualification = z.infer<typeof Schema>;

const prompt = `Assess applications to a private Corporate Transition pathway for currently employed, established professionals considering entrepreneurship. Holistically consider professional situation, experience, stage, timing, motivation and requested help. Having no idea is fully acceptable; later stage is not automatically better. Never infer age, wealth or ability to pay. Country/nationality must never determine fit. Fear, frustration or restructuring are not automatic rejection. Route uncertainty, contradictory or thin information, job insecurity, financial/time urgency, and unusually early experience to REVIEW. Use NOT_FIT only for clear incompatibility: existing business owner seeking help with that company; unemployed/between roles seeking immediate replacement income; or clearly not considering entrepreneurship. When uncertain choose REVIEW. Do not reveal internal classification. Draft a short personal REVIEW acknowledgement/next-step email for Martin to edit; no AI mention, pressure, pricing, borrowing, or credit advice.`;

export async function classifyTransition(a: TransitionAnswers): Promise<Qualification> {
  const response = await getOpenAIClient().responses.parse({ model: CLASSIFY_MODEL, input: [{ role: "system", content: prompt }, { role: "user", content: JSON.stringify(a) }], text: { format: zodTextFormat(Schema, "corporate_transition_qualification") } });
  if (!response.output_parsed) throw new Error("Qualification returned no parsed output");
  return response.output_parsed;
}

export const REVIEW_FALLBACK: Qualification = { route: "REVIEW", confidence: "LOW", reasoning: ["Automated qualification was unavailable; human review is required."], concerns: ["Qualification service unavailable."], preCallSummary: "Review the complete application before responding.", reviewDraft: "Thanks for taking the time to share this. I’d like to look carefully at what you’ve told me before suggesting the right next step. I’ll get back to you within 48 hours.\n\n— Martin" };
