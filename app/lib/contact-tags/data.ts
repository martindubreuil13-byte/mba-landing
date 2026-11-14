import "server-only";
import { activeException, type PreferenceRecord } from "./preferences";
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

export async function recipientCandidates(ids?: string[]) {
  const db = getServiceClient();
  const contacts = [];
  for (let offset = 0; ; offset += 250) {
    const query = db.from("leads").select(
      "id,first_name,last_name,email,contact_email_changed_at,ongoing_content_opt_in,ongoing_content_opt_in_at,ongoing_content_opt_out_at,suppressed_at,contact_tag_assignments(tag_id),consent_records(action,created_at,wording_version,wording_text), opt_out_evidence:consent_records(action), contact_email_preference_audit(action,details,email,created_at)",
    ).is("contact_archived_at", null).order("id").order("created_at", { referencedTable: "consent_records", ascending: false })
      .in("contact_email_preference_audit.action", ["exception", "remove"]).order("created_at", { referencedTable: "contact_email_preference_audit", ascending: false })
      .limit(1, { referencedTable: "contact_email_preference_audit" })
      .eq("opt_out_evidence.action", "opt_out").limit(1, { referencedTable: "opt_out_evidence" })
      .in("consent_records.action", ["opt_in", "opt_out"]).limit(2, { referencedTable: "consent_records" })
      .range(offset, offset + 249);
    const { data, error } = await (ids ? query.in("id", ids) : query);
    if (error) throw new Error("Recipient eligibility could not be loaded.");
    if (!data.length) return contacts;
    const blocks = await db.rpc("newsletter_delivery_blocks", { contact_ids: data.map(({ id }) => id) });
    if (blocks.error || !Array.isArray(blocks.data)) throw new Error("Delivery blocks could not be loaded.");
    const blocked = new Set(blocks.data.map(({ lead_id }) => lead_id));
    contacts.push(...data.map((row) => ({
      id: row.id as string, name: [row.first_name, row.last_name].filter(Boolean).join(" "), email: row.email as string,
      administrativeException: activeException(row.contact_email_preference_audit as PreferenceRecord[], row.email, row.contact_email_changed_at),
      tags: row.contact_tag_assignments.map((link) => link.tag_id as string),
      ...(blocked.has(row.id) ? { state: "Not eligible", reason: "Known bounce, complaint, or provider suppression" } as const
        : marketingEligibility(row, [...row.consent_records, ...row.opt_out_evidence.map(({ action }) => ({ action, created_at: "", wording_version: null, wording_text: null }))])),
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

export async function emailPreferenceHistory(id: string) {
  const db = getServiceClient();
  const [audit, evidence] = await Promise.all([
    db.from("contact_email_preference_audit").select("id,action,email,details,created_at,admin_id").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
    db.from("consent_records").select("id,action,source_type,method,created_at").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  if (audit.error || evidence.error) throw new Error("Preference history is unavailable.");
  return { audit: audit.data, evidence: evidence.data };
}
