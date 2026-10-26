import { describe, expect, it } from "vitest";
import { MAX_BODY_BYTES, parseCollectBody, sanitizePath, sanitizeProps, sanitizeReferrer } from "./payload";

const base = {
  sid: "w1234567890abcdef1234",
  entry: { ref: "https://www.linkedin.com/feed/?token=secret", us: "linkedin", land: "/answers/x" },
  pv: [{ id: "view-0001", seq: 1, path: "/answers/x?utm_source=a#frag", title: "X" }],
};
const body = (o: object) => JSON.stringify({ ...base, ...o });

describe("sanitizers", () => {
  it("strips query/fragment and redacts UUID segments", () => {
    expect(sanitizePath("/resources/business-idea-reality-check/result/0b9f1c1e-1c2d-4e5f-8a9b-0123456789ab?x=1")).toBe(
      "/resources/business-idea-reality-check/result/:id"
    );
    expect(sanitizePath("//evil.com")).toBeNull();
    expect(sanitizePath("https://x.com")).toBeNull();
  });
  it("reduces referrers to origin + path and rejects non-http schemes", () => {
    expect(sanitizeReferrer("https://www.google.com/search?q=private+thing")).toEqual({ referrer: "https://www.google.com/search", host: "google.com" });
    expect(sanitizeReferrer("javascript:alert(1)").referrer).toBeNull();
  });
  it("keeps only small primitive props and drops email-like values", () => {
    const p = sanitizeProps({ program: 3, cta: "book", email: "a@b.co", nested: { a: 1 }, "Bad Key": 1, flag: true, long: "x".repeat(500) });
    expect(p).toMatchObject({ program: 3, cta: "book", flag: true });
    expect(p.email).toBeUndefined();
    expect(p.nested).toBeUndefined();
    expect((p.long as string).length).toBe(100);
  });
});

describe("parseCollectBody", () => {
  it("accepts a valid batch and sanitises it", () => {
    const b = parseCollectBody(body({ ev: [{ id: "evt-00001", name: "program_cta_click", path: "/work", props: { program: 2 } }] }))!;
    expect(b.pageviews[0].path).toBe("/answers/x");
    expect(b.entry.referrer).toBe("https://www.linkedin.com/feed/");
    expect(b.events[0]).toMatchObject({ name: "program_cta_click" });
  });
  it("rejects invalid JSON, bad session ids, oversized bodies and bad event names", () => {
    expect(parseCollectBody("{nope")).toBeNull();
    expect(parseCollectBody(body({ sid: "short" }))).toBeNull();
    expect(parseCollectBody(" ".repeat(MAX_BODY_BYTES + 1))).toBeNull();
    expect(parseCollectBody(body({ ev: [{ id: "evt-00001", name: "Bad Name!" }] }))).toBeNull();
    expect(parseCollectBody(body({ ev: Array.from({ length: 21 }, (_, i) => ({ id: `evt-${String(i).padStart(5, "0")}`, name: "x_y" })) }))).toBeNull();
  });
  it("drops admin/api pages and refuses an admin landing", () => {
    expect(parseCollectBody(body({ pv: [{ id: "view-0001", seq: 1, path: "/admin/leads" }] }))!.pageviews).toEqual([]);
    expect(parseCollectBody(JSON.stringify({ ...JSON.parse(body({})), entry: { land: "/admin/leads" } }))).toBeNull();
  });
  it("never lets the browser claim a conversion", () => {
    const b = parseCollectBody(
      body({ ev: [{ id: "evt-00001", name: "transition_calendly_clicked" }, { id: "evt-00002", name: "assessment_lead_captured", is_conversion: true }] })
    )!;
    expect(b.events.every((e) => !("is_conversion" in e))).toBe(true);
  });
});
