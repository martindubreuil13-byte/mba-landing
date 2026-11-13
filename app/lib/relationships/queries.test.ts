import { expect, it, vi } from "vitest";
import { automationExceptions, relationshipEvents } from "./queries";

const { tables } = vi.hoisted(() => ({ tables: new Map<string, object[]>() }));
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/inquiries/store", () => ({ OWNER_CLAIM_STALE_MS: 120_000 }));
vi.mock("@/app/lib/supabase/service", () => ({
  getServiceClient: () => ({
    from(table: string) {
      let rows = tables.get(table) ?? [];
      const query = {
        select: () => query,
        order: () => query,
        limit: () => query,
        or: () => query,
        eq(column: string, value: unknown) {
          rows = rows.filter((row) => !Object.hasOwn(row, column) || Reflect.get(row, column) === value);
          return query;
        },
        in(column: string, values: unknown[]) {
          rows = rows.filter((row) => values.includes(Reflect.get(row, column)));
          return query;
        },
        then: (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null }),
      };
      return query;
    },
  }),
}));

it("includes verified booking history and excludes mismatched parents and unlinked records", async () => {
  tables.clear();
  tables.set("program_inquiries", [{ id: "inquiry", lead_id: "lead", created_at: "2026-11-10" }]);
  tables.set("booking_origins", [
    { booking_id: "linked", lead_id: "lead", inquiry_id: "inquiry" },
    { booking_id: "conflicting", lead_id: "lead", inquiry_id: "other-inquiry" },
  ]);
  tables.set("sched_bookings", ["linked", "conflicting", "unlinked"].map((id) => ({
    id, demo: false, created_at: "2026-11-11", start_at: "2026-11-12", canceled_at: "2026-11-13",
  })));
  const history = await relationshipEvents("lead");
  expect(history[0].href).toBe("/admin/inquiries?inquiry=inquiry#inquiry:inquiry");
  expect(history[1].href).toBeNull();
  expect(history.map((event) => event.title)).toEqual(["Inquiry received", "Appointment booked", "Appointment canceled"]);
});

it("records later recovery and excludes previous booking versions", async () => {
  tables.clear();
  tables.set("sched_email_attempts", [
    { id: "success", booking_id: "recovered", kind: "confirmation", version: 2, status: "accepted", attempted_at: "2026-11-14", sched_bookings: { version: 2 } },
    { id: "old", booking_id: "recovered", kind: "confirmation", version: 2, status: "failed", attempted_at: "2026-11-13", sched_bookings: { version: 2 } },
    { id: "earlier-version", booking_id: "changed", kind: "confirmation", version: 1, status: "failed", attempted_at: "2026-11-13", sched_bookings: { version: 2 } },
    { id: "terminal", booking_id: "pending", kind: "confirmation", version: 2, status: "accepted", delivery_status: "bounced", attempted_at: "2026-11-13", sched_bookings: { version: 2 } },
  ]);
  const states = Object.fromEntries((await automationExceptions()).map((item) => [item.key, item.state]));
  expect(states).toEqual({ "mail:terminal": "Action Required", "mail:success": "Resolved" });
});

it("keeps a late bounce actionable when a newer attempt was only accepted before the bounce", async () => {
  tables.clear();
  tables.set("sched_email_attempts", [
    { id: "new", booking_id: "booking", kind: "confirmation_resend", version: 2, status: "accepted", attempted_at: "2026-11-13T10:00:00Z", sched_bookings: { version: 2 } },
    { id: "old", booking_id: "booking", kind: "confirmation_resend", version: 2, status: "accepted", attempted_at: "2026-11-13T09:00:00Z", delivery_status: "bounced", delivery_updated_at: "2026-11-13T11:00:00Z", sched_bookings: { version: 2 } },
  ]);
  expect(await automationExceptions()).toMatchObject([{ key: "mail:old", state: "Action Required" }]);
});
