import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const rpc = vi.fn();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ rpc }) }));

const call = async (auth?: string) => {
  const { GET } = await import("./route");
  return GET(new Request("http://localhost/api/cron/intelligence-maintenance", { headers: auth ? { authorization: auth } : {} }));
};

describe("/api/cron/intelligence-maintenance", () => {
  beforeEach(() => {
    rpc.mockReset().mockResolvedValue({ data: { days_rolled_up: 1 }, error: null });
    vi.stubEnv("CRON_SECRET", "s3cret");
  });
  it("refuses without the bearer secret", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("refuses everything when CRON_SECRET is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(401);
    expect((await call("Bearer undefined")).status).toBe(401);
  });
  it("runs maintenance with the right secret", async () => {
    const res = await call("Bearer s3cret");
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("wi_maintenance");
  });
  it("reports failure without leaking details", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "secret detail" } });
    const res = await call("Bearer s3cret");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret detail");
  });
});
