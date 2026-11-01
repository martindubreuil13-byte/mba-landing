/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", async (orig) => ({ ...(await orig<object>()), after: (t: () => unknown) => t() }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn(async () => ({ email: "owner@example.test" })) }));
vi.mock("@/app/components/Navigation", () => ({ default: () => null }));
vi.mock("@/app/components/community/CommunityVerifyForm", () => ({ default: () => null }));

import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
vi.mock("@/app/lib/rateLimit", async (orig) => ({ ...(await orig<object>()), checkRateLimit: async () => true }));
// The ONLY place a message could leave: the site's email client. It records instead of sending.
const outbox: Array<{ payload: any; options: any }> = [];
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (payload: any, options: any) => { outbox.push({ payload, options }); return { data: { id: "msg_1" }, error: null }; } } }) }));
const instance = vi.hoisted(() => ({ svc: null as unknown }));
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => instance.svc }));
vi.mock("@/app/lib/scheduling/rate-limit", async (orig) => ({ ...(await orig<object>()), allowRequest: async () => true }));

process.env.EVIDENCE_HASH_SECRET = "test-evidence-secret";
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "unsub-secret";
process.env.RESEND_API_KEY = "test-key";
vi.stubEnv("SCHEDULING_PROTOTYPE", "true");

import { buildSeedData } from "./seed";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "./providers";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";
import { createLeadsConsent } from "./adapters/leads-consent";
import { COMMUNITY_DECLINE, COMMUNITY_FOOTNOTE, COMMUNITY_HEADING, COMMUNITY_INTRO, COMMUNITY_JOIN, COMMUNITY_NOTE, COMMUNITY_QUESTION, COMMUNITY_WORDING, COMMUNITY_WORDING_HISTORY, SCHEDULING_COMMUNITY_VERSION } from "./community";
import { buildCommunityVerificationEmail, createCommunityVerificationToken, sendCommunityVerificationEmail, verifyCommunityOptIn, verifyCommunityVerificationToken } from "@/app/lib/community/verification";
import { createConfirmationToken, verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { applyOptOut, consentStatusOf } from "@/app/lib/leads/consent";
import { listUnifiedLeadsAdmin } from "@/app/lib/leads/admin-queries";

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const EU = { ip: "198.51.100.4", userAgent: "vitest", country: "DE", region: null };
const TH = { ip: "203.0.113.9", userAgent: "vitest", country: "TH", region: null };
const DEVICE = { ipHash: "iphash", userAgentHash: "uahash" };
const tick = () => new Promise((r) => setTimeout(r, 8));

// What the production adapter does, except the message goes through the (recording) email client above.
const consent = createLeadsConsent(sendCommunityVerificationEmail);

async function fx() {
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email: createSimulatedEmail(), now: () => NOW, defer: () => {}, communityConsent: consent });
  const t = await svc.saveMeetingType({ slug: "talk-verify", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  let n = 0;
  const book = async (name = "Ada Lovelace", address = "ada@example.test") => {
    const hhmm = `${String(8 + n).padStart(2, "0")}:00`;
    const { booking } = await svc.createBooking({ slug: t.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: name, guestEmail: address, guestTimeZone: "UTC", idempotencyKey: `verify-key-${++n}-${hhmm}` });
    const stored = (await svc.repo.getBookingByReference(booking.reference))!;
    await svc.sync.run(stored.id);
    return { reference: booking.reference, id: stored.id };
  };
  return { svc, book };
}
const leads = () => db.tables.leads as any[];
const records = () => db.tables.consent_records as any[];
/** The token inside the one message the recording client received. */
const tokenSent = () => new URL(/https?:\/\/[^\s"'<>]+\/community\/verify\?token=[^\s"'<>&]+/.exec(outbox.at(-1)!.payload.text)![0]).searchParams.get("token")!;

beforeEach(() => { for (const k of Object.keys(db.tables)) db.tables[k] = []; db.insertCount = {}; db.failNextInsertInto = null; outbox.length = 0; process.env.RESEND_API_KEY = "test-key"; });

describe("the approved 'Stay in the loop' wording", () => {
  it("is exactly the supplied text, as version 2", () => {
    expect(COMMUNITY_HEADING).toBe("Stay in the loop.");
    expect(COMMUNITY_INTRO).toBe("I'm building a community of entrepreneurs, founders and people who believe business can be done differently.");
    expect(COMMUNITY_QUESTION).toBe("Want to receive occasional emails from The Modern Business Architect with practical ideas, resources, events and opportunities?");
    expect(COMMUNITY_NOTE).toBe("No daily motivational nonsense. Just things worth sharing.");
    expect(COMMUNITY_FOOTNOTE).toBe("You can unsubscribe anytime.");
    expect(COMMUNITY_JOIN).toBe("Yes, keep me in the loop");
    expect(COMMUNITY_DECLINE).toBe("Not now");
    expect(SCHEDULING_COMMUNITY_VERSION).toBe("scheduling-community-v2");
    expect(COMMUNITY_WORDING).toBe([COMMUNITY_HEADING, COMMUNITY_INTRO, COMMUNITY_QUESTION, COMMUNITY_NOTE, COMMUNITY_FOOTNOTE, COMMUNITY_JOIN, COMMUNITY_DECLINE].join("\n\n"));
  });
  it("keeps the earlier wording unchanged in its own entry, so an old answer's evidence still matches what the visitor saw", () => {
    expect(Object.keys(COMMUNITY_WORDING_HISTORY)).toEqual(["scheduling-community-v1", "scheduling-community-v2"]);
    expect(COMMUNITY_WORDING_HISTORY["scheduling-community-v1"].text).toBe("I’m building a community of people who are creating something of their own. Would you like occasional emails with practical advice, business ideas, guides, and resources? — Yes, count me in\nEntirely optional. Unsubscribe anytime. Your booking is confirmed regardless of your choice.");
  });
  it("is stored word for word, with its version, in the consent history on both sides", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", TH);
    const rec = records().find((r) => r.action === "opt_in")!;
    expect(rec).toMatchObject({ wording_version: "scheduling-community-v2", wording_text: COMMUNITY_WORDING });
    const snap = await f.svc.repo.snapshot();
    expect(snap.consents[0]).toMatchObject({ choice: "joined", wordingVersion: "scheduling-community-v2", wording: COMMUNITY_WORDING });
  });
});

describe("the verification token", () => {
  it("round-trips, names the contact and the request, and expires", () => {
    const t = createCommunityVerificationToken("lead-1", "req-1", NOW);
    expect(verifyCommunityVerificationToken(t, NOW + 1000)).toEqual({ ok: true, leadId: "lead-1", requestId: "req-1" });
    expect(verifyCommunityVerificationToken(t, NOW + 14 * 86_400_000 + 5000)).toEqual({ ok: false, reason: "expired" });
    expect(verifyCommunityVerificationToken(t, NOW + 13 * 86_400_000)).toMatchObject({ ok: true });
  });
  it("cannot be forged, edited or built from another token, and no other site token works here (or the reverse)", () => {
    const t = createCommunityVerificationToken("lead-1", "req-1", NOW);
    const [p, l, r, e, sig] = t.split(".");
    for (const bad of [`${p}.lead-2.${r}.${e}.${sig}`, `${p}.${l}.req-2.${e}.${sig}`, `${p}.${l}.${r}.${Number(e) + 99999}.${sig}`, `${p}.${l}.${r}.${e}.${sig.slice(1)}x`, "", "m1", "garbage"]) {
      expect(verifyCommunityVerificationToken(bad, NOW)).toMatchObject({ ok: false, reason: "invalid" });
    }
    expect(verifyCommunityVerificationToken(createConfirmationToken("lead-1", NOW), NOW).ok).toBe(false);
    expect(verifyCommunityVerificationToken(createUnsubscribeToken("lead-1"), NOW).ok).toBe(false);
    expect(verifyConfirmationToken(t, NOW).ok).toBe(false);
  });
});

describe("a 'yes' where the site asks for proof of the address", () => {
  it("is pending, sends one dedicated message to that address only, and activates nothing until the link is used", async () => {
    const f = await fx(); const b = await f.book();
    expect(await f.svc.recordCommunity(b.reference, "joined", EU)).toBe("joined");
    expect(consentStatusOf(leads()[0])).toBe("pending");
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].payload.to).toBe("ada@example.test");
    expect(outbox[0].options.idempotencyKey).toBe(`community-verify/${records()[0].id}`);
    const row = (await listUnifiedLeadsAdmin())[0];
    expect(row).toMatchObject({ subscription_status: "pending_confirmation", shortlisted: false, consent_at: null });
  });

  it("is not the Transition applicant message: its own subject, wording, link, unsubscribe and privacy links, and nothing promotional", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const m = outbox[0].payload;
    expect(m.subject).toBe("Please confirm your email address");
    const everything = `${m.subject}\n${m.text}\n${m.html}`;
    expect(everything).toMatch(/community\/verify\?token=m1\./);
    expect(everything).toMatch(/unsubscribe\?token=/);
    expect(everything).toMatch(/\/privacy/);
    expect(everything).toContain("When you booked a conversation");
    for (const transition of ["applying", "application", "Transition", "stay connected", "Your booking link is available"]) expect(everything).not.toContain(transition);
    for (const promo of ["resource", "guide", "offer", "newsletter", "% off", "buy"]) expect(everything.toLowerCase()).not.toContain(promo);
    expect(m.headers["List-Unsubscribe"]).toMatch(/\/api\/unsubscribe\?token=/);
    expect(m.from).toMatch(/mindrasolutions\.com/);
  });

  it("carries a link bound to the contact and its own request, and the link works only through the explicit POST", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    expect(verifyCommunityVerificationToken(tokenSent())).toEqual({ ok: true, leadId: leads()[0].id, requestId: records()[0].id });
    // opening the page (a GET, a mail scanner) changes nothing
    const { default: Page } = await import("@/app/community/verify/page");
    await Page({ searchParams: Promise.resolve({ token: tokenSent() }) });
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect(records().map((r) => r.action)).toEqual(["opt_in_requested"]);
    const { POST } = await import("@/app/api/community/verify/route");
    const res = await POST(new Request("http://localhost/api/community/verify", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.50", "user-agent": "browser" }, body: JSON.stringify({ token: tokenSent() }) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "confirmed" });
    expect(leads()[0].ongoing_content_opt_in).toBe(true);
    expect(consentStatusOf(leads()[0])).toBe("opted_in");
  });

  it("then records the verification as evidence tied to the original request, keeping the exact wording the visitor accepted", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const request = records()[0];
    expect((await verifyCommunityOptIn(tokenSent(), DEVICE)).status).toBe("confirmed");
    const optIn = records().find((r) => r.action === "opt_in")!;
    expect(optIn).toMatchObject({ method: "email_confirmation", related_record_id: request.id, wording_version: "scheduling-community-v2", wording_text: COMMUNITY_WORDING, source_type: "scheduling_booking", ip_hash: "iphash", user_agent_hash: "uahash" });
    expect(request.wording_text).toBe(COMMUNITY_WORDING);
    const row = (await listUnifiedLeadsAdmin())[0];
    expect(row).toMatchObject({ subscription_status: "subscribed", consent_version: "scheduling-community-v2", consent_source: "booking confirmation invitation" });
  });

  it("keeps pending and unverified contacts out of the marketing-eligible exports until verified, then includes them", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const { GET } = await import("@/app/api/admin/leads/export/route");
    const exportOf = async (kind: string) => (await (await GET(new Request(`http://localhost/api/admin/leads/export?kind=${kind}`))).text());
    expect(await exportOf("subscribers")).not.toContain("ada@example.test");
    expect(await exportOf("shortlisted")).not.toContain("ada@example.test");
    await verifyCommunityOptIn(tokenSent(), DEVICE);
    expect(await exportOf("subscribers")).toContain("ada@example.test");
    expect(await exportOf("shortlisted")).toContain("ada@example.test");
  });

  it("fails loudly if the message cannot be sent (the visitor is told to try again, the booking records no answer), and a retry then sends exactly one", async () => {
    const f = await fx(); const b = await f.book();
    vi.stubEnv("RESEND_API_KEY", "");
    delete process.env.RESEND_API_KEY;
    await expect(f.svc.recordCommunity(b.reference, "joined", EU)).rejects.toThrow(/verification email could not be sent/);
    expect((await f.svc.repo.getBooking(b.id))!.community.state).not.toBe("joined");
    expect((await f.svc.repo.getBooking(b.id))!.status).toBe("confirmed");
    expect(outbox).toHaveLength(0);
    process.env.RESEND_API_KEY = "test-key";
    expect(await f.svc.recordCommunity(b.reference, "joined", EU)).toBe("joined");
    expect(outbox).toHaveLength(1);
    expect(consentStatusOf(leads()[0])).toBe("pending");
  });
});

describe("a verification link is single-use, expiring, and never revives anything", () => {
  it("has its effect once: using it again changes and writes nothing", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const token = tokenSent();
    expect((await verifyCommunityOptIn(token, DEVICE)).status).toBe("confirmed");
    const before = JSON.stringify([leads(), records()]);
    expect((await verifyCommunityOptIn(token, DEVICE)).status).toBe("already_confirmed");
    expect((await verifyCommunityOptIn(token, DEVICE)).status).toBe("already_confirmed");
    expect(JSON.stringify([leads(), records()])).toBe(before);
    expect(records().filter((r) => r.action === "opt_in")).toHaveLength(1);
  });

  it("does nothing once expired", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const old = createCommunityVerificationToken(leads()[0].id, records()[0].id, Date.now() - 15 * 86_400_000);
    expect((await verifyCommunityOptIn(old, DEVICE)).status).toBe("expired");
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    const { POST } = await import("@/app/api/community/verify/route");
    const res = await POST(new Request("http://localhost/api/community/verify", { method: "POST", body: JSON.stringify({ token: old }) }));
    expect(res.status).toBe(400);
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
  });

  it("does not bring back someone who withdrew after asking: the link ends with the withdrawal", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const token = tokenSent();
    await tick();
    await applyOptOut(leads()[0].id, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" });
    expect((await verifyCommunityOptIn(token, DEVICE)).status).toBe("not_pending");
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect(records().map((r) => r.action).sort()).toEqual(["opt_in_requested", "opt_out"]);
    const { POST } = await import("@/app/api/community/verify/route");
    const res = await POST(new Request("http://localhost/api/community/verify", { method: "POST", body: JSON.stringify({ token }) }));
    expect(res.status).toBe(409);
  });

  it("does not bring back someone who verified and then withdrew, even if the old link is used again", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const token = tokenSent();
    await verifyCommunityOptIn(token, DEVICE);
    await tick();
    await applyOptOut(leads()[0].id, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" });
    expect((await verifyCommunityOptIn(token, DEVICE)).status).toBe("not_pending");
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect((await listUnifiedLeadsAdmin())[0].subscription_status).toBe("unsubscribed");
  });

  it("after a withdrawal, an old link stays dead even when the person asks again: only the NEW request's link works", async () => {
    const f = await fx();
    const first = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(first.reference, "joined", EU);
    const oldToken = tokenSent();
    await tick();
    await applyOptOut(leads()[0].id, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" });
    await tick();
    const second = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(second.reference, "joined", TH);        // even outside the proof-required list, a returning contact must verify
    expect(consentStatusOf(leads()[0])).toBe("pending");
    expect(outbox).toHaveLength(2);
    const newToken = tokenSent();
    expect(newToken).not.toBe(oldToken);
    expect((await verifyCommunityOptIn(oldToken, DEVICE)).status).toBe("not_pending");
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect((await verifyCommunityOptIn(newToken, DEVICE)).status).toBe("confirmed");
    expect(leads()[0].ongoing_content_opt_in).toBe(true);
  });

  it("never touches a suppressed contact, before or after the request", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", EU);
    const token = tokenSent();
    leads()[0].suppressed_at = "2031-01-01T00:00:00.000Z";          // a spam complaint arrives
    const before = JSON.stringify([leads(), records()]);
    expect((await verifyCommunityOptIn(token, DEVICE)).status).toBe("suppressed");
    expect(JSON.stringify([leads(), records()])).toBe(before);
    // and a suppressed contact who answers yes never gets a message at all
    db.tables.leads.push({ id: "spam", first_name: "Bob", email: "bob@example.test", country: null, ongoing_content_opt_in: false, ongoing_content_opt_in_at: null, ongoing_content_opt_out_at: null, suppressed_at: "2030-01-01T00:00:00.000Z", consent_requested_at: null, created_at: "2030-01-01T00:00:00.000Z" });
    const c = await f.book("Bob", "bob@example.test");
    outbox.length = 0;
    await f.svc.recordCommunity(c.reference, "joined", EU);
    expect(outbox).toHaveLength(0);
  });

  it("refuses a link whose request is not a booking community request of that contact", async () => {
    const f = await fx();
    const a = await f.book("Ada", "ada@example.test"); const c = await f.book("Cy", "cy@example.test");
    await f.svc.recordCommunity(a.reference, "joined", EU); const adaRequest = records()[0].id; const adaId = leads()[0].id;
    await f.svc.recordCommunity(c.reference, "joined", EU); const cyId = leads()[1].id;
    expect((await verifyCommunityOptIn(createCommunityVerificationToken(cyId, adaRequest), DEVICE)).status).toBe("invalid");    // Ada's request, Cy's identity
    expect((await verifyCommunityOptIn(createCommunityVerificationToken(adaId, "no-such-request"), DEVICE)).status).toBe("invalid");
    db.tables.consent_records.push({ id: "guide-request", lead_id: adaId, action: "opt_in_requested", source_type: "resource", wording_version: "x", created_at: new Date().toISOString() });
    expect((await verifyCommunityOptIn(createCommunityVerificationToken(adaId, "guide-request"), DEVICE)).status).toBe("invalid");   // another surface's request
    expect(leads().every((l) => !l.ongoing_content_opt_in)).toBe(true);
  });
});

describe("outside the proof-required regions the existing affirmative rule is unchanged", () => {
  it("activates at once, sends no verification message, and records the click as the consent", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", TH);
    expect(consentStatusOf(leads()[0])).toBe("opted_in");
    expect(outbox).toHaveLength(0);
    expect(records().map((r) => [r.action, r.method])).toEqual([["opt_in", "button_disclosure"]]);
  });
});

describe("the real sender", () => {
  it("builds the link from the request it is given and refuses to run without a mail key", async () => {
    const { links } = buildCommunityVerificationEmail({ leadId: "L", requestId: "R", firstName: "Ada" });
    expect(verifyCommunityVerificationToken(new URL(links.verifyUrl).searchParams.get("token")!)).toEqual({ ok: true, leadId: "L", requestId: "R" });
    delete process.env.RESEND_API_KEY;
    expect(await sendCommunityVerificationEmail({ to: "a@example.test", leadId: "L", requestId: "R", firstName: "A" })).toEqual({ ok: false, error: "RESEND_API_KEY is not configured." });
    expect(outbox).toHaveLength(0);
  });
});
