import { exceptionEvidence } from "./campaign";
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
const content = z.strictObject({
  subject: z.string().trim().min(1).max(180).refine((value) => !/[\r\n]/.test(value)),
  operations: z.array(z.union([
    z.strictObject({ insert: z.string().max(50_000), attributes: attributes.optional() }),
    z.strictObject({ insert: z.strictObject({ newsletterBlock: z.strictObject({
      kind: z.enum(["image", "button"]), url: z.string().max(2048), text: z.string().max(200),
      align: z.enum(["left", "center", "right"]), variant: z.enum(["small", "medium", "full", "primary", "secondary"]),
    }) }) }),
  ])).min(1).max(1500),
});

const testRequest = content.extend({ recipient: z.string().trim().max(254).email(), confirmed: z.literal(true) });
const campaignRequest = content.extend({ previewText: z.string().trim().max(160).refine((value) => !/[\r\n]/.test(value)), ids: z.array(z.uuid()).min(1).max(1000), exceptions: z.array(exceptionEvidence.extend({ id: z.uuid(), email: z.email().max(254) })).max(25).default([]) });

function prepareContent({ subject, operations }: z.infer<typeof content>, storageOrigin: string) {
  const plain: string[] = [];
  for (const { insert } of operations) {
    if (typeof insert === "string") { plain.push(insert); continue; }
    const block = normalizeBlock(insert.newsletterBlock, storageOrigin);
    if (!block || !block.url.startsWith("https://")) return null;
    plain.push(block.kind === "image" ? "\n[Image: " + (block.text || "Newsletter image") + "]\n" : "\n" + block.text + ": " + block.url + "\n");
  }
  const text = plain.join("").trim();
  if (!text) return null;
  return { subject, body: renderEmailBody(operations, storageOrigin), text: subject + "\n\n" + text };
}

export function prepareTestMessage(value: unknown, storageOrigin: string) {
  const parsed = testRequest.safeParse(value);
  if (!parsed.success) return null;
  const message = prepareContent(parsed.data, storageOrigin);
  return message && { recipient: parsed.data.recipient, subject: "[TEST] " + message.subject, html: renderNewsletterEmail(message.subject, message.body), text: message.text };
}

export function prepareCampaign(value: unknown, storageOrigin: string) {
  const parsed = campaignRequest.safeParse(value);
  if (!parsed.success) return null;
  const message = prepareContent(parsed.data, storageOrigin);
  return message && { ...message, operations: parsed.data.operations, previewText: parsed.data.previewText, ids: [...new Set(parsed.data.ids)], exceptions: parsed.data.exceptions };
}
