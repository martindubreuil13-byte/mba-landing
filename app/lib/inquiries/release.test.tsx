import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

vi.mock("server-only", () => ({}));
import SlotPicker from "@/app/components/scheduling/SlotPicker";

const read = (f: string) => readFileSync(f, "utf8");

describe("the calendar cannot be paged past the booking window", () => {
  const render = (value: string | null) => renderToStaticMarkup(<SlotPicker load={async () => []} timeZone="UTC" value={value} onChange={() => undefined} />);
  const nextDisabled = (html: string) => { const tag = html.match(/<button[^>]*aria-label="Next month"[^>]*>/)?.[0] ?? ""; return /\sdisabled=""/.test(tag); };

  it("offers the next month today, and stops once the next month would be past what the server answers (400 days)", () => {
    expect(nextDisabled(render(null))).toBe(false);
    const inMonths = (n: number) => new Date(Date.now() + n * 30.4 * 86_400_000).toISOString();
    expect(nextDisabled(render(inMonths(6)))).toBe(false);
    expect(nextDisabled(render(inMonths(13.5)))).toBe(true);
    expect(nextDisabled(render(inMonths(20)))).toBe(true);
  });

  it("the picker's last month is always one the server accepts: the server limit is 400 days, the picker stops at 399", () => {
    expect(read("app/lib/scheduling/service.ts")).toContain("now + 400 * 86_400_000");
    expect(read("app/components/scheduling/SlotPicker.tsx")).toContain("Date.now() + 399 * 86_400_000");
  });
});

describe("customers no longer see Calendly", () => {
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) { if (!/admin|node_modules|api\/webhooks/.test(full)) walk(full, out); } else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(full);
    }
    return out;
  };
  // The dormant Calendly webhook and its helper stay as history; the tracker still recognises old Calendly links; the analytics event keeps its old name.
  const HISTORY = [/app\/lib\/programs\/calendly\.ts$/, /app\/lib\/intelligence\//, /app\/lib\/test\//];

  it("no customer-facing page, component or e-mail mentions Calendly in text it shows", () => {
    const offenders: string[] = [];
    for (const f of walk("app")) {
      if (HISTORY.some((re) => re.test(f))) continue;
      const lines = read(f).split("\n").filter((l) => /calendly/i.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l) && !/transition_calendly_clicked/.test(l));
      if (lines.length) offenders.push(`${f}: ${lines[0].trim().slice(0, 90)}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("the privacy notice", () => {
  const page = read("app/privacy/page.tsx");
  it("describes the booking system and the stored inquiries, with the retention and reference-expiry periods", () => {
    expect(page).toContain("Booking a conversation");
    expect(page).toContain("Sending a message");
    expect(page).toContain("kept for up to 24 months");
    expect(page).toContain("and email address for 60 days and to connect a later booking to your message");   // the inquiry paragraph
    expect(page).toContain("(for 60 days)");                                                                  // the application paragraph
    expect(page).toContain("does not subscribe you to anything");
    expect(page).toContain("Zoom, Google Calendar and the email provider");
    expect(page).not.toMatch(/calendly/i);
  });
  it("sends readers to a 'Getting in touch' section that exists", () => { expect(page).toContain("Getting in touch"); });
});

describe("the booking request carries the origin context through to the service", () => {
  it("the route forwards the page's context as originContext, and the page and client pass it along", () => {
    expect(read("app/api/scheduling/book/route.ts")).toContain("originContext: str(b.context, 400) || undefined");
    expect(read("app/components/scheduling/BookingExperience.tsx")).toContain("context: context ?? undefined");
    expect(read("app/book/[meetingType]/page.tsx")).toContain("context={context}");
    expect(read("app/lib/scheduling/integrations.ts")).toContain("bookingOrigin: db ? linkBookingOrigin : undefined");
  });
});
