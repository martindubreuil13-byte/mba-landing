import { describe, expect, it } from "vitest";
import { resolveRange } from "@/app/lib/intelligence/ranges";
import { reportFilters, reportHref } from "./report-links";

const now = new Date("2026-11-16T11:00:00Z");
const path = "/admin/intelligence/journeys";

describe("Website Intelligence navigation", () => {
  it("preserves a custom inclusive period and repeated filters across tabs", () => {
    const params = { from: "2026-11-01", to: "2026-11-08", range: "90d", q: "A&B", source: ["ai", "direct"], page: "2" };
    const range = resolveRange(params, now);
    const query = new URL(reportHref(path, params, range), "https://example.test").searchParams;
    expect(query.get("from")).toBe("2026-11-01");
    expect(query.get("to")).toBe("2026-11-08");
    expect(query.has("range")).toBe(false);
    expect(query.get("q")).toBe("A&B");
    expect(query.getAll("source")).toEqual(["ai", "direct"]);
    expect(query.get("page")).toBe("2");
  });

  it("keeps the selected preset and drops obsolete dates when choosing a new one", () => {
    const range = resolveRange({ range: "yesterday" }, now);
    expect(reportHref(path, { device: "mobile" }, range)).toBe(`${path}?device=mobile&range=yesterday`);
    expect(reportHref(path, { device: "mobile", from: "2026-11-01", to: "2026-11-08" }, "7d"))
      .toBe(`${path}?device=mobile&range=7d`);
  });

  it("keeps filters for the custom date form without carrying conflicting date inputs", () => {
    expect([...reportFilters({ range: "today", from: "2026-11-16", to: "2026-11-16", outcome: "converted", missing: undefined })])
      .toEqual([["outcome", "converted"]]);
  });
});
