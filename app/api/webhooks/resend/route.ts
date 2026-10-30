import { NextResponse } from "next/server";
import { getServiceClient } from "@/app/lib/supabase/service";
import { applyOptOut } from "@/app/lib/leads/consent";
import { advanceDeliveryStatus } from "@/app/lib/resources/delivery-email";
import { mapProviderEvent } from "@/app/lib/resources/delivery-status";
import { applyInvitationDelivery, leadIdForInvitationMessage } from "@/app/lib/programs/invitation";
import { verifyResendWebhook } from "@/app/lib/resources/webhook-signature";
import type { Resource } from "@/app/lib/resources/types";

/**
 * Resend delivery webhooks. Needs RESEND_WEBHOOK_SECRET (the `whsec_…` signing
 * secret of a webhook pointed at /api/webhooks/resend). Without it the endpoint
 * refuses to process anything and delivery stays at "queued" — it is never
 * upgraded to "delivered" on faith.
 *
 * Webhooks are account-wide (Napkin / assessment emails included), so events
 * that don't match a resource request are acknowledged and ignored.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const rawBody = await req.text();
  const valid = verifyResendWebhook({
    secret,
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signatureHeader: req.headers.get("svix-signature"),
    rawBody,
  });
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: { type?: string; data?: { email_id?: string; tags?: Record<string, string> | { name: string; value: string }[]; bounce?: { message?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const mapping = mapProviderEvent(event.type ?? "");
  if (!mapping.status && !mapping.complaint) return NextResponse.json({ ignored: true });

  const emailId = event.data?.email_id;
  const tags = event.data?.tags;
  const tagRequestId = Array.isArray(tags) ? tags.find((t) => t.name === "request_id")?.value : tags?.request_id;

  const attemptId = Array.isArray(tags) ? tags.find((t) => t.name === "transition_attempt_id")?.value : tags?.transition_attempt_id;
  const supabase = getServiceClient();
  let query = supabase.from("resource_requests").select("id, lead_id, resource:resources(*)");
  if (emailId) query = query.eq("delivery_provider_id", emailId);
  else if (tagRequestId) query = query.eq("id", tagRequestId);
  else return NextResponse.json({ ignored: true });
  const lookup = await query.maybeSingle();
  if (lookup.error) throw new Error(lookup.error.message);
  let request = lookup.data;

  if (!request && tagRequestId) {
    ({ data: request } = await supabase.from("resource_requests").select("id, lead_id, resource:resources(*)").eq("id", tagRequestId).maybeSingle());
  }
  if (!request) {
    // Not a resource email: it may be a Transition booking invitation. Unmatched events are still just acknowledged.
    if (emailId) {
      const outcome = mapping.status === "delivered" || mapping.status === "bounced" || mapping.status === "failed" ? mapping.status : null;
      if (outcome && (await applyInvitationDelivery(emailId, outcome, event.data?.bounce?.message, undefined, attemptId)).matched) return NextResponse.json({ ok: true });
      const leadId = mapping.complaint ? await leadIdForInvitationMessage(emailId, attemptId) : null;
      if (leadId) {
        await applyOptOut(leadId, { method: "spam_complaint", wordingVersion: "provider-complaint" }, { suppress: "spam_complaint" });
        return NextResponse.json({ ok: true, suppressed: true });
      }
    }
    return NextResponse.json({ ignored: true });
  }

  const resource = (Array.isArray(request.resource) ? request.resource[0] : request.resource) as Resource | null;
  if (!resource) return NextResponse.json({ ignored: true });

  if (mapping.complaint) {
    await applyOptOut(request.lead_id, { method: "spam_complaint", wordingVersion: "provider-complaint" }, { suppress: "spam_complaint" });
    return NextResponse.json({ ok: true, suppressed: true });
  }

  await advanceDeliveryStatus({
    requestId: request.id,
    next: mapping.status!,
    resource,
    leadId: request.lead_id,
    providerId: emailId,
    error: mapping.status === "bounced" || mapping.status === "failed" ? event.data?.bounce?.message ?? event.type ?? null : null,
  });
  return NextResponse.json({ ok: true });
}
