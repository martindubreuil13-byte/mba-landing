import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ rpc }) }));

import { attributeCampaignBooking, signAttribution } from "./booking-attribution";
import { attributionCookie } from "./intelligence";

const LINK = "3f1c2b9e-4d5a-4e6f-8a7b-9c0d1e2f3a4b";

describe("attributeCampaignBooking (moved out of the public booking route, behaviour unchanged)", () => {
  beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ error: null }); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "test-secret"); });
  afterEach(() => vi.unstubAllEnvs());

  it("records the booking against the clicked campaign link when the signed cookie is valid", async () => {
    const signed = signAttribution(LINK)!;
    await attributeCampaignBooking(`a=1; ${attributionCookie}=${signed}; b=2`, "BOOK-REF-1");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("attribute_campaign_booking", { booking_ref: "BOOK-REF-1", link: LINK });
  });
  it("does nothing without a cookie header or without the attribution cookie", async () => {
    await attributeCampaignBooking(null, "BOOK-REF-1");
    await attributeCampaignBooking("a=1; b=2", "BOOK-REF-1");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does nothing for a forged, tampered or expired cookie", async () => {
    const signed = signAttribution(LINK)!;
    const tampered = signed.slice(0, -1) + (signed.endsWith("0") ? "1" : "0");
    await attributeCampaignBooking(`${attributionCookie}=${tampered}`, "BOOK-REF-1");
    await attributeCampaignBooking(`${attributionCookie}=${LINK}.1700000000000.${"a".repeat(64)}`, "BOOK-REF-1");
    await attributeCampaignBooking(`${attributionCookie}=garbage`, "BOOK-REF-1");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("never lets an attribution failure break a booking that already succeeded", async () => {
    rpc.mockRejectedValue(new Error("database down"));
    await expect(attributeCampaignBooking(`${attributionCookie}=${signAttribution(LINK)!}`, "BOOK-REF-1")).resolves.toBeUndefined();
  });
});
