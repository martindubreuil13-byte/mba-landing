import "server-only";
import { applyOptOut } from "@/app/lib/leads/consent";
import { getServiceClient } from "@/app/lib/supabase/service";
import { upsertLeadPreservingOptIn } from "@/app/lib/leads/upsert";
import type { Lead } from "@/app/lib/resources/types";
import { CALCULATION_VERSION, FORM_VERSION } from "./config";
import type { NapkinAttribution, NapkinCalculationResult, NapkinInputs, NapkinSubmissionRow } from "./types";

export type CreateNapkinSubmissionInput = {
  inputs: NapkinInputs;
  result: NapkinCalculationResult;
  attribution: NapkinAttribution;
};

export async function createNapkinSubmission(input: CreateNapkinSubmissionInput): Promise<NapkinSubmissionRow> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("napkin_submissions")
    .insert({
      form_version: FORM_VERSION,
      calculation_version: CALCULATION_VERSION,
      lead_id: null,

      business_name: input.inputs.businessName || null,
      currency: input.inputs.currency,
      selling_price: input.inputs.sellingPrice,
      money_remaining_per_transaction: input.result.contribution.moneyRemainingPerTransaction,
      monthly_operating_cost: input.result.survival.monthlyOperatingCost,
      required_transactions_per_month: input.result.survival.requiredPerMonthRounded,
      interpretation_category: input.result.interpretation.category,

      raw_inputs: input.inputs,
      calculation_result: input.result,

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

  if (error) throw new Error(`Failed to store Napkin Principle submission: ${error.message}`);
  return data as NapkinSubmissionRow;
}

export async function getNapkinSubmissionById(id: string): Promise<NapkinSubmissionRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("napkin_submissions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load Napkin Principle submission: ${error.message}`);
  return data;
}

export async function getLeadEmailById(id: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("leads").select("email").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  return data?.email ?? null;
}

export type JoinNapkinCommunityInput = {
  submissionId: string;
  first_name: string;
  email: string;
  consent_copy_version: string;
};

/**
 * Attaches a lead to a submission and records consent. Idempotent via the
 * same `joined_at IS NULL` guard used by the Business Idea Reality Check's
 * completeAssessmentWithLead — a double-submit re-attaches nothing a second
 * time and just returns the already-joined row, so the caller can safely
 * retry without double-subscribing or double-emailing.
 */
export async function joinNapkinCommunity(
  input: JoinNapkinCommunityInput
): Promise<{ lead: Lead; submission: NapkinSubmissionRow; alreadyJoined: boolean }> {
  const supabase = getServiceClient();

  const lead = await upsertLeadPreservingOptIn({
    first_name: input.first_name,
    email: input.email,
    ongoing_content_opt_in: true,
  });

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("napkin_submissions")
    .update({
      lead_id: lead.id,
      joined_at: now,
      marketing_consent: true,
      consent_copy_version: input.consent_copy_version,
      consent_at: now,
    })
    .eq("id", input.submissionId)
    .is("joined_at", null)
    .select()
    .single();

  if (updateError && updateError.code !== "PGRST116") {
    throw new Error(`Failed to record community join: ${updateError.message}`);
  }

  if (updated) {
    return { lead, submission: updated as NapkinSubmissionRow, alreadyJoined: false };
  }

  const existing = await getNapkinSubmissionById(input.submissionId);
  if (!existing) throw new Error("Napkin Principle submission not found");
  return { lead, submission: existing, alreadyJoined: true };
}

export async function unsubscribeNapkinLead(leadId: string): Promise<"updated" | "already_unsubscribed" | "not_found"> {
  // One shared opt-out path (also writes the append-only consent record) so
  // legacy Napkin links behave exactly like the neutral /unsubscribe route.
  const result = await applyOptOut(leadId, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1", sourceType: "napkin" });
  return result === "already_opted_out" ? "already_unsubscribed" : result;
}

export async function markNapkinEmailSent(submissionId: string, sent: boolean, error: string | null) {
  const supabase = getServiceClient();
  await supabase
    .from("napkin_submissions")
    .update({ email_sent: sent, email_sent_at: sent ? new Date().toISOString() : null, email_error: error })
    .eq("id", submissionId);
}

export async function recordNapkinCtaClick(submissionId: string, cta: string) {
  const supabase = getServiceClient();
  await supabase
    .from("napkin_submissions")
    .update({ cta_clicked: cta, cta_clicked_at: new Date().toISOString() })
    .eq("id", submissionId);
}
