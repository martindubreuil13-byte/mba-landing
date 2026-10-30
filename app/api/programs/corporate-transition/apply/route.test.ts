/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
const state = vi.hoisted(() => ({ limitOk: true }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => state.limitOk, getClientIp: () => "203.0.113.7" }));

// Provider mock: records every send with its options; can be told to refuse or throw.
const sent: Array<Record<string, any>> = [];
const options: Array<Record<string, any> | undefined> = [];
let providerMode: "ok" | "refuse" | "throw" | "refuse-invitation-only" = "ok";
vi.mock("@/app/lib/email-client", () => ({
  createResend: () => ({
    emails: {
      send: async (m: Record<string, any>, o?: Record<string, any>) => {
        const isInvitation = m.subject === "Let’s have a conversation";
        if (providerMode === "throw") throw new Error("network down");
        if (providerMode === "refuse" || (providerMode === "refuse-invitation-only" && isInvitation)) return { data: null, error: { message: "provider refused", statusCode: 422 } };
        sent.push(m); options.push(o);
        return { data: { id: `msg_${sent.length}` }, error: null };
      },
    },
  }),
}));

// The AI must never be reached from the submission path.
const openai = vi.hoisted(() => vi.fn(() => { throw new Error("OpenAI must not be called when an application is submitted"); }));
vi.mock("@/app/lib/openai/client", () => ({ getOpenAIClient: openai, CLASSIFY_MODEL: "x" }));

// Website Intelligence: the server-confirmed conversion is recorded by reference only.
const recordConversion = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/app/lib/intelligence/conversions", () => ({ recordConversion }));

process.env.EVIDENCE_HASH_SECRET = "s";
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "s";
process.env.RESEND_API_KEY = "k";
process.env.PROGRAM_ADMIN_EMAIL = "martin@example.com";

import { POST } from "./route";
import { INTRO_BOOKING_URL } from "@/app/lib/booking";

const base = {
  employment: "Director / senior leader", experience: "20+ years", stage: "I have several ideas or possibilities and don’t know which one to pursue.",
  timing: "6–12 months", motivation: "I want to build something of my own after years in corporate.", help: "Help me work out which idea is credible and how to test it.",
  country: "Spain", firstName: "Elena", lastName: "Test", email: "elena@example.com", linkedin: "",
};

const apply = (answers: Record<string, unknown>, key = "key-1", extra: Record<string, unknown> = {}) =>
  POST(new Request("http://localhost/api/programs/corporate-transition/apply", { method: "POST", headers: { "content-type": "application/json", "user-agent": "t" }, body: JSON.stringify({ answers, attribution: { source: "linkedin", utm_campaign: "oct" }, idempotencyKey: key, website: "", ...extra }) }));

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  sent.length = 0; options.length = 0; providerMode = "ok"; state.limitOk = true;
  openai.mockClear(); recordConversion.mockClear();
});

const stored = () => db.tables.program_applications[0];
const toApplicant = () => sent.find((m) => m.to !== "martin@example.com");
const invitations = () => sent.filter((m) => m.subject === "Let’s have a conversation");

describe("1-2. every valid applicant reaches the booking screen, with no screening", () => {
  it.each([
    ["an employed senior leader", {}],
    ["someone between roles", { employment: "Unemployed / between roles" }],
    ["'Other' (recently laid off)", { employment: "Other", employmentOther: "Recently laid off" }],
    ["an existing business owner", { employment: "Business owner / entrepreneur" }],
    ["someone with no idea yet", { stage: "I know I want to build something of my own, but I don’t have a business idea yet.", timing: "I don’t know yet" }],
    ["a one-character answer", { motivation: "x", help: "?" }],
  ])("%s", async (_n, patch) => {
    const res = await apply({ ...base, ...patch });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.bookingUrl.startsWith(`${INTRO_BOOKING_URL}?`)).toBe(true);
    expect(json).not.toHaveProperty("route");
    expect(stored()).toMatchObject({ status: "INVITED", booking_status: "not_booked", ai_route: null, ai_confidence: null });
    expect(invitations()).toHaveLength(1);
  });

  it("never calls OpenAI, and the qualification module no longer exists", async () => {
    await apply(base);
    expect(openai).not.toHaveBeenCalled();
    const root = path.resolve(__dirname, "../../../../..");
    expect(fs.existsSync(path.join(root, "app/lib/programs/classify.ts"))).toBe(false);
    const route = fs.readFileSync(path.join(__dirname, "route.ts"), "utf8");
    expect(route).not.toMatch(/openai|classif|qualif|REVIEW_FALLBACK|effectiveRoute/i);
  });

  it("the response is only what the confirmation screen needs: no name, email, answers or application id", async () => {
    const json = await (await apply(base)).json();
    expect(Object.keys(json).sort()).toEqual(["bookingUrl", "community", "invitationEmail", "receiptToken", "success"]);
    expect(JSON.stringify(json)).not.toMatch(/elena|example\.com|Spain/i);
    expect(JSON.stringify(json)).not.toContain(stored().id);
  });

  it("the booking link carries the application's opaque booking_ref, and the email carries the SAME link", async () => {
    const json = await (await apply(base)).json();
    const url = new URL(json.bookingUrl);
    expect(`${url.origin}${url.pathname}`).toBe(INTRO_BOOKING_URL);
    expect(url.searchParams.get("utm_content")).toBe(stored().booking_ref);
    expect(stored().booking_ref).not.toBe(stored().receipt_token);
    expect(stored().booking_ref).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(json.bookingUrl).not.toMatch(/elena|example\.com|name=|email=/i);
    expect(toApplicant()!.text).toContain(json.bookingUrl);
  });
});

describe("3. booking never depends on email delivery", () => {
  it.each([["the provider refuses", "refuse"], ["the provider is unreachable", "throw"]] as const)("%s: still saved, still 200, booking link returned, truthful message state", async (_n, mode) => {
    providerMode = mode;
    const res = await apply(base);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.bookingUrl).toContain(INTRO_BOOKING_URL);
    expect(json.invitationEmail).toBe("not_sent");
    expect(db.tables.program_applications).toHaveLength(1);
    expect(stored()).toMatchObject({ applicant_email_status: "failed" });
    expect(db.tables.program_invitation_sends).toMatchObject([{ kind: "initial", status: mode === "throw" ? "pending" : "failed" }]);
    expect(db.tables.program_invitation_sends[0].error).toBeTruthy();
    expect(recordConversion).toHaveBeenCalledTimes(1);
  });

  it("a failed internal notification does not affect the applicant or the invitation", async () => {
    vi.stubEnv("PROGRAM_ADMIN_EMAIL", "");
    const json = await (await apply(base)).json();
    vi.unstubAllEnvs();
    expect(json.invitationEmail).toBe("sent");
    expect(stored()).toMatchObject({ admin_notification_status: "failed", applicant_email_status: "queued" });
  });

  it("a successful send is recorded with the provider message id", async () => {
    const json = await (await apply(base)).json();
    expect(json.invitationEmail).toBe("sent");
    expect(db.tables.program_invitation_sends).toMatchObject([{ kind: "initial", status: "accepted", provider_message_id: expect.stringMatching(/^msg_/) }]);
    expect(stored()).toMatchObject({ applicant_email_status: "queued", admin_notification_status: "queued" });
  });

  it("the invitation goes to the applicant with a provider idempotency key; the admin notification asks for no decision", async () => {
    await apply(base);
    const mail = toApplicant()!;
    expect(mail.to).toBe("elena@example.com");
    expect(options[sent.indexOf(mail)]).toEqual({ idempotencyKey: `transition-invite/${stored().id}/0` });
    const admin = sent.find((m) => m.to === "martin@example.com")!;
    expect(admin.subject).toBe("New Corporate Transition application — Elena Test");
    expect(admin.html + admin.text).not.toMatch(/needs review|REVIEW|NOT_FIT/);
  });
});

describe("5. retries and repeated submissions do not create duplicate invitations", () => {
  it("the same idempotency key twice: one application, one invitation, one admin notification, one conversion; the same receipt", async () => {
    const a = await (await apply(base, "same")).json();
    const b = await (await apply(base, "same")).json();
    expect(db.tables.program_applications).toHaveLength(1);
    expect(db.tables.leads).toHaveLength(1);
    expect(invitations()).toHaveLength(1);
    expect(sent).toHaveLength(2); // invitation + admin notification, nothing more
    expect(db.tables.program_invitation_sends).toHaveLength(1);
    expect(recordConversion).toHaveBeenCalledTimes(1);
    expect(b.receiptToken).toBe(a.receiptToken);
    expect(b.bookingUrl).toBe(a.bookingUrl);
    expect(b.invitationEmail).toBe("sent");
  });

  it("two requests racing on one key still produce one application and one invitation", async () => {
    const [a, b] = await Promise.all([apply(base, "race"), apply(base, "race")]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(db.tables.program_applications).toHaveLength(1);
    expect(invitations()).toHaveLength(1);
  });

  it("a retry after a failed invitation does not email again on its own (a resend is an explicit admin action)", async () => {
    providerMode = "refuse-invitation-only";
    await apply(base, "k");
    providerMode = "ok";
    const retry = await (await apply(base, "k")).json();
    expect(invitations()).toHaveLength(0);
    expect(retry.invitationEmail).toBe("not_sent");
  });
});

describe("no marketing consent can come from the application", () => {
  it("a stray marketingConsent value is ignored: nothing stored, no lead opt-in, no consent record, no confirmation email", async () => {
    await apply({ ...base, marketingConsent: true });
    expect(stored().answers).not.toHaveProperty("marketingConsent");
    expect(stored()).toMatchObject({ community_choice: null });
    expect(db.tables.leads[0]).toMatchObject({ ongoing_content_opt_in: false, consent_requested_at: null });
    expect(db.tables.consent_records).toHaveLength(0);
    expect(sent.some((m) => /stay connected/i.test(m.subject))).toBe(false);
  });
  it("the invitation is transactional: no community invitation or unsubscribe link", async () => {
    await apply(base);
    expect(toApplicant()!.html + toApplicant()!.text).not.toMatch(/unsubscribe|community|shortlist/i);
  });
});

describe("12. Website Intelligence and lead attribution stay intact", () => {
  it("records ONE server-confirmed conversion by reference only, and keeps attribution and the lead", async () => {
    await apply(base);
    expect(recordConversion).toHaveBeenCalledTimes(1);
    const [, arg] = recordConversion.mock.calls[0] as unknown as [Request, Record<string, string>];
    expect(arg).toEqual({ kind: "program_application", refTable: "program_applications", refId: stored().id });
    expect(stored().attribution).toMatchObject({ source: "linkedin", utm_campaign: "oct" });
    expect(db.tables.leads[0]).toMatchObject({ email: "elena@example.com", first_name: "Elena", country: "Spain" });
    expect(stored().lead_id).toBe(db.tables.leads[0].id);
  });
  it("a refused or invalid submission records no conversion", async () => {
    await apply({ ...base, email: "nope" });
    expect(recordConversion).not.toHaveBeenCalled();
  });
  it("the same person applying again later is a second application on the same lead", async () => {
    await apply(base, "one");
    await apply(base, "two");
    expect(db.tables.leads).toHaveLength(1);
    expect(db.tables.program_applications).toHaveLength(2);
  });
});

describe("invalid or incomplete submissions are still refused and store nothing", () => {
  it.each([
    ["missing employment", { employment: "" }],
    ["empty motivation", { motivation: "" }],
    ["whitespace-only motivation", { motivation: "   \n\t  " }],
    ["empty help", { help: "" }],
    ["whitespace-only help", { help: "    " }],
    ["missing first name", { firstName: "" }],
    ["bad email", { email: "nope" }],
    ["missing country", { country: "" }],
  ])("%s", async (_n, patch) => {
    const res = await apply({ ...base, ...patch });
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors).toBeTruthy();
    expect(db.tables.program_applications).toHaveLength(0);
    expect(db.tables.leads).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("uses the plain message for an unanswered long-text question", async () => {
    const json = await (await apply({ ...base, motivation: "  ", help: "" })).json();
    expect(json.fieldErrors).toEqual({ motivation: "Please answer this question.", help: "Please answer this question." });
  });

  it("accepts one-character long-text answers (no minimum length)", async () => {
    const res = await apply({ ...base, motivation: "x", help: " 7 " });
    expect(res.status).toBe(200);
    expect(db.tables.program_applications).toHaveLength(1);
  });

  it("still enforces the 1500-character maximum on long-text answers", async () => {
    const res = await apply({ ...base, motivation: "a".repeat(2000) });
    expect(res.status).toBe(200);
    expect(stored().answers.motivation).toHaveLength(1500);
  });

  it("the honeypot is still rejected", async () => {
    const res = await apply(base, "k", { website: "http://spam" });
    expect(res.status).toBe(400);
    expect(db.tables.program_applications).toHaveLength(0);
  });

  it("the rate limit is still enforced", async () => {
    state.limitOk = false;
    const res = await apply(base);
    expect(res.status).toBe(429);
    expect(db.tables.program_applications).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("a persistence failure is reported and nothing is sent", async () => {
    db.failNextInsertInto = "program_applications";
    const res = await apply(base);
    expect(res.status).toBe(500);
    expect(sent).toHaveLength(0);
    expect(recordConversion).not.toHaveBeenCalled();
  });
});
