import { expect, it } from "vitest";
import { prepareTestMessage } from "./test-message";
import { renderEmailBody, renderNewsletterEmail } from "./render";

const origin = "https://storage.example";
const draft = {
  recipient: "owner@example.com", subject: "November update", confirmed: true,
  operations: [{ insert: "<Hello>", attributes: { bold: true } }, { insert: "\n" },
    { insert: { newsletterBlock: { kind: "button", text: "Read", url: "https://example.com/", align: "center", variant: "primary" } } }],
};
it("rebuilds the same email as the preview and provides a text alternative", () => {
  const message = prepareTestMessage(draft, origin);
  expect(message?.subject).toBe("[TEST] November update");
  expect(message?.html).toBe(renderNewsletterEmail(draft.subject, renderEmailBody(draft.operations, origin)));
  expect(message?.html).toContain("&lt;Hello&gt;");
  expect(message?.text).toContain("Read: https://example.com/");
});
it("rejects multiple recipients, sending overrides, unconfirmed requests and unsafe links", () => {
  for (const fields of [
    { recipient: ["owner@example.com"] }, { recipient: "one@example.com,two@example.com" },
    { confirmed: false }, { from: "other@example.com" }, { bcc: "other@example.com" }, { html: "<script/>" },
    { operations: [{ insert: "Click", attributes: { link: "javascript:alert(1)" } }] },
    { operations: [{ insert: { newsletterBlock: { kind: "image", text: "", url: "https://other.example/image.png", align: "center", variant: "full" } } }] },
  ]) expect(prepareTestMessage({ ...draft, ...fields }, origin)).toBeNull();
});
