import { expect, it } from "vitest";
import { prepareCampaign, prepareTestMessage, validateCampaign } from "./test-message";
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

it("accepts every Quill heading, including the four Heading 3 sections in the reported draft", () => {
  const operations = ["Start with three simple filters.", "Now, put it together.", "One last thing. Test it.", "Thinking about starting something of your own?"]
    .flatMap((insert) => [{ insert }, { insert: "\n", attributes: { header: 3 } }]);
  const campaign = { subject: "Thinking About Starting a Business? Don't Make This Mistake.", previewText: "", ids: ["11111111-1111-4111-8111-111111111111"], operations };
  expect(prepareCampaign(campaign, origin)?.body.match(/<h3 /g)).toHaveLength(4);
  for (const header of [1, 2, 3, 4, 5, 6]) {
    const operations = [{ insert: "Heading" }, { insert: "\n", attributes: { header } }];
    expect(prepareCampaign({ ...campaign, operations }, origin)?.body).toContain(`<h${header} `);
    expect(prepareTestMessage({ ...draft, operations }, origin)).not.toBeNull();
  }
  for (const header of [0, 7, 1.5, "3", "<script>"]) {
    expect(prepareCampaign({ ...campaign, operations: [{ insert: "Bad\n", attributes: { header } }] }, origin)).toBeNull();
  }
});

it("identifies invalid fields instead of claiming filled fields and contact selection are missing", () => {
  const campaign = { subject: "News", previewText: "", ids: ["11111111-1111-4111-8111-111111111111"], operations: [{ insert: "News\n" }] };
  expect(validateCampaign({ ...campaign, subject: "" }, origin)).toMatchObject({ success: false, error: expect.stringContaining("subject") });
  expect(validateCampaign({ ...campaign, ids: [] }, origin)).toMatchObject({ success: false, error: expect.stringContaining("contact") });
  expect(validateCampaign({ ...campaign, operations: [{ insert: "Text", attributes: { link: "javascript:alert(1)" } }] }, origin)).toMatchObject({ success: false, error: expect.stringContaining("formatting or an invalid link") });
  expect(validateCampaign({ ...campaign, operations: [{ insert: "\n" }] }, origin)).toMatchObject({ success: false, error: expect.stringContaining("Write a message") });
});
