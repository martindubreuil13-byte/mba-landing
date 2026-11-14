import { expect, it } from "vitest";
import { bookingConversion, reachMetrics } from "./visual-metrics";

it("uses mutually exclusive outcomes and only counts accepted recipients in the breakdown", () => {
  const recipients = ["a", "b", "c", "d"].map((id) => ({ id, delivery: { status: id === "d" ? "failed" : "sent" } }));
  expect(reachMetrics(recipients, [
    { lead_id: "a", event_type: "email.delivered" },
    { lead_id: "a", event_type: "email.delivered" },
    { lead_id: "b", event_type: "email.bounced" },
    { lead_id: "b", event_type: "email.delivered" },
  ])).toEqual({ accepted: 3, delivered: 1, rejected: 1, unconfirmed: 1 });
  expect(reachMetrics(recipients, [])).toEqual({ accepted: 3, delivered: 0, rejected: 0, unconfirmed: 3 });
});
it("distinguishes known zero conversions from missing data and absent denominators", () => {
  expect(bookingConversion(2, 8)).toBe(0.25);
  expect(bookingConversion(0, 8)).toBe(0);
  expect(bookingConversion(0, 0)).toBeNull();
  expect(bookingConversion(undefined, undefined)).toBeNull();
});
