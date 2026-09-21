import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { upsertLeadPreservingOptIn } from "@/app/lib/leads/upsert";
import type { Lead } from "@/app/lib/resources/types";
import { ASSESSMENT_VERSION } from "./config";
import type {
  AssessmentAttribution,
  AssessmentContext,
  AssessmentRow,
  DeterministicScoringResult,
  GeneratedAssessmentText,
  OpenAnswerClassification,
  RawAnswers,
} from "./types";

export type CreateAssessmentInput = {
  context: AssessmentContext;
  rawAnswers: RawAnswers;
  scoring: DeterministicScoringResult;
  openAnswerClassifications: OpenAnswerClassification[];
  generatedAssessmentText: GeneratedAssessmentText | null;
  generationStatus: "ok" | "failed";
  generationError: string | null;
  attribution: AssessmentAttribution;
};

export async function createAssessment(input: CreateAssessmentInput): Promise<AssessmentRow> {
  const supabase = getServiceClient();

  const evidenceTags: Record<string, string[]> = {};
  const evidenceDirection: Record<string, string> = {};
  for (const c of input.openAnswerClassifications) {
    evidenceTags[c.questionCode] = c.evidenceTags;
    evidenceDirection[c.questionCode] = c.direction;
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      assessment_version: ASSESSMENT_VERSION,
      lead_id: null,
      idea_name: input.context.ideaName || null,
      idea_description: input.context.ideaDescription || null,
      business_stage: input.context.stage,
      location: input.context.location,

      raw_answers: input.rawAnswers,
      question_scores: input.scoring.questionScores,
      dimension_scores: input.scoring.dimensionScores,
      overall_score: input.scoring.overallScore,

      open_answer_classifications: input.openAnswerClassifications,
      evidence_tags: evidenceTags,
      evidence_direction: evidenceDirection,

      critical_flags: input.scoring.criticalFlags,
      contradictions: input.scoring.contradictions,
      material_negative_evidence: input.scoring.materialNegativeEvidence,
      evidence_debt: input.scoring.evidenceDebt,

      strongest_signal: input.scoring.strongestSignal,
      biggest_exposure: input.scoring.biggestExposure,
      priority_investigation: input.scoring.priorityInvestigation,

      generated_assessment_text: input.generatedAssessmentText,
      generation_status: input.generationStatus,
      generation_error: input.generationError,

      source: input.attribution.source,
      medium: input.attribution.medium,
      campaign: input.attribution.campaign,
      referrer: input.attribution.referrer,
      utm_source: input.attribution.utm_source,
      utm_medium: input.attribution.utm_medium,
      utm_campaign: input.attribution.utm_campaign,
      utm_content: input.attribution.utm_content,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to store assessment: ${error.message}`);
  return data as AssessmentRow;
}

export async function getAssessmentById(id: string): Promise<AssessmentRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load assessment: ${error.message}`);
  return data;
}

export type CompleteAssessmentInput = {
  assessmentId: string;
  first_name: string;
  email: string;
  country?: string | null;
  ongoing_content_opt_in: boolean;
};

/**
 * Attaches a lead to a pending assessment and marks it complete. Reuses the
 * same dedup/opt-in-promotion semantics as every other lead-capture surface.
 * The lead_id-is-null guard on the update makes this idempotent: a
 * double-submit (double click, retry after a flaky response) re-attaches
 * nothing a second time and just returns the already-completed row.
 */
export async function completeAssessmentWithLead(
  input: CompleteAssessmentInput
): Promise<{ lead: Lead; assessment: AssessmentRow }> {
  const supabase = getServiceClient();

  const lead = await upsertLeadPreservingOptIn({
    first_name: input.first_name,
    email: input.email,
    country: input.country,
    ongoing_content_opt_in: input.ongoing_content_opt_in,
  });

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("assessments")
    .update({ lead_id: lead.id, completed_at: now })
    .eq("id", input.assessmentId)
    .is("lead_id", null)
    .select()
    .single();

  if (updateError && updateError.code !== "PGRST116") {
    // PGRST116 = no row matched the filter (already completed) — not a real error.
    throw new Error(`Failed to complete assessment: ${updateError.message}`);
  }

  if (updated) {
    return { lead, assessment: updated as AssessmentRow };
  }

  const existing = await getAssessmentById(input.assessmentId);
  if (!existing) throw new Error("Assessment not found");
  return { lead, assessment: existing };
}

export async function recordAssessmentCtaClick(assessmentId: string, cta: string) {
  const supabase = getServiceClient();
  await supabase
    .from("assessments")
    .update({ cta_clicked: cta, cta_clicked_at: new Date().toISOString() })
    .eq("id", assessmentId);
}

// ============================================================
// ADMIN
// ============================================================

export type AssessmentAdminListItem = AssessmentRow & {
  lead_first_name: string | null;
  lead_email: string | null;
  lead_opt_in: boolean | null;
};

export async function listAssessmentsAdmin(): Promise<AssessmentAdminListItem[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*, lead:leads(first_name, email, ongoing_content_opt_in)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load assessments: ${error.message}`);

  type Row = AssessmentRow & {
    lead: { first_name: string; email: string; ongoing_content_opt_in: boolean } | null;
  };

  return ((data ?? []) as Row[]).map((row) => ({
    ...row,
    lead_first_name: row.lead?.first_name ?? null,
    lead_email: row.lead?.email ?? null,
    lead_opt_in: row.lead?.ongoing_content_opt_in ?? null,
  }));
}

export async function getAssessmentAdminDetail(id: string): Promise<AssessmentAdminListItem | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*, lead:leads(first_name, email, ongoing_content_opt_in)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load assessment: ${error.message}`);
  if (!data) return null;

  const row = data as AssessmentRow & {
    lead: { first_name: string; email: string; ongoing_content_opt_in: boolean } | null;
  };

  return {
    ...row,
    lead_first_name: row.lead?.first_name ?? null,
    lead_email: row.lead?.email ?? null,
    lead_opt_in: row.lead?.ongoing_content_opt_in ?? null,
  };
}

export type LeadAssessmentSummary = { count: number; latestScore: number; latestAt: string };

/** Used to augment the existing Leads admin table with a lightweight column. */
export async function getAssessmentSummaryByLead(): Promise<Map<string, LeadAssessmentSummary>> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("lead_id, overall_score, completed_at")
    .not("lead_id", "is", null)
    .order("completed_at", { ascending: true });

  if (error) throw new Error(`Failed to load assessment summary: ${error.message}`);

  const map = new Map<string, LeadAssessmentSummary>();
  for (const row of data ?? []) {
    const leadId = row.lead_id as string;
    const existing = map.get(leadId);
    map.set(leadId, {
      count: (existing?.count ?? 0) + 1,
      latestScore: row.overall_score,
      latestAt: row.completed_at,
    });
  }
  return map;
}
