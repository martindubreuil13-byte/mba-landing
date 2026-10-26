import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const rpc = vi.fn();
const from = vi.fn();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ rpc, from }) }));
const rateLimit = vi.fn();
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: (...a: unknown[]) => rateLimit(...a) }));

const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const payload = {
  sid: "w1234567890abcdef1234",
  entry: { ref: "https://chatgpt.com/", land: "/answers/x" },
  pv: [{ id: "view-0001", seq: 1, path: "/answers/x", title: "X" }],
};
const send = async (body: unknown, headers: Record<string, string> = {}) => {
  const { handleCollect } = await import("./ingest");
  return handleCollect(new Request("http://localhost/api/wi", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "user-agent": BROWSER, ...headers } }));
};

describe("handleCollect", () => {
  beforeEach(() => {
    rpc.mockReset().mockResolvedValue({ error: null });
    rateLimit.mockReset().mockResolvedValue(true);
    from.mockReset().mockReturnValue({ select: () => ({ eq: () => Promise.resolve({ data: null, error: { message: "down" } }) }) });
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-secret");
  });

  it("stores a classified session with no IP or network-derived identifier, and AI evidence", async () => {
    const r = await send(payload, { "x-vercel-ip-country": "ca", "x-forwarded-for": "203.0.113.9", "x-real-ip": "203.0.113.9" });
    expect(r.status).toBe(204);
    const arg = rpc.mock.calls[0][1].p;
    expect(arg.session).toMatchObject({ source_category: "ai_assistant", ai_platform: "ChatGPT", source_evidence: "referrer:chatgpt.com", country: "CA", device: "desktop", browser: "Safari" });
    expect(JSON.stringify(arg)).not.toContain("203.0.113.9");
    // The only identifier is the random per-tab session id; no hash, fingerprint or visitor field exists.
    expect(Object.keys(arg.session).sort()).toEqual([
      "ai_platform", "browser", "country", "device", "environment", "id", "landing_path", "referrer", "referrer_host",
      "source_category", "source_detail", "source_evidence", "utm_campaign", "utm_content", "utm_medium", "utm_source",
    ]);
    // Rate limiting uses the session id and a global bucket, never anything derived from the network address.
    const keys = rateLimit.mock.calls.map((c) => c[0] as string);
    expect(keys).toEqual([`wi:s:${payload.sid}`, "wi:hour", "wi:day"]);
    expect(JSON.stringify(keys)).not.toContain("203.0.113.9");
  });
  it("tags the session with the deployment environment (never taken from the browser)", async () => {
    vi.stubEnv("APP_ENV", "preview");
    await send({ ...payload, entry: { ...payload.entry }, env: "production", environment: "production" });
    expect(rpc.mock.calls[0][1].p.session.environment).toBe("preview");
  });
  it("counts nothing for bots, AI crawlers, or a signed-in admin", async () => {
    expect((await send(payload, { "user-agent": "GPTBot/1.1" })).status).toBe(204);
    expect((await send(payload, { "user-agent": "HeadlessChrome/120" })).status).toBe(204);
    expect((await send(payload, { cookie: "sb-abc-auth-token=xyz" })).status).toBe(204);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects invalid or oversized payloads without touching the database", async () => {
    expect((await send("{bad")).status).toBe(400);
    expect((await send("x".repeat(9000))).status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("drops beacons posted from another website (cross-site Origin) without storing anything", async () => {
    expect((await send(payload, { origin: "https://evil.example", host: "localhost" })).status).toBe(204);
    expect((await send(payload, { origin: "not a url", host: "localhost" })).status).toBe(204);
    expect(rpc).not.toHaveBeenCalled();
    // The site's own origin, and requests with no Origin header, are accepted.
    await send(payload, { origin: "http://localhost", host: "localhost" });
    await send(payload);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it("rate limits (per session, per hour, per day)", async () => {
    rateLimit.mockResolvedValue(false);
    expect((await send(payload)).status).toBe(429);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("fails soft when the database errors", async () => {
    rpc.mockResolvedValue({ error: { message: "boom" } });
    expect((await send(payload)).status).toBe(202);
  });
});
