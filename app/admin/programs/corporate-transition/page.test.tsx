/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/app/components/admin/AdminShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/lib/supabase/admin-session", () => ({ requireAdmin: async () => ({ email: "martin@example.com" }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import { FakeDb } from "@/app/lib/test/fake-supabase";
const db = new FakeDb();
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => db.client() }));

import ListPage from "./page";
import DetailPage from "./[id]/page";
import { formatDateTimeUtc } from "@/app/lib/programs/format";

const app = (id: string, over: Record<string, unknown> = {}) => ({ id, lead_id: "l", program_key: "corporate-transition", status: "INVITED", booking_status: "not_booked", booking_ref: "ref-" + id, submitted_at: "2026-10-30T14:05:00.000Z", meeting_at: null, answers: { firstName: "Elena", lastName: "Test", email: "elena@example.com", country: "Spain", employment: "Other", experience: "20+ years", stage: "s", timing: "t", motivation: "m", help: "h" }, attribution: {}, ai_route: null, ...over });
const send = (applicationId: string, over: Record<string, unknown> = {}) => ({ id: Math.random().toString(), application_id: applicationId, kind: "initial", status: "accepted", provider_message_id: "msg_1", error: null, delivery_status: null, attempted_at: "2026-10-30T14:05:10.000Z", ...over });
const html = async (page: Promise<React.ReactElement>) => renderToStaticMarkup(await page);
const text = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

beforeEach(() => {
  for (const k of Object.keys(db.tables)) db.tables[k] = [];
  vi.stubEnv("CALENDLY_WEBHOOK_SIGNING_KEY", "");
});

describe("8. admin list: name, country, submitted, invitation, Calendly, meeting date", () => {
  it("shows the six fields, and a new application is not shown as awaiting approval", async () => {
    db.tables.program_applications.push(app("a1"));
    db.tables.program_invitation_sends.push(send("a1"));
    const out = text(await html(ListPage()));
    for (const h of ["Name", "Country", "Submitted", "Invitation", "Calendly", "Meeting date"]) expect(out).toContain(h);
    expect(out).toContain("Elena Test"); expect(out).toContain("Spain"); expect(out).toContain("Oct 30, 2026, 14:05 UTC");
    expect(out).toMatch(/Elena Test Spain .* Sent /);
    expect(out).not.toMatch(/Under review|needs review|awaiting approval|Route|confidence/i);
  });
  it.each([
    ["no attempt yet", [], "Pending"],
    ["accepted", [send("a1")], "Sent"],
    ["refused", [send("a1", { status: "failed", error: "x", provider_message_id: null })], "Failed"],
    ["accepted then bounced", [send("a1", { delivery_status: "bounced" })], "Failed"],
    ["resent", [send("a1"), send("a1", { kind: "resend", attempted_at: "2026-10-31T10:00:00.000Z" })], "Resent"],
  ])("invitation %s -> %s", async (_n, sends, label) => {
    db.tables.program_applications.push(app("a1"));
    db.tables.program_invitation_sends.push(...(sends as any[]));
    expect(text(await html(ListPage()))).toMatch(new RegExp(`Elena Test Spain [^|]*? ${label} `));
  });
  it("Calendly: 'Not connected' (never 'Pending') until the webhook is configured; Pending after; Booked with the meeting date only from a recorded booking", async () => {
    db.tables.program_applications.push(app("a1"), app("a2", { booking_status: "booked", status: "BOOKED", meeting_at: "2026-11-05T15:00:00.000Z", answers: { ...app("a2").answers, firstName: "Booked" } }));
    db.tables.program_invitation_sends.push(send("a1"), send("a2"));
    let out = text(await html(ListPage()));
    expect(out).toMatch(/Elena Test Spain .*? Sent Not connected —/);
    expect(out).toMatch(/Booked Test Spain .*? Sent Booked Nov 5, 2026, 15:00 UTC/);
    expect(out).toContain("Automatic booking tracking is not connected");
    vi.stubEnv("CALENDLY_WEBHOOK_SIGNING_KEY", "k");
    out = text(await html(ListPage()));
    expect(out).toMatch(/Elena Test Spain .*? Sent Pending —/);
    expect(out).not.toContain("Automatic booking tracking is not connected");
  });
  it("applications from before this flow are labelled as such, not as Pending", async () => {
    db.tables.program_applications.push(app("old", { booking_ref: null, booking_status: "unsupported", status: "UNDER_REVIEW", ai_route: "REVIEW" }));
    const out = text(await html(ListPage()));
    expect(out).toContain("Earlier flow");
    expect(out).toContain("1 earlier application is still waiting for a personal reply");
  });
});

describe("admin detail", () => {
  it("shows the answers, invitation attempts with the Resend message ID, the Resend button, and Calendly state", async () => {
    db.tables.program_applications.push(app("a1"));
    db.tables.program_invitation_sends.push(send("a1"), send("a1", { kind: "resend", status: "failed", error: "provider refused", provider_message_id: null, attempted_at: "2026-10-31T10:00:00.000Z" }));
    const out = text(await html(DetailPage({ params: Promise.resolve({ id: "a1" }) })));
    for (const v of ["Motivation", "Wants help with", "Resend message ID msg_1", "First send", "Resend ·", "provider refused", "Resend invitation", "Not connected"]) expect(out).toContain(v);
    expect(out).toMatch(/Status Sent/);
    expect(out).not.toContain("Earlier assessment");
  });
  it("keeps the earlier assessment for historical applications, and no Resend button once booked", async () => {
    db.tables.program_applications.push(app("a1", { ai_route: "NOT_FIT", ai_confidence: "HIGH", ai_pre_call_summary: "summary here", booking_status: "booked", status: "BOOKED", meeting_at: "2026-11-05T15:00:00.000Z", booked_at: "2026-10-30T12:00:00.000Z" }));
    db.tables.program_bookings.push({ id: "b1", application_id: "a1", status: "canceled", rescheduled: true, start_time: "2026-11-01T15:00:00.000Z", canceled_at: "2026-10-31T09:00:00.000Z" }, { id: "b2", application_id: "a1", status: "active", rescheduled: false, start_time: "2026-11-05T15:00:00.000Z", booked_at: "2026-10-31T09:00:01.000Z" });
    const out = text(await html(DetailPage({ params: Promise.resolve({ id: "a1" }) })));
    expect(out).toContain("Earlier assessment (historical)"); expect(out).toContain("summary here");
    expect(out).not.toContain("Resend invitation");
    expect(out).toContain("Meeting date Nov 5, 2026, 15:00 UTC");
    expect(out).toContain("Rescheduled (moved to a new time)"); expect(out).toContain("Booked · meeting Nov 5");
  });
});

describe("formatDateTimeUtc", () => {
  it("is explicit about the zone and never throws", () => {
    expect(formatDateTimeUtc("2026-10-30T14:05:00.000Z")).toBe("Oct 30, 2026, 14:05 UTC");
    expect(formatDateTimeUtc(null)).toBe("—"); expect(formatDateTimeUtc("garbage")).toBe("—");
  });
});
