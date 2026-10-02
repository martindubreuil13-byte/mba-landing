import "server-only";
import { createResend } from "@/app/lib/email-client";
import { createConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { appBaseUrl } from "./base-url";
import type { ResourceConfig } from "./config";
import { renderResourceEmail } from "./email-layout";
import { DEFAULT_RESOURCE_FROM, sendTrackedResourceEmail } from "./delivery-email";
import type { Resource } from "./types";

const REPLY_TO = "martin@mindrasolutions.com";

function memberLinks(leadId: string) {
  const base = appBaseUrl();
  const unsub = encodeURIComponent(createUnsubscribeToken(leadId));
  return {
    // A PAGE link: opening it explains and offers a button; only the button's POST confirms.
    confirmPage: `${base}/confirm?token=${encodeURIComponent(createConfirmationToken(leadId))}`,
    unsubscribePage: `${base}/unsubscribe?token=${unsub}`,
    unsubscribePost: `${base}/api/unsubscribe?token=${unsub}`,
    privacyUrl: `${base}/privacy`,
  };
}

/** Email asking a new or pending person to confirm free membership, which is what unlocks the member benefit. */
export function buildMembershipConfirmationEmail(args: { config: ResourceConfig; resource: Pick<Resource, "title">; leadId: string }) {
  const c = args.config.access.confirmationEmail;
  const links = memberLinks(args.leadId);
  const { html, text } = renderResourceEmail({
    preview: c.preview,
    heading: c.heading,
    blocks: [...c.paragraphs.map((t) => ({ type: "p" as const, text: t })), { type: "cta", label: c.button, url: links.confirmPage }, { type: "small", text: c.ignoreNote }],
    unsubscribeUrl: links.unsubscribePage,
    unsubscribeLabel: "Unsubscribe or cancel request",
    privacyUrl: links.privacyUrl,
    reason: `You are receiving this one-off email because someone entered this address to unlock ${args.resource.title}. Nothing is unlocked and nothing further is sent unless you confirm.`,
  });
  return { subject: c.subject(args.resource.title), preview: c.preview, html, text, links };
}

/** Sends the confirmation email for a (locked) request and tracks its delivery on that request. */
export function sendMembershipConfirmationEmail(args: { to: string; config: ResourceConfig; resource: Resource; requestId: string; leadId: string; retry?: boolean }) {
  const built = buildMembershipConfirmationEmail({ config: args.config, resource: args.resource, leadId: args.leadId });
  return sendTrackedResourceEmail({ to: args.to, built, resource: args.resource, requestId: args.requestId, leadId: args.leadId, kind: "confirmation", retry: args.retry });
}

/** Email for the explicit rejoin flow. Not tied to a resource or request. */
export function buildRejoinConfirmationEmail(leadId: string) {
  const links = memberLinks(leadId);
  const preview = "Confirm to start receiving occasional emails from Martin again.";
  const { html, text } = renderResourceEmail({
    preview,
    heading: "Would you like to rejoin?",
    blocks: [
      { type: "p", text: "Hello," },
      { type: "p", text: "You asked to rejoin The Modern Business Architect community after unsubscribing." },
      { type: "p", text: "Nothing changes until you confirm. If you do, you may receive occasional ideas, resources and invitations from me again, and you can unsubscribe at any time." },
      { type: "cta", label: "Yes, rejoin the community", url: links.confirmPage },
      { type: "small", text: "If you did not ask for this, ignore this email. You will not be added back and nothing further will be sent." },
    ],
    unsubscribeUrl: links.unsubscribePage,
    unsubscribeLabel: "Unsubscribe or cancel request",
    privacyUrl: links.privacyUrl,
    reason: "You are receiving this one-off email because someone entered this address on the rejoin page. Nothing changes unless you confirm.",
  });
  return { subject: "Confirm to rejoin the community", preview, html, text, links };
}

/** Never throws; reports whether the provider accepted it. */
export async function sendRejoinConfirmationEmail(args: { to: string; leadId: string }): Promise<{ ok: boolean; error: string | null }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not configured." };
  try {
    const built = buildRejoinConfirmationEmail(args.leadId);
    const result = await createResend().emails.send({
      from: process.env.RESOURCE_EMAIL_FROM || DEFAULT_RESOURCE_FROM,
      to: args.to,
      replyTo: REPLY_TO,
      subject: built.subject,
      html: built.html,
      text: built.text,
      headers: { "List-Unsubscribe": `<${built.links.unsubscribePost}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (result.error || !result.data?.id) return { ok: false, error: result.error?.message ?? "Email provider returned no message id." };
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 500) : "Unknown email error" };
  }
}
