import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";

export async function campaignHistory() {
  const { data, error } = await getServiceClient().from("email_campaigns")
    .select("id,subject,created_at,started_at,completed_at,selected_count,exclusions,email_campaign_deliveries(status)")
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
      id: row.id, subject: row.subject, created: row.created_at, started: row.started_at,
      total: row.selected_count, sent, failed, excluded, pending,
      status: active ? "Sending" : pending > 0 ? "Needs review" : failed > 0 ? (sent ? "Partially sent" : "Failed") : sent > 0 ? "Sent" : "Excluded",
    };
  });
}
