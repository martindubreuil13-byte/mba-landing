import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildStandardDeliveryEmail } from "./standard-delivery-email";

const URL = "https://modernbusinessarchitect.com/api/resources/download?token=11111111-2222-3333-4444-555555555555";
const base = { downloadUrl: URL, privacyUrl: "https://modernbusinessarchitect.com/privacy" };

describe("standard resource delivery email", () => {
  it("renders the branded layout with name, title, description, CTA and the unchanged download link", () => {
    const { subject, html, text } = buildStandardDeliveryEmail({
      ...base,
      firstName: "Martin",
      resource: { title: "The Second Act", short_description: "A guide for people ready to build the next chapter.", resource_type: "Guide" },
    });
    expect(subject).toBe("Your guide: The Second Act");
    expect(html).toContain("The Modern Business Architect"); // brand eyebrow from the shared layout
    expect(html).toContain("Your guide is ready.");
    expect(html).toContain("Hi Martin,");
    expect(html).toContain("Here&#039;s your copy of:".replace("&#039;", "'"));
    expect(html).toContain("The Second Act");
    expect(html).toContain("A guide for people ready to build the next chapter.");
    expect(html).toContain("DOWNLOAD THE GUIDE");
    expect(html).toContain("Keep this email. You can use the button above to access your copy.");
    expect(html).toContain("Martin Dubreuil");
    expect(html).toContain("modernbusinessarchitect.com");
    expect(html).toContain("#6b1f1f"); // shared burgundy accent
    expect(html).toContain(`href="${URL}"`); // exact link, used by the button and the fallback line
    expect(html).toContain("You received this one-off email because you requested The Second Act from The Modern Business Architect.");
    expect(html).toContain("/privacy");
    // email-client safe: tables + inline styles, no scripts or external resources
    expect(html).toContain('role="presentation"');
    expect(html).not.toMatch(/<script|<link|@import|url\(/i);
    expect(html).toContain("max-width:600px");

    expect(text).toContain("Hi Martin,");
    expect(text).toContain("Here's your copy of:");
    expect(text).toContain("The Second Act");
    expect(text).toContain(`DOWNLOAD THE GUIDE: ${URL}`);
    expect(text).toContain("Keep this email. You can use the link above to access your copy.");
    expect(text).not.toContain("button above");
    expect(text).toContain("Martin Dubreuil");
    expect(text).toContain("The Modern Business Architect");
    expect(text).not.toContain("<");
  });

  it("names the resource and the button from the resource type", () => {
    const cases: Array<[string, string, string]> = [
      ["Checklist", "DOWNLOAD THE CHECKLIST", "Your checklist: X"],
      ["Report", "DOWNLOAD THE REPORT", "Your report: X"],
      ["Worksheet", "DOWNLOAD THE WORKSHEET", "Your worksheet: X"],
      ["Template", "DOWNLOAD THE TEMPLATE", "Your template: X"],
      ["Field Guide", "DOWNLOAD THE FIELD GUIDE", "Your field guide: X"],
      ["Tool", "ACCESS THE TOOL", "Your tool: X"],
      ["Other", "DOWNLOAD THE RESOURCE", "Your resource: X"],
    ];
    for (const [type, label, subject] of cases) {
      const r = buildStandardDeliveryEmail({ ...base, firstName: "Ana", resource: { title: "X", resource_type: type } });
      expect(r.html).toContain(label);
      expect(r.subject).toBe(subject);
    }
  });

  it("falls back safely for a missing first name and a missing description", () => {
    const r = buildStandardDeliveryEmail({ ...base, firstName: "  ", resource: { title: "X", short_description: null, resource_type: "Guide" } });
    expect(r.html).toContain("Hi there,");
    expect(r.html).not.toContain("undefined");
    expect(r.html).not.toContain("null");
  });

  it("escapes HTML in names, titles and descriptions and strips link markup from descriptions", () => {
    const r = buildStandardDeliveryEmail({
      ...base,
      firstName: `<b>Eve</b>`,
      resource: { title: `A & B <script>`, short_description: "Read [the thinking](/thinking/x) first.", resource_type: "Guide" },
    });
    expect(r.html).not.toContain("<b>Eve</b>");
    expect(r.html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
    expect(r.html).toContain("A &amp; B &lt;script&gt;");
    expect(r.html).toContain("Read the thinking first.");
    expect(r.html).not.toContain("](/thinking");
  });

  it("shows an unsubscribe link only for a currently subscribed recipient", () => {
    const oneOff = buildStandardDeliveryEmail({ ...base, firstName: "Ana", resource: { title: "X", resource_type: "Guide" } });
    expect(oneOff.html).not.toMatch(/unsubscribe/i);
    expect(oneOff.text).not.toMatch(/unsubscribe/i);

    const subscribed = buildStandardDeliveryEmail({ ...base, firstName: "Ana", unsubscribeUrl: "https://x.test/unsubscribe?token=t", resource: { title: "X", resource_type: "Guide" } });
    expect(subscribed.html).toContain('href="https://x.test/unsubscribe?token=t"');
    expect(subscribed.text).toContain("Unsubscribe: https://x.test/unsubscribe?token=t");
    expect(subscribed.html).toContain("are subscribed to emails from The Modern Business Architect");
  });

  it("adds no marketing copy", () => {
    const r = buildStandardDeliveryEmail({ ...base, firstName: "Ana", unsubscribeUrl: "https://x.test/u", resource: { title: "X", resource_type: "Guide" } });
    for (const word of ["shortlist", "newsletter", "offer", "join my", "sign up"]) expect(r.html.toLowerCase()).not.toContain(word);
  });
});
