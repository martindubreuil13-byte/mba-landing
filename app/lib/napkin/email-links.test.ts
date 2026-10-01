import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
import { buildNapkinBreakdownEmailText } from "./email";
import { calculateFixtureForTest } from "./email-links.fixture";

afterEach(() => vi.unstubAllEnvs());

describe("Napkin email links on a preview", () => {
  it("point at the preview, never at production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("APP_BASE_URL", "https://preview.example.test");
    const text = buildNapkinBreakdownEmailText(calculateFixtureForTest());
    expect(text).toContain("https://preview.example.test/unsubscribe/napkin?token=");
    expect(text).not.toContain("modernbusinessarchitect.com");
  });
  it("still use the canonical site in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "");
    expect(buildNapkinBreakdownEmailText(calculateFixtureForTest())).toContain("https://modernbusinessarchitect.com/unsubscribe/napkin?token=");
  });
});
