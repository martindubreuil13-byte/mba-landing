import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));

import { applyCalendlyEvent, parseCalendlyEvent, verifyCalendlySignature } from "./calendly";

const KEY = "signing-key-test";
const APP_A = "aaaaaaaa-0000-0000-0000-00000000000a";
const APP_B = "aaaaaaaa-0000-0000-0000-00000000000b";
const REF_A = "ref-AAAAAAAAAAAAAAAAAAAA";
const REF_B = "ref-BBBBBBBBBBBBBBBBBBBB";

const created = (invitee: string, ref: string | null, start = "2026-11-05T15:00:00.000000Z", extra: Record<string, unknown> = {}) => ({
  event: "invitee.created", created_at: "2026-10-30T12:00:01.000000Z",
  payload: { uri: `https://api.calendly.com/scheduled_events/E/invitees/${invitee}`, email: "someone@example.com", name: "Someone", status: "active", created_at: "2026-10-30T12:00:00.000000Z", rescheduled: false, old_invitee: null, tracking: { utm_content: ref, utm_source: "mba_transition" }, scheduled_event: { uri: "https://api.calendly.com/scheduled_events/E", start_time: start, end_time: "2026-11-05T15:30:00.000000Z" }, ...extra },
});
const canceled = (invitee: string, rescheduled = false) => ({
  event: "invitee.canceled", created_at: "2026-10-31T09:00:01.000000Z",
  payload: { uri: `https://api.calendly.com/scheduled_events/E/invitees/${invitee}`, status: "canceled", rescheduled, cancellation: { created_at: "2026-10-31T09:00:00.000000Z" }, tracking: { utm_content: null }, scheduled_event: { uri: "https://api.calendly.com/scheduled_events/E", start_time: "2026-11-05T15:00:00.000000Z", end_time: "2026-11-05T15:30:00.000000Z" } },
});
const apply = (body: unknown) => applyCalendlyEvent(parseCalendlyEvent(body)!);
const A = () => db.tables.program_applications.find((a) => a.id === APP_A)!;
const B = () => db.tables.program_applications.find((a) => a.id === APP_B)!;

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  for (const [id, ref] of [[APP_A, REF_A], [APP_B, REF_B]]) db.tables.program_applications.push({ id, booking_ref: ref, status: "INVITED", booking_status: "not_booked", booked_at: null, meeting_at: null });
});

describe("signature verification", () => {
  const body = JSON.stringify(created("I1", REF_A));
  const sign = (t: number, b = body, key = KEY) => `t=${t},v1=${createHmac("sha256", key).update(`${t}.${b}`).digest("hex")}`;
  const NOW = 1_800_000_000_000;
  const t = Math.floor(NOW / 1000);
  it("accepts a correctly signed, fresh body", () => expect(verifyCalendlySignature({ key: KEY, header: sign(t), rawBody: body, nowMs: NOW })).toBe(true));
  it("rejects a tampered body, the wrong key, a stale timestamp, and malformed or missing headers", () => {
    expect(verifyCalendlySignature({ key: KEY, header: sign(t), rawBody: body + " ", nowMs: NOW })).toBe(false);
    expect(verifyCalendlySignature({ key: KEY, header: sign(t, body, "other"), rawBody: body, nowMs: NOW })).toBe(false);
    expect(verifyCalendlySignature({ key: KEY, header: sign(t - 3600), rawBody: body, nowMs: NOW })).toBe(false);
    for (const h of [null, "", "t=abc,v1=zz", `t=${t}`, `v1=abcd`, `t=${t},v1=${"0".repeat(10)}`, `t=${t},v1=${"0".repeat(64)}`]) expect(verifyCalendlySignature({ key: KEY, header: h, rawBody: body, nowMs: NOW })).toBe(false);
  });
});

describe("parsing reads only opaque identifiers and times", () => {
  it("returns null for events and shapes the feature does not use", () => {
    for (const b of [null, {}, { event: "routing_form_submission.created", payload: {} }, { event: "invitee.created" }, { event: "invitee.created", payload: {} }]) expect(parseCalendlyEvent(b)).toBeNull();
  });
  it("extracts the invitee, ref and meeting time but never the name or email", () => {
    const e = parseCalendlyEvent(created("I1", REF_A))!;
    expect(e).toMatchObject({ kind: "created", ref: REF_A, startTime: "2026-11-05T15:00:00.000Z", bookedAt: "2026-10-30T12:00:00.000Z" });
    expect(JSON.stringify(e)).not.toMatch(/someone|example\.com/i);
  });
});

describe("10. bookings are matched to the correct applicant", () => {
  it("a booking carrying application A's ref marks A booked with the meeting time, and leaves B alone", async () => {
    expect(await apply(created("I1", REF_A))).toMatchObject({ matched: true, applicationId: APP_A });
    expect(A()).toMatchObject({ booking_status: "booked", status: "BOOKED", meeting_at: "2026-11-05T15:00:00.000Z", booked_at: "2026-10-30T12:00:00.000Z" });
    expect(B()).toMatchObject({ booking_status: "not_booked", status: "INVITED", meeting_at: null });
    expect(db.tables.program_bookings).toMatchObject([{ application_id: APP_A, status: "active", calendly_invitee_uri: expect.stringContaining("I1") }]);
  });
  it("a booking with an unknown ref, or no ref (booked from another page), matches nothing and stores nothing", async () => {
    for (const ref of ["ref-unknown-unknown-unk", null]) expect(await apply(created("IX" + ref, ref))).toEqual({ matched: false });
    expect(db.tables.program_bookings).toHaveLength(0);
    expect(A().booking_status).toBe("not_booked");
  });
  it("clicking the link proves nothing: with no webhook event, nobody is booked", () => {
    expect([A(), B()].map((a) => a.booking_status)).toEqual(["not_booked", "not_booked"]);
  });
});

describe("11. duplicate webhook events do not create duplicate records", () => {
  it("the same created event delivered three times (also concurrently) is one booking", async () => {
    await apply(created("I1", REF_A));
    await apply(created("I1", REF_A));
    await Promise.all([apply(created("I1", REF_A)), apply(created("I1", REF_A))]);
    expect(db.tables.program_bookings).toHaveLength(1);
    expect(A()).toMatchObject({ booking_status: "booked", meeting_at: "2026-11-05T15:00:00.000Z" });
  });
  it("a repeated cancellation is one cancellation", async () => {
    await apply(created("I1", REF_A));
    await apply(canceled("I1")); await apply(canceled("I1"));
    expect(db.tables.program_bookings).toHaveLength(1);
    expect(db.tables.program_bookings[0]).toMatchObject({ status: "canceled" });
  });
  it("a late or replayed 'created' never revives a cancelled booking", async () => {
    await apply(created("I1", REF_A)); await apply(canceled("I1")); await apply(created("I1", REF_A));
    expect(db.tables.program_bookings[0].status).toBe("canceled");
    expect(A()).toMatchObject({ booking_status: "not_booked", meeting_at: null });
  });
  it("a cancellation for an invitee this site never recorded is ignored, not guessed", async () => {
    // Cancellation payloads carry no tracking, so an unseen invitee cannot be matched to an application.
    expect(await apply(canceled("NEVER"))).toEqual({ matched: false });
    expect(db.tables.program_bookings).toHaveLength(0);
  });
});

describe("cancellations and reschedules are accurate internally", () => {
  it("cancelling returns the application to waiting for a booking", async () => {
    await apply(created("I1", REF_A));
    await apply(canceled("I1"));
    expect(A()).toMatchObject({ booking_status: "not_booked", status: "INVITED", meeting_at: null, booked_at: null });
    expect(db.tables.program_bookings[0]).toMatchObject({ status: "canceled", rescheduled: false, canceled_at: "2026-10-31T09:00:00.000Z" });
  });
  it("rescheduling: the old invitee is cancelled as 'rescheduled', the new one is matched even if Calendly dropped the tracking, and the meeting date moves", async () => {
    await apply(created("I1", REF_A, "2026-11-05T15:00:00.000000Z"));
    await apply(canceled("I1", true));
    const newer = created("I2", null, "2026-11-12T16:00:00.000000Z", { old_invitee: "https://api.calendly.com/scheduled_events/E/invitees/I1", rescheduled: true });
    expect(await apply(newer)).toMatchObject({ matched: true, applicationId: APP_A });
    expect(A()).toMatchObject({ booking_status: "booked", status: "BOOKED", meeting_at: "2026-11-12T16:00:00.000Z" });
    expect(db.tables.program_bookings.map((b) => [b.status, b.rescheduled])).toEqual([["canceled", true], ["active", false]]);
  });
  it("the order created(new) then canceled(old) gives the same result", async () => {
    await apply(created("I1", REF_A, "2026-11-05T15:00:00.000000Z"));
    await apply(created("I2", null, "2026-11-12T16:00:00.000000Z", { old_invitee: "https://api.calendly.com/scheduled_events/E/invitees/I1" }));
    await apply(canceled("I1", true));
    expect(A()).toMatchObject({ booking_status: "booked", meeting_at: "2026-11-12T16:00:00.000000Z".replace(".000000Z", ".000Z") });
  });
  it("does not disturb an application that was declined or marked not-a-fit", async () => {
    A().status = "DECLINED";
    await apply(created("I1", REF_A));
    expect(A()).toMatchObject({ status: "DECLINED", booking_status: "booked" });
    await apply(canceled("I1"));
    expect(A().status).toBe("DECLINED");
  });
});
