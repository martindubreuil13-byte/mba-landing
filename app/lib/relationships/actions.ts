"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { isDateOnly, isReviewState, isUuid } from "./model";

export async function reviewInquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const state = form.get("state");
  if (!isUuid(id) || !isReviewState(state)) return "Invalid inquiry review.";
  const { error } = await getServiceClient().from("program_inquiries")
    .update({ review_state: state }).eq("id", id).select("id").single();
  if (error) return "Inquiry review could not be saved.";
  revalidatePath("/admin/inquiries");
  return null;
}

export async function createTask(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const lead = String(form.get("lead") ?? "");
  const inquiry = String(form.get("inquiry") ?? "");
  const description = String(form.get("description") ?? "").trim();
  const due = String(form.get("due") ?? "");
  if (!isUuid(id) || !isUuid(lead) || !description || description.length > 1000 ||
      (due && !isDateOnly(due)) || (inquiry && !isUuid(inquiry))) {
    return "Enter a valid follow-up description and due date.";
  }
  const db = getServiceClient();
  if (inquiry) {
    const { data, error } = await db.from("program_inquiries").select("id").eq("id", inquiry).eq("lead_id", lead).maybeSingle();
    if (error) return "The linked inquiry could not be checked. Try again.";
    if (!data) return "Select an inquiry belonging to this contact.";
  }
  const { error } = await db.from("contact_tasks").upsert({
    id, lead_id: lead, inquiry_id: inquiry || null, description, due_date: due || null, created_by: admin.id,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) return "Follow-up could not be saved.";
  revalidatePath("/admin/leads/" + lead);
  revalidatePath("/admin/inquiries/tasks");
  return null;
}

export async function setTaskCompletion(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const lead = String(form.get("lead") ?? "");
  const operation = form.get("operation");
  if (!isUuid(id) || !isUuid(lead) || (operation !== "complete" && operation !== "reopen")) {
    return "Invalid follow-up action.";
  }
  const query = getServiceClient().from("contact_tasks")
    .update({ completed_at: operation === "complete" ? new Date().toISOString() : null })
    .eq("id", id).eq("lead_id", lead);
  const { data, error } = await (operation === "complete" ? query.is("completed_at", null) : query.not("completed_at", "is", null))
    .select("id").maybeSingle();
  if (error) return "Follow-up could not be updated.";
  if (!data) {
    const current = await getServiceClient().from("contact_tasks").select("completed_at").eq("id", id).eq("lead_id", lead).maybeSingle();
    if (current.error || !current.data || Boolean(current.data.completed_at) !== (operation === "complete")) {
      return "The follow-up is unavailable or has changed. Refresh and try again.";
    }
  }
  revalidatePath("/admin/leads/" + lead);
  revalidatePath("/admin/inquiries/tasks");
  return null;
}
