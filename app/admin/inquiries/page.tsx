import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import AdminShell from "@/app/components/admin/AdminShell";
import { listInquiries, type InquiryListItem } from "@/app/lib/inquiries/store";
import { inquiryStoreEnabled, retentionMonths } from "@/app/lib/inquiries/config";
import { PROGRAMS } from "@/app/lib/service-programs/catalog";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const OWNER_LABEL: Record<string, [string, string]> = {
  accepted: ["Notification sent", "text-[#1a1816]/60"],
  failed: ["Delivery failed", "text-[#6b1f1f] font-semibold"],
  pending: ["Not sent yet", "text-[#6b1f1f]"],
  sending: ["Sending", "text-[#1a1816]/60"],
};
const REPLY_LABEL: Record<string, string> = { accepted: "Reply sent", failed: "Reply failed", pending: "No reply sent", sending: "Sending" };
const programName = (slug: string | null) => (slug ? PROGRAMS.find((p) => p.slug === slug)?.name ?? slug : "No program chosen");
const when = (iso: string) => new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" });

/**
 * Read-only list of stored program inquiries (Phase 2a). Administrator only. A failed owner notification is shown plainly: the visitor was told it
 * did not go through, but the words are kept here so nothing is lost. Messages are removed automatically after the retention period.
 */
export default async function AdminInquiriesPage() {
  await requireAdmin();
  let rows: InquiryListItem[] = [];
  let unavailable = false;
  try { rows = await listInquiries(); } catch (e) { unavailable = true; console.error("Admin inquiries unavailable:", e instanceof Error ? e.message : e); }
  const failed = rows.filter((r) => r.owner_status !== "accepted").length;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-light">Inquiries</h1>
        <p className="max-w-xl text-sm text-[#1a1816]/60">
          {inquiryStoreEnabled() ? "New inquiries are being saved." : "Saving of new inquiries is switched off."} Messages are kept for up to {retentionMonths()} months, then removed; the person and the fact of contact stay.
        </p>
      </div>
      {unavailable ? (
        <p className="border border-[#1a1816]/15 bg-white px-5 py-4 text-sm text-[#1a1816]/70">Stored inquiries are not available yet. Nothing has been saved.</p>
      ) : rows.length === 0 ? (
        <p className="border border-[#1a1816]/15 bg-white px-5 py-4 text-sm text-[#1a1816]/70">No inquiries have been saved yet.</p>
      ) : (
        <>
          <p className={`mb-4 text-sm ${failed ? "text-[#6b1f1f]" : "text-[#1a1816]/60"}`}>{failed ? `${failed} ${failed === 1 ? "inquiry" : "inquiries"} without a delivered notification — open the message and reply to the sender directly.` : "Every saved inquiry reached you."}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#1a1816]/15 text-left text-xs uppercase tracking-widest text-[#1a1816]/50"><th className="py-3 pr-4">Received</th><th className="pr-4">Name</th><th className="pr-4">Program</th><th className="pr-4">Notification</th><th className="pr-4">Reply</th><th>Message</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const [label, tone] = OWNER_LABEL[r.owner_status] ?? [r.owner_status, ""];
                  return (
                    <tr key={r.id} className="border-b border-[#1a1816]/10 align-top">
                      <td className="py-3 pr-4 whitespace-nowrap">{when(r.created_at)}</td>
                      <td className="pr-4">{r.full_name}{r.email ? <><br /><a className="text-[#6b1f1f] underline" href={`mailto:${r.email}`}>{r.email}</a></> : null}</td>
                      <td className="pr-4">{programName(r.program_slug)}</td>
                      <td className={`pr-4 ${tone}`}>{label}{r.owner_status === "failed" && r.owner_error ? <><br /><span className="text-xs font-normal text-[#1a1816]/50">{r.owner_error}</span></> : null}</td>
                      <td className="pr-4 text-[#1a1816]/60">{REPLY_LABEL[r.auto_reply_status] ?? r.auto_reply_status}</td>
                      <td>
                        {r.message_purged_at ? <span className="text-[#1a1816]/40">Removed under the retention policy</span> : (
                          <details><summary className="cursor-pointer text-[#6b1f1f]">Read</summary><p className="mt-2 max-w-xl whitespace-pre-wrap text-[#1a1816]/80">{r.message}</p></details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
