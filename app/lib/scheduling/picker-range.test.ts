import { describe, expect, it } from "vitest";
import { pickerRangeStart } from "./picker-range";

describe("calendar availability request start", () => {
  const now = Date.parse("2026-11-04T06:25:00Z");
  it("starts the current month at today, within the public API's two-day lookback", () => {
    for (const zone of ["Asia/Bangkok", "America/Toronto", "Pacific/Kiritimati", "Pacific/Honolulu"]) {
      const start = Date.parse(pickerRangeStart("2026-11", zone, now));
      expect(start).toBeGreaterThan(now - 2 * 86_400_000);
      expect(start).toBeLessThanOrEqual(now);
    }
    expect(pickerRangeStart("2026-11", "Asia/Bangkok", now)).toBe("2026-11-03T17:00:00.000Z");
  });
  it("keeps the first day for a future month", () => {
    expect(pickerRangeStart("2026-12", "Asia/Bangkok", now)).toBe("2026-11-30T17:00:00.000Z");
  });
  it("uses the guest's date at a month boundary", () => {
    const boundary = Date.parse("2026-11-01T02:00:00Z");
    expect(pickerRangeStart("2026-10", "America/Los_Angeles", boundary)).toBe("2026-10-31T07:00:00.000Z");
  });
});
