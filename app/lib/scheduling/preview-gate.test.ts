import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

/**
 * Production while public intake is CLOSED: the booking page and its availability lookup serve the signed-in administrator as a read-only preview,
 * every other request is "not found", and nothing that writes ever opens. Mocks only.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/server", async (orig) => ({ ...(await orig<object>()), after: (t: () => unknown) => t() }));
vi.mock("next/navigation", async () => ({ notFound: () => { throw Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }); }, useRouter: () => ({ push: () => undefined }) }));
const admin = vi.hoisted(() => ({ user: null as null | { email: string }, calls: 0 }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn(async () => { admin.calls++; return admin.user; }) }));
const publicType = { slug: "complementary-session", name: "Complementary Session", description: "", durationMinutes: 45, priceLabel: null, format: "zoom" };
const svc = vi.hoisted(() => ({ prefillFor: vi.fn(async () => null), originFor: vi.fn(async () => null), publicMeetingType: vi.fn(), publicSlots: vi.fn(async () => [{ startUtc: "2031-03-03T02:00:00.000Z", endUtc: "2031-03-03T02:45:00.000Z" }]), createBooking: vi.fn(), recordCommunity: vi.fn(), answerCommunity: vi.fn(), nudge: vi.fn(async () => null) }));
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => svc }));
vi.mock("@/app/lib/scheduling/rate-limit", async (orig) => ({ ...(await orig<object>()), allowRequest: async () => true, allowGlobal: async () => true, admitBooking: async () => "ok" }));

const closedProduction = () => {
  vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1");
  vi.stubEnv("SCHEDULING_OPERATIONS_ENABLED", "true"); vi.stubEnv("SCHEDULING_PUBLIC_INTAKE_ENABLED", "false");
};
const open = () => { closedProduction(); vi.stubEnv("SCHEDULING_PUBLIC_INTAKE_ENABLED", "true"); };
const json = (path: string, body: unknown = {}) => new Request(`https://modernbusinessarchitect.com${path}`, { method: "POST", headers: { "content-type": "application/json", origin: "https://modernbusinessarchitect.com", host: "modernbusinessarchitect.com" }, body: JSON.stringify(body) });
const slotsUrl = "https://modernbusinessarchitect.com/api/scheduling/slots?type=complementary-session&from=2031-03-03T00:00:00Z&to=2031-03-04T00:00:00Z";

beforeEach(() => { admin.user = null; admin.calls = 0; vi.clearAllMocks(); svc.publicMeetingType.mockResolvedValue({ ok: true, type: publicType }); });
afterEach(() => vi.unstubAllEnvs());

/** The booking page's <main> now holds the inline script and then the booking experience: find the experience's props. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const experienceProps = (el: any) => (Array.isArray(el.props.children) ? el.props.children : [el.props.children]).find((c: any) => c?.props?.type)?.props;

describe("the availability lookup while intake is closed", () => {
  it("answers 404 to a visitor, and never even asks who they are for another route", async () => {
    closedProduction();
    const { GET } = await import("@/app/api/scheduling/slots/route");
    expect((await GET(new Request(slotsUrl), {})).status).toBe(404);
    expect(svc.publicSlots).not.toHaveBeenCalled();
  });
  it("serves the signed-in administrator, read-only", async () => {
    closedProduction(); admin.user = { email: "owner@example.test" };
    const { GET } = await import("@/app/api/scheduling/slots/route");
    const res = await GET(new Request(slotsUrl), {});
    expect(res.status).toBe(200);
    expect((await res.json()).slots).toHaveLength(1);
    expect(svc.publicSlots).toHaveBeenCalledTimes(1);
  });
  it("is still 404 when scheduling operations are off, whoever asks", async () => {
    closedProduction(); vi.stubEnv("SCHEDULING_OPERATIONS_ENABLED", "false"); admin.user = { email: "owner@example.test" };
    const { GET } = await import("@/app/api/scheduling/slots/route");
    expect((await GET(new Request(slotsUrl), {})).status).toBe(404);
  });
  it("treats a failing session check as 'not signed in'", async () => {
    closedProduction();
    const mod = await import("@/app/lib/supabase/admin-session");
    vi.mocked(mod.getAdminUser).mockRejectedValueOnce(new Error("auth timeout"));
    const { GET } = await import("@/app/api/scheduling/slots/route");
    expect((await GET(new Request(slotsUrl), {})).status).toBe(404);
  });
  it("is the ordinary public lookup once intake opens (no session needed)", async () => {
    open();
    const { GET } = await import("@/app/api/scheduling/slots/route");
    expect((await GET(new Request(slotsUrl), {})).status).toBe(200);
    expect(admin.calls).toBe(0);
  });
});

describe("nothing that writes opens while intake is closed, not even for the administrator", () => {
  it("refuses a booking, a community answer, the prototype replay and a booking-status read-through with 404", async () => {
    closedProduction(); admin.user = { email: "owner@example.test" };
    const book = await import("@/app/api/scheduling/book/route");
    const community = await import("@/app/api/scheduling/community/route");
    const replay = await import("@/app/api/scheduling/replay/route");
    expect((await book.POST(json("/api/scheduling/book", { slug: "complementary-session", startUtc: "2031-03-03T02:00:00Z", name: "Test", email: "t@example.test", timeZone: "UTC", idempotencyKey: "preview-key-12345" }), {})).status).toBe(404);
    expect((await community.POST(json("/api/scheduling/community", { reference: "x", action: "joined" }), {})).status).toBe(404);
    expect((await replay.POST(json("/api/scheduling/replay", { reference: "x" }), {})).status).toBe(404);
    expect(svc.createBooking).not.toHaveBeenCalled();
    expect(svc.answerCommunity).not.toHaveBeenCalled();
    expect(svc.recordCommunity).not.toHaveBeenCalled();
  });
  it("does not let a GET-only preview option be used by another method on the slots route", async () => {
    closedProduction(); admin.user = { email: "owner@example.test" };
    const { publicRoute } = await import("@/app/lib/scheduling/http");
    const handler = vi.fn(async () => new Response("ok"));
    const route = publicRoute(handler, { adminPreview: true });
    expect((await route(new Request(slotsUrl, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), {})).status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
    expect((await route(new Request(slotsUrl), {})).status).toBe(200);
  });
});

describe("the booking page while intake is closed", () => {
  const render = async (reference = "complementary-session") => { const { default: Page } = await import("@/app/book/[meetingType]/page"); return Page({ params: Promise.resolve({ meetingType: reference }), searchParams: Promise.resolve({}) }); };
  it("is 'not found' for a visitor, and does not even look the meeting type up", async () => {
    closedProduction();
    await expect(render()).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    expect(svc.publicMeetingType).not.toHaveBeenCalled();
  });
  it("shows the administrator the real page in preview mode", async () => {
    closedProduction(); admin.user = { email: "owner@example.test" };
    const el = (await render()) as { props: { children: { props: { preview: boolean; type: { slug: string } } } } };
    expect(experienceProps(el).preview).toBe(true);
    expect(experienceProps(el).type.slug).toBe("complementary-session");
  });
  it("still says 'not found' to the administrator for a link that does not exist", async () => {
    closedProduction(); admin.user = { email: "owner@example.test" };
    svc.publicMeetingType.mockResolvedValueOnce({ ok: false, reason: "not_found" });
    await expect(render("nope")).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
  it("is the ordinary public page, not a preview, once intake opens, and needs no session", async () => {
    open();
    const el = (await render()) as { props: { children: { props: { preview: boolean } } } };
    expect(experienceProps(el).preview).toBe(false);
    expect(admin.calls).toBe(0);
  });
});

describe("the booking experience in preview", () => {
  const markup = async (preview: boolean) => { const { default: BookingExperience } = await import("@/app/components/scheduling/BookingExperience"); return renderToStaticMarkup(createElement(BookingExperience, { type: publicType as never, preview })); };
  it("says plainly that it is a preview and that nothing is booked, and only then", async () => {
    const on = await markup(true);
    expect(on).toContain("Administrator preview");
    expect(on).toContain("nothing will be booked, saved or sent");
    expect(await markup(false)).not.toContain("Administrator preview");
  });
});
