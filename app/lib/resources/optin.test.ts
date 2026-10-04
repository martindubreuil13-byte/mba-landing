import { describe, expect, it } from "vitest";
import { isMarketingChoice, OPTIN_VERSION, optinCopy, optinEvidenceText, resourceNoun, validateOptinFields } from "./optin";

describe("resource opt-in copy", () => {
  it("uses the exact approved wording for a guide", () => {
    const copy = optinCopy("Guide");
    expect(copy.explanation).toBe(
      "Get the guide and join my shortlist for occasional ideas on building, testing and architecting businesses. Unsubscribe anytime."
    );
    expect(copy.primaryLabel).toBe("GET THE GUIDE + KEEP ME ON THE SHORTLIST");
    expect(copy.secondaryLabel).toBe("JUST SEND ME THE GUIDE");
  });

  it("names the resource from the existing resource type, falling back to 'resource'", () => {
    expect(resourceNoun("Checklist")).toBe("checklist");
    expect(resourceNoun("Field Guide")).toBe("field guide");
    expect(resourceNoun("Other")).toBe("resource");
    expect(resourceNoun(undefined)).toBe("resource");
    expect(optinCopy("Checklist").secondaryLabel).toBe("JUST SEND ME THE CHECKLIST");
  });

  it("stores the wording that was shown, including both choices", () => {
    const text = optinEvidenceText("Guide");
    expect(text).toContain("Get the guide and join my shortlist");
    expect(text).toContain("GET THE GUIDE + KEEP ME ON THE SHORTLIST");
    expect(text).toContain("JUST SEND ME THE GUIDE");
    expect(OPTIN_VERSION).toBe("resource_optin_v2");
  });

  it("accepts only the two explicit choices", () => {
    expect(isMarketingChoice("join")).toBe(true);
    expect(isMarketingChoice("resource_only")).toBe(true);
    expect(isMarketingChoice(true)).toBe(false);
    expect(isMarketingChoice(undefined)).toBe(false);
    expect(isMarketingChoice("")).toBe(false);
  });
});

describe("validateOptinFields", () => {
  it("requires a first name and rejects whitespace-only", () => {
    const r = validateOptinFields({ firstName: "   ", email: "a@b.co" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.firstName).toBe("Please enter your first name.");
  });

  it("requires a valid email with a human message", () => {
    for (const email of ["", "nope", "a@b", "a b@c.com"]) {
      const r = validateOptinFields({ firstName: "Ana", email });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.email).toBe("Please enter a valid email address.");
    }
  });

  it("reports both problems at once", () => {
    const r = validateOptinFields({ firstName: "", email: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "firstName"]);
  });

  it("trims and normalizes, and allows international names", () => {
    const r = validateOptinFields({ firstName: "  Zoë   Marie-Ève ", email: " Ana@Example.COM " });
    expect(r).toEqual({ ok: true, firstName: "Zoë Marie-Ève", email: "ana@example.com" });
    const jp = validateOptinFields({ firstName: "太郎", email: "t@example.jp" });
    expect(jp.ok).toBe(true);
    const ap = validateOptinFields({ firstName: "O'Brien", email: "o@example.ie" });
    expect(ap.ok).toBe(true);
  });
});
