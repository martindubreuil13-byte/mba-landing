import "server-only";
import { createResend } from "@/app/lib/email-client";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { renderEmail } from "@/app/lib/programs/email-shell";
import { programFrom, programReplyTo } from "@/app/lib/programs/routing";
import { createConfirmationToken } from "./confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

/**
 * The "stay connected?" confirmation message for the Transition application (confirmed opt-in). It has one purpose:
 * confirming community membership. The link opens the signed /confirm page; opening it never confirms anything.
 * Marketing starts only after the recipient presses the button there (POST, see confirmOptIn in consent.ts).
 */
export const DEFAULT_CONSENT_EMAIL_FROM = "Martin Dubreuil <martin@mindrasolutions.com>";

export type ConsentConfirmationParams = { leadId: string; firstName?: string | null };

export function buildConsentConfirmationEmail({ leadId, firstName }: ConsentConfirmationParams) {
  const base = appBaseUrl();
  const confirmUrl = `${base}/confirm?token=${encodeURIComponent(createConfirmationToken(leadId))}`;
  const unsubscribeToken = encodeURIComponent(createUnsubscribeToken(leadId));
  const unsubscribePage = `${base}/unsubscribe?token=${unsubscribeToken}`;
  const unsubscribePost = `${base}/api/unsubscribe?token=${unsubscribeToken}`;
  const privacyUrl = `${base}/privacy`;
  const subject = "One last step to stay connected";
  const preview = "Confirm your email if you’d like occasional ideas, resources and invitations from Martin.";
  const name = firstName?.trim();

  const { html, text } = renderEmail({
    kind: "customer",
    preview,
    heading: "Would you like to stay connected?",
    blocks: [
      { type: "p", text: name ? `Hi ${name},` : "Hi," },
      { type: "p", text: "I’ve already received your application, and I’ll respond to it personally." },
      { type: "p", text: "Separately, if you’d like to receive occasional ideas, resources and invitations from me, you can confirm your email below." },
      { type: "p", text: "This is entirely optional. Not confirming does not affect my review of your application or my reply to it." },
      { type: "p", text: "Marketing emails begin only after you confirm, and you can unsubscribe at any time." },
      { type: "cta", label: "Yes, keep me in the community", url: confirmUrl },
    ],
    signature: true,
    footer: {
      privacyUrl,
      unsubscribeUrl: unsubscribePage,
      unsubscribeLabel: "Unsubscribe or cancel request",
      reason: "You are receiving this one-off email because you ticked the box to stay on Martin’s shortlist when you submitted your application. Nothing further is sent unless you confirm. You can reply to this email and it will reach me directly.",
    },
  });

  return { subject, preview, html, text, links: { confirmUrl, unsubscribePage, unsubscribePost, privacyUrl } };
}

/** Never throws: a failed confirmation email must not fail the visitor's request. The result is for the caller to record. */
export async function sendConsentConfirmationEmail(params: ConsentConfirmationParams & { to: string }): Promise<{ ok: boolean; error: string | null }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not configured." };
  try {
    const { subject, html, text, links } = buildConsentConfirmationEmail(params);
    const replyTo = programReplyTo();
    const result = await createResend().emails.send({
      from: process.env.CONSENT_EMAIL_FROM?.trim() || programFrom(),
      to: params.to,
      ...(replyTo ? { replyTo } : {}),
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
