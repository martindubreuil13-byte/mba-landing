/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
const admin = vi.hoisted(() => ({ ok: true }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ requireAdmin: async () => { if (!admin.ok) throw new Error("NEXT_REDIRECT"); return { email: "martin@example.com" }; } }));
const sent: Array<Record<string, any>> = [];
const mode = vi.hoisted(() => ({ fail: false }));
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>) => { if (mode.fail) return { data: null, error: { message: "provider refused", statusCode: 422 } }; sent.push(m); return { data: { id: `msg_${sent.length}` }, error: null }; } } }) }));

import { POST } from "./route";

const ID = "aaaaaaaa-0000-0000-0000-000000000001";
const resend = () => POST(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ id: ID }) });
const app = (over: Record<string, unknown> = {}) => ({ id: ID, program_key: "corporate-transition", status: "INVITED", booking_status: "not_booked", booking_ref: "ref-0123456789abcdefghij", answers: { firstName: "Elena", lastName: "T", email: "elena@example.com" }, ...over });

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  sent.length = 0; mode.fail = false; admin.ok = true;
});

describe("Resend invitation (admin)", () => {
  it("requires an admin", async () => {
    admin.ok = false; db.tables.program_applications.push(app());
    await expect(resend()).rejects.toThrow();
    expect(sent).toHaveLength(0);
  });
  it("sends a RESEND (the first invitation already went out), records it, and the same link is used", async () => {
    db.tables.program_applications.push(app());
    db.tables.program_invitation_sends.push({ id: "s0", application_id: ID, kind: "initial", status: "accepted", provider_message_id: "m0", attempted_at: "2026-10-30T10:00:00.000Z" });
    const res = await resend();
    expect(await res.json()).toEqual({ success: true, kind: "resend" });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("elena@example.com");
    expect(sent[0].text).toContain("utm_content=ref-0123456789abcdefghij");
    expect(db.tables.program_invitation_sends.map((s) => s.kind)).toEqual(["initial", "resend"]);
  });
  it("when the first send had failed, the manual send is the first successful one ('initial')", async () => {
    db.tables.program_applications.push(app());
    db.tables.program_invitation_sends.push({ id: "s0", application_id: ID, kind: "initial", status: "failed", provider_message_id: null, error: "x", attempted_at: "2026-10-30T10:00:00.000Z" });
    expect((await (await resend()).json()).kind).toBe("initial");
  });
  it("a refusal by the provider is an error response, recorded as failed, never as success", async () => {
    db.tables.program_applications.push(app()); mode.fail = true;
    const res = await resend();
    expect(res.status).toBe(502);
    expect((await res.json()).success).toBeUndefined();
    expect(db.tables.program_invitation_sends).toMatchObject([{ status: "failed", error: "provider refused" }]);
  });
  it("is not offered once a conversation is booked, or for an application that was declined", async () => {
    db.tables.program_applications.push(app({ booking_status: "booked", status: "BOOKED" }));
    expect((await resend()).status).toBe(409);
    db.tables.program_applications[0] = app({ status: "DECLINED" });
    expect((await resend()).status).toBe(409);
    expect(sent).toHaveLength(0);
  });
  it("unknown application: 404", async () => { expect((await resend()).status).toBe(404); });
});
