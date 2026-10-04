import "server-only";
import { appBaseUrl } from "./base-url";

/**
 * Email-safe layout for resource/membership emails (same look as the guide delivery email): warm-white page, white
 * card (max 600px), burgundy eyebrow, Georgia heading, Arial body, tables + inline styles, hidden preview text, no
 * external resources. Content is passed as data and rendered to HTML and an equivalent plain text.
 */
const BURGUNDY = "#6b1f1f";
const SERIF = "Georgia,'Times New Roman',Times,serif";
const SANS = "Arial,Helvetica,sans-serif";

export const escHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type LayoutBlock =
  | { type: "p"; text: string }
  | { type: "small"; text: string; /** Wording for the plain-text version when it should differ (e.g. "link" instead of "button"). */ plainText?: string }
  /** A highlighted name, e.g. the resource title. */
  | { type: "title"; text: string }
  | { type: "cta"; label: string; url: string };

export type LayoutInput = {
  preview: string;
  heading: string;
  blocks: LayoutBlock[];
  /** Footer unsubscribe link. Omit it for a one-off email to someone who is not subscribed. */
  unsubscribeUrl?: string;
  unsubscribeLabel?: string;
  privacyUrl: string;
  reason: string;
};

/** Postal address lines from MAILING_ADDRESS (real line breaks or a literal "\n"). Never hardcoded. */
export function mailingAddressLines(): string[] {
  return (process.env.MAILING_ADDRESS ?? "").split(/\r?\n|\\n/).map((l) => l.trim()).filter(Boolean);
}

const para = (t: string, extra = "") => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.65;color:#2b2623;${extra}">${escHtml(t)}</p>`;

export function renderResourceEmail(input: LayoutInput): { html: string; text: string } {
  const base = appBaseUrl();
  const host = base.replace(/^https?:\/\//, "");
  const addr = mailingAddressLines();

  const blockHtml = (b: LayoutBlock) =>
    b.type === "p"
      ? para(b.text)
      : b.type === "small"
        ? para(b.text, "font-size:13px;color:#7a726b;")
        : b.type === "title"
          ? `<p style="margin:0 0 14px;font-family:${SERIF};font-size:24px;line-height:1.3;color:#1a1816;"><strong>${escHtml(b.text)}</strong></p>`
        : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 10px;"><tr><td bgcolor="${BURGUNDY}" style="background:${BURGUNDY};"><a href="${b.url}" style="display:inline-block;padding:16px 32px;font-family:${SANS};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.5px;text-align:center;">${escHtml(b.label)}</a></td></tr></table>
<p style="margin:0 0 24px;font-family:${SANS};font-size:12px;line-height:1.6;color:#7a726b;">Button not working? Copy this link into your browser:<br><a href="${b.url}" style="color:${BURGUNDY};word-break:break-all;">${b.url}</a></p>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><title>${escHtml(input.heading)}</title></head>
<body style="margin:0;padding:0;background:#f6f2ec;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escHtml(input.preview)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f2ec;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fffdf9;border:1px solid #e8e1da;">
<tr><td style="padding:36px 32px 8px;">
<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BURGUNDY};font-weight:bold;">The Modern Business Architect</p>
<h1 style="margin:0 0 8px;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:normal;color:#1a1816;">${escHtml(input.heading)}</h1>
<div style="width:48px;border-top:2px solid ${BURGUNDY};margin:16px 0 0;font-size:0;line-height:0;">&nbsp;</div>
</td></tr>
<tr><td style="padding:20px 32px 12px;">
${input.blocks.map(blockHtml).join("\n")}
</td></tr>
<tr><td style="padding:4px 32px 28px;"><p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.5;color:#1a1816;"><strong>Martin Dubreuil</strong><br>The Modern Business Architect</p></td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e8e1da;"><p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.8;color:#7a726b;"><a href="${input.privacyUrl}" style="color:${BURGUNDY};">Privacy</a>${input.unsubscribeUrl ? ` · <a href="${input.unsubscribeUrl}" style="color:${BURGUNDY};">${escHtml(input.unsubscribeLabel ?? "Unsubscribe")}</a>` : ""}<br>Sent by Martin Dubreuil · The Modern Business Architect · <a href="${base}" style="color:#7a726b;">${escHtml(host)}</a><br>${addr.length ? `${addr.map(escHtml).join("<br>")}<br>` : ""}${escHtml(input.reason)}</p></td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    input.preview, "",
    "THE MODERN BUSINESS ARCHITECT", input.heading, "",
    ...input.blocks.flatMap((b) => (b.type === "cta" ? [`${b.label}: ${b.url}`, ""] : [b.type === "small" && b.plainText ? b.plainText : b.text, ""])),
    "Martin Dubreuil", "The Modern Business Architect", "",
    "--",
    `Privacy: ${input.privacyUrl}`,
    ...(input.unsubscribeUrl ? [`${input.unsubscribeLabel ?? "Unsubscribe"}: ${input.unsubscribeUrl}`] : []),
    `Sent by Martin Dubreuil, The Modern Business Architect (${base})`,
    ...addr,
    input.reason,
  ].join("\n");

  return { html, text };
}
