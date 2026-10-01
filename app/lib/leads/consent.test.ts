import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { consentStatusOf, decideConsent } from "./consent";

const lead = (over: Partial<Parameters<typeof consentStatusOf>[0]> = {}) => ({
  ongoing_content_opt_in: false,
  ongoing_content_opt_in_at: null,
  ongoing_content_opt_out_at: null,
  suppressed_at: null,
  consent_requested_at: null,
  ...over,
});

describe("consent status (derived, never stored twice)", () => {
  it("is pending for a lead that never opted in", () => {
    expect(consentStatusOf(lead())).toBe("pending");
  });
  it("is opted_in for an active subscriber", () => {
    expect(consentStatusOf(lead({ ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-01-01" }))).toBe("opted_in");
  });
  it("is opted_out after an unsubscribe, even though history is kept", () => {
    expect(consentStatusOf(lead({ ongoing_content_opt_in_at: "2026-01-01", ongoing_content_opt_out_at: "2026-02-01" }))).toBe("opted_out");
  });
  it("is pending after a request that has not been confirmed", () => {
    expect(consentStatusOf(lead({ consent_requested_at: "2026-10-01T10:00:00Z" }))).toBe("pending");
  });
  it("is pending again when a previously unsubscribed lead asks to rejoin", () => {
    expect(
      consentStatusOf(lead({ ongoing_content_opt_in_at: "2026-01-01", ongoing_content_opt_out_at: "2026-02-01", consent_requested_at: "2026-10-01T10:00:00Z" }))
    ).toBe("pending");
  });
  it("stays opted_out when the unsubscribe is newer than the request", () => {
    expect(consentStatusOf(lead({ ongoing_content_opt_in_at: "2026-01-01", ongoing_content_opt_out_at: "2026-10-02", consent_requested_at: "2026-10-01" }))).toBe("opted_out");
  });
  it("is suppressed above everything else", () => {
    expect(consentStatusOf(lead({ ongoing_content_opt_in: true, suppressed_at: "2026-03-01" }))).toBe("suppressed");
  });
});

describe("decideConsent for an explicit opt-in action", () => {
  it("requests confirmation for new leads (marketing stays off until confirmed)", () => {
    expect(decideConsent(lead())).toBe("request_confirmation");
  });
  it("requests confirmation again for a lead whose earlier request is still pending", () => {
    expect(decideConsent(lead({ consent_requested_at: "2026-10-01T10:00:00Z" }))).toBe("request_confirmation");
  });
  it("requests confirmation for a previously unsubscribed lead", () => {
    expect(decideConsent(lead({ ongoing_content_opt_in_at: "2026-01-01", ongoing_content_opt_out_at: "2026-02-01" }))).toBe("request_confirmation");
  });
  it("keeps the original consent for an active subscriber", () => {
    expect(decideConsent(lead({ ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-01-01" }))).toBe("already_opted_in");
  });
  it("never auto-reactivates a suppressed lead", () => {
    expect(decideConsent(lead({ suppressed_at: "2026-03-01" }))).toBe("blocked_suppressed");
  });
});
