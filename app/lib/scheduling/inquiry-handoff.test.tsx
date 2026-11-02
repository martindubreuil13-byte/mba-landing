/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The inquiry-to-booking journey, end to end, with mocks only: nothing here can send a real email, reach Zoom or create a booking.
 *   Transition application -> saved -> confirmation link -> invitation email (same link) -> booking page prefilled from the opaque ref.
 *   Program inquiry (/api/qualify) -> owner notification -> visitor's reply with the booking link -> success-screen CTA.
 * An inquiry is NOT a booking: nothing below creates one, and the booking page's own submit stays where it was.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/server", async (orig) => ({ ...(await orig<object>()), after: (t: () => unknown) => t() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw Object.assign(new Error("404"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }); }, useRouter: () => ({ push: () => undefined }) }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn(async () => null) }));

import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => true, getClientIp: () => "203.0.113.7" }));
vi.mock("@/app/lib/intelligence/conversions", () => ({ recordConversion: vi.fn(async () => undefined) }));
vi.mock("@/app/lib/openai/client", () => ({ getOpenAIClient: () => { throw new Error("AI must not be reached"); }, CLASSIFY_MODEL: "x" }));

const sent: Array<Record<string, any>> = [];
let refuse: (m: Record<string, any>) => boolean = () => false;
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>) => {
  if (refuse(m)) return { data: null, error: { message: "provider refused", statusCode: 422 } };
  sent.push(m); return { data: { id: `msg_${sent.length}` }, error: null };
} } }) }));

const svc = vi.hoisted(() => ({ publicMeetingType: vi.fn(), prefillFor: vi.fn(), createBooking: vi.fn() }));
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => svc }));

process.env.EVIDENCE_HASH_SECRET = "s"; process.env.NAPKIN_UNSUBSCRIBE_SECRET = "s"; process.env.RESEND_API_KEY = "k"; process.env.PROGRAM_ADMIN_EMAIL = "martin@example.com";

import { POST as apply } from "@/app/api/programs/corporate-transition/apply/route";
import { POST as qualify } from "@/app/api/qualify/route";
import { INTRO_BOOKING_MINUTES, INTRO_BOOKING_PATH, introBookingPath, introBookingUrl } from "@/app/lib/booking";
import { inquiryPrefill } from "@/app/lib/scheduling/adapters/inquiry-prefill";
import { SchedulingService } from "@/app/lib/scheduling/service";
import { initialBookingForm } from "@/app/components/scheduling/BookingExperience";
import InquiryBookingCta from "@/app/components/programs/InquiryBookingCta";
import { PROGRAMS } from "@/app/lib/service-programs/catalog";

const ANSWERS = {
  employment: "Director / senior leader", experience: "20+ years", stage: "I have several ideas or possibilities and don’t know which one to pursue.", timing: "6–12 months",
  motivation: "I want to build something of my own after years in corporate.", help: "Help me work out which idea is credible and how to test it.",
  country: "Spain", firstName: "Elena", lastName: "Test", email: "elena@example.com", linkedin: "",
};
const post = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json", "user-agent": "t" }, body: JSON.stringify(body) });
const submit = (key = "key-1") => apply(post("/api/programs/corporate-transition/apply", { answers: ANSWERS, attribution: { source: "linkedin" }, idempotencyKey: key }));
const stored = () => db.tables.program_applications[0] as any;
const toApplicant = () => sent.filter((m) => m.to === "elena@example.com");

// Production: the booking link is the canonical https page, which is the only kind of link an email button is ever drawn for.
beforeEach(() => { vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", ""); for (const k of Object.keys(db.tables)) db.tables[k] = []; sent.length = 0; refuse = () => false; vi.clearAllMocks(); });
afterEach(() => vi.unstubAllEnvs());

describe("Transition: the application is saved, then the visitor is handed to the booking page", () => {
  it("saves the contact, the answers and the program interest, and records that NO session is booked yet", async () => {
    const res = await submit(); expect(res.status).toBe(200);
    const app = stored();
    expect(app).toMatchObject({ status: "INVITED", booking_status: "not_booked", program_key: expect.any(String) });
    expect(app.answers).toMatchObject({ firstName: "Elena", lastName: "Test", email: "elena@example.com", country: "Spain", timing: "6–12 months" });
    expect(app.answers.motivation).toContain("build something of my own");
    expect(db.tables.leads).toHaveLength(1);
    expect(db.tables.leads[0]).toMatchObject({ first_name: "Elena", email: "elena@example.com", ongoing_content_opt_in: false });   // contact saved; marketing consent untouched
  });

  it("answers with the complimentary-session link: the website's own booking page, an origin tag and the opaque ref, and nothing personal", async () => {
    const json = await (await submit()).json();
    const url = new URL(json.bookingUrl);
    expect(`${url.origin}${url.pathname}`).toBe("https://modernbusinessarchitect.com/book/complementary-session");
    expect(url.pathname).toBe(INTRO_BOOKING_PATH);
    expect(url.searchParams.get("source")).toBe("transition");
    expect(url.searchParams.get("ref")).toBe(stored().booking_ref);
    expect([...url.searchParams.keys()].sort()).toEqual(["ref", "source"]);
    expect(json.bookingUrl).not.toMatch(/elena|test|example|spain|name=|email=|answers/i);
    expect(JSON.stringify(json)).not.toContain(stored().id);
  });

  it("emails the SAME link once: it acknowledges receipt, names the free 45-minute Zoom conversation and says it is not a booking until a time is chosen", async () => {
    const json = await (await submit()).json();
    const mails = toApplicant();
    expect(mails).toHaveLength(1);
    const m = mails[0];
    expect(m.subject).toBe("Let’s have a conversation");
    expect(m.text).toContain("I’ve received your application.");
    expect(m.text).toContain(`You can book your free ${INTRO_BOOKING_MINUTES}-minute Zoom conversation with me using the button below.`);
    expect(m.text).toContain(`BOOK YOUR COMPLIMENTARY SESSION: ${json.bookingUrl}`);
    expect(m.html.replace(/&amp;/g, "&")).toContain(`href="${json.bookingUrl}"`);
    expect(m.text).toContain("This is the same booking link, not a second appointment.");
    expect(m.text).not.toMatch(/calendly/i);
    expect(sent.filter((x) => x.to === "martin@example.com")).toHaveLength(1);        // the owner is told once
    expect(sent).toHaveLength(2);                                                        // and nothing else is sent
  });

  it("a retry or double click of the same submission neither duplicates the application nor re-sends the email", async () => {
    await submit("key-9"); await submit("key-9"); await submit("key-9");
    expect(db.tables.program_applications).toHaveLength(1);
    expect(toApplicant()).toHaveLength(1);
  });

  it("when the email is refused the application is still saved and the confirmation still carries the booking link, truthfully", async () => {
    refuse = (m) => m.to === "elena@example.com";
    const json = await (await submit()).json();
    expect(json.success).toBe(true);
    expect(json.invitationEmail).toBe("not_sent");
    expect(json.bookingUrl).toContain("/book/complementary-session");
    expect(db.tables.program_applications).toHaveLength(1);
  });

  it("an invalid application is refused and saves nothing, so no half-made record or email exists", async () => {
    const res = await apply(post("/api/programs/corporate-transition/apply", { answers: { ...ANSWERS, email: "not-an-email" }, idempotencyKey: "k" }));
    expect(res.status).toBe(400);
    expect(db.tables.program_applications ?? []).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });
});

describe("the booking page greets the applicant without a second form and without personal data in the address", () => {
  it("the adapter returns ONLY the applicant's name and email for their ref, and nothing for a wrong or malformed one", async () => {
    await submit();
    const ref = stored().booking_ref;
    const found = await inquiryPrefill(ref);
    expect(found).toEqual({ name: "Elena Test", email: "elena@example.com" });
    expect(Object.keys(found!).sort()).toEqual(["email", "name"]);
    expect(JSON.stringify(found)).not.toMatch(/Spain|corporate|Director|motivation/);
    expect(await inquiryPrefill("0123456789abcdefghijklmn")).toBeNull();
  });

  it("the service only asks for a well-formed reference, never fails the page, and never says why it found nothing", async () => {
    await submit();
    const lookups = vi.fn(inquiryPrefill);
    const service = Object.create(SchedulingService.prototype) as any;
    service.inquiryPrefill = lookups;
    const ref = stored().booking_ref;
    expect(await service.prefillFor(ref)).toEqual({ name: "Elena Test", email: "elena@example.com" });
    for (const junk of [undefined, null, 42, "", "short", "has space and ! punctuation 12345", "x".repeat(200), "../../etc/passwd/0123456789"]) expect(await service.prefillFor(junk)).toBeNull();
    expect(lookups).toHaveBeenCalledTimes(1);                                               // junk never reaches the database
    service.inquiryPrefill = async () => { throw new Error("database down"); };
    expect(await service.prefillFor(ref)).toBeNull();                                       // a lookup failure is an empty form, not an error page
    service.inquiryPrefill = null;
    expect(await service.prefillFor(ref)).toBeNull();                                       // not wired (local prototype): empty form
  });

  it("the page hands the booking experience the prefill from the ref, the origin tag, and no preview flag once booking is open", async () => {
    vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("SCHEDULING_OPERATIONS_ENABLED", "true"); vi.stubEnv("SCHEDULING_PUBLIC_INTAKE_ENABLED", "true");
    svc.publicMeetingType.mockResolvedValue({ ok: true, type: { slug: "complementary-session", name: "Complementary Session", durationMinutes: 45, description: "", format: "zoom" } });
    svc.prefillFor.mockResolvedValue({ name: "Elena Test", email: "elena@example.com" });
    const { default: Page } = await import("@/app/book/[meetingType]/page");
    const el = (await Page({ params: Promise.resolve({ meetingType: "complementary-session" }), searchParams: Promise.resolve({ source: "transition", ref: "0123456789abcdefghijklmn" }) })) as any;
    const props = el.props.children.props;
    expect(svc.prefillFor).toHaveBeenCalledWith("0123456789abcdefghijklmn");
    expect(props).toMatchObject({ prefill: { name: "Elena Test", email: "elena@example.com" }, source: "transition", preview: false });
    // no ref at all: an ordinary visitor, an empty form
    svc.prefillFor.mockResolvedValue(null);
    const plain = (await Page({ params: Promise.resolve({ meetingType: "complementary-session" }), searchParams: Promise.resolve({}) })) as any;
    expect(plain.props.children.props.prefill).toBeNull();
    vi.unstubAllEnvs();
  });

  it("fills the two fields (still editable) when there is a prefill, and starts empty when there is not", () => {
    expect(initialBookingForm({ name: "Elena Test", email: "elena@example.com" })).toEqual({ name: "Elena Test", email: "elena@example.com", message: "", contactUrl: "" });
    expect(initialBookingForm(null)).toEqual({ name: "", email: "", message: "", contactUrl: "" });
    expect(initialBookingForm()).toEqual({ name: "", email: "", message: "", contactUrl: "" });
    expect(Object.keys(initialBookingForm({ name: "a", email: "b" })).sort()).toEqual(["contactUrl", "email", "message", "name"]);   // nothing else is prefilled
  });

  it("a prefilled name or email cannot smuggle markup: it is only ever a form value", () => {
    const form = initialBookingForm({ name: '"><script>alert(1)</script>', email: "a@b.co" });
    expect(form.name).toBe('"><script>alert(1)</script>');                                  // stored verbatim as a value; React escapes it when rendered
    expect(renderToStaticMarkup(<input value={form.name} readOnly />)).not.toContain("<script>");
  });
});

describe("Program inquiry (/lets-talk): the visitor can book now, or later from the email", () => {
  const p = PROGRAMS[2];
  const inquire = (over: Record<string, unknown> = {}) => qualify(post("/api/qualify", { name: "Ada Lovelace", email: "ada@example.com", message: "I would like to talk about this program.", situation: "x", program: { slug: p.slug }, attribution: {}, ...over }));
  const toVisitor = () => sent.filter((m) => m.to === "ada@example.com");
  const toOwner = () => sent.filter((m) => m.to === "martin@mindrasolutions.com");

  it("tells the owner once and sends the visitor one reply that acknowledges receipt and carries the program-tagged complimentary-session link", async () => {
    const res = await inquire(); expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, autoReply: true });
    expect(toOwner()).toHaveLength(1); expect(toVisitor()).toHaveLength(1); expect(sent).toHaveLength(2);
    const m = toVisitor()[0];
    expect(m.text).toContain("I've received your message about");
    expect(m.text).toContain(`Book Your Complimentary Session →\n${introBookingUrl(null, `inquiry-${p.slug}`)}`);
    expect(m.text).toContain(`free ${INTRO_BOOKING_MINUTES}-minute Zoom conversation`);
    expect(m.text).not.toMatch(/calendly/i);
    expect(m.text).not.toContain("ada@example.com");                                         // the visitor's reply repeats nothing they submitted
  });

  it("a general inquiry (no program) gets the plain 'inquiry' tag", async () => {
    await inquire({ program: undefined });
    expect(toVisitor()[0].text).toContain(introBookingUrl(null, "inquiry"));
    expect(toVisitor()[0].text).not.toContain("source=inquiry-");
  });

  it("if the visitor's reply cannot be sent the inquiry still succeeds and says so (autoReply false); if the owner's notification fails the visitor is told, never a false success", async () => {
    refuse = (m) => m.to === "ada@example.com";
    expect(await (await inquire()).json()).toEqual({ success: true, autoReply: false });
    sent.length = 0; refuse = (m) => m.to === "martin@mindrasolutions.com";
    const failed = await inquire();
    expect(failed.status).toBe(502);
    expect((await failed.json()).success).toBe(false);
    expect(toVisitor()).toHaveLength(0);                                                      // no confirmation for an inquiry that was not delivered
  });

  it("invalid input is refused before anything is sent", async () => {
    expect((await inquire({ email: "nope" })).status).toBe(400);
    expect((await inquire({ message: "" })).status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("the success screen's button goes to the on-site booking page tagged with the program, and only claims an email when one was accepted", () => {
    const withEmail = renderToStaticMarkup(<InquiryBookingCta programSlug={p.slug} autoReplySent />);
    const without = renderToStaticMarkup(<InquiryBookingCta programSlug={p.slug} autoReplySent={false} />);
    expect(withEmail).toContain(`href="${introBookingPath(null, `inquiry-${p.slug}`)}"`);
    expect(withEmail).toContain("Book Your Complimentary Session");
    expect(withEmail).toContain("free 45-minute Zoom conversation");
    expect(withEmail).toContain("I&#x27;ve also emailed you this link");
    expect(without).not.toContain("emailed you");
    expect(renderToStaticMarkup(<InquiryBookingCta programSlug={null} autoReplySent={false} />)).toContain('href="/book/complementary-session?source=inquiry"');
    expect(withEmail).not.toMatch(/calendly|https?:\/\//i);                                  // an on-site link, so it works on every deployment
  });
});

describe("wiring of the inquiry form's success screen (the page itself is a large client component)", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../lets-talk/page.tsx"), "utf8");
  it("shows the booking button only on the success screen, tagged with the selected program, using the API's real autoReply answer", () => {
    expect(page).toContain('import InquiryBookingCta from "@/app/components/programs/InquiryBookingCta";');
    expect(page).toContain("<InquiryBookingCta programSlug={program?.slug ?? null} autoReplySent={autoReplySent} />");
    expect(page.indexOf("<InquiryBookingCta")).toBeGreaterThan(page.indexOf('submitStatus === "success"'));
    expect(page).toContain("d?.autoReply === true");
    expect(page).toContain("get back to you personally within 48 hours");                       // the existing promise is kept
  });
});

describe("an inquiry is never a booking", () => {
  it("none of the paths above create a booking, and the confirmation text never says the session is booked or confirmed", async () => {
    await submit(); await qualify(post("/api/qualify", { name: "Ada", email: "ada@example.com", message: "hello there" }));
    expect(svc.createBooking).not.toHaveBeenCalled();
    expect(db.tables.program_applications[0]).toMatchObject({ booking_status: "not_booked" });
    for (const m of sent) expect(`${m.subject}\n${m.text}`).not.toMatch(/\b(is|are) (booked|confirmed)\b|your booking is confirmed|you(?:’|')re booked/i);
  });
  it("the shared link is stable for a visitor with no ref: the plain page", () => {
    expect(introBookingUrl()).toBe("https://modernbusinessarchitect.com/book/complementary-session");
  });
});
