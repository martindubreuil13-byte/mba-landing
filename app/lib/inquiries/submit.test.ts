/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = vi.hoisted(() => ({ current: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.current.client() }));
const limiter = vi.hoisted(() => ({ allow: true, calls: [] as string[] }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async (key: string) => { limiter.calls.push(key); return limiter.allow; }, getClientIp: () => "unknown" }));

import { submitInquiry, type SubmitDeps, type SubmitInput } from "./submit";
import { reviseUnsent } from "./store";
import { PROGRAMS } from "@/app/lib/service-programs/catalog";

const program = PROGRAMS[0];
const KEY = "form-key-0123456789abcdef";
const input = (over: Partial<SubmitInput> = {}): SubmitInput => ({ name: "Ada Lovelace", email: "Ada@Example.test", situation: "Program 03", message: "Hello, I would like to talk.", program, attribution: { source: "linkedin" }, clientKey: KEY, ...over });

type Sent = { payload: any; options: any };
let sent: Sent[];
let behaviour: Array<"ok" | "reject" | "throw" | "disabled">;
const deps = (over: Partial<SubmitDeps> = {}): SubmitDeps => ({
  notifyTo: "owner@example.test",
  now: () => Date.parse("2026-11-02T12:00:00Z"),
  send: async (payload, options) => {
    sent.push({ payload, options });
    const b = behaviour.shift() ?? "ok";
    if (b === "throw") throw new Error("network down");
    if (b === "reject") return { data: null, error: { name: "validation_error", message: "rejected", statusCode: 422 } };
    if (b === "disabled") return { data: null, error: { name: "application_error", message: "off", statusCode: 403 } };
    return { data: { id: `msg_${sent.length}` }, error: null };
  },
  ...over,
});
const owners = () => sent.filter((s) => s.payload.to === "owner@example.test");
const replies = () => sent.filter((s) => String(s.payload.to).toLowerCase() === "ada@example.test");
const rows = () => db.current.tables.program_inquiries as any[];

beforeEach(() => {
  db.current = new FakeDb(); sent = []; behaviour = []; limiter.allow = true; limiter.calls = [];
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-for-tests"); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "");
  vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", ""); vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "");
});

describe("a stored inquiry", () => {
  it("is committed, notifies the owner once, answers the visitor once, and records every step", async () => {
    const r = await submitInquiry(input(), deps());
    expect(r).toMatchObject({ ok: true, autoReply: true, replay: false });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ owner_status: "accepted", auto_reply_status: "accepted", program_slug: program.slug, full_name: "Ada Lovelace", idempotency_key: KEY, message: "Hello, I would like to talk." });
    expect(owners()).toHaveLength(1); expect(replies()).toHaveLength(1);
    expect(owners()[0].options.idempotencyKey).toBe(`inq-owner-${rows()[0].id}-0`);
    expect(replies()[0].options.idempotencyKey).toBe(`inq-reply-${rows()[0].id}`);
    expect((r as any).bookingRef).toBe(rows()[0].booking_ref);
  });

  it("makes a lead that is NOT subscribed, and never renames or re-opts an existing one", async () => {
    await submitInquiry(input(), deps());
    expect(db.current.tables.leads).toHaveLength(1);
    expect(db.current.tables.leads[0]).toMatchObject({ email: "ada@example.test", first_name: "Ada", ongoing_content_opt_in: false });
    // an existing, subscribed lead: a stranger typing its address with another name changes nothing about it
    db.current.tables.leads[0].first_name = "Original"; db.current.tables.leads[0].ongoing_content_opt_in = true; db.current.tables.leads[0].country = "CA";
    await submitInquiry(input({ name: "Mallory Fake", clientKey: "second-key-0123456789abcdef", message: "another" }), deps());
    expect(db.current.tables.leads).toHaveLength(1);
    expect(db.current.tables.leads[0]).toMatchObject({ first_name: "Original", ongoing_content_opt_in: true, country: "CA" });
    expect(rows()).toHaveLength(2);
  });

  it("no saved row means no accepted inquiry and no owner notification (database unavailable)", async () => {
    db.current.failNextInsertInto = "program_inquiries";
    const r = await submitInquiry(input(), deps());
    expect(r).toMatchObject({ ok: false, status: 503, code: "storage_unavailable" });
    expect(sent).toHaveLength(0);
    expect(rows()).toHaveLength(0);
    // and if even the lead cannot be stored
    db.current = new FakeDb(); db.current.failNextInsertInto = "leads";
    expect(await submitInquiry(input({ clientKey: "another-key-0123456789abcdef" }), deps())).toMatchObject({ ok: false, status: 503 });
    expect(sent).toHaveLength(0);
  });

  it("a repeat of an accepted inquiry (lost response, double click) succeeds without a second row or a second e-mail", async () => {
    await submitInquiry(input(), deps());
    const again = await submitInquiry(input(), deps());
    expect(again).toMatchObject({ ok: true, autoReply: true, replay: true });
    expect(rows()).toHaveLength(1); expect(sent).toHaveLength(2);
    expect(limiter.calls.some((k) => k.includes(":email:"))).toBe(true); // counted once, for the first
    const calls = limiter.calls.length; await submitInquiry(input(), deps()); expect(limiter.calls.length).toBe(calls); // a replay does not use up the address's allowance
  });

  it("simultaneous identical requests produce one row and one owner e-mail", async () => {
    const results = await Promise.all([submitInquiry(input(), deps()), submitInquiry(input(), deps()), submitInquiry(input(), deps())]);
    expect(rows()).toHaveLength(1);
    expect(owners()).toHaveLength(1); expect(replies()).toHaveLength(1);
    expect(results.filter((r) => r.ok).length).toBeGreaterThanOrEqual(1);
    for (const r of results) if (!r.ok) expect(r).toMatchObject({ status: 409, code: "in_progress" });
  });

  it("without a browser key, the same words from the same person in ten minutes are one inquiry", async () => {
    await submitInquiry(input({ clientKey: null }), deps());
    await submitInquiry(input({ clientKey: null }), deps());
    expect(rows()).toHaveLength(1); expect(owners()).toHaveLength(1);
    expect(rows()[0].idempotency_key).toMatch(/^auto-/);
    await submitInquiry(input({ clientKey: "not a valid key!" , message: "a different message" }), deps());
    expect(rows()).toHaveLength(2);
  });
});

describe("when the owner notification fails (existing behaviour kept)", () => {
  it("fails the request as before, keeps the row visible as a failure, and a retry sends again with no second row", async () => {
    behaviour = ["reject"];
    const r1 = await submitInquiry(input(), deps());
    expect(r1).toMatchObject({ ok: false, status: 502, code: "provider_rejected" });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ owner_status: "failed", owner_attempts: 1, auto_reply_status: "pending" });
    expect(rows()[0].owner_error).toContain("provider_rejected");
    expect(replies()).toHaveLength(0); // no visitor reply for a message the owner never got

    const r2 = await submitInquiry(input(), deps());
    expect(r2).toMatchObject({ ok: true });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ owner_status: "accepted", owner_attempts: 1 });
    expect(owners()).toHaveLength(2);
    expect(owners().map((o) => o.options.idempotencyKey)).toEqual([`inq-owner-${rows()[0].id}-0`, `inq-owner-${rows()[0].id}-1`]); // a new attempt, a new provider key
    expect(replies()).toHaveLength(1);
  });

  it("e-mail switched off in this environment is a 503, a thrown network error a 502, both leave the row for a retry", async () => {
    behaviour = ["disabled"]; expect(await submitInquiry(input(), deps())).toMatchObject({ ok: false, status: 503, code: "email_disabled" });
    behaviour = ["throw"]; expect(await submitInquiry(input(), deps())).toMatchObject({ ok: false, status: 502, code: "provider_error" });
    expect(rows()).toHaveLength(1); expect(rows()[0].owner_status).toBe("failed"); expect(rows()[0].owner_attempts).toBe(2);
  });

  it("corrected words on a retry replace the unsent text instead of making a second record; after acceptance they make a new one", async () => {
    behaviour = ["reject"]; await submitInquiry(input(), deps());
    await submitInquiry(input({ message: "Corrected message" }), deps());
    expect(rows()).toHaveLength(1); expect(rows()[0].message).toBe("Corrected message"); expect(rows()[0].owner_status).toBe("accepted");
    await submitInquiry(input({ message: "A later, different question" }), deps());
    expect(rows()).toHaveLength(2);
  });

  it("a request that died mid-send is reclaimed only after two minutes, with the same provider key", async () => {
    await submitInquiry(input(), deps({ send: async () => { throw new Error("x"); } })); // leaves 'failed'
    rows()[0].owner_status = "sending"; rows()[0].owner_claimed_at = "2026-11-02T11:59:50.000Z"; // ten seconds ago
    expect(await submitInquiry(input(), deps())).toMatchObject({ ok: false, status: 409, code: "in_progress" });
    rows()[0].owner_claimed_at = "2026-11-02T11:50:00.000Z"; // ten minutes ago
    const key = rows()[0].owner_attempts;
    expect(await submitInquiry(input(), deps())).toMatchObject({ ok: true });
    expect(owners().at(-1)!.options.idempotencyKey).toBe(`inq-owner-${rows()[0].id}-${key}`);
  });
});

describe("revising an inquiry", () => {
  it("can never change the words of an inquiry the owner already received (even if it was accepted a moment after it was read)", async () => {
    await submitInquiry(input(), deps());
    await reviseUnsent(rows()[0].id, { program_slug: null, full_name: "Someone Else", situation: null, message: "REWRITTEN", attribution: {}, content_hash: "x" });
    expect(rows()[0]).toMatchObject({ message: "Hello, I would like to talk.", full_name: "Ada Lovelace" });
  });
});

describe("the visitor's reply", () => {
  it("is sent at most once; its failure never fails the inquiry and it is never retried", async () => {
    behaviour = ["ok", "reject"];
    const r = await submitInquiry(input(), deps());
    expect(r).toMatchObject({ ok: true, autoReply: false });
    expect(rows()[0]).toMatchObject({ owner_status: "accepted", auto_reply_status: "failed" });
    const again = await submitInquiry(input(), deps());
    expect(again).toMatchObject({ ok: true, autoReply: false, replay: true });
    expect(replies()).toHaveLength(1);
  });

  it("carries the plain booking link by default, and the visitor's own fragment reference once exchange links are on", async () => {
    await submitInquiry(input(), deps());
    const plain = replies()[0].payload.text as string;
    expect(plain).toContain(`https://modernbusinessarchitect.com/book/complementary-session?source=inquiry-${program.slug}`);
    expect(plain).not.toContain(rows()[0].booking_ref);

    db.current = new FakeDb(); sent = []; vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true");
    await submitInquiry(input(), deps());
    const text = replies()[0].payload.text as string;
    expect(text).toContain(`/book/complementary-session?source=inquiry-${program.slug}#r=${rows()[0].booking_ref}`);
    expect(text).not.toContain("ref=");
    expect(text).not.toMatch(/calendly/i);
    // the reference never reaches the owner's copy
    expect(owners()[0].payload.text).not.toContain(rows()[0].booking_ref);
  });
});

describe("limits", () => {
  it("a NEW inquiry past the per-address allowance is refused before anything is stored or sent", async () => {
    limiter.allow = false;
    const r = await submitInquiry(input(), deps());
    expect(r).toMatchObject({ ok: false, status: 429, code: "rate_limited" });
    expect(rows()).toHaveLength(0); expect(sent).toHaveLength(0); expect(db.current.tables.leads).toHaveLength(0);
    expect(limiter.calls[0]).toMatch(/^inq:email:[0-9a-f]{32}$/); // a keyed hash, never the address itself
    expect(limiter.calls[0]).not.toContain("example");
  });
});

describe("the conversion and the logs", () => {
  it("the conversion callback runs once, only for the request that got the owner notification accepted", async () => {
    const onAccepted = vi.fn(async () => undefined);
    await submitInquiry(input(), deps({ onAccepted })); await submitInquiry(input(), deps({ onAccepted }));
    expect(onAccepted).toHaveBeenCalledTimes(1);
    expect(onAccepted).toHaveBeenCalledWith({ program: program.slug, messageId: "msg_1" });
    // a failing callback never fails the inquiry
    db.current = new FakeDb(); sent = [];
    expect(await submitInquiry(input(), deps({ onAccepted: async () => { throw new Error("x"); } }))).toMatchObject({ ok: true });
  });

  it("never writes the reference, the message or the e-mail address to the logs", async () => {
    const out: string[] = [];
    const spies = (["log", "warn", "error", "info"] as const).map((m) => vi.spyOn(console, m).mockImplementation((...a: unknown[]) => { out.push(a.map(String).join(" ")); }));
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true");
    behaviour = ["reject"]; await submitInquiry(input({ message: "SECRET-WORDS" }), deps());
    await submitInquiry(input({ message: "SECRET-WORDS" }), deps());
    db.current.failNextInsertInto = "program_inquiries"; await submitInquiry(input({ clientKey: "other-key-0123456789abcdef" }), deps());
    const ref = rows()[0].booking_ref;
    const all = out.join("\n");
    expect(all).not.toContain(ref); expect(all).not.toContain("SECRET-WORDS"); expect(all.toLowerCase()).not.toContain("ada@example.test");
    spies.forEach((s) => s.mockRestore());
  });
});
