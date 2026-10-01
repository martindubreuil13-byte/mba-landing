import { describe, expect, it } from "vitest";
import { getResourceConfig } from "../config";
import { buildTheBridgeFirst } from "./build-the-bridge-first";

describe("Build the Bridge First content", () => {
  it("keeps the PDF's nine pages in order with stable anchors", () => {
    expect(buildTheBridgeFirst.sections.map((s) => s.id)).toEqual(Array.from({ length: 9 }, (_, i) => `page-${i + 1}`));
    expect(buildTheBridgeFirst.sections.map((s) => s.page)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it("places the mid-guide CTA after a real exercise page", () => {
    const config = getResourceConfig("build-the-bridge-first")!;
    const section = buildTheBridgeFirst.sections.find((s) => s.id === config.midCtaAfterSectionId);
    expect(section?.kind).toBe("standard");
  });
  it("does not carry the PDF's doubled-word typos", () => {
    const json = JSON.stringify(buildTheBridgeFirst);
    expect(json).not.toContain("before before");
    expect(json).not.toContain("credible credible");
  });
});
