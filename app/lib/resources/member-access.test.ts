import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { nextLeadStatus } from "./member-access";

describe("lead status on a download", () => {
  it("is new on first touch and engaged on a repeat touch", () => {
    expect(nextLeadStatus(undefined, false)).toBe("new");
    expect(nextLeadStatus("new", true)).toBe("engaged");
  });
  it("never moves a lead that is further along", () => {
    for (const status of ["qualified", "contacted", "converted", "archived", "engaged"] as const) {
      expect(nextLeadStatus(status, true)).toBe(status);
    }
  });
});

import { decideAccessAction } from "./member-access";

const lead = (over: Partial<Parameters<typeof decideAccessAction>[0]> = {}) => ({
  ongoing_content_opt_in: false,
  ongoing_content_opt_in_at: null,
  ongoing_content_opt_out_at: null,
  suppressed_at: null,
  consent_requested_at: null,
  ...over,
});

describe("what a standard resource form does for each state (decideAccessAction)", () => {
  it("a brand-new address gets a confirmation email", () => {
    expect(decideAccessAction(lead())).toBe("send_confirmation");
  });
  it("a pending address (request awaiting confirmation) gets a confirmation email again", () => {
    expect(decideAccessAction(lead({ consent_requested_at: "2026-10-02T10:00:00Z" }))).toBe("send_confirmation");
  });
  it("a confirmed member gets the benefit by email and is never asked to confirm again", () => {
    expect(decideAccessAction(lead({ ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-09-01T00:00:00Z" }))).toBe("send_delivery");
  });
  it("an unsubscribed address is never silently reactivated by a standard form", () => {
    expect(decideAccessAction(lead({ ongoing_content_opt_in_at: "2026-09-01T00:00:00Z", ongoing_content_opt_out_at: "2026-09-02T00:00:00Z" }))).toBe("blocked_unsubscribed");
  });
  it("an address that cancelled a pending request by unsubscribing counts as unsubscribed", () => {
    expect(decideAccessAction(lead({ ongoing_content_opt_out_at: "2026-10-02T11:00:00Z" }))).toBe("blocked_unsubscribed");
  });
  it("a suppressed address (e.g. spam complaint) is blocked, even if it also looks opted in", () => {
    expect(decideAccessAction(lead({ suppressed_at: "2026-10-01T00:00:00Z" }))).toBe("blocked_suppressed");
    expect(decideAccessAction(lead({ suppressed_at: "2026-10-01T00:00:00Z", ongoing_content_opt_in: true }))).toBe("blocked_suppressed");
  });
  it("a person who unsubscribed and then made a NEW pending request through rejoin is pending again", () => {
    expect(decideAccessAction(lead({ ongoing_content_opt_out_at: "2026-10-01T00:00:00Z", consent_requested_at: "2026-10-02T00:00:00Z" }))).toBe("send_confirmation");
  });
});
