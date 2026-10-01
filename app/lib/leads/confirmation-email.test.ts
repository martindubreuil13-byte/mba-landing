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
});
afterEach(() => vi.unstubAllEnvs());

describe("shared consent confirmation email", () => {
  it("asks for confirmation with a signed link, and says nothing is sent unless they confirm", () => {
    const { subject, html, text, links } = buildConsentConfirmationEmail({ leadId: "lead-1", firstName: "Alex" });
    expect(subject).toBe("Please confirm your email address");
    expect(html).toContain("Yes, confirm my email");
    expect(html).toContain("Hi Alex,");
    expect(html).toContain("I will only send those emails once you confirm your email address");
    expect(text).toContain(links.confirmUrl);
    expect(verifyConfirmationToken(new URL(links.confirmUrl).searchParams.get("token")!)).toEqual({ ok: true, leadId: "lead-1" });
    expect(links.confirmUrl.startsWith(`https://${PRODUCTION_DOMAIN}/confirm?token=`)).toBe(true);
  });
  it("carries a working unsubscribe link, one-click URL, privacy link and sender identification", () => {
    const { html, text, links } = buildConsentConfirmationEmail({ leadId: "lead-1" });
    expect(verifyUnsubscribeToken(new URL(links.unsubscribePage).searchParams.get("token")!)).toBe("lead-1");
    expect(verifyUnsubscribeToken(new URL(links.unsubscribePost).searchParams.get("token")!)).toBe("lead-1");
    expect(links.privacyUrl).toBe(`https://${PRODUCTION_DOMAIN}/privacy`);
    expect(html).toContain("Sent by Martin Dubreuil · The Modern Business Architect");
    expect(html).toContain("Unsubscribe");
    expect(text).toContain("Questions: reply to this email");
  });
  it("greets without a name and escapes markup in one", () => {
    expect(buildConsentConfirmationEmail({ leadId: "l" }).html).toContain("Hi,");
    const evil = buildConsentConfirmationEmail({ leadId: "l", firstName: '<script>alert("x")</script>' }).html;
    expect(evil).not.toContain("<script>");
    expect(evil).toContain("&lt;script&gt;");
  });
  it("shows the postal address only when configured", () => {
    expect(buildConsentConfirmationEmail({ leadId: "l" }).html).not.toContain("Rue Test");
    vi.stubEnv("MAILING_ADDRESS", "1 Rue Test, Montréal QC");
    const { html, text } = buildConsentConfirmationEmail({ leadId: "l" });
    expect(html).toContain("1 Rue Test, Montréal QC");
    expect(text).toContain("1 Rue Test, Montréal QC");
  });
  it("is not feature-specific: no guide, PDF or download wording", () => {
    const { html, text } = buildConsentConfirmationEmail({ leadId: "l" });
    for (const body of [html, text]) expect(body).not.toMatch(/guide|pdf|download/i);
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
    expect(payload.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
  it("reports a provider or policy refusal truthfully and never throws", async () => {
    providerSend.mockResolvedValue({ data: null, error: { message: "Email blocked: the recipient is not on this environment's allowlist." } });
    expect(await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "l" })).toEqual({ ok: false, error: "Email blocked: the recipient is not on this environment's allowlist." });
    providerSend.mockRejectedValue(new Error("network down"));
    expect(await sendConsentConfirmationEmail({ to: "a@example.com", leadId: "l" })).toEqual({ ok: false, error: "network down" });
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
