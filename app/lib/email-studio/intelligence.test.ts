import { expect, it } from "vitest";
import { approvedDestination, deliveryOutcome, suspectedScanner } from "./intelligence";

it("allows only configured HTTPS email destinations, excluding unsubscribe and tracking paths", () => {
  expect(approvedDestination("https://example.com/book?a=1&b=2")?.search).toBe("?a=1&b=2");
  for (const url of ["javascript:alert(1)", "//example.com", "http://example.com", "https://user@example.com", "https://modernbusinessarchitect.com/api/unsubscribe?token=x", "https://modernbusinessarchitect.com/campaign/click/example"])
    expect(approvedDestination(url)).toBeNull();
});

it("uses event precedence independently of arrival order", () => {
  expect(deliveryOutcome(["email.delivered", "email.delivery_delayed"])).toBe("Confirmed delivered");
  expect(deliveryOutcome(["email.bounced", "email.delivered"])).toBe("Bounced");
  expect(deliveryOutcome(["email.sent"])).toBe("Unconfirmed");
});

it("separates recognized scanners and prefetches", () => {
  expect(suspectedScanner(new Headers({ "sec-purpose": "prefetch" }))).toBe(true);
  expect(suspectedScanner(new Headers({ "user-agent": "Mimecast scanner" }))).toBe(true);
  expect(suspectedScanner(new Headers({ "user-agent": "Mozilla/5.0" }))).toBe(false);
});

import { vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readAttribution, signAttribution } from "./booking-attribution";

it("accepts signed attribution and rejects tampered and expired cookies", () => {
  vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "fixture");
  vi.useFakeTimers();
  try {
    const id = "8ab4b9aa-e272-48d6-8861-b25198fa7b12";
    const token = signAttribution(id)!;
    expect(readAttribution(token)).toBe(id);
    expect(readAttribution(token.replace("7b12", "7b13"))).toBeNull();
    vi.advanceTimersByTime(7 * 86400_000);
    expect(readAttribution(token)).toBeNull();
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  }
});
