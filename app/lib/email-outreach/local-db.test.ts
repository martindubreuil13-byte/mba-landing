/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 40_000, hookTimeout: 40_000 });
import { localDbClient, localDbReady, type LocalDb } from "@/app/lib/scheduling/testing/local-db";

/**
 * Individual outreach on REAL Postgres through REAL PostgREST: the LOCAL Supabase stack only. It is skipped unless that stack is running, has every migration
 * applied (`supabase db reset`, local), and this migration is among them. localDbReady refuses anything that is not a loopback address, so this can never
 * touch a hosted or production database. No email is ever sent: Resend is not called and the send route is not used.
 *
 * What it proves that mocks cannot: the SQL constraints and functions as PostgREST exposes them, the embedded selects the code uses, and, above all, that the
 * "one send per draft" rule holds when requests really arrive at the same moment.
 *
 * Every row it makes carries a run marker. Drafts and contacts are removed afterwards; email_campaigns and email_campaign_deliveries have no DELETE grant
 * for the service role by design, so a few marked rows remain. The local database is disposable (`supabase db reset`).
 */
const local = await localDbReady();
const holder = vi.hoisted(() => ({ client: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => holder.client }));
const ADMIN = "11111111-1111-4111-8111-111111111111";
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: async () => ({ id: ADMIN }) }));
vi.mock("@/app/lib/resources/delivery-email", () => ({ DEFAULT_RESOURCE_FROM: "MBA <local@example.test>" }));

async function migrationApplied(env: LocalDb | null) {
  if (!env) return false;
  try {
    const r = await fetch(`${env.url}/rest/v1/email_outreach_drafts?select=id&limit=1`, { headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` }, signal: AbortSignal.timeout(4000) });
    return r.ok;
  } catch { return false; }
}
const ready = local && (await migrationApplied(local)) ? local : null;

const RUN = `out${Date.now().toString(36)}`;
const email = (n: string) => `${RUN}-${n}@example.test`;
const evidence = { basis: "express_permission", reason: "Asked me to write after the talk", evidence: "Email thread dated 2026-11-12 saved in the inbox" };

(ready ? describe : describe.skip)("individual outreach on local Postgres", () => {
  let db: any;
  let store: typeof import("./server");
  let route: typeof import("@/app/api/admin/email/outreach/route");

  beforeAll(async () => {
    holder.client = db = await localDbClient(ready!);
    store = await import("./server");
    route = await import("@/app/api/admin/email/outreach/route");
  });
  afterAll(async () => {
    if (!db) return;
    await db.from("email_outreach_drafts").delete().like("recipient_email", `${RUN}-%`);
    await db.from("leads").delete().like("email", `${RUN}-%`);
  });

  const person = (n: string) => ({ id: "22222222-2222-4222-8222-000000000001", email: email(n) });
  const campaign = async (n: string, over: Record<string, unknown> = {}) => {
    const { data, error } = await db.from("email_campaigns").insert({
      subject: `S ${RUN}`, preview_text: "", body_html: "<p>x</p>", body_text: "x", selected_count: 1, exclusions: {}, recipients: [person(n)], ...over,
    }).select("id,kind").single();
    if (error) throw error;
    return data as { id: string; kind: string };
  };
  /** `acknowledge` is the "I reviewed the documented basis" tick, required for any campaign that carries a documented exception. */
  const claim = async (id: string, acknowledge = false) => (await db.rpc("claim_email_campaign_batch", { campaign_id: id, requested_offset: 0, admin_id: ADMIN, acknowledge_exceptions: acknowledge })).data;
  const draft = async (n: string, over: Record<string, unknown> = {}) => {
    const { data, error } = await db.from("email_outreach_drafts").insert({ recipient_email: email(n), subject: "Hello", editor_operations: [{ insert: "Hi\n" }], ...over }).select("id").single();
    if (error) throw error;
    return data.id as string;
  };
  const post = (value: unknown) => route.POST(new Request("http://localhost:3000/api/admin/email/outreach", {
    method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3000", host: "localhost:3000" }, body: JSON.stringify(value),
  }));

  it("the database requires an individual email to have exactly one recipient", async () => {
    const two = await db.from("email_campaigns").insert({
      subject: "S", preview_text: "", body_html: "x", body_text: "x", selected_count: 2, exclusions: {}, kind: "outreach", recipients: [person("a"), person("b")],
    });
    expect(two.error?.code).toBe("23514");
    expect(two.error?.message).toMatch(/outreach_single_recipient/);
    const unknownKind = await db.from("email_campaigns").insert({ subject: "S", preview_text: "", body_html: "x", body_text: "x", selected_count: 1, exclusions: {}, kind: "other", recipients: [person("a")] });
    expect(unknownKind.error?.code).toBe("23514");
  });

  it("newsletters are unchanged: default kind, many recipients, claimed in batches of 25", async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: "33333333-3333-4333-8333-000000000001", email: email(`n${i}`) }));
    const news = await campaign("news", { selected_count: 60, recipients: many });
    expect(news.kind).toBe("newsletter");
    const batch = await claim(news.id);
    expect(batch.recipients).toHaveLength(25);
  });

  it("of many simultaneous claims on one individual email exactly one wins", async () => {
    const one = await campaign("claim", { kind: "outreach" });
    const results = await Promise.all(Array.from({ length: 12 }, () => claim(one.id)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("two reviews of one draft: they can never both be sent, even when a send and a re-review race", async () => {
    for (let round = 0; round < 8; round++) {
      const id = await draft(`race${round}`);
      const a = await campaign(`race${round}`, { kind: "outreach" });
      const b = await campaign(`race${round}`, { kind: "outreach" });
      expect((await db.rpc("attach_outreach_review", { draft_id: id, review_campaign: a.id })).data).toBe(true);
      // Tab 1 sends review A at the very moment tab 2 re-reviews the draft (review B).
      const [sentA, attachedB] = await Promise.all([claim(a.id), db.rpc("attach_outreach_review", { draft_id: id, review_campaign: b.id })]);
      const bAttached = attachedB.data === true;
      expect(Boolean(sentA) && bAttached, `round ${round}: A sent and B attached`).toBe(false);
      const sentB = await claim(b.id);
      expect(Boolean(sentA) && Boolean(sentB), `round ${round}: both sent`).toBe(false);
      // Exactly one of them could be sent: A won (B refused), or B won (A voided).
      expect(Boolean(sentA) !== Boolean(sentB), `round ${round}: neither or both`).toBe(true);
    }
  });

  it("a draft whose review was claimed is finished: no new review can attach, and the new one is voided", async () => {
    const id = await draft("finished");
    const a = await campaign("finished", { kind: "outreach" });
    await db.rpc("attach_outreach_review", { draft_id: id, review_campaign: a.id });
    expect(await claim(a.id)).toBeTruthy();
    const c = await campaign("finished", { kind: "outreach" });
    expect((await db.rpc("attach_outreach_review", { draft_id: id, review_campaign: c.id })).data).toBe(false);
    expect(await claim(c.id)).toBeNull();
    const row = await store.getDraft(id);
    expect(row?.sentAt).toBeTruthy();
    expect((await store.saveDraft({ id, recipientEmail: email("finished"), recipientName: "", leadId: null, subject: "Edit", previewText: "", operations: [] }))).toEqual({ ok: false, reason: "already_sent" });
    expect((await store.listDrafts())?.some((d) => d.id === id)).toBe(false);
  });

  it("drafts: save, update, list and delete through PostgREST, including the embedded campaign lookup", async () => {
    const saved = await store.saveDraft({ recipientEmail: email("draft"), recipientName: "Pat", leadId: null, subject: "One", previewText: "", operations: [{ insert: "Text\n" }] });
    expect(saved.ok).toBe(true);
    const id = (saved as any).draft.id as string;
    expect(await store.saveDraft({ id, recipientEmail: email("draft"), recipientName: "Pat", leadId: null, subject: "Two", previewText: "", operations: [] })).toMatchObject({ ok: true, draft: { subject: "Two" } });
    expect((await store.listDrafts())?.find((d) => d.id === id)?.subject).toBe("Two");
    expect(await store.deleteDraft(id)).toBe(true);
    expect(await store.deleteDraft(id)).toBe(false);
  });

  it("contacts: an address matches an existing contact in any capitalisation; a new one is created unsubscribed with no consent record; simultaneous requests give one", async () => {
    const [x, y, z] = await Promise.all([store.findOrCreateContact(email("Contact").toUpperCase(), "Ada Lovelace"), store.findOrCreateContact(email("contact"), "B"), store.findOrCreateContact(` ${email("contact")} `, "C")]);
    expect(new Set([x.id, y.id, z.id]).size).toBe(1);
    expect([x, y, z].filter((c) => c.created)).toHaveLength(1);
    const { data } = await db.from("leads").select("first_name,last_name,email,ongoing_content_opt_in,ongoing_content_opt_out_at,suppressed_at").eq("id", x.id).single();
    expect(data).toMatchObject({ ongoing_content_opt_in: false, ongoing_content_opt_out_at: null, suppressed_at: null });
    expect(data.email).toBe(email("contact"));
    const { count } = await db.from("consent_records").select("id", { count: "exact", head: true }).eq("lead_id", x.id);
    expect(count).toBe(0);
    // an existing contact is never renamed
    const again = await store.findOrCreateContact(email("contact"), "Someone Else");
    expect(again).toEqual({ id: x.id, created: false });
    expect((await db.from("leads").select("first_name").eq("id", x.id).single()).data.first_name).not.toBe("Someone");
  });

  it("contacts: characters that mean something in a search pattern (_ % * +) are matched exactly, never loosely, so the wrong person is never found", async () => {
    // Each address gets a "twin" that a loose pattern match would wrongly return.
    const cases = [
      { address: email("john_doe"), twin: email("johnxdoe") },   // _ is "any one character" in a pattern
      { address: email("a*b"), twin: email("axxb") },            // * is a wildcard in PostgREST patterns
      { address: email("pc%t"), twin: email("pcAAt") },          // % is "anything" in a pattern
      { address: email("tag+one"), twin: email("tag+two") },
    ];
    for (const { address, twin } of cases) {
      const other = await store.findOrCreateContact(twin, "");
      expect(other.created, `${twin} is created`).toBe(true);
      const first = await store.findOrCreateContact(address, "");
      expect(first.created, `${address} must be created, not matched to ${twin}`).toBe(true);
      expect(first.id).not.toBe(other.id);
      const again = await store.findOrCreateContact(address.toUpperCase(), "");
      expect(again, `${address} is found again in any capitalisation`).toEqual({ id: first.id, created: false });
    }
  });

  it("contacts: an older row stored with other capitalisation and stray spaces is found (the database treats it as the same address), not duplicated", async () => {
    const stored = `  ${email("Old.Mixed").toUpperCase()}  `;
    const { data, error } = await db.from("leads").insert({ first_name: "Old", email: stored, ongoing_content_opt_in: false }).select("id").single();
    expect(error).toBeNull();
    const found = await store.findOrCreateContact(email("old.mixed"), "Someone Else");
    expect(found).toEqual({ id: data.id, created: false });
    // and the database would indeed have refused a second copy
    const duplicate = await db.from("leads").insert({ first_name: "Dup", email: email("old.mixed"), ongoing_content_opt_in: false });
    expect(duplicate.error?.code).toBe("23505");
  });

  it("recent sends: only individual emails to that address in the last 30 days count", async () => {
    const mine = await campaign("recent", { kind: "outreach" });
    const news = await campaign("recent", { kind: "newsletter" });
    const old = await campaign("recent", { kind: "outreach" });
    // Every row names the same columns: a bulk insert through PostgREST turns a column missing from some rows into an explicit null.
    const now = new Date().toISOString();
    const rows = [
      { campaign_id: mine.id, lead_id: person("recent").id, email: email("recent"), status: "sent", updated_at: now },
      { campaign_id: news.id, lead_id: person("recent").id, email: email("recent"), status: "sent", updated_at: now },
      { campaign_id: old.id, lead_id: person("recent").id, email: email("recent"), status: "sent", updated_at: new Date(Date.now() - 45 * 86_400_000).toISOString() },
    ];
    expect((await db.from("email_campaign_deliveries").insert(rows)).error).toBeNull();
    const found = await store.recentOutreach(email("recent"));
    expect(found).toHaveLength(1);
    expect(found[0].subject).toBe(`S ${RUN}`);
    expect(await store.recentOutreach(email("nobody"))).toEqual([]);
    expect(await store.deliveryResult(mine.id)).toEqual({ status: "sent", reason: null, providerAccepted: false });
    expect(await store.deliveryResult(old.id)).toMatchObject({ status: "sent" });
  });

  it("the review route end to end on real data: evidence for a new address, the one-recipient campaign, and a hard block for an unsubscribed contact", async () => {
    const address = email("review");
    const saved = (await store.saveDraft({ recipientEmail: address, recipientName: "Pat Smith", leadId: null, subject: "A quick hello", previewText: "", operations: [{ insert: "Hi Pat, I enjoyed your talk.\n" }] })) as any;
    const draftId = saved.draft.id as string;

    const first = await (await post({ op: "review", draftId })).json();
    expect(first).toMatchObject({ status: "needs_exception", campaignId: null, contact: { email: address, state: "Unknown", created: true } });
    const { data: lead } = await db.from("leads").select("id,ongoing_content_opt_in,first_name,last_name").eq("email", address).single();
    expect(lead).toMatchObject({ ongoing_content_opt_in: false, first_name: "Pat", last_name: "Smith" });

    const ready1 = await (await post({ op: "review", draftId, exception: evidence })).json();
    expect(ready1).toMatchObject({ status: "ready", exceptionCount: 1, contact: { created: false } });
    const { data: made } = await db.from("email_campaigns").select("kind,selected_count,recipients").eq("id", ready1.campaignId).single();
    expect(made).toMatchObject({ kind: "outreach", selected_count: 1 });
    expect(made.recipients).toHaveLength(1);
    expect(made.recipients[0]).toMatchObject({ id: lead.id, email: address, exception: { basis: "express_permission", adminId: ADMIN } });
    expect((await store.getDraft(draftId))?.campaignId).toBe(ready1.campaignId);

    // A second review voids the first: only the newest can be sent.
    const ready2 = await (await post({ op: "review", draftId, exception: evidence })).json();
    expect(ready2.campaignId).not.toBe(ready1.campaignId);
    expect(await claim(ready1.campaignId, true)).toBeNull();
    expect(await claim(ready2.campaignId, true)).toBeTruthy();
    expect((await post({ op: "review", draftId })).status).toBe(409);

    // An unsubscribed contact is blocked even with evidence.
    const blockedDraft = ((await store.saveDraft({ recipientEmail: address, recipientName: "", leadId: null, subject: "Again", previewText: "", operations: [{ insert: "Hello\n" }] })) as any).draft.id as string;
    await db.from("leads").update({ ongoing_content_opt_out_at: new Date().toISOString() }).eq("id", lead.id);
    const blocked = await (await post({ op: "review", draftId: blockedDraft, exception: evidence })).json();
    expect(blocked).toMatchObject({ status: "blocked", reason: "Unsubscribed", campaignId: null });
  });

  it("history on the real database: the newsletter queries still run, and individual sends are labelled", async () => {
    const { campaignHistory, outreachRecipients } = await import("@/app/lib/email-studio/campaign-history");
    const history = await campaignHistory();
    expect(history).not.toBeNull();
    expect(history!.length).toBeGreaterThan(0);
    const started = (await db.from("email_campaigns").select("id,kind").eq("kind", "outreach").not("started_at", "is", null).limit(5)).data as { id: string }[];
    const labels = await outreachRecipients(started.map((row) => row.id));
    expect(labels.size).toBe(started.length);
  });
});
