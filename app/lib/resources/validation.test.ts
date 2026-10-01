import { describe, expect, it } from "vitest";
import { validateEmail } from "./validation";

describe("validateEmail", () => {
  it("trims and lowercases", () => {
    expect(validateEmail("  Martin@Example.COM ")).toEqual({ ok: true, email: "martin@example.com" });
    expect(validateEmail("a+tag@sub.example.co.uk")).toMatchObject({ ok: true });
  });
  it.each([
    ["", /where to send/],
    ["   ", /where to send/],
    ["no-at-sign.com", /missing an “@”/],
    ["a@b", /does not look right/],
    ["a@@b.com", /does not look right/],
    ["a b@c.com", /does not look right/],
    ["a@b..com", /does not look right/],
    ["a@.com", /does not look right/],
  ])("rejects %j with a helpful message", (input, message) => {
    const result = validateEmail(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(message);
  });
  it("rejects non-strings and overlong input", () => {
    expect(validateEmail(undefined).ok).toBe(false);
    expect(validateEmail(`${"a".repeat(250)}@example.com`).ok).toBe(false);
  });
});
