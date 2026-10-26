import { describe, expect, it } from "vitest";
import { consentRequiredFor } from "./regions";
import { decide, parseStored, serializeChoice, CONSENT_MAX_AGE_MS } from "./policy";
import { hasAdminSessionCookie, hasPrivacySignal, isAdminPath } from "./signals";

describe("where consent is required", () => {
  it("requires opt-in in the EEA, UK, Switzerland, Brazil and Quebec", () => {
    for (const c of ["DE", "FR", "EE", "IE", "SE", "NO", "IS", "GB", "CH", "BR", "de", " fr "]) expect(consentRequiredFor(c), c).toBe(true);
    expect(consentRequiredFor("CA", "QC")).toBe(true);
    expect(consentRequiredFor("CA", "qc")).toBe(true);
  });
  it("does not require it for opt-out regions", () => {
    for (const c of ["US", "AU", "JP", "MX", "IN"]) expect(consentRequiredFor(c), c).toBe(false);
    expect(consentRequiredFor("CA", "ON")).toBe(false);
    expect(consentRequiredFor("CA", "BC")).toBe(false);
  });
  it("fails closed when the location is unknown or malformed", () => {
    for (const c of [null, undefined, "", "XX1", "??", "United States"]) expect(consentRequiredFor(c as string), String(c)).toBe(true);
    expect(consentRequiredFor("CA", null)).toBe(true); // Canada without a region could be Quebec
  });
});

describe("the consent decision", () => {
  const granted = { v: 1 as const, choice: "granted" as const, at: 1 };
  const denied = { v: 1 as const, choice: "denied" as const, at: 1 };
  it("a privacy signal always wins, even over an earlier accept, and shows no banner", () => {
    expect(decide({ signal: true, stored: granted, required: false })).toBe("blocked_signal");
    expect(decide({ signal: true, stored: null, required: true })).toBe("blocked_signal");
  });
  it("respects a stored choice", () => {
    expect(decide({ signal: false, stored: denied, required: false })).toBe("blocked_declined");
    expect(decide({ signal: false, stored: granted, required: true })).toBe("load");
  });
  it("without a stored choice: waits for the region, asks where consent is required, runs elsewhere", () => {
    expect(decide({ signal: false, stored: null, required: null })).toBe("pending");
    expect(decide({ signal: false, stored: null, required: true })).toBe("ask");
    expect(decide({ signal: false, stored: null, required: false })).toBe("load");
  });
  it("never loads while pending or asking (no cookie before consent)", () => {
    for (const required of [null, true]) expect(decide({ signal: false, stored: null, required })).not.toBe("load");
  });
});

describe("stored choice", () => {
  const now = 1_000_000_000_000;
  it("round-trips", () => expect(parseStored(serializeChoice("granted", now), now + 1000)).toMatchObject({ choice: "granted" }));
  it("expires after 12 months so the question is asked again", () => {
    expect(parseStored(serializeChoice("denied", now), now + CONSENT_MAX_AGE_MS - 1)).not.toBeNull();
    expect(parseStored(serializeChoice("denied", now), now + CONSENT_MAX_AGE_MS + 1)).toBeNull();
  });
  it("ignores junk, wrong versions and future timestamps", () => {
    for (const raw of [null, "", "nope", "{}", '{"v":2,"choice":"granted","at":1}', '{"v":1,"choice":"maybe","at":1}', JSON.stringify({ v: 1, choice: "granted", at: now + 10 * 86400000 })]) {
      expect(parseStored(raw, now), String(raw)).toBeNull();
    }
  });
});

describe("signals", () => {
  it("detects GPC and every DNT form", () => {
    expect(hasPrivacySignal({ globalPrivacyControl: true })).toBe(true);
    expect(hasPrivacySignal({ doNotTrack: "1" })).toBe(true);
    expect(hasPrivacySignal({ doNotTrack: "yes" })).toBe(true);
    expect(hasPrivacySignal({ msDoNotTrack: "1" })).toBe(true);
    expect(hasPrivacySignal({}, "1")).toBe(true);
    expect(hasPrivacySignal({ doNotTrack: "0", globalPrivacyControl: false })).toBe(false);
    expect(hasPrivacySignal({ doNotTrack: null })).toBe(false);
    expect(hasPrivacySignal(undefined)).toBe(false);
  });
  it("detects the admin session cookie (including chunked cookies) and admin paths", () => {
    expect(hasAdminSessionCookie("a=1; sb-abcd-auth-token=xyz; b=2")).toBe(true);
    expect(hasAdminSessionCookie("sb-abcd-auth-token.0=xyz")).toBe(true);
    expect(hasAdminSessionCookie("_ga=1; theme=dark")).toBe(false);
    expect(hasAdminSessionCookie("")).toBe(false);
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/leads")).toBe(true);
    expect(isAdminPath("/administration")).toBe(false);
    expect(isAdminPath("/answers/admin")).toBe(false);
  });
});
