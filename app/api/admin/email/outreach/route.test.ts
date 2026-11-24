import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  admin: vi.fn(), candidates: vi.fn(), insert: vi.fn(),
  getDraft: vi.fn(), saveDraft: vi.fn(), deleteDraft: vi.fn(), attachReview: vi.fn(), contactEmail: vi.fn(),
  findOrCreateContact: vi.fn(), recentOutreach: vi.fn(), deliveryResult: vi.fn(),
}));
const adminId = "11111111-1111-4111-8111-111111111111";
const draftId = "22222222-2222-4222-8222-222222222222";
const leadId = "33333333-3333-4333-8333-333333333333";
const campaignId = "44444444-4444-4444-8444-444444444444";

vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: state.admin }));
vi.mock("@/app/lib/contact-tags/data", () => ({ recipientCandidates: state.candidates }));
vi.mock("@/app/lib/resources/delivery-email", () => ({ DEFAULT_RESOURCE_FROM: "MBA <fixture@example.com>" }));
vi.mock("@/app/lib/email-outreach/server", () => ({
  getDraft: state.getDraft, saveDraft: state.saveDraft, deleteDraft: state.deleteDraft, attachReview: state.attachReview,
  contactEmail: state.contactEmail, findOrCreateContact: state.findOrCreateContact, recentOutreach: state.recentOutreach, deliveryResult: state.deliveryResult,
}));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({
  storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "https://storage.example.com" } }) }) },
  from: (table: string) => { if (table !== "email_campaigns") throw new Error("unexpected table " + table); return { insert: (value: object) => { state.insert(value); return { select: () => ({ single: async () => ({ data: { id: campaignId } }) }) }; } }; },
}) }));

import { POST } from "./route";

const post = (value: unknown, headers: Record<string, string> = { origin: "https://modernbusinessarchitect.com", host: "modernbusinessarchitect.com" }) =>
  POST(new Request("https://modernbusinessarchitect.com/api/admin/email/outreach", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(value) }));

const draft = { id: draftId, recipientEmail: "Ada@Example.com ", recipientName: "Ada Lovelace", leadId: null as string | null, subject: "A quick hello", previewText: "", operations: [{ insert: "Hi Ada, I enjoyed your talk.\n" }], updatedAt: "2026-11-24T00:00:00Z", campaignId: null, sentAt: null as string | null };
const eligible = { id: leadId, name: "Ada Lovelace", email: "ada@example.com", state: "Eligible", reason: "Recorded marketing opt-in" };
const unknown = { ...eligible, state: "Unknown", reason: "No verified permission" };
const evidence = { basis: "express_permission", reason: "She asked me to write", evidence: "Email thread of 2026-11-10 saved in the inbox" };

beforeEach(() => {
  vi.resetAllMocks();
  state.admin.mockResolvedValue({ id: adminId });
  state.getDraft.mockResolvedValue(draft);
  state.findOrCreateContact.mockResolvedValue({ id: leadId, created: false });
  state.candidates.mockResolvedValue([eligible]);
  state.recentOutreach.mockResolvedValue([]);
  state.attachReview.mockResolvedValue(true);
});

describe("access", () => {
  it("requires an admin and a same-origin request, and ignores anything it does not recognise", async () => {
    state.admin.mockResolvedValueOnce(null);
    expect((await post({ op: "delete", id: draftId })).status).toBe(401);
    expect((await post({ op: "delete", id: draftId }, { origin: "https://evil.example", host: "modernbusinessarchitect.com" })).status).toBe(403);
    expect((await post({ op: "send", draftId })).status).toBe(400);
    expect((await post({ op: "review", draftId, ids: [leadId] })).status).toBe(400);
    expect(state.deleteDraft).not.toHaveBeenCalled();
  });
});

describe("drafts", () => {
  const input = { recipientEmail: "ada@example.com", recipientName: "Ada", leadId: null, subject: "Hi", previewText: "", operations: [{ insert: "Hi\n" }] };
  it("saves a new draft and an edit to an existing one", async () => {
    state.saveDraft.mockResolvedValue({ ok: true, draft });
    expect(await (await post({ op: "save", draft: input })).json()).toMatchObject({ draft: { id: draftId } });
    expect((await post({ op: "save", draft: { ...input, id: draftId } })).status).toBe(200);
    expect(state.saveDraft).toHaveBeenLastCalledWith({ ...input, id: draftId });
  });
  it("refuses to edit a draft that was already sent, or one that no longer exists", async () => {
    state.saveDraft.mockResolvedValueOnce({ ok: false, reason: "already_sent" }).mockResolvedValueOnce({ ok: false, reason: "not_found" });
    expect((await post({ op: "save", draft: { ...input, id: draftId } })).status).toBe(409);
    expect((await post({ op: "save", draft: { ...input, id: draftId } })).status).toBe(404);
  });
  it("rejects a malformed draft before touching storage", async () => {
    expect((await post({ op: "save", draft: { ...input, subject: "a\nBcc: x@y.z" } })).status).toBe(400);
    expect(state.saveDraft).not.toHaveBeenCalled();
  });
  it("deletes a draft", async () => {
    state.deleteDraft.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await post({ op: "delete", id: draftId })).status).toBe(200);
    expect((await post({ op: "delete", id: draftId })).status).toBe(404);
  });
  it("reports the delivery result of a sent individual email", async () => {
    state.deliveryResult.mockResolvedValue({ status: "sent", reason: null, providerAccepted: true });
    expect(await (await post({ op: "result", campaignId })).json()).toEqual({ status: "sent", reason: null, providerAccepted: true });
  });
});

describe("review", () => {
  it("creates a one-recipient individual campaign for an opted-in contact, linked to the draft, without sending anything", async () => {
    state.findOrCreateContact.mockResolvedValue({ id: leadId, created: true });
    const response = await post({ op: "review", draftId });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({ status: "ready", campaignId, contact: { id: leadId, email: "ada@example.com", state: "Eligible", created: true }, subject: "A quick hello", from: "MBA <fixture@example.com>", exceptionCount: 0 });
    expect(result.html).toContain("Hi Ada, I enjoyed your talk.");
    expect(state.insert).toHaveBeenCalledTimes(1);
    const row = state.insert.mock.calls[0][0];
    expect(row).toMatchObject({ kind: "outreach", selected_count: 1, selected_contact_ids: [leadId], subject: "A quick hello", exclusions: {} });
    expect(row.recipients).toEqual([{ id: leadId, email: "ada@example.com" }]);
    expect(state.attachReview).toHaveBeenCalledWith(draftId, campaignId);
  });

  it("shows, checks for recent sends, and sends to the contact's stored address, never merely the one typed", async () => {
    state.candidates.mockResolvedValue([{ ...eligible, email: " Ada.Stored@Example.com " }]);
    const result = await (await post({ op: "review", draftId })).json();
    expect(result.contact.email).toBe("ada.stored@example.com");
    expect(state.recentOutreach).toHaveBeenCalledWith("ada.stored@example.com");
    expect(state.insert.mock.calls[0][0].recipients).toEqual([{ id: leadId, email: "ada.stored@example.com" }]);
  });
  it("finds or creates the contact from the typed address, never subscribing it, and passes the optional name", async () => {
    await post({ op: "review", draftId });
    expect(state.findOrCreateContact).toHaveBeenCalledWith("ada@example.com", "Ada Lovelace");
  });
  it("uses the chosen existing contact when its address still matches the draft", async () => {
    state.getDraft.mockResolvedValue({ ...draft, leadId });
    state.contactEmail.mockResolvedValue("ADA@example.com");
    await post({ op: "review", draftId });
    expect(state.findOrCreateContact).not.toHaveBeenCalled();
    expect(state.candidates).toHaveBeenCalledWith([leadId]);
  });
  it("ignores a stale contact link when the address was changed, and resolves the typed address instead", async () => {
    state.getDraft.mockResolvedValue({ ...draft, leadId });
    state.contactEmail.mockResolvedValue("someone.else@example.com");
    await post({ op: "review", draftId });
    expect(state.findOrCreateContact).toHaveBeenCalledWith("ada@example.com", "Ada Lovelace");
  });

  it("asks for documented evidence when no marketing permission is recorded, and creates nothing until it is given", async () => {
    state.candidates.mockResolvedValue([{ ...unknown, administrativeException: { ...evidence, expiresAt: "2026-12-01T00:00:00Z" } }]);
    const result = await (await post({ op: "review", draftId })).json();
    expect(result).toMatchObject({ status: "needs_exception", campaignId: null, contact: { state: "Unknown" }, prefill: { basis: "express_permission" } });
    expect(state.insert).not.toHaveBeenCalled();
    expect(state.attachReview).not.toHaveBeenCalled();
  });
  it("records the documented basis, the admin and the review time on the recipient when evidence is given", async () => {
    state.candidates.mockResolvedValue([unknown]);
    const result = await (await post({ op: "review", draftId, exception: evidence })).json();
    expect(result).toMatchObject({ status: "ready", campaignId, exceptionCount: 1 });
    const [recipient] = state.insert.mock.calls[0][0].recipients;
    expect(recipient).toMatchObject({ id: leadId, email: "ada@example.com", exception: { basis: "express_permission", reason: evidence.reason, evidence: evidence.evidence, adminId } });
    expect(typeof recipient.exception.reviewedAt).toBe("string");
  });
  it.each(["Unsubscribed", "Suppressed", "Known bounce, complaint, or provider suppression"])("blocks a contact who is %s, even if evidence is supplied", async (reason) => {
    state.candidates.mockResolvedValue([{ ...eligible, state: "Not eligible", reason }]);
    for (const extra of [{}, { exception: evidence }]) {
      const result = await (await post({ op: "review", draftId, ...extra })).json();
      expect(result).toMatchObject({ status: "blocked", reason, campaignId: null });
    }
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("blocks an archived contact (not offered by the eligibility lookup) without creating anything", async () => {
    state.candidates.mockResolvedValue([]);
    const result = await (await post({ op: "review", draftId })).json();
    expect(result).toMatchObject({ status: "blocked", campaignId: null, contact: { state: "Archived" } });
    expect(state.insert).not.toHaveBeenCalled();
  });

  it("asks the admin to confirm after a recent individual email to the same address, then proceeds only when they do", async () => {
    state.recentOutreach.mockResolvedValue([{ sentAt: "2026-11-20T00:00:00Z", subject: "Earlier note" }]);
    const first = await (await post({ op: "review", draftId })).json();
    expect(first).toMatchObject({ status: "needs_recent_acknowledgement", campaignId: null, recent: [{ subject: "Earlier note" }] });
    expect(state.insert).not.toHaveBeenCalled();
    const second = await (await post({ op: "review", draftId, acknowledgeRecent: true })).json();
    expect(second).toMatchObject({ status: "ready", campaignId });
    expect(state.insert).toHaveBeenCalledTimes(1);
  });

  it("refuses to hand out a review when another review of the same draft was already sent, or the draft vanished meanwhile", async () => {
    state.attachReview.mockResolvedValueOnce(false);
    const response = await post({ op: "review", draftId });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "already_sent" });
  });
  it("tells the interface why, with a code, when a draft cannot be saved or reviewed", async () => {
    state.saveDraft.mockResolvedValueOnce({ ok: false, reason: "already_sent" });
    expect(await (await post({ op: "save", draft: { id: draftId, recipientEmail: "a@b.co", recipientName: "", leadId: null, subject: "S", previewText: "", operations: [] } })).json()).toMatchObject({ code: "already_sent" });
    state.getDraft.mockResolvedValueOnce({ ...draft, sentAt: "2026-11-24T01:00:00Z" });
    expect(await (await post({ op: "review", draftId })).json()).toMatchObject({ code: "already_sent" });
    state.getDraft.mockResolvedValueOnce(null);
    expect(await (await post({ op: "review", draftId })).json()).toMatchObject({ code: "not_found" });
  });
  it("refuses an already-sent draft, a missing draft, and a missing or invalid address", async () => {
    state.getDraft.mockResolvedValueOnce({ ...draft, sentAt: "2026-11-24T01:00:00Z" });
    expect((await post({ op: "review", draftId })).status).toBe(409);
    state.getDraft.mockResolvedValueOnce(null);
    expect((await post({ op: "review", draftId })).status).toBe(404);
    state.getDraft.mockResolvedValueOnce({ ...draft, recipientEmail: "  " });
    expect((await post({ op: "review", draftId })).status).toBe(400);
    state.getDraft.mockResolvedValueOnce({ ...draft, recipientEmail: "not-an-address" });
    expect((await post({ op: "review", draftId })).status).toBe(400);
    expect(state.findOrCreateContact).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("validates the message before any contact is created", async () => {
    state.getDraft.mockResolvedValue({ ...draft, subject: "   " });
    expect((await post({ op: "review", draftId })).status).toBe(400);
    state.getDraft.mockResolvedValue({ ...draft, operations: [{ insert: "x", attributes: { color: "#000000" } }] });
    expect((await post({ op: "review", draftId })).status).toBe(400);
    state.getDraft.mockResolvedValue({ ...draft, operations: [{ insert: "\n" }] });
    expect((await post({ op: "review", draftId })).status).toBe(400);
    expect(state.findOrCreateContact).not.toHaveBeenCalled();
    expect(state.candidates).not.toHaveBeenCalled();
  });
  it("fails safely, creating no campaign, when a lookup breaks", async () => {
    state.recentOutreach.mockRejectedValue(new Error("db down"));
    const response = await post({ op: "review", draftId });
    expect(response.status).toBe(503);
    expect(state.insert).not.toHaveBeenCalled();
  });
});
