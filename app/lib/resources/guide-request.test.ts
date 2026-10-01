import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { nextLeadStatus } from "./guide-request";

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
