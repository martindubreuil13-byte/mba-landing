import { describe, expect, it } from "vitest";
import { bareAddress, evaluateEmailPolicy } from "./email-policy";

const ADMIN = "Admin.Person@example.com";
const preview = (extra: Record<string, string> = {}) => ({ VERCEL_ENV: "preview", ADMIN_EMAIL: ADMIN, ...extra });
const enabled = (extra: Record<string, string> = {}) => preview({ PREVIEW_EMAIL_ENABLED: "true", PREVIEW_EMAIL_ALLOWLIST: ADMIN, ...extra });

describe("email policy", () => {
  it("never restricts production", () => {
    expect(evaluateEmailPolicy(["anyone@example.com"], { VERCEL_ENV: "production" })).toEqual({ allowed: true });
    expect(evaluateEmailPolicy(["anyone@example.com"], { APP_ENV: "production" })).toEqual({ allowed: true });
  });
  it("NODE_ENV=production alone does not unlock email (local builds and previews use it too)", () => {
    expect(evaluateEmailPolicy(["anyone@example.com"], { NODE_ENV: "production" }).allowed).toBe(false);
    expect(evaluateEmailPolicy(["anyone@example.com"], { VERCEL: "1", NODE_ENV: "production" }).allowed).toBe(false);
    expect(evaluateEmailPolicy(["anyone@example.com"], { VERCEL_ENV: "preview", APP_ENV: "production" }).allowed).toBe(false);
  });
  it("is OFF by default in preview and development, even for the admin", () => {
    for (const env of [preview(), { NODE_ENV: "development", ADMIN_EMAIL: ADMIN }]) {
      const d = evaluateEmailPolicy([ADMIN], env);
      expect(d.allowed).toBe(false);
    }
  });
  it("stays off when only one of the two switches is set", () => {
    expect(evaluateEmailPolicy([ADMIN], preview({ PREVIEW_EMAIL_ENABLED: "true" })).allowed).toBe(false);
    expect(evaluateEmailPolicy([ADMIN], preview({ PREVIEW_EMAIL_ALLOWLIST: ADMIN })).allowed).toBe(false);
    expect(evaluateEmailPolicy([ADMIN], preview({ PREVIEW_EMAIL_ENABLED: "yes", PREVIEW_EMAIL_ALLOWLIST: ADMIN })).allowed).toBe(false);
  });
  it("when enabled, delivers only to the admin address (case-insensitive, display names ok)", () => {
    expect(evaluateEmailPolicy([ADMIN], enabled()).allowed).toBe(true);
    expect(evaluateEmailPolicy(["admin.person@EXAMPLE.com"], enabled()).allowed).toBe(true);
    expect(evaluateEmailPolicy([`Martin <${ADMIN}>`], enabled()).allowed).toBe(true);
  });
  it("rejects every other recipient, including when mixed with the admin", () => {
    expect(evaluateEmailPolicy(["lead@example.com"], enabled()).allowed).toBe(false);
    expect(evaluateEmailPolicy([ADMIN, "lead@example.com"], enabled()).allowed).toBe(false);
    expect(evaluateEmailPolicy([], enabled()).allowed).toBe(false);
  });
  it("treats an allowlist with any non-admin entry as a misconfiguration and sends nothing, not even to the admin", () => {
    const env = enabled({ PREVIEW_EMAIL_ALLOWLIST: `${ADMIN}, friend@example.com` });
    expect(evaluateEmailPolicy([ADMIN], env).allowed).toBe(false);
    expect(evaluateEmailPolicy(["friend@example.com"], env).allowed).toBe(false);
  });
  it("needs ADMIN_EMAIL to be configured", () => {
    expect(evaluateEmailPolicy([ADMIN], { VERCEL_ENV: "preview", PREVIEW_EMAIL_ENABLED: "true", PREVIEW_EMAIL_ALLOWLIST: ADMIN }).allowed).toBe(false);
  });
  it("normalises addresses", () => {
    expect(bareAddress("Martin <A@B.com>")).toBe("a@b.com");
    expect(bareAddress("  A@B.com ")).toBe("a@b.com");
  });
});
