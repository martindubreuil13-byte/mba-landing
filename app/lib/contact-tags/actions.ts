"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { isUuid } from "@/app/lib/relationships/model";
import { isLifecycle } from "./lifecycle";

export async function updateContactTag(form: FormData) {
  await requireAdmin();
  const leadId = String(form.get("lead") ?? "");
  const action = form.get("operation");
  let tagId = String(form.get("tag") ?? "");
  if (!isUuid(leadId) || !["create", "assign", "remove"].includes(String(action))) return "Invalid tag action.";
  const db = getServiceClient();
  if (action === "create") {
    const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ");
    if (!name || name.length > 48) return "Enter a tag name up to 48 characters.";
    const inserted = await db.from("contact_tags").insert({ name }).select("id").single();
    if (inserted.error?.code === "23505") {
      const existing = await db.from("contact_tags").select("id").eq("normalized_name", name.toLowerCase()).maybeSingle();
      if (existing.error || !existing.data) return "That tag already exists. Choose it from the list.";
      tagId = existing.data.id;
    } else if (inserted.error || !inserted.data) {
      return "The tag could not be created.";
    } else tagId = inserted.data.id;
  }
  if (!isUuid(tagId)) return "Choose an existing tag.";
  const links = db.from("contact_tag_assignments");
  const { error } = action === "remove"
    ? await links.delete().eq("lead_id", leadId).eq("tag_id", tagId)
    : await links.upsert({ lead_id: leadId, tag_id: tagId }, { onConflict: "lead_id,tag_id", ignoreDuplicates: true });
  if (error) return "The contact tags could not be updated.";
  revalidatePath("/admin/leads/" + leadId);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/email");
  return null;
}

export async function updateContactLifecycle(form: FormData) {
  await requireAdmin();
  const id = String(form.get("lead") ?? "");
  const status = form.get("status");
  if (!isUuid(id) || !isLifecycle(status)) return "Choose a valid lifecycle status.";
  const { data, error } = await getServiceClient().from("leads").update({ contact_lifecycle: status }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return "Lifecycle status could not be saved.";
  revalidatePath("/admin/leads/" + id);
  revalidatePath("/admin/leads");
  return null;
}
