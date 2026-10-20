import "server-only";
import { schedulingUrl } from "@/app/lib/programs/email";
import { renderEmail, type Block } from "@/app/lib/programs/email-shell";
import { formatPrice, type ServiceProgram } from "./catalog";

/**
 * The two emails sent when someone submits /lets-talk.
 *  - prospectConfirmation: a short, warm reply to the visitor. It deliberately does NOT repeat what they submitted
 *    (address, situation, message): that belongs in the internal notification only.
 *  - inquiryNotification: the scannable lead record for the owner, with a one-tap reply (and Reply-To set to the prospect).
 * Both use the shared brand shell (table layout, inline styles, preheader, plain-text twin).
 */

export type InquiryEmail = { subject: string; preview: string; html: string; text: string };

/** "Ada Lovelace" -> "Ada". Falls back to "there" so the greeting never reads "Hi ,". */
export function firstNameOf(full: string): string {
  const first = full.trim().split(/\s+/)[0]?.replace(/[<>"]/g, "") ?? "";
  return first || "there";
}

const BOOK_LABEL = "Book our first conversation →";

export function prospectConfirmation(input: { name: string; program?: ServiceProgram; booking?: string | null }): InquiryEmail {
  const booking = input.booking === undefined ? schedulingUrl() : input.booking;
  const first = firstNameOf(input.name);
  const about: Block = input.program
    ? { type: "strong", before: "I've received your message about ", strong: input.program.name, after: "." }
    : { type: "p", text: "I've received your message." };
  const blocks: Block[] = [
    { type: "p", text: `Hi ${first},` },
    { type: "p", text: "Thanks for reaching out." },
    about,
    { type: "p", text: "Before we discuss next steps, I want to understand where you are, what you're trying to achieve, and whether I'm the right person to help." },
    { type: "p", text: "No sales pitch. No obligation. Just an initial conversation to see if there's a fit." },
    ...(booking
      ? ([{ type: "cta", label: BOOK_LABEL, url: booking, fallbackLink: false, compact: true }, { type: "note", text: "Or simply reply to this email if you'd rather start there." }] as Block[])
      : ([{ type: "p", text: "Just reply to this email and we'll find a time." }] as Block[])),
  ];
  const preview = input.program ? `I've received your message about ${input.program.name}. Here's what happens next.` : "I've received your message. Here's what happens next.";
  const subject = "Your next move — Modern Business Architect";
  const r = renderEmail({
    kind: "customer",
    preview,
    eyebrow: "MBA",
    heading: "Good. Let's see what you're building.",
    blocks,
    signature: { role: "Business Architect | Coach | Entrepreneur" },
    noFooter: true,
    textPreview: false,
  });
  return { subject, preview, html: r.html, text: r.text };
}

const ATTRIBUTION_LABELS: [string, string][] = [
  ["source", "Source"],
  ["medium", "Medium"],
  ["campaign", "Campaign"],
  ["utm_content", "Content"],
  ["referrer", "Referrer"],
  ["landing_page", "Landing page"],
  ["entry_page", "Form page"],
];

/** Addresses we are willing to put in a mailto: link. Anything stranger is shown as text only (never injected into an attribute). */
const SAFE_MAILTO = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function inquiryNotification(input: {
  name: string;
  email: string;
  message: string;
  situation?: string;
  program?: ServiceProgram;
  attribution: Record<string, string>;
}): InquiryEmail & { replyTo: string | undefined } {
  const { program } = input;
  const first = firstNameOf(input.name);
  const subject = program
    ? `New MBA inquiry · ${program.name} · ${formatPrice(program)}`
    : `New MBA inquiry · ${input.situation && input.situation !== "N/A" ? input.situation : "No program selected"}`;
  const preview = `${input.name} · ${program ? program.name : "No program selected"}`;

  const rows: [string, string][] = [
    ["Name", input.name],
    ["Email", input.email],
    ...(program
      ? ([
          ["Program", `${program.number} · ${program.name}`],
          ["Investment", program.pricing.kind === "fixed" ? `${formatPrice(program)} · fixed fee` : formatPrice(program)],
          ["Timeline", program.duration],
        ] as [string, string][])
      : ([["Situation", input.situation || "Not provided"]] as [string, string][])),
  ];
  const attribution = ATTRIBUTION_LABELS.filter(([k]) => input.attribution[k]).map(([k, label]) => [label, input.attribution[k]] as [string, string]);

  const canMailto = SAFE_MAILTO.test(input.email);
  const replySubject = encodeURIComponent(program ? `Re: your inquiry about ${program.name}` : "Re: your inquiry");
  const blocks: Block[] = [
    { type: "rows", rows },
    { type: "label", text: "Message" },
    { type: "verbatim", text: input.message },
    ...(canMailto ? ([{ type: "cta", label: `Reply to ${first} →`, url: `mailto:${input.email}?subject=${replySubject}`, fallbackLink: false, compact: true }] as Block[]) : []),
    { type: "label", text: "Attribution" },
    { type: "rows", rows: attribution.length ? attribution : [["Source", "Direct, or no tracking recorded"]] },
  ];
  const r = renderEmail({ kind: "internal", preview, textPreview: false, eyebrow: "MBA · New inquiry", heading: program ? program.name : "New inquiry", blocks });
  return { subject, preview, html: r.html, text: r.text, replyTo: canMailto ? input.email : undefined };
}
