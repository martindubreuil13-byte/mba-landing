import { exceptionEvidence } from "./campaign";
import { z } from "zod";
import { colors, fonts, normalizeBlock, renderEmailBody, renderNewsletterEmail, safeLink, sizes } from "./render";

const attributes = z.strictObject({
  bold: z.literal(true).optional(), italic: z.literal(true).optional(), underline: z.literal(true).optional(),
  header: z.number().int().min(1).max(6).optional(), list: z.enum(["bullet", "ordered"]).optional(),
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
const campaignRequest = content.extend({ previewText: z.string().trim().max(160).refine((value) => !/[\r\n]/.test(value)), ids: z.array(z.uuid()).min(1), exceptions: z.array(exceptionEvidence.extend({ id: z.uuid(), email: z.email().max(254) })).default([]) });

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

export function validateCampaign(value: unknown, storageOrigin: string) {
  const parsed = campaignRequest.safeParse(value);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error = field === "subject" ? "Enter a subject of 1–180 characters on one line."
      : field === "previewText" ? "Preview text must be at most 160 characters on one line."
      : field === "ids" ? "Select at least one valid contact."
      : field === "exceptions" ? "Review the permission evidence for the selected exceptions."
      : "The message contains unsupported formatting or an invalid link. Clear the pasted formatting and try again.";
    return { success: false as const, error };
  }
  const message = prepareContent(parsed.data, storageOrigin);
  if (!message) return { success: false as const, error: "Write a message and check any image or button links before reviewing." };
  return { success: true as const, message: { ...message, operations: parsed.data.operations, previewText: parsed.data.previewText, ids: [...new Set(parsed.data.ids)], exceptions: parsed.data.exceptions } };
}

export function prepareCampaign(value: unknown, storageOrigin: string) {
  const result = validateCampaign(value, storageOrigin);
  return result.success ? result.message : null;
}
