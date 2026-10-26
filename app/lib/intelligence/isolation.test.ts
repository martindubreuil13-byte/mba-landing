import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Preview / development isolation. Uses the REAL production-database guard (no mock of the service client or the rate
 * limiter): a non-production deployment configured with the production Supabase URL must record nothing and must never
 * even construct a client for it.
 */
vi.mock("server-only", () => ({}));
const createClient = vi.fn(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: (...a: unknown[]) => (createClient as (...x: unknown[]) => unknown)(...a) }));

const PROD_URL = "https://sbntzyivfhvogxiiysuh.supabase.co";
const ISOLATED_URL = "http://127.0.0.1:54321";
const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const beacon = JSON.stringify({ sid: "w1234567890abcdef1234", entry: { land: "/" }, pv: [{ id: "view-0001", seq: 1, path: "/" }] });
const send = async () => {
  const { handleCollect } = await import("./ingest");
  return handleCollect(new Request("http://localhost/api/wi", { method: "POST", body: beacon, headers: { "user-agent": BROWSER } }));
};

describe("non-production deployments cannot write to production analytics", () => {
  beforeEach(() => {
    createClient.mockClear();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "");
  });

  it.each(["preview", "development"])("%s deployment + production database URL: nothing is recorded, no client is built", async (env) => {
    vi.stubEnv("APP_ENV", env === "development" ? "" : env);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", PROD_URL);
    const r = await send();
    expect(r.status).toBe(202);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("Vercel preview + production database URL is refused the same way", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", PROD_URL);
    expect((await send()).status).toBe(202);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("an isolated database is allowed (so local and preview testing works)", async () => {
    vi.stubEnv("APP_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ISOLATED_URL);
    await send();
    expect(createClient).toHaveBeenCalled();
    expect(createClient.mock.calls[0]).toContain(ISOLATED_URL);
  });

  it("rows are tagged with the writing deployment, so production reports (p_prod) exclude any non-production row", async () => {
    const { buildSessionRow } = await import("./ingest");
    const { parseCollectBody } = await import("./payload");
    const batch = parseCollectBody(beacon)!;
    expect(buildSessionRow(batch, new Headers({ "user-agent": BROWSER }), [], "preview").environment).toBe("preview");
    expect(buildSessionRow(batch, new Headers({ "user-agent": BROWSER }), [], "production").environment).toBe("production");
  });
});
