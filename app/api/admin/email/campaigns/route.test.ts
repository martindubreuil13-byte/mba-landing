import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  admin: vi.fn(), rpc: vi.fn(), candidates: vi.fn(), send: vi.fn(), deliveries: [] as object[], started: false,
}));
const id = "8ab4b9aa-e272-48d6-8861-b25198fa7b12";
const second = "8ab4b9aa-e272-48d6-8861-b25198fa7b13";
const third = "8ab4b9aa-e272-48d6-8861-b25198fa7b14";
const email = "fixture@example.com";
const candidate = { id, email, state: "Eligible", reason: "Recorded marketing opt-in" };

vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: state.admin }));
vi.mock("@/app/lib/contact-tags/data", () => ({ recipientCandidates: state.candidates }));
vi.mock("@/app/lib/email-studio/track-links", () => ({ trackCampaignLinks: async (_id: string, html: string) => html }));
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: state.send } }) }));
vi.mock("@/app/lib/napkin/unsubscribe", () => ({ createUnsubscribeToken: () => "v2.fixture.signature" }));
vi.mock("@/app/lib/resources/delivery-email", () => ({ DEFAULT_RESOURCE_FROM: "MBA <fixture@example.com>" }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({
  rpc: state.rpc,
  storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "https://storage.example.com" } }) }) },
  from: (table: string) => table === "email_campaigns" ? {
    insert: () => ({ select: () => ({ single: async () => ({ data: { id } }) }) }),

  } : {
    insert: async (value: object) => { state.deliveries.push(value); return {}; },
    upsert: async (value: object) => { state.deliveries.push(value); return {}; },
  },
}) }));

import { POST } from "./route";
import { colors } from "@/app/lib/email-studio/render";
function post(value: object) {
  return POST(new Request("https://modernbusinessarchitect.com/api/admin/email/campaigns", {
    method: "POST", headers: { "content-type": "application/json", origin: "https://modernbusinessarchitect.com", host: "modernbusinessarchitect.com" },
    body: JSON.stringify(value),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "mock-only");
  state.admin.mockResolvedValue({ id });
  state.started = false;
  state.deliveries = [];
  state.rpc.mockImplementation(async (name: string) => {
    if (name === "complete_email_campaign_batch") return { data: { nextOffset: 3, done: true } };
    if (state.started) return { data: null };
    state.started = true;
    return { data: { claimToken: id, subject: "News", preview_text: "Preview", body_html: "<p>News</p>", body_text: "News", recipients: [
      { id, email }, { id: second, email: "second@example.com" }, { id: third, email: "third@example.com" },
    ] } };
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("campaign route", () => {
  it("refuses an old editor before claiming a batch or sending only the first 25", async () => {
    const response = await post({ campaignId: id, confirmed: true });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("Reload Email Studio") });
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.send).not.toHaveBeenCalled();
  });

  it("reviews pasted content with editor-supported colors without sending mail", async () => {
    state.candidates.mockResolvedValue([candidate]);
    // Plain text is what remains when the editor drops an out-of-palette
    // clipboard color; palette colors must still survive review unchanged.
    for (const color of [undefined, ...colors]) {
      const review = await post({
        subject: "November update", previewText: "", ids: [id], exceptions: [],
        operations: [{ insert: "Pasted newsletter content.", ...(color ? { attributes: { color } } : {}) }, { insert: "\n\n" }],
      });
      expect(review.status).toBe(200);
      const result = await review.json();
      expect(result).toMatchObject({ selected: 1, eligible: 1 });
      expect(result.html).toContain("Pasted newsletter content.");
      if (color) expect(result.html).toContain(`color:${color}`);
    }
    expect(state.send).not.toHaveBeenCalled();
    expect(state.deliveries).toEqual([]);
  });

  it("rejects unsupported clipboard colors before resolving recipients or sending", async () => {
    const response = await post({
      subject: "November update", previewText: "", ids: [id], exceptions: [],
      operations: [{ insert: "Pasted newsletter content.", attributes: { color: "#000000" } }, { insert: "\n\n" }],
    });
    expect(response.status).toBe(400);
    expect(state.candidates).not.toHaveBeenCalled();
    expect(state.send).not.toHaveBeenCalled();
    expect(state.deliveries).toEqual([]);
  });

  it("requires an admin and an explicit confirmation before calling Resend", async () => {
    state.admin.mockResolvedValueOnce(null);
    expect((await post({ campaignId: id, confirmed: true, offset: 0 })).status).toBe(401);
    expect((await post({ campaignId: id, confirmed: false })).status).toBe(400);
    state.candidates.mockResolvedValueOnce([candidate]);
    const review = await post({ subject: "News", previewText: "Preview", ids: [id], operations: [{ insert: "News" }] });
    expect(await review.json()).toMatchObject({ campaignId: id, eligible: 1 });
    expect(state.send).not.toHaveBeenCalled();
  });
  it("reviews all 41 eligible addresses and Heading 3 content without sending", async () => {
    const contacts = Array.from({ length: 41 }, (_, index) => ({
      ...candidate, id: `8ab4b9aa-e272-48d6-8861-${String(index).padStart(12, "0")}`, email: `fixture${index}@example.com`,
    }));
    state.candidates.mockResolvedValue(contacts);
    const review = await post({ subject: "News", previewText: "", ids: contacts.map((contact) => contact.id), operations: [{ insert: "Start with three simple filters." }, { insert: "\n", attributes: { header: 3 } }] });
    expect(await review.json()).toMatchObject({ eligible: 41, selected: 41, campaignId: id });
    expect(state.send).not.toHaveBeenCalled();
  });
  it("records acceptance, provider rejection and fresh suppression, then refuses repeat confirmation", async () => {
    state.candidates.mockResolvedValueOnce([candidate])
      .mockResolvedValueOnce([{ ...candidate, id: second, email: "second@example.com" }])
      .mockResolvedValueOnce([{ ...candidate, id: third, email: "third@example.com", state: "Not eligible", reason: "Suppressed" }]);
    state.send.mockResolvedValueOnce({ data: { id: "provider-1" } })
      .mockResolvedValueOnce({ error: { statusCode: 429 } });
    expect((await post({ campaignId: id, confirmed: true, offset: 0 })).status).toBe(200);
    expect((await post({ campaignId: id, confirmed: true, offset: 0 })).status).toBe(409);
    expect(state.send).toHaveBeenCalledTimes(2);
    expect(state.send.mock.calls[0][0]).toMatchObject({ to: email, headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    expect(state.send.mock.calls[0][0].html).toContain("/unsubscribe?token=");
    expect(state.deliveries).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "sent", provider_id: "provider-1" }),
      expect.objectContaining({ status: "failed" }),
      expect.objectContaining({ status: "excluded", reason: "Suppressed" }),
    ]));
  });

  it("delivers 41 synthetic recipients in separately claimed batches of 25 and 16", async () => {
    vi.useFakeTimers();
    const recipients = Array.from({ length: 41 }, (_, index) => ({
      ...candidate, id: `8ab4b9aa-e272-48d6-8861-${String(index).padStart(12, "0")}`, email: `synthetic${index}@example.com`,
    }));
    const batch = { claimToken: id, subject: "News", preview_text: "", body_html: "<p>News</p>", body_text: "News" };
    state.rpc.mockReset().mockResolvedValueOnce({ data: { ...batch, recipients: recipients.slice(0, 25) } })
      .mockResolvedValueOnce({ data: { nextOffset: 25, done: false } })
      .mockResolvedValueOnce({ data: { ...batch, recipients: recipients.slice(25) } })
      .mockResolvedValueOnce({ data: { nextOffset: 41, done: true } })
      .mockResolvedValueOnce({ data: null });
    state.candidates.mockImplementation(async (ids: string[]) => recipients.filter((recipient) => ids.includes(recipient.id)));
    state.send.mockResolvedValue({ data: { id: "synthetic-provider" } });
    const first = post({ campaignId: id, confirmed: true, offset: 0 });
    await vi.runAllTimersAsync();
    expect(await (await first).json()).toMatchObject({ nextOffset: 25, done: false });
    expect(state.send).toHaveBeenCalledTimes(25);
    const secondBatch = post({ campaignId: id, confirmed: true, offset: 25 });
    await vi.runAllTimersAsync();
    expect(await (await secondBatch).json()).toMatchObject({ nextOffset: 41, done: true });
    expect(state.send).toHaveBeenCalledTimes(41);
    expect(new Set(state.send.mock.calls.map(([message]) => message.to)).size).toBe(41);
    expect(state.rpc.mock.calls[2]).toEqual(["claim_email_campaign_batch", expect.objectContaining({ requested_offset: 25 })]);
    expect((await post({ campaignId: id, confirmed: true, offset: 0 })).status).toBe(409);
    expect(state.send).toHaveBeenCalledTimes(41);
  });
});
