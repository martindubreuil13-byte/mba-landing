import { describe, expect, it } from "vitest";
import { categoryTotals, cleanTitle, PAGE_SIZE, queryRows, toRows } from "./content-table";
import type { ContentPage } from "./reports";

const page = (path: string, o: Partial<ContentPage> = {}): ContentPage => ({
  path, title: `${path} title | The Modern Business Architect`, views: 10, sessions: 10, landing_sessions: 5, avg_engaged_ms: 20000,
  continued_sessions: 4, assisted_leads: 0, landing_leads: 0, cta_clicks: 0, starts: 0, sources: [], ...o,
});

describe("content table", () => {
  const rows = toRows([
    page("/answers/popular", { views: 500, sessions: 400, assisted_leads: 0 }),
    page("/answers/effective", { views: 50, sessions: 40, assisted_leads: 3 }),
    page("/thinking/essay", { views: 20, sessions: 3, assisted_leads: 1 }),
    page("/work", { views: 80, sessions: 60, cta_clicks: 12 }),
    page("/resources/business-idea-reality-check", { views: 30, sessions: 25, starts: 9 }),
  ]);

  it("derives titles and categories from the real route structure", () => {
    expect(cleanTitle("What Is Business Architecture? | The Modern Business Architect", "/x")).toBe("What Is Business Architecture?");
    expect(cleanTitle("How Do I Find a Business Idea? | Martin Dubreuil", "/x")).toBe("How Do I Find a Business Idea?");
    expect(cleanTitle(null, "/answers/x")).toBe("/answers/x");
    expect(Object.fromEntries(rows.map((r) => [r.path, r.category]))).toMatchObject({
      "/answers/popular": "Answers", "/thinking/essay": "Thinking", "/work": "Services", "/resources/business-idea-reality-check": "Assessment",
    });
  });

  it("popularity is not effectiveness: sorting by leads per 100 sessions puts 50 views / 3 leads above 500 views / 0 leads", () => {
    const byViews = queryRows(rows, { sort: "views" }).rows.map((r) => r.path);
    expect(byViews[0]).toBe("/answers/popular");
    const byRate = queryRows(rows, { sort: "lead_rate" }).rows.map((r) => r.path);
    expect(byRate[0]).toBe("/answers/effective");
  });

  it("does not compute rates from tiny samples", () => {
    const essay = rows.find((r) => r.path === "/thinking/essay")!;
    expect(essay.leadsPer100).toBeNull();
    expect(essay.continueRate).toBeNull();
    expect(rows.find((r) => r.path === "/answers/effective")!.leadsPer100).toBeCloseTo(7.5);
  });

  it("filters by category and search, and falls back safely on bad params", () => {
    expect(queryRows(rows, { category: "Answers" }).total).toBe(2);
    expect(queryRows(rows, { q: "REALITY" }).rows[0].path).toBe("/resources/business-idea-reality-check");
    const r = queryRows(rows, { sort: "nope", dir: "sideways", page: "-4" });
    expect([r.sort, r.dir, r.page]).toEqual(["views", "desc", 1]);
  });

  it("paginates", () => {
    const many = toRows(Array.from({ length: PAGE_SIZE + 3 }, (_, i) => page(`/answers/p${i}`, { views: 100 - i })));
    const p2 = queryRows(many, { page: "2" });
    expect([p2.rows.length, p2.pages, p2.page]).toEqual([3, 2, 2]);
    expect(queryRows(many, { page: "99" }).page).toBe(2);
  });

  it("totals per category over all pages", () => {
    const t = categoryTotals(rows);
    expect(t.find((c) => c.category === "Answers")).toMatchObject({ pages: 2, views: 550, leads: 3 });
  });
});
