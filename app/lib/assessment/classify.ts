import "server-only";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { CLASSIFY_MODEL, getOpenAIClient } from "@/app/lib/openai/client";
import {
  EVIDENCE_DIRECTIONS,
  EVIDENCE_TAGS,
  MATERIAL_NEGATIVE_EVIDENCE_CATEGORIES,
  OPEN_QUESTION_CODES,
  QUESTION_BY_CODE,
} from "./config";
import type { OpenAnswerClassification, RawAnswers } from "./types";
import type { AssessmentContext } from "./types";

const ClassificationItemSchema = z.object({
  questionCode: z.enum(OPEN_QUESTION_CODES as [string, ...string[]]),
  rubricLevel: z.number().int(),
  evidenceTags: z.array(z.enum(EVIDENCE_TAGS)).min(1).max(4),
  direction: z.enum(EVIDENCE_DIRECTIONS),
  reason: z.string().min(1).max(320),
  /**
   * Only set when this specific answer itself constitutes material negative
   * evidence per the master spec's definition (repeated qualified-customer
   * rejection, consistent refusal at price, problem rarely experienced,
   * demonstrably impossible required volume, repeated abandonment after
   * trial, or ordinary-condition economics that lose money). Null otherwise.
   * The application — not this classification — decides whether the
   * MATERIAL_NEGATIVE_EVIDENCE override actually fires.
   */
  materialNegativeEvidenceCategory: z.enum(MATERIAL_NEGATIVE_EVIDENCE_CATEGORIES).nullable(),
});

const ClassifyResponseSchema = z.object({
  classifications: z.array(ClassificationItemSchema),
});

function nearestValidLevel(code: string, level: number): number {
  const question = QUESTION_BY_CODE[code];
  if (question.kind !== "open") return level;
  const levels = question.rubric.map((r) => r.level);
  if (levels.includes(level)) return level;
  return levels.reduce((closest, l) => (Math.abs(l - level) < Math.abs(closest - level) ? l : closest), levels[0]);
}

function buildRubricBlock() {
  return OPEN_QUESTION_CODES.map((code) => {
    const q = QUESTION_BY_CODE[code];
    if (q.kind !== "open") return "";
    const levels = q.rubric.map((r) => `${r.level} = ${r.description}`).join("; ");
    return `${code.toUpperCase()} — "${q.prompt}"\nAllowed rubric levels (use ONLY these exact numbers): ${levels}`;
  }).join("\n\n");
}

const SYSTEM_PROMPT = `You are a strict evidence classifier for The Modern Business Architect's "Business Idea Reality Check". You classify open-ended answers into a fixed rubric. You are NOT the scoring authority — the application maps your rubricLevel to points. You must not invent facts, statistics, or claims the respondent did not make.

Governing principles: "Behaviour beats opinion. Payment beats praise. Evidence beats assumptions." Distinguish assumption, unknown, evidence and proof.

For each answer, assign the SINGLE rubric level (an exact number from the allowed list) that best matches the response. If the answer is blank, vague, or restates the solution instead of the problem/customer/behaviour/switching-logic asked for, use the lowest applicable level — do not be generous.

evidenceTags (assign one or more, from this fixed set only): ASSUMPTION (belief/intuition/personal experience, unsupported); EXTERNAL_SUPPORT (cites external research/data); DIRECT_EVIDENCE (from actual intended customers or the actual environment — interviews, observation, pricing discussions, pilots); BEHAVIOURAL_EVIDENCE (people already acting — trying, spending, changing something); COMMERCIAL_EVIDENCE (money has actually changed hands or a real commitment was made); UNKNOWN (not investigated); NEGATIVE_EVIDENCE (credible evidence that challenges the hypothesis); CONTRADICTORY_EVIDENCE (credible evidence in both directions).

direction: POSITIVE (supports the hypothesis), UNKNOWN (insufficient evidence — this is NOT negative, just absent), NEGATIVE (meaningful evidence challenges it), CONTRADICTORY (evidence in both directions).

reason: one concise sentence (<=320 chars) grounded ONLY in what the respondent actually wrote. Never use phrases like "it is a fact that" — if you reference a claim the respondent made without independent verification, phrase it as something they reported, not as verified fact.

materialNegativeEvidenceCategory: set this to one of REPEATED_QUALIFIED_REJECTION, CONSISTENT_PRICE_REFUSAL, PROBLEM_RARELY_EXPERIENCED, IMPOSSIBLE_REQUIRED_VOLUME, REPEATED_ABANDONMENT_AFTER_TRIAL, or ORDINARY_ECONOMICS_LOSE_MONEY ONLY if this specific answer itself describes that exact situation happening (not a hypothesis about it). Otherwise set it to null. Be conservative — most answers should be null here.

${buildRubricBlock()}

Return classifications for ALL FOUR open questions (q01, q03, q05, q09), one object each.`;

export type ClassifyInput = {
  context: AssessmentContext;
  rawAnswers: RawAnswers;
};

export async function classifyOpenAnswers({ context, rawAnswers }: ClassifyInput): Promise<OpenAnswerClassification[]> {
  const client = getOpenAIClient();

  const answersBlock = OPEN_QUESTION_CODES.map((code) => {
    const q = QUESTION_BY_CODE[code];
    return `${code.toUpperCase()} — "${q.prompt}"\nRespondent's answer: ${JSON.stringify(rawAnswers[code] || "")}`;
  }).join("\n\n");

  const userContent = `Idea: ${context.ideaName || "(untitled)"}\nOne-sentence description: ${context.ideaDescription || "(none given)"}\nStage: ${context.stage}\n\n${answersBlock}`;

  const response = await client.responses.parse({
    model: CLASSIFY_MODEL,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    text: { format: zodTextFormat(ClassifyResponseSchema, "open_answer_classification") },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("OpenAI classification returned no parsed output");

  // Defensive validation: clamp any out-of-rubric level rather than trusting
  // it blindly, and guarantee exactly one classification per open question
  // (falling back to the lowest rubric level — "unknown" — if the model
  // dropped one, so scoring can still proceed deterministically).
  const byCode = new Map(parsed.classifications.map((c) => [c.questionCode, c]));

  return OPEN_QUESTION_CODES.map((code) => {
    const item = byCode.get(code);
    if (!item) {
      return {
        questionCode: code,
        rubricLevel: 0,
        evidenceTags: ["UNKNOWN"],
        direction: "UNKNOWN",
        reason: "No classification returned; treated as unknown.",
        materialNegativeEvidenceCategory: null,
      } satisfies OpenAnswerClassification;
    }
    return {
      questionCode: code,
      rubricLevel: nearestValidLevel(code, item.rubricLevel),
      evidenceTags: item.evidenceTags,
      direction: item.direction,
      reason: item.reason,
      materialNegativeEvidenceCategory: item.materialNegativeEvidenceCategory,
    };
  });
}
