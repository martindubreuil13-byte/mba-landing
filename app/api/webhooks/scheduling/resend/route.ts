import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, webhookRoute } from "@/app/lib/scheduling/http";
import { mapProviderEvent } from "@/app/lib/resources/delivery-status";
import { verifyResendWebhook } from "@/app/lib/resources/webhook-signature";

export const dynamic = "force-dynamic";

/**
 * Resend delivery events for BOOKING emails. Register a SECOND webhook in Resend pointing here, with its own signing secret in
 * SCHEDULING_RESEND_WEBHOOK_SECRET (the existing /api/webhooks/resend is left exactly as it is). Events for messages this system did not
 * send are acknowledged and ignored. A bounce is never overwritten by a later "delivered".
 */
export const POST = webhookRoute(async (req) => {
  const secret = process.env.SCHEDULING_RESEND_WEBHOOK_SECRET;
  if (!secret) return json({ error: "Webhook not configured" }, 503);
  const raw = await req.text();
  if (!verifyResendWebhook({ secret, id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), signatureHeader: req.headers.get("svix-signature"), rawBody: raw })) return json({ error: "Invalid signature" }, 401);
  let event: { type?: string; data?: { email_id?: string } };
  try { event = JSON.parse(raw); } catch { return json({ error: "Invalid body" }, 400); }
  const mapping = mapProviderEvent(event.type ?? "");
  const outcome = mapping.status === "delivered" || mapping.status === "bounced" || mapping.status === "failed" ? mapping.status : null;
  const svc = getScheduling();
  const emailId = event.data?.email_id;
  // Events we do not track, or for messages this system did not send, change nothing.
  const apply = async (): Promise<boolean> => (outcome && emailId ? svc.repo.setEmailDelivery(emailId, outcome, new Date().toISOString()) : false);
  // Resend (Svix) deliveries carry a unique id. The delivery is claimed, applied, then marked processed; a failed attempt stays claimable for Resend's retry.
  const deliveryId = req.headers.get("svix-id");
  if (!deliveryId) return json((await apply()) ? { ok: true } : { ignored: true });
  const out = await svc.handleWebhook("resend", deliveryId, apply);
  if (out.status === "duplicate") return json({ ok: true, duplicate: true });
  if (out.status === "busy") return json({ ok: false, retry: true }, 503);
  return json(out.result ? { ok: true } : { ignored: true });
});
