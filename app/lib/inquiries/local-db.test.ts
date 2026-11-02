/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });
import { localDbClient, localDbReady } from "@/app/lib/scheduling/testing/local-db";

/**
 * The inquiry store on REAL Postgres (the LOCAL Supabase stack only; skipped when it is not running): the migration's constraints, PostgREST's error
 * codes, and above all that the one-conditional-UPDATE claims really are atomic when requests arrive at the same moment.
 * Every row it makes carries a run marker and is removed afterwards.
 */
const local = await localDbReady();
const holder = vi.hoisted(() => ({ client: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => holder.client }));

const RUN = `p2a${Date.now().toString(36)}`;
const email = (n: string) => `${RUN}-${n}@example.test`;

(local ? describe : describe.skip)("program_inquiries on local Postgres", () => {
  let store: typeof import("./store");
  beforeAll(async () => { holder.client = await localDbClient(local!); store = await import("./store"); });
  afterAll(async () => {
    if (!holder.client) return;
    const { data } = await holder.client.from("leads").select("id").like("email", `${RUN}-%`);
    const ids = (data ?? []).map((l: any) => l.id);
    if (ids.length) { await holder.client.from("program_inquiries").delete().in("lead_id", ids); await holder.client.from("leads").delete().in("id", ids); }
  });

  const make = async (n: string, over: Record<string, unknown> = {}) => {
    const lead = await store.createOrTouchLead(email(n), "Real Person");
    return store.insertInquiry({ lead_id: lead.id, program_slug: null, full_name: "Real Person", situation: null, message: "words", attribution: {}, idempotency_key: `${RUN}-key-${n}`.padEnd(20, "x"), content_hash: "h", ...over } as any);
  };

  it("two simultaneous inserts of one key give one row; both callers get it", async () => {
    const lead = await store.createOrTouchLead(email("race"), "Racer");
    const input = { lead_id: lead.id, program_slug: null, full_name: "Racer", situation: null, message: "m", attribution: {}, idempotency_key: `${RUN}-race-key-0000`, content_hash: "h" };
    const rows = await Promise.all([store.insertInquiry(input), store.insertInquiry(input), store.insertInquiry(input)]);
    expect(new Set(rows.map((r) => r.id)).size).toBe(1);
    const { count } = await holder.client.from("program_inquiries").select("id", { count: "exact", head: true }).eq("lead_id", lead.id);
    expect(count).toBe(1);
  });

  it("two simultaneous lead creations for one address give one lead", async () => {
    const [a, b, c] = await Promise.all([store.createOrTouchLead(email("lead"), "A"), store.createOrTouchLead(email("lead"), "B"), store.createOrTouchLead(email("lead"), "C")]);
    expect(new Set([a.id, b.id, c.id]).size).toBe(1);
    const { data } = await holder.client.from("leads").select("first_name, ongoing_content_opt_in").eq("id", a.id).single();
    expect(data.ongoing_content_opt_in).toBe(false);
  });

  it("of many simultaneous claims on the owner notification exactly one wins", async () => {
    const row = await make("claim");
    const wins = (await Promise.all(Array.from({ length: 12 }, () => store.claimOwnerSend(row.id)))).filter(Boolean);
    expect(wins).toHaveLength(1);
    expect(wins[0]!.owner_status).toBe("sending");
    // a fresh claim is not stealable; a stale one is, with the failure count unchanged
    expect(await store.claimOwnerSend(row.id, Date.now() + 10_000)).toBeNull();
    const stale = await store.claimOwnerSend(row.id, Date.now() + 10 * 60_000);
    expect(stale?.owner_attempts).toBe(0);
  });

  it("a failed notification can be claimed again and counts the failure; an accepted one never can", async () => {
    const row = await make("fail");
    const first = await store.claimOwnerSend(row.id); await store.markOwnerFailed(row.id, first!.owner_attempts, "provider_rejected: no");
    const second = await store.claimOwnerSend(row.id);
    expect(second).toMatchObject({ owner_status: "sending", owner_attempts: 1, owner_error: "provider_rejected: no" });
    await store.markOwnerAccepted(row.id, "msg_real");
    expect(await store.claimOwnerSend(row.id, Date.now() + 3_600_000)).toBeNull();
    const again = await store.findByKey(row.idempotency_key);
    expect(again).toMatchObject({ owner_status: "accepted", owner_message_id: "msg_real", owner_error: null });
    expect(again!.owner_accepted_at).not.toBeNull();
  });

  it("the auto-reply can be claimed exactly once", async () => {
    const row = await make("reply");
    const wins = (await Promise.all(Array.from({ length: 8 }, () => store.claimAutoReply(row.id)))).filter(Boolean);
    expect(wins).toHaveLength(1);
    await store.markAutoReply(row.id, { ok: true, id: "msg_reply" });
    expect(await store.claimAutoReply(row.id)).toBe(false);
  });

  it("retention blanks only expired messages and is idempotent; erasure deletes by id and by address", async () => {
    const old = await make("old"), fresh = await make("fresh");
    await holder.client.from("program_inquiries").update({ created_at: new Date(Date.now() - 800 * 86_400_000).toISOString() }).eq("id", old.id);
    const dry = await store.purgeExpired({ dryRun: true, batch: 500 });
    expect(dry.dryRun).toBe(true); expect(dry.purged).toBe(0);
    let r = await store.purgeExpired({ batch: 500 }); expect(r.purged).toBeGreaterThanOrEqual(1);
    const { data } = await holder.client.from("program_inquiries").select("id, message, message_purged_at, situation").in("id", [old.id, fresh.id]);
    const byId = Object.fromEntries(data.map((x: any) => [x.id, x]));
    expect(byId[old.id]).toMatchObject({ message: "", situation: null }); expect(byId[old.id].message_purged_at).not.toBeNull();
    expect(byId[fresh.id]).toMatchObject({ message: "words", message_purged_at: null });
    r = await store.purgeExpired({ batch: 500 });
    expect((await store.listInquiries(500)).filter((x) => x.id === old.id)).toHaveLength(1); // still listed
    expect(await store.eraseInquiries({ id: old.id })).toEqual({ deleted: 1 });
    expect(await store.eraseInquiries({ email: email("fresh") })).toEqual({ deleted: 1 });
    expect(await store.eraseInquiries({ email: email("fresh") })).toEqual({ deleted: 0 });
  });

  it("the browser roles cannot read or write the table", async () => {
    const anon = (await import("@supabase/supabase-js")).createClient(local!.url, local!.anonKey, { auth: { persistSession: false } });
    const read = await anon.from("program_inquiries").select("id").limit(1);
    expect(read.data ?? []).toEqual([]);
    const write = await anon.from("program_inquiries").insert({ lead_id: "00000000-0000-0000-0000-000000000000", full_name: "x", booking_ref: `${RUN}-anon`.padEnd(20, "x"), idempotency_key: `${RUN}-anon`.padEnd(20, "x"), content_hash: "h" });
    expect(write.error).not.toBeNull();
  });
});
