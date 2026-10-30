import "server-only";
import { createHash } from "node:crypto";
import { introBookingUrl } from "@/app/lib/booking";
import { getServiceClient } from "@/app/lib/supabase/service";
import { invitationMessage, sendInvitation, ProgramEmailRejectedError } from "./email";
import { ensureBookingRef, updateMailState } from "./queries";

export type InvitationSend = {
  id: string; application_id: string; kind: "initial" | "resend"; status: "pending" | "accepted" | "failed";
  provider_message_id: string | null; error: string | null; delivery_status: "delivered" | "bounced" | "failed" | null;
  delivery_updated_at: string | null; attempted_at: string;
};
export type InvitationState = "pending" | "sent" | "failed" | "resent";
export const INVITATION_LABELS: Record<InvitationState, string> = { pending: "Pending", sent: "Sent", failed: "Failed", resent: "Resent" };

/** A send counts only if the provider accepted it AND it has not since been reported as bounced or failed. */
const delivered = (s: InvitationSend) => s.status === "accepted" && s.delivery_status !== "bounced" && s.delivery_status !== "failed";

/**
 * Pure summary of the attempt log, so the admin can never show a failed send as successful:
 *  pending  nothing has been attempted        failed  no attempt has been accepted and kept (all refused, or bounced)
 *  sent     the first invitation went out     resent  at least one LATER invitation also went out
 */
export function summarizeInvitation(sends: InvitationSend[]): { state: InvitationState; firstSentAt: string | null; lastSentAt: string | null; attempts: number; lastError: string | null } {
  const ordered = [...sends].sort((a, b) => a.attempted_at.localeCompare(b.attempted_at));
  const ok = ordered.filter(delivered);
  const last = ordered[ordered.length - 1];
  const state: InvitationState = !ordered.length || (!ok.length && ordered.some((s) => s.status === "pending")) ? "pending" : !ok.length ? "failed" : ok.some((s) => s.kind === "resend") ? "resent" : "sent";
  return {
    state, attempts: ordered.length,
    firstSentAt: ok[0]?.attempted_at ?? null, lastSentAt: ok[ok.length - 1]?.attempted_at ?? null,
    lastError: last && !delivered(last) ? last.error ?? (last.delivery_status ? `Provider reported: ${last.delivery_status}` : null) : null,
  };
}

export async function listInvitationSends(applicationIds?: string[]): Promise<InvitationSend[]> {
  let q = getServiceClient().from("program_invitation_sends").select("*").order("attempted_at", { ascending: true });
  if (applicationIds) q = q.in("application_id", applicationIds);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as InvitationSend[];
}

export type DeliverResult = { ok: true; kind: "initial" | "resend"; messageId: string } | { ok: false; kind: "initial" | "resend"; error: string };

/**
 * Reserves a durable attempt BEFORE sending, then records the provider outcome. Never throws: a failed email must not fail the
 * applicant's request or hide the booking button.
 *
 * `kind` is `initial` until one invitation has been accepted, then `resend`. The provider idempotency key includes the number
 * of earlier attempts, so a repeated request for the same attempt (retry, double click) is deduplicated by the provider,
 * while a genuine later resend gets a fresh key.
 */
export async function deliverInvitation(application: { id: string; answers: { firstName: string; email: string }; booking_ref?: string | null }): Promise<DeliverResult> {
  const db = getServiceClient();
  let kind: "initial" | "resend" = "initial";
  let attemptId: string | null = null;
  let messageId: string | null = null;
  try {
    // Fail closed if the ledger cannot be read. Never send an unrecordable invitation.
    const earlier = await listInvitationSends([application.id]);
    kind = earlier.some((s) => s.status === "accepted") ? "resend" : "initial";
    if (earlier.some((s) => s.status === "pending")) {
      return { ok: false, kind, error: "A send is in progress or its outcome is unconfirmed. Check the provider before retrying." };
    }
    const ref = await ensureBookingRef(application);
    // The same observed attempt number has the same primary key. A database unique index also
    // permits only one pending send per application, including races with different counts.
    const h = createHash("sha256").update(`transition-invite/${application.id}/${earlier.length}`).digest("hex");
    const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
    const { error: claimError } = await db.from("program_invitation_sends").insert({ id, application_id: application.id, kind, status: "pending" });
    if (claimError) throw new Error("Could not reserve the invitation attempt. Refresh Admin before retrying.");
    attemptId = id;
    const msg = invitationMessage(application.answers.firstName, introBookingUrl(ref));
    messageId = await sendInvitation(application.answers.email, msg, `transition-invite/${application.id}/${earlier.length}`, id);
    const { error } = await db.from("program_invitation_sends").update({ status: "accepted", provider_message_id: messageId, error: null }).eq("id", id);
    if (error) throw new Error("The provider accepted the invitation but its outcome could not be saved. Check the provider before retrying.");
    await updateMailState(application.id, { applicant_email_status: "queued", applicant_email_error: null }).catch(() => undefined);
    return { ok: true, kind, messageId };
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 500) : "Unknown email error";
    // Only an explicit provider refusal is known to be unsent. A timeout/crash or failed write
    // stays pending and blocks another send until an operator reconciles it with the provider.
    if (attemptId) {
      const { error: recordError } = await db.from("program_invitation_sends").update({
        status: e instanceof ProgramEmailRejectedError && !messageId ? "failed" : "pending",
        provider_message_id: messageId, error,
      }).eq("id", attemptId);
      if (recordError) console.error("Could not record invitation outcome:", recordError.message);
    }
    await updateMailState(application.id, { applicant_email_status: "failed", applicant_email_error: error }).catch(() => undefined);
    return { ok: false, kind, error };
  }
}

/** Resend webhook hook: attach the provider's final outcome to the attempt that has this message id. Returns true if one matched. */
export async function applyInvitationDelivery(messageId: string, outcome: "delivered" | "bounced" | "failed", detail?: string | null, at = new Date().toISOString(), attemptId?: string | null): Promise<{ matched: boolean; applicationId?: string }> {
  const db = getServiceClient();
  const lookup = await db.from("program_invitation_sends").select("id, application_id, delivery_status").eq("provider_message_id", messageId).maybeSingle();
  if (lookup.error) throw new Error(lookup.error.message);
  let send = lookup.data;
  if (!send && attemptId) {
    const result = await db.from("program_invitation_sends").select("id, application_id, delivery_status").eq("id", attemptId).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    send = result.data;
    if (send) {
      const { error } = await db.from("program_invitation_sends").update({ provider_message_id: messageId, status: "accepted" }).eq("id", send.id);
      if (error) throw new Error(error.message);
    }
  }
  if (!send) return { matched: false };
  // A delivered report never overwrites a bounce/failure, and a repeated event changes nothing.
  if (send.delivery_status !== outcome && !(outcome === "delivered" && (send.delivery_status === "bounced" || send.delivery_status === "failed"))) {
    const { error } = await db.from("program_invitation_sends").update({ delivery_status: outcome, delivery_updated_at: at, ...(outcome !== "delivered" && detail ? { error: detail.slice(0, 500) } : {}) }).eq("id", send.id);
    if (error) throw new Error(error.message);
  }
  return { matched: true, applicationId: send.application_id };
}

/** The lead behind an invitation message id, for a spam complaint (the same suppression the resource emails apply). */
export async function leadIdForInvitationMessage(messageId: string, attemptId?: string | null): Promise<string | null> {
  const db = getServiceClient();
  const lookup = await db.from("program_invitation_sends").select("application_id").eq("provider_message_id", messageId).maybeSingle();
  if (lookup.error) throw new Error(lookup.error.message);
  let send = lookup.data;
  if (!send && attemptId) {
    const result = await db.from("program_invitation_sends").select("application_id").eq("id", attemptId).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    send = result.data;
  }
  if (!send) return null;
  const { data: app } = await db.from("program_applications").select("lead_id").eq("id", send.application_id).maybeSingle();
  return app?.lead_id ?? null;
}
