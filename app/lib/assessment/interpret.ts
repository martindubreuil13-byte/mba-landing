import "server-only";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient, INTERPRET_MODEL } from "@/app/lib/openai/client";
import { CRITICAL_GAP_FLAG_TEXT, CONTRADICTION_FLAG_TEXT } from "./config";
import type { AssessmentContext, DeterministicScoringResult, GeneratedAssessmentText, OpenAnswerClassification, RawAnswers } from "./types";

// The real constraint on nextActions items is enforced in application code
// (see NEXT_ACTION_MAX_LENGTH below), not here. OpenAI's Structured Outputs
// enforces a Zod `.max()` as a hard structural bound during generation —
// which, when the model's natural sentence runs long, cuts the string off
// mid-word right at that boundary rather than writing a shorter sentence.
// A tight `.max(280)` here reproduced exactly that bug. This schema instead
// carries a generous safety ceiling (guards against a truly pathological
// response) while the prompt and the retry/trim logic below do the real
// work of keeping each item at or under 280 characters, without ever
// producing a mid-word cut.
const NEXT_ACTION_MAX_LENGTH = 280;
const NEXT_ACTION_SCHEMA_CEILING = 600;
const MAX_INTERPRETATION_ATTEMPTS = 2;

const InterpretationSchema = z.object({
  whatISee: z.string().min(1).max(700),
  strongestSignal: z.string().min(1).max(400),
  biggestExposure: z.string().min(1).max(400),
  nextActions: z.array(z.string().min(1).max(NEXT_ACTION_SCHEMA_CEILING)).min(1).max(2),
});

const SYSTEM_PROMPT = `You are the interpretation and communication layer for The Modern Business Architect's "Business Idea Reality Check" — not a decision-maker. All scoring, dimension bands, flags, contradictions, Evidence Debt, the strongest signal and the biggest exposure have ALREADY been calculated deterministically by the application and are given to you as fixed facts. Your only job is to explain what that diagnosis means, concisely, in The Modern Business Architect's voice: direct, calm, unsentimental, respectful of the person's effort.

Governing principles: "Behaviour beats opinion. Payment beats praise. Evidence beats assumptions." "The architecture determines the diagnosis. The AI explains what the diagnosis means." "The score is useful. The pattern is more important. The evidence is more important than both."

Hard boundaries — do not violate any of these:
- Do not invent evidence, statistics or facts not present in the given data.
- Do not treat unsupported respondent claims as independently verified. When restating something only the respondent claimed, say "You report that..." rather than asserting it as fact.
- Do not turn an unknown into negative evidence, or confidence into proof.
- Do not predict probability of success.
- Do not declare the idea good or bad.
- Do not issue PROCEED / EVOLVE / STOP or any similar verdict — those are reserved for paid, deeper human work.
- Do not alter, restate as different, or contradict the deterministic score, dimension scores, flags or exposure you are given.
- If the findings are sparse (many unknowns), say so plainly rather than padding.

You will write four things:
1. whatISee — 2-4 sentences describing the PATTERN across the participant's answers (not a list of scores). Reference specifics from their actual answers where useful.
2. strongestSignal — 1-2 sentences explaining, in plain language, why the given "strongest signal" finding is the strongest piece of evidence currently supporting the idea.
3. biggestExposure — 1-2 sentences explaining, in plain language, why the given "biggest exposure" is the most important gap, unknown or contradiction right now. If material negative evidence is present, state it clearly and directly — do not soften it into a normal score commentary.
4. nextActions — one or two SPECIFIC, evidence-generating actions the person could take in the next 30 days. Ground these in the "priority investigation" action already given to you; personalize it using their own idea/customer language, but do not invent a different action or add unrelated advice. Each item MUST be a single complete sentence of no more than 280 characters — aim for roughly 120–220 characters. If what you want to say would run longer than that, cut detail and say it more concisely rather than writing a longer sentence; never leave a sentence unfinished or end mid-word.

Keep the whole thing tight — this should read like a sharp, concise architect's review, not an AI essay. No headers, no bullet lists inside the string fields (nextActions is already a list at the JSON level).`;

export type InterpretInput = {
  context: AssessmentContext;
  rawAnswers: RawAnswers;
  scoring: DeterministicScoringResult;
  openClassifications: OpenAnswerClassification[];
};

function buildFactsBlock({ context, rawAnswers, scoring, openClassifications }: InterpretInput) {
  const dimensionLines = scoring.dimensionScores
    .map((d) => `- ${d.name}: ${d.earned}/${d.max} (${d.percent}%, ${d.band})`)
    .join("\n");

  const flagLines = scoring.criticalFlags.length
    ? scoring.criticalFlags.map((f) => `- ${f}: ${CRITICAL_GAP_FLAG_TEXT[f]}`).join("\n")
    : "None triggered.";

  const contradictionLines = scoring.contradictions.length
    ? scoring.contradictions.map((c) => `- ${c}: ${CONTRADICTION_FLAG_TEXT[c]}`).join("\n")
    : "None detected.";

  const mneLines = scoring.materialNegativeEvidence.triggered
    ? scoring.materialNegativeEvidence.items
        .map((i) => `- ${i.category} (from ${i.sourceQuestion}): "${i.quote}"`)
        .join("\n")
    : "None.";

  const openAnswerLines = openClassifications
    .map(
      (c) =>
        `- ${c.questionCode}: rubric level ${c.rubricLevel}, direction ${c.direction}, tags [${c.evidenceTags.join(", ")}] — respondent wrote: ${JSON.stringify(rawAnswers[c.questionCode] || "")}`
    )
    .join("\n");

  return `IDEA CONTEXT
Idea name: ${context.ideaName || "(untitled)"}
One-sentence description: ${context.ideaDescription || "(none given)"}
Stage: ${context.stage}

DETERMINISTIC OVERALL SCORE: ${scoring.overallScore}/100 (${scoring.overallBand})
This score measures evidence maturity, not probability of success.

DIMENSION SCORES
${dimensionLines}

CRITICAL-GAP FLAGS
${flagLines}

CONTRADICTIONS
${contradictionLines}

MATERIAL NEGATIVE EVIDENCE
${mneLines}

EVIDENCE DEBT: ${scoring.evidenceDebt.level} — ${scoring.evidenceDebt.rationale}

STRONGEST SIGNAL (already selected deterministically — explain, do not re-select)
Question ${scoring.strongestSignal.questionCode} (${scoring.strongestSignal.dimension}): ${scoring.strongestSignal.finding}
Evidence: ${scoring.strongestSignal.evidence}

BIGGEST EXPOSURE (already selected deterministically — explain, do not re-select)
${scoring.biggestExposure.finding}
Rationale: ${scoring.biggestExposure.rationale}

PRIORITY INVESTIGATION (already selected deterministically — personalize, do not replace)
${scoring.priorityInvestigation.action}

OPEN-ANSWER CLASSIFICATIONS
${openAnswerLines}

CLOSED ANSWERS: ${JSON.stringify(rawAnswers)}`;
}

/**
 * Reduces an over-length nextActions item to at most `maxLength` characters
 * without ever cutting mid-word or mid-sentence: prefers the last complete
 * sentence boundary within budget, then falls back to the last complete
 * word (never a raw character slice) and closes it out with a period so it
 * still reads as a finished thought.
 */
function trimToSentenceBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const window = text.slice(0, maxLength);

  let sentenceEnd = -1;
  for (const terminator of [". ", "! ", "? "]) {
    const idx = window.lastIndexOf(terminator);
    if (idx > sentenceEnd) sentenceEnd = idx;
  }
  if (/[.!?]$/.test(window)) sentenceEnd = Math.max(sentenceEnd, window.length - 1);

  if (sentenceEnd > 0) {
    return window.slice(0, sentenceEnd + 1).trim();
  }

  // No sentence boundary within budget — cut at the last full word instead
  // of mid-word, and close it out as a complete sentence.
  const lastSpace = window.lastIndexOf(" ");
  const wordBoundary = lastSpace > 0 ? window.slice(0, lastSpace) : window;
  return `${wordBoundary.trim().replace(/[,;:.!?-]+$/, "")}.`;
}

export async function generateInterpretation(input: InterpretInput): Promise<GeneratedAssessmentText> {
  const client = getOpenAIClient();

  let parsed: z.infer<typeof InterpretationSchema> | null = null;

  for (let attempt = 1; attempt <= MAX_INTERPRETATION_ATTEMPTS; attempt++) {
    const response = await client.responses.parse({
      model: INTERPRET_MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildFactsBlock(input) },
      ],
      text: { format: zodTextFormat(InterpretationSchema, "reality_check_interpretation") },
    });

    const candidate = response.output_parsed;
    if (!candidate) continue;

    parsed = candidate;
    const withinBudget = candidate.nextActions.every((a) => a.length <= NEXT_ACTION_MAX_LENGTH);
    if (withinBudget) break;

    if (attempt < MAX_INTERPRETATION_ATTEMPTS) {
      console.warn(`Interpretation attempt ${attempt} had an over-length nextActions item; regenerating.`);
    }
  }

  if (!parsed) throw new Error("OpenAI interpretation returned no parsed output");

  const nextActions = parsed.nextActions.map((action) => {
    if (action.length <= NEXT_ACTION_MAX_LENGTH) return action;
    console.warn(`nextActions item still over ${NEXT_ACTION_MAX_LENGTH} chars after retries; trimming at a sentence boundary.`);
    return trimToSentenceBoundary(action, NEXT_ACTION_MAX_LENGTH);
  });

  return {
    whatISee: parsed.whatISee,
    strongestSignal: parsed.strongestSignal,
    biggestExposure: parsed.biggestExposure,
    nextActions,
  };
}
