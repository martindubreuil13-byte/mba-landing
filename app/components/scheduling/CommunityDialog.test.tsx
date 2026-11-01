import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CommunityDialog } from "./CommunityModal";
import { COMMUNITY_DECLINE, COMMUNITY_FOOTNOTE, COMMUNITY_HEADING, COMMUNITY_INTRO, COMMUNITY_JOIN, COMMUNITY_NOTE, COMMUNITY_QUESTION, COMMUNITY_WORDING, COMMUNITY_WORDING_HISTORY, SCHEDULING_COMMUNITY_VERSION } from "@/app/lib/scheduling/community";

/** The post-booking community popup's appearance. Behaviour (consent, verification, timing) is covered elsewhere and is not touched by these checks. */
const render = (over: Partial<React.ComponentProps<typeof CommunityDialog>> = {}) =>
  renderToStaticMarkup(<CommunityDialog result={null} busy={false} problem="" onChoose={() => undefined} onClose={() => undefined} {...over} />);
const text = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const buttons = (html: string) => [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => ({ attrs: m[1], label: text(m[2]), classes: /class="([^"]*)"/.exec(m[1])?.[1] ?? "" }));
const choice = (html: string, label: string) => buttons(html).find((b) => b.label === label)!;

describe("the wording is exactly the approved text, unchanged", () => {
  it("shows every approved line in order, and is still version 2", () => {
    const t = text(render());
    let at = -1;
    for (const line of [COMMUNITY_HEADING, COMMUNITY_INTRO, COMMUNITY_QUESTION, COMMUNITY_NOTE, COMMUNITY_JOIN, COMMUNITY_DECLINE, COMMUNITY_FOOTNOTE]) { const i = t.indexOf(line); expect(i, line).toBeGreaterThan(at); at = i; }
    expect(SCHEDULING_COMMUNITY_VERSION).toBe("scheduling-community-v2");
    expect(COMMUNITY_WORDING).toBe(COMMUNITY_WORDING_HISTORY["scheduling-community-v2"].text);
    expect(COMMUNITY_JOIN).toBe("Yes, keep me in the loop");
    expect(COMMUNITY_DECLINE).toBe("Not now");
  });
});

describe("the two choices", () => {
  it("makes 'Yes, keep me in the loop' the primary button: oxblood with ivory text", () => {
    const yes = choice(render(), "Yes, keep me in the loop");
    expect(yes.classes).toContain("bg-[#6b1f1f]");
    expect(yes.classes).toContain("text-[#f5f1ed]");
    expect(yes.classes).toContain("border-[#6b1f1f]");
  });
  it("keeps 'Not now' as a secondary outlined button: transparent, outlined, dark text, no filled background", () => {
    const no = choice(render(), "Not now");
    expect(no.classes).toContain("bg-transparent");
    expect(no.classes).toMatch(/border-\[#1a1816\]\/50/);
    expect(no.classes).toContain("text-[#1a1816]");
    expect(no.classes).not.toContain("bg-[#6b1f1f]");
    expect(no.classes).not.toContain("text-[#f5f1ed]");
  });
  it("shows 'Not now' exactly once: the duplicate text link is gone", () => {
    const html = render();
    expect(text(html).split("Not now").length - 1).toBe(1);
    expect(buttons(html).filter((b) => b.label === "Not now")).toHaveLength(1);
    expect(html).not.toContain("underline");
  });
  it("has exactly three controls: Yes, Not now and the top-right X", () => {
    const b = buttons(render());
    expect(b.map((x) => x.label || "(icon)")).toEqual(["(icon)", "Yes, keep me in the loop", "Not now"]);
    expect(b[0].attrs).toContain('aria-label="Close"');
    expect(b[0].classes).toContain("right-3");
    expect(b[0].classes).toContain("top-3");
  });
  it("sends the right answer from each button and from the X", () => {
    const calls: string[] = [];
    const el = CommunityDialog({ result: null, busy: false, problem: "", onChoose: (a) => calls.push(a), onClose: () => calls.push("close") }) as React.ReactElement<{ children: React.ReactElement<{ children: unknown[] }> }>;
    const walk = (n: unknown, out: Array<{ props: Record<string, unknown> }> = []): typeof out => { if (n && typeof n === "object") { const o = n as { props?: Record<string, unknown> }; if (Array.isArray(n)) n.forEach((c) => walk(c, out)); else if (o.props) { if (typeof o.props.onClick === "function") out.push(o as { props: Record<string, unknown> }); walk(o.props.children, out); } } return out; };
    const clickable = walk(el);
    expect(clickable).toHaveLength(3);
    clickable.forEach((c) => (c.props.onClick as () => void)());
    expect(calls).toEqual(["close", "joined", "declined"]);
  });
  it("disables both choices while an answer is being saved", () => {
    const b = buttons(render({ busy: true }));
    expect(b.find((x) => x.label === "Yes, keep me in the loop")!.attrs).toContain("disabled");
    expect(b.find((x) => x.label === "Not now")!.attrs).toContain("disabled");
  });
});

describe("readability", () => {
  const html = render();
  it("renders the body text darker than before (90% ink, regular weight) and the footnote at 75%", () => {
    const paragraphs = [...html.matchAll(/<p class="([^"]*)">([\s\S]*?)<\/p>/g)].map((m) => ({ classes: m[1], label: text(m[2]) }));
    for (const line of [COMMUNITY_INTRO, COMMUNITY_QUESTION, COMMUNITY_NOTE]) {
      const para = paragraphs.find((x) => x.label === line);
      expect(para, line).toBeDefined();
      expect(para!.classes).toContain("text-[#1a1816]/90");
      expect(para!.classes).not.toContain("font-light");
      expect(para!.classes).not.toContain("/70");
    }
    expect(paragraphs.find((x) => x.label === "You can unsubscribe anytime.")!.classes).toContain("text-[#1a1816]/75");
    expect(html).not.toContain("italic");
  });
  it("sets the heading's colour itself (the site's default text colour is near-white, so it must not depend on where the popup is mounted)", () => {
    expect(/<h2 [^>]*class="([^"]*)"/.exec(html)![1]).toContain("text-[#1a1816]");
  });
  it("makes the close X easier to see without changing where it is", () => {
    expect(buttons(html)[0].classes).toContain("text-[#1a1816]/70");
  });
});

describe("layout on desktop and phone", () => {
  const html = render();
  it("stacks the buttons full width on a phone and puts them side by side from the small breakpoint, Yes wider so it stays on one line", () => {
    expect(html).toContain("flex flex-col gap-3 sm:flex-row");
    expect(choice(html, "Yes, keep me in the loop").classes).toContain("sm:flex-[3]");
    expect(choice(html, "Not now").classes).toContain("sm:flex-[2]");
    for (const b of buttons(html).slice(1)) { expect(b.classes).toContain("whitespace-nowrap"); expect(b.classes).toContain("min-h-[48px]"); }
  });
  it("is tighter than before: smaller padding and gaps, and room for the phone's home-indicator", () => {
    expect(html).not.toMatch(/\bp-8\b|\bsm:p-12\b|\bmt-8\b|\bmt-6 text-lg\b/);
    expect(html).toContain("pb-[calc(1.5rem+env(safe-area-inset-bottom))]");
    expect(html).toContain("max-h-[92vh]");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("max-w-xl");
  });
  it("still opens as a bottom sheet on a phone and a centred dialog on larger screens", () => {
    expect(html).toContain("items-end");
    expect(html).toContain("sm:items-center");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });
});

describe("after an answer", () => {
  it("shows the honest message and no buttons or X, for each outcome", () => {
    const verify = render({ result: "verify" });
    expect(text(verify)).toContain("Please check your inbox for a message asking you to confirm your email address. Nothing is sent to you until you do.");
    expect(text(render({ result: "joined" }))).toContain("You’re in the loop.");
    expect(text(render({ result: "declined" }))).toContain("No problem. Your booking is not affected.");
    for (const r of ["verify", "joined", "declined"] as const) expect(buttons(render({ result: r }))).toHaveLength(0);
  });
  it("shows a save problem as an alert without hiding the choices", () => {
    const html = render({ problem: "We couldn’t save that just now. Your booking is not affected." });
    expect(html).toContain('role="alert"');
    expect(buttons(html)).toHaveLength(3);
  });
  it("the overlay closes only before an answer", () => {
    const onClose = vi.fn();
    const mk = (result: "joined" | null) => CommunityDialog({ result, busy: false, problem: "", onChoose: () => undefined, onClose }) as React.ReactElement<{ onMouseDown: (e: { target: unknown; currentTarget: unknown }) => void }>;
    const t = {}; mk(null).props.onMouseDown({ target: t, currentTarget: t }); expect(onClose).toHaveBeenCalledTimes(1);
    mk(null).props.onMouseDown({ target: {}, currentTarget: t }); expect(onClose).toHaveBeenCalledTimes(1);
    mk("joined").props.onMouseDown({ target: t, currentTarget: t }); expect(onClose).toHaveBeenCalledTimes(1);
  });
});
