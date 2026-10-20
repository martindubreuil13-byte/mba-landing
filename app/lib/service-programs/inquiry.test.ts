import { describe, expect, it } from "vitest";
import { escapeHtml, normalizeAttribution, programLabel, resolveProgram } from "./inquiry";

describe("program inquiries", () => {
  it("resolves only catalog programs", () => {
    expect(resolveProgram("pre-architecture")?.number).toBe("03");
    expect(resolveProgram({ slug: "business-evolution" })?.number).toBe("07");
    expect(resolveProgram("<script>")).toBeUndefined();
    expect(resolveProgram(undefined)).toBeUndefined();
  });
  it("labels with catalog price, never client text", () => {
    expect(programLabel(resolveProgram("business-activation")!)).toBe("Program 06: Business Activation (By proposal)");
    expect(programLabel(resolveProgram("pre-architecture")!)).toContain("US$1,999");
  });
  it("escapes HTML", () => {
    expect(escapeHtml(`<img src=x onerror="a()">&'`)).toBe("&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;");
  });
  it("keeps attribution short and drops junk", () => {
    const out = normalizeAttribution({ source: "linkedin", medium: 5, landingPage: "/work", utm: { content: "post-1" }, referrer: "x".repeat(900) });
    expect(out).toMatchObject({ source: "linkedin", utm_content: "post-1", landing_page: "/work" });
    expect(out.medium).toBeUndefined();
    expect(out.referrer).toHaveLength(300);
    expect(normalizeAttribution(null)).toEqual({});
  });
});
