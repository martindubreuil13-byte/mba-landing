import { describe, expect, it } from "vitest";
import { canAdvanceDelivery, mapProviderEvent } from "./delivery-status";

describe("delivery status machine", () => {
  it("moves forward only", () => {
    expect(canAdvanceDelivery("accepted", "queued")).toBe(true);
    expect(canAdvanceDelivery("queued", "sent")).toBe(true);
    expect(canAdvanceDelivery("sent", "delivered")).toBe(true);
    expect(canAdvanceDelivery("delivered", "sent")).toBe(false);
    expect(canAdvanceDelivery("delivered", "queued")).toBe(false);
    expect(canAdvanceDelivery("queued", "queued")).toBe(false);
  });
  it("lets a late bounce follow delivered, but not a bounced email recover", () => {
    expect(canAdvanceDelivery("delivered", "bounced")).toBe(true);
    expect(canAdvanceDelivery("bounced", "delivered")).toBe(false);
  });
  it("does not mark a delivered email failed", () => {
    expect(canAdvanceDelivery("delivered", "failed")).toBe(false);
    expect(canAdvanceDelivery("queued", "failed")).toBe(true);
  });
  it("only a provider delivered event produces 'delivered'", () => {
    expect(mapProviderEvent("email.delivered").status).toBe("delivered");
    expect(mapProviderEvent("email.sent").status).toBe("sent");
    expect(mapProviderEvent("email.bounced").status).toBe("bounced");
    expect(mapProviderEvent("email.failed").status).toBe("failed");
    expect(mapProviderEvent("email.suppressed").status).toBe("failed");
    expect(mapProviderEvent("email.opened").status).toBeNull();
    expect(mapProviderEvent("email.complained")).toEqual({ status: null, complaint: true });
  });
});
