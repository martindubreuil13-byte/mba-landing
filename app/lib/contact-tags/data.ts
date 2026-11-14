import "server-only";
import { marketingEligibility } from "./eligibility";
import { getServiceClient } from "@/app/lib/supabase/service";

export async function contactTags(leadId?: string) {
  const db = getServiceClient();
  const tags = await db.from("contact_tags").select("id,name").order("name");
  if (tags.error) throw new Error("Tags could not be loaded.");
  if (!leadId) return { tags: tags.data, assigned: [] as string[] };
  const links = await db.from("contact_tag_assignments").select("tag_id").eq("lead_id", leadId);
  if (links.error) throw new Error("Contact tags could not be loaded.");
  return { tags: tags.data, assigned: links.data.map((row) => row.tag_id as string) };
}

export async function taggedLeadIds(tag: string) {
  const ids: string[] = [];
  const db = getServiceClient();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("contact_tag_assignments").select("lead_id")
      .eq("tag_id", tag).order("lead_id").range(offset, offset + 499);
    if (error) throw new Error("Contacts could not be filtered by tag.");
    ids.push(...data.map((row) => row.lead_id));
    if (data.length < 500) return ids;
  }
}

export async function recipientCandidates() {
  const db = getServiceClient();
  const contacts = [];
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await db.from("leads").select(
      "id,first_name,email,ongoing_content_opt_in,ongoing_content_opt_in_at,ongoing_content_opt_out_at,suppressed_at,contact_tag_assignments(tag_id),consent_records(action,created_at,wording_version,wording_text)",
    ).order("id").order("created_at", { referencedTable: "consent_records", ascending: false })
      .in("consent_records.action", ["opt_in", "opt_out"]).limit(2, { referencedTable: "consent_records" })
      .range(offset, offset + 249);
    if (error) throw new Error("Recipient eligibility could not be loaded.");
    contacts.push(...data.map((row) => ({
      id: row.id as string, name: row.first_name as string, email: row.email as string,
      tags: row.contact_tag_assignments.map((link) => link.tag_id as string),
      ...marketingEligibility(row, row.consent_records),
    })));
    if (data.length < 250) return contacts;
  }
}

export async function contactTagNames() {
  const db = getServiceClient();
  const names = new Map<string, string[]>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("contact_tag_assignments").select("lead_id,contact_tags(name)")
      .order("lead_id").order("tag_id").range(offset, offset + 499);
    if (error) throw new Error("Contact tags could not be loaded.");
    for (const row of data) {
      const tag = Array.isArray(row.contact_tags) ? row.contact_tags[0] : row.contact_tags;
      if (tag) names.set(row.lead_id, [...(names.get(row.lead_id) ?? []), tag.name]);
    }
    if (data.length < 500) return names;
  }
}
