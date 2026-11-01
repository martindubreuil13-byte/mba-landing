import "server-only";
import { createResend } from "@/app/lib/email-client";
import { bareAddress, SCHEDULING_TEST_RECIPIENT, schedulingTestModeActive } from "@/app/lib/email-policy";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { isHttpsUrl, renderEmail, type Block } from "@/app/lib/programs/email-shell";
import { isApprovedOwnerAddress, OWNER_NOTIFICATION_EMAIL } from "../owner-address";
import { EmailAlreadyAcceptedError, EmailOutcomeUnknownError, EmailSendError, type EmailProvider, type OutgoingEmail } from "../providers";
import type { EmailContent } from "../notifications";
import type { EmailKind } from "../types";

/**
 * Booking emails through the site's existing, policy-checked Resend client (createResend), in the existing branded shell
 * (warm-white card, burgundy eyebrow, Georgia heading, plain-text part). TRANSACTIONAL ONLY: no marketing content, no unsubscribe link,
 * no tracking pixel; marketing consent is a separate, explicit choice handled elsewhere. Every send carries an idempotency key, so a retry cannot deliver twice.
 * In non-production environments the client's email policy blocks delivery to anyone but the admin address, exactly as for the other flows.
 */
export const DEFAULT_SCHEDULING_FROM = "Martin Dubreuil <martin@mindrasolutions.com>";

/** The only messages this provider will send: the booking guest's transactional emails. Anything else is refused outright. */
const TRANSACTIONAL_KINDS: ReadonlySet<string> = new Set<EmailKind>(["confirmation", "reschedule", "cancellation", "zoom_details", "confirmation_resend", "owner_new_booking", "owner_rescheduled", "owner_canceled"]);

const bare = (v: string) => (v.match(/<([^>]+)>/)?.[1] ?? v).trim();

export function renderBookingEmail(c: EmailContent): { html: string; text: string } {
  const blocks: Block[] = [...(c.greeting ? [{ type: "p", text: c.greeting } as Block] : []), ...c.paragraphs.map((text) => ({ type: "p", text }) as Block)];
  if (c.rows.length) blocks.push({ type: "rows", rows: c.rows });
  // The button appears only for a valid https Zoom URL, never a faked one.
  if (c.zoomUrl && isHttpsUrl(c.zoomUrl)) blocks.push({ type: "cta", label: c.audience === "owner" ? "OPEN ZOOM MEETING" : "JOIN ZOOM MEETING", url: c.zoomUrl });
  if (c.closing) blocks.push({ type: "p", text: c.closing });
  // The host's notification is an internal message: no guest signature, no "you booked a meeting" footer.
  if (c.audience === "owner") { const r = renderEmail({ kind: "internal", eyebrow: "MBA Scheduling", preview: c.preview, heading: c.heading, blocks }); return { html: r.html, text: r.text }; }
  const r = renderEmail({
    kind: "customer", preview: c.preview, heading: c.heading, blocks, signature: { role: "The Modern Business Architect" },
    footer: { privacyUrl: `${appBaseUrl()}/privacy`, reason: "You are receiving this message because you booked a meeting with The Modern Business Architect. You can reply to this email and it will reach me directly." },
  });
  return { html: r.html, text: r.text };
}

export class ResendEmailProvider implements EmailProvider {
  readonly simulated = false;
  /** Development test mode (flag, `next dev`, not Vercel): real delivery only to the one allowlisted address, everything else simulated. */
  get testMode() { return schedulingTestModeActive(process.env); }
  constructor(private o: { from?: string; replyTo?: string; resend?: ReturnType<typeof createResend>; /** Tests only: the environment to evaluate test mode in. */ env?: Record<string, string | undefined> } = {}) {}

  async send(m: OutgoingEmail): Promise<{ id: string; simulated?: boolean }> {
    // Transactional booking messages only, one plain recipient. No marketing, no lists, no cc / bcc, whatever the caller passes.
    const kind = m.tags?.scheduling_kind;
    if (!kind || !TRANSACTIONAL_KINDS.has(kind) || !m.tags?.scheduling_booking) throw new EmailSendError("Only transactional scheduling messages can be sent from here.");
    if (/[,;\s<>]/.test(m.to)) throw new EmailSendError("A booking email goes to exactly one plain address.");
    if (kind.startsWith("owner_") && !isApprovedOwnerAddress(m.to)) throw new EmailSendError("Owner notifications go only to the approved owner address.");
    // Test mode: the single developer address gets the real message; every other recipient is simulated and NEVER reaches Resend.
    if (schedulingTestModeActive(this.o.env ?? process.env) && bareAddress(m.to) !== SCHEDULING_TEST_RECIPIENT) return { id: `suppressed_${m.idempotencyKey.length}_${Date.now().toString(36)}`, simulated: true };
    const from = this.from();
    // A notification to the host is answered to the guest it is about; everything else is answered to the host.
    const replyTo = kind.startsWith("owner_") && m.replyTo &&!/[,;\s<>]/.test(m.replyTo) ? m.replyTo : this.o.replyTo ?? process.env.SCHEDULING_EMAIL_REPLY_TO ?? bare(from);
    const body = m.content ? renderBookingEmail(m.content) : { html: m.html, text: m.text };
    return this.post({ from, to: m.to, subject: m.subject, text: body.text, ...(body.html ? { html: body.html } : {}), replyTo, tags: Object.entries(m.tags ?? {}).map(([name, value]) => ({ name, value })) }, m.idempotencyKey);
  }

  /**
   * An operational alert to the owner: aggregate counts only, never guest details. Goes to the one approved owner address and nowhere else, and is
   * subject to the same development test-mode confinement as every other message.
   */
  async alert(m: { subject: string; text: string; idempotencyKey: string }): Promise<{ id: string; simulated?: boolean }> {
    const to = OWNER_NOTIFICATION_EMAIL;
    if (schedulingTestModeActive(this.o.env ?? process.env) && bareAddress(to) !== SCHEDULING_TEST_RECIPIENT) return { id: `suppressed_${m.idempotencyKey.length}_${Date.now().toString(36)}`, simulated: true };
    const from = this.from();
    return this.post({ from, to, subject: m.subject, text: m.text, replyTo: this.o.replyTo ?? process.env.SCHEDULING_EMAIL_REPLY_TO ?? bare(from), tags: [{ name: "scheduling_kind", value: "operational_alert" }] }, m.idempotencyKey);
  }

  private from() { return this.o.from ?? process.env.SCHEDULING_EMAIL_FROM ?? process.env.RESOURCE_EMAIL_FROM ?? DEFAULT_SCHEDULING_FROM; }

  /** One call to Resend, with its answer read three ways: accepted, definitely refused, or outcome unknown. */
  private async post(payload: { from: string; to: string; subject: string; text: string; html?: string; replyTo: string; tags: Array<{ name: string; value: string }> }, idempotencyKey: string): Promise<{ id: string }> {
    let result;
    try {
      result = await (this.o.resend ?? createResend(undefined, { purpose: "scheduling-transactional" })).emails.send(payload, { idempotencyKey });
    } catch (e) { throw new EmailOutcomeUnknownError(`Email provider did not answer: ${e instanceof Error ? e.message : "unknown error"}`); }
    const { data, error } = result;
    if (!error && data?.id) return { id: data.id };
    const e = (error ?? {}) as { name?: string; statusCode?: number | null; message?: string };
    const detail = e.message ? `: ${e.message}` : "";
    // Resend remembers an idempotency key for 24 hours. The same key with different content means the first message WAS accepted.
    if (e.name === "invalid_idempotent_request") throw new EmailAlreadyAcceptedError(`Email provider already holds a message under this key${detail}`);
    // No status (the SDK could not reach Resend), a server error, a message still being processed, or a reply with neither data nor error: the outcome is unknown.
    if (!error || e.statusCode == null || e.statusCode >= 500 || e.name === "concurrent_idempotent_requests") throw new EmailOutcomeUnknownError(`Email provider outcome unknown${detail}`);
    throw new EmailSendError(`Email provider refused the message${detail}`);
  }
}
