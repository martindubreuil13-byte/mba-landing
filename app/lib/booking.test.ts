import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";
import { INTRO_BOOKING_MINUTES, INTRO_BOOKING_URL } from "./booking";

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
  it("is the consolidated martindubreuil13 30-minute event", () => {
    expect(INTRO_BOOKING_URL).toBe("https://calendly.com/martindubreuil13/30min");
    expect(INTRO_BOOKING_MINUTES).toBe(30);
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

  it("feeds every template that sends people to book", async () => {
    const { CALENDLY_URL, CONVERSATION_INVITE_CALENDLY_URL } = await import("./programs/corporate-transition");
    expect(CALENDLY_URL).toBe(INTRO_BOOKING_URL);
    expect(CONVERSATION_INVITE_CALENDLY_URL).toBe(INTRO_BOOKING_URL);
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
