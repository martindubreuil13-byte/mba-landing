import "server-only";
import { randomUUID } from "node:crypto";
import { approvedDestination } from "./intelligence";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { getServiceClient } from "@/app/lib/supabase/service";

export async function trackCampaignLinks(campaignId: string, html: string) {
  const recipientKey = randomUUID();
  const origin = appBaseUrl();
  const links = new Map<string, { id: string; destination: string; campaign_id: string; recipient_key: string }>();
  // The email renderer generates double-quoted, escaped href attributes.
  const rewritten = html.replace(/(<a\b[^>]*?\bhref=")([^"]+)(")/gi, (match, start, href: string, end) => {
    const destination = approvedDestination(href.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, (entity) =>
      ({ "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" }[entity]!)));
    if (!destination) return match;
    const url = destination.href;
    const link = links.get(url) ?? { id: randomUUID(), destination: url, campaign_id: campaignId, recipient_key: recipientKey };
    links.set(url, link);
    return start + origin + "/campaign/click/" + link.id + end;
  });
  if (links.size) {
    const { error } = await getServiceClient().from("campaign_links").insert([...links.values()]);
    if (error) throw new Error("Could not store campaign links.");
  }
  return rewritten;
}
