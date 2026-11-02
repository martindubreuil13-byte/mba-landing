import { describe, expect, it, vi } from "vitest";
import vm from "node:vm";
import { readFileSync } from "node:fs";

vi.mock("server-only", () => ({}));

import { INQUIRY_LIMITS, MAX_RETENTION_MONTHS, REF_PREFILL_DAYS, inquiryPurgeEnabled, inquiryStoreEnabled, refExchangeEnabled, retentionCutoff, retentionMonths } from "./config";
import { isRefShaped, prefillExpired } from "./refs";
import { trustedClientIp } from "./client-ip";
import { issueFormToken, verifyFormToken } from "./form-token";
import { TAKE_REF_FROM_FRAGMENT } from "./take-ref";

const req = (headers: Record<string, string>) => new Request("https://example.test/api/qualify", { method: "POST", headers });
const DAY = 86_400_000;

describe("switches and retention", () => {
  it("every switch is off unless it is exactly the text true", () => {
    for (const name of ["PROGRAM_INQUIRY_STORE_ENABLED", "PROGRAM_INQUIRY_PURGE_ENABLED", "BOOKING_REF_EXCHANGE_ENABLED"]) {
      for (const v of [undefined, "", "1", "TRUE", "yes", "on", " true"]) { if (v === undefined) vi.stubEnv(name, ""); else vi.stubEnv(name, v); }
    }
    expect([inquiryStoreEnabled(), inquiryPurgeEnabled(), refExchangeEnabled()]).toEqual([false, false, false]);
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "1"); expect(inquiryStoreEnabled()).toBe(false);
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true"); expect(inquiryStoreEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("retention defaults to the 24-month maximum and can only be lowered", () => {
    expect(retentionMonths({})).toBe(24);
    expect(retentionMonths({ INQUIRY_RETENTION_MONTHS: "12" })).toBe(12);
    expect(retentionMonths({ INQUIRY_RETENTION_MONTHS: "60" })).toBe(MAX_RETENTION_MONTHS); // cannot be raised past the maximum
    expect(retentionMonths({ INQUIRY_RETENTION_MONTHS: "0" })).toBe(1);
    expect(retentionMonths({ INQUIRY_RETENTION_MONTHS: "-5" })).toBe(1);
    expect(retentionMonths({ INQUIRY_RETENTION_MONTHS: "soon" })).toBe(24);
  });

  it("the cutoff is calendar-month arithmetic in UTC", () => {
    expect(retentionCutoff(Date.parse("2028-11-02T12:00:00Z"), 24).toISOString()).toBe("2026-11-02T12:00:00.000Z");
    expect(retentionCutoff(Date.parse("2026-11-02T12:00:00Z"), 1).toISOString()).toBe("2026-10-02T12:00:00.000Z");
  });

  it("the agreed thresholds", () => {
    expect(INQUIRY_LIMITS.client).toEqual({ windowSeconds: 3600, limit: 5 });
    expect(INQUIRY_LIMITS.email).toEqual({ windowSeconds: 86_400, limit: 3 });
    expect(INQUIRY_LIMITS.globalSoft).toEqual({ windowSeconds: 3600, limit: 60 });
    expect(REF_PREFILL_DAYS).toBe(60);
  });
});

describe("booking references", () => {
  it("only the generated shape is ever looked up", () => {
    expect(isRefShaped("abcdefghijklmnopqrstuvwx")).toBe(true);
    for (const bad of ["", "short", "a".repeat(65), "has space 012345678901", "semi;colon0123456789", "../../etc/passwd0000", undefined, null, 5]) expect(isRefShaped(bad)).toBe(false);
  });

  it("pre-fill expires after 60 days: 59 days is valid, 61 is not, unreadable counts as expired", () => {
    const now = Date.parse("2026-11-02T00:00:00Z");
    expect(prefillExpired(now - 59 * DAY, now)).toBe(false);
    expect(prefillExpired(now - 60 * DAY, now)).toBe(false);
    expect(prefillExpired(now - 61 * DAY, now)).toBe(true);
    expect(prefillExpired(new Date(now - 61 * DAY).toISOString(), now)).toBe(true);
    expect(prefillExpired("not a date", now)).toBe(true);
    expect(prefillExpired(null, now)).toBe(true);
  });
});

describe("the client address used for limits (cannot be bypassed by sending headers)", () => {
  it("on the platform the proxy's own (last) forwarded entry is used, so a forged first entry changes nothing", () => {
    const env = { VERCEL: "1" };
    expect(trustedClientIp(req({ "x-forwarded-for": "203.0.113.9" }), env)).toBe("203.0.113.9");
    expect(trustedClientIp(req({ "x-forwarded-for": "6.6.6.6, 7.7.7.7, 203.0.113.9" }), env)).toBe("203.0.113.9");
    expect(trustedClientIp(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.9", "x-real-ip": "5.5.5.5", "x-vercel-forwarded-for": "4.4.4.4" }), env)).toBe("203.0.113.9");
  });

  it("on the platform without a forwarded chain, the platform's own headers are the fallback", () => {
    const env = { VERCEL: "1" };
    expect(trustedClientIp(req({ "x-vercel-forwarded-for": "203.0.113.9", "x-real-ip": "5.5.5.5" }), env)).toBe("203.0.113.9");
    expect(trustedClientIp(req({ "x-real-ip": "203.0.113.9" }), env)).toBe("203.0.113.9");
  });

  it("with no usable address the answer is null (the per-client limit is skipped rather than sharing one bucket)", () => {
    expect(trustedClientIp(req({}), { VERCEL: "1" })).toBeNull();
    expect(trustedClientIp(req({}), {})).toBeNull();
  });

  it("outside the platform (local runs, tests) the first forwarded entry is used as before", () => {
    expect(trustedClientIp(req({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" }), {})).toBe("198.51.100.4");
  });
});

describe("the form token", () => {
  const keys = () => { vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-for-tests"); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", ""); };

  it("accepts a token that is at least two seconds and less than a day old", () => {
    keys(); const t0 = Date.parse("2026-11-02T10:00:00Z");
    const token = issueFormToken(t0);
    expect(verifyFormToken(token, t0 + 2_500)).toEqual({ ok: true });
    expect(verifyFormToken(token, t0 + 23 * 3_600_000)).toEqual({ ok: true });
    vi.unstubAllEnvs();
  });

  it("refuses a script (too fast), a replay (a day old) and every kind of forgery", () => {
    keys(); const t0 = Date.parse("2026-11-02T10:00:00Z"); const token = issueFormToken(t0);
    expect(verifyFormToken(token, t0 + 500)).toEqual({ ok: false, reason: "too_fast" });
    expect(verifyFormToken(token, t0 + 25 * 3_600_000)).toEqual({ ok: false, reason: "expired" });
    for (const bad of [undefined, null, 5, "", "ft1.1.x", `${token}x`, token.replace("ft1", "ft2"), "ft1.99999999999.abc", "a".repeat(500)]) expect(verifyFormToken(bad as unknown, t0 + 5_000)).toEqual({ ok: false, reason: "invalid" });
    // a token cannot be re-dated: changing the time breaks the signature
    const [v, ts, sig] = token.split("."); expect(verifyFormToken(`${v}.${Number(ts) - 100000}.${sig}`, t0 + 5_000).ok).toBe(false);
    vi.unstubAllEnvs();
  });

  it("is signed with a key of its own: a token made with one secret fails under another", () => {
    keys(); const token = issueFormToken(Date.parse("2026-11-02T10:00:00Z"));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "a-different-secret");
    expect(verifyFormToken(token, Date.parse("2026-11-02T10:00:10Z")).ok).toBe(false);
    vi.unstubAllEnvs();
  });

  it("refuses to run without any server secret", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", ""); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "");
    expect(() => issueFormToken()).toThrow(/not configured/);
    vi.unstubAllEnvs();
  });
});

describe("the page script that takes a reference out of the address", () => {
  function run(href: string) {
    const calls: string[] = [];
    const ctx: Record<string, unknown> = {
      location: { href },
      history: { state: null, replaceState: (_s: unknown, _t: string, url: string) => { calls.push(url); } },
    };
    ctx.window = ctx; ctx.URL = URL;
    vm.runInNewContext(TAKE_REF_FROM_FRAGMENT, ctx);
    return { held: ctx.__mbaRef as string | undefined, calls };
  }
  const ref = "AbCdEfGhIjKlMnOpQrStUvWx";

  it("moves a fragment reference into memory and removes it from the address (query parameters kept)", () => {
    const r = run(`https://example.test/book/complementary-session?source=inquiry-x#r=${ref}`);
    expect(r.held).toBe(ref);
    expect(r.calls).toEqual(["/book/complementary-session?source=inquiry-x"]);
  });

  it("removes a legacy ?ref= from the address too, without holding it (the server already used it)", () => {
    const r = run(`https://example.test/book/complementary-session?source=transition&ref=${ref}`);
    expect(r.held).toBeUndefined();
    expect(r.calls).toEqual(["/book/complementary-session?source=transition"]);
  });

  it("drops anything that is not reference-shaped and leaves a clean address alone", () => {
    expect(run("https://example.test/book/x#r=<script>alert(1)</script>").held).toBeUndefined();
    expect(run("https://example.test/book/x#r=short").held).toBeUndefined();
    expect(run("https://example.test/book/x?source=transition").calls).toEqual([]);
    expect(run("https://example.test/book/x#other").calls).toEqual([]);
  });

  it("cannot throw out of the page", () => {
    const ctx: Record<string, unknown> = { location: {}, history: {}, URL };
    expect(() => vm.runInNewContext(TAKE_REF_FROM_FRAGMENT, ctx)).not.toThrow();
  });

  it("is wired to the booking page before the booking experience, and the experience never puts a reference in a URL", () => {
    const page = readFileSync("app/book/[meetingType]/page.tsx", "utf8");
    expect(page.indexOf("TAKE_REF_FROM_FRAGMENT }}")).toBeGreaterThan(-1);
    expect(page.indexOf("TAKE_REF_FROM_FRAGMENT }}")).toBeLessThan(page.indexOf("<BookingExperience"));
    const exp = readFileSync("app/components/scheduling/BookingExperience.tsx", "utf8");
    expect(exp).toContain('"/api/scheduling/booking-context", { method: "POST"');
    expect(exp).not.toMatch(/booking-context\?/);
    expect(exp).toContain("delete w.__mbaRef");
  });
});
