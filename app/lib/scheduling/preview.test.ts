import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

import { headers } from "next/headers";
import { isLoopbackHost, requireSchedulingPreview, schedulingPreviewEnabled } from "./preview";
import { previewRoute } from "./preview-route";

const DEV = { NODE_ENV: "development" };
afterEach(() => vi.unstubAllEnvs());

describe("the sign-in-free preview is development only", () => {
  it("is on for `next dev` on a loopback host", () => {
    for (const host of ["localhost:3000", "localhost", "127.0.0.1:3000", "[::1]:3000", "LOCALHOST:3100"]) expect(schedulingPreviewEnabled(DEV, host), host).toBe(true);
  });
  it("is off in a build, `next start`, tests, or with no NODE_ENV", () => {
    for (const NODE_ENV of ["production", "test", "", undefined]) expect(schedulingPreviewEnabled({ NODE_ENV }, "localhost:3000"), String(NODE_ENV)).toBe(false);
  });
  it("is off on Vercel in every environment, whatever else is set", () => {
    expect(schedulingPreviewEnabled({ ...DEV, VERCEL: "1" }, "localhost")).toBe(false);
    for (const VERCEL_ENV of ["production", "preview", "development"]) expect(schedulingPreviewEnabled({ ...DEV, VERCEL_ENV }, "localhost"), VERCEL_ENV).toBe(false);
  });
  it("is off when the deployment is declared production or preview", () => {
    expect(schedulingPreviewEnabled({ ...DEV, APP_ENV: "production" }, "localhost")).toBe(false);
    expect(schedulingPreviewEnabled({ ...DEV, APP_ENV: "preview" }, "localhost")).toBe(false);
  });
  it("is off when reached by any other host name (LAN address, domain, missing Host)", () => {
    for (const host of ["192.168.1.37:3000", "modernbusinessarchitect.com", "evil.localhost.example.com", "localhost.evil.com", "", null, undefined]) expect(schedulingPreviewEnabled(DEV, host), String(host)).toBe(false);
  });
  it("recognises loopback hosts precisely", () => {
    expect(isLoopbackHost("localhost:3000")).toBe(true);
    expect(isLoopbackHost("localhost.evil.com")).toBe(false);
    expect(isLoopbackHost("127.0.0.10")).toBe(false);
  });
});

describe("preview pages", () => {
  it("answer 404 unless development on loopback", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ host: "localhost:3000" }) as never);
    vi.stubEnv("NODE_ENV", "production");
    await expect(requireSchedulingPreview()).rejects.toThrow("NEXT_NOT_FOUND");
    vi.stubEnv("NODE_ENV", "development");
    await expect(requireSchedulingPreview()).resolves.toBeUndefined();
    vi.mocked(headers).mockResolvedValue(new Headers({ host: "192.168.1.37:3000" }) as never);
    await expect(requireSchedulingPreview()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("preview API route", () => {
  const req = (host: string, headers: Record<string, string> = {}) => new Request(`http://${host}/api/scheduling-preview/reset`, { method: "POST", headers: { host, "content-type": "application/json", ...headers }, body: "{}" });

  it("never runs its handler outside development", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    vi.stubEnv("NODE_ENV", "production");
    expect((await previewRoute(handler)(req("localhost:3000"), {})).status).toBe(404);
    vi.stubEnv("NODE_ENV", "test");
    expect((await previewRoute(handler)(req("localhost:3000"), {})).status).toBe(404);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "1");
    expect((await previewRoute(handler)(req("localhost:3000"), {})).status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });
  it("runs in development on localhost, and not from another host", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const handler = vi.fn(async () => new Response("ok"));
    expect((await previewRoute(handler)(req("localhost:3000"), {})).status).toBe(200);
    expect((await previewRoute(handler)(req("192.168.1.37:3000"), {})).status).toBe(404);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it("maps a service error to its status, like the real API", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { SchedulingError } = await import("./service");
    const r = await previewRoute(async () => { throw new SchedulingError("not_found", "Booking not found.", 404); })(req("localhost:3000"), {});
    expect(r.status).toBe(404);
    expect(await r.json()).toMatchObject({ code: "not_found" });
  });
});
