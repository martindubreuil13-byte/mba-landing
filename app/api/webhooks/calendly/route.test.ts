import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeDb } from "@/app/lib/test/fake-supabase";

const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));

import { POST } from "./route";

const KEY = "signing-key-test";
const APP = "aaaaaaaa-0000-0000-0000-00000000000a";
const REF = "ref-AAAAAAAAAAAAAAAAAAAA";
const body = JSON.stringify({ event: "invitee.created", created_at: "2026-10-30T12:00:01Z", payload: { uri: "https://api.calendly.com/scheduled_events/E/invitees/I1", status: "active", created_at: "2026-10-30T12:00:00Z", tracking: { utm_content: REF }, scheduled_event: { uri: "u", start_time: "2026-11-05T15:00:00Z", end_time: "2026-11-05T15:30:00Z" } } });
const signed = (b = body, key = KEY, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac("sha256", key).update(`${t}.${b}`).digest("hex")}`;
const post = (b: string, sig: string | null) => POST(new Request("http://localhost/api/webhooks/calendly", { method: "POST", headers: sig ? { "calendly-webhook-signature": sig } : {}, body: b }));

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  db.tables.program_applications.push({ id: APP, booking_ref: REF, status: "INVITED", booking_status: "not_booked" });
  vi.stubEnv("CALENDLY_WEBHOOK_SIGNING_KEY", KEY);
});

describe("POST /api/webhooks/calendly", () => {
  it("without CALENDLY_WEBHOOK_SIGNING_KEY it refuses everything: nothing is ever marked booked on faith", async () => {
    vi.stubEnv("CALENDLY_WEBHOOK_SIGNING_KEY", "");
    expect((await post(body, signed())).status).toBe(503);
    expect(db.tables.program_bookings).toHaveLength(0);
  });
  it("rejects a missing, forged or wrong-key signature and records nothing", async () => {
    for (const sig of [null, "t=1,v1=00", signed(body, "other-key"), signed(body + "x")]) expect((await post(body, sig)).status).toBe(401);
    expect(db.tables.program_bookings).toHaveLength(0);
    expect(db.tables.program_applications[0].booking_status).toBe("not_booked");
  });
  it("a verified event marks the matching application booked; a repeat is acknowledged as a duplicate", async () => {
    const r1 = await post(body, signed());
    expect(r1.status).toBe(200);
    expect(await r1.json()).toEqual({ ok: true, duplicate: false });
    expect(db.tables.program_applications[0]).toMatchObject({ booking_status: "booked", meeting_at: "2026-11-05T15:00:00.000Z" });
    expect(await (await post(body, signed())).json()).toEqual({ ok: true, duplicate: true });
    expect(db.tables.program_bookings).toHaveLength(1);
  });
  it("unrelated event types and unmatched bookings are acknowledged and ignored", async () => {
    const other = JSON.stringify({ event: "routing_form_submission.created", payload: {} });
    expect(await (await post(other, signed(other))).json()).toEqual({ ignored: true });
    const stranger = body.replace(REF, "ref-someone-else-entirely-x");
    expect(await (await post(stranger, signed(stranger))).json()).toEqual({ ignored: true });
    expect(db.tables.program_bookings).toHaveLength(0);
  });
  it("invalid JSON with a valid signature is a 400; a database failure is a 500 so Calendly retries", async () => {
    expect((await post("not json", signed("not json"))).status).toBe(400);
    db.failNextInsertInto = "program_bookings";
    expect((await post(body, signed())).status).toBe(500);
  });
});
