import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const providerSend = vi.fn(async () => ({ data: { id: "provider-id" }, error: null }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: providerSend };
  },
}));

import { createResend } from "./email-client";

const ADMIN = "admin@example.com";
const payload = (to: string) => ({ from: "Martin <martin@example.com>", to, subject: "s", html: "<p>x</p>" });

describe("createResend (the single email choke point)", () => {
  beforeEach(() => {
    providerSend.mockClear();
    for (const k of ["APP_ENV", "VERCEL_ENV", "PREVIEW_EMAIL_ENABLED", "PREVIEW_EMAIL_ALLOWLIST", "ADMIN_EMAIL"]) vi.stubEnv(k, "");
    vi.stubEnv("NODE_ENV", "development");
  });

  it("does not call the provider at all while email is disabled, and returns the provider's error shape", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const result = await createResend("re_x").emails.send(payload(ADMIN));
    expect(providerSend).not.toHaveBeenCalled();
    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/disabled in this non-production environment/);
  });

  it("delivers to the allowlisted admin address only", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ADMIN_EMAIL", ADMIN);
    vi.stubEnv("PREVIEW_EMAIL_ENABLED", "true");
    vi.stubEnv("PREVIEW_EMAIL_ALLOWLIST", ADMIN);
    const mail = createResend("re_x");
    expect((await mail.emails.send(payload(ADMIN))).error).toBeNull();
    expect(providerSend).toHaveBeenCalledTimes(1);
    const blocked = await mail.emails.send(payload("lead@example.com"));
    expect(blocked.error?.message).toMatch(/not on this environment's allowlist/);
    expect(providerSend).toHaveBeenCalledTimes(1);
  });

  it("also checks cc and bcc", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ADMIN_EMAIL", ADMIN);
    vi.stubEnv("PREVIEW_EMAIL_ENABLED", "true");
    vi.stubEnv("PREVIEW_EMAIL_ALLOWLIST", ADMIN);
    const r = await createResend("re_x").emails.send({ ...payload(ADMIN), bcc: "lead@example.com" });
    expect(r.error).not.toBeNull();
    expect(providerSend).not.toHaveBeenCalled();
  });

  it("is a pass-through in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const r = await createResend("re_x").emails.send(payload("anyone@example.com"));
    expect(r.error).toBeNull();
    expect(providerSend).toHaveBeenCalledTimes(1);
  });
});
