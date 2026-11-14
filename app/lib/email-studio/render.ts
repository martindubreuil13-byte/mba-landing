export const fonts = {
  arial: "Arial, Helvetica, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  verdana: "Verdana, Geneva, sans-serif",
  courier: "'Courier New', monospace",
} as const;
export const sizes = ["12px", "16px", "20px", "24px", "32px"];
export const colors = ["#27211d", "#6b1f1f", "#315644", "#25466d", "#655951"];

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

export function renderEmailBody(operations: Operation[]) {
  let html = "";
  let line = "";
  let list: "ul" | "ol" | null = null;
  for (const { insert, attributes = {} } of operations) {
    if (typeof insert !== "string") continue;
    const parts = insert.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) {
        const next = attributes.list === "bullet" ? "ul" : attributes.list === "ordered" ? "ol" : null;
        if (list !== next) {
          if (list) html += "</" + list + ">";
          if (next) html += '<' + next + ' style="margin:0 0 16px;padding-left:26px">';
          list = next;
        }
        const tag = next ? "li" : attributes.header === 1 ? "h1" : attributes.header === 2 ? "h2" : "p";
        const align = ["center", "right", "justify"].some((value) => value === attributes.align) ? attributes.align : "left";
        const typography = tag === "h1" ? "font-family:Georgia,serif;font-size:28px;line-height:1.25;" :
          tag === "h2" ? "font-family:Georgia,serif;font-size:22px;line-height:1.3;" : "";
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
