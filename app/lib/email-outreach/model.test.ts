import { describe, expect, it } from "vitest";
import { MAX_DRAFT_BYTES, decideReview, draftInput, draftLabel, isDirty, isEmail, normalizeEmail, reviewInput, splitName } from "./model";

const lead = "8ab4b9aa-e272-48d6-8861-b25198fa7b12";
const valid = { recipientEmail: "ada@example.com", recipientName: "Ada Lovelace", leadId: null, subject: "Hello", previewText: "", operations: [{ insert: "Hi Ada\n" }] };
const eligible = { state: "Eligible", reason: "Recorded marketing opt-in" };
const unknown = { state: "Unknown", reason: "No verified permission" };
const recent = [{ sentAt: "2026-11-20T00:00:00Z", subject: "Earlier" }];
const decide = (over: Partial<Parameters<typeof decideReview>[0]> = {}) =>
  decideReview({ candidate: eligible, recipientCount: 1, exclusionReason: null, hasException: false, recent: [], acknowledgeRecent: false, ...over });

describe("addresses and names", () => {
  it("normalizes and validates addresses", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(isEmail(" ada@example.com ")).toBe(true);
    for (const bad of ["", "ada", "ada@", "a b@example.com", "x".repeat(250) + "@example.com"]) expect(isEmail(bad)).toBe(false);
  });
  it("splits an optional name", () => {
    expect(splitName("Ada Lovelace")).toEqual({ first: "Ada", last: "Lovelace" });
    expect(splitName("  Ada  King  Lovelace ")).toEqual({ first: "Ada", last: "King Lovelace" });
    expect(splitName("Ada")).toEqual({ first: "Ada", last: null });
    expect(splitName("   ")).toEqual({ first: "", last: null });
  });
});

describe("draft input", () => {
  it("accepts a complete draft and an empty one (a draft may be unfinished)", () => {
    expect(draftInput.safeParse(valid).success).toBe(true);
    expect(draftInput.safeParse({ ...valid, recipientEmail: "", recipientName: "", subject: "", operations: [] }).success).toBe(true);
    expect(draftInput.safeParse({ ...valid, id: lead, leadId: lead }).success).toBe(true);
  });
  it("rejects header-injection style line breaks, oversize fields, unknown fields and huge messages", () => {
    for (const bad of [{ subject: "a\nb" }, { recipientEmail: "a@b.co\r\nBcc: x@y.z" }, { subject: "x".repeat(181) }, { previewText: "x".repeat(161) },
      { recipientName: "x".repeat(121) }, { operations: Array(1501).fill({ insert: "a" }) }, { sneaky: true }, { leadId: "not-a-uuid" },
      { operations: [{ insert: "x".repeat(MAX_DRAFT_BYTES) }] }]) {
      expect(draftInput.safeParse({ ...valid, ...bad }).success, JSON.stringify(bad).slice(0, 40)).toBe(false);
    }
  });
  it("review input takes only a draft id, documented evidence and a recent-send acknowledgement", () => {
    expect(reviewInput.safeParse({ draftId: lead }).success).toBe(true);
    expect(reviewInput.safeParse({ draftId: lead, acknowledgeRecent: true, exception: { basis: "express_permission", reason: "Asked me to write", evidence: "Email thread of 2026-11-10 in the inbox" } }).success).toBe(true);
    expect(reviewInput.safeParse({ draftId: lead, acknowledgeRecent: false }).success).toBe(false);
    expect(reviewInput.safeParse({ draftId: lead, exception: { basis: "express_permission", reason: "short", evidence: "short" } }).success).toBe(false);
    expect(reviewInput.safeParse({ draftId: lead, ids: [lead] }).success).toBe(false);
  });
});

describe("what must happen before one email can be sent", () => {
  it("lets an opted-in contact through", () => expect(decide()).toEqual({ status: "ready" }));

  it("blocks a contact who cannot be mailed, with the existing reason and no override", () => {
    for (const reason of ["Unsubscribed", "Suppressed", "Known bounce, complaint, or provider suppression"]) {
      expect(decide({ candidate: { state: "Not eligible", reason }, recipientCount: 0, exclusionReason: reason })).toEqual({ status: "blocked", reason });
      // Documented evidence does not unlock a suppressed or unsubscribed contact: the shared review already excluded them.
      expect(decide({ candidate: { state: "Not eligible", reason }, recipientCount: 0, exclusionReason: reason, hasException: true })).toEqual({ status: "blocked", reason });
    }
  });
  it("blocks an archived or missing contact", () => {
    expect(decide({ candidate: null, recipientCount: 0, exclusionReason: "Archived or unavailable" })).toEqual({ status: "blocked", reason: "Archived or unavailable" });
    expect(decide({ candidate: null, recipientCount: 0, exclusionReason: null })).toEqual({ status: "blocked", reason: "Archived or unavailable" });
  });

  it("asks for a documented basis when no marketing permission is recorded, offering any exception already on file", () => {
    expect(decide({ candidate: unknown, recipientCount: 0, exclusionReason: unknown.reason })).toEqual({ status: "needs_exception", prefill: null });
    const onFile = { basis: "express_permission", reason: "Asked me to write", evidence: "Thread in the inbox" };
    expect(decide({ candidate: { ...unknown, administrativeException: onFile }, recipientCount: 0, exclusionReason: unknown.reason })).toEqual({ status: "needs_exception", prefill: onFile });
  });
  it("lets an unknown contact through once documented evidence is supplied", () => {
    expect(decide({ candidate: unknown, recipientCount: 1, hasException: true })).toEqual({ status: "ready" });
  });
  it("does not let evidence through if the shared review still excluded the recipient (for example an invalid address)", () => {
    expect(decide({ candidate: unknown, recipientCount: 0, hasException: true, exclusionReason: "Invalid email address" })).toEqual({ status: "blocked", reason: "Invalid email address" });
  });

  it("needs an explicit acknowledgement after a recent individual email to the same address, and only then", () => {
    expect(decide({ recent })).toEqual({ status: "needs_recent_acknowledgement" });
    expect(decide({ recent, acknowledgeRecent: true })).toEqual({ status: "ready" });
  });
  it("checks permission before recent sends, so a blocked contact is never asked to confirm anything", () => {
    expect(decide({ candidate: { state: "Not eligible", reason: "Unsubscribed" }, recipientCount: 0, exclusionReason: "Unsubscribed", recent })).toMatchObject({ status: "blocked" });
    expect(decide({ candidate: unknown, recipientCount: 0, exclusionReason: unknown.reason, recent })).toMatchObject({ status: "needs_exception" });
  });
});

describe("draft list helpers", () => {
  it("labels drafts even when unfinished", () => {
    expect(draftLabel({ recipientEmail: "a@b.co", recipientName: "Ada", subject: "Hi" })).toEqual({ who: "Ada", subject: "Hi" });
    expect(draftLabel({ recipientEmail: "a@b.co", recipientName: "", subject: "" })).toEqual({ who: "a@b.co", subject: "No subject yet" });
    expect(draftLabel({ recipientEmail: "", recipientName: "", subject: "Hi" })).toEqual({ who: "No recipient yet", subject: "Hi" });
  });
  it("detects unsaved changes in any field", () => {
    const base = { recipientEmail: "a@b.co", recipientName: "A", subject: "S", previewText: "P", operations: [{ insert: "x\n" }] };
    expect(isDirty(base, { ...base, operations: [{ insert: "x\n" }] })).toBe(false);
    for (const change of [{ recipientEmail: "c@d.co" }, { recipientName: "B" }, { subject: "T" }, { previewText: "Q" }, { operations: [{ insert: "y\n" }] }]) {
      expect(isDirty(base, { ...base, ...change })).toBe(true);
    }
  });
});
