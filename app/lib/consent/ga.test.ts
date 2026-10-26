import { beforeEach, describe, expect, it, vi } from "vitest";

type Fake = { win: Record<string, unknown>; scripts: string[]; cookieWrites: string[]; setCookie: (c: string) => void };

function fakeBrowser(pathname = "/work", search = "?utm_source=linkedin", cookie = ""): Fake {
  const scripts: string[] = [];
  const cookieWrites: string[] = [];
  const state = { cookie };
  const win: Record<string, unknown> = { location: { pathname, search, origin: "https://example.com", hostname: "www.example.com" } };
  const doc = {
    title: "Page title",
    get cookie() { return state.cookie; },
    set cookie(v: string) { cookieWrites.push(v); },
    createElement: () => ({} as { src?: string; async?: boolean }),
    head: { appendChild: (el: { src?: string }) => scripts.push(el.src ?? "") },
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  return { win, scripts, cookieWrites, setCookie: (c) => { state.cookie = c; } };
}

const calls = (win: Record<string, unknown>) => ((win.dataLayer as ArrayLike<unknown>[]) ?? []).map((a) => Array.from(a));
const events = (win: Record<string, unknown>, name: string) => calls(win).filter((c) => c[0] === "event" && c[1] === name);

let ga: typeof import("./ga");
beforeEach(async () => {
  vi.unstubAllGlobals();
  ga = await import("./ga");
  ga.__resetGaForTests();
});

describe("before the visitor is allowed", () => {
  it("sends nothing, loads nothing, defines nothing", () => {
    const b = fakeBrowser();
    ga.onRouteChange("/work");
    ga.sendPageView("/work");
    ga.sendGaEvent("program_cta_click", { program: 3 });
    expect(b.scripts).toEqual([]);
    expect(b.win.dataLayer).toBeUndefined();
    expect(b.win.gtag).toBeUndefined();
  });
});

describe("enableGa", () => {
  it("sets Consent Mode defaults and starts GA in a safe order, then loads gtag.js once", () => {
    const b = fakeBrowser();
    ga.enableGa();
    const c = calls(b.win);
    expect(c[0]).toEqual(["consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" }]);
    expect(c[1]).toEqual(["consent", "update", { analytics_storage: "granted" }]); // granted before config, so no pre-consent ping
    expect(c[2][0]).toBe("js");
    expect(c[3]).toEqual(["config", ga.GA_MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }]);
    expect(b.scripts).toEqual([`https://www.googletagmanager.com/gtag/js?id=${ga.GA_MEASUREMENT_ID}`]);
    expect(b.win[`ga-disable-${ga.GA_MEASUREMENT_ID}`]).toBe(false);
  });
  it("measures the page being viewed when it starts, exactly once, and keeps the manual page_view shape", () => {
    const b = fakeBrowser("/work", "?utm_source=linkedin");
    ga.enableGa();
    ga.enableGa(); // idempotent
    expect(b.scripts).toHaveLength(1);
    expect(events(b.win, "page_view")).toEqual([["event", "page_view", { page_path: "/work", page_location: "https://example.com/work?utm_source=linkedin", page_title: "Page title" }]]);
  });
  it("preserves the redaction of ID-like path segments", () => {
    const b = fakeBrowser("/resources/business-idea-reality-check/result/0b9f1c1e-1c2d-4e5f-8a9b-0123456789ab", "");
    ga.enableGa();
    const [pv] = events(b.win, "page_view");
    expect(pv[2]).toMatchObject({ page_path: "/resources/business-idea-reality-check/result/:id", page_location: "https://example.com/resources/business-idea-reality-check/result/:id" });
    expect(JSON.stringify(calls(b.win))).not.toContain("0b9f1c1e");
    expect(ga.sanitizePath("/a/0b9f1c1e-1c2d-4e5f-8a9b-0123456789ab/b")).toBe("/a/:id/b");
  });
  it("sends one page_view per navigation and never repeats the same path back to back", () => {
    const b = fakeBrowser("/", "");
    ga.enableGa();
    ga.onRouteChange("/work");
    ga.onRouteChange("/work");
    ga.onRouteChange("/answers");
    expect(events(b.win, "page_view").map((e) => (e[2] as { page_path: string }).page_path)).toEqual(["/", "/work", "/answers"]);
  });
  it("forwards custom events only while active", () => {
    const b = fakeBrowser();
    ga.enableGa();
    ga.sendGaEvent("assessment_started", { x: 1 });
    expect(events(b.win, "assessment_started")).toHaveLength(1);
  });
});

describe("admin activity never reaches GA", () => {
  it("does not start on an admin page", () => {
    const b = fakeBrowser("/admin/leads", "");
    ga.enableGa();
    expect(b.scripts).toEqual([]);
    expect(b.win.dataLayer).toBeUndefined();
  });
  it("does not start for a signed-in admin on a public page", () => {
    const b = fakeBrowser("/work", "", "theme=x; sb-abcd-auth-token=secret");
    ga.enableGa();
    expect(b.scripts).toEqual([]);
    expect(events(b.win, "page_view")).toEqual([]);
  });
  it("stops everything when a visitor with GA running navigates into /admin, and resumes on return", () => {
    const b = fakeBrowser("/work", "");
    ga.enableGa();
    (b.win.location as { pathname: string }).pathname = "/admin/leads";
    ga.onRouteChange("/admin/leads");
    ga.sendGaEvent("x_y");
    expect(b.win[`ga-disable-${ga.GA_MEASUREMENT_ID}`]).toBe(true); // gtag.js itself sends nothing, including automatic events
    expect(events(b.win, "page_view").map((e) => (e[2] as { page_path: string }).page_path)).toEqual(["/work"]);
    expect(events(b.win, "x_y")).toHaveLength(0);
    (b.win.location as { pathname: string }).pathname = "/answers";
    ga.onRouteChange("/answers");
    expect(b.win[`ga-disable-${ga.GA_MEASUREMENT_ID}`]).toBe(false);
    expect(events(b.win, "page_view")).toHaveLength(2);
  });
});

describe("disableGa (declined or withdrawn)", () => {
  it("stops sending, flips the Google disable flag, denies analytics storage and removes GA cookies on every domain level", () => {
    const b = fakeBrowser();
    ga.enableGa();
    b.setCookie("_ga=GA1.1.1; _ga_ABC123=GS1; keep=1; _gid=x");
    ga.disableGa();
    ga.sendGaEvent("late_event");
    ga.onRouteChange("/later");
    expect(b.win[`ga-disable-${ga.GA_MEASUREMENT_ID}`]).toBe(true);
    expect(calls(b.win).at(-1)).toEqual(["consent", "update", { analytics_storage: "denied" }]);
    expect(events(b.win, "late_event")).toHaveLength(0);
    expect(events(b.win, "page_view")).toHaveLength(1);
    const cleared = b.cookieWrites.filter((w) => w.includes("Max-Age=0"));
    expect(cleared.some((w) => w.startsWith("_ga=") && w.includes("domain=.example.com"))).toBe(true);
    expect(cleared.some((w) => w.startsWith("_ga_ABC123="))).toBe(true);
    expect(cleared.some((w) => w.startsWith("keep="))).toBe(false); // unrelated cookies untouched
  });
  it("is harmless when GA never started", () => {
    const b = fakeBrowser();
    ga.disableGa();
    expect(b.win.dataLayer).toBeUndefined();
  });
});
