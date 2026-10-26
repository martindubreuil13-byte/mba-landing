import { describe, expect, it } from "vitest";
import { GET } from "./route";

const call = async (headers: Record<string, string> = {}) => {
  const res = GET(new Request("http://localhost/api/consent/region", { headers }));
  return { res, body: await res.json() };
};

describe("/api/consent/region", () => {
  it("returns only a boolean, never the location", async () => {
    const { body } = await call({ "x-vercel-ip-country": "DE", "x-vercel-ip-country-region": "BE" });
    expect(body).toEqual({ required: true });
  });
  it("is not cached", async () => expect((await call()).res.headers.get("cache-control")).toBe("no-store"));
  it("opt-in regions, opt-out regions, Quebec, and unknown", async () => {
    expect((await call({ "x-vercel-ip-country": "FR" })).body.required).toBe(true);
    expect((await call({ "x-vercel-ip-country": "US" })).body.required).toBe(false);
    expect((await call({ "x-vercel-ip-country": "CA", "x-vercel-ip-country-region": "ON" })).body.required).toBe(false);
    expect((await call({ "x-vercel-ip-country": "CA", "x-vercel-ip-country-region": "QC" })).body.required).toBe(true);
    expect((await call()).body.required).toBe(true);
  });
});
