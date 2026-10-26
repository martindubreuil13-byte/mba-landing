import { describe, expect, it } from "vitest";
import { buildTimeline, eventLabel, isSessionId, parseJourneyFilters, summarize, type TimelineSession } from "./journeys-model";

const session: TimelineSession = {
  started_at: "2026-10-26T10:00:00Z", last_seen_at: "2026-10-26T10:03:00Z", landing_path: "/answers/a",
  source_category: "linkedin", source_detail: "linkedin", ai_platform: null, source_evidence: "utm_source:linkedin", engaged_ms: 40000, converted: false,
};
const pv = (seq: number, path: string, at: string, ms = 0) => ({ seq, path, title: null, occurred_at: at, engaged_ms: ms });
const ev = (name: string, at: string, o = {}) => ({ name, path: "/work", occurred_at: at, props: null, origin: "browser" as const, is_conversion: false, conversion_kind: null, ...o });

describe("journey timeline", () => {
  it("orders arrival, page views and events chronologically with exit and landing marked", () => {
    const items = buildTimeline(
      session,
      [pv(2, "/work", "2026-10-26T10:01:00Z", 20000), pv(1, "/answers/a", "2026-10-26T10:00:00Z", 15000)],
      [ev("booking_link_click", "2026-10-26T10:02:00Z")]
    );
    expect(items.map((i) => i.kind)).toEqual(["arrival", "pageview", "pageview", "event"]);
    const views = items.filter((i) => i.kind === "pageview") as Extract<(typeof items)[number], { kind: "pageview" }>[];
    expect(views.map((v) => [v.path, v.isLanding, v.isLast])).toEqual([["/answers/a", true, false], ["/work", false, true]]);
    expect(summarize(items)).toBe("LinkedIn (linkedin) → /answers/a → /work → Booking link click");
  });

  it("never shows the arrival after the first page view, even when the session row was stored later than the back-dated page view", () => {
    const items = buildTimeline({ ...session, started_at: "2026-10-26T10:00:05Z" }, [pv(1, "/answers/a", "2026-10-26T10:00:00Z")], []);
    expect(items.map((i) => i.kind)).toEqual(["arrival", "pageview"]);
    expect(items[0].at).toBe("2026-10-26T10:00:00Z");
  });

  it("puts the arrival before a page view with the same timestamp, and a page view before its events", () => {
    const t = "2026-10-26T10:00:00Z";
    const items = buildTimeline(session, [pv(1, "/", t)], [ev("x_y", t)]);
    expect(items.map((i) => i.kind)).toEqual(["arrival", "pageview", "event"]);
  });

  it("labels AI sessions with the platform and conversions with the business label; only server events are 'confirmed'", () => {
    const items = buildTimeline({ ...session, source_category: "ai_assistant", ai_platform: "ChatGPT" }, [], [
      ev("inquiry_submitted", "2026-10-26T10:01:00Z", { origin: "server", is_conversion: true, conversion_kind: "inquiry" }),
      ev("assessment_lead_captured", "2026-10-26T10:02:00Z"),
    ]);
    expect(items[0]).toMatchObject({ label: "Arrived via AI assistant: ChatGPT" });
    const events = items.filter((i) => i.kind === "event") as Extract<(typeof items)[number], { kind: "event" }>[];
    expect(events[0]).toMatchObject({ label: "Lead confirmed: Inquiry (/lets-talk)", confirmed: true });
    expect(events[1]).toMatchObject({ label: "Assessment lead captured", confirmed: false });
  });

  it("keeps only scalar props and never exposes record references", () => {
    const items = buildTimeline(session, [], [ev("program_cta_click", "2026-10-26T10:01:00Z", { props: { program: 3, nested: { a: 1 }, arr: [1] }, ref_id: "lead-uuid" })]);
    const e = items.find((i) => i.kind === "event") as Extract<(typeof items)[number], { kind: "event" }>;
    expect(e.props).toEqual({ program: 3 });
    expect(JSON.stringify(items)).not.toContain("lead-uuid");
  });

  it("handles a session with no recorded page views", () => {
    expect(buildTimeline(session, [], []).map((i) => i.kind)).toEqual(["arrival"]);
  });
});

describe("filters", () => {
  it("accepts only known values and clamps the page", () => {
    expect(parseJourneyFilters({ source: "linkedin", audience: "ai", outcome: "converted", device: "mobile", page: "3", landing: " /work " })).toEqual({
      source: "linkedin", audience: "ai", outcome: "converted", device: "mobile", page: 3, landing: "/work",
    });
    expect(parseJourneyFilters({ source: "'; drop table", audience: "robot", outcome: "x", device: "tv", page: "-5" })).toEqual({
      source: "", audience: "", outcome: "", device: "", page: 1, landing: "",
    });
  });
  it("validates session ids before they reach a query", () => {
    expect(isSessionId("w1234567890abcdef1234")).toBe(true);
    expect(isSessionId("x")).toBe(false);
    expect(isSessionId("a'b;--aaaaaaaaaaaaaaaa")).toBe(false);
  });
  it("eventLabel", () => expect(eventLabel({ name: "program_cta_click", is_conversion: false, conversion_kind: null })).toBe("Program cta click"));
});
