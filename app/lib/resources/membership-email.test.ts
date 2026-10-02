import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
import { getResourceConfig } from "./config";
import { buildMembershipConfirmationEmail, buildRejoinConfirmationEmail } from "./membership-email";
import { verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { verifyUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { isSignedDownloadToken } from "./download-token";

const config = getResourceConfig("build-the-bridge-first")!;
const resource = { title: "Build The Bridge First" };

beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("APP_BASE_URL", "");
  vi.stubEnv("VERCEL_URL", "");
  vi.stubEnv("MAILING_ADDRESS", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("membership confirmation email (pre-confirmation)", () => {
  const m = () => buildMembershipConfirmationEmail({ config, resource, leadId: "lead-1" });

  it("asks for confirmation to unlock the benefit, with the agreed subject, preview and one primary button", () => {
    const { subject, preview, html, text, links } = m();
    expect(subject).toBe("Confirm your email to unlock Build the Bridge First");
    expect(preview).toBe("One click to confirm and unlock your printable guide.");
    expect(html).toContain("One step to unlock your printable guide");
    expect(html).toContain("Confirm and unlock the guide");
    expect(html.match(/bgcolor="#6b1f1f"/g)?.length).toBe(1);
    expect(text).toContain(`Confirm and unlock the guide: ${links.confirmPage}`);
    expect(html).toContain("If you did not ask for this, ignore this email");
  });
  it("links to the signed /confirm PAGE only: no API URL, so opening the email can never confirm anything", () => {
    const { html, text, links } = m();
    expect(links.confirmPage).toMatch(/^https:\/\/modernbusinessarchitect\.com\/confirm\?token=/);
    expect(verifyConfirmationToken(new URL(links.confirmPage).searchParams.get("token")!)).toEqual({ ok: true, leadId: "lead-1" });
    for (const body of [html, text]) expect(body).not.toContain("/api/confirm");
  });
  it("contains NO working download URL or download token before confirmation", () => {
    const { html, text } = m();
    for (const body of [html, text]) {
      expect(body).not.toContain("/api/resources/download");
      expect(body).not.toMatch(/\bd1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
      expect(body).not.toMatch(/\.pdf/i);
    }
    expect(isSignedDownloadToken(new URL(m().links.confirmPage).searchParams.get("token")!)).toBe(false);
  });
  it("carries privacy, a working unsubscribe/cancel link, sender identification and the postal address when configured", () => {
    vi.stubEnv("MAILING_ADDRESS", "MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia");
    const { html, text, links } = m();
    expect(verifyUnsubscribeToken(new URL(links.unsubscribePage).searchParams.get("token")!)).toBe("lead-1");
    expect(html).toContain("Unsubscribe or cancel request");
    expect(html).toContain("Sent by Martin Dubreuil · The Modern Business Architect");
    expect(html).toContain("MINDRA<br>Narva mnt 5<br>10117 Tallinn<br>Estonia<br>");
    expect(text).toContain(`Privacy: ${links.privacyUrl}`);
    expect(text).toContain("MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia");
  });
  it("plain text carries every URL the HTML does", () => {
    const { html, text } = m();
    for (const x of html.matchAll(/href="(https?:[^"]+)"/g)) { const u = x[1].replace(/&amp;/g, "&"); if (u !== "https://modernbusinessarchitect.com") expect(text, u).toContain(u); }
  });
  it("is email-safe: tables, inline styles, Georgia + Arial, hidden preview text, no external resources", () => {
    const { html, preview } = m();
    expect(html).toContain("max-width:600px");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("Georgia");
    expect(html).toMatch(/<div style="display:none[^>]*max-height:0/);
    expect(html.split(preview).length - 1).toBe(1);
    expect(html).not.toMatch(/<script|<link|<img|@import|@font-face|url\(|<style/i);
  });
  it("on a preview deployment every link stays on the preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("APP_BASE_URL", "https://preview.example.test");
    const { html, links } = m();
    for (const l of Object.values(links)) expect(l.startsWith("https://preview.example.test/")).toBe(true);
    expect(html).not.toContain("modernbusinessarchitect.com");
  });
});

describe("rejoin confirmation email", () => {
  it("asks to rejoin, links to the /confirm page only, has no download", () => {
    const { subject, html, text, links } = buildRejoinConfirmationEmail("lead-9");
    expect(subject).toBe("Confirm to rejoin the community");
    expect(html).toContain("Would you like to rejoin?");
    expect(html).toContain("Nothing changes until you confirm");
    expect(links.confirmPage).toContain("/confirm?token=");
    for (const body of [html, text]) { expect(body).not.toContain("/api/confirm"); expect(body).not.toContain("/api/resources/download"); }
    expect(verifyConfirmationToken(new URL(links.confirmPage).searchParams.get("token")!)).toEqual({ ok: true, leadId: "lead-9" });
  });
});
