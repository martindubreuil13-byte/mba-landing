import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";

export async function campaignHistory() {
  const { data, error } = await getServiceClient().from("email_campaigns")
    .select("id,subject,created_at,started_at,completed_at,selected_count,exclusions,can_duplicate:editor_operations,email_campaign_deliveries(status)")
    .not("started_at", "is", null).order("created_at", { ascending: false }).limit(25);
  if (error) return null;
  return data.map((row) => {
    const count = (status: string) => row.email_campaign_deliveries.filter((delivery) => delivery.status === status).length;
    const sent = count("sent");
    const failed = count("failed");
    const excluded = Object.values(row.exclusions as Record<string, number>).reduce((sum, value) => sum + value, 0) + count("excluded");
    const pending = row.selected_count - sent - failed - excluded;
    const active = !row.completed_at && Date.now() - Date.parse(row.started_at) < 125_000;
    return {
      canDuplicate: Array.isArray(row.can_duplicate), id: row.id, subject: row.subject, created: row.created_at, started: row.started_at,
      total: row.selected_count, sent, failed, excluded, pending,
      status: active ? "Sending" : pending > 0 ? "Needs review" : failed > 0 ? (sent ? "Partially sent" : "Failed") : sent > 0 ? "Sent" : "Excluded",
    };
  });
}

export async function campaignDetails(id: string) {
  const db = getServiceClient();
  const result = await db.from("email_campaigns")
    .select("id,subject,preview_text,body_html,editor_operations,started_at,completed_at,selected_count,selected_contact_ids,exclusions,recipients,email_campaign_deliveries(lead_id,email,status,reason,provider_id,provider_block,updated_at)")
    .eq("id", id).not("started_at", "is", null).maybeSingle();
  if (result.error) throw new Error("Campaign could not be loaded.");
  const row = result.data;
  if (!row) return null;
  const targets = row.recipients as { id: string; email: string }[];
  const deliveries = new Map(row.email_campaign_deliveries.map((delivery) => [delivery.lead_id, delivery]));
  const recipients = targets.map((target) => ({ ...target, delivery: deliveries.get(target.id) }));
  const unrecorded = (row.selected_contact_ids as string[] | null)?.filter((id) => !recipients.some((recipient) => recipient.id === id));
  const excludedNames = new Map<string, string>();
  if (unrecorded?.length) {
    for (let i = 0; i < unrecorded.length; i += 100) {
      const { data } = await db.from("leads").select("id,first_name,last_name")
        .in("id", unrecorded.slice(i, i + 100));
      for (const lead of data ?? []) {
        const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
        if (name) excludedNames.set(lead.id, name);
      }
    }
  }
  return { ...row, recipients, unrecorded, excludedNames };
}
