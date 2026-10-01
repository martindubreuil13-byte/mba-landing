import { describe, expect, it } from "vitest";
import { computeFunnel, computeTrend, formatRate, ratio, resolveDateRange, type FunnelEvent } from "./funnel";

const ev = (event_name: string, session_id: string | null, extra: Partial<FunnelEvent> = {}): FunnelEvent => ({
  event_name,
  session_id,
  cta_location: null,
  created_at: "2026-10-01T10:00:00.000Z",
  metadata: null,
  ...extra,
});

const submitted = (consent: string, cta: string, session = "s1"): FunnelEvent =>
  ev("resource_form_submitted", session, { cta_location: cta, metadata: { consent } });

describe("computeFunnel", () => {
  const events: FunnelEvent[] = [
    ev("resource_page_view", "s1"),
    ev("resource_page_view", "s1"), // raw views count twice, sessions once
    ev("resource_page_view", "s2"),
    ev("resource_page_view", "s3"),
    ev("resource_read_started", "s1"),
    ev("resource_read_started", "s2"),
    ev("resource_read_completed", "s1"),
    ev("resource_cta_clicked", "s1", { cta_location: "top" }),
    ev("resource_cta_clicked", "s1", { cta_location: "end" }),
    ev("resource_cta_clicked", "s2", { cta_location: "mid-guide" }),
    ev("resource_form_opened", "s1", { cta_location: "top" }),
    ev("resource_form_opened", "s2", { cta_location: "mid-guide" }),
    submitted("pending_confirmation", "top", "s1"),
    submitted("existing", "mid-guide", "s2"),
    submitted("not_applied", "end", "s3"),
    ev("resource_download_started", null),
    ev("resource_opt_in_confirmed", null),
  ];
  const requests = [
    { requested_at: "x", delivery_status: "queued" as const, download_count: 1 },
    { requested_at: "x", delivery_status: "delivered" as const, download_count: 0 },
    { requested_at: "x", delivery_status: "failed" as const, download_count: 0 },
  ];
  const s = computeFunnel(events, requests);

  it("counts raw views and distinct sessions separately", () => {
    expect(s.pageViews).toBe(4);
    expect(s.sessions).toBe(3);
  });
  it("counts read starts / completions as distinct sessions", () => {
    expect(s.readStarts).toBe(2);
    expect(s.readCompletions).toBe(1);
  });
  it("valid opt-ins = new sign-ups + existing subscribers, excluding suppressed", () => {
    expect(s.submissions).toBe(3);
    expect(s.newSignups).toBe(1);
    expect(s.confirmed).toBe(1);
    expect(s.rates.confirmation).toBe(1);
    expect(s.existingSubscribers).toBe(1);
    expect(s.consentNotApplied).toBe(1);
    expect(s.validOptIns).toBe(2);
  });
  it("computes the documented formulas", () => {
    expect(s.rates.viewToOptIn).toBeCloseTo(2 / 3);
    expect(s.ctaClicks).toBe(3);
    expect(s.ctaSessions).toBe(2);
    expect(s.rates.ctaToOptIn).toBeCloseTo(2 / 2);
    expect(s.rates.optInToDownload).toBeCloseTo(1 / 3);
    expect(s.rates.readCompletion).toBeCloseTo(1 / 2);
  });
  it("attributes per CTA location", () => {
    expect(s.byCta.top).toMatchObject({ clicks: 1, opens: 1, submissions: 1, validOptIns: 1, clickToOptIn: 1 });
    expect(s.byCta["mid-guide"]).toMatchObject({ clicks: 1, validOptIns: 1 });
    expect(s.byCta.end).toMatchObject({ clicks: 1, submissions: 1, validOptIns: 0, clickToOptIn: 0 });
  });
  it("tallies delivery statuses without conflating delivered and queued", () => {
    expect(s.delivery).toMatchObject({ queued: 1, delivered: 1, failed: 1, sent: 0 });
  });
  it("never divides by zero", () => {
    const empty = computeFunnel([], []);
    expect(empty.rates.viewToOptIn).toBeNull();
    expect(formatRate(empty.rates.viewToOptIn)).toBe("—");
    expect(ratio(1, 0)).toBeNull();
    expect(formatRate(0.1234)).toBe("12.3%");
  });
});

describe("computeTrend", () => {
  it("zero-fills days and counts only valid opt-ins", () => {
    const days = computeTrend(
      [
        ev("resource_page_view", "a", { created_at: "2026-10-01T01:00:00Z" }),
        ev("resource_page_view", "b", { created_at: "2026-10-01T02:00:00Z" }),
        { ...submitted("pending_confirmation", "top"), created_at: "2026-10-01T03:00:00Z" },
        { ...submitted("not_applied", "top"), created_at: "2026-10-03T03:00:00Z" },
      ],
      "2026-09-30",
      "2026-10-03"
    );
    expect(days.map((d) => d.date)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(days[1]).toMatchObject({ views: 2, optIns: 1, conversion: 0.5 });
    expect(days[0]).toMatchObject({ views: 0, optIns: 0, conversion: null });
    expect(days[3].optIns).toBe(0);
  });
});

describe("resolveDateRange", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  it("resolves presets ending today", () => {
    expect(resolveDateRange({ range: "7" }, now)).toEqual({ from: "2026-10-04", to: "2026-10-10", preset: "7" });
    expect(resolveDateRange({ range: "90" }, now).from).toBe("2026-07-13");
    expect(resolveDateRange({}, now).preset).toBe("30");
  });
  it("accepts a valid custom range and rejects bad ones", () => {
    expect(resolveDateRange({ range: "custom", from: "2026-09-01", to: "2026-09-30" }, now)).toEqual({ from: "2026-09-01", to: "2026-09-30", preset: "custom" });
    expect(resolveDateRange({ range: "custom", from: "2026-09-30", to: "2026-09-01" }, now).preset).toBe("30");
    expect(resolveDateRange({ range: "custom", from: "nope", to: "2026-09-01" }, now).preset).toBe("30");
    expect(resolveDateRange({ range: "custom", from: "2020-01-01", to: "2026-09-01" }, now).preset).toBe("30");
  });
});
