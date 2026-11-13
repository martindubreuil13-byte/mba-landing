import { expect, it, vi } from "vitest";
import { getBusinessPulse } from "./data";

const { queries } = vi.hoisted(() => ({ queries: [] as { table: string; calls: unknown[][] }[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/relationships/queries", () => ({
  businessTimeZone: async () => "Asia/Bangkok",
  automationExceptions: async () => [{ key: "retry", state: "Recovering" }, { key: "failure", state: "Action Required", label: "Failed" }],
}));
vi.mock("@/app/lib/supabase/service", () => ({
  getServiceClient: () => ({
    from(table: string) {
      const calls: unknown[][] = [];
      queries.push({ table, calls });
      const query = Object.fromEntries(["select", "gte", "lt", "eq", "in", "is", "lte", "order", "limit"].map((name) =>
        [name, (...args: unknown[]) => { calls.push([name, ...args]); return query; }]));
      return Object.assign(query, { then: (resolve: (value: unknown) => unknown) =>
        resolve({ data: [], count: table === "leads" ? null : 2, error: table === "leads" ? {} : null }),
      });
    },
  }),
}));

it("uses equal reporting windows, excludes demo bookings, and keeps unknown counts distinct from zero", async () => {
  const pulse = await getBusinessPulse(new Date("2026-11-13T18:00:00Z"));
  expect(pulse.metrics[0].value).toBeNull();
  expect(queries.filter(({ table }) => table === "leads").map(({ calls }) => calls.slice(1))).toEqual([
    [["gte", "created_at", "2026-11-06T18:00:00.000Z"], ["lt", "created_at", "2026-11-13T18:00:00.000Z"]],
    [["gte", "created_at", "2026-10-30T18:00:00.000Z"], ["lt", "created_at", "2026-11-06T18:00:00.000Z"]],
  ]);
  for (const { calls } of queries.filter(({ table }) => table === "sched_bookings")) expect(calls).toContainEqual(["eq", "demo", false]);
  expect(queries.some(({ calls }) => calls.some((call) => call.join() === "lte,due_date,2026-11-14"))).toBe(true);
  for (const { calls } of queries.filter(({ table }) => table === "resource_events")) expect(calls).toContainEqual(["in", "resource_type", ["Guide", "Field Guide"]]);
  expect(pulse.attention.map(({ key }) => key)).toEqual(["failure"]);
});
