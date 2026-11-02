/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "@/app/components/admin/AdminShell";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listApplications } from "@/app/lib/programs/queries";
import { INVITATION_LABELS, listInvitationSends, summarizeInvitation, type InvitationSend } from "@/app/lib/programs/invitation";
import { formatDateTimeUtc } from "@/app/lib/programs/format";
import { originStates } from "@/app/lib/scheduling/adapters/booking-origin";
import { describeBooking } from "@/app/lib/inquiries/journey";
export const metadata: Metadata = { robots: { index: false, follow: false } }; export const dynamic = "force-dynamic";
const tile = (label: string, value: string | number) => <div className="border border-[#1a1816]/10 bg-white px-5 py-4"><p className="text-2xl font-light">{value}</p><p className="mt-1 text-xs uppercase tracking-widest text-[#1a1816]/50">{label}</p></div>;
const tone: Record<string, string> = { Sent: "text-[#1a1816]", Resent: "text-[#1a1816]", Failed: "font-semibold text-[#8b2525]", Pending: "text-[#1a1816]/55" };
const bookingTone = { ok: "font-semibold text-[#2f5d3a]", bad: "text-[#8b2525]", hint: "text-[#1a1816]/55", none: "text-[#1a1816]/45" } as const;

export default async function Page() {
  await requireAdmin();
  const apps: any[] = await listApplications();
  const sends = apps.length ? await listInvitationSends(apps.map((a) => a.id)) : [];
  const byApp = new Map<string, InvitationSend[]>();
  for (const s of sends) byApp.set(s.application_id, [...(byApp.get(s.application_id) ?? []), s]);
  // What each application's booking is NOW, read from the booking records (a cancellation or a new time shows by itself).
  const states = apps.length ? await originStates({ inquiryIds: [], applicationIds: apps.map((a) => a.id), emails: apps.map((a) => String(a.answers?.email ?? "")) }).catch(() => null) : null;

  const rows = apps.map((a) => {
    const legacy = !a.booking_ref; // submitted before the direct-booking flow: it never had a booking invitation
    const inv = legacy ? null : INVITATION_LABELS[summarizeInvitation(byApp.get(a.id) ?? []).state];
    const email = String(a.answers?.email ?? "").trim().toLowerCase();
    const booking = states ? describeBooking(states.linked.get(`application:${a.id}`) ?? [], states.byEmail.get(email) ?? [], states.timeZone) : { text: "—", tone: "none" as const };
    return { a, inv, booking };
  });
  const invitationsOut = rows.filter((r) => r.inv === "Sent" || r.inv === "Resent").length;
  const failed = rows.filter((r) => r.inv === "Failed").length;
  const booked = rows.filter((r) => r.booking.tone === "ok").length;
  const needReply = apps.filter((a) => a.status === "UNDER_REVIEW").length;

  return <AdminShell>
    <p className="text-xs uppercase tracking-widest text-[#1a1816]/45">Programs</p>
    <h1 className="mt-2 text-3xl font-light">Corporate Transition</h1>
    <div className="my-8 grid grid-cols-2 gap-4 md:grid-cols-4">{tile("Applications", apps.length)}{tile("Invitations sent", invitationsOut)}{tile("Invitation failed", failed)}{tile("Booked", booked)}</div>
    {needReply > 0 && <p role="note" className="mb-6 border border-[#1a1816]/15 bg-white px-4 py-3 text-sm text-[#1a1816]/70">{needReply} earlier {needReply === 1 ? "application is" : "applications are"} still waiting for a personal reply (submitted before direct booking). Open {needReply === 1 ? "it" : "each"} to respond.</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
      <thead><tr className="border-b border-[#1a1816]/15 text-left text-xs uppercase tracking-widest text-[#1a1816]/50"><th className="py-3">Name</th><th>Country</th><th>Submitted</th><th>Invitation</th><th>Booking</th><th></th></tr></thead>
      <tbody>{rows.map(({ a, inv, booking }) => <tr key={a.id} className="border-b border-[#1a1816]/10">
        <td className="py-4">{a.answers.firstName} {a.answers.lastName}</td>
        <td>{a.answers.country || "—"}</td>
        <td>{formatDateTimeUtc(a.submitted_at)}</td>
        <td className={inv ? tone[inv] : "text-[#1a1816]/45"}>{inv ?? "Earlier flow"}</td>
        <td className={bookingTone[booking.tone]}>{booking.text}</td>
        <td><Link className="text-[#6b1f1f] underline" href={`/admin/programs/corporate-transition/${a.id}`}>Open →</Link></td>
      </tr>)}</tbody>
    </table>{!apps.length && <p className="py-10 text-[#1a1816]/50">No applications yet.</p>}</div>
  </AdminShell>;
}
