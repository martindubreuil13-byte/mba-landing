import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  admin: vi.fn(), candidates: vi.fn(), send: vi.fn(), deliveries: [] as object[], started: false,
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
  storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "https://storage.example.com" } }) }) },
  from: (table: string) => table === "email_campaigns" ? {
    insert: () => ({ select: () => ({ single: async () => ({ data: { id } }) }) }),
    update: (change: {completed_at?: string}) => ({ eq: () => change.completed_at ? Promise.resolve({}) : ({ is: () => ({ gte: () => ({ eq: vi.fn(), select: () => ({ maybeSingle: async () => {
      if (state.started) return { data: null };
      state.started = true;
      return { data: { subject: "News", preview_text: "Preview", body_html: "<p>News</p>", body_text: "News", recipients: [
        { id, email }, { id: second, email: "second@example.com" }, { id: third, email: "third@example.com" },
      ] } };
    } }) }) }) }) }),
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
});
afterEach(() => vi.unstubAllEnvs());

describe("campaign route", () => {
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
    expect((await post({ campaignId: id, confirmed: true })).status).toBe(401);
    expect((await post({ campaignId: id, confirmed: false })).status).toBe(400);
    state.candidates.mockResolvedValueOnce([candidate]);
    const review = await post({ subject: "News", previewText: "Preview", ids: [id], operations: [{ insert: "News" }] });
    expect(await review.json()).toMatchObject({ campaignId: id, eligible: 1 });
    expect(state.send).not.toHaveBeenCalled();
  });
  it("rejects campaigns over 25 eligible addresses", async () => {
    const contacts = Array.from({ length: 26 }, (_, index) => ({
      ...candidate, id: `8ab4b9aa-e272-48d6-8861-${String(index).padStart(12, "0")}`, email: `fixture${index}@example.com`,
    }));
    state.candidates.mockResolvedValue(contacts);
    const review = await post({ subject: "News", previewText: "", ids: contacts.map((contact) => contact.id), operations: [{ insert: "News" }] });
    expect(await review.json()).toMatchObject({ eligible: 26, campaignId: null });
    expect(state.send).not.toHaveBeenCalled();
  });
  it("records acceptance, provider rejection and fresh suppression, then refuses repeat confirmation", async () => {
    state.candidates.mockResolvedValueOnce([candidate])
      .mockResolvedValueOnce([{ ...candidate, id: second, email: "second@example.com" }])
      .mockResolvedValueOnce([{ ...candidate, id: third, email: "third@example.com", state: "Not eligible", reason: "Suppressed" }]);
    state.send.mockResolvedValueOnce({ data: { id: "provider-1" } })
      .mockResolvedValueOnce({ error: { statusCode: 429 } });
    expect((await post({ campaignId: id, confirmed: true })).status).toBe(200);
    expect((await post({ campaignId: id, confirmed: true })).status).toBe(409);
    expect(state.send).toHaveBeenCalledTimes(2);
    expect(state.send.mock.calls[0][0]).toMatchObject({ to: email, headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    expect(state.send.mock.calls[0][0].html).toContain("/unsubscribe?token=");
    expect(state.deliveries).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "sent", provider_id: "provider-1" }),
      expect.objectContaining({ status: "failed" }),
      expect.objectContaining({ status: "excluded", reason: "Suppressed" }),
    ]));
  });
});
