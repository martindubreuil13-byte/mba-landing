/**
 * Deterministic scoring engine for the Business Idea Reality Check.
 *
 * Everything here is pure, synchronous and has nothing to do with the LLM.
 * The LLM (see classify.ts / interpret.ts) only ever (a) classifies open
 * answers into the rubric levels defined in config.ts, and (b) writes prose
 * around facts this file has already computed. It never produces a point
 * value, a flag, a dimension score or the overall score.
 *
 * Where the master spec left a rule qualitative or underspecified (dimension
 * scope of the evidence profile, contradiction "high/low" thresholds,
 * Evidence Debt's level scale, the biggest-exposure/strongest-signal
 * selection weights, the Customer Reality priority action), the choice made
 * is documented inline. These are disclosed engineering judgment calls, not
 * silent reinterpretations of the framework's actual point values, bands or
 * flag conditions, all of which are copied verbatim from the source doc.
 */

import {
  CLOSED_QUESTION_CODES,
  type ClosedQuestion,
  CONTRADICTION_FLAG_TEXT,
  type ContradictionFlag,
  CRITICAL_GAP_FLAG_TEXT,
  type CriticalGapFlag,
  DIMENSION_BANDS,
  DIMENSIONS,
  type DimensionKey,
  OVERALL_BANDS,
  OVERALL_MAX_SCORE,
  PRIORITY_INVESTIGATION_ACTIONS,
  QUESTION_BY_CODE,
  bandFor,
  stageAtLeast,
  type StageCode,
} from "./config";
import type {
  DeterministicScoringResult,
  DimensionScore,
  EvidenceDebt,
  EvidenceProfile,
  ExposureRef,
  MaterialNegativeEvidence,
  OpenAnswerClassification,
  QuestionScore,
  RawAnswers,
  SignalRef,
} from "./types";

// ============================================================
// Per-question points
// ============================================================

export function scoreClosedAnswer(code: string, value: string): number {
  const question = QUESTION_BY_CODE[code] as ClosedQuestion;
  const option = question.options.find((o) => o.value === value);
  if (!option) {
    throw new Error(`Invalid answer "${value}" for closed question ${code}`);
  }
  return option.points;
}

export function scoreOpenAnswer(code: string, rubricLevel: number): number {
  const question = QUESTION_BY_CODE[code];
  if (question.kind !== "open") throw new Error(`${code} is not an open question`);
  const valid = question.rubric.some((r) => r.level === rubricLevel);
  if (!valid) {
    throw new Error(`Rubric level ${rubricLevel} is not valid for ${code}`);
  }
  return rubricLevel;
}

export function computeQuestionScores(
  rawAnswers: RawAnswers,
  openClassifications: OpenAnswerClassification[]
): QuestionScore[] {
  const classByCode = new Map(openClassifications.map((c) => [c.questionCode, c]));

  return Object.keys(QUESTION_BY_CODE).map((code) => {
    const question = QUESTION_BY_CODE[code];
    if (question.kind === "closed") {
      const value = rawAnswers[code];
      const points = scoreClosedAnswer(code, value);
      return { code, points, maxPoints: question.maxPoints };
    }

    const classification = classByCode.get(code);
    if (!classification) {
      throw new Error(`Missing open-answer classification for ${code}`);
    }
    const points = scoreOpenAnswer(code, classification.rubricLevel);
    return { code, points, maxPoints: question.maxPoints, rubricLevel: classification.rubricLevel };
  });
}

function scoreByCode(questionScores: QuestionScore[]) {
  return new Map(questionScores.map((q) => [q.code, q]));
}

// ============================================================
// Dimensions + overall
// ============================================================

export function computeDimensionScores(questionScores: QuestionScore[]): DimensionScore[] {
  const byCode = scoreByCode(questionScores);

  return (Object.keys(DIMENSIONS) as DimensionKey[]).map((key) => {
    const dim = DIMENSIONS[key];
    const earned = dim.questionCodes.reduce((sum, code) => sum + (byCode.get(code)?.points ?? 0), 0);
    const percent = Math.round((earned / dim.maxPoints) * 100);
    const band = bandFor(DIMENSION_BANDS, percent).label;
    return { key, name: dim.name, earned, max: dim.maxPoints, percent, band };
  });
}

export function computeOverallScore(questionScores: QuestionScore[]) {
  const overallScore = questionScores.reduce((sum, q) => sum + q.points, 0);
  const overallBand = bandFor(OVERALL_BANDS, overallScore).label;
  return { overallScore: Math.min(overallScore, OVERALL_MAX_SCORE), overallBand };
}

// ============================================================
// Critical-gap flags (exact thresholds from the master spec)
// ============================================================

export function computeCriticalFlags(
  questionScores: QuestionScore[],
  stage: StageCode
): CriticalGapFlag[] {
  const byCode = scoreByCode(questionScores);
  const pts = (code: string) => byCode.get(code)?.points ?? 0;
  const flags: CriticalGapFlag[] = [];

  if (pts("q02") <= 2) flags.push("WEAK_PROBLEM_TENSION");
  if (pts("q06") <= 2 && stageAtLeast(stage, "C")) flags.push("CUSTOMER_EVIDENCE_GAP");
  if (pts("q07") <= 4 && stageAtLeast(stage, "D")) flags.push("PURCHASE_EVIDENCE_GAP");
  if (pts("q10") <= 2) flags.push("MARKET_REALITY_GAP");
  // Read as (Q11<=2 OR Q12<=2) AND stage>=First Customers — the natural
  // precedence for the spec's "Q11 ≤ 2 or Q12 ≤ 2 and stage ≥ First
  // Customers" wording.
  if ((pts("q11") <= 2 || pts("q12") <= 2) && stageAtLeast(stage, "E")) {
    flags.push("ECONOMIC_VISIBILITY_GAP");
  }
  if (pts("q13") <= 3 && stageAtLeast(stage, "D")) flags.push("REALITY_GAP");

  return flags;
}

// ============================================================
// Contradiction flags
//
// The spec states these five rules narratively ("Q2 is high and Q5 low",
// etc.) without numeric thresholds. Each is translated below into the
// specific answer letters / rubric levels that most literally match the
// spec's own wording (documented per rule).
// ============================================================

export function computeContradictions(
  rawAnswers: RawAnswers,
  openClassifications: OpenAnswerClassification[]
): ContradictionFlag[] {
  const flags: ContradictionFlag[] = [];
  const rubricLevel = (code: string) =>
    openClassifications.find((c) => c.questionCode === code)?.rubricLevel ?? null;

  // Q2 high ("significant recurring consequence") + Q5 low (unknown/assumed
  // existing behaviour) — urgency claimed with no evidence anyone acts on it.
  if (rawAnswers.q02 === "C" && [0, 1].includes(rubricLevel("q05") ?? -1)) {
    flags.push("PROBLEM_TENSION_WITHOUT_BEHAVIOUR");
  }

  // Q7 = stated willingness ("customers say they would consider paying")
  // while Q13 shows no meaningful commitment yet (still in-head or reactions-only).
  if (rawAnswers.q07 === "B" && ["A", "B"].includes(rawAnswers.q13)) {
    flags.push("STATED_WILLINGNESS_NO_COMMITMENT");
  }

  // Q10 high (can estimate reachable customers) while Q3 is undefined/extremely broad.
  if (rawAnswers.q10 === "C" && [0, 1].includes(rubricLevel("q03") ?? -1)) {
    flags.push("MARKET_UNDERSTANDING_WITHOUT_CUSTOMER");
  }

  // Q11/Q12 high (real transaction economics or required volume worked out)
  // while Q7 is low (belief only, or merely stated interest).
  if ((["C", "D"].includes(rawAnswers.q11) || ["C", "D"].includes(rawAnswers.q12)) &&
      ["A", "B"].includes(rawAnswers.q07)) {
    flags.push("ECONOMICS_WITHOUT_PURCHASE_EVIDENCE");
  }

  // Q1/Q3/Q10 weak while Q13 is strong — behaviour ahead of explanation.
  const weakFormal =
    [0, 1].includes(rubricLevel("q01") ?? -1) ||
    [0, 1].includes(rubricLevel("q03") ?? -1) ||
    ["A", "D"].includes(rawAnswers.q10);
  if (weakFormal && ["C", "D", "E"].includes(rawAnswers.q13)) {
    flags.push("WEAK_THEORY_STRONG_REALITY");
  }

  return flags;
}

// ============================================================
// Evidence profile
//
// Scope: the three closed questions whose answer options ARE the evidence
// hierarchy (Q06, Q07, Q13) plus the LLM-classified evidence tags on the
// four open questions. The remaining closed questions (Q02, Q04, Q08, Q10,
// Q11, Q12) measure maturity of understanding rather than evidence source,
// so forcing them onto the assumption→commercial ladder would misrepresent
// them — they are not counted in this profile.
// ============================================================

const Q06_BUCKET: Record<string, keyof EvidenceProfile> = {
  A: "assumption", B: "supporting", C: "direct", D: "behavioural", E: "unknown",
};
const Q07_BUCKET: Record<string, keyof EvidenceProfile> = {
  A: "assumption", B: "direct", C: "commercial", D: "commercial", E: "unknown",
};
const Q13_BUCKET: Record<string, keyof EvidenceProfile> = {
  A: "unknown", B: "direct", C: "behavioural", D: "commercial", E: "commercial",
};

const TAG_BUCKET: Partial<Record<string, keyof EvidenceProfile>> = {
  ASSUMPTION: "assumption",
  EXTERNAL_SUPPORT: "supporting",
  DIRECT_EVIDENCE: "direct",
  BEHAVIOURAL_EVIDENCE: "behavioural",
  COMMERCIAL_EVIDENCE: "commercial",
  UNKNOWN: "unknown",
};

export function computeEvidenceProfile(
  rawAnswers: RawAnswers,
  openClassifications: OpenAnswerClassification[]
): EvidenceProfile {
  const profile: EvidenceProfile = {
    unknown: 0, assumption: 0, supporting: 0, direct: 0, behavioural: 0, commercial: 0,
  };

  const bump = (bucket: keyof EvidenceProfile) => { profile[bucket] += 1; };

  if (rawAnswers.q06 && Q06_BUCKET[rawAnswers.q06]) bump(Q06_BUCKET[rawAnswers.q06]);
  if (rawAnswers.q07 && Q07_BUCKET[rawAnswers.q07]) bump(Q07_BUCKET[rawAnswers.q07]);
  if (rawAnswers.q13 && Q13_BUCKET[rawAnswers.q13]) bump(Q13_BUCKET[rawAnswers.q13]);

  for (const c of openClassifications) {
    for (const tag of c.evidenceTags) {
      const bucket = TAG_BUCKET[tag];
      if (bucket) bump(bucket);
    }
  }

  return profile;
}

// ============================================================
// Material negative evidence
//
// Derived entirely from the classification step (classify.ts): each open
// answer may carry a materialNegativeEvidenceCategory tag when that specific
// answer itself describes one of the spec's six MNE situations. The
// override only fires when that tag is paired with a NEGATIVE/CONTRADICTORY
// direction AND a non-assumption evidence tag — the app decides the flag,
// the LLM only tags evidence. The "quote" is the respondent's own raw
// answer text, never something invented by the model.
// ============================================================

const MNE_QUALIFYING_TAGS = ["DIRECT_EVIDENCE", "BEHAVIOURAL_EVIDENCE", "COMMERCIAL_EVIDENCE"] as const;

export function extractMaterialNegativeEvidence(
  rawAnswers: RawAnswers,
  openClassifications: OpenAnswerClassification[]
): MaterialNegativeEvidence {
  const items = openClassifications
    .filter((c) => c.materialNegativeEvidenceCategory !== null)
    .filter((c) => c.direction === "NEGATIVE" || c.direction === "CONTRADICTORY")
    .filter((c) => c.evidenceTags.some((t) => (MNE_QUALIFYING_TAGS as readonly string[]).includes(t)))
    .map((c) => ({
      category: c.materialNegativeEvidenceCategory!,
      sourceQuestion: c.questionCode,
      quote: (rawAnswers[c.questionCode] || "").trim().slice(0, 400),
    }))
    .filter((item) => item.quote.length > 0);

  return { triggered: items.length > 0, items };
}

// ============================================================
// Evidence Debt
//
// The spec defines the *concept* (gap between evidence held and evidence
// that should reasonably exist given the stage) but no level scale or
// formula. This implements a deterministic stage-weighted count of
// triggered critical-gap flags (each critical flag already IS a piece of
// "should exist by now but doesn't"), plus a smaller contribution from
// zero-scored answers generally, plus a bump when material negative
// evidence is present.
// ============================================================

const STAGE_WEIGHT: Record<StageCode, number> = { A: 0.5, B: 0.75, C: 1.0, D: 1.5, E: 2.0, F: 2.0 };
const STAGE_LABEL: Record<StageCode, string> = {
  A: "Idea", B: "Researching", C: "Testing", D: "MVP", E: "First Customers", F: "Operating",
};

export function computeEvidenceDebt(
  stage: StageCode,
  criticalFlags: CriticalGapFlag[],
  questionScores: QuestionScore[],
  materialNegativeEvidence: MaterialNegativeEvidence
): EvidenceDebt {
  const weight = STAGE_WEIGHT[stage];
  const zeroScored = questionScores.filter((q) => q.points === 0).length;

  const debtScore =
    criticalFlags.length * weight +
    zeroScored * 0.25 * weight +
    (materialNegativeEvidence.triggered ? 2 * weight : 0);

  let level: EvidenceDebt["level"];
  if (debtScore < 1) level = "None";
  else if (debtScore < 3) level = "Emerging";
  else if (debtScore < 6) level = "Moderate";
  else if (debtScore < 10) level = "Material";
  else level = "Severe";

  const flagList = criticalFlags.map((f) => CRITICAL_GAP_FLAG_TEXT[f]).join(" ");
  const rationale =
    criticalFlags.length === 0
      ? `At the ${STAGE_LABEL[stage]} stage, no critical evidence gaps are currently flagged.` +
        (materialNegativeEvidence.triggered
          ? " Material negative evidence was found, however, and should not be discounted."
          : "")
      : `At the ${STAGE_LABEL[stage]} stage, ${criticalFlags.length} evidence gap${criticalFlags.length > 1 ? "s" : ""} carr${criticalFlags.length > 1 ? "y" : "ies"} more weight than the same gaps would at an earlier stage. ${flagList}`;

  return { level, rationale };
}

// ============================================================
// Strongest signal
//
// No formula is given in the spec beyond "choose deterministically where
// possible" and the governing principle "behaviour beats opinion, payment
// beats praise". This implements a stage-agnostic weighted ranking: each
// question's evidence ratio (points/max) is multiplied by a fixed priority
// weight reflecting how decisive that evidence type is under the doc's own
// hierarchy (payment and real-world contact weigh heaviest).
// ============================================================

const SIGNAL_PRIORITY_WEIGHT: Record<string, number> = {
  q07: 3, q13: 3, q06: 2, q05: 2, q08: 2,
};

export function selectStrongestSignal(
  rawAnswers: RawAnswers,
  questionScores: QuestionScore[],
  openClassifications: OpenAnswerClassification[]
): SignalRef {
  const byCode = scoreByCode(questionScores);
  let best: { code: string; score: number } | null = null;

  for (const code of Object.keys(QUESTION_BY_CODE)) {
    const q = byCode.get(code);
    if (!q || q.maxPoints === 0) continue;
    const ratio = q.points / q.maxPoints;
    const weight = SIGNAL_PRIORITY_WEIGHT[code] ?? 1;
    const score = ratio * weight;
    if (!best || score > best.score) best = { code, score };
  }

  const code = best!.code;
  const question = QUESTION_BY_CODE[code];
  const dimension = question.dimension;

  if (question.kind === "closed") {
    const value = rawAnswers[code];
    const option = question.options.find((o) => o.value === value)!;
    return { questionCode: code, dimension, finding: `${question.prompt}`, evidence: option.label };
  }

  const classification = openClassifications.find((c) => c.questionCode === code)!;
  return {
    questionCode: code,
    dimension,
    finding: `${question.prompt}`,
    evidence: classification.reason,
  };
}

// ============================================================
// Biggest exposure
//
// Dependency-aware selection per the spec's own worked examples: a missing
// TAM calculation is rarely the chief exposure for a business losing money
// per transaction (weak economics matters more); strong economic
// assumptions with no purchase evidence make purchase reality the priority.
// This is implemented as: foundational gaps (problem/customer essentially
// undefined) dominate first; then weak purchase evidence dominates over
// market/economics; otherwise a stage- and dependency-weighted severity
// ranking picks among the remaining dimensions.
// ============================================================

const DEPENDENCY_WEIGHT: Record<DimensionKey, number> = {
  problem: 1.0, customer: 1.15, purchase: 1.3, market_economic: 0.85, real_world: 1.1,
};

export function selectBiggestExposure(
  stage: StageCode,
  dimensionScores: DimensionScore[],
  questionScores: QuestionScore[],
  materialNegativeEvidence: MaterialNegativeEvidence
): ExposureRef {
  if (materialNegativeEvidence.triggered) {
    const item = materialNegativeEvidence.items[0];
    return {
      dimension: "purchase",
      finding: "Material negative evidence outweighs the numerical score.",
      rationale: `${item.category.replaceAll("_", " ").toLowerCase()}: "${item.quote}"`,
    };
  }

  const byKey = new Map(dimensionScores.map((d) => [d.key, d]));
  const problem = byKey.get("problem")!;
  const customer = byKey.get("customer")!;
  const purchase = byKey.get("purchase")!;

  if (problem.percent < 30) {
    return { dimension: "problem", finding: problem.name, rationale: "The problem itself remains largely unsupported or unexplored — nothing downstream can be evaluated reliably until this is." };
  }
  if (customer.percent < 30) {
    return { dimension: "customer", finding: customer.name, rationale: "No recognizable first customer or supporting evidence exists yet — purchase, market and economic answers rest on an undefined customer." };
  }
  if (purchase.percent < 55) {
    return { dimension: "purchase", finding: purchase.name, rationale: "Commercial commitment is weak or unproven — strong theory elsewhere does not compensate for that." };
  }

  const byCode = scoreByCode(questionScores);
  const stageWeight = STAGE_WEIGHT[stage];
  const candidates: DimensionKey[] = ["customer", "purchase", "market_economic", "real_world"];
  let chosen: { key: DimensionKey; severity: number } | null = null;

  for (const key of candidates) {
    const d = byKey.get(key)!;
    const severity = (100 - d.percent) * DEPENDENCY_WEIGHT[key] * stageWeight;
    if (!chosen || severity > chosen.severity) chosen = { key, severity };
  }

  const dim = byKey.get(chosen!.key)!;

  if (chosen!.key === "market_economic") {
    const q10 = byCode.get("q10")!;
    const q11 = byCode.get("q11")!;
    const q12 = byCode.get("q12")!;
    const marketRatio = q10.points / q10.maxPoints;
    const economicsRatio = (q11.points + q12.points) / (q11.maxPoints + q12.maxPoints);
    const sub = marketRatio <= economicsRatio ? "market" : "economics";
    return {
      dimension: sub,
      finding: sub === "market" ? "Reachable market is not credibly sized." : "Transaction economics or required volume are not understood.",
      rationale: `${dim.name} scored ${dim.percent}% — the weaker half of this dimension is ${sub === "market" ? "market sizing" : "unit/volume economics"}.`,
    };
  }

  return {
    dimension: chosen!.key,
    finding: dim.name,
    rationale: `${dim.name} scored ${dim.percent}% (${dim.band}), the most consequential remaining gap at this stage given how much weight it carries relative to the other dimensions.`,
  };
}

export function selectPriorityInvestigation(exposure: ExposureRef): { action: string; rationale: string } {
  const key = exposure.dimension as keyof typeof PRIORITY_INVESTIGATION_ACTIONS;
  const action = PRIORITY_INVESTIGATION_ACTIONS[key] ?? PRIORITY_INVESTIGATION_ACTIONS.real_world;
  return { action, rationale: exposure.rationale };
}

// ============================================================
// Full deterministic pipeline
// ============================================================

export function runDeterministicScoring(
  rawAnswers: RawAnswers,
  stage: StageCode,
  openClassifications: OpenAnswerClassification[]
): DeterministicScoringResult {
  const questionScores = computeQuestionScores(rawAnswers, openClassifications);
  const dimensionScores = computeDimensionScores(questionScores);
  const { overallScore, overallBand } = computeOverallScore(questionScores);
  const criticalFlags = computeCriticalFlags(questionScores, stage);
  const contradictions = computeContradictions(rawAnswers, openClassifications);
  const evidenceProfile = computeEvidenceProfile(rawAnswers, openClassifications);
  const materialNegativeEvidence = extractMaterialNegativeEvidence(rawAnswers, openClassifications);
  const evidenceDebt = computeEvidenceDebt(stage, criticalFlags, questionScores, materialNegativeEvidence);
  const strongestSignal = selectStrongestSignal(rawAnswers, questionScores, openClassifications);
  const biggestExposure = selectBiggestExposure(stage, dimensionScores, questionScores, materialNegativeEvidence);
  const priorityInvestigation = selectPriorityInvestigation(biggestExposure);

  return {
    questionScores,
    dimensionScores,
    overallScore,
    overallBand,
    criticalFlags,
    contradictions,
    evidenceProfile,
    evidenceDebt,
    strongestSignal,
    biggestExposure,
    priorityInvestigation,
    materialNegativeEvidence,
  };
}

export { CONTRADICTION_FLAG_TEXT, CRITICAL_GAP_FLAG_TEXT, CLOSED_QUESTION_CODES };
