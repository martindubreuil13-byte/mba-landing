import "server-only";
import { createResend } from "@/app/lib/email-client";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { CALENDLY_URL } from "./corporate-transition";
import { isHttpsUrl, renderEmail, type Block } from "./email-shell";
import { programAdminTo, programFrom, programReplyTo } from "./routing";

export type ProgramRoute = "INVITE" | "REVIEW" | "NOT_FIT";
export type ProgramEmail = { subject: string; preview: string; html: string; text: string; links: string[] };

/** The configured scheduling link, or null when it is not a valid https URL (the button is then omitted, never faked). */
export function schedulingUrl(): string | null {
  return isHttpsUrl(CALENDLY_URL) ? CALENDLY_URL : null;
}

const transactionalFooter = () => ({
  privacyUrl: `${appBaseUrl()}/privacy`,
  reason: "You are receiving this message because you submitted an application on The Modern Business Architect. You can reply to this email and it will reach me directly.",
});

function copy(subject: string, preview: string, heading: string, firstName: string, paragraphs: string[], extra: Block[] = []): ProgramEmail {
  const blocks: Block[] = [{ type: "p", text: `Hi ${firstName},` }, ...paragraphs.map((text): Block => ({ type: "p", text })), ...extra];
  const r = renderEmail({ kind: "customer", preview, heading, blocks, signature: true, footer: transactionalFooter() });
  return { subject, preview, ...r };
}

/** Acknowledgement sent to the applicant, chosen by the qualification route. */
export function applicantMessage(route: ProgramRoute, firstName: string, opts: { schedulingUrl?: string | null } = {}): ProgramEmail {
  const scheduling = opts.schedulingUrl === undefined ? schedulingUrl() : isHttpsUrl(opts.schedulingUrl) ? opts.schedulingUrl : null;
  if (route === "INVITE") {
    return copy("Let’s have a conversation", "What you’ve shared suggests there may be something worth exploring.", "There may be something worth exploring", firstName, [
      "Thank you for sharing where you are and what you’re considering.",
      "What you’ve described suggests there may be enough substance for a useful conversation—not to rush into a business, but to understand whether your next move can be designed credibly.",
      scheduling ? "You can choose a time below." : "I’ll follow up with you personally by email to find a time.",
    ], scheduling ? [{ type: "cta", label: "Choose a time to talk", url: scheduling }] : []);
  }
  if (route === "REVIEW") {
    return copy("I’ve received your application", "I’ll review what you’ve shared and come back to you personally.", "I’ve received your application", firstName, [
      "Thank you for taking the time to share where you are and what you’re considering.",
      "I’m going to review your application personally before suggesting what—if anything—the right next step should be.",
      "I aim to get back to you by email within 48 hours.",
      "There is nothing else you need to do for now.",
    ]);
  }
  return copy("Thank you for sharing your situation", "A candid response about the next step.", "A candid response", firstName, [
    "Thank you for taking the time to tell me where you are.",
    "Based on what you’ve shared, I don’t think this particular pathway is the right next step for you. That is not a judgment on your ambition or your ability. It simply means I don’t want to suggest a process that may not serve you well right now.",
  ], [{ type: "link", before: "You are still welcome to use the free resources on The Modern Business Architect as you continue thinking: ", label: "browse the resources", url: `${appBaseUrl()}/resources`, after: "." }]);
}

/** Martin's own message, preserved exactly, in the same shell. A button appears only for a valid scheduling URL passed as data. */
export function manualResponseMessage(opts: { subject: string; message: string; schedulingUrl?: string | null }): ProgramEmail {
  const url = isHttpsUrl(opts.schedulingUrl) && !opts.message.includes(opts.schedulingUrl) ? opts.schedulingUrl : null;
  const preview = "A personal note from Martin.";
  const blocks: Block[] = [{ type: "verbatim", text: opts.message }, ...(url ? [{ type: "cta", label: "Choose a time to talk", url } as Block] : [])];
  const r = renderEmail({ kind: "customer", preview, heading: opts.subject, blocks, signature: false, footer: transactionalFooter() });
  return { subject: opts.subject, preview, ...r };
}

/** Internal notification to Martin. Utilitarian: no customer footer, no unsubscribe link. */
export function adminMessage(id: string, name: string, route: string, summary: string, applicantEmail = ""): ProgramEmail {
  const open = `${appBaseUrl()}/admin/programs/corporate-transition/${id}`;
  const subject = route === "REVIEW" ? `Corporate Transition application needs review — ${name}` : `New Corporate Transition application — ${name} (${route})`;
  const preview = `${name} · ${route}`;
  const rows: [string, string][] = [["Applicant", name], ...(applicantEmail ? [["Email", applicantEmail] as [string, string]] : []), ["Route", route], ["Summary", summary]];
  const r = renderEmail({ kind: "internal", eyebrow: "INTERNAL — APPLICATION REVIEW", preview, heading: route === "REVIEW" ? "Application needs review" : `New application (${route})`, blocks: [{ type: "rows", rows }, { type: "cta", label: "Open application in Admin", url: open }], signature: false });
  return { subject, preview, ...r };
}

export type OutgoingProgramEmail = { to: string; subject: string; html: string; text: string; replyTo?: string | null; headers?: Record<string, string> };

export async function sendProgramEmail(m: OutgoingProgramEmail) {
  const result = await createResend().emails.send({
    from: programFrom(), to: m.to, subject: m.subject, html: m.html, text: m.text,
    ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    ...(m.headers ? { headers: m.headers } : {}),
  });
  if (result.error || !result.data?.id) throw new Error(result.error?.message || "Email provider returned no message id");
  return result.data.id;
}

/** Acknowledgement to the applicant. Reply-To: PROGRAM_REPLY_TO. */
export const sendApplicantAck = (to: string, msg: ProgramEmail) => sendProgramEmail({ to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: programReplyTo() });

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
