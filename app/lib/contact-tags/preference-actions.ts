"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { exceptionEvidence } from "@/app/lib/email-studio/campaign";
import { recipientCandidates } from "./data";

export async function saveEmailPreference(form: FormData) {
  const admin = await requireAdmin();
  const identity = z.object({ id: z.uuid(), email: z.email(), operation: z.enum(["subscribe","unsubscribe","exception","remove"]) })
    .safeParse({ id: form.get("lead"), email: form.get("email"), operation: form.get("operation") });
  if (!identity.success) return "Reload the contact and try again.";
  const { id, email, operation } = identity.data;
  let details: Record<string, string>;
  const reason = String(form.get("reason") ?? "").trim();
  if (operation === "subscribe") {
    const result = z.object({ source: z.string().trim().min(3).max(300), receivedAt: z.iso.date(), evidence: z.string().trim().min(10).max(1000) })
      .safeParse({ source: form.get("source"), receivedAt: form.get("receivedAt"), evidence: form.get("evidence") });
    if (!result.success || result.data.receivedAt > new Date().toISOString().slice(0, 10)) return "Enter the source, actual permission wording and a date that has already occurred.";
    details = result.data;
  } else if (operation === "exception") {
    const result = exceptionEvidence.safeParse({ basis: form.get("basis"), reason, evidence: form.get("evidence") });
    const date = z.iso.date().safeParse(form.get("expiresAt"));
    if (!result.success || !date.success || date.data <= new Date().toISOString().slice(0, 10)) return "Document the basis, reason, evidence and a future expiry date.";
    const [candidate] = await recipientCandidates([id]);
    if (candidate?.state !== "Unknown") return "Only contacts with unknown consent can receive an exception.";
    details = { ...result.data, expiresAt: date.data + "T00:00:00.000Z" };
  } else {
    if (!reason || reason.length > 500) return "Enter a reason up to 500 characters.";
    details = { reason };
  }
  const { data, error } = await getServiceClient().rpc("record_contact_email_preference", {
    target: id, actor: admin.id, expected_email: email, operation, details,
  });
  if (error || !data) return "Preference was not saved. Check for an unsubscribe, suppression or a recent email change.";
  revalidatePath("/admin/leads/" + id);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/email");
  return null;
}
