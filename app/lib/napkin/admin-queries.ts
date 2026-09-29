import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { NapkinAdminRecord, NapkinAdminStatus } from "./admin-model";

const SELECT = `*, lead:leads(id,first_name,email,ongoing_content_opt_in,ongoing_content_opt_in_at,ongoing_content_opt_out_at), admin:napkin_admin_metadata(submission_id,internal_status,private_notes,updated_at,updated_by)`;

function normalize(record: Record<string, unknown>): NapkinAdminRecord {
  const one = <T>(value: unknown): T | null => Array.isArray(value) ? (value[0] as T || null) : (value as T || null);
  return { ...record, lead: one(record.lead), admin: one(record.admin) } as NapkinAdminRecord;
}

export async function listNapkinAdmin(): Promise<NapkinAdminRecord[]> {
  const { data, error } = await getServiceClient().from("napkin_submissions").select(SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load Napkin submissions: ${error.message}`);
  return (data || []).map((row) => normalize(row as Record<string, unknown>));
}

export async function getNapkinAdminDetail(id: string): Promise<NapkinAdminRecord | null> {
  const { data, error } = await getServiceClient().from("napkin_submissions").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load Napkin submission: ${error.message}`);
  return data ? normalize(data as Record<string, unknown>) : null;
}

export async function updateNapkinAdminMetadata(input: { submissionId: string; status: NapkinAdminStatus; notes: string; adminEmail: string }) {
  const { data, error } = await getServiceClient().from("napkin_admin_metadata").upsert({
    submission_id: input.submissionId,
    internal_status: input.status,
    private_notes: input.notes,
    updated_at: new Date().toISOString(),
    updated_by: input.adminEmail,
  }, { onConflict: "submission_id" }).select().single();
  if (error) throw new Error(`Could not save admin details: ${error.message}`);
  return data;
}

