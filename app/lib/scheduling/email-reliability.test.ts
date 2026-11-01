import { describe, expect, it, vi } from "vitest";
import { buildSeedData } from "./seed";
import { createMockGoogleCalendar, createMockZoom, EmailAlreadyAcceptedError, EmailOutcomeUnknownError, EmailSendError, type EmailProvider, type OutgoingEmail } from "./providers";
import { ResendEmailProvider } from "./adapters/resend-email";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";

/** Stage G email reliability: a worker that dies between the provider accepting a message and the ledger recording it. Mocks only. */
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (t: () => unknown) => t() }));

const NOW = Date.parse("2031-02-20T12:00:00Z");
const DAY = "2031-02-21";
const HOUR = 3_600_000;

/** Behaves like Resend's idempotency: the same key within 24 h returns the first message (and 409s on a different payload); after 24 h the key is forgotten. */
function resendLike(clock: { now: number }) {
  const seen = new Map<string, { id: string; payload: string; at: number }>();
  const delivered: Array<{ to: string; subject: string; key: string }> = [];
  const provider: EmailProvider & { delivered: typeof delivered; timeoutAfterAccept: number } = {
    simulated: true, delivered, timeoutAfterAccept: 0,
    async send(m: OutgoingEmail) {
      const payload = JSON.stringify([m.to, m.subject, m.text, m.content]);
      const prior = seen.get(m.idempotencyKey);
      if (prior && clock.now - prior.at < 24 * HOUR) {
        if (prior.payload !== payload) throw new EmailAlreadyAcceptedError("invalid_idempotent_request");
        return { id: prior.id };
      }
      const id = `msg_${delivered.length + 1}`;
      seen.set(m.idempotencyKey, { id, payload, at: clock.now });
      delivered.push({ to: m.to, subject: m.subject, key: m.idempotencyKey });
      if (provider.timeoutAfterAccept > 0) { provider.timeoutAfterAccept--; throw new EmailOutcomeUnknownError("timed out waiting for the provider"); }
      return { id };
    },
  };
  return provider;
}

async function fx(o: { zoomDown?: boolean } = {}) {
  const clock = { now: NOW };
  const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "UTC";
  const zoomState = { failing: !!o.zoomDown };
  const email = resendLike(clock);
  const svc = new SchedulingService({ store: new MemoryStore(seed), calendar: createMockGoogleCalendar({ homeTimeZone: () => "UTC", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => zoomState.failing }), email, now: () => clock.now, defer: () => {} });
  const t = await svc.saveMeetingType({ slug: "talk-mail", name: "Talk", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 0, bufferBeforeMinutes: 0,
    availability: { weekly: {}, breaks: [], daysOff: [], overrides: { [DAY]: [{ start: "06:00", end: "20:00" }] }, bookingWindowDays: 365 } });
  const { booking } = await svc.createBooking({ slug: t.slug, startUtc: `${DAY}T10:00:00Z`, guestName: "Guest", guestEmail: "guest@example.test", guestTimeZone: "UTC", idempotencyKey: "mail-key-123456" });
  // A worker that dies after the provider accepted the message but before the ledger row: the accepted record is lost, and so is the failure record.
  let dies = 0;
  const repo = svc.repo, record = repo.recordEmailAttempt.bind(repo);
  repo.recordEmailAttempt = async (a) => {
    if (dies > 0 && a.status === "accepted") { dies--; throw new Error("process died"); }
    if (dies === 0 && a.status === "failed" && a.error === "process died") return { recorded: false };
    return record(a);
  };
  const id = (await repo.getBookingByReference(booking.reference))!.id;
  return { svc, email, clock, zoomState, repo, id, die: () => { dies = 1; }, attempts: () => repo.listEmailAttempts(id), advance: (ms: number) => { clock.now += ms; } };
}
const guestKinds = (f: Awaited<ReturnType<typeof fx>>) => f.email.delivered.filter((d) => d.to === "guest@example.test");

describe("a worker that dies between the provider accepting a message and the ledger recording it", () => {
  it("sends the guest one message when the retry carries the same content", async () => {
    const f = await fx();
    f.die();
    await f.svc.sync.run(f.id).catch(() => undefined);
    expect(guestKinds(f)).toHaveLength(1);
    f.advance(2 * 60_000);
    await f.svc.sync.run(f.id);
    expect(guestKinds(f)).toHaveLength(1);
    expect((await f.attempts()).filter((a) => a.kind === "confirmation" && a.status === "accepted")).toHaveLength(1);
  });

  it("heals the ledger from the provider's own answer even when the retry's content has changed in the meantime", async () => {
    const f = await fx({ zoomDown: true });
    f.die();
    await f.svc.sync.run(f.id).catch(() => undefined);           // the guest got "your link will follow", the ledger lost it
    expect(guestKinds(f)).toHaveLength(1);
    f.zoomState.failing = false;                                  // the booking now has a Zoom link, so the same confirmation would read differently
    f.advance(2 * 60_000);
    await f.svc.sync.run(f.id);
    f.advance(30 * 60_000);
    await f.svc.sync.run(f.id);
    expect(guestKinds(f).filter((d) => d.key.includes("/confirmation/"))).toHaveLength(1);
    const accepted = (await f.attempts()).filter((a) => a.kind === "confirmation" && a.status === "accepted");
    expect(accepted).toHaveLength(1);
    expect(accepted[0].includedZoom).toBe(false);
    // The guest was told the link would follow, and the recovered record must not hide that: the link still goes out, once.
    expect(guestKinds(f).filter((d) => d.key.includes("/zoom_details/"))).toHaveLength(1);
    await f.svc.sync.run(f.id);
    expect(guestKinds(f)).toHaveLength(2);
  });

  it("holds, instead of resending, a message whose earlier outcome is unknown once the provider's duplicate protection is about to expire", async () => {
    const f = await fx();
    f.email.timeoutAfterAccept = 1;                               // the provider accepted it; the answer never arrived
    await f.svc.sync.run(f.id);
    expect(guestKinds(f)).toHaveLength(1);
    expect((await f.attempts()).some((a) => a.status === "accepted")).toBe(false);
    f.advance(30 * HOUR);                                         // recovery was down for more than a day
    for (let i = 0; i < 3; i++) { f.advance(13 * HOUR); await f.svc.sync.run(f.id); await f.svc.retrySync(f.id).catch(() => undefined); }
    expect(guestKinds(f).filter((d) => d.key.includes("/confirmation/"))).toHaveLength(1);
    const held = await f.svc.sync.run(f.id);
    expect(held.errors.join()).toMatch(/duplicate protection has expired/);
  });

  it("still retries an ordinary refusal (the provider definitely did not send it) at any age", async () => {
    const f = await fx();
    const real = f.email.send.bind(f.email);
    let refuse = true;
    f.email.send = async (m) => { if (refuse) throw new EmailSendError("Email provider refused the message: invalid address"); return real(m); };
    await f.svc.sync.run(f.id);
    expect(guestKinds(f)).toHaveLength(0);
    refuse = false;
    f.advance(48 * HOUR);
    await f.svc.sync.run(f.id);
    expect(guestKinds(f).filter((d) => d.key.includes("/confirmation/"))).toHaveLength(1);
  });

  it("a retry within the window is deduplicated by the provider and recorded, with no second message", async () => {
    const f = await fx();
    f.email.timeoutAfterAccept = 1;
    await f.svc.sync.run(f.id);
    f.advance(5 * 60_000);
    await f.svc.sync.run(f.id);
    expect(guestKinds(f)).toHaveLength(1);
    expect((await f.attempts()).filter((a) => a.kind === "confirmation" && a.status === "accepted")).toHaveLength(1);
  });

  it("a ledger write that fails after the provider accepted is not counted as sent, and the next try does not send a second copy", async () => {
    const f = await fx();
    const record = f.repo.recordEmailAttempt.bind(f.repo);
    let n = 0;
    f.repo.recordEmailAttempt = async (a) => { if (a.status === "accepted" && n++ === 0) throw new Error("database unavailable"); return record(a); };
    await f.svc.sync.run(f.id);
    f.advance(5 * 60_000);
    await f.svc.sync.run(f.id);
    expect(guestKinds(f)).toHaveLength(1);
    expect((await f.attempts()).filter((a) => a.kind === "confirmation" && a.status === "accepted")).toHaveLength(1);
  });
});

describe("the Resend adapter's reading of the provider's answer", () => {
  const msg: OutgoingEmail = { to: "guest@example.test", subject: "s", text: "t", idempotencyKey: "k", tags: { scheduling_booking: "b1", scheduling_kind: "confirmation" } };
  const via = (answer: () => unknown) => new ResendEmailProvider({ from: "A <a@mindrasolutions.com>", replyTo: "a@mindrasolutions.com", env: {}, resend: { emails: { send: async () => answer() } } as never });
  it("returns the message id on success", async () => {
    expect(await via(() => ({ data: { id: "re_1" }, error: null })).send(msg)).toEqual({ id: "re_1" });
  });
  it("reads 'key used with a different payload' as already accepted", async () => {
    await expect(via(() => ({ data: null, error: { name: "invalid_idempotent_request", statusCode: 409, message: "different payload" } })).send(msg)).rejects.toMatchObject({ name: "EmailAlreadyAcceptedError" });
  });
  it("reads a missing status, a server error, an in-flight duplicate, an empty reply and a thrown network error as unknown outcomes", async () => {
    for (const answer of [
      () => ({ data: null, error: { name: "application_error", statusCode: null, message: "fetch failed" } }),
      () => ({ data: null, error: { name: "internal_server_error", statusCode: 500, message: "oops" } }),
      () => ({ data: null, error: { name: "concurrent_idempotent_requests", statusCode: 409, message: "in progress" } }),
      () => ({ data: null, error: null }),
      () => { throw new TypeError("network down"); },
    ]) await expect(via(answer).send(msg)).rejects.toMatchObject({ name: "EmailOutcomeUnknownError" });
  });
  it("reads a validation error or a rate limit as a definite refusal", async () => {
    for (const statusCode of [400, 422, 429]) await expect(via(() => ({ data: null, error: { name: "validation_error", statusCode, message: "no" } })).send(msg)).rejects.toMatchObject({ name: "EmailSendError" });
  });
});
