import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceClient } from "@/app/lib/supabase/service";
import { upsertLeadPreservingOptIn } from "@/app/lib/leads/upsert";
import { PROGRAM_KEY, type Attribution, type TransitionAnswers } from "./corporate-transition";

const LEAD_COLUMNS = "lead:leads(id,first_name,email,country,ongoing_content_opt_in,ongoing_content_opt_in_at,ongoing_content_opt_out_at,suppressed_at,consent_requested_at)";

/** Random, URL-safe, carries no meaning and no personal data. 18 bytes = 144 bits. */
export const newOpaqueToken = () => randomBytes(18).toString("base64url");

/**
 * Saves an application. There is no screening: every valid application becomes INVITED (offered the booking link) with a
 * `booking_ref` (goes into the Calendly link) and a `receipt_token` (stays in the applicant's browser).
 * Idempotent on `idempotencyKey`: a retry returns the original row with `reused: true` and creates nothing.
 */
export async function createApplication(a: TransitionAnswers, attribution: Attribution, idempotencyKey: string) {
  const db = getServiceClient();
  const find = async () => { const { data } = await db.from("program_applications").select("*").eq("idempotency_key", idempotencyKey).maybeSingle(); return data; };
  const old = await find();
  if (old) return { application: old, reused: true };

  let lead;
  try { lead = await upsertLeadPreservingOptIn({ first_name: a.firstName, email: a.email, country: a.country, ongoing_content_opt_in: false }); }
  catch (e) {
    // A concurrent request with the same key may have created the lead (unique email) and the application first.
    const winner = await find();
    if (winner) return { application: winner, reused: true };
    throw e;
  }
  const { data, error } = await db.from("program_applications").insert({
    lead_id: lead.id, program_key: PROGRAM_KEY, answers: a, status: "INVITED", booking_status: "not_booked",
    attribution, idempotency_key: idempotencyKey, booking_ref: newOpaqueToken(), receipt_token: newOpaqueToken(),
  }).select().single();
  if (error) {
    // Two requests with the same key raced: the loser reads the winner's row instead of failing or double-sending.
    const winner = error.code === "23505" ? await find() : null;
    if (winner) return { application: winner, reused: true };
    throw new Error(`Failed to create application: ${error.message}`);
  }
  return { application: data, reused: false };
}

/** The booking_ref a Calendly link carries. Applications from before this flow have none, so one is added on first use. */
export async function ensureBookingRef(application: { id: string; booking_ref?: string | null }): Promise<string> {
  if (application.booking_ref) return application.booking_ref;
  const ref = newOpaqueToken();
  const { error } = await getServiceClient().from("program_applications").update({ booking_ref: ref }).eq("id", application.id).is("booking_ref", null);
  if (error) throw new Error(error.message);
  const { data } = await getServiceClient().from("program_applications").select("booking_ref").eq("id", application.id).maybeSingle();
  if (!data?.booking_ref) throw new Error("Could not assign a booking reference.");
  return data.booking_ref;
}

export async function getApplicationByReceipt(token: string) {
  if (typeof token !== "string" || token.length < 16 || token.length > 100) return null;
  const { data, error } = await getServiceClient().from("program_applications").select("*").eq("receipt_token", token).eq("program_key", PROGRAM_KEY).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMailState(id: string, values: Record<string, unknown>) { const { error } = await getServiceClient().from("program_applications").update(values).eq("id", id); if (error) throw new Error(error.message); }
export async function listApplications() { const { data, error } = await getServiceClient().from("program_applications").select(`*, ${LEAD_COLUMNS}`).eq("program_key", PROGRAM_KEY).order("submitted_at", { ascending: false }); if (error) throw new Error(error.message); return data ?? []; }
export async function getApplication(id: string) { const { data, error } = await getServiceClient().from("program_applications").select(`*, ${LEAD_COLUMNS}`).eq("id", id).eq("program_key", PROGRAM_KEY).maybeSingle(); if (error) throw new Error(error.message); return data; }
