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

/** Postal address lines from MAILING_ADDRESS: real line breaks or a literal "\\n" between lines. Never hardcoded. */
function mailingAddressLines(): string[] {
  return (process.env.MAILING_ADDRESS ?? "")
    .split(/\r?\n|\\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const BURGUNDY = "#6b1f1f";
const SERIF = "Georgia,'Times New Roman',Times,serif";
const SANS = "Arial,Helvetica,sans-serif";

export function buildDeliveryEmail(params: DeliveryEmailParams) {
  const { config, resource, requestId, leadId } = params;
  const e = config.email;
  const links = buildDeliveryLinks(requestId, leadId);
  const subject = e.subject(resource.title);
  const addressLines = mailingAddressLines();
  const consent = params.consent ?? "active";
  const unsubscribeLabel = consent === "pending" ? "Unsubscribe or cancel request" : "Unsubscribe";
  const reason =
    consent === "active"
      ? `You are receiving this because you asked for ${resource.title} and are subscribed to emails from The Modern Business Architect.`
      : consent === "pending"
        ? `You are receiving this one-off email because you asked for ${resource.title}. You will only receive further emails from The Modern Business Architect if you confirm your email address.`
        : `You are receiving this one-off email because you asked for ${resource.title}. No further marketing emails will be sent to this address.`;

  const p = (t: string, extra = "") => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.65;color:#2b2623;${extra}">${t}</p>`;
  const bodyHtml = e.body
    .map((b) => (b.lead ? p(`<strong style="color:#1a1816;">${esc(b.lead)}</strong>`, "font-family:" + SERIF + ";font-size:19px;line-height:1.5;") : p(esc(b.text))))
    .join("\n");

  const confirmBlock =
    consent === "pending"
      ? `<tr><td style="padding:8px 32px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e8e1da;padding:24px 0 8px;">
<p style="margin:0 0 8px;font-family:${SERIF};font-size:18px;line-height:1.4;color:#1a1816;">${esc(e.confirm.heading)}</p>
${p(esc(e.confirm.text), "font-size:14px;color:#5c5550;")}
<p style="margin:0 0 14px;"><a href="${links.confirmPage}" style="display:inline-block;border:1px solid ${BURGUNDY};color:${BURGUNDY};font-family:${SANS};font-size:13px;font-weight:bold;text-decoration:none;padding:10px 18px;">${esc(e.confirm.button)}</a></p>
${p(esc(e.confirm.reassurance), "font-size:13px;color:#7a726b;margin:0;")}
</td></tr></table></td></tr>`
      : consent === "active"
        ? `<tr><td style="padding:8px 32px 8px;">${p(esc(e.communityNote), "font-size:14px;color:#5c5550;")}</td></tr>`
        : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f2ec;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(e.previewText)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f2ec;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fffdf9;border:1px solid #e8e1da;">
<tr><td style="padding:36px 32px 8px;">
<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BURGUNDY};font-weight:bold;">The Modern Business Architect</p>
<h1 style="margin:0 0 10px;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:normal;color:#1a1816;">${esc(resource.title)}</h1>
<p style="margin:0 0 8px;font-family:${SERIF};font-size:17px;line-height:1.5;font-style:italic;color:#5c5550;">${esc(e.tagline)}</p>
</td></tr>
<tr><td style="padding:16px 32px 0;">
${e.opening.map((t) => p(esc(t))).join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 10px;"><tr><td bgcolor="${BURGUNDY}" style="background:${BURGUNDY};"><a href="${links.downloadUrl}" style="display:inline-block;padding:16px 32px;font-family:${SANS};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">Download the guide</a></td></tr></table>
<p style="margin:0 0 28px;font-family:${SANS};font-size:12px;line-height:1.6;color:#7a726b;">Button not working? Copy this link into your browser:<br><a href="${links.downloadUrl}" style="color:${BURGUNDY};word-break:break-all;">${links.downloadUrl}</a></p>
${bodyHtml}
</td></tr>
<tr><td style="padding:8px 32px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f6f0e8;border-left:3px solid ${BURGUNDY};padding:16px 20px;">
<p style="margin:0 0 6px;font-family:${SERIF};font-size:16px;color:#1a1816;font-weight:bold;">${esc(e.suggestion.heading)}</p>
<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:#2b2623;">${esc(e.suggestion.text)}</p>
</td></tr></table></td></tr>
${confirmBlock}
<tr><td style="padding:16px 32px 28px;">
<p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.5;color:#1a1816;"><strong>${esc(e.signoff.name)}</strong><br>${esc(e.signoff.role)}<br><span style="font-style:italic;color:#5c5550;">${esc(e.signoff.tagline)}</span></p>
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e8e1da;">
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.8;color:#7a726b;">
<a href="${links.downloadUrl}" style="color:${BURGUNDY};">Download the guide again</a> · <a href="${links.privacyUrl}" style="color:${BURGUNDY};">Privacy</a> · <a href="${links.unsubscribePage}" style="color:${BURGUNDY};">${unsubscribeLabel}</a><br>
Sent by Martin Dubreuil · The Modern Business Architect · <a href="${appBaseUrl()}" style="color:#7a726b;">${esc(appBaseUrl().replace(/^https?:\/\//, ""))}</a><br>
${addressLines.length ? `${addressLines.map(esc).join("<br>")}<br>` : ""}Questions: reply to this email or write to ${REPLY_TO}.<br>
${esc(reason)}</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    e.previewText,
    "",
    resource.title.toUpperCase(),
    e.tagline,
    "",
    ...e.opening.flatMap((t) => [t, ""]),
    `Download the guide: ${links.downloadUrl}`,
    "",
    ...e.body.flatMap((b) => [b.lead ?? b.text, ""]),
    e.suggestion.heading.toUpperCase(),
    e.suggestion.text,
    "",
    ...(consent === "active" ? [e.communityNote, ""] : []),
    ...(consent === "pending"
      ? [e.confirm.heading.toUpperCase(), e.confirm.text, `${e.confirm.button}: ${links.confirmPage}`, e.confirm.reassurance, ""]
      : []),
    e.signoff.name,
    e.signoff.role,
    e.signoff.tagline,
    "",
    "--",
    `Download the guide again: ${links.downloadUrl}`,
    `Privacy: ${links.privacyUrl}`,
    `${unsubscribeLabel}: ${links.unsubscribePage}`,
    `Sent by Martin Dubreuil, The Modern Business Architect (${appBaseUrl()})`,
    ...addressLines,
    `Questions: reply to this email or write to ${REPLY_TO}.`,
    reason,
  ].join("\n");

  return { subject, html, text, links, previewText: e.previewText };
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
