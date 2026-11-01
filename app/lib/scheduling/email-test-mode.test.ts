import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const providerSend = vi.fn(async () => ({ data: { id: "re_test_1" }, error: null }));
vi.mock("resend", () => ({ Resend: class { emails = { send: providerSend }; } }));

import { evaluateEmailPolicy, SCHEDULING_TEST_RECIPIENT, schedulingTestModeActive } from "@/app/lib/email-policy";
import { ResendEmailProvider } from "./adapters/resend-email";
import { EmailSendError, createMockGoogleCalendar, createMockZoom } from "./providers";
import { buildSeedData } from "./seed";
import { SchedulingService } from "./service";
import { MemoryStore } from "./store";

/**
 * The development-only exception that lets MBA Scheduling's three transactional emails reach ONE developer address (and nobody else) through the
 * real policy and the real client, with the Resend package mocked: no real email is possible in this file. See email-policy.ts.
 */
const TEST = "martindubreuil13@gmail.com";
const DEV = { SCHEDULING_EMAIL_TEST_MODE: "true", NODE_ENV: "development" } as Record<string, string | undefined>;

describe("when the scheduling email test mode is active", () => {
  it("is on only for a local `next dev` server with the explicit flag", () => {
    expect(schedulingTestModeActive(DEV)).toBe(true);
    expect(schedulingTestModeActive({ ...DEV, APP_ENV: "development" })).toBe(true);
  });
  it("is off without the flag, and for any value other than exactly 'true'", () => {
    expect(schedulingTestModeActive({ NODE_ENV: "development" })).toBe(false);
    for (const v of ["", "1", "TRUE", "yes", "false", " true"]) expect(schedulingTestModeActive({ ...DEV, SCHEDULING_EMAIL_TEST_MODE: v })).toBe(false);
  });
  it("can never be activated in production, on Vercel in any environment, in preview, in a build, or under `next start`", () => {
    expect(schedulingTestModeActive({ ...DEV, APP_ENV: "production" })).toBe(false);          // a production deployment off Vercel
    expect(schedulingTestModeActive({ ...DEV, APP_ENV: "preview" })).toBe(false);
    for (const vercelEnv of ["production", "preview", "development", "anything"]) expect(schedulingTestModeActive({ ...DEV, VERCEL: "1", VERCEL_ENV: vercelEnv })).toBe(false);
    expect(schedulingTestModeActive({ ...DEV, VERCEL: "1" })).toBe(false);
    expect(schedulingTestModeActive({ ...DEV, VERCEL_ENV: "development" })).toBe(false);
    for (const nodeEnv of ["production", "test", undefined]) expect(schedulingTestModeActive({ SCHEDULING_EMAIL_TEST_MODE: "true", NODE_ENV: nodeEnv })).toBe(false);
  });
});

describe("the policy exception", () => {
  const sched = (to: string[], env = DEV) => evaluateEmailPolicy(to, env, "scheduling-transactional");
  it("allows exactly one recipient, the test address, for the scheduling purpose", () => {
    expect(sched([TEST])).toEqual({ allowed: true });
    expect(sched([`Martin <${TEST.toUpperCase()}>`])).toEqual({ allowed: true });                                  // display name and case do not matter
    expect(SCHEDULING_TEST_RECIPIENT).toBe(TEST);
  });
  it("refuses any other address, a list, a copy or blind copy, and an empty list", () => {
    expect(sched(["lead@example.com"]).allowed).toBe(false);
    expect(sched([TEST, "lead@example.com"]).allowed).toBe(false);
    expect(sched([TEST, TEST]).allowed).toBe(false);                                                               // even the same address twice: exactly one recipient in total
    expect(sched([]).allowed).toBe(false);
    expect(sched([`${TEST}.evil.com`]).allowed).toBe(false); expect(sched([`x${TEST}`]).allowed).toBe(false); expect(sched(["martindubreuil13+tag@gmail.com"]).allowed).toBe(false);
  });
  it("is not a general bypass: a caller without the scheduling purpose, such as the Transition and resource flows, is evaluated by the unchanged rules and still blocked", () => {
    expect(evaluateEmailPolicy([TEST], DEV).allowed).toBe(false);
    expect(evaluateEmailPolicy([TEST], DEV, undefined).allowed).toBe(false);
    expect(evaluateEmailPolicy(["lead@example.com"], DEV).allowed).toBe(false);
  });
  it("does nothing when the flag is off or the environment is not a local dev server", () => {
    expect(sched([TEST], { NODE_ENV: "development" }).allowed).toBe(false);
    expect(sched([TEST], { ...DEV, VERCEL_ENV: "preview" }).allowed).toBe(false);
    expect(sched([TEST], { ...DEV, APP_ENV: "preview" }).allowed).toBe(false);
  });
  it("leaves production exactly as it was (unrestricted: it never reaches the exception)", () => {
    expect(evaluateEmailPolicy(["anyone@example.com"], { VERCEL_ENV: "production", VERCEL: "1" }).allowed).toBe(true);
    expect(evaluateEmailPolicy(["anyone@example.com"], { VERCEL_ENV: "production", VERCEL: "1", SCHEDULING_EMAIL_TEST_MODE: "true" }).allowed).toBe(true);
  });
  it("leaves the existing admin-only rule untouched alongside it", () => {
    const admin = { ...DEV, PREVIEW_EMAIL_ENABLED: "true", PREVIEW_EMAIL_ALLOWLIST: "admin@example.com", ADMIN_EMAIL: "admin@example.com" };
    expect(evaluateEmailPolicy(["admin@example.com"], admin).allowed).toBe(true);
    expect(evaluateEmailPolicy(["lead@example.com"], admin).allowed).toBe(false);
  });
});

describe("the booking email provider, through the real policy and client (Resend mocked)", () => {
  const message = (to: string, kind = "confirmation") => ({ to, subject: "s", text: "t", idempotencyKey: `k-${to}-${kind}`, tags: { scheduling_booking: "b1", scheduling_kind: kind } });
  beforeEach(() => {
    providerSend.mockClear();
    for (const k of ["APP_ENV", "VERCEL", "VERCEL_ENV", "PREVIEW_EMAIL_ENABLED", "PREVIEW_EMAIL_ALLOWLIST", "ADMIN_EMAIL", "SCHEDULING_EMAIL_TEST_MODE"]) vi.stubEnv(k, "");
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("RESEND_API_KEY", "re_mock_key");
  });
  const testModeOn = () => vi.stubEnv("SCHEDULING_EMAIL_TEST_MODE", "true");

  it("without the flag, a non-production environment still sends nothing (the existing protection), and fails the send honestly", async () => {
    await expect(new ResendEmailProvider().send(message(TEST))).rejects.toBeInstanceOf(EmailSendError);
    expect(providerSend).not.toHaveBeenCalled();
  });
  it("in test mode, sends the real message to the test address only (one Resend call, with its idempotency key)", async () => {
    testModeOn();
    expect(await new ResendEmailProvider().send(message(TEST))).toEqual({ id: "re_test_1" });
    expect(providerSend).toHaveBeenCalledTimes(1);
    const [payload, options] = providerSend.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>];
    expect(payload).toMatchObject({ to: TEST }); expect(options).toEqual({ idempotencyKey: `k-${TEST}-confirmation` });
  });
  it("in test mode, any other recipient is simulated: the message never reaches Resend and is not reported as an error", async () => {
    testModeOn();
    for (const to of ["guest@example.com", "someone@gmail.com", TEST.replace("martin", "martin2")]) {
      const out = await new ResendEmailProvider().send(message(to));
      expect(out.simulated).toBe(true); expect(out.id).toMatch(/^suppressed_/);
    }
    expect(providerSend).not.toHaveBeenCalled();
  });
  it("refuses anything that is not a booking transactional message, in every mode (no marketing, no untagged mail)", async () => {
    testModeOn();
    for (const kind of ["marketing", "newsletter", "transition_invite", "", "Confirmation"]) await expect(new ResendEmailProvider().send(message(TEST, kind))).rejects.toBeInstanceOf(EmailSendError);
    await expect(new ResendEmailProvider().send({ to: TEST, subject: "s", text: "t", idempotencyKey: "k" })).rejects.toBeInstanceOf(EmailSendError);               // no tags at all
    await expect(new ResendEmailProvider().send({ ...message(TEST), tags: { scheduling_kind: "confirmation" } })).rejects.toBeInstanceOf(EmailSendError);        // no booking
    for (const to of [`${TEST}, other@example.com`, `${TEST};other@example.com`, `Martin <${TEST}>`, `${TEST} other@example.com`]) await expect(new ResendEmailProvider().send(message(to))).rejects.toBeInstanceOf(EmailSendError);
    expect(providerSend).not.toHaveBeenCalled();
  });
  it("the flag cannot restrict or enable anything in production: production delivery is unchanged", async () => {
    vi.stubEnv("VERCEL", "1"); vi.stubEnv("VERCEL_ENV", "production"); testModeOn();
    expect(new ResendEmailProvider().testMode).toBe(false);
    expect(await new ResendEmailProvider().send(message("real-guest@example.com"))).toEqual({ id: "re_test_1" });   // sent normally, NOT simulated
    expect(providerSend).toHaveBeenCalledTimes(1);
  });
  it("on a Vercel preview the flag does nothing and the existing block applies", async () => {
    vi.stubEnv("VERCEL", "1"); vi.stubEnv("VERCEL_ENV", "preview"); testModeOn();
    await expect(new ResendEmailProvider().send(message(TEST))).rejects.toBeInstanceOf(EmailSendError);
    expect(providerSend).not.toHaveBeenCalled();
  });
});

describe("a dry run of the three transactional messages (Resend mocked): what Martin would receive", () => {
  const NOW = Date.parse("2026-11-02T03:00:00Z");
  beforeEach(() => {
    providerSend.mockClear();
    for (const k of ["APP_ENV", "VERCEL", "VERCEL_ENV", "PREVIEW_EMAIL_ENABLED", "PREVIEW_EMAIL_ALLOWLIST", "ADMIN_EMAIL"]) vi.stubEnv(k, "");
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("RESEND_API_KEY", "re_mock_key"); vi.stubEnv("SCHEDULING_EMAIL_TEST_MODE", "true");
  });
  const build = async (ownerEmail?: string) => {
    const seed = await buildSeedData(NOW); seed.bookings = []; seed.meetingTypes = []; seed.settings.homeTimeZone = "Asia/Bangkok";
    const store = new MemoryStore(seed);
    const svc = new SchedulingService({ store, now: () => NOW, calendar: createMockGoogleCalendar({ homeTimeZone: () => "Asia/Bangkok", outage: () => false, pretendCommitments: false }), zoom: createMockZoom({ failing: () => false }), email: new ResendEmailProvider(), ownerEmail });
    await svc.saveMeetingType({ slug: "talk", name: "Discovery Conversation", description: "", durationMinutes: 30, visibility: "public", minNoticeHours: 0, maxPerDay: null, slotIntervalMinutes: 15, active: true, bufferAfterMinutes: 30,
      availability: { weekly: {}, breaks: [], daysOff: [], overrides: { "2026-11-04": [{ start: "09:00", end: "17:00" }], "2026-11-05": [{ start: "09:00", end: "17:00" }] }, bookingWindowDays: 90 } });
    return { svc, store };
  };
  const sent = () => (providerSend.mock.calls as unknown as Array<[Record<string, unknown>, Record<string, unknown>]>).map((c) => ({ payload: c[0], options: c[1] }));

  it("sends the confirmation, the reschedule notice and the cancellation to the test address, branded, in the guest's time zone, and nothing to anyone else", async () => {
    const { svc, store } = await build();
    const mine = await svc.createBooking({ slug: "talk", startUtc: "2026-11-04T07:00:00.000Z", guestName: "Martin Test", guestEmail: TEST, guestTimeZone: "Asia/Bangkok", idempotencyKey: "dry-run-key-1" });
    const other = await svc.createBooking({ slug: "talk", startUtc: "2026-11-04T09:00:00.000Z", guestName: "Someone Else", guestEmail: "someone@example.com", guestTimeZone: "Europe/London", idempotencyKey: "dry-run-key-2" });
    const id = (await store.read()).bookings.find((b) => b.reference === mine.booking.reference)!.id;
    await svc.rescheduleBooking(id, "2026-11-05T07:00:00.000Z");
    await svc.cancelBooking(id);
    const calls = sent();
    expect(calls).toHaveLength(3);                                                                                    // three messages, all to the one address
    expect(calls.every((c) => c.payload.to === TEST)).toBe(true);
    expect(calls.map((c) => c.options.idempotencyKey)).toEqual([`sched-email/${id}/confirmation/1`, `sched-email/${id}/reschedule/2`, `sched-email/${id}/cancellation/3`]);
    const [confirm, moved, canceled] = calls.map((c) => ({ subject: String(c.payload.subject), html: String(c.payload.html), text: String(c.payload.text) }));
    // branded shell, transactional only
    for (const m of [confirm, moved, canceled]) { expect(m.html).toContain("The Modern Business Architect"); expect(m.html).not.toMatch(/unsubscribe/i); expect(m.text).not.toMatch(/unsubscribe/i); }
    // confirmation: appointment details in the guest's zone and the Zoom button
    expect(confirm.text).toMatch(/Wednesday, November 4/); expect(confirm.text).toMatch(/2:00 PM/); expect(confirm.text).toMatch(/Bangkok|UTC\+07/);
    expect(confirm.html).toContain("JOIN ZOOM MEETING"); expect(confirm.text).toMatch(/https:\/\/\S+/);
    // reschedule: the new time and a Zoom button
    expect(moved.text).toMatch(/Thursday, November 5/); expect(moved.html).toContain("JOIN ZOOM MEETING");
    // cancellation: says so, and has no Zoom button
    expect(canceled.text).toMatch(/cancel/i); expect(canceled.html).not.toContain("JOIN ZOOM MEETING");
    expect(new Set([confirm.subject, moved.subject, canceled.subject]).size).toBe(3);
    // the other guest's messages were composed and recorded but never sent
    const attempts = (await store.read()).emailAttempts!.filter((a) => a.bookingId !== id);
    expect(attempts).toHaveLength(1); expect(attempts[0]).toMatchObject({ kind: "confirmation", status: "accepted", to: "someone@example.com" }); expect(attempts[0].providerMessageId).toMatch(/^suppressed_/);
    expect((await store.read()).outbox.some((m) => m.to === "someone@example.com" && m.simulated)).toBe(true);
    void other;
  });

  it("owner notifications go to the owner address only, as separate branded messages, through the same policy: guests other than the test address still get nothing", async () => {
    const { svc, store } = await build(TEST);
    const guest = await svc.createBooking({ slug: "talk", startUtc: "2026-11-04T09:00:00.000Z", guestName: "Someone Else", guestEmail: "someone@example.com", guestTimeZone: "Europe/London", idempotencyKey: "owner-dry-run-1" });
    const id = (await store.read()).bookings.find((b) => b.reference === guest.booking.reference)!.id;
    await svc.rescheduleBooking(id, "2026-11-05T07:00:00.000Z");
    await svc.cancelBooking(id);
    const calls = sent();
    expect(calls.every((c) => c.payload.to === TEST)).toBe(true);                                                     // the ONLY real recipient is the owner/test address
    expect(calls.map((c) => c.options.idempotencyKey)).toEqual([`sched-email/${id}/owner_new_booking/1`, `sched-email/${id}/owner_rescheduled/2`, `sched-email/${id}/owner_canceled/3`]);
    const [fresh, moved, gone] = calls.map((c) => ({ subject: String(c.payload.subject), html: String(c.payload.html), text: String(c.payload.text), replyTo: c.payload.replyTo }));
    expect(fresh.subject).toMatch(/^New booking: Someone Else, Discovery Conversation/); expect(moved.subject).toMatch(/^Rescheduled:/); expect(gone.subject).toMatch(/^Canceled:/);
    expect(fresh.replyTo).toBe("someone@example.com");                                                                // replying to the notification answers the guest
    expect(fresh.html).toContain("OPEN ZOOM MEETING"); expect(gone.html).not.toContain("ZOOM MEETING");
    for (const m of [fresh, moved, gone]) {
      expect(m.html).toContain("MBA Scheduling");                                                                      // the host's frame, not the guest's
      expect(m.html).not.toContain("You are receiving this message because you booked"); expect(m.html).not.toMatch(/unsubscribe/i);
    }
    expect(moved.text).toMatch(/Previous time: .*4:00 PM/); expect(moved.text).toMatch(/New time: .*Thursday, November 5/);
    // the guest's own three messages were composed and recorded but never delivered (not the test address)
    const guestAttempts = (await store.read()).emailAttempts!.filter((a) => a.bookingId === id && !a.kind.startsWith("owner_"));
    expect(guestAttempts.map((a) => a.kind)).toEqual(["confirmation", "reschedule", "cancellation"]);
    expect(guestAttempts.every((a) => a.to === "someone@example.com" && String(a.providerMessageId).startsWith("suppressed_"))).toBe(true);
  });
  it("outside test mode the owner address is not exempt: the standard policy blocks it and the failure is recorded, not hidden", async () => {
    vi.stubEnv("SCHEDULING_EMAIL_TEST_MODE", "");
    const { svc, store } = await build(TEST);
    const guest = await svc.createBooking({ slug: "talk", startUtc: "2026-11-04T09:00:00.000Z", guestName: "Someone Else", guestEmail: "someone@example.com", guestTimeZone: "Europe/London", idempotencyKey: "owner-dry-run-2" });
    expect(providerSend).not.toHaveBeenCalled();
    const attempts = (await store.read()).emailAttempts!.filter((a) => a.kind === "owner_new_booking");
    expect(attempts.length).toBeGreaterThan(0); expect(attempts.every((a) => a.status === "failed")).toBe(true);
    void guest;
  });
  it("tells the guest, in the page itself, that nothing was sent to them in test mode", async () => {
    const { svc } = await build();
    const { booking } = await svc.createBooking({ slug: "talk", startUtc: "2026-11-04T09:00:00.000Z", guestName: "Public Visitor", guestEmail: "visitor@example.com", guestTimeZone: "Europe/London", idempotencyKey: "dry-run-key-3" });
    expect(booking.notice).toMatch(/test mode/i); expect(providerSend).not.toHaveBeenCalled();
  });
});

describe("the safeguard cannot spread", () => {
  const ROOT = path.resolve(__dirname, "../../..");
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".") ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const files = walk(path.join(ROOT, "app")).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)).map((f) => ({ file: path.relative(ROOT, f), text: fs.readFileSync(f, "utf8") }));
  it("only the policy and the booking provider name the scheduling purpose (the shared client only passes a typed value through)", () => {
    expect(files.filter((f) => /scheduling-transactional/.test(f.text)).map((f) => f.file).sort()).toEqual(["app/lib/email-policy.ts", "app/lib/scheduling/adapters/resend-email.ts"]);
  });
  it("the test-mode policy is confined; the release guard may only forbid it in production", () => {
    expect(files.filter((f) => /SCHEDULING_EMAIL_TEST_MODE/.test(f.text)).map((f) => f.file)).toEqual(["app/lib/email-policy.ts", "app/lib/scheduling/release-gates.ts"]);
  });
  it("the allowlisted recipient is defined once, in the policy, and no other email code hard-codes an address", () => {
    expect(files.filter((f) => /SCHEDULING_TEST_RECIPIENT\s*=/.test(f.text)).map((f) => f.file)).toEqual(["app/lib/email-policy.ts"]);
    const emailCode = files.filter((f) => /^app\/lib\/(email-client|scheduling\/(sync|notifications|service|providers|adapters\/resend-email))\.ts$/.test(f.file));
    expect(emailCode.length).toBe(6);
    expect(emailCode.filter((f) => /@gmail\.com|@example\.com/.test(f.text)).map((f) => f.file)).toEqual([]);
    // The host's notification address is written down once, in its own file; everything else imports it.
    expect(files.filter((f) => /OWNER_NOTIFICATION_EMAIL\s*=/.test(f.text)).map((f) => f.file)).toEqual(["app/lib/scheduling/owner-address.ts"]);
  });
});
