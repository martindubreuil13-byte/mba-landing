import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "test-secret";

const providerSend = vi.fn();
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: providerSend } }) }));

import { adminMessage, invitationMessage, manualResponseMessage, schedulingUrl, sendInternalNotification, sendInvitation, sendManualResponse } from "./email";
import { programAdminTo, programFrom, programReplyTo } from "./routing";
import { CALENDLY_URL } from "./corporate-transition";
import { INTRO_BOOKING_URL, introBookingUrl } from "@/app/lib/booking";

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

const BOOKING = introBookingUrl("ref_abc-123");

describe("booking invitation: subject, copy, button and link", () => {
  it("has the approved subject and wording, in order", () => {
    const m = invitationMessage("Alex", BOOKING);
    expect(m.subject).toBe("Let’s have a conversation");
    const lines = [
      "Hi Alex,",
      "Thanks for taking the time to tell me a little about yourself and what you’re thinking of doing.",
      "The next step is simple. Let’s have a conversation.",
      "You can book a Zoom call with me using the button below.",
      "Pick whatever works best for you.",
      "If you’ve already booked directly from the confirmation page, there’s nothing else you need to do. This is the same booking link, not a second appointment.",
      "One small thing: depending on where you are in the world, available slots can sometimes be limited because of time-zone differences.",
      "If you can’t find anything suitable, just reply to this email and we’ll figure something out.",
      "Looking forward to talking.",
    ];
    let at = 0;
    for (const line of lines) { const i = m.html.indexOf(line.replace(/’/g, "’"), at); expect(i, line).toBeGreaterThan(-1); at = i; }
    let t = 0;
    for (const line of [...lines.slice(0, 4), "BOOK YOUR CONVERSATION", ...lines.slice(4)]) { const i = m.text.indexOf(line, t); expect(i, line).toBeGreaterThan(-1); t = i; }
  });
  it("one oxblood button, BOOK YOUR CONVERSATION, to the SAME Calendly event as the confirmation screen, carrying the opaque ref", () => {
    const m = invitationMessage("Alex", BOOKING);
    expect(m.html.match(/bgcolor="#6b1f1f"/g)?.length).toBe(1);
    expect(m.html).toMatch(/bgcolor="#6b1f1f"[^>]*><a href="[^"]+"[^>]*>BOOK YOUR CONVERSATION<\/a>/);
    expect(BOOKING.startsWith(`${INTRO_BOOKING_URL}?`)).toBe(true);
    expect(new URL(BOOKING).searchParams.get("utm_content")).toBe("ref_abc-123");
    expect(m.text).toContain(`BOOK YOUR CONVERSATION: ${BOOKING}`);
    expect(m.links).toContain(BOOKING);
    // The `&` between query parameters is escaped in the HTML attribute, and parity with the plain text still holds.
    expect(m.html).toContain(BOOKING.replace(/&/g, "&amp;"));
    parity(m);
  });
  it("signature, brand and plain-text version", () => {
    const m = invitationMessage("Alex", BOOKING);
    expect(m.html).toContain("Martin Dubreuil</strong><br>The Modern Business Architect");
    expect(m.text).toContain("Martin Dubreuil\nThe Modern Business Architect\nhttps://modernbusinessarchitect.com");
    expect(m.text.length).toBeGreaterThan(300);
    expect(m.html).toContain("#f6f2ec"); expect(m.html).toContain("#6b1f1f");
  });
  it("is transactional only: no marketing, no community invitation, no unsubscribe, no tracking pixel or remote image", () => {
    const m = invitationMessage("Alex", BOOKING);
    for (const body of [m.html, m.text]) expect(body).not.toMatch(/unsubscribe|community|newsletter|shortlist|subscribe|guides|resources/i);
    expect(m.html).not.toMatch(/<img|<script|<link|<iframe|url\(|@import|pixel|beacon/i);
    expect(m.html).not.toMatch(/https?:\/\/[^"' ]*(track|open|pixel)[^"' ]*/i);
    expect(m.links.filter((l) => !l.includes("modernbusinessarchitect.com") && !l.includes("calendly.com"))).toEqual([]);
  });
  it("does not screen: no review, fit, approval or 48-hour language", () => {
    const m = invitationMessage("Alex", BOOKING);
    expect(m.html + m.text).not.toMatch(/review|not the right fit|probably isn|qualif|approve|48 hours|within \d+ hours/i);
  });
  it("without a valid https link the button is omitted, never a broken URL", () => {
    for (const bad of [null, "", "not a url", "http://insecure.example", "javascript:alert(1)"]) {
      const m = invitationMessage("Alex", bad);
      expect(m.html).not.toContain("BOOK YOUR CONVERSATION");
      expect(m.html).not.toContain("bgcolor=");
    }
  });
  it("the configured scheduling link is a valid https URL", () => {
    expect(schedulingUrl()).toBe(CALENDLY_URL);
    expect(introBookingUrl()).toBe(INTRO_BOOKING_URL);
  });
  it("escapes the applicant's first name", () => {
    const m = invitationMessage("<img src=x onerror=alert(1)>", BOOKING);
    expect(m.html).not.toContain("<img");
    expect(m.html).toContain("&lt;img");
  });
});

describe("shared visual shell (customer emails)", () => {
  const all = () => [invitationMessage("A", BOOKING), manualResponseMessage({ subject: "S", message: "Hello", schedulingUrl: CALENDLY_URL })];
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
    for (const m of all().slice(0, 1)) { expect(m.html).toContain("Martin Dubreuil</strong><br>The Modern Business Architect"); expect(m.text).toContain("Martin Dubreuil\nThe Modern Business Architect"); }
  });
  it("footer: Privacy yes, Unsubscribe NO on transactional messages; postal address only when configured", () => {
    for (const m of all()) { expect(m.html).toContain(">Privacy</a>"); expect(m.html).not.toMatch(/unsubscribe/i); expect(m.text).not.toMatch(/unsubscribe/i); expect(m.html).not.toContain("Narva"); }
    vi.stubEnv("MAILING_ADDRESS", "MINDRA\nNarva mnt 5\n10117 Tallinn\nEstonia");
    const m = invitationMessage("A", BOOKING);
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
  it("is utilitarian: internal eyebrow, details, an Admin button, no customer footer or unsubscribe, and nothing awaiting a decision", () => {
    const m = adminMessage("app-1", "Alex Doe", APPLICANT, "Spain");
    expect(m.subject).toBe("New Corporate Transition application — Alex Doe");
    expect(m.html).toContain("INTERNAL — NEW APPLICATION");
    for (const v of ["Alex Doe", APPLICANT, "Spain"]) { expect(m.html).toContain(v); expect(m.text).toContain(v); }
    expect(m.html).toContain("Open application in Admin");
    expect(m.text).toContain("Open application in Admin: https://modernbusinessarchitect.com/admin/programs/corporate-transition/app-1");
    expect(m.html + m.text).not.toMatch(/needs review|REVIEW|NOT_FIT|INVITE\b|route/);
    expect(m.html).not.toMatch(/unsubscribe|Sent by Martin Dubreuil|Privacy/i);
    expect(m.text).not.toMatch(/unsubscribe|Sent by Martin Dubreuil|Privacy/i);
    parity(m);
  });
});

describe("routing: every to, from and replyTo", () => {
  it("booking invitation: to applicant, reply-to PROGRAM_REPLY_TO, from the verified sender, with a provider idempotency key and no tracking headers", async () => {
    const id = await sendInvitation(APPLICANT, invitationMessage("A", BOOKING), "transition-invite/app-1/0");
    expect(id).toBe("msg_1");
    const p = providerSend.mock.calls[0][0];
    expect([p.to, p.from, p.replyTo]).toEqual([APPLICANT, FROM, MARTIN]);
    expect(p.subject).toBe("Let’s have a conversation");
    expect(p.html).toBeTruthy(); expect(p.text).toBeTruthy();
    expect(providerSend.mock.calls[0][1]).toEqual({ idempotencyKey: "transition-invite/app-1/0" });
    expect(p.headers).toBeUndefined();
    expect(JSON.stringify(p)).not.toMatch(/tracking|open_tracking|click_tracking/);
  });
  it("manual response: to applicant, reply-to PROGRAM_REPLY_TO", async () => {
    await sendManualResponse(APPLICANT, manualResponseMessage({ subject: "S", message: "Hi" }));
    const p = providerSend.mock.calls[0][0];
    expect([p.to, p.from, p.replyTo]).toEqual([APPLICANT, FROM, MARTIN]);
  });
  it("internal notification: to PROGRAM_ADMIN_EMAIL, reply-to the applicant, never ADMIN_EMAIL", async () => {
    await sendInternalNotification(adminMessage("a", "A B", APPLICANT), APPLICANT);
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
      await expect(sendInternalNotification(adminMessage("a", "A B"), APPLICANT)).rejects.toThrow(/PROGRAM_ADMIN_EMAIL is not configured/);
    }
    expect(providerSend).not.toHaveBeenCalled();
  });
  it("no PROGRAM_REPLY_TO: customer emails still go out without a Reply-To header (replies reach the From mailbox)", async () => {
    vi.stubEnv("PROGRAM_REPLY_TO", "");
    expect(programReplyTo()).toBeNull();
    await sendInvitation(APPLICANT, invitationMessage("A", BOOKING), "k");
    expect("replyTo" in providerSend.mock.calls[0][0]).toBe(false);
  });
  it("a provider refusal surfaces as an error for the caller to record", async () => {
    providerSend.mockResolvedValue({ data: null, error: { message: "blocked" } });
    await expect(sendInvitation(APPLICANT, invitationMessage("A", BOOKING), "k")).rejects.toThrow("blocked");
  });
});
