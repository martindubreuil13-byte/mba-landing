/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t(), NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json" } }) } }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));

import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
// Any email the consent code might try to send would land here. The tests assert that nothing does.
const sentMail: unknown[] = [];
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: unknown) => { sentMail.push(m); return { data: { id: "x" }, error: null }; } } }) }));
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
import { COMMUNITY_WORDING, SCHEDULING_COMMUNITY_VERSION } from "./community";
import { listUnifiedLeadsAdmin, leadsToCsv } from "@/app/lib/leads/admin-queries";
import { applyOptOut, consentStatusOf } from "@/app/lib/leads/consent";
import { hashEvidence } from "@/app/lib/leads/evidence";

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const OUTSIDE_EU = { ip: "203.0.113.9", userAgent: "vitest", country: "TH", region: null };
// Every verification message the adapter would send lands here: no test ever reaches a real mail provider.
const verifications: Array<{ to: string; leadId: string; requestId: string; firstName: string }> = [];
let sendFails = false;
const leadsConsent = createLeadsConsent(async (m) => { if (sendFails) return { ok: false, error: "provider down" }; verifications.push(m); return { ok: true, error: null }; });
const IN_EU = { ip: "198.51.100.4", userAgent: "vitest", country: "DE", region: null };

async function fx(withConsent = true) {
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const email = createSimulatedEmail();
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email, now: () => NOW, defer: () => {}, communityConsent: withConsent ? leadsConsent : undefined });
  const t = await svc.saveMeetingType({ slug: "talk-community", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  let n = 0;
  const book = async (name = "Ada Lovelace", address = "ada@example.test") => {
    const hhmm = `${String(8 + n).padStart(2, "0")}:00`;
    const { booking } = await svc.createBooking({ slug: t.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: name, guestEmail: address, guestTimeZone: "UTC", idempotencyKey: `community-key-${++n}-${hhmm}` });
    const stored = (await svc.repo.getBookingByReference(booking.reference))!;
    await svc.sync.run(stored.id);                                    // the guest's Zoom details become ready: only then is the invitation offered
    return { reference: booking.reference, id: stored.id };
  };
  return { svc, email, book };
}
const leads = () => db.tables.leads as any[];
const records = () => db.tables.consent_records as any[];

beforeEach(() => { for (const k of Object.keys(db.tables)) db.tables[k] = []; db.insertCount = {}; sentMail.length = 0; verifications.length = 0; sendFails = false; });

describe("a 'yes' to the community invitation", () => {
  it("records the contact and consent in the Leads records with its evidence, and sends nothing", async () => {
    const f = await fx(); const b = await f.book();
    expect(await f.svc.recordCommunity(b.reference, "shown", OUTSIDE_EU)).toBe("shown");
    expect(leads()).toHaveLength(0);                                                       // being shown the invitation creates no contact
    expect(await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU)).toBe("joined");

    expect(leads()).toHaveLength(1);
    const l = leads()[0];
    expect(l).toMatchObject({ first_name: "Ada", email: "ada@example.test", ongoing_content_opt_in: true });
    expect(l.ongoing_content_opt_in_at).toBeTruthy();
    expect(consentStatusOf(l)).toBe("opted_in");
    const r = records().filter((x) => x.action === "opt_in");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ lead_id: l.id, wording_version: SCHEDULING_COMMUNITY_VERSION, wording_text: COMMUNITY_WORDING, method: "button_disclosure", source_type: "scheduling_booking", cta_location: "booking_confirmation" });
    expect(r[0].created_at).toBeTruthy();
    expect(r[0].ip_hash).toBe(hashEvidence("203.0.113.9"));
    expect(JSON.stringify(r[0])).not.toContain("203.0.113.9");                              // the address is only ever a keyed hash
    expect(sentMail).toHaveLength(0);                                                      // no confirmation, no marketing, nothing
    expect(verifications).toHaveLength(0);                                                  // outside the proof-required list nothing needs verifying
    expect(f.email.sent.some((m) => m.tags?.scheduling_kind?.includes("community") || /community/i.test(m.subject))).toBe(false);
  });

  it("shows the contact and its consent in the Leads report (status, date, source, acquisition) and its export", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU);
    const [row] = await listUnifiedLeadsAdmin();
    expect(row).toMatchObject({ first_name: "Ada", email: "ada@example.test", subscription_status: "subscribed", consent_source: "booking confirmation invitation", consent_version: SCHEDULING_COMMUNITY_VERSION, acquired_through: "Booking — community invitation" });
    expect(row.consent_at).toBeTruthy();
    const csv = leadsToCsv([row]);
    expect(csv).toContain("ada@example.test");
    expect(csv).toContain("booking confirmation invitation");
  });

  it("updates an existing contact instead of creating a second one, and keeps its name and its original consent", async () => {
    const f = await fx();
    db.tables.leads.push({ id: "lead-existing", first_name: "Augusta", email: "ada@example.test", country: "Canada", ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2031-01-01T00:00:00.000Z", ongoing_content_opt_out_at: null, suppressed_at: null, consent_requested_at: null, created_at: "2031-01-01T00:00:00.000Z" });
    db.tables.consent_records.push({ id: "c0", lead_id: "lead-existing", action: "opt_in", wording_version: "resource-v1", source_type: "resource", created_at: "2031-01-01T00:00:00.000Z" });
    const b = await f.book("Ada King", "ADA@Example.Test");
    await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU);
    expect(leads()).toHaveLength(1);
    expect(leads()[0]).toMatchObject({ id: "lead-existing", first_name: "Augusta", country: "Canada", ongoing_content_opt_in_at: "2031-01-01T00:00:00.000Z" });
    expect(records().filter((r) => r.action === "opt_in")).toHaveLength(1);                // nothing new for someone already opted in
  });

  it("matches an existing contact whatever the case or spacing of the booking address", async () => {
    const f = await fx();
    db.tables.leads.push({ id: "lead-1", first_name: "Ada", email: "ada@example.test", country: null, ongoing_content_opt_in: false, ongoing_content_opt_in_at: null, ongoing_content_opt_out_at: null, suppressed_at: null, consent_requested_at: null, created_at: "2031-01-01T00:00:00.000Z" });
    const b = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU);
    expect(leads()).toHaveLength(1);
    expect(leads()[0].ongoing_content_opt_in).toBe(true);
  });

  it("two bookings and a repeated click from one address make one contact and one consent record", async () => {
    const f = await fx();
    const a = await f.book("Ada", "ada@example.test"); const b = await f.book("Ada L", "ada@example.test");
    await f.svc.recordCommunity(a.reference, "joined", OUTSIDE_EU);
    await f.svc.recordCommunity(a.reference, "joined", OUTSIDE_EU);
    await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU);
    expect(leads()).toHaveLength(1);
    expect(records().filter((r) => r.action === "opt_in")).toHaveLength(1);
  });

  it("in a place where the site asks for proof of the address, is recorded as a pending request, not active consent, with ONE dedicated verification message prepared", async () => {
    const f = await fx(); const b = await f.book();
    expect(await f.svc.recordCommunity(b.reference, "joined", IN_EU)).toBe("joined");     // the booking's own record of the answer
    const l = leads()[0];
    expect(l.ongoing_content_opt_in).toBe(false);
    expect(consentStatusOf(l)).toBe("pending");
    expect(records().map((r) => r.action)).toEqual(["opt_in_requested"]);
    const [row] = await listUnifiedLeadsAdmin();
    expect(row.subscription_status).toBe("pending_confirmation");
    expect(row.shortlisted).toBe(false);
    expect(row.acquired_through).toBe("Booking — community invitation");
    expect(verifications).toHaveLength(1);
    expect(verifications[0]).toMatchObject({ to: "ada@example.test", leadId: l.id, firstName: "Ada" });
    expect(verifications[0].requestId).toBe(records()[0].id);                                // the link will be bound to this very request
    expect(sentMail).toHaveLength(0);                                                       // and no real provider was reached
  });

  it("treats an unknown location like the site does (ask for proof), never as consent", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", { ip: null, userAgent: null, country: null, region: null });
    expect(consentStatusOf(leads()[0])).toBe("pending");
    expect(verifications).toHaveLength(1);
  });

  it("never re-subscribes someone who unsubscribed earlier, and never touches a suppressed contact", async () => {
    const f = await fx();
    db.tables.leads.push({ id: "gone", first_name: "Ada", email: "ada@example.test", country: null, ongoing_content_opt_in: false, ongoing_content_opt_in_at: "2020-01-01T00:00:00.000Z", ongoing_content_opt_out_at: "2020-06-01T00:00:00.000Z", suppressed_at: null, consent_requested_at: null, created_at: "2020-01-01T00:00:00.000Z" });
    const b = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU);
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect(consentStatusOf(leads()[0])).toBe("pending");                                   // a request, to be confirmed by them
    db.tables.leads.push({ id: "spam", first_name: "Bob", email: "bob@example.test", country: null, ongoing_content_opt_in: false, ongoing_content_opt_in_at: null, ongoing_content_opt_out_at: null, suppressed_at: "2030-01-01T00:00:00.000Z", consent_requested_at: null, created_at: "2030-01-01T00:00:00.000Z" });
    const c = await f.book("Bob", "bob@example.test");
    const before = JSON.stringify(leads().find((l) => l.id === "spam"));
    const recordsBefore = records().length;
    await f.svc.recordCommunity(c.reference, "joined", OUTSIDE_EU);
    expect(JSON.stringify(leads().find((l) => l.id === "spam"))).toBe(before);
    expect(records().length).toBe(recordsBefore);
    // ...including where the site asks for proof of the address, which is a different path through the code
    const d = await f.book("Bob", "bob@example.test");
    await f.svc.recordCommunity(d.reference, "joined", IN_EU);
    expect(JSON.stringify(leads().find((l) => l.id === "spam"))).toBe(before);
    expect(records().length).toBe(recordsBefore);
    expect(await leadsConsentResult("bob@example.test", IN_EU)).toBe("not_applied");
  });
});

async function leadsConsentResult(email: string, visitor: typeof IN_EU) { return leadsConsent.join({ guestName: "Bob", email, visitor }); }

describe("a decline, a dismissal or no answer", () => {
  it("records no consent and creates no contact, and the booking stands untouched", async () => {
    const f = await fx();
    for (const action of ["declined", "dismissed"] as const) {
      const b = await f.book(`Guest ${action}`, `${action}@example.test`);
      const booking = (await f.svc.repo.getBooking(b.id))!;
      expect(await f.svc.recordCommunity(b.reference, action, OUTSIDE_EU)).toBe(action);
      const after = (await f.svc.repo.getBooking(b.id))!;
      expect(after.status).toBe("confirmed");
      expect(after.startUtc).toBe(booking.startUtc);
      expect(after.sync?.status).toBe("ok");
    }
    expect(leads()).toHaveLength(0);
    expect(records()).toHaveLength(0);
  });

  it("does not turn an earlier decline or dismissal into consent if the visitor clicks yes afterwards", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "declined", OUTSIDE_EU);
    expect(await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU)).toBe("declined");
    expect(leads()).toHaveLength(0);
    expect(records()).toHaveLength(0);
  });

  it("does not remove consent an existing contact gave elsewhere when they decline here", async () => {
    const f = await fx();
    db.tables.leads.push({ id: "L", first_name: "Ada", email: "ada@example.test", country: null, ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2031-01-01T00:00:00.000Z", ongoing_content_opt_out_at: null, suppressed_at: null, consent_requested_at: null, created_at: "2031-01-01T00:00:00.000Z" });
    const b = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(b.reference, "declined", OUTSIDE_EU);
    expect(leads()[0].ongoing_content_opt_in).toBe(true);
    expect(records()).toHaveLength(0);
  });
});

describe("the invitation is only valid for a fully confirmed booking", () => {
  it("refuses a yes before the Zoom details are ready, for a canceled booking and for an unknown reference, recording nothing", async () => {
    const f = await fx();
    const { booking } = await f.svc.createBooking({ slug: "talk-community", startUtc: `${DAY}T15:00:00Z`, guestName: "Early", guestEmail: "early@example.test", guestTimeZone: "UTC", idempotencyKey: "community-early-123" });
    await expect(f.svc.recordCommunity(booking.reference, "joined", OUTSIDE_EU)).rejects.toMatchObject({ status: 409 });   // not ready: still preparing
    const b = await f.book("Late", "late@example.test");
    await f.svc.cancelBooking(b.id);
    await expect(f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU)).rejects.toMatchObject({ status: 409 });
    await expect(f.svc.recordCommunity("no-such-reference", "joined", OUTSIDE_EU)).rejects.toMatchObject({ status: 404 });
    expect(leads()).toHaveLength(0);
    expect(records()).toHaveLength(0);
  });
});

describe("when the Leads records cannot be written", () => {
  it("tells the visitor to try again, records no answer on the booking, leaves the booking intact, and a retry then succeeds", async () => {
    const f = await fx(); const b = await f.book();
    db.failNextInsertInto = "leads";
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU)).rejects.toThrow();
    expect((await f.svc.repo.getBooking(b.id))!.community.state).not.toBe("joined");
    expect((await f.svc.repo.getBooking(b.id))!.status).toBe("confirmed");
    expect(leads()).toHaveLength(0);
    expect(await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU)).toBe("joined");
    expect(leads()).toHaveLength(1);
  });
});

describe("withdrawing consent later", () => {
  it("the shared unsubscribe records the withdrawal, keeps the original consent as history, and the Leads report shows it", async () => {
    const f = await fx(); const b = await f.book();
    await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU);
    const id = leads()[0].id;
    expect(await applyOptOut(id, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" })).toBe("updated");
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect(leads()[0].ongoing_content_opt_out_at).toBeTruthy();
    expect(records().map((r) => r.action).sort()).toEqual(["opt_in", "opt_out"]);           // the "yes" is history; the withdrawal is its own record
    const [row] = await listUnifiedLeadsAdmin();
    expect(row.subscription_status).toBe("unsubscribed");
    expect(row.shortlisted).toBe(false);
    expect(await applyOptOut(id, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" })).toBe("already_opted_out");
  });

  it("a later 'yes' from a second booking after withdrawal does NOT re-subscribe: it becomes a request for them to confirm", async () => {
    const f = await fx();
    const a = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(a.reference, "joined", OUTSIDE_EU);
    await applyOptOut(leads()[0].id, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" });
    const again = await f.book("Ada", "ada@example.test");
    await f.svc.recordCommunity(again.reference, "joined", OUTSIDE_EU);
    expect(leads()[0].ongoing_content_opt_in).toBe(false);
    expect(consentStatusOf(leads()[0])).toBe("pending");
  });
});

describe("the community route passes where the visitor is, and only a yes reaches consent", () => {
  it("reads the country, region, address and browser from the request", async () => {
    const f = await fx(); instance.svc = f.svc;
    const b = await f.book();
    const { POST } = await import("@/app/api/scheduling/community/route");
    const call = (action: string, headers: Record<string, string> = {}) => POST(new Request("http://localhost/api/scheduling/community", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", "user-agent": "route-test", ...headers }, body: JSON.stringify({ reference: b.reference, action }) }), {});
    expect((await call("shown")).status).toBe(200);
    expect((await call("joined", { "x-vercel-ip-country": "DE" })).status).toBe(200);
    expect(consentStatusOf(leads()[0])).toBe("pending");                                    // Germany: the site's rule asks for proof
    expect(records()[0].ip_hash).toBe(hashEvidence("203.0.113.7"));
    expect(records()[0].user_agent_hash).toBe(hashEvidence("route-test"));
  });
});

describe("without the Leads connection (the local prototype)", () => {
  it("still records the answer on the booking, and writes nothing to the Leads", async () => {
    const f = await fx(false); const b = await f.book();
    expect(await f.svc.recordCommunity(b.reference, "joined", OUTSIDE_EU)).toBe("joined");
    expect(leads()).toHaveLength(0);
  });
});
