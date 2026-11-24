import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ require: vi.fn(), calls: [] as { method: string; args: unknown[] }[], result: { data: { id: "a1" }, error: null } as { data: unknown; error: unknown } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ requireAdmin: state.require }));
vi.mock("@/app/lib/supabase/service", () => ({
  getServiceClient: () => ({ from: () => {
    const builder: Record<string, unknown> = {};
    for (const method of ["insert", "update", "delete", "eq", "select"]) builder[method] = (...args: unknown[]) => { state.calls.push({ method, args }); return builder; };
    builder.maybeSingle = async () => state.result;
    return builder;
  } }),
}));

import { mutateAudience } from "./actions";
const id = "8ab4b9aa-e272-48d6-8861-b25198fa7b12";
const tagA = "8ab4b9aa-e272-48d6-8861-b25198fa7b13";
const call = (method: string) => state.calls.find((entry) => entry.method === method)?.args;

beforeEach(() => { state.calls = []; state.require.mockReset(); state.result = { data: { id }, error: null }; });

describe("saved audience changes", () => {
  it("creates an audience from filters, removing duplicate tags", async () => {
    expect(await mutateAudience({ op: "create", name: " Prospects ", search_query: " acme ", tag_ids: [tagA, tagA] })).toEqual({ id });
    expect(call("insert")).toEqual([{ name: "Prospects", search_query: "acme", tag_ids: [tagA] }]);
  });
  it("updates the saved filters of an existing audience without renaming it", async () => {
    expect(await mutateAudience({ op: "update", id, search_query: " Smith ", tag_ids: [tagA, tagA] })).toEqual({ id });
    expect(call("update")).toEqual([{ search_query: "Smith", tag_ids: [tagA] }]);
    expect(call("eq")).toEqual(["id", id]);
  });
  it("can update to no filters at all", async () => {
    await mutateAudience({ op: "update", id, search_query: "", tag_ids: [] });
    expect(call("update")).toEqual([{ search_query: "", tag_ids: [] }]);
  });
  it("renames and deletes as before", async () => {
    await mutateAudience({ op: "rename", id, name: "New name" });
    expect(call("update")).toEqual([{ name: "New name" }]);
    state.calls = [];
    await mutateAudience({ op: "delete", id });
    expect(call("delete")).toEqual([]);
  });
  it("requires an admin and rejects malformed input before touching the database", async () => {
    state.require.mockRejectedValueOnce(new Error("redirect"));
    await expect(mutateAudience({ op: "delete", id })).rejects.toThrow();
    expect(state.calls).toEqual([]);
    for (const bad of [{ op: "update", id: "nope", search_query: "", tag_ids: [] }, { op: "update", id, search_query: "x".repeat(255), tag_ids: [] },
      { op: "update", id, search_query: "", tag_ids: ["nope"] }, { op: "rename", id, name: "  " }, { op: "unknown" }]) {
      expect(await mutateAudience(bad)).toEqual({ error: expect.stringContaining("Check the audience") });
    }
    expect(state.calls).toEqual([]);
  });
  it("reports a missing audience or database error instead of pretending it saved", async () => {
    state.result = { data: null, error: null };
    expect(await mutateAudience({ op: "update", id, search_query: "", tag_ids: [] })).toEqual({ error: expect.stringContaining("could not be saved") });
    state.result = { data: null, error: { code: "x" } };
    expect(await mutateAudience({ op: "delete", id })).toEqual({ error: expect.stringContaining("could not be saved") });
  });
});
