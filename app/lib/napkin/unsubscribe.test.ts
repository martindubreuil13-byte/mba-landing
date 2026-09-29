import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe";

const previous = process.env.NAPKIN_UNSUBSCRIBE_SECRET;

afterEach(() => {
  if (previous === undefined) delete process.env.NAPKIN_UNSUBSCRIBE_SECRET;
  else process.env.NAPKIN_UNSUBSCRIBE_SECRET = previous;
});

describe("unsubscribe tokens", () => {
  it("round-trips an opaque lead id", () => {
    process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
    const token = createUnsubscribeToken("lead-id-123");
    expect(verifyUnsubscribeToken(token)).toBe("lead-id-123");
  });

  it("rejects a modified token without exposing a lead", () => {
    process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";
    const token = createUnsubscribeToken("lead-id-123");
    expect(verifyUnsubscribeToken(`${token}x`)).toBeNull();
    expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
  });
});
