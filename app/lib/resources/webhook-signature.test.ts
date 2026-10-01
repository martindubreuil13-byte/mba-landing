import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { verifyResendWebhook } from "./webhook-signature";

const key = Buffer.from("test-webhook-key");
const secret = `whsec_${key.toString("base64")}`;
const body = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
const sign = (id: string, ts: string, payload = body) => `v1,${createHmac("sha256", key).update(`${id}.${ts}.${payload}`).digest("base64")}`;
const now = 1_800_000_000;

describe("Resend webhook signature", () => {
  const ts = String(now);
  it("accepts a correctly signed, fresh request", () => {
    expect(verifyResendWebhook({ secret, id: "msg_1", timestamp: ts, signatureHeader: sign("msg_1", ts), rawBody: body, now })).toBe(true);
  });
  it("accepts when one of several signatures matches", () => {
    expect(verifyResendWebhook({ secret, id: "msg_1", timestamp: ts, signatureHeader: `v1,AAAA ${sign("msg_1", ts)}`, rawBody: body, now })).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyResendWebhook({ secret, id: "msg_1", timestamp: ts, signatureHeader: sign("msg_1", ts), rawBody: body.replace("delivered", "bounced"), now })).toBe(false);
  });
  it("rejects a wrong secret, missing headers and stale timestamps", () => {
    expect(verifyResendWebhook({ secret: "whsec_d3Jvbmc=", id: "msg_1", timestamp: ts, signatureHeader: sign("msg_1", ts), rawBody: body, now })).toBe(false);
    expect(verifyResendWebhook({ secret, id: null, timestamp: ts, signatureHeader: sign("msg_1", ts), rawBody: body, now })).toBe(false);
    expect(verifyResendWebhook({ secret, id: "msg_1", timestamp: String(now - 3600), signatureHeader: sign("msg_1", String(now - 3600)), rawBody: body, now })).toBe(false);
  });
});
