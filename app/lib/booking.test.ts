import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";
import { INTRO_BOOKING_MINUTES, INTRO_BOOKING_PATH, introBookingPath, introBookingUrl } from "./booking";

vi.mock("server-only", () => ({}));

const ROOT = path.resolve(__dirname, "../..");
function files(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) files(f, out);
    else if (/\.(ts|tsx|mjs)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) out.push(f);
  }
  return out;
}

describe("introductory booking link", () => {
  const production = () => { vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", ""); vi.stubEnv("VERCEL_URL", ""); };
  afterEach(() => vi.unstubAllEnvs());

  it("is the approved complimentary session on this website: a free 45-minute Zoom conversation", () => {
    production();
    expect(INTRO_BOOKING_PATH).toBe("/book/complementary-session");
    expect(introBookingUrl()).toBe("https://modernbusinessarchitect.com/book/complementary-session");
    expect(INTRO_BOOKING_MINUTES).toBe(45);
  });

  it("follows the environment like every operational link: production is the canonical domain, a preview or a local run links to itself, never to production", () => {
    vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", ""); vi.stubEnv("VERCEL_URL", "mba-preview-abc.vercel.app");
    expect(introBookingUrl("tok", "transition")).toBe("https://mba-preview-abc.vercel.app/book/complementary-session?source=transition&ref=tok");
    vi.unstubAllEnvs(); vi.stubEnv("VERCEL_ENV", ""); vi.stubEnv("VERCEL", ""); vi.stubEnv("APP_BASE_URL", ""); vi.stubEnv("VERCEL_URL", "");
    expect(introBookingUrl()).toBe("http://localhost:3000/book/complementary-session");
    production();
    expect(introBookingUrl()).not.toContain("localhost");
  });

  it("is a plain link by default, and adds only an origin tag and an opaque reference, never anything personal", () => {
    production();
    expect(introBookingUrl()).toBe(`https://modernbusinessarchitect.com${INTRO_BOOKING_PATH}`);
    expect(introBookingUrl(null, "transition")).toBe(`https://modernbusinessarchitect.com${INTRO_BOOKING_PATH}?source=transition`);
    expect(introBookingUrl("abcDEF123_-xyz789AB", "transition")).toBe(`https://modernbusinessarchitect.com${INTRO_BOOKING_PATH}?source=transition&ref=abcDEF123_-xyz789AB`);
    expect(introBookingUrl(null, "inquiry-pre-architecture")).toBe(`https://modernbusinessarchitect.com${INTRO_BOOKING_PATH}?source=inquiry-pre-architecture`);
    expect([...new URL(introBookingUrl("tok", "answers")).searchParams.keys()].sort()).toEqual(["ref", "source"]);
  });

  it("has a site-relative form for buttons on this website, equal to the absolute link's path and query", () => {
    production();
    expect(introBookingPath()).toBe("/book/complementary-session");
    expect(introBookingPath(null, "inquiry")).toBe("/book/complementary-session?source=inquiry");
    const abs = new URL(introBookingUrl("tok", "transition"));
    expect(introBookingPath("tok", "transition")).toBe(`${abs.pathname}${abs.search}`);
  });

  it("never points a visitor at Calendly any more: the link and the templates that use it are on this website", async () => {
    production();
    expect(new URL(introBookingUrl()).host).toBe("modernbusinessarchitect.com");
    const { invitationMessage } = await import("./programs/email");
    expect(invitationMessage("Ada", introBookingUrl("tok", "transition")).html).not.toMatch(/calendly/i);
  });

  it("is defined once: no other source file contains a Calendly URL", () => {
    const offenders = files(path.join(ROOT, "app"))
      .filter((f) => !f.endsWith(path.join("app", "lib", "booking.ts")))
      .filter((f) => /calendly\.com\//i.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("never references the retired account or event", () => {
    const all = [...files(path.join(ROOT, "app")), path.join(ROOT, "next.config.ts")];
    const bad = all.filter((f) => /martindubreuil\/coaching_session/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(ROOT, f));
    expect(bad).toEqual([]);
  });

  it("feeds the admin's conversation-invitation draft, with the booking page link in the Transition vocabulary", async () => {
    production();
    const { conversationInviteDraft, conversationInviteUrl } = await import("./programs/corporate-transition");
    expect(conversationInviteUrl()).toBe(introBookingUrl(null, "transition"));
    expect(conversationInviteDraft("Ada")).toContain(`You can book a time here:\n\n${introBookingUrl(null, "transition")}`);
  });

  it("the Transition invitation promises the same length as the event", async () => {
    const { conversationInviteDraft } = await import("./programs/corporate-transition");
    expect(conversationInviteDraft("Ada")).toContain(`${INTRO_BOOKING_MINUTES} minutes of my time`);
  });
});

describe("legacy /contact page", () => {
  it("is removed and permanently redirects to /lets-talk", async () => {
    expect(fs.existsSync(path.join(ROOT, "app/contact"))).toBe(false);
    const rules = await nextConfig.redirects!();
    expect(rules).toContainEqual({ source: "/contact", destination: "/lets-talk", permanent: true });
    expect(rules).toContainEqual({ source: "/work-with-me", destination: "/work", permanent: true });
  });
});
