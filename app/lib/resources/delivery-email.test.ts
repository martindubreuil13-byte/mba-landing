import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
import { getResourceConfig } from "./config";
import { buildDeliveryEmail } from "./delivery-email";
import { verifyUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";

const config = getResourceConfig("build-the-bridge-first")!;
const params = { config, resource: { title: "Build The Bridge First", slug: "build-the-bridge-first" }, requestId: "11111111-1111-1111-1111-111111111111", leadId: "lead-1" };

// Link-origin expectations depend on the environment, so every test states it explicitly: production by default.
beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("APP_BASE_URL", "");
  vi.stubEnv("VERCEL_URL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.MAILING_ADDRESS;
});

describe("guide delivery email", () => {
  it("has the agreed subject, opening and a stable download link", () => {
    const { subject, html, text, links } = buildDeliveryEmail(params);
    expect(subject).toBe("Your guide: Build The Bridge First");
    expect(html).toContain("Here is your printable copy of Build the Bridge First.");
    expect(html).toContain("Download it, work through the exercises");
    expect(links.downloadUrl).toBe("https://modernbusinessarchitect.com/api/resources/download?token=11111111-1111-1111-1111-111111111111&via=email");
    expect(text).toContain(links.downloadUrl);
  });
  it("identifies the sender and carries a working unsubscribe link without any email address", () => {
    const { html, text, links } = buildDeliveryEmail(params);
    expect(html).toContain("Martin Dubreuil · The Modern Business Architect");
    expect(html).toContain("Unsubscribe");
    expect(text).toContain(links.unsubscribePage);
    const token = new URL(links.unsubscribePage).searchParams.get("token")!;
    expect(verifyUnsubscribeToken(token)).toBe("lead-1");
    expect(html).not.toMatch(/@(gmail|example)\./);
  });
  it("includes the postal address only when configured", () => {
    expect(buildDeliveryEmail(params).html).not.toContain("Rue Test");
    process.env.MAILING_ADDRESS = "1 Rue Test, Montréal QC";
    expect(buildDeliveryEmail(params).html).toContain("1 Rue Test, Montréal QC");
  });
  it("production with APP_BASE_URL set uses it (local mock servers, staging)", () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    expect(buildDeliveryEmail(params).links.downloadUrl.startsWith("http://localhost:3000/api/resources/download")).toBe(true);
  });
  it("does not claim marketing consent for a suppressed address", () => {
    const { html, text } = buildDeliveryEmail({ ...params, consent: "none" });
    expect(html).toContain("No further marketing emails will be sent");
    expect(html).not.toContain("part of the Modern Business Architect community");
    expect(html).not.toContain("confirm my email");
    expect(text).not.toContain("agreed to receive marketing");
  });
  it("asks a pending reader to confirm, with a signed expiring link, and does not call them subscribed", () => {
    const { html, text, links } = buildDeliveryEmail({ ...params, consent: "pending" });
    expect(html).toContain("Yes, confirm my email");
    expect(html).toContain("I will not email you again beyond this message");
    expect(html).not.toContain("part of the Modern Business Architect community");
    expect(html).toContain("only receive further emails");
    expect(text).toContain(links.confirmPage);
    const token = new URL(links.confirmPage).searchParams.get("token")!;
    expect(verifyConfirmationToken(token)).toEqual({ ok: true, leadId: "lead-1" });
    // The download link is still the first, primary action.
    expect(html.indexOf("Download the PDF")).toBeLessThan(html.indexOf("confirm my email"));
  });
  it("does not offer confirmation to someone who is already subscribed", () => {
    const { html } = buildDeliveryEmail({ ...params, consent: "active" });
    expect(html).not.toContain("confirm my email");
    expect(html).toContain("part of the Modern Business Architect community");
  });
});

describe("guide delivery email on a preview deployment", () => {
  const PRODUCTION_DOMAIN = "modernbusinessarchitect.com";

  function everyOperationalLink(consent: "pending" | "active" | "none") {
    const { html, text, links } = buildDeliveryEmail({ ...params, consent });
    return { html, text, links, all: Object.values(links) };
  }

  it("uses APP_BASE_URL for the download, confirmation and unsubscribe links, and never the production domain", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("APP_BASE_URL", "https://preview.example.test");
    const { html, text, links, all } = everyOperationalLink("pending");
    expect(links.downloadUrl.startsWith("https://preview.example.test/api/resources/download?token=")).toBe(true);
    expect(links.confirmPage.startsWith("https://preview.example.test/confirm?token=")).toBe(true);
    expect(links.unsubscribePage.startsWith("https://preview.example.test/unsubscribe?token=")).toBe(true);
    expect(links.unsubscribePost.startsWith("https://preview.example.test/api/unsubscribe?token=")).toBe(true);
    expect(links.privacyUrl).toBe("https://preview.example.test/privacy");
    for (const link of all) expect(link).not.toContain(PRODUCTION_DOMAIN);
    expect(html).not.toContain(PRODUCTION_DOMAIN);
    expect(text).not.toContain(PRODUCTION_DOMAIN);
  });

  it("falls back to the deployment's own VERCEL_URL when APP_BASE_URL is not set", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "mba-git-feature-abc123.vercel.app");
    const { html, text, all } = everyOperationalLink("pending");
    for (const link of all) expect(link.startsWith("https://mba-git-feature-abc123.vercel.app/")).toBe(true);
    expect(html).not.toContain(PRODUCTION_DOMAIN);
    expect(text).not.toContain(PRODUCTION_DOMAIN);
  });

  it("with nothing configured, a preview points at localhost rather than production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { html, text, all } = everyOperationalLink("active");
    for (const link of all) expect(link.startsWith("http://localhost:3000/")).toBe(true);
    expect(html).not.toContain(PRODUCTION_DOMAIN);
    expect(text).not.toContain(PRODUCTION_DOMAIN);
  });

  it("a Vercel deployment with no VERCEL_ENV and NODE_ENV=production is still treated as a preview", () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_URL", "mba-preview.vercel.app");
    expect(buildDeliveryEmail(params).links.downloadUrl.startsWith("https://mba-preview.vercel.app/")).toBe(true);
  });
});
