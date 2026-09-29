import { describe, expect, it } from "vitest";
import { isAllowedAdminEmail } from "./admin-authorization";

describe("admin authorization", () => {
  it("rejects missing, unauthorized, and unconfigured identities", () => {
    expect(isAllowedAdminEmail(null, "martin@example.com")).toBe(false);
    expect(isAllowedAdminEmail("visitor@example.com", "martin@example.com")).toBe(false);
    expect(isAllowedAdminEmail("martin@example.com", undefined)).toBe(false);
  });
  it("accepts only the configured admin, case-insensitively", () => {
    expect(isAllowedAdminEmail("Martin@Example.com", "martin@example.com")).toBe(true);
  });
});
