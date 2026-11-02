/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = vi.hoisted(() => ({ current: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.current.client() }));
const admin = vi.hoisted(() => ({ user: null as any }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: async () => admin.user }));

import { eraseInquiries, listInquiries, purgeExpired } from "./store";

const NOW = Date.parse("2028-11-02T12:00:00Z");
const MONTH = 30 * 86_400_000;
let n = 0;
function seed(ageMonths: number, over: Record<string, unknown> = {}) {
  n += 1;
  const leadEmail = (over.email as string) ?? `person${n}@example.test`;
  let lead = db.current.tables.leads.find((l: any) => l.email === leadEmail);
  if (!lead) { lead = { id: `lead-${n}`, email: leadEmail, first_name: "P", created_at: new Date(NOW).toISOString() }; db.current.tables.leads.push(lead); }
  const row = { id: `inq-${n}`, lead_id: lead.id, full_name: "Person", message: "private words", situation: "Program 03", booking_ref: `ref${n}`.padEnd(24, "x"), idempotency_key: `key-${n}`.padEnd(20, "x"), content_hash: "h", created_at: new Date(NOW - ageMonths * MONTH - 3 * 86_400_000).toISOString(), owner_status: "accepted", auto_reply_status: "accepted", message_purged_at: null, program_slug: null, attribution: {}, ...over };
  delete (row as any).email;
  db.current.tables.program_inquiries.push(row);
  return row as any;
}
const rows = () => db.current.tables.program_inquiries as any[];

beforeEach(() => { db.current = new FakeDb(); admin.user = null; n = 0; });

describe("retention", () => {
  it("blanks messages older than the retention period and keeps everything that is the record of contact", async () => {
    const old = seed(25, { owner_status: "failed" }), recent = seed(3);
    const r = await purgeExpired({ now: NOW, months: 24 });
    expect(r).toEqual({ due: 1, purged: 1, dryRun: false });
    expect(old).toMatchObject({ message: "", situation: null, owner_status: "failed", full_name: "Person", lead_id: old.lead_id });
    expect(old.message_purged_at).toBe(new Date(NOW).toISOString());
    expect(recent.message).toBe("private words"); expect(recent.message_purged_at).toBeNull();
    expect(db.current.tables.leads).toHaveLength(2); // the people are untouched
  });

  it("a dry run reports and changes nothing; a second real run finds nothing left to do", async () => {
    const old = seed(30);
    expect(await purgeExpired({ now: NOW, months: 24, dryRun: true })).toEqual({ due: 1, purged: 0, dryRun: true });
    expect(old.message).toBe("private words");
    expect(await purgeExpired({ now: NOW, months: 24 })).toMatchObject({ purged: 1 });
    expect(await purgeExpired({ now: NOW, months: 24 })).toEqual({ due: 0, purged: 0, dryRun: false });
  });

  it("a shorter configured period applies to existing rows; the batch is bounded", async () => {
    seed(8); seed(9); seed(1);
    expect(await purgeExpired({ now: NOW, months: 6, batch: 1 })).toMatchObject({ due: 1, purged: 1 });
    expect(rows().filter((r) => r.message_purged_at)).toHaveLength(1);
    expect(await purgeExpired({ now: NOW, months: 6, batch: 10 })).toMatchObject({ purged: 1 });
    expect(rows().filter((r) => r.message_purged_at)).toHaveLength(2);
  });

  it("never touches the append-only consent evidence", async () => {
    db.current.tables.consent_records.push({ id: "c1", email: "x@example.test" });
    seed(40);
    await purgeExpired({ now: NOW, months: 24 });
    expect(db.current.tables.consent_records).toHaveLength(1);
  });
});

describe("erasure", () => {
  it("deletes one inquiry by id, leaving the others and the person", async () => {
    const a = seed(1), b = seed(1);
    expect(await eraseInquiries({ id: a.id })).toEqual({ deleted: 1 });
    expect(rows().map((r) => r.id)).toEqual([b.id]);
    expect(db.current.tables.leads).toHaveLength(2);
  });

  it("deletes every inquiry of an e-mail address (a data-subject request), case-insensitively, and only theirs", async () => {
    seed(1, { email: "gone@example.test" }); seed(2, { email: "gone@example.test" }); seed(1, { email: "stay@example.test" });
    expect(await eraseInquiries({ email: "  GONE@Example.test " })).toEqual({ deleted: 2 });
    expect(rows()).toHaveLength(1);
    expect(await eraseInquiries({ email: "nobody@example.test" })).toEqual({ deleted: 0 });
    expect(await eraseInquiries({ id: "missing" })).toEqual({ deleted: 0 });
  });
});

describe("the admin list", () => {
  it("lists newest first with the person's address, failed deliveries included", async () => {
    seed(5, { email: "old@example.test" }); seed(1, { email: "new@example.test", owner_status: "failed", owner_error: "provider_rejected" });
    const list = await listInquiries();
    expect(list.map((r) => r.email)).toEqual(["new@example.test", "old@example.test"]);
    expect(list[0].owner_status).toBe("failed");
  });
});

describe("the retention cron route", () => {
  const call = async (auth?: string, query = "") => { const { GET } = await import("@/app/api/cron/inquiry-retention/route"); return GET(new Request(`https://example.test/api/cron/inquiry-retention${query}`, { headers: auth ? { authorization: auth } : {} })); };
  beforeEach(() => { vi.stubEnv("CRON_SECRET", "cron-secret-for-tests"); vi.stubEnv("INQUIRY_RETENTION_MONTHS", ""); });

  it("refuses everything without the cron secret", async () => {
    expect((await call()).status).toBe(401); expect((await call("Bearer nope")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", ""); expect((await call("Bearer ")).status).toBe(401);
  });

  it("reports on ?dryRun=1, otherwise blanks what is past the 24-month maximum", async () => {
    const old = seed(60), recent = seed(2);
    let res = await call("Bearer cron-secret-for-tests", "?dryRun=1");
    expect(await res.json()).toMatchObject({ ok: true, retentionMonths: 24, due: 1, purged: 0, dryRun: true });
    expect(old.message).toBe("private words");
    res = await call("Bearer cron-secret-for-tests");
    expect(await res.json()).toMatchObject({ purged: 1, dryRun: false });
    expect(old.message).toBe(""); expect(recent.message).toBe("private words");
  });

  it("is registered as a daily cron, after the existing one", async () => {
    const cfg = JSON.parse((await import("node:fs")).readFileSync("vercel.json", "utf8"));
    expect(cfg.crons.map((c: any) => c.path)).toEqual(["/api/cron/intelligence-maintenance", "/api/cron/inquiry-retention"]);
    expect(cfg.crons[1].schedule).toMatch(/^\d+ \d+ \* \* \*$/);
  });
});

describe("the admin erase route", () => {
  const call = async (body: unknown, headers: Record<string, string> = {}) => { const { POST } = await import("@/app/api/admin/inquiries/erase/route"); return POST(new Request("https://modernbusinessarchitect.com/api/admin/inquiries/erase", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) })); };

  it("is administrator-only and same-site-only", async () => {
    seed(1);
    expect((await call({ id: "11111111-1111-1111-1111-111111111111" })).status).toBe(401);
    admin.user = { email: "owner@example.test" };
    expect((await call({ email: "x@example.test" }, { origin: "https://evil.example" })).status).toBe(403);
    expect(rows()).toHaveLength(1);
  });

  it("erases by id or by e-mail, and refuses anything else", async () => {
    admin.user = { email: "owner@example.test" };
    const a = seed(1, { id: "11111111-1111-4111-8111-111111111111" }), b = seed(1, { email: "gone@example.test" });
    expect(await (await call({ id: a.id })).json()).toEqual({ deleted: 1 });
    expect(await (await call({ email: "gone@example.test" })).json()).toEqual({ deleted: 1 });
    expect(rows()).toHaveLength(0); void b;
    for (const bad of [{}, { id: "not-a-uuid" }, { email: "nope" }, { id: 5 }]) expect((await call(bad)).status).toBe(400);
  });
});
