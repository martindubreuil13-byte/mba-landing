import { readFileSync } from "node:fs";
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
  it("has the agreed subject, preview text, opening and a stable download link", () => {
    const { subject, html, text, links, previewText } = buildDeliveryEmail(params);
    expect(subject).toBe("Your guide is ready: Build the Bridge First");
    expect(previewText).toBe("A practical guide for deciding what to build before leaving what you know.");
    expect(html).toContain("A practical guide for your move from corporate life to entrepreneurship");
    expect(html).toContain("Here it is.");
    expect(html).toContain("What would need to be true for your next move to become a credible business, not simply an escape?");
    expect(html).toContain("A small suggestion");
    expect(links.downloadUrl).toBe("https://modernbusinessarchitect.com/api/resources/download?token=11111111-1111-1111-1111-111111111111&via=email");
    expect(text).toContain(`Download the guide: ${links.downloadUrl}`);
  });
  it("has no first-name placeholder and uses a neutral salutation", () => {
    const { html, text } = buildDeliveryEmail(params);
    expect(html).not.toMatch(/\[First name\]|\{\{|\[MAILING/i);
    expect(html).toContain(">Hello,<");
    expect(text).toContain("Hello,");
  });
  it("hides the preview text in the body but leads the plain text with it", () => {
    const { html, text } = buildDeliveryEmail(params);
    const hidden = html.match(/<div style="display:none[^>]*>([^<]*)/)!;
    expect(hidden[0]).toContain("display:none");
    expect(hidden[0]).toContain("max-height:0");
    expect(hidden[0]).toContain("overflow:hidden");
    expect(hidden[1]).toContain("A practical guide for deciding what to build");
    expect(html.split("A practical guide for deciding what to build").length - 1).toBe(1);
    expect(html.indexOf("display:none")).toBeLessThan(html.indexOf("<h1"));
    expect(text.startsWith("A practical guide for deciding what to build")).toBe(true);
  });
  it("makes the download the primary burgundy button and the confirmation visually secondary", () => {
    const { html } = buildDeliveryEmail({ ...params, consent: "pending" });
    expect(html).toMatch(/bgcolor="#6b1f1f"[^>]*>\s*<a href="[^"]*api\/resources\/download[^"]*"[^>]*background|bgcolor="#6b1f1f"/);
    expect(html).toMatch(/background:#6b1f1f;"><a href="[^"]+download[^"]+"[^>]*color:#ffffff[^>]*>Download the guide<\/a>/);
    expect(html).toMatch(/<a href="[^"]*\/confirm\?token=[^"]+" style="[^"]*border:1px solid #6b1f1f;color:#6b1f1f[^"]*">Yes, keep me in the community<\/a>/);
    expect(html.indexOf("Download the guide")).toBeLessThan(html.indexOf("Yes, keep me in the community"));
  });
  it("uses email-safe structure: tables, inline styles, serif headings, no external resources", () => {
    const { html } = buildDeliveryEmail({ ...params, consent: "pending" });
    expect(html).toContain("Georgia");
    expect(html).toContain("Arial,Helvetica");
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain("max-width:600px");
    expect(html).toContain('role="presentation"');
    expect(html).not.toMatch(/<script|<link|<img|@import|@font-face|url\(|<style/i);
    expect(html).not.toMatch(/(src|href)="https?:\/\/(fonts|cdn)\./);
  });
  it("identifies the sender and carries a working unsubscribe link without any email address", () => {
    const { html, text, links } = buildDeliveryEmail(params);
    expect(html).toContain("Martin Dubreuil · The Modern Business Architect");
    expect(html).toContain(">Unsubscribe<");
    expect(html).toContain(`href="${links.privacyUrl}"`);
    expect(text).toContain(`Privacy: ${links.privacyUrl}`);
    expect(text).toContain(links.unsubscribePage);
    const token = new URL(links.unsubscribePage).searchParams.get("token")!;
    expect(verifyUnsubscribeToken(token)).toBe("lead-1");
    expect(html).not.toMatch(/@(gmail|example)\./);
  });
  it("includes the postal address only when configured, and never a placeholder or invented one", () => {
    const without = buildDeliveryEmail(params);
    expect(without.html).not.toContain("Rue Test");
    expect(without.html).not.toMatch(/\[MAILING ADDRESS\]/i);
    process.env.MAILING_ADDRESS = "1 Rue Test, Montréal QC";
    const withAddr = buildDeliveryEmail(params);
    expect(withAddr.html).toContain("1 Rue Test, Montréal QC");
    expect(withAddr.text).toContain("1 Rue Test, Montréal QC");
  });
  it("renders a multiline MAILING_ADDRESS line by line, whether it uses real line breaks or a literal \\n", () => {
    for (const value of ["MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia", "MINDRA\\nNarva mnt 5\\n10117 Tallinn\\nEstonia", "MINDRA\r\nNarva mnt 5\r\n10117 Tallinn\r\nEstonia"]) {
      process.env.MAILING_ADDRESS = value;
      const { html, text } = buildDeliveryEmail(params);
      expect(html).toContain("MINDRA<br>Narva mnt 5<br>10117 Tallinn<br>Estonia<br>");
      expect(text).toContain("MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia\n");
    }
  });
  it("does not hardcode any postal address in the source", () => {
    const src = readFileSync("app/lib/resources/delivery-email.ts", "utf8") + readFileSync("app/lib/resources/config.ts", "utf8");
    expect(src).not.toMatch(/Narva|Tallinn|MINDRA/);
  });
  it("production with APP_BASE_URL set uses it (local mock servers, staging)", () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    expect(buildDeliveryEmail(params).links.downloadUrl.startsWith("http://localhost:3000/api/resources/download")).toBe(true);
  });
  it("does not offer confirmation or claim consent for a suppressed address, and keeps the download", () => {
    const { html, text, links } = buildDeliveryEmail({ ...params, consent: "none" });
    expect(html).toContain("No further marketing emails will be sent");
    expect(html).not.toContain("Yes, keep me in the community");
    expect(html).not.toContain("/confirm?token");
    expect(text).not.toContain("/confirm?token");
    expect(html).toContain(links.downloadUrl);
    expect(text).toContain(links.downloadUrl);
  });
  it("asks a pending reader to confirm, optionally, with a signed expiring link, and does not call them subscribed", () => {
    const { html, text, links } = buildDeliveryEmail({ ...params, consent: "pending" });
    expect(html).toContain("Would you like to stay connected?");
    expect(html).toContain("Confirming is optional");
    expect(html).toContain("You can download the guide whether or not you confirm.");
    expect(html).toContain("only receive further emails");
    expect(html).toContain("Unsubscribe or cancel request");
    expect(text).toContain(`Yes, keep me in the community: ${links.confirmPage}`);
    expect(text).toContain("Unsubscribe or cancel request:");
    const token = new URL(links.confirmPage).searchParams.get("token")!;
    expect(verifyConfirmationToken(token)).toEqual({ ok: true, leadId: "lead-1" });
    // The confirm link is a page link: opening it must not confirm (the page POSTs); there is no confirm API URL in the email.
    expect(links.confirmPage).toContain("/confirm?token=");
    expect(html).not.toContain("/api/confirm");
    expect(text).not.toContain("/api/confirm");
  });
  it("does not offer confirmation to someone who is already subscribed", () => {
    const { html, text, links } = buildDeliveryEmail({ ...params, consent: "active" });
    expect(html).not.toContain("Yes, keep me in the community");
    expect(html).not.toContain("/confirm?token");
    expect(text).not.toContain("/confirm?token");
    expect(html).toContain("on the list for occasional practical notes");
    expect(html).toContain(links.downloadUrl);
  });
  it("plain text carries the same URLs as the HTML for every consent state", () => {
    for (const consent of ["pending", "active", "none"] as const) {
      const { html, text } = buildDeliveryEmail({ ...params, consent });
      const urls = (html.match(/href="(https?:[^"]+)"/g) ?? []).map((m) => m.slice(6, -1).replace(/&amp;/g, "&"));
      for (const url of new Set(urls)) {
        if (url === "https://modernbusinessarchitect.com") continue; // site link in the sender line
        expect(text, `${consent}: ${url}`).toContain(url);
      }
    }
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
