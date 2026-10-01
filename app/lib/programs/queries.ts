import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { upsertLeadPreservingOptIn } from "@/app/lib/leads/upsert";
import { requestOptIn } from "@/app/lib/leads/consent";
import { CONSENT_VERSION, CONSENT_WORDING, PROGRAM_KEY, type Attribution, type TransitionAnswers } from "./corporate-transition";
import type { Qualification } from "./classify";

export async function createApplication(a: TransitionAnswers, attribution: Attribution, q: Qualification, idempotencyKey: string, evidence: { ipHash: string | null; userAgentHash: string | null }) {
  const db = getServiceClient();
  const { data: old } = await db.from("program_applications").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
  if (old) return { application: old, reused: true };
  const lead = await upsertLeadPreservingOptIn({ first_name: a.firstName, email: a.email, country: a.country, ongoing_content_opt_in: false });
  const now = new Date().toISOString();
  const { data, error } = await db.from("program_applications").insert({
    lead_id: lead.id, program_key: PROGRAM_KEY, answers: a, ai_route: q.route, ai_confidence: q.confidence,
    ai_reasoning: q.reasoning, ai_concerns: q.concerns, ai_pre_call_summary: q.preCallSummary,
    status: q.route === "INVITE" ? "INVITED" : q.route === "REVIEW" ? "UNDER_REVIEW" : "NOT_FIT",
    response_draft: q.route === "REVIEW" ? q.reviewDraft : null, attribution, marketing_consent_requested: a.marketingConsent,
    marketing_consent_requested_at: a.marketingConsent ? now : null, idempotency_key: idempotencyKey,
  }).select().single();
  if (error) throw new Error(`Failed to create application: ${error.message}`);
  if (a.marketingConsent) await requestOptIn(lead.id, { wordingVersion: CONSENT_VERSION, wordingText: CONSENT_WORDING, method: "checkbox", sourceType: "program_application", sourceUrl: "/transition", ipHash: evidence.ipHash, userAgentHash: evidence.userAgentHash });
  return { application: data, reused: false };
}

export async function updateMailState(id: string, values: Record<string, unknown>) { const { error } = await getServiceClient().from("program_applications").update(values).eq("id", id); if (error) throw new Error(error.message); }
export async function listApplications() { const { data, error } = await getServiceClient().from("program_applications").select("*, lead:leads(id,first_name,email,country,ongoing_content_opt_in,consent_requested_at)").eq("program_key", PROGRAM_KEY).order("submitted_at", { ascending: false }); if (error) throw new Error(error.message); return data ?? []; }
export async function getApplication(id: string) { const { data, error } = await getServiceClient().from("program_applications").select("*, lead:leads(id,first_name,email,country,ongoing_content_opt_in,consent_requested_at)").eq("id", id).eq("program_key", PROGRAM_KEY).maybeSingle(); if (error) throw new Error(error.message); return data; }
