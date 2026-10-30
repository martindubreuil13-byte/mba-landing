/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));

const sent: Array<Record<string, any>> = [];
const keys: Array<string | undefined> = [];
const mode = vi.hoisted(() => ({ fail: false, uncertain: false }));
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>, o?: any) => { if (mode.uncertain) return { data: null, error: { message: "Unable to fetch data", statusCode: null } }; if (mode.fail) return { data: null, error: { message: "provider refused", statusCode: 422 } }; sent.push(m); keys.push(o?.idempotencyKey); return { data: { id: `msg_${sent.length}` }, error: null }; } } }) }));

import { applyInvitationDelivery, deliverInvitation, summarizeInvitation, type InvitationSend } from "./invitation";

const APP = "aaaaaaaa-0000-0000-0000-000000000001";
const send = (over: Partial<InvitationSend>): InvitationSend => ({ id: Math.random().toString(), application_id: APP, kind: "initial", status: "accepted", provider_message_id: "m", error: null, delivery_status: null, delivery_updated_at: null, attempted_at: "2026-10-30T10:00:00.000Z", ...over });
const app = () => ({ id: APP, answers: { firstName: "Elena", email: "elena@example.com" }, booking_ref: "ref-0123456789abcdefghij" });

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  sent.length = 0; keys.length = 0; mode.fail = false; mode.uncertain = false;
  db.tables.program_applications.push({ id: APP, booking_ref: "ref-0123456789abcdefghij" });
});

describe("summarizeInvitation: Pending / Sent / Failed / Resent, and a failed send is never labelled successful", () => {
  it("nothing attempted -> Pending", () => expect(summarizeInvitation([])).toMatchObject({ state: "pending", attempts: 0, firstSentAt: null }));
  it("accepted first send -> Sent, with the first-sent time", () => {
    expect(summarizeInvitation([send({})])).toMatchObject({ state: "sent", firstSentAt: "2026-10-30T10:00:00.000Z", lastSentAt: "2026-10-30T10:00:00.000Z", lastError: null });
  });
  it("only a refused attempt -> Failed, with the reason", () => {
    expect(summarizeInvitation([send({ status: "failed", error: "provider refused", provider_message_id: null })])).toMatchObject({ state: "failed", firstSentAt: null, lastError: "provider refused" });
  });
  it("accepted by the provider but later reported bounced -> Failed", () => {
    expect(summarizeInvitation([send({ delivery_status: "bounced" })])).toMatchObject({ state: "failed", firstSentAt: null });
    expect(summarizeInvitation([send({ delivery_status: "failed" })]).state).toBe("failed");
  });
  it("a later accepted resend -> Resent; the first send is still the first", () => {
    const r = summarizeInvitation([send({}), send({ kind: "resend", attempted_at: "2026-10-31T09:00:00.000Z" })]);
    expect(r).toMatchObject({ state: "resent", firstSentAt: "2026-10-30T10:00:00.000Z", lastSentAt: "2026-10-31T09:00:00.000Z", attempts: 2 });
  });
  it("a FAILED resend after a good first send stays Sent but reports the problem", () => {
    const r = summarizeInvitation([send({}), send({ kind: "resend", status: "failed", error: "x", attempted_at: "2026-10-31T09:00:00.000Z" })]);
    expect(r).toMatchObject({ state: "sent", lastError: "x" });
  });
  it("first send failed, then an accepted retry: the retry is the first successful send (not a 'resend')", () => {
    const r = summarizeInvitation([send({ status: "failed", error: "x", provider_message_id: null }), send({ attempted_at: "2026-10-31T09:00:00.000Z" })]);
    expect(r).toMatchObject({ state: "sent", firstSentAt: "2026-10-31T09:00:00.000Z" });
  });
});

describe("deliverInvitation", () => {
  it("first send is 'initial', stores the provider message id, and uses the same per-applicant booking link", async () => {
    const r = await deliverInvitation(app());
    expect(r).toMatchObject({ ok: true, kind: "initial", messageId: "msg_1" });
    expect(db.tables.program_invitation_sends).toMatchObject([{ application_id: APP, kind: "initial", status: "accepted", provider_message_id: "msg_1" }]);
    expect(sent[0].text).toContain("utm_content=ref-0123456789abcdefghij");
    expect(keys[0]).toBe(`transition-invite/${APP}/0`);
  });

  it("a later send is a 'resend' with a fresh provider idempotency key, and the history keeps both", async () => {
    await deliverInvitation(app());
    const r = await deliverInvitation(app());
    expect(r).toMatchObject({ ok: true, kind: "resend" });
    expect(db.tables.program_invitation_sends.map((s) => s.kind)).toEqual(["initial", "resend"]);
    expect(keys).toEqual([`transition-invite/${APP}/0`, `transition-invite/${APP}/1`]);
    expect(summarizeInvitation(db.tables.program_invitation_sends as any).state).toBe("resent");
  });

  it("a refused send is recorded as failed, with the reason, and is never reported as sent", async () => {
    mode.fail = true;
    const r = await deliverInvitation(app());
    expect(r).toMatchObject({ ok: false, kind: "initial", error: "provider refused" });
    expect(db.tables.program_invitation_sends).toMatchObject([{ status: "failed", error: "provider refused", provider_message_id: null }]);
    expect(db.tables.program_applications[0]).toMatchObject({ applicant_email_status: "failed", applicant_email_error: "provider refused" });
    expect(summarizeInvitation(db.tables.program_invitation_sends as any).state).toBe("failed");
  });

  it("after a failure, the next accepted send is still 'initial' (it is the first successful one)", async () => {
    mode.fail = true; await deliverInvitation(app());
    mode.fail = false; mode.uncertain = false;
    const r = await deliverInvitation(app());
    expect(r).toMatchObject({ ok: true, kind: "initial" });
    expect(keys).toEqual([`transition-invite/${APP}/1`]);
  });

  it("an earlier application without a booking_ref gets one before it is emailed", async () => {
    delete db.tables.program_applications[0].booking_ref;
    const r = await deliverInvitation({ id: APP, answers: app().answers, booking_ref: null });
    expect(r.ok).toBe(true);
    const ref = db.tables.program_applications[0].booking_ref;
    expect(ref).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(sent[0].text).toContain(`utm_content=${ref}`);
  });
});

describe("durable invitation reservations", () => {
  it("a ledger reservation failure sends nothing", async () => {
    db.failNextInsertInto = "program_invitation_sends";
    expect((await deliverInvitation(app())).ok).toBe(false);
    expect(sent).toHaveLength(0);
  });
  it("overlapping sends reserve one attempt and call the provider once", async () => {
    await Promise.all([deliverInvitation(app()), deliverInvitation(app())]);
    expect(sent).toHaveLength(1);
    expect(db.tables.program_invitation_sends).toHaveLength(1);
  });
  it("SDK network errors with no HTTP status stay pending and block retries", async () => {
    mode.uncertain = true;
    expect((await deliverInvitation(app())).ok).toBe(false);
    expect(db.tables.program_invitation_sends[0].status).toBe("pending");
    mode.uncertain = false;
    expect((await deliverInvitation(app())).ok).toBe(false);
    expect(sent).toHaveLength(0);
  });
  it("an uncertain in-flight attempt blocks resending and stays Pending", async () => {
    db.tables.program_invitation_sends.push(send({ status: "pending" }));
    expect((await deliverInvitation(app())).ok).toBe(false);
    expect(sent).toHaveLength(0);
    expect(summarizeInvitation(db.tables.program_invitation_sends as any).state).toBe("pending");
  });
});

describe("applyInvitationDelivery (signed Resend webhook)", () => {
  it("a fast delivery callback correlates to the reserved attempt before the send response was saved", async () => {
    const pending = send({ id: "reserved-attempt", status: "pending", provider_message_id: null });
    db.tables.program_invitation_sends.push(pending);
    expect(await applyInvitationDelivery("early-message", "bounced", "mailbox unavailable", undefined, pending.id)).toMatchObject({ matched: true, applicationId: APP });
    expect(db.tables.program_invitation_sends[0]).toMatchObject({ status: "accepted", provider_message_id: "early-message", delivery_status: "bounced" });
    expect(summarizeInvitation(db.tables.program_invitation_sends as any).state).toBe("failed");
  });
  it("records delivered / bounced / failed against the matching message and nothing else", async () => {
    await deliverInvitation(app());
    expect(await applyInvitationDelivery("msg_1", "delivered")).toMatchObject({ matched: true, applicationId: APP });
    expect(db.tables.program_invitation_sends[0].delivery_status).toBe("delivered");
    expect(await applyInvitationDelivery("someone-elses", "bounced")).toEqual({ matched: false });
  });
  it("a bounce is never overwritten by a late 'delivered'; a repeated event changes nothing", async () => {
    await deliverInvitation(app());
    await applyInvitationDelivery("msg_1", "bounced", "mailbox full");
    await applyInvitationDelivery("msg_1", "delivered");
    await applyInvitationDelivery("msg_1", "bounced");
    expect(db.tables.program_invitation_sends[0]).toMatchObject({ delivery_status: "bounced", error: "mailbox full" });
    expect(summarizeInvitation(db.tables.program_invitation_sends as any)).toMatchObject({ state: "failed", lastError: "mailbox full" });
  });
});
