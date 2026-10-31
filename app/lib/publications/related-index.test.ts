import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RELATED_INDEX } from "./related-index";

const APP = path.resolve(__dirname, "../..");
const read = (file: string) => fs.readFileSync(path.join(APP, file), "utf8");
const hrefs = (source: string, prefix: string) => [...source.matchAll(new RegExp(`href: "(${prefix}/[^"]+)"`, "g"))].map((m) => m[1]);

describe("related-content index", () => {
  it("every entry is a real page", () => {
    for (const entry of RELATED_INDEX) {
      const page = path.join(APP, entry.path, "page.tsx");
      const dynamicRoute = entry.kind === "service";
      expect(dynamicRoute || fs.existsSync(page), `${entry.path} has no page.tsx`).toBe(true);
    }
  });
  it("lists every Thinking article exactly as app/thinking/page.tsx does (and nothing else)", () => {
    const source = hrefs(read("thinking/page.tsx"), "/thinking").sort();
    const index = RELATED_INDEX.filter((e) => e.kind === "thinking").map((e) => e.path).sort();
    expect(index).toEqual(source);
  });
  it("lists every Answer exactly as app/answers/page.tsx does (and nothing else)", () => {
    const source = hrefs(read("answers/page.tsx"), "/answers").sort();
    const index = RELATED_INDEX.filter((e) => e.kind === "answers").map((e) => e.path).sort();
    expect(index).toEqual(source);
  });
  it("has unique paths and titles for every entry", () => {
    expect(new Set(RELATED_INDEX.map((e) => e.path)).size).toBe(RELATED_INDEX.length);
    for (const e of RELATED_INDEX) expect(e.title.length).toBeGreaterThan(0);
  });
  it("keeps the existing Architecting Intelligence article reachable and independent of any publication", () => {
    expect(RELATED_INDEX.some((e) => e.path === "/thinking/architecting-intelligence")).toBe(true);
    expect(fs.existsSync(path.join(APP, "thinking/architecting-intelligence/page.tsx"))).toBe(true);
  });
});
