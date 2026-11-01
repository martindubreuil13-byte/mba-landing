import { describe, expect, it } from "vitest";
import { needsAttention, recoveryOf, workerState, zoomAwaited, type BookingRow } from "./admin-views";
import { OWNER_RETRY_NOTE } from "./constants";

const NOW = Date.parse("2031-03-01T12:00:00Z");
const MIN = 60_000;
const b = (sync: { status: "ok" | "pending" | "failed"; attempts: number; nextAttemptAt: string | null; lastError?: string | null }, createdAt = new Date(NOW - MIN).toISOString()) =>
  ({ sync: { lastError: null, ...sync }, createdAt });

describe("the recovery status an administrator sees for a booking", () => {
  it("is 'ok' only when everything is synchronised (and for bookings that never had a sync state)", () => {
    expect(recoveryOf(b({ status: "ok", attempts: 0, nextAttemptAt: null }), NOW).state).toBe("ok");
    expect(recoveryOf({ createdAt: new Date(NOW).toISOString() }, NOW).state).toBe("ok");
  });
  it("a booking that is fully synchronised but waits only to retry the host's own notification is 'ok', not 'syncing' or 'retrying'", () => {
    const r = recoveryOf(b({ status: "pending", attempts: 0, nextAttemptAt: new Date(NOW + 5 * MIN).toISOString(), lastError: OWNER_RETRY_NOTE }), NOW);
    expect(r).toEqual({ state: "ok", label: "Up to date · host notification will be retried" });
    expect(needsAttention({ status: "confirmed", recovery: r, conflict: false })).toBe(false);
  });
  it("is 'syncing' while the first attempt is fresh, and says nothing alarming", () => {
    expect(recoveryOf(b({ status: "pending", attempts: 0, nextAttemptAt: null }), NOW)).toEqual({ state: "syncing", label: "Syncing…" });
    expect(recoveryOf(b({ status: "pending", attempts: 0, nextAttemptAt: new Date(NOW - 2 * MIN).toISOString() }), NOW).state).toBe("syncing");
  });
  it("becomes 'stuck' when it has been due for over five minutes: the recovery worker is not picking it up", () => {
    expect(recoveryOf(b({ status: "pending", attempts: 0, nextAttemptAt: new Date(NOW - 6 * MIN).toISOString() }), NOW)).toEqual({ state: "stuck", label: "Waiting for the recovery worker" });
    expect(recoveryOf(b({ status: "pending", attempts: 0, nextAttemptAt: null }, new Date(NOW - 10 * MIN).toISOString()), NOW).state).toBe("stuck");   // never scheduled, created long ago
  });
  it("is 'retrying' with the attempt count after a failure, and 'failed' once it has given up", () => {
    expect(recoveryOf(b({ status: "pending", attempts: 3, nextAttemptAt: new Date(NOW + 30 * MIN).toISOString() }), NOW)).toEqual({ state: "retrying", label: "Retrying · attempt 3" });
    expect(recoveryOf(b({ status: "failed", attempts: 8, nextAttemptAt: null, lastError: "zoom: down" }), NOW)).toEqual({ state: "failed", label: "Needs attention · gave up" });
  });
});

describe("which bookings need attention", () => {
  const row = (state: BookingRow["recovery"]["state"], over: Partial<Pick<BookingRow, "status" | "conflict">> = {}) => ({ status: "confirmed" as const, conflict: false, ...over, recovery: { state, label: state } });
  it("includes failed, retrying and stuck bookings, and conflicts on live bookings", () => {
    for (const s of ["failed", "retrying", "stuck"] as const) expect(needsAttention(row(s))).toBe(true);
    expect(needsAttention(row("ok", { conflict: true }))).toBe(true);
  });
  it("leaves healthy and merely-syncing bookings alone; a canceled booking's old conflict no longer matters", () => {
    expect(needsAttention(row("ok"))).toBe(false); expect(needsAttention(row("syncing"))).toBe(false);
    expect(needsAttention(row("ok", { status: "canceled", conflict: true }))).toBe(false);
  });
  it("still flags a CANCELED booking whose external cleanup has not finished (an orphan may remain)", () => {
    expect(needsAttention(row("failed", { status: "canceled" }))).toBe(true);
    expect(needsAttention(row("retrying", { status: "canceled" }))).toBe(true);
  });
});

describe("whether the recovery worker is alive", () => {
  it("never / ok / stale, by the age of the last sweep", () => {
    expect(workerState(null, NOW)).toEqual({ state: "never", ageSeconds: null });
    expect(workerState(new Date(NOW - 45_000).toISOString(), NOW)).toEqual({ state: "ok", ageSeconds: 45 });
    expect(workerState(new Date(NOW - 300_000).toISOString(), NOW).state).toBe("ok");
    expect(workerState(new Date(NOW - 301_000).toISOString(), NOW).state).toBe("stale");
    expect(workerState(new Date(NOW + 5_000).toISOString(), NOW).ageSeconds).toBe(0);                 // a clock a little ahead is not an error
  });
});

describe("whether an administrator is still waiting for a Zoom link", () => {
  const zoom = (status: "pending" | "ready" | "failed" | "simulated") => ({ status, meetingId: null, joinUrl: null });
  it("waits for a confirmed booking whose link is pending", () => {
    expect(zoomAwaited({ status: "confirmed", zoom: zoom("pending") })).toBe(true);
    expect(zoomAwaited({ status: "confirmed", zoom: zoom("ready") })).toBe(false);
  });
  it("never waits for a canceled booking, whose meeting was deleted or never needed (the stored provider history stays 'pending'/'deleted')", () => {
    expect(zoomAwaited({ status: "canceled", zoom: zoom("pending") })).toBe(false);
    expect(zoomAwaited({ status: "canceled", zoom: zoom("failed") })).toBe(false);
  });
});
