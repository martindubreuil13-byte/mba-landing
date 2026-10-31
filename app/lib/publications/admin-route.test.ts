import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getAdminUser = vi.fn();
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: () => getAdminUser() }));
const getServiceClient = vi.fn(() => {
  throw new Error("service client must not be touched");
});
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => getServiceClient() }));

import { withPublicationsAdmin } from "./admin-route";
import { PublicationError } from "./queries";

const req = (method: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/admin/publications", { method, headers });
const sameOrigin = { origin: "http://localhost:3000", host: "localhost:3000" };

beforeEach(() => {
  getAdminUser.mockReset();
  getServiceClient.mockClear();
});

describe("withPublicationsAdmin", () => {
  it("returns 401 for a signed-out visitor and never runs the handler or touches the service client", async () => {
    getAdminUser.mockResolvedValue(null);
    const handler = vi.fn(async () => {
      getServiceClient();
      return NextResponse.json({ ok: true });
    });
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
      const res = await withPublicationsAdmin(handler)(req(method, sameOrigin), undefined);
      expect(res.status).toBe(401);
    }
    expect(handler).not.toHaveBeenCalled();
    expect(getServiceClient).not.toHaveBeenCalled();
  });
  it("authenticates before looking at the request at all (a non-admin with a hostile origin still just gets 401)", async () => {
    getAdminUser.mockResolvedValue(null);
    const res = await withPublicationsAdmin(async () => NextResponse.json({}))(req("POST", { origin: "https://evil.com", host: "localhost:3000" }), undefined);
    expect(res.status).toBe(401);
  });
  it("refuses cross-site state-changing requests from an admin session", async () => {
    getAdminUser.mockResolvedValue({ email: "admin@x" });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    for (const method of ["POST", "PATCH", "DELETE"]) {
      expect((await withPublicationsAdmin(handler)(req(method, { origin: "https://evil.com", host: "localhost:3000" }), undefined)).status).toBe(403);
      expect((await withPublicationsAdmin(handler)(req(method), undefined)).status).toBe(403);
    }
    expect(handler).not.toHaveBeenCalled();
    expect((await withPublicationsAdmin(handler)(req("POST", sameOrigin), undefined)).status).toBe(200);
  });
  it("maps domain errors to their status and message, and hides unexpected ones", async () => {
    getAdminUser.mockResolvedValue({ email: "admin@x" });
    const stale = await withPublicationsAdmin(async () => {
      throw new PublicationError(409, "stale", "Changed elsewhere");
    })(req("PATCH", sameOrigin), undefined);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ code: "stale", error: "Changed elsewhere" });

    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const boom = await withPublicationsAdmin(async () => {
      throw new Error("secret connection string postgres://user:pw@host");
    })(req("PATCH", sameOrigin), undefined);
    expect(boom.status).toBe(500);
    expect(JSON.stringify(await boom.json())).not.toMatch(/secret|postgres/);
    spy.mockRestore();
  });
});
