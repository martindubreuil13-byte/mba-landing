import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { RECENT_SEND_DAYS, normalizeEmail, splitName, type DeliveryResult, type DraftInput, type OutreachDraft, type RecentSend } from "./model";

/** Database access for individual outreach. Every function here needs an admin session checked by its caller. */

const columns = "id,recipient_email,recipient_name,lead_id,subject,preview_text,editor_operations,campaign_id,updated_at";
type Row = { id: string; recipient_email: string; recipient_name: string; lead_id: string | null; subject: string; preview_text: string; editor_operations: unknown[]; campaign_id: string | null; updated_at: string };
type CampaignState = { started_at: string | null } | { started_at: string | null }[] | null;

const toDraft = (row: Row): OutreachDraft => ({
  id: row.id, recipientEmail: row.recipient_email, recipientName: row.recipient_name, leadId: row.lead_id,
  subject: row.subject, previewText: row.preview_text, operations: row.editor_operations, updatedAt: row.updated_at,
});

/** A draft is "sent" once its review snapshot was claimed for sending, even if the send is still running or its outcome is unclear. */
async function startedAt(campaignId: string | null): Promise<string | null> {
  if (!campaignId) return null;
  const { data, error } = await getServiceClient().from("email_campaigns").select("started_at").eq("id", campaignId).maybeSingle();
  if (error) throw new Error("Could not check whether this draft was sent.");
  return (data as { started_at: string | null } | null)?.started_at ?? null;
}

/** Drafts that have not been sent, newest first. Sent ones live in Campaign history. */
export async function listDrafts(): Promise<OutreachDraft[] | null> {
  const { data, error } = await getServiceClient().from("email_outreach_drafts")
    .select(`${columns},email_campaigns(started_at)`).order("updated_at", { ascending: false }).limit(200);
  if (error) return null;
  return (data as unknown as (Row & { email_campaigns: CampaignState })[])
    .filter((row) => {
      const campaign = Array.isArray(row.email_campaigns) ? row.email_campaigns[0] : row.email_campaigns;
      return !campaign?.started_at;
    }).map(toDraft);
}

export async function getDraft(id: string): Promise<(OutreachDraft & { campaignId: string | null; sentAt: string | null }) | null> {
  const { data, error } = await getServiceClient().from("email_outreach_drafts").select(columns).eq("id", id).maybeSingle();
  if (error) throw new Error("The draft could not be loaded.");
  if (!data) return null;
  const row = data as Row;
  return { ...toDraft(row), campaignId: row.campaign_id, sentAt: await startedAt(row.campaign_id) };
}

export type SaveResult = { ok: true; draft: OutreachDraft } | { ok: false; reason: "not_found" | "already_sent" };

export async function saveDraft(input: DraftInput): Promise<SaveResult> {
  const db = getServiceClient();
  const fields = {
    recipient_email: input.recipientEmail.trim(), recipient_name: input.recipientName.trim(), lead_id: input.leadId,
    subject: input.subject, preview_text: input.previewText, editor_operations: input.operations,
  };
  if (!input.id) {
    const { data, error } = await db.from("email_outreach_drafts").insert(fields).select(columns).single();
    if (error || !data) throw new Error("The draft could not be saved.");
    return { ok: true, draft: toDraft(data as Row) };
  }
  const existing = await getDraft(input.id);
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.sentAt) return { ok: false, reason: "already_sent" };
  // The review snapshot no longer matches once the content changes; it is replaced the next time the draft is reviewed.
  const { data, error } = await db.from("email_outreach_drafts").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", input.id).select(columns).maybeSingle();
  if (error) throw new Error("The draft could not be saved.");
  return data ? { ok: true, draft: toDraft(data as Row) } : { ok: false, reason: "not_found" };
}

export async function deleteDraft(id: string): Promise<boolean> {
  const { data, error } = await getServiceClient().from("email_outreach_drafts").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new Error("The draft could not be deleted.");
  return Boolean(data);
}

export async function attachCampaign(draftId: string, campaignId: string) {
  const { error } = await getServiceClient().from("email_outreach_drafts").update({ campaign_id: campaignId }).eq("id", draftId);
  if (error) throw new Error("The review could not be linked to the draft.");
}

/**
 * The contact for an address: the existing one (matched ignoring case and surrounding spaces, as the database enforces), or a new one.
 * A new contact is created WITHOUT any newsletter subscription (ongoing_content_opt_in false, no consent record), exactly like an
 * inquiry's contact, and an existing contact is never renamed or changed here. Its eligibility is then judged by the normal rules.
 */
export async function findOrCreateContact(rawEmail: string, rawName: string): Promise<{ id: string; created: boolean }> {
  const db = getServiceClient();
  const email = normalizeEmail(rawEmail);
  const find = async () => {
    const { data, error } = await db.from("leads").select("id").ilike("email", email.replace(/[\\%_]/g, "\\$&")).limit(1).maybeSingle();
    if (error) throw new Error("The contact could not be looked up.");
    return data as { id: string } | null;
  };
  const existing = await find();
  if (existing) return { id: existing.id, created: false };
  const { first, last } = splitName(rawName);
  const { data, error } = await db.from("leads").insert({
    first_name: first, last_name: last, email, ongoing_content_opt_in: false, last_activity_at: new Date().toISOString(),
  }).select("id").single();
  if (error) {
    // Two requests creating the same address at once: the database's unique rule picks one; use it.
    if ((error as { code?: string }).code === "23505") { const raced = await find(); if (raced) return { id: raced.id, created: false }; }
    throw new Error("The contact could not be created.");
  }
  return { id: (data as { id: string }).id, created: true };
}

/** The contact behind a lead id, only if its address is still the one on the draft. */
export async function contactEmail(id: string): Promise<string | null> {
  const { data, error } = await getServiceClient().from("leads").select("email").eq("id", id).maybeSingle();
  if (error) throw new Error("The contact could not be looked up.");
  return (data as { email: string } | null)?.email ?? null;
}

/** Individual emails already sent (or possibly sent) to this address in the last RECENT_SEND_DAYS days. */
export async function recentOutreach(email: string): Promise<RecentSend[]> {
  const since = new Date(Date.now() - RECENT_SEND_DAYS * 86_400_000).toISOString();
  const { data, error } = await getServiceClient().from("email_campaign_deliveries")
    .select("updated_at,email_campaigns!inner(subject,kind)").eq("email", normalizeEmail(email)).in("status", ["sent", "unknown", "attempting"])
    .eq("email_campaigns.kind", "outreach").gte("updated_at", since).order("updated_at", { ascending: false }).limit(5);
  if (error) throw new Error("Earlier emails to this address could not be checked.");
  return (data as unknown as { updated_at: string; email_campaigns: { subject: string } | { subject: string }[] }[]).map((row) => {
    const campaign = Array.isArray(row.email_campaigns) ? row.email_campaigns[0] : row.email_campaigns;
    return { sentAt: row.updated_at, subject: campaign?.subject ?? "" };
  });
}

/** What happened to the one email of an individual send, read from its delivery record. */
export async function deliveryResult(campaignId: string): Promise<DeliveryResult> {
  const { data, error } = await getServiceClient().from("email_campaign_deliveries")
    .select("status,reason,provider_id").eq("campaign_id", campaignId).limit(1).maybeSingle();
  if (error) throw new Error("The result could not be loaded.");
  const row = data as { status: DeliveryResult["status"]; reason: string | null; provider_id: string | null } | null;
  return row ? { status: row.status, reason: row.reason, providerAccepted: Boolean(row.provider_id) } : { status: "none", reason: null, providerAccepted: false };
}
