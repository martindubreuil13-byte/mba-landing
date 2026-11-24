export const fonts = {
  arial: "Arial, Helvetica, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  verdana: "Verdana, Geneva, sans-serif",
  courier: "'Courier New', monospace",
} as const;
export const sizes = ["12px", "16px", "20px", "24px", "32px"];
export const colors = ["#27211d", "#6b1f1f", "#315644", "#25466d", "#655951"];
export const headingSizes = { 1: 28, 2: 22, 3: 20, 4: 18, 5: 16, 6: 14 } as const;

type Operation = { insert?: unknown; attributes?: Record<string, unknown> };
const escape = (text: string) => text.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function safeLink(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function inline(text: string, attributes: Record<string, unknown>) {
  let html = escape(text);
  if (attributes.bold === true) html = "<strong>" + html + "</strong>";
  if (attributes.italic === true) html = "<em>" + html + "</em>";
  if (attributes.underline === true) html = "<u>" + html + "</u>";
  const { font, size, color } = attributes;
  const styles = [];
  if (typeof font === "string" && Object.hasOwn(fonts, font)) styles.push("font-family:" + fonts[font as keyof typeof fonts]);
  if (typeof size === "string" && sizes.includes(size)) styles.push("font-size:" + size);
  if (typeof color === "string" && colors.includes(color)) styles.push("color:" + color);
  if (styles.length) html = '<span style="' + styles.join(";") + '">' + html + "</span>";
  const href = safeLink(attributes.link);
  return href ? '<a style="color:#6b1f1f;text-decoration:underline" href="' + escape(href) + '" target="_blank" rel="noopener noreferrer">' + html + "</a>" : html;
}

export function renderEmailBody(operations: Operation[], storageOrigin?: string) {
  let html = "";
  let line = "";
  let list: "ul" | "ol" | null = null;
  for (const { insert, attributes = {} } of operations) {
    if (typeof insert !== "string") {
      if (!insert || typeof insert !== "object" || !("newsletterBlock" in insert)) continue;
      const block = renderNewsletterBlock(insert.newsletterBlock, storageOrigin);
      if (!block) continue;
      if (list) { html += "</" + list + ">"; list = null; }
      if (line) { html += '<p style="margin:0 0 16px">' + line + "</p>"; line = ""; }
      html += block;
      continue;
    }
    const parts = insert.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) {
        const next = attributes.list === "bullet" ? "ul" : attributes.list === "ordered" ? "ol" : null;
        if (list !== next) {
          if (list) html += "</" + list + ">";
          if (next) html += '<' + next + ' style="margin:0 0 16px;padding-left:26px">';
          list = next;
        }
        const heading = typeof attributes.header === "number" && Object.hasOwn(headingSizes, attributes.header)
          ? attributes.header as keyof typeof headingSizes : null;
        const tag = next ? "li" : heading ? `h${heading}` : "p";
        const align = ["center", "right", "justify"].some((value) => value === attributes.align) ? attributes.align : "left";
        const typography = !next && heading ? `font-family:Georgia,serif;font-size:${headingSizes[heading]}px;line-height:${heading === 1 ? "1.25" : "1.3"};` : "";
        html += '<' + tag + ' style="margin:0 0 ' + (next ? "6" : "16") + 'px;text-align:' + align + ';' + typography + '">' + (line || "<br>") + "</" + tag + ">";
        line = "";
      }
      if (part) line += inline(part, attributes);
    });
  }
  if (list) html += "</" + list + ">";
  if (line) html += '<p style="margin:0 0 16px">' + line + "</p>";
  return html;
}

export type NewsletterBlock = {
  kind: "image" | "button";
  url: string;
  text: string;
  align: "left" | "center" | "right";
  variant: "small" | "medium" | "full" | "primary" | "secondary";
};

export function normalizeBlock(value: unknown, storageOrigin?: string): NewsletterBlock | null {
  if (!value || typeof value !== "object") return null;
  const block = value as Partial<NewsletterBlock>;
  const url = safeLink(block.url);
  if (!url?.startsWith("https://") && !url?.startsWith("http://localhost:") && !url?.startsWith("http://127.0.0.1:")) return null;
  const address = new URL(url);
  if (address.username || address.password) return null;
  const align = block.align === "left" || block.align === "right" ? block.align : "center";
  const text = typeof block.text === "string" ? block.text.trim().slice(0, 200) : "";
  if (block.kind === "image" && address.origin === storageOrigin && /^\/storage\/v1\/object\/public\/resource-covers\/newsletter\/[a-f0-9-]{36}\.png$/.test(address.pathname) && !address.search && !address.hash) {
    return { kind: "image", url, text, align, variant: block.variant === "small" || block.variant === "medium" ? block.variant : "full" };
  }
  if (block.kind === "button" && url.startsWith("https://") && text) {
    return { kind: "button", url, text, align, variant: block.variant === "secondary" ? "secondary" : "primary" };
  }
  return null;
}

export function renderNewsletterBlock(value: unknown, storageOrigin?: string) {
  const block = normalizeBlock(value, storageOrigin);
  if (!block) return "";
  const { kind, url, text, align, variant } = block;
  const width = variant === "small" ? 180 : variant === "medium" ? 320 : 560;
  const secondary = variant === "secondary";
  const body = kind === "image"
    ? `<img src="${escape(url)}" alt="${escape(text)}" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;margin:${align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0 auto 0 0"}">`
    : `<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="${secondary ? "#fffaf5" : "#6b1f1f"}" style="border:1px solid #6b1f1f;border-radius:8px"><a href="${escape(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 22px;color:${secondary ? "#6b1f1f" : "#ffffff"};font:600 16px Arial,sans-serif;text-decoration:none">${escape(text)}</a></td></tr></table>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed"><tr><td align="${align}" style="padding:4px 0 16px;overflow-wrap:anywhere">${body}</td></tr></table>`;
}

export function renderNewsletterEmail(subject: string, body: string, options?: { previewText: string; unsubscribeUrl?: string }) {
  const preheader = options?.previewText ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escape(options.previewText)}</span>` : "";
  const footer = options?.unsubscribeUrl ? `<a style="color:#6b1f1f" href="${escape(options.unsubscribeUrl)}">Unsubscribe</a>` : options ? "Unsubscribe (personalized in delivery)" : "Email preferences";
  return `${preheader}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;margin:auto;border:1px solid #e6dcd4;background:#fff;table-layout:fixed"><tr><td style="background:#6b1f1f;padding:16px;color:#fff;font-family:Georgia,serif">The Modern Business Architect</td></tr><tr><td style="padding:20px;overflow-wrap:anywhere"><h1 style="margin:0;font:24px Georgia,serif;color:#27211d">${escape(subject || "Subject")}</h1><div style="margin-top:12px;font:16px/1.55 Arial,Helvetica,sans-serif;color:#27211d">${body || "<p>Your message appears here.</p>"}</div></td></tr><tr><td style="background:#f5f1ed;padding:16px;font:12px Arial,sans-serif;color:#655951">MBA · ${footer}</td></tr></table>`;
}

/** Personal email layout for individual outreach; newsletter branding stays in its own renderer. */
export function renderOutreachEmail(_subject: string, body: string, options?: { previewText: string; unsubscribeUrl?: string }) {
  const preheader = options?.previewText ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escape(options.previewText)}</span>` : "";
  const footer = options?.unsubscribeUrl ? `<p style="margin:24px 0 0;font:13px Arial,Helvetica,sans-serif;color:#666"><a style="color:#666" href="${escape(options.unsubscribeUrl)}">Unsubscribe</a></p>` : "";
  return `${preheader}<div style="font:16px/1.5 Arial,Helvetica,sans-serif;color:#222;overflow-wrap:anywhere">${body || "<p>Your message appears here.</p>"}${footer}</div>`;
}
