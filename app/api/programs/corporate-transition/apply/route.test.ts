/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => true, getClientIp: () => "203.0.113.7" }));

const sent: Array<Record<string, any>> = [];
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>) => { sent.push(m); return { data: { id: "e1" }, error: null }; } } }) }));

let aiRoute: "INVITE" | "REVIEW" | "NOT_FIT" | "THROW" = "NOT_FIT";
vi.mock("@/app/lib/programs/classify", async (orig) => {
  const real: any = await orig();
  return {
    ...real,
    classifyTransition: async () => {
      if (aiRoute === "THROW") throw new Error("model down");
      return { route: aiRoute, confidence: "HIGH", reasoning: ["r"], concerns: ["original concern"], preCallSummary: "AI summary", reviewDraft: "Draft reply from the AI." };
    },
  };
});

process.env.EVIDENCE_HASH_SECRET = "s";
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "s";
process.env.RESEND_API_KEY = "k";
process.env.PROGRAM_ADMIN_EMAIL = "martin@example.com";

import { POST } from "./route";

const base = {
  employment: "Director / senior leader", experience: "20+ years", stage: "I have several ideas or possibilities and don’t know which one to pursue.",
  timing: "6–12 months", motivation: "I want to build something of my own after years in corporate.", help: "Help me work out which idea is credible and how to test it.",
  country: "Spain", firstName: "Elena", lastName: "Test", email: "elena@example.com", linkedin: "", marketingConsent: false,
};

const apply = (answers: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/programs/corporate-transition/apply", { method: "POST", headers: { "content-type": "application/json", "user-agent": "t" }, body: JSON.stringify({ answers, attribution: { source: "linkedin.com", medium: "referral" }, idempotencyKey: crypto.randomUUID(), website: "" }) }));

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  sent.length = 0;
  delete process.env.TRANSITION_AUTO_QUALIFICATION;
  aiRoute = "NOT_FIT";
});

const stored = () => db.tables.program_applications[0];
const toApplicant = () => sent.find((m) => m.to !== "martin@example.com");

describe("automatic rejection is disabled (temporary mode, the default)", () => {
  it("1. employed professional the AI would invite: unchanged, still invited", async () => {
    aiRoute = "INVITE";
    const json = await (await apply(base)).json();
    expect(json.route).toBe("INVITE");
    expect(stored()).toMatchObject({ status: "INVITED", ai_route: "INVITE" });
  });

  it("2. 'Other' (e.g. recently laid off) the AI would reject: accepted for manual review", async () => {
    const res = await apply({ ...base, employment: "Other", employmentOther: "Recently laid off" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.route).toBe("REVIEW");
    expect(stored()).toMatchObject({ status: "UNDER_REVIEW", ai_route: "NOT_FIT", ai_confidence: "HIGH" }); // AI assessment preserved
    expect(stored().ai_concerns).toContain("original concern");
    expect(stored().ai_concerns.join(" ")).toMatch(/manual review/);
    expect(stored().response_draft).toBe("Draft reply from the AI.");
    expect(stored().answers.employmentOther).toBe("Recently laid off");
  });

  it("3. unemployed / between roles (AI says NOT_FIT): saved, manual review, no rejection email", async () => {
    const json = await (await apply({ ...base, employment: "Unemployed / between roles" })).json();
    expect(json.route).toBe("REVIEW");
    expect(stored()).toMatchObject({ status: "UNDER_REVIEW", ai_route: "NOT_FIT" });
    const mail = toApplicant()!;
    expect(mail.subject).toBe("I’ve received your application");
    expect(mail.html).toContain("I aim to get back to you by email within 48 hours.");
    expect(mail.html).not.toContain("don’t think this particular pathway is the right next step");
    expect(sent.some((m) => /Thank you for sharing your situation/.test(m.subject))).toBe(false);
  });

  it("3b. unemployed the AI would INVITE is never auto-invited: Martin decides the next step", async () => {
    aiRoute = "INVITE";
    const json = await (await apply({ ...base, employment: "Unemployed / between roles" })).json();
    expect(json.route).toBe("REVIEW");
    expect(stored()).toMatchObject({ status: "UNDER_REVIEW", ai_route: "INVITE" });
    expect(toApplicant()!.html).not.toMatch(/calendly/i);
  });

  it("4. an applicant rejected for another business-fit reason (existing business owner) is accepted for review", async () => {
    const json = await (await apply({ ...base, employment: "Business owner / entrepreneur" })).json();
    expect(json.route).toBe("REVIEW");
    expect(stored()).toMatchObject({ status: "UNDER_REVIEW", ai_route: "NOT_FIT" });
  });

  it("the admin notification flags the application for review and notes the AI's suggestion; both email states are recorded", async () => {
    await apply({ ...base, employment: "Unemployed / between roles" });
    const admin = sent.find((m) => m.to === "martin@example.com")!;
    expect(admin.subject).toContain("needs review");
    expect(admin.html).toContain("AI suggested NOT_FIT");
    expect(stored()).toMatchObject({ applicant_email_status: "queued", admin_notification_status: "queued" });
  });

  it("an AI failure still routes to manual review", async () => {
    aiRoute = "THROW";
    const json = await (await apply({ ...base, employment: "Unemployed / between roles" })).json();
    expect(json.route).toBe("REVIEW");
    expect(stored().status).toBe("UNDER_REVIEW");
  });

  it("saves the lead and keeps every application reviewable (nothing is dropped)", async () => {
    await apply({ ...base, employment: "Unemployed / between roles" });
    await apply({ ...base, email: "other@example.com", firstName: "Other" });
    expect(db.tables.program_applications).toHaveLength(2);
    expect(db.tables.leads).toHaveLength(2);
  });
});

describe("5. invalid or incomplete submissions are still refused and store nothing", () => {
  it.each([
    ["missing employment", { employment: "" }],
    ["short motivation", { motivation: "short" }],
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

  it("the honeypot is still rejected", async () => {
    const res = await POST(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: base, website: "http://spam" }) }));
    expect(res.status).toBe(400);
    expect(db.tables.program_applications).toHaveLength(0);
  });
});

describe("the original qualification is easy to restore", () => {
  it("TRANSITION_AUTO_QUALIFICATION=enabled brings back the original routing exactly", async () => {
    process.env.TRANSITION_AUTO_QUALIFICATION = "enabled";
    const rejected = await (await apply({ ...base, employment: "Unemployed / between roles" })).json();
    expect(rejected.route).toBe("NOT_FIT");
    expect(stored()).toMatchObject({ status: "NOT_FIT", ai_route: "NOT_FIT", response_draft: null });
    expect(sent.some((m) => /Thank you for sharing your situation/.test(m.subject))).toBe(true);

    db.tables.program_applications = []; db.tables.leads = []; sent.length = 0;
    aiRoute = "INVITE";
    expect((await (await apply({ ...base, employment: "Unemployed / between roles", email: "z@example.com" })).json()).route).toBe("INVITE");
  });
});
