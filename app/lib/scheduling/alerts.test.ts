import { describe, expect, it, vi } from "vitest";
import { buildSeedData } from "./seed";
import { createMockGoogleCalendar, createMockZoom, createSimulatedEmail } from "./providers";
import { OWNER_NOTIFICATION_EMAIL } from "./owner-address";
import { ALERT_REMIND_MS, alertFindings, composeAlert, decideAlert } from "./alerts";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";

/** Stage G: unattended alerting. Mocks only; nothing is delivered. */
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t(), NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json" } }) } }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));
const instance = vi.hoisted(() => ({ svc: null as unknown }));
vi.mock("@/app/lib/scheduling/instance", () => ({ getScheduling: () => instance.svc }));

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const MIN = 60_000;

async function fx() {
  const clock = { now: NOW };
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const email = createSimulatedEmail();
  const zoomState = { failing: false };
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => zoomState.failing }), email, now: () => clock.now, defer: () => {}, adminUrl: "https://example.test/admin/scheduling/bookings" });
  const t = await svc.saveMeetingType({ slug: "talk-alert", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  const book = async (hhmm = "10:00") => { const { booking } = await svc.createBooking({ slug: t.slug, startUtc: `${DAY}T${hhmm}:00Z`, guestName: "Private Guest", guestEmail: "private.guest@example.test", guestTimeZone: "UTC", idempotencyKey: `alert-key-${hhmm}-12345` }); return (await svc.repo.getBookingByReference(booking.reference))!; };
  // The worker's heartbeat: "healthy" means a fresh sweep with fresh scans.
  const beat = () => svc.repo.recordSweep(new Date(clock.now).toISOString(), { reconciled: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0, conflictsFlagged: 0, conflictScanAt: new Date(clock.now).toISOString(), zoomScanAt: new Date(clock.now).toISOString() });
  const alerts = () => email.sent.filter((m) => m.tags?.scheduling_kind === "operational_alert");
  return { svc, email, clock, zoomState, book, beat, alerts, advance: (ms: number) => { clock.now += ms; } };
}

describe("when the owner is told", () => {
  it("stays silent while everything is healthy", async () => {
    const f = await fx(); await f.beat();
    expect(await f.svc.checkAlerts()).toEqual({ findings: 0, sent: null });
    expect(f.alerts()).toHaveLength(0);
  });

  it("announces a stalled worker once, not on every check, reminds after six hours, and announces recovery once", async () => {
    const f = await fx(); await f.beat();
    f.advance(10 * MIN);                                           // the worker stopped: its last sweep is ten minutes old
    expect((await f.svc.checkAlerts()).sent).toBe("alert");
    expect(f.alerts()).toHaveLength(1);
    for (let i = 0; i < 5; i++) { f.advance(5 * MIN); expect((await f.svc.checkAlerts()).sent).toBeNull(); }
    expect(f.alerts()).toHaveLength(1);
    f.advance(ALERT_REMIND_MS);
    expect((await f.svc.checkAlerts()).sent).toBe("alert");
    expect(f.alerts()).toHaveLength(2);
    await f.beat();
    expect((await f.svc.checkAlerts()).sent).toBe("recovered");
    expect((await f.svc.checkAlerts()).sent).toBeNull();
    expect(f.alerts()).toHaveLength(3);
    expect(f.alerts()[2].subject).toMatch(/recovered/);
  });

  it("reports an overdue scan only while the worker is running, so one cause is one alert", async () => {
    const f = await fx(); await f.beat();
    f.advance(30 * MIN);
    await f.svc.repo.recordSweep(new Date(f.clock.now).toISOString(), { reconciled: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0, conflictsFlagged: 0, conflictScanAt: new Date(NOW).toISOString(), zoomScanAt: new Date(NOW).toISOString() });
    const running = alertFindings({ bookings: [], pulse: await f.svc.repo.getLastSweep(), bouncedUpcoming: 0, now: f.clock.now }).map((x) => x.code);
    expect(running).toEqual(["zoom-scan-overdue", "calendar-scan-overdue"]);
    const stalled = alertFindings({ bookings: [], pulse: await f.svc.repo.getLastSweep(), bouncedUpcoming: 0, now: f.clock.now + 30 * MIN }).map((x) => x.code);
    expect(stalled).toEqual(["worker-stalled"]);
  });

  it("announces a changed problem straight away, even inside the reminder period", async () => {
    const f = await fx(); await f.beat();
    f.advance(10 * MIN);
    await f.svc.checkAlerts();
    const b = await f.book();
    await f.svc.repo.finishSync(b.id, { status: "failed", attempts: 8, nextAttemptAt: null, lastError: "x" });
    f.advance(MIN);
    expect((await f.svc.checkAlerts()).sent).toBe("alert");
    expect(f.alerts()[1].text).toMatch(/stopped synchronising/);
  });

  it("reports an uncertain Zoom creation, an appointment about to start without a link, and a bounced guest email", async () => {
    const f = await fx(); await f.beat();
    const b = await f.book();
    f.advance(1000);
    await f.beat();
    const bookings = await f.svc.repo.listBookings();
    const pulse = await f.svc.repo.getLastSweep();
    const base = { bookings, pulse, bouncedUpcoming: 0, now: f.clock.now };
    const none = alertFindings(base);
    expect(none.map((x) => x.code)).not.toContain("zoom-uncertain");
    const uncertain = bookings.map((x) => (x.id === b.id ? { ...x, zoom: { ...x.zoom, uncertainSince: new Date(f.clock.now).toISOString() } } : x));
    expect(alertFindings({ ...base, bookings: uncertain }).map((x) => x.code)).toContain("zoom-uncertain");
    expect(alertFindings({ ...base, bouncedUpcoming: 2 }).map((x) => x.code)).toContain("email-bounced");
    const soon = bookings.map((x) => ({ ...x, startUtc: new Date(f.clock.now + 3_600_000).toISOString() }));
    expect(alertFindings({ ...base, bookings: soon }).map((x) => x.code)).toContain("no-zoom-link");
  });

  it("looks at bounced guest email of upcoming bookings only, and the owner's own messages never count", async () => {
    const f = await fx();
    const b = await f.book();
    await f.svc.sync.run(b.id);
    await f.beat();
    const attempts = await f.svc.repo.listEmailAttempts(b.id);
    const guest = attempts.find((a) => a.kind === "confirmation")!;
    await f.svc.repo.setEmailDelivery(guest.providerMessageId!, "bounced", new Date(f.clock.now).toISOString());
    const r = await f.svc.checkAlerts();
    expect(r.sent).toBe("alert");
    expect(f.alerts()[0].text).toMatch(/bounced or failed/);
  });

  it("never puts a guest's details, a booking reference or an id in the message, and sends only to the approved owner address", async () => {
    const f = await fx(); await f.beat();
    const b = await f.book();
    await f.svc.repo.finishSync(b.id, { status: "failed", attempts: 8, nextAttemptAt: null, lastError: "private.guest@example.test exploded" });
    f.advance(10 * MIN);
    await f.svc.checkAlerts();
    const m = f.alerts()[0];
    expect(m.to).toBe(OWNER_NOTIFICATION_EMAIL);
    const everything = `${m.subject}\n${m.text}`;
    for (const needle of ["Private Guest", "private.guest", b.reference, b.id, "exploded"]) expect(everything).not.toContain(needle);
    expect(m.text).toContain("https://example.test/admin/scheduling/bookings");
  });

  it("does not record an alert as sent when sending it failed, so the next check tries again", async () => {
    const f = await fx(); await f.beat();
    f.advance(10 * MIN);
    f.email.failing = true;
    await expect(f.svc.checkAlerts()).rejects.toThrow();
    expect((await f.svc.repo.getAlertState()).signature).toBe("");
    f.email.failing = false;
    f.advance(5 * MIN);
    expect((await f.svc.checkAlerts()).sent).toBe("alert");
    expect(f.alerts()).toHaveLength(1);
  });

  it("says so, and sends nothing, when the email provider cannot deliver alerts", async () => {
    const f = await fx(); await f.beat();
    const { alert: _alert, ...plain } = f.email; void _alert;
    const svc = new SchedulingService({ store: new MemoryStore(await buildSeedData(NOW)), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email: plain as never, now: () => f.clock.now + 10 * MIN, defer: () => {} });
    expect(await svc.checkAlerts()).toMatchObject({ sent: null, unavailable: true });
  });

  it("a retry of the same notice within the period cannot send it twice (the provider key is stable)", async () => {
    const f = await fx(); await f.beat();
    f.advance(10 * MIN);
    await f.svc.checkAlerts();
    await f.svc.repo.setAlertState("", new Date(f.clock.now).toISOString());     // as if the state write had been lost after the send
    f.advance(MIN);
    await f.svc.checkAlerts();
    expect(f.alerts()).toHaveLength(1);                                           // same key: the provider returns the first message
  });
});

describe("the decision rule", () => {
  const F = (...codes: string[]) => codes.map((code) => ({ code, text: code }));
  const at = (ms: number) => new Date(ms).toISOString();
  it("alerts for a new problem, a changed set and a standing problem past the reminder period only", () => {
    expect(decideAlert(F("a"), { signature: "", sentAt: null }, NOW)).toBe("alert");
    expect(decideAlert(F("a"), { signature: "a", sentAt: at(NOW - MIN) }, NOW)).toBeNull();
    expect(decideAlert(F("a", "b"), { signature: "a", sentAt: at(NOW - MIN) }, NOW)).toBe("alert");
    expect(decideAlert(F("b", "a"), { signature: "a,b", sentAt: at(NOW - MIN) }, NOW)).toBeNull();
    expect(decideAlert(F("a"), { signature: "a", sentAt: at(NOW - ALERT_REMIND_MS) }, NOW)).toBe("alert");
  });
  it("announces recovery only after a problem was announced", () => {
    expect(decideAlert([], { signature: "a", sentAt: at(NOW) }, NOW)).toBe("recovered");
    expect(decideAlert([], { signature: "", sentAt: at(NOW) }, NOW)).toBeNull();
  });
  it("words the subject for the most serious case plainly", () => {
    expect(composeAlert("alert", F("worker-stalled"), null, NOW).subject).toMatch(/recovery worker stalled/);
    expect(composeAlert("alert", F("sync-failed", "no-zoom-link"), null, NOW).subject).toMatch(/2 issues/);
  });
});

describe("the alert job's route", () => {
  it("answers 401 without the recovery bearer, 404 when operations are off, and counts only when authorised", async () => {
    const f = await fx(); await f.beat(); instance.svc = f.svc;
    vi.stubEnv("SCHEDULING_PROTOTYPE", "true"); vi.stubEnv("VERCEL", "");
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET", "r".repeat(40));
    const { GET } = await import("@/app/api/cron/scheduling-alert/route");
    expect((await GET(new Request("http://localhost/api/cron/scheduling-alert"), {})).status).toBe(401);
    const ok = await GET(new Request("http://localhost/api/cron/scheduling-alert", { headers: { authorization: `Bearer ${"r".repeat(40)}` } }), {});
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true, findings: 0, sent: null });
    vi.stubEnv("SCHEDULING_PROTOTYPE", "");
    expect((await GET(new Request("http://localhost/api/cron/scheduling-alert", { headers: { authorization: `Bearer ${"r".repeat(40)}` } }), {})).status).toBe(404);
    vi.unstubAllEnvs();
  });
});
