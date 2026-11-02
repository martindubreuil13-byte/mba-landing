import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import AdminShell from "@/app/components/admin/AdminShell";
import EraseInquiryButton from "@/app/components/admin/EraseInquiryButton";
import { listJourney } from "@/app/lib/inquiries/journey";
import { inquiryStoreEnabled, retentionMonths } from "@/app/lib/inquiries/config";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const bookingTone = { ok: "text-[#2f5d3a]", bad: "text-[#6b1f1f]", hint: "text-[#1a1816]/55", none: "text-[#1a1816]/45" } as const;
const when = (iso: string) => new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" });

/**
 * One list for everyone who has written or applied: program inquiries and Corporate Transition applications, with what they are interested in, whether
 * you were told, and the booking status right now (booked, rescheduled, canceled). Administrator only. A failed notification is shown plainly: the visitor
 * was told it did not go through, but their words are kept here so nothing is lost.
 */
export default async function AdminInquiriesPage() {
  await requireAdmin();
  const { rows, notes } = await listJourney();
  const trouble = rows.filter((r) => r.contact.bad).length;
  const booked = rows.filter((r) => r.booking.tone === "ok").length;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-light">Inquiries &amp; applications</h1>
        <p className="max-w-xl text-sm text-[#1a1816]/60">
          {inquiryStoreEnabled() ? "New inquiries are being saved." : "Saving of new inquiries is switched off."} Inquiry messages are kept for up to {retentionMonths()} months, then removed; the person and the fact of contact stay.
        </p>
      </div>
      {notes.map((n) => <p key={n} className="mb-3 border border-[#1a1816]/15 bg-white px-5 py-3 text-sm text-[#1a1816]/70">{n}</p>)}
      {rows.length === 0 ? (
        <p className="border border-[#1a1816]/15 bg-white px-5 py-4 text-sm text-[#1a1816]/70">Nothing here yet.</p>
      ) : (
        <>
          <p className={`mb-4 text-sm ${trouble ? "text-[#6b1f1f]" : "text-[#1a1816]/60"}`}>
            {rows.length} in total, {booked} with a booking.{trouble ? ` ${trouble} ${trouble === 1 ? "needs" : "need"} attention: you were not told, or the invitation failed. Reply to the sender directly.` : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead><tr className="border-b border-[#1a1816]/15 text-left text-xs uppercase tracking-widest text-[#1a1816]/50"><th className="py-3 pr-4">Received</th><th className="pr-4">Who</th><th className="pr-4">Interest</th><th className="pr-4">Contact</th><th className="pr-4">Booking</th><th>Details</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-[#1a1816]/10 align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">{when(r.receivedAt)}</td>
                    <td className="pr-4">{r.name}{r.email ? <><br /><a className="text-[#6b1f1f] underline" href={`mailto:${r.email}`}>{r.email}</a></> : null}</td>
                    <td className="pr-4">{r.interest}</td>
                    <td className={`pr-4 ${r.contact.bad ? "font-semibold text-[#6b1f1f]" : "text-[#1a1816]/60"}`}>{r.contact.text}{r.contact.detail ? <><br /><span className="text-xs font-normal text-[#1a1816]/50">{r.contact.detail}</span></> : null}</td>
                    <td className={`pr-4 ${bookingTone[r.booking.tone]}`}>{r.booking.text}</td>
                    <td>
                      {r.kind === "application" ? <Link className="text-[#6b1f1f] underline" href={r.href!}>Open application →</Link> : r.messageRemoved ? <span className="text-[#1a1816]/40">Message removed under the retention policy</span> : (
                        <details><summary className="cursor-pointer text-[#6b1f1f]">Read message</summary><p className="mt-2 max-w-xl whitespace-pre-wrap text-[#1a1816]/80">{r.message}</p></details>
                      )}
                      {r.kind === "inquiry" ? <div className="mt-2"><EraseInquiryButton id={r.id} /></div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
