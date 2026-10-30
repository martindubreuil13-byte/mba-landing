import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TransitionConfirmation, { type ReceiptView } from "./TransitionConfirmation";
import { INTRO_BOOKING_URL } from "@/app/lib/booking";

const receipt = (over: Partial<ReceiptView> = {}): ReceiptView => ({ receiptToken: "tok-abcdefghijklmnop", bookingUrl: `${INTRO_BOOKING_URL}?utm_source=mba_transition&utm_content=ref`, invitationEmail: "sent", community: null, ...over });
const html = (r: ReceiptView) => renderToStaticMarkup(<TransitionConfirmation receipt={r} />);
const text = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "’").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

describe("1. confirmation screen: the approved experience", () => {
  const out = html(receipt());
  const t = text(out);
  it("has the approved wording, in order", () => {
    const lines = [
      "Application received", "Good. Let’s talk.",
      "Thanks for sharing a little about where you are and what you’re trying to build.",
      "The next step is simple. Let’s have a conversation.",
      "I’ve sent you an email with a link to book our conversation. You can also book directly below.",
      "Book your conversation",
      "Can’t find a suitable time? Time-zone differences sometimes make availability tricky. Just reply to my email and we’ll find another option.",
      "One more thing before you go.",
      "I’m building a community of people who want to create something of their own.",
      "Would you like occasional emails with practical advice, ideas, guides, and resources?",
      "No, thanks", "Yes, count me in",
      "Optional. Unsubscribe anytime. Your consultation is not affected by your choice.",
    ];
    let at = 0;
    for (const l of lines) { const i = t.indexOf(l, at); expect(i, l).toBeGreaterThan(-1); at = i; }
  });
  it("the primary button is the shared Calendly event, opens safely, and appears immediately", () => {
    const m = out.match(/<a [^>]*href="([^"]+)"[^>]*>Book your conversation<\/a>/)!;
    expect(m[1].replace(/&amp;/g, "&").startsWith(INTRO_BOOKING_URL)).toBe(true);
    expect(out).toMatch(/rel="noopener noreferrer"/);
  });
  it("the brand: ivory background, oxblood primary button, no screening language", () => {
    expect(out).toContain("bg-[#f5f1ed]"); expect(out).toContain("bg-[#6b1f1f]");
    expect(t).not.toMatch(/review|qualif|approve|not the right fit|48 hours|we.ll get back/i);
  });
  it("6. nothing is preselected: two real buttons, neither pressed, and no checkbox or radio", () => {
    expect(out).not.toMatch(/type="checkbox"|type="radio"|checked|aria-pressed="true"|selected/);
    expect((out.match(/<button /g) ?? []).length).toBe(2);
    expect(out).toContain('type="button"');
  });
  it("the two choices carry equal visual weight (both bordered, neither the page's primary solid button)", () => {
    const buttons = [...out.matchAll(/<button [^>]*class="([^"]+)"/g)].map((m) => m[1]);
    expect(buttons).toHaveLength(2);
    for (const c of buttons) { expect(c).toContain("border"); expect(c).not.toMatch(/(^| )bg-\[#6b1f1f\]( |$)/); }
  });
  it("the community section is separate from, and below, the booking section", () => {
    expect(out.indexOf("Book your conversation")).toBeLessThan(out.indexOf("One more thing before you go."));
    expect(out).toContain('aria-labelledby="community-heading"');
  });
});

describe("the email message is truthful", () => {
  it("when the email could not be sent, it does not claim one was, and the booking button is still there", () => {
    const t = text(html(receipt({ invitationEmail: "not_sent" })));
    expect(t).not.toContain("I’ve sent you an email");
    expect(t).not.toContain("reply to my email");
    expect(t).toContain("I wasn’t able to confirm the booking email just now, but you don’t need it. You can book directly below.");
    expect(t).toContain("Book your conversation");
    expect(html(receipt({ invitationEmail: "not_sent" }))).toContain('href="/lets-talk"');
  });
});

describe("restoring after a refresh shows the recorded choice", () => {
  it.each([
    ["declined", "No problem. Nothing changes, and your conversation is not affected."],
    ["joined", "You’re in."],
    ["confirmation_sent", "I’ve sent you an email to confirm."],
    ["not_applied", "I wasn’t able to add this address to the list."],
  ] as const)("%s", (community, message) => {
    const out = html(receipt({ community }));
    expect(text(out)).toContain(message);
    expect(out).not.toMatch(/<button /); // a settled choice is not asked again
    expect(text(out)).toContain("Book your conversation");
  });
  it("a failed confirmation email keeps the buttons so the visitor can try again", () => {
    const out = html(receipt({ community: "confirmation_failed" }));
    expect(text(out)).toContain("not on the list yet");
    expect((out.match(/<button /g) ?? []).length).toBe(2);
  });
});
