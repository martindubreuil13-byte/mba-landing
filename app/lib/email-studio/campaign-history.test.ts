import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ result: { data: [], error: null } as { data: unknown; error: unknown }, throws: false, calls: [] as { method: string; args: unknown[] }[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/service", () => ({
  getServiceClient: () => ({ from: () => {
    if (state.throws) throw new Error("client unavailable");
    const proxy: object = new Proxy({}, { get(_, method: string) {
      if (method === "then") return (resolve: (value: unknown) => void) => resolve(state.result);
      return (...args: unknown[]) => { state.calls.push({ method, args }); return proxy; };
    } });
    return proxy;
  } }),
}));

import { outreachRecipients } from "./campaign-history";

beforeEach(() => { state.result = { data: [], error: null }; state.throws = false; state.calls = []; });

describe("outreachRecipients (labels individual sends in history without touching newsletter queries)", () => {
  it("returns only individual outreach campaigns, with the recipient's address", async () => {
    state.result = { data: [{ id: "c1", recipients: [{ id: "l1", email: "ada@example.com" }] }, { id: "c2", recipients: [] }], error: null };
    expect([...(await outreachRecipients(["c1", "c2", "c3"]))]).toEqual([["c1", "ada@example.com"], ["c2", null]]);
    expect(state.calls).toEqual(expect.arrayContaining([{ method: "eq", args: ["kind", "outreach"] }, { method: "in", args: ["id", ["c1", "c2", "c3"]] }]));
  });
  it("asks for nothing when there is nothing to look up", async () => {
    expect((await outreachRecipients([])).size).toBe(0);
    expect(state.calls).toEqual([]);
  });
  it("labels nothing, and does not throw, if the query fails (for example the database update is not applied yet)", async () => {
    state.result = { data: null, error: { code: "42703" } };
    expect((await outreachRecipients(["c1"])).size).toBe(0);
    state.throws = true;
    expect((await outreachRecipients(["c1"])).size).toBe(0);
  });
});
