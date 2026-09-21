import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { Lead } from "@/app/lib/resources/types";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type UpsertLeadInput = {
  first_name: string;
  email: string;
  country?: string | null;
  ongoing_content_opt_in: boolean;
};

/**
 * Shared lead dedup/upsert logic used by every lead-capture surface
 * (resource requests, the Business Idea Reality Check, and any future one).
 * Email is the dedup key (DB-enforced unique constraint on `leads.email`).
 * A prior opt-in is promoted from false→true when the new submission opts
 * in, but is never silently demoted back to false just because a later
 * form was submitted with the box unchecked.
 */
export async function upsertLeadPreservingOptIn(input: UpsertLeadInput): Promise<Lead> {
  const supabase = getServiceClient();
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const { data: existingLead, error: lookupError } = await supabase
    .from("leads")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(`Failed to look up lead: ${lookupError.message}`);

  if (existingLead) {
    const shouldPromoteOptIn = input.ongoing_content_opt_in && !existingLead.ongoing_content_opt_in;

    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update({
        first_name: input.first_name,
        country: input.country ?? existingLead.country,
        ...(shouldPromoteOptIn
          ? { ongoing_content_opt_in: true, ongoing_content_opt_in_at: now }
          : {}),
      })
      .eq("id", existingLead.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update lead: ${updateError.message}`);
    return updatedLead;
  }

  const { data: newLead, error: insertError } = await supabase
    .from("leads")
    .insert({
      first_name: input.first_name,
      email,
      country: input.country ?? null,
      ongoing_content_opt_in: input.ongoing_content_opt_in,
      ongoing_content_opt_in_at: input.ongoing_content_opt_in ? now : null,
    })
    .select()
    .single();

  if (insertError) throw new Error(`Failed to create lead: ${insertError.message}`);
  return newLead;
}
