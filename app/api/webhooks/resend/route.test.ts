import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
const advance = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/app/lib/resources/delivery-email", () => ({ advanceDeliveryStatus: advance }));

import { POST } from "./route";

const SECRET = "whsec_" + Buffer.from("test-secret").toString("base64");
const event = (type: string, emailId: string, extra: Record<string, unknown> = {}) => JSON.stringify({ type, data: { email_id: emailId, ...extra } });
const post = (body: string) => {
  const id = "msg_evt", ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", Buffer.from("test-secret")).update(`${id}.${ts}.${body}`).digest("base64");
  return POST(new Request("http://localhost/api/webhooks/resend", { method: "POST", headers: { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}` }, body }));
};

const APP = "aaaaaaaa-0000-0000-0000-000000000001", LEAD = "bbbbbbbb-0000-0000-0000-000000000001";
beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  advance.mockClear();
  vi.stubEnv("RESEND_WEBHOOK_SECRET", SECRET);
  db.tables.leads.push({ id: LEAD, email: "e@example.com", ongoing_content_opt_in: false, suppressed_at: null, consent_requested_at: null, ongoing_content_opt_out_at: null, ongoing_content_opt_in_at: null });
  db.tables.program_applications.push({ id: APP, lead_id: LEAD });
  db.tables.program_invitation_sends.push({ id: "s1", application_id: APP, kind: "initial", status: "accepted", provider_message_id: "inv_1", delivery_status: null, attempted_at: "2026-10-30T10:00:00.000Z" });
});

describe("Resend webhook: Transition booking invitations", () => {
  it("still refuses unsigned or forged events", async () => {
    const res = await POST(new Request("http://localhost/x", { method: "POST", headers: { "svix-id": "a", "svix-timestamp": "1", "svix-signature": "v1,xx" }, body: event("email.delivered", "inv_1") }));
    expect(res.status).toBe(401);
    expect(db.tables.program_invitation_sends[0].delivery_status).toBeNull();
  });
  it("delivered / bounced events update the matching invitation attempt only", async () => {
    expect(await (await post(event("email.delivered", "inv_1"))).json()).toEqual({ ok: true });
    expect(db.tables.program_invitation_sends[0].delivery_status).toBe("delivered");
    await post(event("email.bounced", "inv_1", { bounce: { message: "mailbox full" } }));
    expect(db.tables.program_invitation_sends[0]).toMatchObject({ delivery_status: "bounced", error: "mailbox full" });
    expect(advance).not.toHaveBeenCalled();
  });
  it("an event for an unrelated email is acknowledged and changes nothing", async () => {
    expect(await (await post(event("email.delivered", "someone_else"))).json()).toEqual({ ignored: true });
    expect(db.tables.program_invitation_sends[0].delivery_status).toBeNull();
  });
  it("a spam complaint on an invitation suppresses that address, as for every other email", async () => {
    expect(await (await post(event("email.complained", "inv_1"))).json()).toEqual({ ok: true, suppressed: true });
    expect(db.tables.leads[0].suppressed_at).toEqual(expect.any(String));
  });
  it("resource-email events still go to the resource path and never touch invitations", async () => {
    db.tables.resource_requests.push({ id: "rr1", lead_id: LEAD, delivery_provider_id: "res_1", resource_id: "r1" });
    db.tables.resources.push({ id: "r1", slug: "x" });
    await post(event("email.delivered", "res_1"));
    expect(advance).toHaveBeenCalledTimes(1);
    expect(db.tables.program_invitation_sends[0].delivery_status).toBeNull();
  });
});
