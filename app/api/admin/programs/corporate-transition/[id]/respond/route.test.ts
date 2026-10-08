/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ requireAdmin: async () => ({ email: "martin@example.com" }) }));

const sent: Array<Record<string, any>> = [];
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>) => { sent.push(m); return { data: { id: "e1" }, error: null }; } } }) }));
process.env.RESEND_API_KEY = "k";

import { CALENDLY_URL, CONVERSATION_INVITE_CALENDLY_URL, CONVERSATION_INVITE_SUBJECT, conversationInviteDraft } from "@/app/lib/programs/corporate-transition";
import { POST } from "./route";

const ID = "aaaaaaaa-0000-0000-0000-000000000001";
const respond = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ id: ID }) });

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  sent.length = 0;
  db.tables.program_applications.push({ id: ID, program_key: "corporate-transition", status: "UNDER_REVIEW", ai_route: "NOT_FIT", answers: { firstName: "Elena", lastName: "T", email: "elena@example.com" }, submitted_at: "2026-10-08T00:00:00Z" });
});

describe("conversation invitation template (manual only)", () => {
  it("renders with the applicant's first name and the exact approved wording", () => {
    const t = conversationInviteDraft("Elena");
    expect(t.startsWith("Hi Elena,\n\nThank you for taking the time to share your background and situation.")).toBe(true);
    for (const line of [
      "This program was originally designed for professionals transitioning from corporate employment into entrepreneurship, so your circumstances may not fit the original criteria.",
      "However, I’ve reviewed your application, and I believe a conversation could still be worthwhile.",
      "I’d be happy to offer you 30 minutes of my time to explore your situation, discuss your options, and see whether I can offer some useful guidance.",
      "No fees, no obligations, and no sales pitch. Just an honest conversation.",
      "You can book a time here:",
      "https://calendly.com/martindubreuil13/30min",
      "Looking forward to speaking with you.",
    ]) expect(t).toContain(line);
    expect(t.endsWith("Martin")).toBe(true);
    expect(CONVERSATION_INVITE_SUBJECT).toBe("Let’s have a conversation");
  });

  it("is sent only when explicitly submitted from Admin, with the template subject, name and a single working link", async () => {
    expect(sent).toHaveLength(0); // nothing is sent just because the template exists
    const res = await respond({ kind: "INVITE", subject: CONVERSATION_INVITE_SUBJECT, message: conversationInviteDraft("Elena") });
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    const mail = sent[0];
    expect(mail.to).toBe("elena@example.com");
    expect(mail.subject).toBe("Let’s have a conversation");
    expect(mail.html).toContain("Hi Elena,");
    expect(mail.html).toContain(`href="${CONVERSATION_INVITE_CALENDLY_URL}"`);
    expect(mail.html.split(CONVERSATION_INVITE_CALENDLY_URL).length - 1).toBe(2); // link text + href of the one link
    expect(mail.html).not.toContain(CALENDLY_URL); // the old scheduling button is not added on top
    expect(mail.text).toContain(CONVERSATION_INVITE_CALENDLY_URL);
    expect(db.tables.program_applications[0]).toMatchObject({ status: "INVITED", manual_decision: "INVITE", response_email_status: "queued" });
    expect(db.tables.program_applications[0].response_sent).toContain("I’ve reviewed your application");
  });

  it("existing behavior is unchanged: a normal invite still gets the configured scheduling button", async () => {
    await respond({ kind: "INVITE", message: "Hi Elena,\n\nLet’s talk.\n\n— Martin" });
    expect(sent[0].subject).toBe("A conversation about what comes next");
    expect(sent[0].html).toContain(`href="${CALENDLY_URL}"`);
  });
});
