import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createResend } from "@/app/lib/email-client";
import { confirmOptIn, consentStatusOf } from "@/app/lib/leads/consent";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { renderEmail } from "@/app/lib/programs/email-shell";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import type { Lead } from "@/app/lib/resources/types";
import { getServiceClient } from "@/app/lib/supabase/service";

/**
 * Email verification for the MBA community invitation (the "Stay in the loop" answer given after a booking), where the site's own policy asks for
 * proof that the address is the visitor's (app/lib/consent/regions.ts), or the visitor had unsubscribed before.
 *
 * The visitor's "yes" is stored as a PENDING request (marketing stays off). This module sends ONE dedicated message and activates consent only when
 * its link is used. The link's token:
 *   - is signed (HMAC) and carries its own prefix, so no other site token (unsubscribe, guide confirmation) can be used here or the other way round;
 *   - is bound to ONE request record, not just to the contact: after a withdrawal, an older link names a request that predates the withdrawal and does nothing;
 *   - expires (14 days);
 *   - has its effect once: using it again changes nothing and writes nothing; a withdrawn (or never-pending) contact stays as it is; a suppressed one is never touched;
 *   - is only ever acted on by a POST from the /community/verify page, so opening the link or a mail scanner's prefetch activates nothing.
 */
const PREFIX = "m1";
export const COMMUNITY_VERIFICATION_TTL_DAYS = 14;
export const COMMUNITY_SOURCE_TYPE = "scheduling_booking";

function secret() {
  const value = process.env.NAPKIN_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Community verification signing is not configured.");
  return value;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createCommunityVerificationToken(leadId: string, requestId: string, now = Date.now(), ttlDays = COMMUNITY_VERIFICATION_TTL_DAYS): string {
  const payload = `${PREFIX}.${leadId}.${requestId}.${Math.floor(now / 1000) + ttlDays * 86_400}`;
  return `${payload}.${sign(payload)}`;
}

export type VerificationTokenCheck = { ok: true; leadId: string; requestId: string } | { ok: false; reason: "invalid" | "expired" };

export function verifyCommunityVerificationToken(token: string, now = Date.now()): VerificationTokenCheck {
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== PREFIX || !parts[1] || !parts[2] || !parts[3] || !parts[4]) return { ok: false, reason: "invalid" };
  const expected = Buffer.from(sign(parts.slice(0, 4).join(".")));
  const supplied = Buffer.from(parts[4]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return { ok: false, reason: "invalid" };
  const expires = Number(parts[3]);
  if (!Number.isFinite(expires) || expires * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, leadId: parts[1], requestId: parts[2] };
}

export type VerificationResult = { status: "confirmed" | "already_confirmed" | "not_pending" | "suppressed" | "invalid" | "expired" };

/**
 * Activates consent for the request the token names, if and only if it is still the live, pending request. The wording, version and source recorded
 * with the request are what the contact agreed to; the confirming device's keyed hashes are the verification evidence (`email_confirmation`).
 */
export async function verifyCommunityOptIn(token: string, device: { ipHash: string | null; userAgentHash: string | null }, now = Date.now()): Promise<VerificationResult> {
  const check = verifyCommunityVerificationToken(token, now);
  if (!check.ok) return { status: check.reason };
  const db = getServiceClient();
  const { data: lead, error } = await db.from("leads").select("*").eq("id", check.leadId).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  if (!lead) return { status: "invalid" };
  const { data: request } = await db.from("consent_records").select("id, created_at, source_type").eq("id", check.requestId).eq("lead_id", check.leadId).eq("action", "opt_in_requested").maybeSingle();
  if (!request || request.source_type !== COMMUNITY_SOURCE_TYPE) return { status: "invalid" };

  const status = consentStatusOf(lead as Lead);
  if (status === "suppressed") return { status: "suppressed" };
  if (status === "opted_in") return { status: "already_confirmed" };
  // A withdrawal made after this request ends it: this link must not bring the contact back.
  const out = (lead as Lead).ongoing_content_opt_out_at;
  if (out && Date.parse(request.created_at) <= Date.parse(out)) return { status: "not_pending" };

  const result = await confirmOptIn(check.leadId, device);
  if (result.status === "confirmed") return { status: "confirmed" };
  if (result.status === "already_confirmed") return { status: "already_confirmed" };
  if (result.status === "suppressed") return { status: "suppressed" };
  if (result.status === "not_found") return { status: "invalid" };
  return { status: "not_pending" };
}

/** The request record the verification link must be bound to: the newest "yes" request of this kind for the contact. */
export async function latestCommunityRequestId(leadId: string): Promise<string | null> {
  const { data, error } = await getServiceClient().from("consent_records").select("id").eq("lead_id", leadId).eq("action", "opt_in_requested").eq("source_type", COMMUNITY_SOURCE_TYPE).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Failed to load the consent request: ${error.message}`);
  return (data?.id as string | undefined) ?? null;
}

export function buildCommunityVerificationEmail(p: { leadId: string; requestId: string; firstName?: string | null; now?: number }) {
  const base = appBaseUrl();
  const verifyUrl = `${base}/community/verify?token=${encodeURIComponent(createCommunityVerificationToken(p.leadId, p.requestId, p.now))}`;
  const unsubscribeToken = encodeURIComponent(createUnsubscribeToken(p.leadId));
  const unsubscribePage = `${base}/unsubscribe?token=${unsubscribeToken}`;
  const unsubscribePost = `${base}/api/unsubscribe?token=${unsubscribeToken}`;
  const privacyUrl = `${base}/privacy`;
  const name = p.firstName?.trim();
  const subject = "Please confirm your email address";
  const preview = "One click to confirm you’d like to stay in the loop.";
  const { html, text } = renderEmail({
    kind: "customer",
    preview,
    heading: "Please confirm your email address",
    blocks: [
      { type: "p", text: name ? `Hi ${name},` : "Hi," },
      { type: "p", text: "When you booked a conversation, you said yes to hearing occasionally from The Modern Business Architect. Before anything is sent, I’d like to be sure this address is yours." },
      { type: "p", text: "If it is, confirm below. Until you do, you will not receive anything, and your booking is not affected either way." },
      { type: "cta", label: "Yes, confirm my email", url: verifyUrl },
      { type: "p", text: "If you did not ask for this, ignore this message: nothing will be sent to you." },
    ],
    signature: true,
    footer: {
      privacyUrl,
      unsubscribeUrl: unsubscribePage,
      unsubscribeLabel: "Unsubscribe or cancel this request",
      reason: "You are receiving this one-off message because someone entered this address when booking a conversation with The Modern Business Architect and chose to stay in the loop. You can reply to this email and it will reach me directly.",
    },
  });
  return { subject, preview, html, text, links: { verifyUrl, unsubscribePage, unsubscribePost, privacyUrl } };
}

export type VerificationSender = (p: { to: string; leadId: string; requestId: string; firstName: string }) => Promise<{ ok: boolean; error: string | null }>;

/** Never throws; the caller decides what a failure means. It uses the site's ordinary client WITHOUT the scheduling test-mode exception, so outside production its email policy blocks delivery to anyone but the admin address. */
export const sendCommunityVerificationEmail: VerificationSender = async ({ to, leadId, requestId, firstName }) => {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY is not configured." };
  try {
    const { subject, html, text, links } = buildCommunityVerificationEmail({ leadId, requestId, firstName });
    const from = process.env.SCHEDULING_EMAIL_FROM?.trim() || "Martin Dubreuil <martin@mindrasolutions.com>";
    const replyTo = process.env.SCHEDULING_EMAIL_REPLY_TO?.trim() || "martin@mindrasolutions.com";
    const result = await createResend().emails.send({
      from, to, replyTo, subject, html, text,
      headers: { "List-Unsubscribe": `<${links.unsubscribePost}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }, { idempotencyKey: `community-verify/${requestId}` });
    if (result.error || !result.data?.id) return { ok: false, error: result.error?.message ?? "Email provider returned no message id." };
    return { ok: true, error: null };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message.slice(0, 500) : "Unknown email error" }; }
};
