/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => true, getClientIp: () => "203.0.113.7" }));

const sent: Array<Record<string, any>> = [];
const state = vi.hoisted(() => ({ refuse: false }));
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>) => { if (state.refuse) return { data: null, error: { message: "refused" } }; sent.push(m); return { data: { id: "m" + sent.length }, error: null }; } } }) }));

process.env.EVIDENCE_HASH_SECRET = "s";
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "s";
process.env.RESEND_API_KEY = "k";

import { POST as community } from "./route";
import { POST as receipt } from "../receipt/route";
import { COMMUNITY_CONSENT_VERSION } from "@/app/lib/programs/corporate-transition";

const TOKEN = "receipt-token-abcdefghijklmnop";
const APP = "aaaaaaaa-0000-0000-0000-000000000001";
const LEAD = "bbbbbbbb-0000-0000-0000-000000000001";

const choose = (choice: unknown, headers: Record<string, string> = { "x-vercel-ip-country": "US" }, token = TOKEN) =>
  community(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json", "user-agent": "ua", ...headers }, body: JSON.stringify({ token, choice }) }));
const lead = () => db.tables.leads[0];
const app = () => db.tables.program_applications[0];

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  sent.length = 0; state.refuse = false;
  db.tables.leads.push({ id: LEAD, email: "elena@example.com", first_name: "Elena", country: "Spain", ongoing_content_opt_in: false, ongoing_content_opt_in_at: null, ongoing_content_opt_out_at: null, suppressed_at: null, consent_requested_at: null });
  db.tables.program_applications.push({ id: APP, lead_id: LEAD, program_key: "corporate-transition", status: "INVITED", booking_status: "not_booked", booking_ref: "ref-0123456789abcdefghij", receipt_token: TOKEN, community_choice: null, answers: { firstName: "Elena", lastName: "T", email: "elena@example.com", country: "Spain" } });
});

describe("6. enrolment requires an explicit, affirmative click", () => {
  it("completing the application creates no consent: until a button is pressed the lead is not opted in and nothing is recorded", () => {
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
    expect(app().community_choice).toBeNull();
  });
  it("only the two defined choices are accepted; anything else changes nothing", async () => {
    for (const bad of [undefined, null, "", "yes", "JOIN", true, 1, { choice: "join" }]) {
      expect((await choose(bad)).status).toBe(400);
    }
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });
  it("an unknown, malformed or missing token is a 404 and changes nothing", async () => {
    for (const t of ["nope", "", "x".repeat(40), APP]) expect((await choose("join", undefined, t)).status).toBe(404);
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
  });
});

describe("single-step regions: 'Yes, count me in' is the consent", () => {
  it("records consent with timestamp, source, wording and version, hashed device evidence; sends no marketing confirmation email", async () => {
    const res = await choose("join");
    expect(await res.json()).toEqual({ success: true, community: "joined" });
    expect(lead()).toMatchObject({ ongoing_content_opt_in: true });
    expect(lead().ongoing_content_opt_in_at).toEqual(expect.any(String));
    expect(db.tables.consent_records).toHaveLength(1);
    const rec = db.tables.consent_records[0];
    expect(rec).toMatchObject({ lead_id: LEAD, action: "opt_in", method: "button_disclosure", wording_version: COMMUNITY_CONSENT_VERSION, source_type: "program_application", source_url: "/transition", cta_location: "application_confirmation" });
    expect(rec.wording_text).toContain("Yes, count me in");
    expect(rec.wording_text).toContain("Optional. Unsubscribe anytime. Your consultation is not affected by your choice.");
    expect(rec.ip_hash).toMatch(/^[0-9a-f]{32}$/);
    expect(rec.ip_hash).not.toContain("203");
    expect(rec.created_at).toEqual(expect.any(String));
    expect(sent).toHaveLength(0);
    expect(app()).toMatchObject({ community_choice: "joined" });
    expect(app().community_choice_at).toEqual(expect.any(String));
  });

  it("7. 'No, thanks' records only the answer: no consent, no record, no email, booking untouched", async () => {
    const res = await choose("decline");
    expect(await res.json()).toEqual({ success: true, community: "declined" });
    expect(lead()).toMatchObject({ ongoing_content_opt_in: false, consent_requested_at: null });
    expect(db.tables.consent_records).toHaveLength(0);
    expect(sent).toHaveLength(0);
    expect(app()).toMatchObject({ community_choice: "declined", status: "INVITED", booking_status: "not_booked", booking_ref: "ref-0123456789abcdefghij" });
  });

  it("repeating 'join' (double click, replay) creates no second record and sends nothing", async () => {
    await choose("join"); await choose("join"); await Promise.all([choose("join"), choose("join")]);
    expect(db.tables.consent_records).toHaveLength(1);
    expect(sent).toHaveLength(0);
  });

  it("an existing subscriber keeps their ORIGINAL consent: nothing new is recorded", async () => {
    Object.assign(lead(), { ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-01-01T00:00:00.000Z" });
    const json = await (await choose("join")).json();
    expect(json.community).toBe("joined");
    expect(lead().ongoing_content_opt_in_at).toBe("2026-01-01T00:00:00.000Z");
    expect(db.tables.consent_records).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("a suppressed address (spam complaint) is never subscribed", async () => {
    Object.assign(lead(), { suppressed_at: "2026-02-01T00:00:00.000Z" });
    const json = await (await choose("join")).json();
    expect(json.community).toBe("not_applied");
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("someone who unsubscribed earlier is NOT silently re-subscribed: they must confirm from their inbox", async () => {
    Object.assign(lead(), { ongoing_content_opt_in_at: "2026-01-01T00:00:00.000Z", ongoing_content_opt_out_at: "2026-03-01T00:00:00.000Z" });
    const json = await (await choose("join")).json();
    expect(json.community).toBe("confirmation_sent");
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records.map((r) => r.action)).toEqual(["opt_in_requested"]);
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toBe("One last step to stay connected");
  });

  it("Canada outside Quebec is single-step; Quebec is confirmed", async () => {
    expect((await (await choose("join", { "x-vercel-ip-country": "CA", "x-vercel-ip-country-region": "ON" })).json()).community).toBe("joined");
  });
});

describe("opt-in regions (EEA, UK, Switzerland, Brazil, Quebec, unknown): the click is a request the existing confirmation email completes", () => {
  it.each([
    ["Germany", { "x-vercel-ip-country": "DE" }],
    ["the UK", { "x-vercel-ip-country": "GB" }],
    ["Quebec", { "x-vercel-ip-country": "CA", "x-vercel-ip-country-region": "QC" }],
    ["an unknown location", {}],
  ])("%s", async (_n, headers) => {
    const json = await (await choose("join", headers)).json();
    expect(json.community).toBe("confirmation_sent");
    expect(lead().ongoing_content_opt_in).toBe(false); // not subscribed until the recipient confirms
    expect(db.tables.consent_records).toMatchObject([{ action: "opt_in_requested", method: "button_disclosure", wording_version: COMMUNITY_CONSENT_VERSION }]);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("elena@example.com");
    expect(sent[0].html).toContain("/confirm?token=");
    expect(sent[0].html).not.toMatch(/ticked|checkbox|review of your application/);
  });

  it("repeating the choice sends no second confirmation email", async () => {
    await choose("join", { "x-vercel-ip-country": "DE" });
    await choose("join", { "x-vercel-ip-country": "DE" });
    expect(sent).toHaveLength(1);
    expect(db.tables.consent_records).toHaveLength(1);
  });

  it("a failed confirmation email is reported truthfully and can be retried", async () => {
    state.refuse = true;
    const first = await (await choose("join", { "x-vercel-ip-country": "DE" })).json();
    expect(first.community).toBe("confirmation_failed");
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(app().community_choice).toBe("confirmation_failed");
    state.refuse = false;
    expect(sent).toHaveLength(0);
    // Retrying sends exactly one email and only then reports success. It never claims a message that was not sent.
    const again = await (await choose("join", { "x-vercel-ip-country": "DE" })).json();
    expect(again.community).toBe("confirmation_sent");
    expect(sent).toHaveLength(1);
    expect(lead().ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(1); // still one request on record
    await choose("join", { "x-vercel-ip-country": "DE" });
    expect(sent).toHaveLength(1);
  });
});

describe("8. a failure in the community choice never interferes with booking", () => {
  it("when the choice cannot be saved the response says so, and the booking details are exactly as they were", async () => {
    db.tables.leads.length = 0; // the lead cannot be loaded
    const res = await choose("join");
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/conversation is not affected/);
    expect(app()).toMatchObject({ status: "INVITED", booking_status: "not_booked", booking_ref: "ref-0123456789abcdefghij", community_choice: null });
    const r = await receipt(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ token: TOKEN }) }));
    expect(r.status).toBe(200);
    expect((await r.json()).bookingUrl).toContain("utm_content=ref-0123456789abcdefghij");
  });
  it("declining after joining does not unsubscribe anyone; that is what the unsubscribe link is for", async () => {
    await choose("join");
    const json = await (await choose("decline")).json();
    expect(json.community).toBe("joined");
    expect(lead().ongoing_content_opt_in).toBe(true);
  });
});

describe("the receipt (restoring the confirmation screen after a refresh)", () => {
  const ask = (body: unknown) => receipt(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) }));
  it("returns the booking link, the truthful email state and the community choice, and no personal data", async () => {
    db.tables.program_invitation_sends.push({ id: "s1", application_id: APP, kind: "initial", status: "accepted", provider_message_id: "m1", attempted_at: "2026-10-30T10:00:00.000Z", delivery_status: null });
    await choose("decline");
    const res = await ask({ token: TOKEN });
    const json = await res.json();
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(json).toMatchObject({ success: true, receiptToken: TOKEN, invitationEmail: "sent", community: "declined" });
    expect(json.bookingUrl).toContain("https://calendly.com/martindubreuil13/30min?");
    expect(JSON.stringify(json)).not.toMatch(/elena|example\.com|Spain|aaaaaaaa/i);
  });
  it("says 'not_sent' when no invitation was accepted", async () => {
    db.tables.program_invitation_sends.push({ id: "s1", application_id: APP, kind: "initial", status: "failed", attempted_at: "2026-10-30T10:00:00.000Z" });
    expect((await (await ask({ token: TOKEN })).json()).invitationEmail).toBe("not_sent");
  });
  it("an unknown token, a malformed body and garbage all look the same: 404", async () => {
    for (const body of [{ token: "nope" }, { token: 5 }, {}, "not json", { token: APP }]) expect((await ask(body)).status).toBe(404);
  });
});
