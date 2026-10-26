import { describe, expect, it } from "vitest";
import { formatDuration, formatRate, percentChange, resolveRange } from "./ranges";

const now = new Date("2026-10-26T15:30:00Z");

describe("resolveRange", () => {
  it("today / yesterday", () => {
    const t = resolveRange({ range: "today" }, now);
    expect([t.from.toISOString(), t.to.toISOString(), t.days, t.includesToday]).toEqual(["2026-10-26T00:00:00.000Z", "2026-10-27T00:00:00.000Z", 1, true]);
    expect(t.previous.from.toISOString()).toBe("2026-10-25T00:00:00.000Z");
    const y = resolveRange({ range: "yesterday" }, now);
    expect([y.from.toISOString(), y.to.toISOString(), y.includesToday]).toEqual(["2026-10-25T00:00:00.000Z", "2026-10-26T00:00:00.000Z", false]);
  });
  it("last N days include today and compare with the N days before", () => {
    const r = resolveRange({ range: "7d" }, now);
    expect(r.from.toISOString()).toBe("2026-10-20T00:00:00.000Z");
    expect(r.days).toBe(7);
    expect(r.previous.from.toISOString()).toBe("2026-10-13T00:00:00.000Z");
    expect(r.previous.to.toISOString()).toBe(r.from.toISOString());
  });
  it("defaults to 30 days", () => {
    expect(resolveRange({}, now).days).toBe(30);
    expect(resolveRange({ range: "bogus" }, now).key).toBe("30d");
  });
  it("custom ranges are inclusive, validated, and capped", () => {
    const c = resolveRange({ from: "2026-10-01", to: "2026-10-10" }, now);
    expect([c.key, c.days, c.to.toISOString()]).toEqual(["custom", 10, "2026-10-11T00:00:00.000Z"]);
    expect(resolveRange({ from: "2026-10-10", to: "2026-10-01" }, now).key).toBe("30d");
    expect(resolveRange({ from: "2026-02-31", to: "2026-03-05" }, now).key).toBe("30d");
    expect(resolveRange({ from: "2024-01-01", to: "2026-10-01" }, now).key).toBe("30d");
    expect(resolveRange({ from: "2026-12-01", to: "2026-12-05" }, now).key).toBe("30d");
  });
  it("clamps a custom end date in the future to today", () => {
    expect(resolveRange({ from: "2026-10-20", to: "2026-11-30" }, now).to.toISOString()).toBe("2026-10-27T00:00:00.000Z");
  });
});

describe("formatting and comparison", () => {
  it("percentChange is null without a baseline", () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 10)).toBe(-50);
  });
  it("rates show — for an empty denominator", () => {
    expect(formatRate(0, 0)).toBe("—");
    expect(formatRate(1, 4)).toBe("25.0%");
  });
  it("durations", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(84_000)).toBe("1m 24s");
    expect(formatDuration(3_900_000)).toBe("1h 05m");
  });
});
