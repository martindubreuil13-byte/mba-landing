import "server-only";
import { appBaseUrl } from "@/app/lib/resources/base-url";

/**
 * One email-safe visual shell for every Transition email: warm-white page, white card (max 600px), burgundy
 * eyebrow, Georgia heading, Arial body, table layout with inline styles, hidden preview text, no external
 * resources. Each email is described as data (heading + blocks) and rendered to HTML and to equivalent plain text.
 */
const BURGUNDY = "#6b1f1f";
const SERIF = "Georgia,'Times New Roman',Times,serif";
const SANS = "Arial,Helvetica,sans-serif";

export const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type Block =
  | { type: "p"; text: string }
  /** Verbatim text from a person: line breaks kept, nothing rewritten. Bare https URLs become links in HTML only. */
  | { type: "verbatim"; text: string }
  | { type: "cta"; label: string; url: string }
  | { type: "link"; before: string; label: string; url: string; after?: string }
  | { type: "rows"; rows: [string, string][] };

export type EmailKind = "customer" | "internal";

export type ShellInput = {
  kind: EmailKind;
  preview: string;
  heading: string;
  eyebrow?: string;
  blocks: Block[];
  /** Customer emails end with the signature block unless the message carries its own sign-off. */
  signature?: boolean;
  footer?: { privacyUrl?: string; unsubscribeLabel?: string; unsubscribeUrl?: string; reason?: string };
};

/** Postal address lines from MAILING_ADDRESS (real line breaks or a literal "\n"). Never hardcoded. */
export function mailingAddressLines(): string[] {
  return (process.env.MAILING_ADDRESS ?? "").split(/\r?\n|\\n/).map((l) => l.trim()).filter(Boolean);
}

export function isHttpsUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try { const u = new URL(v); return u.protocol === "https:" && !!u.hostname; } catch { return false; }
}

const P = (inner: string, extra = "") => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.65;color:#2b2623;${extra}">${inner}</p>`;
const linkify = (escaped: string) => escaped.replace(/https:\/\/[^\s<]+/g, (u) => { const clean = u.replace(/[.,;:!?)]+$/, ""); const tail = u.slice(clean.length); return `<a href="${clean}" style="color:${BURGUNDY};">${clean}</a>${tail}`; });

function blockHtml(b: Block): string {
  switch (b.type) {
    case "p": return P(esc(b.text));
    case "verbatim": return b.text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((para) => P(linkify(esc(para)).replace(/\n/g, "<br>"))).join("\n");
    case "cta":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 10px;"><tr><td bgcolor="${BURGUNDY}" style="background:${BURGUNDY};"><a href="${b.url}" style="display:inline-block;padding:16px 32px;font-family:${SANS};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">${esc(b.label)}</a></td></tr></table>
<p style="margin:0 0 24px;font-family:${SANS};font-size:12px;line-height:1.6;color:#7a726b;">Button not working? Copy this link into your browser:<br><a href="${b.url}" style="color:${BURGUNDY};word-break:break-all;">${b.url}</a></p>`;
    case "link": return P(`${esc(b.before)}<a href="${b.url}" style="color:${BURGUNDY};">${esc(b.label)}</a>${esc(b.after ?? "")}`);
    case "rows":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${b.rows.map(([k, v]) => `<tr><td valign="top" style="padding:6px 12px 6px 0;font-family:${SANS};font-size:13px;color:#7a726b;width:90px;">${esc(k)}</td><td valign="top" style="padding:6px 0;font-family:${SANS};font-size:15px;line-height:1.5;color:#1a1816;">${linkify(esc(v)).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;
  }
}

function blockText(b: Block): string[] {
  switch (b.type) {
    case "p": case "verbatim": return [b.text, ""];
    case "cta": return [`${b.label}: ${b.url}`, ""];
    case "link": return [`${b.before}${b.label}: ${b.url}${b.after ?? ""}`, ""];
    case "rows": return [...b.rows.map(([k, v]) => `${k}: ${v}`), ""];
  }
}

export function renderEmail(input: ShellInput): { html: string; text: string; links: string[] } {
  const base = appBaseUrl();
  const host = base.replace(/^https?:\/\//, "");
  const customer = input.kind === "customer";
  const eyebrow = input.eyebrow ?? "The Modern Business Architect";
  const addr = mailingAddressLines();
  const f = input.footer ?? {};

  const footerHtml = !customer ? "" : `<tr><td style="padding:20px 32px 28px;border-top:1px solid #e8e1da;"><p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.8;color:#7a726b;">${[
    f.privacyUrl ? `<a href="${f.privacyUrl}" style="color:${BURGUNDY};">Privacy</a>` : "",
    f.unsubscribeUrl ? `<a href="${f.unsubscribeUrl}" style="color:${BURGUNDY};">${esc(f.unsubscribeLabel ?? "Unsubscribe")}</a>` : "",
  ].filter(Boolean).join(" · ")}${f.privacyUrl || f.unsubscribeUrl ? "<br>" : ""}Sent by Martin Dubreuil · The Modern Business Architect · <a href="${base}" style="color:#7a726b;">${esc(host)}</a><br>${addr.length ? `${addr.map(esc).join("<br>")}<br>` : ""}${f.reason ? esc(f.reason) : ""}</p></td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><title>${esc(input.heading)}</title></head>
<body style="margin:0;padding:0;background:#f6f2ec;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(input.preview)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f2ec;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fffdf9;border:1px solid #e8e1da;">
<tr><td style="padding:36px 32px 8px;">
<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BURGUNDY};font-weight:bold;">${esc(eyebrow)}</p>
<h1 style="margin:0 0 8px;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:normal;color:#1a1816;">${esc(input.heading)}</h1>
<div style="width:48px;border-top:2px solid ${BURGUNDY};margin:16px 0 0;font-size:0;line-height:0;">&nbsp;</div>
</td></tr>
<tr><td style="padding:20px 32px 12px;">
${input.blocks.map(blockHtml).join("\n")}
</td></tr>
${input.signature ? `<tr><td style="padding:4px 32px 28px;"><p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.5;color:#1a1816;"><strong>Martin Dubreuil</strong><br>The Modern Business Architect</p></td></tr>` : ""}
${footerHtml}
</table></td></tr></table>
</body></html>`;

  const text = [
    input.preview, "",
    eyebrow.toUpperCase(), input.heading, "",
    ...input.blocks.flatMap(blockText),
    ...(input.signature ? ["Martin Dubreuil", "The Modern Business Architect", ""] : []),
    ...(customer ? [
      "--",
      ...(f.privacyUrl ? [`Privacy: ${f.privacyUrl}`] : []),
      ...(f.unsubscribeUrl ? [`${f.unsubscribeLabel ?? "Unsubscribe"}: ${f.unsubscribeUrl}`] : []),
      `Sent by Martin Dubreuil, The Modern Business Architect (${base})`,
      ...addr,
      ...(f.reason ? [f.reason] : []),
    ] : []),
  ].join("\n");

  const links = [...html.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  return { html, text, links };
}
