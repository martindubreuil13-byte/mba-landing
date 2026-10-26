import { describe, expect, it } from "vitest";
import { browserFamily, classifySource, deviceCategory, isAutomatedUserAgent } from "./classify";

const own = ["modernbusinessarchitect.com"];
const c = (referrer: string | null, utm: Partial<{ s: string; m: string; c: string }> = {}) =>
  classifySource({ referrer, utmSource: utm.s, utmMedium: utm.m, utmCampaign: utm.c, ownHosts: own });

describe("classifySource", () => {
  it("treats no evidence as direct/unknown, never as AI", () => {
    expect(c(null)).toMatchObject({ category: "direct", aiPlatform: null, evidence: null });
  });
  it("ignores own-site referrers", () => {
    expect(c("https://www.modernbusinessarchitect.com/work").category).toBe("direct");
  });
  it.each([
    ["https://chatgpt.com/", "ChatGPT"],
    ["https://claude.ai/chat/abc", "Claude"],
    ["https://www.perplexity.ai/search", "Perplexity"],
    ["https://gemini.google.com/app", "Gemini"],
    ["https://copilot.microsoft.com/", "Microsoft Copilot"],
  ])("detects AI referrer %s", (ref, platform) => {
    const r = c(ref);
    expect(r.category).toBe("ai_assistant");
    expect(r.aiPlatform).toBe(platform);
    expect(r.evidence).toMatch(/^referrer:/);
  });
  it("detects AI by utm_source (ChatGPT adds utm_source=chatgpt.com) and records the evidence", () => {
    expect(c(null, { s: "chatgpt.com" })).toMatchObject({ category: "ai_assistant", aiPlatform: "ChatGPT", evidence: "utm_source:chatgpt.com" });
    expect(c(null, { s: "claude" })).toMatchObject({ category: "ai_assistant", aiPlatform: "Claude" });
  });
  it("does not mistake Google search for Gemini", () => {
    expect(c("https://www.google.com/").category).toBe("google_organic");
    expect(c("https://www.google.ca/").category).toBe("google_organic");
  });
  it("classifies other search, social and referral sources", () => {
    expect(c("https://duckduckgo.com/").category).toBe("other_organic");
    expect(c("https://www.linkedin.com/feed/").category).toBe("linkedin");
    expect(c("https://lnkd.in/x").category).toBe("linkedin");
    expect(c("https://l.facebook.com/l.php").category).toBe("facebook");
    expect(c("https://l.instagram.com/").category).toBe("instagram");
    expect(c("https://martin.substack.com/p/x").category).toBe("substack");
    expect(c("https://www.reddit.com/r/x").category).toBe("other_social");
    expect(c("https://example.org/post")).toMatchObject({ category: "other_referral", detail: "example.org" });
  });
  it("UTM naming a platform wins over a missing referrer; other UTMs are campaign traffic", () => {
    expect(c(null, { s: "linkedin", m: "social" }).category).toBe("linkedin");
    expect(c(null, { s: "newsletter", m: "email", c: "oct" })).toMatchObject({ category: "campaign", detail: "newsletter" });
    expect(c("https://www.google.com/", { m: "cpc", c: "x" }).category).toBe("campaign");
  });
  it("rejects malformed referrers safely", () => {
    expect(c("not a url").category).toBe("direct");
  });
  it("supports a revised AI domain list", () => {
    const r = classifySource({ referrer: "https://newai.example/chat" }, [{ domain: "newai.example", platform: "NewAI" }]);
    expect(r.aiPlatform).toBe("NewAI");
  });
});

describe("device / browser / automation", () => {
  it("categorises devices", () => {
    expect(deviceCategory("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari")).toBe("mobile");
    expect(deviceCategory("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceCategory("Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120")).toBe("desktop");
  });
  it("identifies browser families", () => {
    expect(browserFamily("Mozilla/5.0 Chrome/120 Safari/537 Edg/120")).toBe("Edge");
    expect(browserFamily("Mozilla/5.0 Chrome/120 Safari/537")).toBe("Chrome");
    expect(browserFamily("Mozilla/5.0 Version/17 Safari/605")).toBe("Safari");
    expect(browserFamily("Mozilla/5.0 Firefox/120")).toBe("Firefox");
  });
  it("flags automation and AI crawlers, not browsers", () => {
    for (const ua of [null, "", "GPTBot/1.1", "Mozilla/5.0 (compatible; ClaudeBot/1.0)", "HeadlessChrome/120", "curl/8", "PerplexityBot/1.0", "Lighthouse"]) {
      expect(isAutomatedUserAgent(ua)).toBe(true);
    }
    expect(isAutomatedUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15")).toBe(false);
  });
});
