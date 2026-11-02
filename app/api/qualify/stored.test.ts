/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = vi.hoisted(() => ({ current: null as any }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.current.client() }));
const limiter = vi.hoisted(() => ({ deny: [] as string[], calls: [] as string[] }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async (key: string) => { limiter.calls.push(key); return !limiter.deny.some((d) => key.includes(d)); }, getClientIp: () => "unknown" }));
const send = vi.fn();
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send: (...a: unknown[]) => (send as (...x: unknown[]) => unknown)(...a) } }) }));
const recordConversion = vi.fn(async () => true);
vi.mock("@/app/lib/intelligence/conversions", () => ({ recordConversion: (...a: unknown[]) => (recordConversion as (...x: unknown[]) => unknown)(...a) }));

import { issueFormToken } from "@/app/lib/inquiries/form-token";

const KEY = "form-key-0123456789abcdef";
const valid = { name: "Ada Lovelace", email: "ada@example.test", situation: "Program 03", message: "Hello", program: { slug: "pre-architecture" }, attribution: {} };
const tokenAged = (ms: number) => issueFormToken(Date.now() - ms);
const post = async (body: unknown, headers: Record<string, string> = {}, raw?: string) => {
  const { POST } = await import("./route");
  return POST(new Request("https://modernbusinessarchitect.com/api/qualify", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: raw ?? JSON.stringify(body) }));
};
const stored = () => db.current.tables.program_inquiries as any[];

beforeEach(() => {
  db.current = new FakeDb(); limiter.deny = []; limiter.calls = []; send.mockReset(); recordConversion.mockClear();
  send.mockResolvedValue({ data: { id: "msg_1" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test"); vi.stubEnv("INQUIRY_NOTIFY_EMAIL", "");
  vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("APP_BASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-for-tests"); vi.stubEnv("INQUIRY_FORM_SECRET", ""); vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "");
  vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "true"); vi.stubEnv("BOOKING_REF_EXCHANGE_ENABLED", "");
});

describe("/api/qualify with stored inquiries on", () => {
  const good = () => ({ ...valid, formToken: tokenAged(5_000), idempotencyKey: KEY, contactUrl: "" });

  it("saves, notifies, replies and answers success; the response carries no reference until exchange links are on", async () => {
    const res = await post(good(), { "x-vercel-forwarded-for": "203.0.113.5" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, autoReply: true });
    expect(stored()).toHaveLength(1); expect(send).toHaveBeenCalledTimes(2);
    expect(recordConversion).toHaveBeenCalledTimes(1);
    expect(recordConversion).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ kind: "inquiry", props: { program: "pre-architecture" } }));
  });

  it("hands the visitor their own reference only when exchange links are on", async () => {
    vi.stubEnv("BOOKING_REF_EXCHANGE_ENABLED", "true");
    const body = await (await post(good())).json();
    expect(body).toMatchObject({ success: true, autoReply: true, bookingRef: stored()[0].booking_ref });
  });

  it("a retry (same key) after success does not save or send again", async () => {
    const first = good();
    await post(first); await post({ ...first, formToken: tokenAged(9_000) });
    expect(stored()).toHaveLength(1); expect(send).toHaveBeenCalledTimes(2); expect(recordConversion).toHaveBeenCalledTimes(1);
  });

  it("the hidden field gets a convincing success and nothing is saved or sent", async () => {
    const res = await post({ ...good(), contactUrl: "http://spam.example" });
    expect(await res.json()).toEqual({ success: true, autoReply: false });
    expect(stored()).toHaveLength(0); expect(send).not.toHaveBeenCalled(); expect(recordConversion).not.toHaveBeenCalled(); expect(db.current.tables.leads).toHaveLength(0);
  });

  it("requires a genuine, aged form token", async () => {
    for (const [formToken, code] of [[undefined, "stale_form"], ["forged.token.value", "stale_form"], [tokenAged(100), "too_fast"], [tokenAged(26 * 3_600_000), "stale_form"]] as const) {
      const res = await post({ ...good(), formToken });
      expect(res.status).toBe(400); expect((await res.json()).code).toBe(code);
    }
    expect(stored()).toHaveLength(0); expect(send).not.toHaveBeenCalled();
  });

  it("refuses a post from another site", async () => {
    expect((await post(good(), { origin: "https://evil.example" })).status).toBe(403);
    expect((await post(good(), { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await post(good(), { origin: "https://modernbusinessarchitect.com", host: "modernbusinessarchitect.com" })).status).toBe(200);
    expect(stored()).toHaveLength(1);
  });

  it("limits a client to the per-client allowance with a 429 and a Retry-After, before anything is stored", async () => {
    limiter.deny = [":client:"];
    const res = await post(good(), { "x-vercel-forwarded-for": "203.0.113.5" });
    expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBe("3600");
    expect((await res.json()).code).toBe("rate_limited");
    expect(stored()).toHaveLength(0); expect(send).not.toHaveBeenCalled();
    // the client key is a keyed hash, never the address
    expect(limiter.calls.find((k) => k.includes(":client:"))).toMatch(/^inq:client:[0-9a-f]{32}$/);
  });

  it("a request whose address cannot be trusted skips the per-client limit instead of sharing one bucket", async () => {
    limiter.deny = [":client:"];
    const res = await post(good()); // no platform header on the platform, no forwarded chain
    expect(res.status).toBe(200);
    expect(limiter.calls.some((k) => k.includes(":client:"))).toBe(false);
  });

  it("the global figure is monitoring only: past it, visitors are still served and one line is logged", async () => {
    limiter.deny = ["inq:all"];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const res = await post(good());
    expect(res.status).toBe(200); expect(stored()).toHaveLength(1);
    expect(warn.mock.calls.flat().join(" ")).toContain("INQUIRY VOLUME");
    warn.mockRestore();
  });

  it("the third NEW inquiry of the day for one address is the last: the address limit answers 429", async () => {
    limiter.deny = [":email:"];
    const res = await post(good());
    expect(res.status).toBe(429); expect(stored()).toHaveLength(0); expect(send).not.toHaveBeenCalled();
  });

  it("no saved row means a 503 and nothing sent (fail closed)", async () => {
    db.current.failNextInsertInto = "program_inquiries";
    const res = await post(good());
    expect(res.status).toBe(503); expect((await res.json()).code).toBe("storage_unavailable");
    expect(send).not.toHaveBeenCalled(); expect(recordConversion).not.toHaveBeenCalled();
  });

  it("an owner e-mail failure is shown to the visitor exactly as before and the saved row can be retried", async () => {
    send.mockResolvedValueOnce({ data: null, error: { name: "x", message: "no", statusCode: 500 } });
    const res = await post(good());
    expect(res.status).toBe(502); expect((await res.json()).message).toBe("We couldn't send your message just now.");
    expect(stored()).toHaveLength(1); expect(stored()[0].owner_status).toBe("failed"); expect(recordConversion).not.toHaveBeenCalled();
    const retry = await post({ ...good(), formToken: tokenAged(8_000) });
    expect(retry.status).toBe(200); expect(stored()).toHaveLength(1); expect(stored()[0].owner_status).toBe("accepted");
  });

  it("refuses an oversized request before reading it, and still validates the fields", async () => {
    expect((await post(good(), { "content-length": "100000" })).status).toBe(413);
    expect((await post({ ...good(), email: "nope" })).status).toBe(400);
    expect((await post(good(), {}, "{not json")).status).toBe(400);
  });
});

describe("/api/qualify with stored inquiries OFF (the current production behaviour)", () => {
  beforeEach(() => { vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", ""); });

  it("touches no database and no limiter, needs no token, and answers exactly the old shape", async () => {
    const res = await post(valid);
    expect(res.status).toBe(200); expect(await res.json()).toEqual({ success: true, autoReply: true });
    expect(db.current.tables.program_inquiries).toHaveLength(0); expect(db.current.tables.leads).toHaveLength(0);
    expect(limiter.calls).toHaveLength(0);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][1]).toBeUndefined(); // no provider options either
    // the booking link carries no reference
    expect(send.mock.calls[1][0].text).not.toMatch(/ref=|#r=/);
  });

  it("ignores the hidden field and a missing token (an old page behaves as before)", async () => {
    expect(await (await post({ ...valid, contactUrl: "x" })).json()).toEqual({ success: true, autoReply: true });
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("/api/qualify/challenge", () => {
  it("serves a token only while stored inquiries are on, never cached", async () => {
    const { GET } = await import("./challenge/route");
    const on = await GET(); expect(on.status).toBe(200); expect(on.headers.get("cache-control")).toBe("no-store");
    expect((await on.json()).token).toMatch(/^ft1\.\d+\./);
    vi.stubEnv("PROGRAM_INQUIRY_STORE_ENABLED", "");
    expect((await GET()).status).toBe(404);
  });
});
