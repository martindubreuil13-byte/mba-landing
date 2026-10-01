import "server-only";
import { createResend } from "@/app/lib/email-client";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { CALENDLY_URL } from "./corporate-transition";

const FROM = process.env.PROGRAM_EMAIL_FROM || "Martin <martin@mindrasolutions.com>";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const html = (body: string) => body.split("\n").filter(Boolean).map((p) => `<p>${esc(p).replace(/https:\/\/\S+/g, (u) => `<a href="${u}">${u}</a>`)}</p>`).join("");

export async function sendProgramEmail(to: string, subject: string, text: string) {
  const result = await createResend().emails.send({ from: FROM, to, subject, text, html: html(text) });
  if (result.error || !result.data?.id) throw new Error(result.error?.message || "Email provider returned no message id");
  return result.data.id;
}

export function applicantMessage(route: "INVITE" | "REVIEW" | "NOT_FIT", firstName: string) {
  if (route === "INVITE") return { subject: "Let’s have a conversation", text: `Hi ${firstName},\n\nBased on what you’ve shared, I think there’s enough here for us to explore further. Let’s have a 30-minute Zoom conversation and talk through where you are, what you’re considering, and what a sensible next step might look like.\n\nChoose a time here: ${CALENDLY_URL}\n\n— Martin` };
  if (route === "REVIEW") return { subject: "I’ve received your application", text: `Hi ${firstName},\n\nThanks. I’ve got it. I’d like to look at what you’ve shared before suggesting the next step. I’ll get back to you by email within 48 hours.\n\n— Martin` };
  return { subject: "Thank you for sharing your situation", text: `Hi ${firstName},\n\nThis particular pathway probably isn’t the right fit. It is specifically designed for people who are currently employed and considering a transition into entrepreneurship. That doesn’t mean there isn’t a useful next step for you. You can explore my free resources here: ${appBaseUrl()}/resources\n\n— Martin` };
}

export function adminMessage(id: string, name: string, route: string, summary: string) {
  return { subject: route === "REVIEW" ? `Corporate Transition application needs review — ${name}` : `New Corporate Transition application — ${name} (${route})`, text: `${name} submitted a Corporate Transition application.\n\nRoute: ${route}\n\n${summary}\n\nOpen application: ${appBaseUrl()}/admin/programs/corporate-transition/${id}` };
}
