/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";

vi.mock("server-only", () => ({}));
vi.mock("next/server", async (orig) => ({ ...(await orig<object>()), after: (t: () => unknown) => t() }));
import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = vi.hoisted(() => ({ current: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.current.client() }));
const limiter = vi.hoisted(() => ({ deny: false }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => !limiter.deny, getClientIp: () => "unknown" }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: async () => null, requireAdmin: async () => ({ email: "owner@example.test" }) }));
vi.mock("@/app/components/admin/EraseInquiryButton", () => ({ default: ({ id }: any) => <button data-erase={id}>Delete</button> }));
vi.mock("@/app/components/admin/AdminShell", () => ({ default: ({ children }: any) => <div data-shell>{children}</div> }));

import { inquiryPrefill, refOrigin } from "@/app/lib/scheduling/adapters/inquiry-prefill";
import { SchedulingService } from "@/app/lib/scheduling/service";
import { verifyContext } from "./context";
import { INTRO_BOOKING_PATH, introBookingPath, introBookingPathWithFragmentRef, introBookingUrl } from "@/app/lib/booking";
import InquiryBookingCta from "@/app/components/programs/InquiryBookingCta";

const NOW = Date.parse("2026-11-02T12:00:00Z");
const DAY = 86_400_000;
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();
const INQ_ID = "11111111-1111-4111-8111-111111111111", APP_ID = "22222222-2222-4222-8222-222222222222";
const REF_I = "InquiryRef0123456789abcd", REF_A = "AppRef0123456789abcdefg";

// The real prefillFor logic (shape check, error swallowing) around the real adapter.
const service = { inquiryPrefill: (ref: string) => inquiryPrefill(ref, NOW) };
const realService = { inquiryPrefill: service.inquiryPrefill, refOriginOf: (ref: string) => refOrigin(ref, NOW) };
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => ({ prefillFor: (ref: unknown) => (SchedulingService.prototype as any).prefillFor.call(realService, ref), originFor: (ref: unknown) => (SchedulingService.prototype as any).originFor.call(realService, ref) }) }));

function seedInquiry(daysAgo: number, over: Record<string, unknown> = {}) {
  db.current.tables.leads.push({ id: "lead-1", email: "ada@example.test", first_name: "Ada" });
  db.current.tables.program_inquiries.push({ id: INQ_ID, lead_id: "lead-1", full_name: "Ada Lovelace", message: "TOP SECRET message", situation: "x", booking_ref: REF_I, created_at: iso(daysAgo), ...over });
}
function seedApplication(submittedDaysAgo: number, sendDaysAgo?: number) {
  db.current.tables.program_applications.push({ id: APP_ID, booking_ref: REF_A, submitted_at: iso(submittedDaysAgo), answers: { firstName: "Elena", lastName: "Test", email: "elena@example.com", motivation: "private" } });
  if (sendDaysAgo !== undefined) db.current.tables.program_invitation_sends.push({ id: "s1", application_id: APP_ID, status: "accepted", attempted_at: iso(sendDaysAgo) });
}

beforeEach(() => { db.current = new FakeDb(); limiter.deny = false; vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-for-tests"); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", ""); vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true"); vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true"); vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", ""); });

describe("the pre-fill lookup", () => {
  it("returns an inquiry's own name and e-mail and nothing else", async () => {
    seedInquiry(10);
    expect(await inquiryPrefill(REF_I, NOW)).toEqual({ name: "Ada Lovelace", email: "ada@example.test" });
  });

  it("stops pre-filling an inquiry after 60 days (59 still works)", async () => {
    seedInquiry(59); expect(await inquiryPrefill(REF_I, NOW)).not.toBeNull();
    db.current = new FakeDb(); seedInquiry(61); expect(await inquiryPrefill(REF_I, NOW)).toBeNull();
  });

  it("a Transition application expires 60 days after its submission, or after its latest accepted invitation e-mail", async () => {
    seedApplication(10); expect(await inquiryPrefill(REF_A, NOW)).toEqual({ name: "Elena Test", email: "elena@example.com" });
    db.current = new FakeDb(); seedApplication(90); expect(await inquiryPrefill(REF_A, NOW)).toBeNull();
    // an invitation re-sent from admin 5 days ago starts a new window
    db.current = new FakeDb(); seedApplication(90, 5); expect(await inquiryPrefill(REF_A, NOW)).toEqual({ name: "Elena Test", email: "elena@example.com" });
    // a failed (not accepted) re-send does not
    db.current = new FakeDb(); seedApplication(90); db.current.tables.program_invitation_sends.push({ id: "s2", application_id: APP_ID, status: "failed", attempted_at: iso(1) });
    expect(await inquiryPrefill(REF_A, NOW)).toBeNull();
  });

  it("an unknown reference answers null; inquiries are not consulted while stored inquiries are off, and a problem with the newer table never removes Transition pre-fill", async () => {
    expect(await inquiryPrefill("Unknown0123456789abcdefg", NOW)).toBeNull();
    seedInquiry(1); vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", ""); expect(await inquiryPrefill(REF_I, NOW)).toBeNull();
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true"); delete db.current.tables.program_inquiries;
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    seedApplication(3); expect(await inquiryPrefill(REF_A, NOW)).toEqual({ name: "Elena Test", email: "elena@example.com" });
    err.mockRestore();
  });
});

describe("POST /api/scheduling/booking-context", () => {
  const call = async (body: unknown, headers: Record<string, string> = {}) => {
    vi.stubEnv("SCHEDULING_OPERATIONS_ENABLED", "true"); vi.stubEnv("SCHEDULING_PUBLIC_INTAKE_ENABLED", "true");
    const { POST } = await import("@/app/api/scheduling/booking-context/route");
    return POST(new Request("https://modernbusinessarchitect.com/api/scheduling/booking-context", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), undefined);
  };

  it("exchanges a valid reference for the visitor's own details, never cached", async () => {
    seedInquiry(2);
    const res = await call({ ref: REF_I });
    expect(res.status).toBe(200); expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.prefill).toEqual({ name: "Ada Lovelace", email: "ada@example.test" });
    expect(verifyContext(body.context)).toEqual({ kind: "inquiry", id: INQ_ID });
  });

  it("an unknown or malformed reference answers nothing at all; an EXPIRED one gives no details but still says where it came from", async () => {
    seedInquiry(200);
    for (const ref of ["Unknown0123456789abcdefg", "bad", "", 5, null, undefined]) { const r = await call({ ref }); expect([r.status, await r.json()]).toEqual([200, { prefill: null, context: null }]); }
    const expired = await (await call({ ref: REF_I })).json();
    expect(expired.prefill).toBeNull();
    expect(verifyContext(expired.context)).toEqual({ kind: "inquiry", id: INQ_ID });
  });

  it("a Transition reference gives an application context", async () => {
    seedApplication(3);
    const body = await (await call({ ref: REF_A })).json();
    expect(body.prefill).toEqual({ name: "Elena Test", email: "elena@example.com" });
    expect(verifyContext(body.context)).toEqual({ kind: "application", id: APP_ID });
  });

  it("is off (404) until the switch is on, rate limited, JSON-only, same-site only and size capped", async () => {
    seedInquiry(2);
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", ""); expect((await call({ ref: REF_I })).status).toBe(404);
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true");
    limiter.deny = true; const limited = await call({ ref: REF_I }); expect(limited.status).toBe(429); limiter.deny = false;
    expect((await call({ ref: REF_I }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await call({ ref: REF_I }, { "content-type": "text/plain" })).status).toBe(415);
    expect((await call({ ref: REF_I, pad: "x".repeat(5000) })).status).toBe(413);
  });

  it("never logs the reference", async () => {
    seedInquiry(2);
    const out: string[] = [];
    const spies = (["log", "warn", "error", "info"] as const).map((m) => vi.spyOn(console, m).mockImplementation((...a: unknown[]) => { out.push(a.map(String).join(" ")); }));
    await call({ ref: REF_I }); await call({ ref: "Unknown0123456789abcdefg" });
    expect(out.join("\n")).not.toContain(REF_I); spies.forEach((s) => s.mockRestore());
  });
});

describe("booking links", () => {
  it("with exchange links on, a reference rides in the fragment and never in the query or the path", () => {
    const url = introBookingUrl(REF_I, "inquiry-x");
    expect(url).toBe(`https://modernbusinessarchitect.com${INTRO_BOOKING_PATH}?source=inquiry-x#r=${REF_I}`);
    expect(new URL(url).search).not.toContain(REF_I);
    expect(introBookingPath(REF_A, "transition")).toBe(`${INTRO_BOOKING_PATH}?source=transition#r=${REF_A}`);
    expect(introBookingPath(null, "answers")).toBe(`${INTRO_BOOKING_PATH}?source=answers`);
    expect(introBookingPath()).toBe(INTRO_BOOKING_PATH);
  });

  it("with exchange links off, the existing ?ref= form is produced unchanged", () => {
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "");
    expect(introBookingUrl(REF_A, "transition")).toBe(`https://modernbusinessarchitect.com${INTRO_BOOKING_PATH}?source=transition&ref=${REF_A}`);
  });

  it("the form's success button uses the fragment form only when the server handed over a reference", () => {
    expect(introBookingPathWithFragmentRef(REF_I, "inquiry-x")).toBe(`${INTRO_BOOKING_PATH}?source=inquiry-x#r=${REF_I}`);
    expect(renderToStaticMarkup(<InquiryBookingCta programSlug="x" autoReplySent bookingRef={REF_I} />)).toContain(`href="${INTRO_BOOKING_PATH}?source=inquiry-x#r=${REF_I}"`);
    const plain = renderToStaticMarkup(<InquiryBookingCta programSlug="x" autoReplySent={false} />);
    expect(plain).toContain(`href="${INTRO_BOOKING_PATH}?source=inquiry-x"`); expect(plain).not.toContain("#r=");
  });
});

describe("analytics and error reporting cannot see a reference", () => {
  it("the page-view event reports pathname and search only (a fragment is never part of it), and error reporting is not installed", () => {
    const ga = readFileSync("app/lib/consent/ga.ts", "utf8");
    expect(ga).toContain("page_location: `${window.location.origin}${path}${window.location.search}`");
    expect(ga).not.toContain("location.hash"); expect(ga).not.toContain("location.href");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /sentry|bugsnag|datadog|rollbar|logrocket|posthog|hotjar/i.test(d))).toEqual([]);
  });

  it("no code path puts a booking reference into a log call", () => {
    for (const file of ["app/lib/inquiries/submit.ts", "app/lib/inquiries/store.ts", "app/lib/scheduling/adapters/inquiry-prefill.ts", "app/api/scheduling/booking-context/route.ts", "app/api/qualify/route.ts"]) {
      const src = readFileSync(file, "utf8");
      for (const line of src.split("\n").filter((l) => /console\.(log|warn|error|info)/.test(l))) expect(line, `${file}: ${line}`).not.toMatch(/booking_ref|bookingRef|\bref\b/);
    }
  });
});

describe("the admin Inquiries & applications page", () => {
  vi.mock("@/app/lib/inquiries/journey", async (orig) => ({ ...(await orig<object>()), listJourney: vi.fn() }));
  it("shows a failed notification plainly, booking states, a removed message as removed, and the empty state", async () => {
    const journey = await import("@/app/lib/inquiries/journey");
    const { default: Page } = await import("@/app/admin/inquiries/page");
    const row = { id: "1", kind: "inquiry" as const, href: null, messageRemoved: false };
    (journey.listJourney as any).mockResolvedValue({ notes: [], rows: [
      { ...row, key: "inquiry:1", receivedAt: iso(1), name: "Failed Person", email: "a@example.test", interest: "Pre-Architecture", contact: { text: "Delivery failed", bad: true, detail: "provider_rejected: no" }, message: "please call me", booking: { text: "Not booked", tone: "none" } },
      { ...row, id: "2", key: "inquiry:2", receivedAt: iso(800), name: "Old Person", email: "b@example.test", interest: "No program chosen", contact: { text: "You were notified", bad: false, detail: null }, message: null, messageRemoved: true, booking: { text: "Canceled (was Tue, Nov 3, 1:00 p.m. GMT+7)", tone: "bad" } },
      { ...row, id: "3", key: "application:3", kind: "application" as const, href: "/admin/programs/corporate-transition/3", receivedAt: iso(3), name: "Elena Test", email: "elena@example.com", interest: "Corporate Transition", contact: { text: "Invitation: Sent", bad: false, detail: null }, message: null, booking: { text: "Booked: Thu, Nov 5, 9:00 a.m. GMT+7 (rescheduled)", tone: "ok" } },
    ] });
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("Delivery failed"); expect(html).toContain("provider_rejected: no"); expect(html).toContain("please call me");
    expect(html).toContain("1 needs attention"); expect(html).toContain("3 in total, 1 with a booking");
    expect(html).toContain("Message removed under the retention policy"); expect(html).toContain("Canceled (was"); expect(html).toContain("(rescheduled)");
    expect(html).toContain("Open application"); expect(html).toContain("mailto:a@example.test");
    (journey.listJourney as any).mockResolvedValue({ notes: ["Saved inquiries are not available yet."], rows: [] });
    const empty = renderToStaticMarkup(await Page());
    expect(empty).toContain("Nothing here yet."); expect(empty).toContain("not available yet");
  });
});

describe("the migration is additive and server-only", () => {
  const sql = readFileSync("supabase/migrations/20261106090000_program_inquiries.sql", "utf8").replace(/--.*$/gm, "");
  it("creates two new tables, each with row-level security and no browser policy, and changes nothing that exists", () => {
    expect(sql.match(/create table/gi)).toHaveLength(2);
    expect(sql).toMatch(/alter table public\.program_inquiries enable row level security/i);
    expect(sql).toMatch(/alter table public\.booking_origins enable row level security/i);
    expect(sql).not.toMatch(/create policy|grant |alter table public\.(?!program_inquiries|booking_origins)|drop table|drop column|delete from|truncate|update public\./i);
    expect(sql).toMatch(/booking_id uuid primary key references public\.sched_bookings\(id\) on delete cascade/i);
    expect(sql).toMatch(/inquiry_id uuid references public\.program_inquiries\(id\) on delete set null/i);
    expect(sql).toMatch(/unique index if not exists program_inquiries_idempotency_key_key/i);
    expect(sql).toMatch(/unique index if not exists program_inquiries_booking_ref_key/i);
    expect(sql).toMatch(/references public\.leads\(id\)/i);
  });
});
