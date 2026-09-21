import type { AssessmentRow } from "./types";

/**
 * Normalizes an `assessments` row (or the fresh payload from
 * /api/assessment/process) into the single shape the result UI renders.
 * Used both by the client-side flow right after submission and by the
 * stable result-URL page (linked from the confirmation email).
 */
export type ResultViewData = {
  ideaName: string | null;
  ideaDescription: string | null;
  stage: string;
  firstName: string | null;
  overallScore: number;
  overallBand: string;
  dimensionScores: AssessmentRow["dimension_scores"];
  criticalFlags: AssessmentRow["critical_flags"];
  contradictions: AssessmentRow["contradictions"];
  evidenceDebt: AssessmentRow["evidence_debt"];
  strongestSignal: AssessmentRow["strongest_signal"];
  biggestExposure: AssessmentRow["biggest_exposure"];
  priorityInvestigation: AssessmentRow["priority_investigation"];
  materialNegativeEvidence: AssessmentRow["material_negative_evidence"];
  generatedAssessmentText: AssessmentRow["generated_assessment_text"];
  generationStatus: AssessmentRow["generation_status"];
};

export function assessmentRowToResultView(row: AssessmentRow, firstName: string | null): ResultViewData {
  return {
    ideaName: row.idea_name,
    ideaDescription: row.idea_description,
    stage: row.business_stage,
    firstName,
    overallScore: row.overall_score,
    overallBand: bandLabelFromScore(row.overall_score),
    dimensionScores: row.dimension_scores,
    criticalFlags: row.critical_flags,
    contradictions: row.contradictions,
    evidenceDebt: row.evidence_debt,
    strongestSignal: row.strongest_signal,
    biggestExposure: row.biggest_exposure,
    priorityInvestigation: row.priority_investigation,
    materialNegativeEvidence: row.material_negative_evidence,
    generatedAssessmentText: row.generated_assessment_text,
    generationStatus: row.generation_status,
  };
}

function bandLabelFromScore(score: number): string {
  if (score >= 85) return "Strong Evidence Base";
  if (score >= 70) return "Substantial Evidence";
  if (score >= 50) return "Developing Case";
  if (score >= 30) return "Some Signals";
  return "Early Evidence";
}
