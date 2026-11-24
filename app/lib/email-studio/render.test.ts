import { expect, it } from "vitest";
import { renderEmailBody, safeLink, renderOutreachEmail, renderNewsletterEmail } from "./render";

it("escapes text, rejects active URLs and drops embeds and unknown styles", () => {
  const html = renderEmailBody([
    { insert: "<img src=x onerror=alert(1)>", attributes: { link: "javascript:alert(1)", color: "red;display:none" } },
    { insert: { image: "https://example.com/pixel" } },
    { insert: "\n" },
  ]);
  expect(html).toContain("&lt;img");
  expect(html).not.toMatch(/<img|href=|display:none|example.com/);
  expect(safeLink("java\tscript:alert(1)")).toBeNull();
});

it("renders styled, aligned headings and switches between lists", () => {
  const html = renderEmailBody([
    { insert: "Heading", attributes: { bold: true, font: "georgia", color: "#6b1f1f", size: "24px" } },
    { insert: "\n", attributes: { header: 1, align: "center" } },
    { insert: "Bullet\n", attributes: { list: "bullet" } },
    { insert: "Number\n", attributes: { list: "ordered" } },
    { insert: "Link", attributes: { link: "https://example.com/", italic: true, underline: true } },
    { insert: "\n" },
  ]);
  expect(html).toContain("text-align:center");
  expect(html).toContain("font-size:24px");
  expect(html).toMatch(/<ul.*<li.*Bullet.*<\/ul><ol.*Number.*<\/ol>/);
  expect(html).toContain('<u><em>Link</em></u>');
  expect(html).toContain('href="https://example.com/"');
});

it("renders only uploaded images and safe HTTPS buttons in a mixed newsletter", () => {
  const url = "https://sbntzyivfhvogxiiysuh.supabase.co/storage/v1/object/public/resource-covers/newsletter/11111111-1111-4111-8111-111111111111.png";
  const html = renderEmailBody([
    { insert: "Hello", attributes: { bold: true } }, { insert: "\n" },
    { insert: { newsletterBlock: { kind: "image", url, text: 'A "sample"', align: "right", variant: "small" } } },
    { insert: { newsletterBlock: { kind: "image", url: url.replace("supabase.co", "attacker.invalid") } } },
    { insert: { newsletterBlock: { kind: "button", url: "javascript:alert(1)", text: "Unsafe" } } },
    { insert: { newsletterBlock: { kind: "button", url: "http://example.com", text: "Insecure" } } },
    { insert: { newsletterBlock: { kind: "button", url: "https://example.com", text: "Read <more>", variant: "secondary" } } },
  ], new URL(url).origin);
  expect(html).toContain("<strong>Hello</strong>");
  expect(html).toContain('alt="A &quot;sample&quot;" width="180"');
  expect(html).toContain('align="right"');
  expect(html).toContain("Read &lt;more&gt;");
  expect(html).toContain('bgcolor="#fffaf5"');
  expect(html).not.toMatch(/Unsafe|Insecure|attacker|javascript/);
});

it("renders personal outreach without a branded frame or repeated subject, preserving the opt-out", () => {
  const body = "<p>Hi Ada,</p><p>Could we talk?</p><p>Martin</p>";
  const html = renderOutreachEmail("A question", body, { previewText: "A short question", unsubscribeUrl: "https://example.com/unsubscribe?x=1&y=2" });
  expect(html).toContain(body);
  expect(html).toContain("A short question");
  expect(html).toContain('href="https://example.com/unsubscribe?x=1&amp;y=2"');
  expect(html).not.toMatch(/<table|<h1|The Modern Business Architect|border:|background:/);
  expect(html).not.toContain("A question");
  expect(renderNewsletterEmail("A question", body)).toContain("The Modern Business Architect");
});
