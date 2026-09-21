import type {
  ContradictionFlag,
  CriticalGapFlag,
  DimensionKey,
  EvidenceDirection,
  EvidenceTag,
  MaterialNegativeEvidenceCategory,
  StageCode,
} from "./config";

/** Raw participant answers, keyed by question code ("q01".."q13"). */
export type RawAnswers = Record<string, string>;

export type QuestionScore = {
  code: string;
  points: number;
  maxPoints: number;
  /** For open questions: the rubric level the LLM classified the answer into. */
  rubricLevel?: number;
};

export type DimensionScore = {
  key: DimensionKey;
  name: string;
  earned: number;
  max: number;
  percent: number;
  band: string;
};

export type OpenAnswerClassification = {
  questionCode: string;
  rubricLevel: number;
  evidenceTags: EvidenceTag[];
  direction: EvidenceDirection;
  reason: string;
  materialNegativeEvidenceCategory: MaterialNegativeEvidenceCategory | null;
};

export type EvidenceProfile = {
  unknown: number;
  assumption: number;
  supporting: number;
  direct: number;
  behavioural: number;
  commercial: number;
};

export type MaterialNegativeEvidenceItem = {
  category: MaterialNegativeEvidenceCategory;
  sourceQuestion: string;
  quote: string;
};

export type MaterialNegativeEvidence = {
  triggered: boolean;
  items: MaterialNegativeEvidenceItem[];
};

export type EvidenceDebt = {
  level: "None" | "Emerging" | "Moderate" | "Material" | "Severe";
  rationale: string;
};

export type SignalRef = {
  questionCode: string;
  dimension: DimensionKey;
  finding: string;
  evidence: string;
};

export type ExposureRef = {
  dimension: DimensionKey | "market" | "economics";
  finding: string;
  rationale: string;
};

export type PriorityInvestigation = {
  action: string;
  rationale: string;
};

export type GeneratedAssessmentText = {
  whatISee: string;
  strongestSignal: string;
  biggestExposure: string;
  nextActions: string[];
};

export type DeterministicScoringResult = {
  questionScores: QuestionScore[];
  dimensionScores: DimensionScore[];
  overallScore: number;
  overallBand: string;
  criticalFlags: CriticalGapFlag[];
  contradictions: ContradictionFlag[];
  evidenceProfile: EvidenceProfile;
  evidenceDebt: EvidenceDebt;
  strongestSignal: SignalRef;
  biggestExposure: ExposureRef;
  priorityInvestigation: PriorityInvestigation;
  materialNegativeEvidence: MaterialNegativeEvidence;
};

export type AssessmentContext = {
  ideaName: string;
  ideaDescription: string;
  stage: StageCode;
  location: string | null;
};

export type AssessmentAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
};

/** Row shape of the `assessments` table. */
export type AssessmentRow = {
  id: string;
  assessment_version: string;
  lead_id: string | null;
  created_at: string;
  completed_at: string | null;

  idea_name: string | null;
  idea_description: string | null;
  business_stage: string;
  location: string | null;

  raw_answers: RawAnswers;
  question_scores: QuestionScore[];
  dimension_scores: DimensionScore[];
  overall_score: number;

  open_answer_classifications: OpenAnswerClassification[] | null;
  evidence_tags: Record<string, EvidenceTag[]> | null;
  evidence_direction: Record<string, EvidenceDirection> | null;

  critical_flags: CriticalGapFlag[];
  contradictions: ContradictionFlag[];
  material_negative_evidence: MaterialNegativeEvidence;
  evidence_debt: EvidenceDebt | null;

  strongest_signal: SignalRef | null;
  biggest_exposure: ExposureRef | null;
  priority_investigation: PriorityInvestigation | null;

  generated_assessment_text: GeneratedAssessmentText | null;
  generation_status: "pending" | "ok" | "failed";
  generation_error: string | null;

  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;

  cta_clicked: string | null;
  cta_clicked_at: string | null;
};
