import { describe, expect, it } from "vitest";
import { computeFunnel, computeTrend, conversion, formatRate, ratio, resolveDateRange, type FunnelEvent, type FunnelRequest } from "./funnel";

const ev = (event_name: string, session_id: string | null, extra: Partial<FunnelEvent> = {}): FunnelEvent => ({
  event_name,
  session_id,
  cta_location: null,
  created_at: "2026-10-01T10:00:00.000Z",
  metadata: null,
  lead_id: null,
  request_id: null,
  ...extra,
});
const submitted = (session: string, cta = "top", consent = "pending_confirmation"): FunnelEvent => ev("resource_form_submitted", session, { cta_location: cta, metadata: { consent } });
const req = (id: string, extra: Partial<FunnelRequest> = {}): FunnelRequest => ({
  id,
  lead_id: `lead-${id}`,
  requested_at: "2026-10-01T10:00:00.000Z",
  delivery_status: "delivered",
  download_count: 0,
  benefit_fulfilled_at: null,
  opted_in_this_request: true,
  lead_consent: "pending",
  ...extra,
});

describe("conversion (same unit, never capped)", () => {
  it("is numerator / denominator when the numerator is a subset", () => {
    const c = conversion("x", "session", new Set(["a"]), new Set(["a", "b", "c", "d"]));
    expect(c.rate).toBe(0.25);
    expect(c.warning).toBeNull();
  });
  it("shows no rate and raises a warning when the numerator is not a subset of the denominator", () => {
    const c = conversion("CTA click → request", "session", new Set(["a", "z"]), new Set(["a"]));
    expect(c.rate).toBeNull();
    expect(c.numerator).toBe(2);
    expect(c.denominator).toBe(1);
    expect(c.warning).toMatch(/1 of 2 sessions/);
  });
  it("shows no rate when there is no denominator, without a warning", () => {
    const c = conversion("x", "request", new Set(), new Set());
    expect(c.rate).toBeNull();
    expect(c.warning).toBeNull();
  });
  it("never produces a rate above 100% by clamping: a legitimate 100% stays 100%, an impossible one is withheld", () => {
    expect(conversion("x", "session", new Set(["a", "b"]), new Set(["a", "b"])).rate).toBe(1);
    expect(conversion("x", "session", new Set(["a", "b", "c"]), new Set(["a", "b"])).rate).toBeNull();
  });
  it("formats a missing rate as an em dash", () => {
    expect(formatRate(null)).toBe("—");
    expect(formatRate(0.5)).toBe("50.0%");
    expect(ratio(1, 0)).toBeNull();
  });
});

describe("computeFunnel", () => {
  const events: FunnelEvent[] = [
    ev("resource_page_view", "s1"), ev("resource_page_view", "s1"), ev("resource_page_view", "s2"), ev("resource_page_view", "s3"), ev("resource_page_view", "s4"),
    ev("resource_read_started", "s1"), ev("resource_read_started", "s2"), ev("resource_read_completed", "s1"),
    ev("resource_cta_clicked", "s1", { cta_location: "top" }), ev("resource_cta_clicked", "s2", { cta_location: "end" }), ev("resource_cta_clicked", "s2", { cta_location: "end" }),
    ev("resource_form_opened", "s1", { cta_location: "top" }),
    submitted("s1", "top"), submitted("s2", "end", "existing"),
    ev("resource_membership_blocked", "s3", { metadata: { reason: "unsubscribed" } }), ev("resource_membership_blocked", "s4", { metadata: { reason: "suppressed" } }),
    ev("resource_opt_in_confirmed", null, { lead_id: "lead-r1", metadata: { benefit: "unlocked" } }),
    ev("resource_benefit_fulfilled", null, { lead_id: "lead-r1", request_id: "r1", metadata: { via: "confirmation" } }),
    ev("resource_benefit_fulfilled", null, { lead_id: "lead-r3", request_id: "r3", metadata: { via: "existing_member" } }),
    ev("resource_download_started", null), ev("resource_download_started", null),
  ];
  const requests: FunnelRequest[] = [
    req("r1", { benefit_fulfilled_at: "2026-10-01T10:05:00Z", lead_consent: "opted_in", download_count: 1 }),
    req("r2", { lead_consent: "pending", delivery_status: "queued" }),
    req("r3", { opted_in_this_request: false, benefit_fulfilled_at: "2026-10-01T10:06:00Z", lead_consent: "opted_in", download_count: 0 }),
    req("r4", { lead_consent: "opted_out", delivery_status: "bounced" }),
    req("r5", { lead_consent: "suppressed", delivery_status: "failed" }),
  ];
  const f = computeFunnel(events, requests);

  it("counts public-layer activity in the right units", () => {
    expect(f.pageViews).toBe(5);
    expect(f.sessions).toBe(4);
    expect([f.readStarts, f.readCompletions]).toEqual([2, 1]);
    expect(f.ctaClicks).toBe(3);
    expect(f.ctaSessions).toBe(2);
  });
  it("separates membership requests from members asking again, and counts pending ones", () => {
    expect([f.membershipRequests, f.existingMemberRequests]).toEqual([4, 1]);
    expect(f.pendingConfirmations).toBe(1);
    expect(f.confirmedMembers).toBe(1);
  });
  it("counts ignored attempts by reason (never shown to visitors)", () => {
    expect(f.blockedAttempts).toEqual({ unsubscribed: 1, suppressed: 1 });
  });
  it("counts unlocked benefits by how they were unlocked, and downloads", () => {
    expect([f.benefitsFulfilled, f.fulfilledByConfirmation, f.fulfilledExistingMember]).toEqual([2, 1, 1]);
    expect(f.downloadStarts).toBe(2);
    expect(f.requestsDownloaded).toBe(1);
  });
  it("tallies delivery without conflating delivered and queued, and counts failures", () => {
    expect(f.delivery.delivered).toBe(2);
    expect(f.delivery.queued).toBe(1);
    expect(f.deliveryFailures).toBe(2);
  });
  it("counts people who unsubscribed or were suppressed after requesting", () => {
    expect([f.unsubscribedMembers, f.suppressedMembers]).toEqual([1, 1]);
  });
  it("uses the same unit on both sides of every conversion", () => {
    const c = f.conversions;
    expect([c.viewToCta.unit, c.ctaToRequest.unit, c.viewToRequest.unit, c.requestToConfirmed.unit, c.confirmedToFulfilled.unit, c.fulfilledToDownloaded.unit]).toEqual(["session", "session", "session", "request", "member", "request"]);
    expect(c.viewToCta.rate).toBe(2 / 4); // sessions with a CTA click / sessions with a view
    expect(c.ctaToRequest.rate).toBe(1); // both CTA sessions made a request
    expect(c.viewToRequest.rate).toBe(2 / 4);
    expect(c.requestToConfirmed.rate).toBe(1 / 4); // requests whose person confirmed / membership requests
    expect(c.confirmedToFulfilled.rate).toBe(1);
    expect(c.fulfilledToDownloaded.rate).toBe(1 / 2); // unlocked requests downloaded / unlocked requests
    expect(f.integrityWarnings).toEqual([]);
  });
  it("every rate is a ratio of same-unit sets: none exceeds 1, none is capped", () => {
    for (const c of Object.values(f.conversions)) if (c.rate !== null) expect(c.rate).toBeLessThanOrEqual(1);
  });
});

describe("analytics integrity", () => {
  it("warns, and shows no rate, when more sessions made a request than viewed the page", () => {
    const f = computeFunnel([ev("resource_page_view", "s1"), submitted("s1"), submitted("s2"), submitted("s3")], []);
    expect(f.conversions.viewToRequest.rate).toBeNull();
    expect(f.conversions.viewToRequest.numerator).toBe(3);
    expect(f.conversions.viewToRequest.denominator).toBe(1);
    expect(f.integrityWarnings.some((w) => /Page view → membership request/.test(w))).toBe(true);
  });
  it("warns when CTA-click sessions are missing from the page-view sessions (events outside the range)", () => {
    const f = computeFunnel([ev("resource_page_view", "s1"), ev("resource_cta_clicked", "s9", { cta_location: "top" })], []);
    expect(f.conversions.viewToCta.rate).toBeNull();
    expect(f.integrityWarnings.length).toBeGreaterThan(0);
  });
  it("shows no rate and no warning when there is simply no data", () => {
    const f = computeFunnel([], []);
    expect(Object.values(f.conversions).every((c) => c.rate === null && c.warning === null)).toBe(true);
    expect(f.integrityWarnings).toEqual([]);
  });
  it("a confirmed member whose benefit did not unlock lowers the confirmation→unlock rate honestly", () => {
    const f = computeFunnel(
      [ev("resource_opt_in_confirmed", null, { lead_id: "a", metadata: { benefit: "unlocked" } }), ev("resource_opt_in_confirmed", null, { lead_id: "b", metadata: { benefit: "none" } })],
      []
    );
    expect(f.conversions.confirmedToFulfilled.rate).toBe(0.5);
  });
  it("per-CTA click→request is sessions over sessions and is withheld when not comparable", () => {
    const ok = computeFunnel([ev("resource_cta_clicked", "s1", { cta_location: "top" }), submitted("s1", "top")], []);
    expect(ok.byCta.top.clickToRequest.rate).toBe(1);
    const bad = computeFunnel([ev("resource_cta_clicked", "s1", { cta_location: "top" }), submitted("s2", "top")], []);
    expect(bad.byCta.top.clickToRequest.rate).toBeNull();
    expect(bad.integrityWarnings.length).toBeGreaterThan(0);
  });
});

describe("computeTrend", () => {
  it("zero-fills days and counts requests per day with a same-unit conversion", () => {
    const events = [
      ev("resource_page_view", "a", { created_at: "2026-10-01T09:00:00Z" }),
      ev("resource_page_view", "b", { created_at: "2026-10-01T10:00:00Z" }),
      { ...submitted("a"), created_at: "2026-10-01T11:00:00Z" },
      ev("resource_page_view", "c", { created_at: "2026-10-03T10:00:00Z" }),
    ];
    const days = computeTrend(events, "2026-10-01", "2026-10-03");
    expect(days.map((d) => d.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(days[0]).toMatchObject({ views: 2, requests: 1 });
    expect(days[0].conversion.rate).toBe(0.5);
    expect(days[1].conversion.rate).toBeNull();
    expect(days[2].conversion.rate).toBe(0); // viewed, did not request
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
