import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));

import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { adminRoute, isSchedulingError, publicRoute } from "./http";
import { SchedulingError } from "./service";

const req = () => new Request("http://localhost/x", { method: "POST" });

describe("scheduling route plumbing", () => {
  it("is switched off (404) unless the prototype flag is on, and never on Vercel", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    vi.stubEnv("SCHEDULING_PROTOTYPE", "");
    expect((await publicRoute(handler)(req(), {})).status).toBe(404);
    vi.stubEnv("SCHEDULING_PROTOTYPE", "true");
    vi.stubEnv("VERCEL", "1");
    expect((await publicRoute(handler)(req(), {})).status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
    vi.stubEnv("VERCEL", "");
    expect((await publicRoute(handler)(req(), {})).status).toBe(200);
    vi.unstubAllEnvs();
  });

  it("admin routes answer 401 to anyone but the signed-in admin", async () => {
    vi.stubEnv("SCHEDULING_PROTOTYPE", "true");
    const handler = vi.fn(async () => new Response("ok"));
    vi.mocked(getAdminUser).mockResolvedValueOnce(null);
    expect((await adminRoute(handler)(req(), {})).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    vi.mocked(getAdminUser).mockResolvedValueOnce({ email: "a@b.c" } as never);
    expect((await adminRoute(handler)(req(), {})).status).toBe(200);
    vi.unstubAllEnvs();
  });

  it("turns a scheduling error into its HTTP status and message", async () => {
    vi.stubEnv("SCHEDULING_PROTOTYPE", "true");
    const r = await publicRoute(async () => { throw new SchedulingError("slot_unavailable", "That time is no longer available.", 409, { field: "x" }); })(req(), {});
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: "That time is no longer available.", code: "slot_unavailable", field: "x" });
    vi.unstubAllEnvs();
  });

  it("recognises an error from another copy of the module (the singleton is shared across bundles)", async () => {
    vi.stubEnv("SCHEDULING_PROTOTYPE", "true");
    class SchedulingError extends Error { code = "invitation_required"; status = 403; constructor() { super("This booking link is private."); this.name = "SchedulingError"; } }
    const foreign = new SchedulingError();
    expect(foreign instanceof (await import("./service")).SchedulingError).toBe(false);
    expect(isSchedulingError(foreign)).toBe(true);
    const r = await publicRoute(async () => { throw foreign; })(req(), {});
    expect(r.status).toBe(403);
    vi.unstubAllEnvs();
  });

  it("hides unexpected errors behind a generic 500", async () => {
    vi.stubEnv("SCHEDULING_PROTOTYPE", "true");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await publicRoute(async () => { throw new Error("secret detail"); })(req(), {});
    expect(r.status).toBe(500);
    expect(JSON.stringify(await r.json())).not.toContain("secret");
    spy.mockRestore(); vi.unstubAllEnvs();
  });
});
