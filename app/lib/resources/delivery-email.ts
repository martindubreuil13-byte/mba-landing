import "server-only";
import { createResend } from "@/app/lib/email-client";
import { getServiceClient } from "@/app/lib/supabase/service";
import { createConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { appBaseUrl } from "./base-url";
import type { ResourceConfig } from "./config";
import { canAdvanceDelivery, DELIVERY_EVENT_FOR_STATUS } from "./delivery-status";
import { recordResourceEvent } from "./event-store";
import type { DeliveryStatus, Resource } from "./types";

/**
 * Sender identity. Production must use a verified modernbusinessarchitect.com
 * address (see the rollout checklist); until that domain is verified in Resend
 * the existing verified sender is the default.
 */
export const DEFAULT_RESOURCE_FROM = "Martin Dubreuil <martin@mindrasolutions.com>";
const REPLY_TO = "martin@mindrasolutions.com";

export type DeliveryEmailParams = {
  config: ResourceConfig;
  resource: Pick<Resource, "title" | "slug">;
  requestId: string;
  leadId: string;
  /**
   * pending: community signup awaits confirmation (email carries a confirm link)
   * active:  already subscribed
   * none:    no marketing consent (e.g. a suppressed address): a one-off delivery
   */
  consent?: "pending" | "active" | "none";
};

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildDeliveryLinks(requestId: string, leadId: string) {
  const base = appBaseUrl();
  const token = encodeURIComponent(createUnsubscribeToken(leadId));
  return {
    // Stable, unguessable, per-request: the file is signed fresh on every click.
    downloadUrl: `${base}/api/resources/download?token=${requestId}&via=email`,
    unsubscribePage: `${base}/unsubscribe?token=${token}`,
    confirmPage: `${base}/confirm?token=${encodeURIComponent(createConfirmationToken(leadId))}`,
    unsubscribePost: `${base}/api/unsubscribe?token=${token}`,
    privacyUrl: `${base}/privacy`,
    pageUrl: `${base}/resources/`,
  };
}

function mailingAddress(): string | null {
  return process.env.MAILING_ADDRESS?.trim() || null;
}

export function buildDeliveryEmail(params: DeliveryEmailParams) {
  const { config, resource, requestId, leadId } = params;
  const links = buildDeliveryLinks(requestId, leadId);
  const resourcePage = `${appBaseUrl()}/resources/${resource.slug}`;
  const subject = config.email.subject(resource.title);
  const address = mailingAddress();
  const consent = params.consent ?? "active";
  const reason =
    consent === "active"
      ? `You are receiving this because you asked for ${resource.title} and are subscribed to emails from The Modern Business Architect.`
      : consent === "pending"
        ? `You are receiving this one-off email because you asked for ${resource.title}. You will only receive further emails from The Modern Business Architect if you confirm your email address above.`
        : `You are receiving this one-off email because you asked for ${resource.title}. No further marketing emails will be sent to this address.`;

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your printable copy of ${esc(resource.title)}, ready to download.</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1816;">
  <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b1f1f;font-weight:600;margin:0 0 16px;">The Modern Business Architect</p>
  <h1 style="font-size:26px;font-weight:300;line-height:1.25;margin:0 0 20px;">${esc(resource.title)}</h1>
  ${config.email.opening.map((p) => `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 14px;">${esc(p)}</p>`).join("\n  ")}
  <p style="margin:26px 0;"><a href="${links.downloadUrl}" style="display:inline-block;background:#6b1f1f;color:#ffffff;text-decoration:none;padding:14px 26px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Download the PDF →</a></p>
  <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 6px;">If the button does not work, copy this link into your browser:<br><a href="${links.downloadUrl}" style="color:#6b1f1f;word-break:break-all;">${links.downloadUrl}</a></p>
  <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 24px;">You can also read the whole guide online at <a href="${resourcePage}" style="color:#6b1f1f;">${resourcePage}</a>.</p>
  ${
    consent === "active"
      ? `<p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 20px;">${esc(config.email.communityNote)}</p>`
      : consent === "pending"
        ? `<div style="border:1px solid #e5e0dc;background:#faf8f6;padding:18px 20px;margin:0 0 22px;"><p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 14px;">${esc(config.email.confirmNote)}</p><p style="margin:0;"><a href="${links.confirmPage}" style="display:inline-block;border:1px solid #6b1f1f;color:#6b1f1f;text-decoration:none;padding:11px 20px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Yes, confirm my email →</a></p></div>`
        : ""
  }
  <p style="font-size:15px;color:#333;margin:0 0 4px;">— Martin</p>
  <hr style="border:none;border-top:1px solid #e5e0dc;margin:32px 0 16px;" />
  <p style="font-size:11px;color:#999;line-height:1.7;margin:0;">
    Sent by Martin Dubreuil · The Modern Business Architect · <a href="${appBaseUrl()}" style="color:#999;">${esc(appBaseUrl().replace(/^https?:\/\//, ""))}</a><br/>
    ${address ? `${esc(address)}<br/>` : ""}Questions: reply to this email or write to ${REPLY_TO}.<br/>
    ${esc(reason)}<br/>
    <a href="${links.unsubscribePage}" style="color:#999;">Unsubscribe</a> (you keep the guide) · <a href="${links.privacyUrl}" style="color:#999;">Privacy Policy</a>
  </p>
</div></body></html>`;

  const text = [
    resource.title.toUpperCase(),
    "",
    ...config.email.opening.flatMap((p) => [p, ""]),
    `Download the PDF: ${links.downloadUrl}`,
    `Read it online: ${resourcePage}`,
    "",
    ...(consent === "active" ? [config.email.communityNote, ""] : []),
    ...(consent === "pending" ? [config.email.confirmNote, `Confirm my email: ${links.confirmPage}`, ""] : []),
    "— Martin",
    "",
    "--",
    `Sent by Martin Dubreuil, The Modern Business Architect (${appBaseUrl()})`,
    ...(address ? [address] : []),
    `Questions: reply to this email or write to ${REPLY_TO}.`,
    reason,
    `Unsubscribe (you keep the guide): ${links.unsubscribePage}`,
    `Privacy Policy: ${links.privacyUrl}`,
  ].join("\n");

  return { subject, html, text, links };
}

/** Moves a request's delivery status forward (never backwards) and records the matching event. */
export async function advanceDeliveryStatus(args: {
  requestId: string;
  next: DeliveryStatus;
  resource: Pick<Resource, "id" | "slug" | "resource_type">;
  leadId: string;
  providerId?: string | null;
  error?: string | null;
}): Promise<boolean> {
  const supabase = getServiceClient();
  const { data: current } = await supabase.from("resource_requests").select("delivery_status").eq("id", args.requestId).maybeSingle();
  if (!current) return false;
  if (!canAdvanceDelivery(current.delivery_status as DeliveryStatus, args.next)) return false;

  const { error } = await supabase
    .from("resource_requests")
    .update({
      delivery_status: args.next,
      delivery_updated_at: new Date().toISOString(),
      ...(args.providerId ? { delivery_provider_id: args.providerId } : {}),
      delivery_error: args.error ?? null,
    })
    .eq("id", args.requestId);
  if (error) {
    console.error("Failed to update delivery status:", error.message);
    return false;
  }

  const eventName = DELIVERY_EVENT_FOR_STATUS[args.next];
  if (eventName) {
    await recordResourceEvent({
      name: eventName as never,
      resource: args.resource,
      leadId: args.leadId,
      requestId: args.requestId,
      metadata: args.error ? { error: args.error } : {},
    });
  }
  return true;
}

/**
 * Sends the delivery email. "queued" means Resend accepted the message and
 * returned an id; it is NOT delivery. Delivered/bounced arrive by webhook.
 * Never throws: a failed email must not fail the visitor's download.
 */
/**
 * A request whose email FAILED (provider error, or refused by the environment's email policy) may be retried
 * when the visitor asks again. Failed is otherwise a terminal state, so reset it explicitly for the retry.
 */
export async function prepareDeliveryRetry(requestId: string): Promise<void> {
  await getServiceClient()
    .from("resource_requests")
    .update({ delivery_status: "accepted", delivery_error: null, delivery_updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .in("delivery_status", ["failed", "not_tracked"]);
}

export async function sendDeliveryEmail(params: DeliveryEmailParams & { to: string; resource: Resource; retry?: boolean }): Promise<{ status: "queued" | "failed"; error: string | null }> {
  const { resource, requestId, leadId } = params;

  if (!process.env.RESEND_API_KEY) {
    const error = "RESEND_API_KEY is not configured.";
    await advanceDeliveryStatus({ requestId, next: "failed", resource, leadId, error });
    return { status: "failed", error };
  }

  try {
    const { subject, html, text, links } = buildDeliveryEmail(params);
    const resend = createResend();
    const result = await resend.emails.send(
      {
        from: process.env.RESOURCE_EMAIL_FROM || DEFAULT_RESOURCE_FROM,
        to: params.to,
        replyTo: REPLY_TO,
        subject,
        html,
        text,
        // Lets the webhook find the request even if it fires before we stored the provider id.
        tags: [{ name: "request_id", value: requestId }],
        headers: {
          "List-Unsubscribe": `<${links.unsubscribePost}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      },
      // A retry after a failure must not be swallowed by the provider's idempotency cache for the first attempt.
      { idempotencyKey: params.retry ? `resource-delivery/${requestId}/retry-${Date.now()}` : `resource-delivery/${requestId}` }
    );
    if (result.error || !result.data) {
      const error = result.error?.message ?? "Resend returned no message id.";
      await advanceDeliveryStatus({ requestId, next: "failed", resource, leadId, error });
      return { status: "failed", error };
    }
    await advanceDeliveryStatus({ requestId, next: "queued", resource, leadId, providerId: result.data.id });
    return { status: "queued", error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await advanceDeliveryStatus({ requestId, next: "failed", resource, leadId, error: message });
    return { status: "failed", error: message };
  }
}
