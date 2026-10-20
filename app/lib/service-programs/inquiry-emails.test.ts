import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: vi.fn() } }) }));

import { CALENDLY_URL } from "@/app/lib/programs/corporate-transition";
import { PROGRAMS } from "./catalog";
import { firstNameOf, inquiryNotification, prospectConfirmation } from "./inquiry-emails";

const p03 = PROGRAMS[2];
const p06 = PROGRAMS[5];

describe("prospect confirmation", () => {
  const m = prospectConfirmation({ name: "Ada Lovelace", program: p03 });
  it("uses the approved subject, headline and copy", () => {
    expect(m.subject).toBe("Your next move — Modern Business Architect");
    for (const line of [
      "Good. Let's see what you're building.",
      "Hi Ada,",
      "Thanks for reaching out.",
      "Before we discuss next steps, I want to understand where you are, what you're trying to achieve, and whether I'm the right person to help.",
      "No sales pitch. No obligation. Just an initial conversation to see if there's a fit.",
      "Or simply reply to this email if you'd rather start there.",
      "Business Architect | Coach | Entrepreneur",
    ]) {
      expect(m.html.replace(/&#39;|&#x27;/g, "'")).toContain(line.replace(/&/g, "&amp;"));
      expect(m.text).toContain(line);
    }
    expect(m.html).toMatch(/I've received your message about <strong[^>]*>Pre-Architecture<\/strong>\./);
    expect(m.text).toContain("I've received your message about Pre-Architecture.");
  });
  it("has one oxblood button to the existing Calendly link, no raw-URL fallback line, plus the plain-text link", () => {
    expect(m.html).toContain(`href="${CALENDLY_URL}"`);
    expect(m.html.match(/bgcolor="#6b1f1f"/g)).toHaveLength(1);
    expect(m.html).toContain("Book our first conversation →");
    expect(m.html).not.toContain("Button not working");
    expect(m.text).toContain(`Book our first conversation →\n${CALENDLY_URL}`);
    expect(m.text.indexOf("I've received your message about")).toBe(m.text.lastIndexOf("I've received your message about")); // not duplicated by a preheader line
  });
  it("shows the website link in the signature and no marketing footer", () => {
    expect(m.html).toMatch(/Martin Dubreuil<\/strong><br>Business Architect \| Coach \| Entrepreneur<br><a href="https?:\/\/[^"]+"/);
    for (const footerish of ["Privacy", "Unsubscribe", "unsubscribe", "You are receiving"]) expect(m.html).not.toContain(footerish);
  });
  it("is not a receipt: nothing the visitor submitted is repeated", () => {
    const n = prospectConfirmation({ name: "Ada Lovelace", program: p03 });
    for (const echoed of ["ada@example.com", "my private message", "Program 03", "US$1,999", "linkedin"]) {
      expect(n.html).not.toContain(echoed);
      expect(n.text).not.toContain(echoed);
    }
  });
  it("is email-safe: inline styles only, no scripts or external resources, small, preheader present", () => {
    expect(m.html).not.toMatch(/<style|<script|<img|<link|url\(|@import/i);
    expect(Buffer.byteLength(m.html)).toBeLessThan(40_000);
    expect(m.html).toMatch(/display:none[^>]*>I've received your message about Pre-Architecture/);
    expect(m.html).toContain('name="viewport"');
    expect(m.html).toContain('bgcolor="#6b1f1f"');
    expect(m.html).toContain("#f6f2ec"); // ivory page
  });
  it("degrades honestly without a booking link or program", () => {
    const x = prospectConfirmation({ name: "  ", booking: null });
    expect(x.html).toContain("Hi there,");
    expect(x.html).not.toContain("Book our first conversation");
    expect(x.text).toContain("Just reply to this email and we'll find a time.");
    expect(x.text).toContain("I've received your message.");
  });
  it("escapes a hostile name", () => {
    const x = prospectConfirmation({ name: '<img src=x onerror=a()> Eve', program: p03 });
    expect(x.html).not.toContain("<img");
  });
});

describe("internal notification", () => {
  const base = { name: "Ada Lovelace", email: "ada@example.com", message: "Line one\n\nLine two https://example.com/x", program: p03, attribution: { source: "linkedin", medium: "social", campaign: "spring", utm_content: "post-7", referrer: "https://linkedin.com/", landing_page: "/work", entry_page: "/lets-talk" } };
  const m = inquiryNotification(base);
  it("subject is 'New MBA inquiry · Program · Price' (price or 'By proposal')", () => {
    expect(m.subject).toBe("New MBA inquiry · Pre-Architecture · US$1,999");
    expect(inquiryNotification({ ...base, program: p06 }).subject).toBe("New MBA inquiry · Business Activation · By proposal");
    expect(inquiryNotification({ ...base, program: undefined, situation: "I have an idea." }).subject).toBe("New MBA inquiry · I have an idea.");
  });
  it("carries name, email, program, price, original message and full attribution", () => {
    for (const v of ["Ada Lovelace", "ada@example.com", "Pre-Architecture", "US$1,999", "4–6 weeks", "Line one", "Line two", "linkedin", "social", "spring", "post-7", "linkedin.com", "/work", "/lets-talk"]) {
      expect(m.html).toContain(v);
      expect(m.text).toContain(v);
    }
  });
  it("states the investment once: fixed fee with price, or 'By proposal'", () => {
    expect(m.text).toContain("Investment: US$1,999 · fixed fee");
    expect(inquiryNotification({ ...base, program: p06 }).text).toContain("Investment: By proposal\n");
  });
  it("offers a one-tap reply and sets Reply-To to the prospect", () => {
    expect(m.replyTo).toBe("ada@example.com");
    expect(m.html).toContain('href="mailto:ada@example.com?subject=Re%3A%20your%20inquiry%20about%20Pre-Architecture"');
    expect(m.html).toContain("Reply to Ada →");
  });
  it("never puts an odd address into an attribute", () => {
    const x = inquiryNotification({ ...base, email: 'a"b@c.de' });
    expect(x.replyTo).toBeUndefined();
    expect(x.html).not.toContain("mailto:");
    expect(x.html).toContain("a&quot;b@c.de");
  });
  it("escapes the message and says so when there is no attribution", () => {
    const x = inquiryNotification({ ...base, message: "<script>alert(1)</script>", attribution: {} });
    expect(x.html).not.toContain("<script>");
    expect(x.html).toContain("Direct, or no tracking recorded");
  });
});

describe("firstNameOf", () => {
  it("takes the first word and never returns empty", () => {
    expect(firstNameOf("Ada Lovelace")).toBe("Ada");
    expect(firstNameOf("  ")).toBe("there");
    expect(firstNameOf("")).toBe("there");
  });
});
