import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";

const providerSend = vi.fn();
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: providerSend } }) }));

import { adminMessage, applicantMessage, manualResponseMessage, schedulingUrl, sendApplicantAck, sendInternalNotification, sendManualResponse } from "./email";
import { programAdminTo, programFrom, programReplyTo } from "./routing";
import { CALENDLY_URL } from "./corporate-transition";

const FROM = "Martin Dubreuil <martin@mindrasolutions.com>";
const MARTIN = "martin@mindrasolutions.com";
const APPLICANT = "applicant@example.test";

beforeEach(() => {
  providerSend.mockReset();
  providerSend.mockResolvedValue({ data: { id: "msg_1" }, error: null });
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("APP_BASE_URL", "");
  vi.stubEnv("VERCEL_URL", "");
  vi.stubEnv("PROGRAM_ADMIN_EMAIL", MARTIN);
  vi.stubEnv("PROGRAM_REPLY_TO", MARTIN);
  vi.stubEnv("PROGRAM_EMAIL_FROM", "");
  vi.stubEnv("ADMIN_EMAIL", "admin-login@example.test");
  vi.stubEnv("MAILING_ADDRESS", "");
});
afterEach(() => vi.unstubAllEnvs());

const parity = (m: { html: string; text: string }) => {
  for (const x of m.html.matchAll(/href="(https?:[^"]+)"/g)) {
    const url = x[1].replace(/&amp;/g, "&");
    if (url !== "https://modernbusinessarchitect.com") expect(m.text, url).toContain(url);
  }
};

describe("applicant acknowledgements: subjects, preview text, headings and copy", () => {
  it("REVIEW", () => {
    const m = applicantMessage("REVIEW", "Alex");
    expect(m.subject).toBe("I’ve received your application");
    expect(m.preview).toBe("I’ll review what you’ve shared and come back to you personally.");
    expect(m.html).toContain(">I’ve received your application</h1>");
    for (const line of ["Hi Alex,", "Thank you for taking the time to share where you are and what you’re considering.", "before suggesting what—if anything—the right next step should be.", "You’ll hear from me by email within 48 hours.", "There is nothing else you need to do for now."]) { expect(m.html).toContain(line); expect(m.text).toContain(line); }
    expect(m.html).not.toContain("bgcolor=");
    expect(m.links.filter((l) => l.includes("calendly"))).toEqual([]);
  });
  it("INVITE with the configured scheduling link", () => {
    const m = applicantMessage("INVITE", "Alex");
    expect(m.subject).toBe("Let’s have a conversation");
    expect(m.preview).toBe("What you’ve shared suggests there may be something worth exploring.");
    expect(m.html).toContain(">There may be something worth exploring</h1>");
    expect(m.html).toContain("You can choose a time below.");
    expect(m.html).toMatch(/bgcolor="#6b1f1f"[^>]*><a href="https:\/\/calendly\.com\/[^"]+"[^>]*>Choose a time to talk<\/a>/);
    expect(m.text).toContain(`Choose a time to talk: ${CALENDLY_URL}`);
    expect(m.html.match(/bgcolor="#6b1f1f"/g)?.length).toBe(1);
  });
  it("INVITE without a valid scheduling link omits the button and says Martin will follow up, never a broken URL", () => {
    for (const bad of [null, "", "not a url", "http://insecure.example", "javascript:alert(1)"]) {
      const m = applicantMessage("INVITE", "Alex", { schedulingUrl: bad });
      expect(m.html).not.toContain("Choose a time to talk");
      expect(m.html).not.toContain("bgcolor=");
      expect(m.html).not.toContain("You can choose a time below.");
      expect(m.html).toContain("I’ll follow up with you personally by email");
    }
  });
  it("the configured scheduling link is a valid https URL", () => {
    expect(schedulingUrl()).toBe(CALENDLY_URL);
  });
  it("NOT_FIT: candid, one quiet resources link, no sales button", () => {
    const m = applicantMessage("NOT_FIT", "Alex");
    expect(m.subject).toBe("Thank you for sharing your situation");
    expect(m.preview).toBe("A candid response about the next step.");
    expect(m.html).toContain(">A candid response</h1>");
    expect(m.html).toContain("That is not a judgment on your ambition or your ability.");
    expect(m.html).toContain("https://modernbusinessarchitect.com/resources");
    expect(m.html).not.toContain("bgcolor=");
    expect(m.html).not.toContain("calendly");
  });
  it("selects a different template per route", () => {
    const subjects = (["REVIEW", "INVITE", "NOT_FIT"] as const).map((r) => applicantMessage(r, "A").subject);
    expect(new Set(subjects).size).toBe(3);
  });
  it("escapes the applicant's first name", () => {
    const m = applicantMessage("REVIEW", '<img src=x onerror=alert(1)>');
    expect(m.html).not.toContain("<img");
    expect(m.html).toContain("&lt;img");
  });
});

describe("shared visual shell (customer emails)", () => {
  const all = () => [applicantMessage("REVIEW", "A"), applicantMessage("INVITE", "A"), applicantMessage("NOT_FIT", "A"), manualResponseMessage({ subject: "S", message: "Hello", schedulingUrl: CALENDLY_URL })];
  it("is table-based, 600px, Georgia + Arial, with the eyebrow, hidden preview text and no external resources", () => {
    for (const m of all()) {
      expect(m.html).toContain("max-width:600px");
      expect(m.html).toContain('role="presentation"');
      expect(m.html).toContain("Georgia");
      expect(m.html).toContain("Arial,Helvetica");
      expect(m.html).toContain(">The Modern Business Architect</p>");
      expect(m.html).toMatch(/<div style="display:none[^>]*max-height:0[^>]*overflow:hidden[^>]*>/);
      expect(m.html.split(m.preview).length - 1).toBe(1);
      expect(m.html).not.toMatch(/<script|<link|<img|@import|@font-face|url\(|<style/i);
      expect(m.text.startsWith(m.preview)).toBe(true);
      parity(m);
    }
  });
  it("ends with the signature (except a manual response, which carries Martin's own sign-off)", () => {
    for (const m of all().slice(0, 3)) { expect(m.html).toContain("Martin Dubreuil</strong><br>The Modern Business Architect"); expect(m.text).toContain("Martin Dubreuil\nThe Modern Business Architect"); }
  });
  it("footer: Privacy yes, Unsubscribe NO on transactional messages; postal address only when configured", () => {
    for (const m of all()) { expect(m.html).toContain(">Privacy</a>"); expect(m.html).not.toMatch(/unsubscribe/i); expect(m.text).not.toMatch(/unsubscribe/i); expect(m.html).not.toContain("Narva"); }
    vi.stubEnv("MAILING_ADDRESS", "MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia");
    const m = applicantMessage("REVIEW", "A");
    expect(m.html).toContain("MINDRA<br>Narva mnt 5<br>10117 Tallinn<br>Estonia<br>");
    expect(m.text).toContain("MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia");
  });
});

describe("manual response from Admin", () => {
  const message = "Hi Sam,\n\nThanks for the detail — <b>honestly</b> & candidly:\n  1) line one\n2) line two\n\nSee https://example.com/a?b=1&c=2.\n— Martin";
  it("preserves Martin's message exactly in the plain text and escapes it in HTML", () => {
    const m = manualResponseMessage({ subject: "A conversation about what comes next", message });
    expect(m.text).toContain(message);
    expect(m.html).not.toContain("<b>honestly</b>");
    expect(m.html).toContain("&lt;b&gt;honestly&lt;/b&gt; &amp; candidly:");
    expect(m.html).toContain("1) line one<br>2) line two".replace("1) line one", "  1) line one"));
    expect(m.html).toContain('<a href="https://example.com/a?b=1&amp;c=2"');
    expect(m.subject).toBe("A conversation about what comes next");
  });
  it("scheduling CTA only with a valid URL passed as data", () => {
    expect(manualResponseMessage({ subject: "S", message: "Hi" }).html).not.toContain("Choose a time to talk");
    expect(manualResponseMessage({ subject: "S", message: "Hi", schedulingUrl: "nope" }).html).not.toContain("Choose a time to talk");
    expect(manualResponseMessage({ subject: "S", message: "Hi", schedulingUrl: "http://x.example" }).html).not.toContain("Choose a time to talk");
    const ok = manualResponseMessage({ subject: "S", message: "Hi", schedulingUrl: CALENDLY_URL });
    expect(ok.html.match(/Choose a time to talk/g)?.length).toBe(1);
    expect(ok.text).toContain(`Choose a time to talk: ${CALENDLY_URL}`);
    // The message already contains the link as text: no duplicate button, and the message itself is untouched.
    const dup = manualResponseMessage({ subject: "S", message: `Pick a slot: ${CALENDLY_URL}`, schedulingUrl: CALENDLY_URL });
    expect(dup.html).not.toContain("Choose a time to talk");
    expect(dup.text).toContain(`Pick a slot: ${CALENDLY_URL}`);
  });
});

describe("internal notification", () => {
  it("is utilitarian: internal eyebrow, details, an Admin button, no customer footer or unsubscribe", () => {
    const m = adminMessage("app-1", "Alex Doe", "REVIEW", "Senior leader, 6–12 months.\nSecond line.", APPLICANT);
    expect(m.subject).toBe("Corporate Transition application needs review — Alex Doe");
    expect(adminMessage("a", "Alex Doe", "INVITE", "s").subject).toBe("New Corporate Transition application — Alex Doe (INVITE)");
    expect(m.html).toContain("INTERNAL — APPLICATION REVIEW");
    for (const v of ["Alex Doe", APPLICANT, "REVIEW", "Senior leader, 6–12 months."]) { expect(m.html).toContain(v); expect(m.text).toContain(v); }
    expect(m.html).toContain("Open application in Admin");
    expect(m.text).toContain("Open application in Admin: https://modernbusinessarchitect.com/admin/programs/corporate-transition/app-1");
    expect(m.html).not.toMatch(/unsubscribe|Sent by Martin Dubreuil|Privacy/i);
    expect(m.text).not.toMatch(/unsubscribe|Sent by Martin Dubreuil|Privacy/i);
    parity(m);
  });
});

describe("routing: every to, from and replyTo", () => {
  it("applicant acknowledgement: to applicant, reply-to PROGRAM_REPLY_TO, from the verified sender", async () => {
    await sendApplicantAck(APPLICANT, applicantMessage("REVIEW", "A"));
    const p = providerSend.mock.calls[0][0];
    expect([p.to, p.from, p.replyTo]).toEqual([APPLICANT, FROM, MARTIN]);
    expect(p.subject).toBe("I’ve received your application");
    expect(p.html).toBeTruthy(); expect(p.text).toBeTruthy();
  });
  it("manual response: to applicant, reply-to PROGRAM_REPLY_TO", async () => {
    await sendManualResponse(APPLICANT, manualResponseMessage({ subject: "S", message: "Hi" }));
    const p = providerSend.mock.calls[0][0];
    expect([p.to, p.from, p.replyTo]).toEqual([APPLICANT, FROM, MARTIN]);
  });
  it("internal notification: to PROGRAM_ADMIN_EMAIL, reply-to the applicant, never ADMIN_EMAIL", async () => {
    await sendInternalNotification(adminMessage("a", "A B", "REVIEW", "s", APPLICANT), APPLICANT);
    const p = providerSend.mock.calls[0][0];
    expect([p.to, p.from, p.replyTo]).toEqual([MARTIN, FROM, APPLICANT]);
    expect(JSON.stringify(p)).not.toContain("admin-login@example.test");
  });
  it("PROGRAM_EMAIL_FROM can override the sender; the default is the verified sender", () => {
    expect(programFrom()).toBe(FROM);
    vi.stubEnv("PROGRAM_EMAIL_FROM", "Martin Dubreuil <martin@verified.example>");
    expect(programFrom()).toBe("Martin Dubreuil <martin@verified.example>");
  });
});

describe("missing or invalid routing variables fail safely", () => {
  it("no PROGRAM_ADMIN_EMAIL: no internal notification is sent, and ADMIN_EMAIL is NOT used as a fallback", async () => {
    for (const v of ["", "   ", "not-an-address"]) {
      vi.stubEnv("PROGRAM_ADMIN_EMAIL", v);
      expect(programAdminTo()).toBeNull();
      await expect(sendInternalNotification(adminMessage("a", "A B", "REVIEW", "s"), APPLICANT)).rejects.toThrow(/PROGRAM_ADMIN_EMAIL is not configured/);
    }
    expect(providerSend).not.toHaveBeenCalled();
  });
  it("no PROGRAM_REPLY_TO: customer emails still go out without a Reply-To header (replies reach the From mailbox)", async () => {
    vi.stubEnv("PROGRAM_REPLY_TO", "");
    expect(programReplyTo()).toBeNull();
    await sendApplicantAck(APPLICANT, applicantMessage("REVIEW", "A"));
    expect("replyTo" in providerSend.mock.calls[0][0]).toBe(false);
  });
  it("a provider refusal surfaces as an error for the caller to record", async () => {
    providerSend.mockResolvedValue({ data: null, error: { message: "blocked" } });
    await expect(sendApplicantAck(APPLICANT, applicantMessage("REVIEW", "A"))).rejects.toThrow("blocked");
  });
});
