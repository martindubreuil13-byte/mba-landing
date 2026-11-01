import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSeedData } from "./seed";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "./providers";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";

/**
 * Stage G: launch-critical protection of the public booking endpoints (the E-04 gate). Mocks only: no real Google, Zoom, Resend or limiter database.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t(), NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json", ...(init?.headers as Record<string, string>) } }) } }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));
const rpc = vi.fn();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ rpc }) }));
const instance = vi.hoisted(() => ({ svc: null as unknown }));
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => instance.svc }));

import { assertSameSite, publicBody } from "./http-shared";
import { publicRoute } from "./http";
import { RATES, type Admission } from "./rate-limit";
import { admitBooking } from "./adapters/booking-budget";

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const post = (body: string | object, headers: Record<string, string> = {}, url = "http://localhost:3000/api/scheduling/book") =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

async function fx(budget?: (email: string) => Promise<Admission>) {
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const email = createSimulatedEmail();
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email, now: () => NOW, defer: () => {}, bookingBudget: budget });
  const t = await svc.saveMeetingType({ slug: "talk-abuse", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  const input = (n: number, hhmm = "10:00") => ({ slug: t.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: "Guest", guestEmail: `guest${n}@example.test`, guestTimeZone: "UTC", idempotencyKey: `abuse-key-${n}-${hhmm}` });
  return { svc, email, input };
}

beforeEach(() => { rpc.mockReset(); vi.unstubAllEnvs(); vi.stubEnv("SCHEDULING_PROTOTYPE", "true"); });

describe("public request bodies", () => {
  it("accepts an ordinary booking body", async () => {
    expect(await publicBody(post({ name: "Ada", email: "ada@example.test" }))).toEqual({ name: "Ada", email: "ada@example.test" });
  });
  it("accepts a maximum-length message written in a four-byte script", async () => {
    const b = await publicBody(post({ message: "𝔸".repeat(1500), name: "x".repeat(200), email: "e@example.test" }));
    expect((b.message as string).length).toBe(3000);
  });
  it("refuses a non-JSON content type, so a cross-site form post cannot reach the handler", async () => {
    await expect(publicBody(post("{}", { "content-type": "text/plain" }))).rejects.toMatchObject({ status: 415 });
    await expect(publicBody(post("a=b", { "content-type": "application/x-www-form-urlencoded" }))).rejects.toMatchObject({ status: 415 });
  });
  it("refuses a declared oversize body before reading it", async () => {
    const r = post("{}", { "content-length": String(1024 * 1024) });
    const read = vi.spyOn(r.body!, "getReader");
    await expect(publicBody(r)).rejects.toMatchObject({ status: 413 });
    expect(read).not.toHaveBeenCalled();
  });
  it("cuts off a stream that exceeds the cap even when its declared length is a lie or absent", async () => {
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(c) { sent += 1024; c.enqueue(new Uint8Array(1024).fill(97)); if (sent > 10 * 1024 * 1024) c.close(); } });
    const r = new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json", "content-length": "10" }, body: stream, duplex: "half" } as RequestInit);
    await expect(publicBody(r, 16 * 1024)).rejects.toMatchObject({ status: 413 });
    expect(sent).toBeLessThan(200 * 1024);
  });
  it("answers malformed JSON with 400 and treats a non-object as empty", async () => {
    await expect(publicBody(post("{nope"))).rejects.toMatchObject({ status: 400 });
    expect(await publicBody(post("[1,2]"))).toEqual({});
    expect(await publicBody(post("\"text\""))).toEqual({});
  });
});

describe("cross-site submissions", () => {
  it("accepts the site's own origin and a request that carries no browser headers", () => {
    expect(() => assertSameSite(post({}, { origin: "http://localhost:3000", host: "localhost:3000" }))).not.toThrow();
    expect(() => assertSameSite(post({}))).not.toThrow();
    expect(() => assertSameSite(post({}, { origin: "https://modernbusinessarchitect.com", "x-forwarded-host": "modernbusinessarchitect.com" }))).not.toThrow();
  });
  it("refuses another site's origin, a malformed origin, and a browser-declared cross-site request", () => {
    expect(() => assertSameSite(post({}, { origin: "https://evil.example", host: "modernbusinessarchitect.com" }))).toThrowError(/not allowed/);
    expect(() => assertSameSite(post({}, { origin: "null", host: "modernbusinessarchitect.com" }))).toThrow();
    expect(() => assertSameSite(post({}, { "sec-fetch-site": "cross-site" }))).toThrow();
  });
  it("is enforced by the public route wrapper for state-changing methods only, before any limiter is consulted", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const route = publicRoute(handler, { rate: RATES.book });
    const refused = await route(post({}, { origin: "https://evil.example", host: "localhost:3000" }), {});
    expect(refused.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    const get = await publicRoute(handler)(new Request("http://localhost/x", { headers: { origin: "https://evil.example" } }), {});
    expect(get.status).toBe(200);
  });
});

describe("booking budgets (recipient and global, fail closed)", () => {
  it("admits a booking while both budgets have room, keyed by a hash that never contains the address", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await admitBooking("Ada@Example.test ")).toBe("ok");
    const keys = rpc.mock.calls.map((c) => String(c[1].p_key));
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^sched:book-email:[0-9a-f]{32}$/);
    expect(keys[1]).toBe("sched:book-all:all");
    expect(keys.join()).not.toMatch(/ada|example/i);
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_window_seconds: 3600, p_limit: RATES.bookEmail.limit });
  });
  it("treats the same address in another case or with spaces as one recipient", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await admitBooking("ada@example.test"); await admitBooking("  ADA@example.test");
    expect(rpc.mock.calls[0][1].p_key).toBe(rpc.mock.calls[2][1].p_key);
  });
  it("is limited when either budget is spent, and stops at the first spent one", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await admitBooking("a@example.test")).toBe("limited");
    expect(rpc).toHaveBeenCalledTimes(1);
    rpc.mockReset(); rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: false, error: null });
    expect(await admitBooking("a@example.test")).toBe("limited");
  });
  it("fails CLOSED when the limiter errors or throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    expect(await admitBooking("a@example.test")).toBe("unavailable");
    rpc.mockRejectedValue(new Error("network"));
    expect(await admitBooking("a@example.test")).toBe("unavailable");
  });
});

describe("the booking path", () => {
  it("asks the budget once for a new request, never for a repeat of the same key, and creates nothing when refused", async () => {
    const admit = vi.fn(async (): Promise<Admission> => "ok");
    const f = await fx(admit);
    const first = await f.svc.createBooking(f.input(1));
    expect(first.replay).toBe(false);
    const again = await f.svc.createBooking(f.input(1));
    expect(again.replay).toBe(true);
    expect(admit).toHaveBeenCalledTimes(1);
    expect(admit).toHaveBeenCalledWith("guest1@example.test");
    admit.mockResolvedValueOnce("limited");
    await expect(f.svc.createBooking(f.input(2, "11:00"))).rejects.toMatchObject({ status: 429, code: "rate_limited" });
    expect(await f.svc.repo.findByIdempotencyKey(f.input(2, "11:00").idempotencyKey)).toBeNull();
    admit.mockResolvedValueOnce("unavailable");
    await expect(f.svc.createBooking(f.input(3, "12:00"))).rejects.toMatchObject({ status: 503 });
    expect(await f.svc.repo.findByIdempotencyKey(f.input(3, "12:00").idempotencyKey)).toBeNull();
  });
  it("spends no budget on invalid input or an unknown meeting type", async () => {
    const admit = vi.fn(async (): Promise<Admission> => "ok");
    const f = await fx(admit);
    await expect(f.svc.createBooking({ ...f.input(3), guestEmail: "not-an-email" })).rejects.toMatchObject({ status: 400 });
    await expect(f.svc.createBooking({ ...f.input(3), slug: "no-such-page" })).rejects.toMatchObject({ status: 404 });
    expect(admit).not.toHaveBeenCalled();
  });
  it("the book route refuses a bot that filled the hidden field: no budget spent, nothing created, nothing sent", async () => {
    const f = await fx(admitBooking); instance.svc = f.svc;
    vi.stubEnv("VERCEL", "");
    rpc.mockResolvedValue({ data: true, error: null });
    const { POST } = await import("@/app/api/scheduling/book/route");
    const body = { slug: "talk-abuse", startUtc: `${DAY}T10:00:00Z`, name: "Bot", email: "bot@example.test", timeZone: "UTC", idempotencyKey: "bot-key-123456" };
    const spam = await POST(post({ ...body, contactUrl: "http://spam.example" }), {});
    expect(spam.status).toBe(400);
    expect(await f.svc.repo.findByIdempotencyKey("bot-key-123456")).toBeNull();
    expect(f.email.sent.length).toBe(0);
    rpc.mockClear();
    const ok = await POST(post(body), {});
    expect(ok.status).toBe(201);
    expect((await ok.json()).booking.reference).toBeTruthy();
  });
  it("the book route answers 429 when the recipient budget is spent and 503 when the limiter is down", async () => {
    const f = await fx(admitBooking); instance.svc = f.svc;
    const { POST } = await import("@/app/api/scheduling/book/route");
    const body = { slug: "talk-abuse", startUtc: `${DAY}T12:00:00Z`, name: "Ada", email: "ada@example.test", timeZone: "UTC", idempotencyKey: "limited-key-12345" };
    rpc.mockImplementation(async (_n: string, a: { p_key: string }) => ({ data: a.p_key.startsWith("sched:book-email") ? false : true, error: null }));
    const limited = await POST(post(body), {});
    expect(limited.status).toBe(429);
    expect(await f.svc.repo.findByIdempotencyKey("limited-key-12345")).toBeNull();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    rpc.mockImplementation(async (_n: string, a: { p_key: string }) => (a.p_key.startsWith("sched:book-email") ? { data: null, error: { message: "down" } } : { data: true, error: null }));
    expect((await POST(post(body), {})).status).toBe(503);
  });
});

describe("availability queries", () => {
  it("serves a normal near-future range", async () => {
    const f = await fx();
    const slots = await f.svc.publicSlots("talk-abuse", undefined, `${DAY}T00:00:00Z`, `${DAY}T23:59:00Z`);
    expect(slots.length).toBeGreaterThan(0);
  });
  it("refuses a range reaching far into the past or the distant future, without reading the calendar", async () => {
    const f = await fx();
    await expect(f.svc.publicSlots("talk-abuse", undefined, "2000-01-01T00:00:00Z", "2000-02-01T00:00:00Z")).rejects.toMatchObject({ status: 400 });
    await expect(f.svc.publicSlots("talk-abuse", undefined, "2040-01-01T00:00:00Z", "2040-02-01T00:00:00Z")).rejects.toMatchObject({ status: 400 });
    await expect(f.svc.publicSlots("talk-abuse", undefined, `${DAY}T00:00:00Z`, "2031-12-31T00:00:00Z")).rejects.toMatchObject({ status: 400 });
  });
  it("the slots route refuses oversize parameters and applies the per-client and global limits", async () => {
    const f = await fx(); instance.svc = f.svc;
    const { GET } = await import("@/app/api/scheduling/slots/route");
    rpc.mockResolvedValue({ data: true, error: null });
    const long = "a".repeat(500);
    expect((await GET(new Request(`http://localhost/api/scheduling/slots?type=${long}&from=a&to=b`), {})).status).toBe(400);
    expect((await GET(new Request(`http://localhost/api/scheduling/slots?type=talk-abuse&from=${DAY}T00:00:00Z&to=${DAY}T23:00:00Z`, { headers: { "x-forwarded-for": "203.0.113.9" } }), {})).status).toBe(200);
    const keys = rpc.mock.calls.map((c) => String(c[1].p_key));
    expect(keys).toContain("sched:slots:203.0.113.9");
    expect(keys).toContain("sched:slots-all:all");
    rpc.mockImplementation(async (_n: string, a: { p_key: string }) => ({ data: a.p_key !== "sched:slots-all:all", error: null }));
    const limited = await GET(new Request(`http://localhost/api/scheduling/slots?type=talk-abuse&from=${DAY}T00:00:00Z&to=${DAY}T23:00:00Z`), {});
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });
});

describe("no customer data in public answers", () => {
  it("the booking response and a refusal carry no email, message or internal id", async () => {
    const f = await fx(); instance.svc = f.svc;
    rpc.mockResolvedValue({ data: true, error: null });
    const { POST } = await import("@/app/api/scheduling/book/route");
    const res = await POST(post({ slug: "talk-abuse", startUtc: `${DAY}T14:00:00Z`, name: "Private Person", email: "private@example.test", message: "secret note", timeZone: "UTC", idempotencyKey: "leak-check-12345" }), {});
    const text = await res.text();
    expect(res.status).toBe(201);
    for (const needle of ["private@example.test", "secret note", "meetingTypeId", "idempotency", "requestHash"]) expect(text).not.toContain(needle);
    const clash = await POST(post({ slug: "talk-abuse", startUtc: `${DAY}T14:00:00Z`, name: "Other", email: "other@example.test", timeZone: "UTC", idempotencyKey: "leak-check-67890" }), {});
    const clashText = await clash.text();
    expect(clash.status).toBe(409);
    expect(clashText).not.toMatch(/private@example|Private Person|secret note/);
  });
});
