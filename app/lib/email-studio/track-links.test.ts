import { afterEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn().mockResolvedValue({ error: null });
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ from: () => ({ insert }) }) }));

import { trackCampaignLinks } from "./track-links";

const html = '<p><a href="https://modernbusinessarchitect.com/thinking">Read</a> <a href="mailto:x@example.com">Mail</a></p>';

describe("trackCampaignLinks origin", () => {
  afterEach(() => { vi.unstubAllEnvs(); insert.mockClear(); });

  it("production emits exactly the canonical click origin (unchanged from the previous hardcoded value)", async () => {
    vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("APP_BASE_URL", "");
    const out = await trackCampaignLinks("campaign-1", html);
    expect(out).toMatch(/href="https:\/\/modernbusinessarchitect\.com\/campaign\/click\/[0-9a-f-]{36}"/);
    expect(out).toContain('href="mailto:x@example.com"');
    expect(insert).toHaveBeenCalledTimes(1);
  });
  it("a preview or local environment never emits the production domain in tracked links", async () => {
    vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("VERCEL_URL", "mba-preview.vercel.app"); vi.stubEnv("APP_BASE_URL", "");
    const out = await trackCampaignLinks("campaign-1", html);
    expect(out).toContain('href="https://mba-preview.vercel.app/campaign/click/');
    expect(out).not.toContain('href="https://modernbusinessarchitect.com/campaign/click/');
  });
});
