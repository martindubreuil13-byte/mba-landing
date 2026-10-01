import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
import { createConfirmationToken, verifyConfirmationToken } from "./confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

const DAY = 86_400_000;

describe("confirmation token", () => {
  it("round-trips a lead id", () => {
    expect(verifyConfirmationToken(createConfirmationToken("lead-9"))).toEqual({ ok: true, leadId: "lead-9" });
  });
  it("expires after 30 days", () => {
    const issued = Date.UTC(2026, 9, 1);
    const token = createConfirmationToken("lead-9", issued);
    expect(verifyConfirmationToken(token, issued + 29 * DAY).ok).toBe(true);
    expect(verifyConfirmationToken(token, issued + 31 * DAY)).toEqual({ ok: false, reason: "expired" });
  });
  it("rejects tampering with the lead id or expiry", () => {
    const [v, id, exp, sig] = createConfirmationToken("lead-9").split(".");
    expect(verifyConfirmationToken([v, "lead-8", exp, sig].join(".")).ok).toBe(false);
    expect(verifyConfirmationToken([v, id, String(Number(exp) + 999999), sig].join(".")).ok).toBe(false);
    expect(verifyConfirmationToken("garbage").ok).toBe(false);
  });
  it("is not interchangeable with an unsubscribe token", () => {
    expect(verifyConfirmationToken(createUnsubscribeToken("lead-9")).ok).toBe(false);
  });
});
