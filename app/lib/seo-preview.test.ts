import { afterEach, describe, expect, it, vi } from "vitest";
import { createPageMetadata } from "./seo";
import { NOINDEX_DIRECTIVE } from "./deployment";

afterEach(() => vi.unstubAllEnvs());

describe("robots metadata outside production", () => {
  it("is noindex, nofollow in preview even when the page asks to be indexed", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const md = createPageMetadata({ title: "t", description: "d", path: "/x", index: true });
    expect(md.robots).toEqual({ index: false, follow: false });
    expect(NOINDEX_DIRECTIVE).toBe("noindex, nofollow");
  });
  it("is noindex when only NODE_ENV=production says so (fail closed)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("APP_ENV", "");
    expect(createPageMetadata({ title: "t", description: "d", path: "/x" }).robots).toEqual({ index: false, follow: false });
  });
  it("is unchanged in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(createPageMetadata({ title: "t", description: "d", path: "/x" }).robots).toEqual({ index: true, follow: true });
    expect(createPageMetadata({ title: "t", description: "d", path: "/x", index: false }).robots).toEqual({ index: false, follow: true });
  });
});
