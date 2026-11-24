import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data?: unknown; error?: { code?: string } | null };
const state = vi.hoisted(() => ({ results: {} as Record<string, unknown[]>, calls: [] as { table: string; method: string; args: unknown[] }[] }));

/** A recording stand-in for the Supabase query builder: every chained call is logged, and awaiting it yields the next queued result for that table. */
vi.mock("@/app/lib/supabase/service", () => ({
  getServiceClient: () => ({
    from(table: string) {
      const proxy: object = new Proxy({}, {
        get(_, method: string) {
          if (method === "then") return (resolve: (value: Result) => void) => resolve((state.results[table]?.shift() ?? { data: null, error: null }) as Result);
          return (...args: unknown[]) => { state.calls.push({ table, method, args }); return proxy; };
        },
      });
      return proxy;
    },
  }),
}));
vi.mock("server-only", () => ({}));

import { deleteDraft, deliveryResult, findOrCreateContact, getDraft, listDrafts, recentOutreach, saveDraft } from "./server";

const queue = (table: string, ...results: Result[]) => { state.results[table] = [...(state.results[table] ?? []), ...results]; };
const callsTo = (table: string, method: string) => state.calls.filter((call) => call.table === table && call.method === method);
const firstArg = (table: string, method: string) => callsTo(table, method)[0].args[0] as Record<string, unknown>;
const row = (over: object = {}) => ({ id: "d1", recipient_email: "a@b.co", recipient_name: "A", lead_id: null, subject: "S", preview_text: "", editor_operations: [], campaign_id: null, updated_at: "2026-11-24T00:00:00Z", ...over });
const input = { recipientEmail: " Ada@Example.com ", recipientName: " Ada ", leadId: null, subject: "S", previewText: "", operations: [{ insert: "x\n" }] };

beforeEach(() => { state.results = {}; state.calls = []; });

describe("findOrCreateContact", () => {
  it("reuses an existing contact (any capitalisation) without creating or changing anything", async () => {
    queue("leads", { data: { id: "lead-1" } });
    expect(await findOrCreateContact("  ADA@Example.com ", "Ada")).toEqual({ id: "lead-1", created: false });
    expect(callsTo("leads", "insert")).toHaveLength(0);
    expect(callsTo("leads", "update")).toHaveLength(0);
    expect(callsTo("leads", "ilike")[0].args).toEqual(["email", "ada@example.com"]);
  });
  it("creates a new contact that is NOT subscribed and carries no consent, with the optional name split", async () => {
    queue("leads", { data: null }, { data: { id: "lead-2" } });
    expect(await findOrCreateContact("Grace@Example.com", "Grace Brewster Hopper")).toEqual({ id: "lead-2", created: true });
    const created = firstArg("leads", "insert");
    expect(created).toMatchObject({ first_name: "Grace", last_name: "Brewster Hopper", email: "grace@example.com", ongoing_content_opt_in: false });
    for (const forbidden of ["ongoing_content_opt_in_at", "ongoing_content_opt_out_at", "suppressed_at", "consent_requested_at"]) expect(created).not.toHaveProperty(forbidden);
    expect(callsTo("consent_records", "insert")).toHaveLength(0);
  });
  it("creates a contact with no name at all", async () => {
    queue("leads", { data: null }, { data: { id: "lead-3" } });
    await findOrCreateContact("x@example.com", "  ");
    expect(firstArg("leads", "insert")).toMatchObject({ first_name: "", last_name: null });
  });
  it("uses the contact another request created at the same moment", async () => {
    queue("leads", { data: null }, { data: null, error: { code: "23505" } }, { data: { id: "lead-4" } });
    expect(await findOrCreateContact("race@example.com", "")).toEqual({ id: "lead-4", created: false });
  });
  it("treats percent and underscore in an address as literal characters when matching", async () => {
    queue("leads", { data: { id: "lead-5" } });
    await findOrCreateContact("a_b%c@example.com", "");
    expect(callsTo("leads", "ilike")[0].args[1]).toBe("a\\_b\\%c@example.com");
  });
  it("fails loudly rather than guessing when the database errors", async () => {
    queue("leads", { data: null }, { data: null, error: { code: "XX000" } });
    await expect(findOrCreateContact("e@example.com", "")).rejects.toThrow("could not be created");
  });
});

describe("drafts", () => {
  it("saves a new draft with the address trimmed, and a draft is never created with a review link", async () => {
    queue("email_outreach_drafts", { data: row() });
    const saved = await saveDraft(input);
    expect(saved.ok).toBe(true);
    const fields = firstArg("email_outreach_drafts", "insert");
    expect(fields).toMatchObject({ recipient_email: "Ada@Example.com", recipient_name: "Ada", subject: "S" });
    expect(fields).not.toHaveProperty("campaign_id");
  });
  it("updates an unsent draft", async () => {
    queue("email_outreach_drafts", { data: row() }, { data: row({ subject: "New" }) });
    expect(await saveDraft({ ...input, id: "d1" })).toMatchObject({ ok: true, draft: { id: "d1" } });
    expect(callsTo("email_outreach_drafts", "update")).toHaveLength(1);
  });
  it("refuses to change a draft whose review snapshot was claimed for sending", async () => {
    queue("email_outreach_drafts", { data: row({ campaign_id: "c1" }) });
    queue("email_campaigns", { data: { started_at: "2026-11-24T01:00:00Z" } });
    expect(await saveDraft({ ...input, id: "d1" })).toEqual({ ok: false, reason: "already_sent" });
    expect(callsTo("email_outreach_drafts", "update")).toHaveLength(0);
  });
  it("allows editing a draft whose review was made but never sent", async () => {
    queue("email_outreach_drafts", { data: row({ campaign_id: "c1" }) }, { data: row() });
    queue("email_campaigns", { data: { started_at: null } });
    expect((await saveDraft({ ...input, id: "d1" })).ok).toBe(true);
  });
  it("reports a missing draft", async () => {
    queue("email_outreach_drafts", { data: null });
    expect(await saveDraft({ ...input, id: "d1" })).toEqual({ ok: false, reason: "not_found" });
    queue("email_outreach_drafts", { data: null });
    expect(await getDraft("d1")).toBeNull();
  });
  it("lists only drafts that have not been sent, newest first", async () => {
    queue("email_outreach_drafts", { data: [
      { ...row({ id: "unsent" }), email_campaigns: null },
      { ...row({ id: "reviewed-not-sent", campaign_id: "c1" }), email_campaigns: { started_at: null } },
      { ...row({ id: "sent", campaign_id: "c2" }), email_campaigns: { started_at: "2026-11-23T00:00:00Z" } },
      { ...row({ id: "sent-array-shape", campaign_id: "c3" }), email_campaigns: [{ started_at: "2026-11-23T00:00:00Z" }] },
    ] });
    expect((await listDrafts())?.map((draft) => draft.id)).toEqual(["unsent", "reviewed-not-sent"]);
    expect(callsTo("email_outreach_drafts", "order")[0].args).toEqual(["updated_at", { ascending: false }]);
  });
  it("returns null, not a partial list, when drafts cannot be loaded", async () => {
    queue("email_outreach_drafts", { data: null, error: { code: "42P01" } });
    expect(await listDrafts()).toBeNull();
  });
  it("deletes a draft", async () => {
    queue("email_outreach_drafts", { data: { id: "d1" } }, { data: null });
    expect(await deleteDraft("d1")).toBe(true);
    expect(await deleteDraft("d1")).toBe(false);
  });
});

describe("recent sends and results", () => {
  it("looks only at individual emails sent or possibly sent to that address in the last 30 days", async () => {
    queue("email_campaign_deliveries", { data: [{ updated_at: "2026-11-20T00:00:00Z", email_campaigns: { subject: "Earlier" } }, { updated_at: "2026-11-10T00:00:00Z", email_campaigns: [{ subject: "Older" }] }] });
    expect(await recentOutreach(" Ada@Example.com ")).toEqual([{ sentAt: "2026-11-20T00:00:00Z", subject: "Earlier" }, { sentAt: "2026-11-10T00:00:00Z", subject: "Older" }]);
    const t = "email_campaign_deliveries";
    expect(callsTo(t, "eq").map((c) => c.args)).toEqual(expect.arrayContaining([["email", "ada@example.com"], ["email_campaigns.kind", "outreach"]]));
    expect(callsTo(t, "in")[0].args).toEqual(["status", ["sent", "unknown", "attempting"]]);
    const since = Date.parse(callsTo(t, "gte")[0].args[1] as string);
    expect(Date.now() - since).toBeGreaterThan(29.9 * 86_400_000);
    expect(Date.now() - since).toBeLessThan(30.1 * 86_400_000);
  });
  it("does not hide a failed lookup as 'no earlier emails'", async () => {
    queue("email_campaign_deliveries", { data: null, error: { code: "X" } });
    await expect(recentOutreach("a@b.co")).rejects.toThrow("could not be checked");
  });
  it("reads the single delivery outcome of an individual send", async () => {
    queue("email_campaign_deliveries", { data: { status: "sent", reason: null, provider_id: "re_1" } }, { data: { status: "excluded", reason: "Suppressed", provider_id: null } }, { data: null });
    expect(await deliveryResult("c1")).toEqual({ status: "sent", reason: null, providerAccepted: true });
    expect(await deliveryResult("c1")).toEqual({ status: "excluded", reason: "Suppressed", providerAccepted: false });
    expect(await deliveryResult("c1")).toEqual({ status: "none", reason: null, providerAccepted: false });
  });
});
