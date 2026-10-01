import "server-only";
import { createResend } from "@/app/lib/email-client";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { createConfirmationToken } from "./confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

/**
 * Shared "please confirm your email" message for any flow that records an explicit marketing request
 * (confirmed opt-in). It is deliberately not feature-specific: callers say who is asking and why, the
 * signed confirmation link, unsubscribe link and footer are always the same. Marketing starts only after the
 * recipient opens /confirm and presses the button (see confirmOptIn in consent.ts).
 */
export const DEFAULT_CONSENT_EMAIL_FROM = "Martin Dubreuil <martin@mindrasolutions.com>";
const REPLY_TO = "martin@mindrasolutions.com";

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type ConsentConfirmationParams = {
  leadId: string;
  firstName?: string | null;
  /** What they asked for, in the sender's voice, e.g. "stay on my shortlist for useful ideas, resources and occasional updates". */
  askedFor?: string;
};

export function buildConsentConfirmationEmail({ leadId, firstName, askedFor = "stay on my shortlist for useful ideas, resources and occasional updates" }: ConsentConfirmationParams) {
  const base = appBaseUrl();
  const confirmUrl = `${base}/confirm?token=${encodeURIComponent(createConfirmationToken(leadId))}`;
  const unsubscribeToken = encodeURIComponent(createUnsubscribeToken(leadId));
  const unsubscribePage = `${base}/unsubscribe?token=${unsubscribeToken}`;
  const unsubscribePost = `${base}/api/unsubscribe?token=${unsubscribeToken}`;
  const privacyUrl = `${base}/privacy`;
  const address = process.env.MAILING_ADDRESS?.trim() || null;
  const subject = "Please confirm your email address";
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
  const ask = `You asked to ${askedFor}.`;
  const rule = "I will only send those emails once you confirm your email address. If you did not ask for this, or you have changed your mind, do nothing and you will not hear from me.";

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Confirm to start receiving occasional emails from Martin Dubreuil.</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1816;">
  <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b1f1f;font-weight:600;margin:0 0 16px;">The Modern Business Architect</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 14px;">${esc(greeting)}</p>
  <p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 14px;">${esc(ask)} ${esc(rule)}</p>
  <p style="margin:26px 0;"><a href="${confirmUrl}" style="display:inline-block;background:#6b1f1f;color:#ffffff;text-decoration:none;padding:14px 26px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Yes, confirm my email →</a></p>
  <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 20px;">If the button does not work, copy this link into your browser:<br><a href="${confirmUrl}" style="color:#6b1f1f;word-break:break-all;">${confirmUrl}</a></p>
  <p style="font-size:15px;color:#333;margin:0 0 4px;">— Martin</p>
  <hr style="border:none;border-top:1px solid #e5e0dc;margin:28px 0 14px;" />
  <p style="font-size:11px;color:#999;line-height:1.7;margin:0;">
    Sent by Martin Dubreuil · The Modern Business Architect · <a href="${base}" style="color:#999;">${esc(base.replace(/^https?:\/\//, ""))}</a><br/>
    ${address ? `${esc(address)}<br/>` : ""}Questions: reply to this email or write to ${REPLY_TO}.<br/>
    You are receiving this one-off email because someone entered this address and asked to ${esc(askedFor)}. Nothing further is sent unless you confirm.<br/>
    <a href="${unsubscribePage}" style="color:#999;">Unsubscribe</a> · <a href="${privacyUrl}" style="color:#999;">Privacy Policy</a>
  </p>
</div></body></html>`;

  const text = [
    greeting,
    "",
    `${ask} ${rule}`,
    "",
    `Confirm my email: ${confirmUrl}`,
    "",
    "— Martin",
    "",
    "--",
    `Sent by Martin Dubreuil, The Modern Business Architect (${base})`,
    ...(address ? [address] : []),
    `Questions: reply to this email or write to ${REPLY_TO}.`,
    `You are receiving this one-off email because someone entered this address and asked to ${askedFor}. Nothing further is sent unless you confirm.`,
    `Unsubscribe: ${unsubscribePage}`,
    `Privacy Policy: ${privacyUrl}`,
  ].join("\n");

  return { subject, html, text, links: { confirmUrl, unsubscribePage, unsubscribePost, privacyUrl } };
}

/** Never throws: a failed confirmation email must not fail the visitor's request. The result is for the caller to record. */
export async function sendConsentConfirmationEmail(params: ConsentConfirmationParams & { to: string }): Promise<{ ok: boolean; error: string | null }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not configured." };
  try {
    const { subject, html, text, links } = buildConsentConfirmationEmail(params);
    const result = await createResend().emails.send({
      from: process.env.CONSENT_EMAIL_FROM || process.env.PROGRAM_EMAIL_FROM || DEFAULT_CONSENT_EMAIL_FROM,
      to: params.to,
      replyTo: REPLY_TO,
      subject,
      html,
      text,
      headers: { "List-Unsubscribe": `<${links.unsubscribePost}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (result.error || !result.data?.id) return { ok: false, error: result.error?.message ?? "Email provider returned no message id." };
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 500) : "Unknown email error" };
  }
}
