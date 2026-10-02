import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";

const providerSend = vi.fn();
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: providerSend } }) }));

import { buildConsentConfirmationEmail, sendConsentConfirmationEmail } from "./confirmation-email";
import { verifyConfirmationToken } from "./confirmation-token";
import { verifyUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { CONSENT_FOOTNOTE, CONSENT_VERSION, CONSENT_WORDING } from "@/app/lib/programs/corporate-transition";

const PRODUCTION_DOMAIN = "modernbusinessarchitect.com";

beforeEach(() => {
  providerSend.mockReset();
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("APP_BASE_URL", "");
  vi.stubEnv("VERCEL_URL", "");
  vi.stubEnv("MAILING_ADDRESS", "");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("PROGRAM_REPLY_TO", "martin@mindrasolutions.com");
  vi.stubEnv("PROGRAM_EMAIL_FROM", "");
  vi.stubEnv("CONSENT_EMAIL_FROM", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("Transition confirmation email", () => {
  it("has one purpose, the agreed subject, preview and heading, and a signed /confirm link", () => {
    const { subject, preview, html, text, links } = buildConsentConfirmationEmail({ leadId: "lead-1", firstName: "Alex" });
    expect(subject).toBe("One last step to stay connected");
    expect(preview).toBe("Confirm your email if you’d like occasional ideas, resources and invitations from Martin.");
    expect(html).toContain("Would you like to stay connected?");
    expect(html).toContain("Yes, keep me in the community");
    expect(html).toContain("Hi Alex,");
    expect(html).toContain("I’ve already received your application");
    expect(html).toContain("entirely optional");
    expect(html).toContain("does not affect my review of your application");
    expect(html).toContain("Marketing emails begin only after you confirm");
    expect(text).toContain(`Yes, keep me in the community: ${links.confirmUrl}`);
    expect(verifyConfirmationToken(new URL(links.confirmUrl).searchParams.get("token")!)).toEqual({ ok: true, leadId: "lead-1" });
    expect(links.confirmUrl.startsWith(`https://${PRODUCTION_DOMAIN}/confirm?token=`)).toBe(true);
  });
  it("links to the /confirm PAGE only: no API URL, so opening the email can never activate consent", () => {
    const { html, text } = buildConsentConfirmationEmail({ leadId: "lead-1" });
    expect(html).not.toContain("/api/confirm");
    expect(text).not.toContain("/api/confirm");
    expect(html.match(/href="[^"]*\/confirm\?token=/g)?.length).toBe(2); // button + fallback link, same URL
  });
  it("has a single primary button (one burgundy CTA)", () => {
    const { html } = buildConsentConfirmationEmail({ leadId: "l" });
    expect(html.match(/bgcolor="#6b1f1f"/g)?.length).toBe(1);
  });
  it("carries a working unsubscribe link, privacy link and sender identification", () => {
    const { html, text, links } = buildConsentConfirmationEmail({ leadId: "lead-1" });
    expect(verifyUnsubscribeToken(new URL(links.unsubscribePage).searchParams.get("token")!)).toBe("lead-1");
    expect(verifyUnsubscribeToken(new URL(links.unsubscribePost).searchParams.get("token")!)).toBe("lead-1");
    expect(links.privacyUrl).toBe(`https://${PRODUCTION_DOMAIN}/privacy`);
    expect(html).toContain("Sent by Martin Dubreuil · The Modern Business Architect");
    expect(html).toContain("Unsubscribe or cancel request");
    expect(text).toContain(`Unsubscribe or cancel request: ${links.unsubscribePage}`);
    expect(text).toContain(`Privacy: ${links.privacyUrl}`);
  });
  it("greets without a name and escapes markup in one", () => {
    expect(buildConsentConfirmationEmail({ leadId: "l" }).html).toContain("Hi,");
    const evil = buildConsentConfirmationEmail({ leadId: "l", firstName: '<script>alert("x")</script>' }).html;
    expect(evil).not.toContain("<script>");
    expect(evil).toContain("&lt;script&gt;");
  });
  it("shows the postal address (multiline) only when configured", () => {
    expect(buildConsentConfirmationEmail({ leadId: "l" }).html).not.toContain("Rue Test");
    vi.stubEnv("MAILING_ADDRESS", "1 Rue Test\nMontréal QC");
    const { html, text } = buildConsentConfirmationEmail({ leadId: "l" });
    expect(html).toContain("1 Rue Test<br>Montréal QC");
    expect(text).toContain("1 Rue Test\nMontréal QC");
  });
  it("is not feature-specific: no guide, PDF or download wording", () => {
    const { html, text } = buildConsentConfirmationEmail({ leadId: "l" });
    for (const body of [html, text]) expect(body).not.toMatch(/guide|pdf|download/i);
  });
  it("plain text carries every URL the HTML does", () => {
    const { html, text } = buildConsentConfirmationEmail({ leadId: "lead-1" });
    for (const m of html.matchAll(/href="(https?:[^"]+)"/g)) { const u = m[1].replace(/&amp;/g, "&"); if (u !== `https://${PRODUCTION_DOMAIN}`) expect(text).toContain(u); }
  });
  it("on a preview, every link points at the preview and never at production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("APP_BASE_URL", "https://preview.example.test");
    const { html, text, links } = buildConsentConfirmationEmail({ leadId: "l" });
    for (const link of Object.values(links)) expect(link.startsWith("https://preview.example.test/")).toBe(true);
    expect(html).not.toContain(PRODUCTION_DOMAIN);
    expect(text).not.toContain(PRODUCTION_DOMAIN);
  });
  it("falls back to the deployment's VERCEL_URL on a preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "mba-git-x.vercel.app");
    expect(buildConsentConfirmationEmail({ leadId: "l" }).links.confirmUrl.startsWith("https://mba-git-x.vercel.app/confirm?token=")).toBe(true);
  });
});

describe("sending it", () => {
  it("reports success and sends one-click unsubscribe headers", async () => {
    providerSend.mockResolvedValue({ data: { id: "msg_1" }, error: null });
    const result = await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "lead-1", firstName: "Alex" });
    expect(result).toEqual({ ok: true, error: null });
    const payload = providerSend.mock.calls[0][0];
    expect(payload.to).toBe("a@example.com");
    expect(payload.from).toBe("Martin Dubreuil <martin@mindrasolutions.com>");
    expect(payload.replyTo).toBe("martin@mindrasolutions.com");
    expect(payload.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
  it("reports a provider or policy refusal truthfully and never throws", async () => {
    providerSend.mockResolvedValue({ data: null, error: { message: "Email blocked: the recipient is not on this environment's allowlist." } });
    expect(await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "l" })).toEqual({ ok: false, error: "Email blocked: the recipient is not on this environment's allowlist." });
    providerSend.mockRejectedValue(new Error("network down"));
    expect(await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "l" })).toEqual({ ok: false, error: "network down" });
  });
  it("omits Reply-To (replies reach the From mailbox) when PROGRAM_REPLY_TO is not configured", async () => {
    vi.stubEnv("PROGRAM_REPLY_TO", "");
    providerSend.mockResolvedValue({ data: { id: "msg_1" }, error: null });
    await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "l" });
    expect("replyTo" in providerSend.mock.calls[0][0]).toBe(false);
  });
  it("reports a missing provider key without calling the provider", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "l" })).ok).toBe(false);
    expect(providerSend).not.toHaveBeenCalled();
  });
});

describe("Transition consent wording v2", () => {
  it("is a new version that tells the visitor an email confirmation is required", () => {
    expect(CONSENT_VERSION).toBe("corporate-transition-shortlist-v2");
    expect(CONSENT_WORDING).toMatch(/one email asking me to confirm/);
    expect(CONSENT_WORDING).toMatch(/only subscribed once I do/);
    expect(CONSENT_FOOTNOTE).toMatch(/unless you check the box and then confirm/);
  });
});
