import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));
vi.mock("@/app/lib/rateLimit", () => ({ checkRateLimit: async () => true, getClientIp: () => "test" }));
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { schedulingOperationsEnabled, schedulingIntakeEnabled, assertSchedulingRuntime } from "./release-gates";
import { adminRoute, publicRoute, cronRoute } from "./http";
import { schedulingPreviewEnabled } from "./preview";
import { POST as zoomHook } from "@/app/api/webhooks/scheduling/zoom/route";
import { POST as replay } from "@/app/api/scheduling/replay/route";
import { adminAction } from "./admin-actions";
import { recoveryHealth } from "./recovery-health";
import type { SweepSummary } from "./types";
const prod = { VERCEL: "1", VERCEL_ENV: "production", SCHEDULING_OPERATIONS_ENABLED: "true" };
const valid = { ...prod, SCHEDULING_BACKEND: "supabase", SCHEDULING_GOOGLE: "live", SCHEDULING_ZOOM: "live", SCHEDULING_EMAIL: "resend", SCHEDULING_RECOVERY_SECRET: "unit-test-only-recovery-secret-32-characters", SCHEDULING_GOOGLE_REDIRECT_URI: "https://modernbusinessarchitect.com/api/admin/scheduling/google/callback", SCHEDULING_EMAIL_FROM: "Martin Dubreuil <martin@mindrasolutions.com>", SCHEDULING_EMAIL_REPLY_TO: "martin@mindrasolutions.com" };
const req = (authorization?: string) => new Request("https://modernbusinessarchitect.com/test", { method: "POST", headers: authorization ? { authorization } : {} });
function setProduction() { for (const [k,v] of Object.entries(prod)) vi.stubEnv(k,v); vi.stubEnv("SCHEDULING_PUBLIC_INTAKE_ENABLED", "false"); }
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("production release controls", () => {
  it("defaults both switches off and never lets intake imply operations", () => {
    expect(schedulingOperationsEnabled({ VERCEL_ENV: "production" })).toBe(false);
    expect(schedulingIntakeEnabled({ VERCEL_ENV: "production", SCHEDULING_PUBLIC_INTAKE_ENABLED: "true" })).toBe(false);
    expect(schedulingOperationsEnabled(prod)).toBe(true); expect(schedulingIntakeEnabled(prod)).toBe(false);
    expect(schedulingIntakeEnabled({ ...prod, SCHEDULING_PUBLIC_INTAKE_ENABLED: "true" })).toBe(true);
  });
  it.each(["preview", "development", "unknown"])("never enables a hosted %s, even with flags and credentials", env => {
    const e = { ...valid, VERCEL_ENV: env, SCHEDULING_PUBLIC_INTAKE_ENABLED: "true", SCHEDULING_PROTOTYPE: "true" };
    expect(schedulingOperationsEnabled(e)).toBe(false); expect(schedulingIntakeEnabled(e)).toBe(false);
    expect(schedulingPreviewEnabled({ ...e, NODE_ENV: "development" }, "localhost")).toBe(false);
    expect(() => assertSchedulingRuntime(e)).toThrow();
  });
  it("refuses production mocks/file state before constructing a provider", () => {
    expect(() => assertSchedulingRuntime(valid)).not.toThrow();
    for (const [key, value] of [["SCHEDULING_BACKEND", "file"],["SCHEDULING_GOOGLE", "mock"],["SCHEDULING_ZOOM", "mock"],["SCHEDULING_EMAIL", "simulated"],["SCHEDULING_EMAIL_TEST_MODE", "true"],["SCHEDULING_PROTOTYPE", "true"],["SCHEDULING_RECOVERY_SECRET", "short"],["SCHEDULING_GOOGLE_REDIRECT_URI", "http://localhost/callback"]]) expect(() => assertSchedulingRuntime({ ...valid, [key]: value })).toThrow();
  });
  it("returns 404 on intake without invoking any handler; existing-reference status can continue", async () => {
    setProduction(); const handler = vi.fn(async () => new Response("ok"));
    expect((await publicRoute(handler)(req(), {})).status).toBe(404); expect(handler).not.toHaveBeenCalled();
    expect((await publicRoute(handler, { intake: false })(req(), {})).status).toBe(200);
  });
  it("keeps authenticated administration available with intake closed", async () => {
    setProduction(); const handler = vi.fn(async () => new Response("ok"));
    vi.mocked(getAdminUser).mockResolvedValueOnce(null); expect((await adminRoute(handler)(req(), {})).status).toBe(401);
    vi.mocked(getAdminUser).mockResolvedValueOnce({ email: "owner@example.test" } as never); expect((await adminRoute(handler)(req(), {})).status).toBe(200);
  });
  it("recovery requires the dedicated secret, never the existing site-wide cron secret", async () => {
    setProduction(); vi.stubEnv("CRON_SECRET", "old-global"); vi.stubEnv("SCHEDULING_RECOVERY_SECRET", "new-scoped");
    const handler = vi.fn(async () => new Response("ok"));
    expect((await cronRoute(handler)(req("Bearer old-global"), {})).status).toBe(401);
    expect((await cronRoute(handler)(req("Bearer new-scoped"), {})).status).toBe(200);
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET", ""); expect((await cronRoute(handler)(req("Bearer old-global"), {})).status).toBe(401);
  });
  it("webhooks stay reachable but reject unsigned requests before service access", async () => {
    setProduction(); vi.stubEnv("SCHEDULING_ZOOM_WEBHOOK_SECRET", "unit-only");
    expect((await zoomHook(req(), {})).status).toBe(401);
  });
  it("cannot run prototype replay, reset or simulations against production", async () => {
    setProduction(); vi.stubEnv("SCHEDULING_PUBLIC_INTAKE_ENABLED", "true");
    expect((await replay(req(), {})).status).toBe(404);
    expect((await adminAction({} as never, "POST", ["reset"], new URL(req().url), {})).status).toBe(404);
    expect((await adminAction({} as never, "PUT", ["settings"], new URL(req().url), { simulate: { zoomFailure: true } })).status).toBe(404);
  });
  it("health is aggregate-only and fails for stale or missing recovery scans", () => {
    const now=Date.now(), at=new Date(now).toISOString(); const pulse={at,summary:{zoomScanAt:at,conflictScanAt:at} as SweepSummary};
    expect(recoveryHealth([],pulse,now).ok).toBe(true); expect(recoveryHealth([],null,now).ok).toBe(false);
    expect(recoveryHealth([],pulse,now+361000).ok).toBe(false); expect(JSON.stringify(recoveryHealth([],pulse,now))).not.toMatch(/guest|secret|bookingId/);
  });
});
