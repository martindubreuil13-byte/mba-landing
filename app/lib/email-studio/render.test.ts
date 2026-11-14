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
