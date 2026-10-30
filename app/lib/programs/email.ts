import "server-only";
import { createResend } from "@/app/lib/email-client";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { INTRO_BOOKING_URL } from "@/app/lib/booking";
import { isHttpsUrl, renderEmail, type Block } from "./email-shell";
import { programAdminTo, programFrom, programReplyTo } from "./routing";

export type ProgramEmail = { subject: string; preview: string; html: string; text: string; links: string[] };

/** The configured scheduling link, or null when it is not a valid https URL (the button is then omitted, never faked). */
export function schedulingUrl(): string | null {
  return isHttpsUrl(INTRO_BOOKING_URL) ? INTRO_BOOKING_URL : null;
}

const transactionalFooter = () => ({
  privacyUrl: `${appBaseUrl()}/privacy`,
  reason: "You are receiving this message because you submitted an application on The Modern Business Architect. You can reply to this email and it will reach me directly.",
});

/**
 * The booking invitation: sent to EVERY valid applicant, with no screening and no marketing content. `bookingUrl` is the
 * same per-applicant link the confirmation screen shows (one Calendly event, so a booking made from either place is one appointment).
 * The button is omitted, never faked, if the link is not a valid https URL.
 */
export function invitationMessage(firstName: string, bookingUrl: string | null): ProgramEmail {
  const url = isHttpsUrl(bookingUrl) ? bookingUrl : null;
  const subject = "Let’s have a conversation";
  const preview = "The next step is simple. Pick a time that works for you.";
  const blocks: Block[] = [
    { type: "p", text: `Hi ${firstName},` },
    { type: "p", text: "Thanks for taking the time to tell me a little about yourself and what you’re thinking of doing." },
    { type: "p", text: "The next step is simple. Let’s have a conversation." },
    { type: "p", text: "You can book a Zoom call with me using the button below." },
    ...(url ? [{ type: "cta", label: "BOOK YOUR CONVERSATION", url } as Block, { type: "p", text: "Pick whatever works best for you." } as Block] : []),
    { type: "p", text: "If you’ve already booked directly from the confirmation page, there’s nothing else you need to do. This is the same booking link, not a second appointment." },
    { type: "p", text: "One small thing: depending on where you are in the world, available slots can sometimes be limited because of time-zone differences." },
    { type: "p", text: "If you can’t find anything suitable, just reply to this email and we’ll figure something out." },
    { type: "p", text: "Looking forward to talking." },
  ];
  const r = renderEmail({ kind: "customer", preview, heading: subject, blocks, signature: { role: "The Modern Business Architect" }, footer: transactionalFooter() });
  return { subject, preview, ...r };
}

/** Martin's own message, preserved exactly, in the same shell. A button appears only for a valid scheduling URL passed as data. */
export function manualResponseMessage(opts: { subject: string; message: string; schedulingUrl?: string | null }): ProgramEmail {
  const url = isHttpsUrl(opts.schedulingUrl) && !opts.message.includes(opts.schedulingUrl) ? opts.schedulingUrl : null;
  const preview = "A personal note from Martin.";
  const blocks: Block[] = [{ type: "verbatim", text: opts.message }, ...(url ? [{ type: "cta", label: "Choose a time to talk", url } as Block] : [])];
  const r = renderEmail({ kind: "customer", preview, heading: opts.subject, blocks, signature: false, footer: transactionalFooter() });
  return { subject: opts.subject, preview, ...r };
}

/** Internal notification to Martin. Utilitarian: no customer footer, no unsubscribe link. Nothing here needs a decision from him. */
export function adminMessage(id: string, name: string, applicantEmail = "", country = ""): ProgramEmail {
  const open = `${appBaseUrl()}/admin/programs/corporate-transition/${id}`;
  const subject = `New Corporate Transition application — ${name}`;
  const preview = `${name} has applied and is offered the booking link on the confirmation page.`;
  const rows: [string, string][] = [["Applicant", name], ...(applicantEmail ? [["Email", applicantEmail] as [string, string]] : []), ...(country ? [["Country", country] as [string, string]] : [])];
  const r = renderEmail({ kind: "internal", eyebrow: "INTERNAL — NEW APPLICATION", preview, heading: "New application", blocks: [{ type: "p", text: "They are offered the booking link on the confirmation page and are not waiting for your approval. Check Admin for the invitation email status." }, { type: "rows", rows }, { type: "cta", label: "Open application in Admin", url: open }], signature: false });
  return { subject, preview, ...r };
}

export type OutgoingProgramEmail = { to: string; subject: string; html: string; text: string; replyTo?: string | null; headers?: Record<string, string>; idempotencyKey?: string; tags?: { name: string; value: string }[] };

export class ProgramEmailRejectedError extends Error {}

export async function sendProgramEmail(m: OutgoingProgramEmail) {
  const result = await createResend().emails.send({
    from: programFrom(), to: m.to, subject: m.subject, html: m.html, text: m.text,
    ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    ...(m.headers ? { headers: m.headers } : {}),
    ...(m.tags ? { tags: m.tags } : {}),
  }, m.idempotencyKey ? { idempotencyKey: m.idempotencyKey } : undefined);
  if (result.error) {
    const code = result.error.statusCode;
    if (typeof code === "number" && code >= 400 && code < 500 && code !== 408) throw new ProgramEmailRejectedError(result.error.message);
    throw new Error(result.error.message); // SDK network errors have statusCode=null; 5xx/timeouts are also uncertain.
  }
  if (!result.data?.id) throw new Error("Email provider returned no message id; delivery outcome is unconfirmed");
  return result.data.id;
}

/**
 * The booking invitation. Reply-To: PROGRAM_REPLY_TO. The idempotency key makes the provider return the SAME message for a
 * repeated call with that key instead of sending twice. Returns the provider's message id.
 */
export const sendInvitation = (to: string, msg: ProgramEmail, idempotencyKey: string, attemptId?: string) => sendProgramEmail({ to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: programReplyTo(), idempotencyKey, ...(attemptId ? { tags: [{ name: "transition_attempt_id", value: attemptId }] } : {}) });

/** Martin's manual response to the applicant. Reply-To: PROGRAM_REPLY_TO. */
export const sendManualResponse = (to: string, msg: ProgramEmail) => sendProgramEmail({ to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: programReplyTo() });

/**
 * Internal notification to PROGRAM_ADMIN_EMAIL (never ADMIN_EMAIL). Reply-To: the applicant, so replying writes to them.
 * Throws when PROGRAM_ADMIN_EMAIL is not configured, so the caller records a failed notification instead of guessing a recipient.
 */
export async function sendInternalNotification(msg: ProgramEmail, applicantEmail: string) {
  const to = programAdminTo();
  if (!to) throw new Error("PROGRAM_ADMIN_EMAIL is not configured; no internal notification was sent.");
  return sendProgramEmail({ to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: applicantEmail });
}
