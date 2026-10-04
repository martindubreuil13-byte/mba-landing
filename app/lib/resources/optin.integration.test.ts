/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));

const sent: Array<Record<string, any>> = [];
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: async (m: Record<string, any>) => { sent.push(m); return { data: { id: "email_1" }, error: null }; } } }) }));

process.env.EVIDENCE_HASH_SECRET = "test-secret";
process.env.RESEND_API_KEY = "test-key";
process.env.NAPKIN_UNSUBSCRIBE_SECRET = "unsub-secret";

import { POST } from "@/app/api/resources/request/route";
import { leadsToCsv, listUnifiedLeadsAdmin } from "@/app/lib/leads/admin-queries";
import { consentStatusOf, applyOptOut } from "@/app/lib/leads/consent";
import { OPTIN_VERSION } from "@/app/lib/resources/optin";

const SECOND_ACT = { id: "11111111-1111-1111-1111-111111111111", slug: "the-second-act", title: "The Second Act", resource_type: "Guide" };
const CHECKLIST = { id: "22222222-2222-2222-2222-222222222222", slug: "the-launch-checklist", title: "The Launch Checklist", resource_type: "Checklist" };

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/resources/request", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9", "user-agent": "vitest" },
      body: JSON.stringify({ website: "", source: "linkedin.com", medium: "referral", referrer: "https://www.linkedin.com/", utm: { source: "li", campaign: "launch" }, ...body }),
    })
  );
}

const lead = (email: string) => db.tables.leads.find((l) => l.email === email);
const optInRecords = (leadId: string) => db.tables.consent_records.filter((c) => c.lead_id === leadId && c.action === "opt_in");

beforeEach(() => {
  for (const key of Object.keys(db.tables)) db.tables[key] = [];
  db.insertCount = {};
  db.failNextInsertInto = null;
  sent.length = 0;
  for (const r of [SECOND_ACT, CHECKLIST]) {
    db.tables.resources.push({ ...r, short_description: "", published: true, archived: false, file_path: "x.pdf", file_name: "x.pdf" });
  }
});

describe("Test 1: new lead, GET THE GUIDE + KEEP ME ON THE SHORTLIST", () => {
  it("unlocks the resource and records consent with its evidence", async () => {
    const res = await post({ firstName: "Ana", email: "Ana@Example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.downloadUrl).toContain("/api/resources/download?token=");
    expect(json.onShortlist).toBe(true);

    const l = lead("ana@example.com")!;
    expect(l.first_name).toBe("Ana");
    expect(l.ongoing_content_opt_in).toBe(true);
    expect(l.ongoing_content_opt_in_at).toBeTruthy();

    const records = optInRecords(l.id);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      wording_version: OPTIN_VERSION,
      method: "button_disclosure",
      source_type: "resource",
      source_resource_id: SECOND_ACT.id,
      cta_location: "resource_form",
    });
    expect(records[0].wording_text).toContain("Get the guide and join my shortlist");
    expect(records[0].source_url).toContain("/resources/the-second-act");
    expect(records[0].ip_hash).toBeTruthy();
    expect(records[0].ip_hash).not.toContain("203.0.113.9");

    const req = db.tables.resource_requests[0];
    expect(req).toMatchObject({ lead_id: l.id, resource_id: SECOND_ACT.id, opted_in_this_request: true, source: "linkedin.com", medium: "referral", referrer: "https://www.linkedin.com/", utm_source: "li", utm_campaign: "launch" });
    expect(json.downloadUrl).toContain(req.id);
  });
});

describe("Test 2: new lead, JUST SEND ME THE GUIDE", () => {
  it("unlocks identically but records no marketing consent", async () => {
    const res = await post({ firstName: "Ben", email: "ben@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.downloadUrl).toContain("/api/resources/download?token=");
    expect(json.onShortlist).toBe(false);

    const l = lead("ben@example.com")!;
    expect(l.first_name).toBe("Ben");
    expect(l.ongoing_content_opt_in).toBe(false);
    expect(l.ongoing_content_opt_in_at).toBeNull();
    expect(db.tables.consent_records).toHaveLength(0);
    expect(db.tables.resource_requests[0]).toMatchObject({ opted_in_this_request: false, resource_id: SECOND_ACT.id, source: "linkedin.com" });
    expect(consentStatusOf(l as any)).not.toBe("opted_in");
  });
});

describe("Tests 3 & 4: validation blocks the submission and creates nothing", () => {
  it("missing first name", async () => {
    const res = await post({ firstName: "", email: "x@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.fieldErrors.firstName).toBe("Please enter your first name.");
    expect(db.tables.leads).toHaveLength(0);
    expect(db.tables.resource_requests).toHaveLength(0);
    expect(db.tables.consent_records).toHaveLength(0);
  });
  it("whitespace-only first name", async () => {
    const res = await post({ firstName: "   ", email: "x@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    expect(res.status).toBe(400);
    expect(db.tables.leads).toHaveLength(0);
  });
  it("invalid email", async () => {
    const res = await post({ firstName: "Ana", email: "not-an-email", resourceSlug: "the-second-act", marketingChoice: "join" });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.fieldErrors.email).toBe("Please enter a valid email address.");
    expect(db.tables.leads).toHaveLength(0);
    expect(db.tables.resource_requests).toHaveLength(0);
  });
  it("no explicit choice at all", async () => {
    const res = await post({ firstName: "Ana", email: "a@example.com", resourceSlug: "the-second-act" });
    expect(res.status).toBe(400);
    expect(db.tables.leads).toHaveLength(0);
  });
});

describe("Test 5: existing non-opted-in lead now opts in", () => {
  it("updates the same lead (no duplicate) and records new consent evidence", async () => {
    await post({ firstName: "Cam", email: "cam@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    expect(lead("cam@example.com")!.ongoing_content_opt_in).toBe(false);

    const res = await post({ firstName: "Cam", email: "CAM@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "join" });
    expect(res.status).toBe(200);
    expect(db.tables.leads.filter((l) => l.email === "cam@example.com")).toHaveLength(1);
    const l = lead("cam@example.com")!;
    expect(l.ongoing_content_opt_in).toBe(true);
    expect(l.ongoing_content_opt_in_at).toBeTruthy();
    const records = optInRecords(l.id);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ wording_version: OPTIN_VERSION, source_resource_id: CHECKLIST.id });
    expect(records[0].wording_text).toContain("Get the checklist and join my shortlist");
    expect(db.tables.resource_requests).toHaveLength(2);
  });
});

describe("Test 6: existing opted-in lead downloads resource only", () => {
  it("delivers the resource, keeps the subscription and the original evidence, records the download", async () => {
    await post({ firstName: "Dee", email: "dee@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    const before = { ...lead("dee@example.com")! };
    const recordsBefore = optInRecords(before.id).map((r) => ({ ...r }));

    const res = await post({ firstName: "Dee", email: "dee@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "resource_only" });
    expect(res.status).toBe(200);
    expect((await res.json()).downloadUrl).toContain("/api/resources/download?token=");

    const after = lead("dee@example.com")!;
    expect(after.ongoing_content_opt_in).toBe(true);
    expect(after.ongoing_content_opt_in_at).toBe(before.ongoing_content_opt_in_at);
    expect(after.ongoing_content_opt_out_at).toBeNull();
    expect(optInRecords(after.id)).toEqual(recordsBefore);
    expect(db.tables.consent_records.filter((c) => c.action === "opt_out")).toHaveLength(0);
    expect(db.tables.resource_requests).toHaveLength(2);
    expect(db.tables.resource_requests[1]).toMatchObject({ resource_id: CHECKLIST.id, opted_in_this_request: false });
  });

  it("choosing 'join' again does not rewrite the original consent either", async () => {
    await post({ firstName: "Eli", email: "eli@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    const first = { ...lead("eli@example.com")! };
    await post({ firstName: "Eli", email: "eli@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "join" });
    expect(lead("eli@example.com")!.ongoing_content_opt_in_at).toBe(first.ongoing_content_opt_in_at);
    expect(optInRecords(first.id)).toHaveLength(1);
  });
});

describe("Consent safety rules", () => {
  it("never reactivates a suppressed lead, but still delivers the resource", async () => {
    await post({ firstName: "Fay", email: "fay@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    const l = lead("fay@example.com")!;
    l.suppressed_at = new Date().toISOString();
    const res = await post({ firstName: "Fay", email: "fay@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    expect(res.status).toBe(200);
    expect(lead("fay@example.com")!.ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
    expect(db.tables.resource_requests[1].opted_in_this_request).toBe(false);
  });

  it("a previously unsubscribed lead is NOT re-subscribed by either button, and still gets the resource", async () => {
    await post({ firstName: "Gus", email: "gus@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    const id = lead("gus@example.com")!.id;
    await applyOptOut(id, { method: "unsubscribe_link", wordingVersion: "test" });
    const afterOptOut = { ...lead("gus@example.com")! };
    expect(afterOptOut.ongoing_content_opt_in).toBe(false);
    const recordsBefore = db.tables.consent_records.map((r) => ({ ...r }));

    for (const choice of ["resource_only", "join"] as const) {
      const res = await post({ firstName: "Gus", email: "gus@example.com", resourceSlug: "the-launch-checklist", marketingChoice: choice });
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.downloadUrl).toContain("/api/resources/download?token=");
      expect(json.onShortlist).toBe(false);
    }
    const after = lead("gus@example.com")!;
    expect(after.ongoing_content_opt_in).toBe(false);
    expect(after.ongoing_content_opt_in_at).toBe(afterOptOut.ongoing_content_opt_in_at);
    expect(after.ongoing_content_opt_out_at).toBe(afterOptOut.ongoing_content_opt_out_at);
    expect(db.tables.consent_records).toEqual(recordsBefore); // no new consent record of any kind
    expect(db.tables.resource_requests.slice(-2).every((r) => r.opted_in_this_request === false)).toBe(true);
    expect(consentStatusOf(after as any)).toBe("opted_out");
  });

  it("a legacy lead who was opted in but is no longer (no opt-out stamp) is also protected", async () => {
    db.tables.leads.push({ id: "99999999-9999-9999-9999-999999999999", first_name: "Old", email: "old@example.com", country: null, ongoing_content_opt_in: false, ongoing_content_opt_in_at: "2025-01-01T00:00:00Z", ongoing_content_opt_out_at: null, suppressed_at: null, consent_requested_at: null, created_at: "2025-01-01T00:00:00Z" });
    const res = await post({ firstName: "Old", email: "old@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    expect(res.status).toBe(200);
    expect(lead("old@example.com")!.ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
  });

  it("never leaves consent without evidence: if the record cannot be written the flag is undone and the request fails", async () => {
    db.failNextInsertInto = "consent_records";
    const res = await post({ firstName: "Hal", email: "hal@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    expect(res.status).toBe(500);
    expect(lead("hal@example.com")!.ongoing_content_opt_in).toBe(false);
    expect(db.tables.resource_requests).toHaveLength(0);
  });

  it("a page opened before the release (old checkbox boolean) still works and is recorded as legacy checkbox consent", async () => {
    await post({ firstName: "Ida", email: "ida@example.com", resourceSlug: "the-second-act", ongoingContentOptIn: true });
    const l = lead("ida@example.com")!;
    expect(l.ongoing_content_opt_in).toBe(true);
    expect(optInRecords(l.id)[0]).toMatchObject({ wording_version: "resource_checkbox_legacy", method: "checkbox" });
    await post({ firstName: "Jo", email: "jo@example.com", resourceSlug: "the-second-act", ongoingContentOptIn: false });
    expect(lead("jo@example.com")!.ongoing_content_opt_in).toBe(false);
  });

  it("the honeypot creates nothing", async () => {
    const res = await post({ website: "http://spam", firstName: "Bot", email: "bot@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    expect(res.status).toBe(200);
    expect(db.tables.leads).toHaveLength(0);
  });

  it("an unpublished or unknown resource is refused and creates nothing", async () => {
    const res = await post({ firstName: "Ana", email: "a@example.com", resourceSlug: "nope", marketingChoice: "join" });
    expect(res.status).toBe(404);
    expect(db.tables.leads).toHaveLength(0);
  });
});

describe("Test 7: admin and CSV", () => {
  it("shows first name, email and consent state with its metadata, one row per lead", async () => {
    await post({ firstName: "Kim", email: "kim@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    await post({ firstName: "Lee", email: "lee@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    await post({ firstName: "Kim", email: "kim@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "resource_only" });

    const rows = await listUnifiedLeadsAdmin();
    expect(rows).toHaveLength(2);
    const kim = rows.find((r) => r.email === "kim@example.com")!;
    const lee = rows.find((r) => r.email === "lee@example.com")!;
    expect(kim).toMatchObject({ first_name: "Kim", shortlisted: true, subscription_status: "subscribed", consent_version: OPTIN_VERSION, consent_source: "resource: the-second-act", resource_count: 2 });
    expect(kim.consent_at).toBeTruthy();
    expect(lee).toMatchObject({ first_name: "Lee", shortlisted: false, subscription_status: "never_subscribed", consent_version: "", consent_source: "", resource_count: 1 });

    const csv = leadsToCsv(rows);
    const [header, ...lines] = csv.split("\r\n");
    expect(header).toBe("first_name,email,country,acquired_through,shortlisted,subscription_status,consent_at,consent_source,consent_version,first_acquired_at,last_interaction_at,resources_consumed,napkin_completions,reality_check_completions,pick_my_brain_questions");
    expect(lines).toHaveLength(2);
    const kimLine = lines.find((l) => l.startsWith("Kim,"))!;
    expect(kimLine).toContain("kim@example.com");
    expect(kimLine).toContain(",true,subscribed,");
    expect(kimLine).toContain("resource: the-second-act");
    expect(kimLine).toContain(OPTIN_VERSION);
    expect(kimLine).toContain("The Second Act; The Launch Checklist");
    const leeLine = lines.find((l) => l.startsWith("Lee,"))!;
    expect(leeLine).toContain(",false,never_subscribed,,,,");
  });
});

describe("Test 8: another resource uses the same shared mechanism", () => {
  it("a Checklist gets checklist wording and identical behaviour with no page-specific code", async () => {
    const res = await post({ firstName: "Max", email: "max@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "join" });
    expect(res.status).toBe(200);
    const l = lead("max@example.com")!;
    expect(l.ongoing_content_opt_in).toBe(true);
    const record = optInRecords(l.id)[0];
    expect(record.wording_text).toContain("GET THE CHECKLIST + KEEP ME ON THE SHORTLIST");
    expect(record.source_resource_id).toBe(CHECKLIST.id);

    const only = await post({ firstName: "Nia", email: "nia@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "resource_only" });
    expect(only.status).toBe(200);
    expect(lead("nia@example.com")!.ongoing_content_opt_in).toBe(false);
  });
});

describe("Delivery email (shared branded template)", () => {
  it("is sent to a resource-only recipient with the branded template, the exact download link, and no consent change", async () => {
    const res = await post({ firstName: "Pat", email: "pat@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    const json = await res.json();
    expect(sent).toHaveLength(1);
    const mail = sent[0];
    expect(mail.to).toBe("pat@example.com");
    expect(mail.subject).toBe("Your guide: The Second Act");
    expect(mail.html).toContain("Hi Pat,");
    expect(mail.html).toContain("Your guide is ready.");
    expect(mail.html).toContain("DOWNLOAD THE GUIDE");
    expect(mail.html).toContain(`href="${json.downloadUrl}"`);
    expect(mail.text).toContain(json.downloadUrl);
    expect(mail.html).not.toMatch(/unsubscribe/i);
    expect(mail.headers).toBeUndefined();
    expect(lead("pat@example.com")!.ongoing_content_opt_in).toBe(false);
    expect(db.tables.consent_records).toHaveLength(0);
  });

  it("is sent to an opted-in recipient, with an unsubscribe link, and without adding anything", async () => {
    const res = await post({ firstName: "Quinn", email: "quinn@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "join" });
    const json = await res.json();
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toBe("Your checklist: The Launch Checklist");
    expect(sent[0].html).toContain("DOWNLOAD THE CHECKLIST");
    expect(sent[0].html).toContain(`href="${json.downloadUrl}"`);
    expect(sent[0].html).toMatch(/\/unsubscribe\?token=/);
    expect(sent[0].headers["List-Unsubscribe"]).toContain("/api/unsubscribe?token=");
    expect(optInRecords(lead("quinn@example.com")!.id)).toHaveLength(1);
  });

  it("an existing subscriber who takes resource-only still gets the email, with an unsubscribe link, and keeps their subscription", async () => {
    await post({ firstName: "Rae", email: "rae@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    sent.length = 0;
    await post({ firstName: "Rae", email: "rae@example.com", resourceSlug: "the-launch-checklist", marketingChoice: "resource_only" });
    expect(sent).toHaveLength(1);
    expect(sent[0].html).toMatch(/\/unsubscribe\?token=/);
    expect(lead("rae@example.com")!.ongoing_content_opt_in).toBe(true);
    expect(optInRecords(lead("rae@example.com")!.id)).toHaveLength(1);
  });

  it("an unsubscribed lead gets the resource email with no unsubscribe link and stays unsubscribed", async () => {
    await post({ firstName: "Sol", email: "sol@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    await applyOptOut(lead("sol@example.com")!.id, { method: "unsubscribe_link", wordingVersion: "test" });
    sent.length = 0;
    await post({ firstName: "Sol", email: "sol@example.com", resourceSlug: "the-second-act", marketingChoice: "join" });
    expect(sent).toHaveLength(1);
    expect(sent[0].html).not.toMatch(/unsubscribe/i);
    expect(lead("sol@example.com")!.ongoing_content_opt_in).toBe(false);
  });

  it("a failing email provider never blocks delivery on screen", async () => {
    const original = sent.push.bind(sent);
    sent.push = () => { throw new Error("provider down"); };
    const res = await post({ firstName: "Tim", email: "tim@example.com", resourceSlug: "the-second-act", marketingChoice: "resource_only" });
    sent.push = original;
    expect(res.status).toBe(200);
    expect((await res.json()).downloadUrl).toContain("/api/resources/download?token=");
  });
});
