import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
import { createDownloadToken, isSignedDownloadToken, verifyDownloadToken } from "./download-token";
import { createConfirmationToken, verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

const REQ = "11111111-1111-1111-1111-111111111111";
const RES = "22222222-2222-2222-2222-222222222222";

describe("signed download token", () => {
  it("round-trips and is scoped to the request and resource in its payload", () => {
    const t = createDownloadToken(REQ, RES);
    expect(isSignedDownloadToken(t)).toBe(true);
    expect(verifyDownloadToken(t)).toEqual({ ok: true, requestId: REQ, resourceId: RES });
  });
  it("rejects tampering with any part (request, resource, expiry, signature)", () => {
    const [v, req, res, exp, sig] = createDownloadToken(REQ, RES).split(".");
    const other = "33333333-3333-3333-3333-333333333333";
    for (const forged of [`${v}.${other}.${res}.${exp}.${sig}`, `${v}.${req}.${other}.${exp}.${sig}`, `${v}.${req}.${res}.${Number(exp) + 999}.${sig}`, `${v}.${req}.${res}.${exp}.${sig.slice(0, -2)}AA`]) {
      expect(verifyDownloadToken(forged)).toEqual({ ok: false, reason: "invalid" });
    }
  });
  it("expires", () => {
    const now = Date.now();
    const t = createDownloadToken(REQ, RES, now, 1);
    expect(verifyDownloadToken(t, now + 3_600_000).ok).toBe(true);
    expect(verifyDownloadToken(t, now + 2 * 86_400_000)).toEqual({ ok: false, reason: "expired" });
  });
  it("is durable by default (a year)", () => {
    const now = Date.now();
    const t = createDownloadToken(REQ, RES, now);
    expect(verifyDownloadToken(t, now + 364 * 86_400_000).ok).toBe(true);
    expect(verifyDownloadToken(t, now + 366 * 86_400_000).ok).toBe(false);
  });
  it("cannot be confused with a confirmation or unsubscribe token, in either direction", () => {
    expect(verifyDownloadToken(createConfirmationToken("lead-1")).ok).toBe(false);
    expect(verifyDownloadToken(createUnsubscribeToken("lead-1")).ok).toBe(false);
    expect(verifyConfirmationToken(createDownloadToken(REQ, RES)).ok).toBe(false);
  });
  it("rejects a bare request id (that is the legacy form, handled separately) and garbage", () => {
    for (const bad of [REQ, "", "d1", "d1.a.b.c", "x.y.z.w.v"]) expect(verifyDownloadToken(bad).ok).toBe(false);
  });
});
