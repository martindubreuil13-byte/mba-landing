import { describe, expect, it, vi } from "vitest";
const entries = vi.hoisted(() => vi.fn());
vi.mock("@/app/sitemap-data", () => ({ default: entries }));
import { GET } from "./route";

describe("sitemap response", () => {
  it("returns XML with escaped URLs and no cache so publication changes appear immediately", async () => {
    entries.mockResolvedValue([{ url: "https://site.com/publications/a?x=1&y=2", lastModified: "2026-10-29T00:00:00Z" }]);
    const r = await GET();
    expect(r.headers.get("content-type")).toContain("application/xml");
    expect(r.headers.get("cache-control")).toBe("no-store");
    const xml = await r.text();
    expect(xml).toContain("<loc>https://site.com/publications/a?x=1&amp;y=2</loc>");
    expect(xml).toContain("<lastmod>2026-10-29T00:00:00.000Z</lastmod>");
  });
  it("supports an empty sitemap outside production", async () => {
    entries.mockResolvedValue([]);
    const xml = await (await GET()).text();
    expect(xml).toContain("</urlset>");
    expect(xml).not.toContain("<url>");
  });
});
