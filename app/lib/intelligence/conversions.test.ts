import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const rpc = vi.fn();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ rpc }) }));

const req = (headers: Record<string, string> = {}) => new Request("http://localhost/api/x", { method: "POST", headers });
const run = async (r: Request, c = { kind: "inquiry" as const }) => (await import("./conversions")).recordConversion(r, c);

describe("recordConversion", () => {
  beforeEach(() => {
    rpc.mockReset().mockResolvedValue({ data: { recorded: true, attributed: true }, error: null });
    vi.stubEnv("APP_ENV", "preview");
  });

  it("sends the kind, page, session id, environment and an opaque reference, and nothing personal", async () => {
    await run(req({ "x-wi-sid": "w1234567890abcdef1234", referer: "http://localhost:3000/lets-talk?program=pre-architecture&email=a@b.co" }), {
      kind: "inquiry", refTable: "x", refId: "ref-1",
    } as never);
    const p = rpc.mock.calls[0][1].p;
    expect(p).toMatchObject({ kind: "inquiry", name: "inquiry_confirmed", sid: "w1234567890abcdef1234", path: "/lets-talk", environment: "preview", event_id: "inquiry:ref-1", ref_id: "ref-1" });
    expect(JSON.stringify(p)).not.toContain("a@b.co");
  });

  it("is still recorded, unattributed, when the visitor sent no (or an invalid) session id", async () => {
    await run(req());
    expect(rpc.mock.calls[0][1].p.sid).toBeNull();
    await run(req({ "x-wi-sid": "bad id; drop table" }));
    expect(rpc.mock.calls[1][1].p.sid).toBeNull();
  });

  it("uses a deterministic event id when there is a record id, so a retry cannot double count", async () => {
    await run(req(), { kind: "program_application", refId: "app-7" } as never);
    await run(req(), { kind: "program_application", refId: "app-7" } as never);
    expect(rpc.mock.calls[0][1].p.event_id).toBe(rpc.mock.calls[1][1].p.event_id);
  });

  it("never throws or blocks the visitor flow when recording fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(run(req())).resolves.toBe(false);
    rpc.mockRejectedValue(new Error("network"));
    await expect(run(req())).resolves.toBe(false);
  });

  it("ignores admin and api referers for the page", async () => {
    await run(req({ referer: "http://localhost:3000/admin/leads" }));
    expect(rpc.mock.calls[0][1].p.path).toBeNull();
  });
});
