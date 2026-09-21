import { NextResponse } from "next/server";
import {
  CLOSED_QUESTION_CODES,
  OPEN_QUESTION_CODES,
  QUESTION_BY_CODE,
  STAGE_OPTIONS,
  type ClosedQuestion,
  type StageCode,
} from "@/app/lib/assessment/config";
import { classifyOpenAnswers } from "@/app/lib/assessment/classify";
import { generateInterpretation } from "@/app/lib/assessment/interpret";
import { runDeterministicScoring } from "@/app/lib/assessment/scoring";
import { createAssessment } from "@/app/lib/assessment/queries";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import type { AssessmentAttribution, AssessmentContext, OpenAnswerClassification, RawAnswers } from "@/app/lib/assessment/types";

// This endpoint makes two OpenAI calls per request — the real cost/abuse
// surface for this feature. 8 completions per 30 minutes per IP comfortably
// covers legitimate use (an assessment plus a couple of retakes) while
// bounding worst-case spend from a scripted attacker.
const RATE_LIMIT_WINDOW_SECONDS = 30 * 60;
const RATE_LIMIT_MAX_REQUESTS = 8;

const STAGE_CODES = STAGE_OPTIONS.map((s) => s.code);

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function validateRawAnswers(rawAnswers: unknown): { ok: true; value: RawAnswers } | { ok: false; error: string } {
  if (!rawAnswers || typeof rawAnswers !== "object") return { ok: false, error: "Missing answers." };
  const input = rawAnswers as Record<string, unknown>;
  const value: RawAnswers = {};

  for (const code of CLOSED_QUESTION_CODES) {
    const question = QUESTION_BY_CODE[code] as ClosedQuestion;
    const raw = input[code];
    if (typeof raw !== "string" || !question.options.some((o) => o.value === raw)) {
      return { ok: false, error: `Invalid answer for ${code}.` };
    }
    value[code] = raw;
  }

  for (const code of OPEN_QUESTION_CODES) {
    const raw = clean(input[code], 1000);
    if (raw.length < 2) return { ok: false, error: `Please answer ${code} — a short sentence is enough.` };
    value[code] = raw;
  }

  return { ok: true, value };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot, same convention as the resource-request form.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const allowed = await checkRateLimit(`assessment_process:${ip}`, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a little while and try again." },
      { status: 429 }
    );
  }

  const rawContext = (body.context ?? {}) as Record<string, unknown>;
  const stage = clean(rawContext.stage, 1);
  if (!STAGE_CODES.includes(stage as StageCode)) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: { stage: "Select where you are today." } }, { status: 400 });
  }

  const context: AssessmentContext = {
    ideaName: clean(rawContext.ideaName, 200),
    ideaDescription: clean(rawContext.ideaDescription, 400),
    stage: stage as StageCode,
    location: clean(rawContext.location, 200) || null,
  };

  const answersResult = validateRawAnswers(body.rawAnswers);
  if (!answersResult.ok) {
    return NextResponse.json({ error: answersResult.error }, { status: 400 });
  }
  const rawAnswers = answersResult.value;

  const rawAttribution = (body.attribution ?? {}) as Record<string, unknown>;
  const utm = (rawAttribution.utm ?? {}) as Record<string, unknown>;
  const attribution: AssessmentAttribution = {
    source: clean(rawAttribution.source, 200) || null,
    medium: clean(rawAttribution.medium, 200) || null,
    campaign: clean(rawAttribution.campaign, 200) || null,
    referrer: clean(rawAttribution.referrer, 500) || null,
    utm_source: clean(utm.source, 200) || null,
    utm_medium: clean(utm.medium, 200) || null,
    utm_campaign: clean(utm.campaign, 200) || null,
    utm_content: clean(utm.content, 200) || null,
  };

  // Call A: classify the four open answers into the master spec's rubric.
  // If this fails outright, fall back to "unknown" for every open question
  // so deterministic scoring can still run and the assessment is never
  // lost — a degraded-but-honest result beats no result.
  let openClassifications: OpenAnswerClassification[];
  let classificationDegraded = false;
  try {
    openClassifications = await classifyOpenAnswers({ context, rawAnswers });
  } catch (error) {
    console.error("Open-answer classification failed:", error);
    classificationDegraded = true;
    openClassifications = OPEN_QUESTION_CODES.map((code) => ({
      questionCode: code,
      rubricLevel: 0,
      evidenceTags: ["UNKNOWN"],
      direction: "UNKNOWN",
      reason: "Automatic classification was unavailable; treated as unknown rather than guessed.",
      materialNegativeEvidenceCategory: null,
    }));
  }

  const scoring = runDeterministicScoring(rawAnswers, context.stage, openClassifications);

  // Call B: write the participant-facing narrative from the facts already
  // computed above. Best-effort — a failure here never loses the
  // deterministic assessment, per the resilience requirement.
  let generatedAssessmentText = null;
  let generationStatus: "ok" | "failed" = "failed";
  let generationError: string | null = classificationDegraded
    ? "Open-answer classification was unavailable; scored conservatively as unknown."
    : null;

  if (!classificationDegraded) {
    try {
      generatedAssessmentText = await generateInterpretation({ context, rawAnswers, scoring, openClassifications });
      generationStatus = "ok";
    } catch (error) {
      console.error("Interpretation generation failed:", error);
      generationError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  let assessment;
  try {
    assessment = await createAssessment({
      context,
      rawAnswers,
      scoring,
      openAnswerClassifications: openClassifications,
      generatedAssessmentText,
      generationStatus,
      generationError,
      attribution,
    });
  } catch (error) {
    console.error("Failed to store assessment:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    assessmentId: assessment.id,
    context,
    scoring: {
      overallScore: scoring.overallScore,
      overallBand: scoring.overallBand,
      dimensionScores: scoring.dimensionScores,
      criticalFlags: scoring.criticalFlags,
      contradictions: scoring.contradictions,
      evidenceDebt: scoring.evidenceDebt,
      strongestSignal: scoring.strongestSignal,
      biggestExposure: scoring.biggestExposure,
      priorityInvestigation: scoring.priorityInvestigation,
      materialNegativeEvidence: scoring.materialNegativeEvidence,
    },
    generatedAssessmentText,
    generationStatus,
  });
}
