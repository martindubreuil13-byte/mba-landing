import { z } from "zod";
import { colors, fonts, normalizeBlock, renderEmailBody, renderNewsletterEmail, safeLink, sizes } from "./render";

const attributes = z.strictObject({
  bold: z.literal(true).optional(), italic: z.literal(true).optional(), underline: z.literal(true).optional(),
  header: z.union([z.literal(1), z.literal(2)]).optional(), list: z.enum(["bullet", "ordered"]).optional(),
  align: z.enum(["center", "right", "justify"]).optional(),
  link: z.string().max(2048).refine(safeLink).optional(),
  size: z.string().refine((size) => sizes.includes(size)).optional(),
  color: z.string().refine((color) => colors.includes(color)).optional(),
  font: z.string().refine((font) => Object.hasOwn(fonts, font)).optional(),
});
const request = z.strictObject({
  recipient: z.string().trim().max(254).email(),
  subject: z.string().trim().min(1).max(180).refine((value) => !/[\r\n]/.test(value)),
  confirmed: z.literal(true),
  operations: z.array(z.union([
    z.strictObject({ insert: z.string().max(50_000), attributes: attributes.optional() }),
    z.strictObject({ insert: z.strictObject({ newsletterBlock: z.strictObject({
      kind: z.enum(["image", "button"]), url: z.string().max(2048), text: z.string().max(200),
      align: z.enum(["left", "center", "right"]), variant: z.enum(["small", "medium", "full", "primary", "secondary"]),
    }) }) }),
  ])).min(1).max(1500),
});

export function prepareTestMessage(value: unknown, storageOrigin: string) {
  const parsed = request.safeParse(value);
  if (!parsed.success) return null;
  const { recipient, subject, operations } = parsed.data;
  const plain: string[] = [];
  for (const { insert } of operations) {
    if (typeof insert === "string") { plain.push(insert); continue; }
    const block = normalizeBlock(insert.newsletterBlock, storageOrigin);
    if (!block || !block.url.startsWith("https://")) return null;
    plain.push(block.kind === "image" ? "\n[Image: " + (block.text || "Newsletter image") + "]\n" : "\n" + block.text + ": " + block.url + "\n");
  }
  const text = plain.join("").trim();
  if (!text) return null;
  return { recipient, subject: "[TEST] " + subject, html: renderNewsletterEmail(subject, renderEmailBody(operations, storageOrigin)), text: subject + "\n\n" + text };
}
