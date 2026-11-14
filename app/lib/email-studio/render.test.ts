import { expect, it } from "vitest";
import { renderEmailBody, safeLink } from "./render";

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
