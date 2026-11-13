import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, ListTodo } from "lucide-react";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import RelationshipForm from "@/app/components/admin/RelationshipForm";
import AdminShell from "@/app/components/admin/AdminShell";
import EraseInquiryButton from "@/app/components/admin/EraseInquiryButton";
import { listJourney } from "@/app/lib/inquiries/journey";
import { inquiryStoreEnabled, retentionMonths } from "@/app/lib/inquiries/config";
import { reviewInquiry } from "@/app/lib/relationships/actions";
import { isReviewState, isUuid, REVIEW_LABELS, workspaceStamp } from "@/app/lib/relationships/model";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<{ view?: string; inquiry?: string }> }) {
  await requireAdmin();
  const { view, inquiry } = await searchParams;
  const selected = inquiry && isUuid(inquiry) ? inquiry : undefined;
  const { rows, notes, timeZone = "Asia/Bangkok" } = await listJourney(200, undefined, selected);
  const booked = rows.filter((row) => row.booking.tone === "ok").length;
  const trouble = rows.filter((row) => row.contact.bad && row.contact.text !== "Not sent yet").length;
  const filtered = rows.filter((row) => view === "follow_up" ? row.reviewState === "follow_up"
    : view === "new" ? row.kind === "inquiry" && (row.reviewState ?? "new") === "new" : true);

  return (
    <AdminShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <h1 className="text-3xl font-light sm:text-4xl">Inquiries &amp; applications</h1>
        <nav aria-label="Relationship workspace" className="flex flex-wrap gap-4 text-sm text-[#6b1f1f]">
          <Link className="inline-flex items-center gap-2 hover:underline" href="/admin/inquiries/tasks"><ListTodo size={17} aria-hidden /> Follow-ups</Link>
          <Link className="inline-flex items-center gap-2 hover:underline" href="/admin/inquiries/exceptions"><CircleAlert size={17} aria-hidden /> Automation exceptions</Link>
        </nav>
      </header>
      <nav aria-label="Filter inquiries" className="mb-6 flex flex-wrap gap-2">
        {[["all", "All activity"], ["follow_up", "Follow-up needed"], ["new", "New inquiries"]].map(([key, label]) => {
          const current = (view ?? "all") === key;
          return <Link key={key} aria-current={current ? "page" : undefined}
            href={key === "all" ? "/admin/inquiries" : "/admin/inquiries?view=" + key}
            className={current ? "rounded-full bg-[#6b1f1f] px-4 py-2 text-sm text-white" : "rounded-full border border-[#6b1f1f]/20 px-4 py-2 text-sm hover:bg-white"}>{label}</Link>;
        })}
      </nav>
      {notes.map((note) => <p key={note} className="mb-4 rounded-xl border bg-white p-4 text-sm" role="status">{note}</p>)}
      {rows.length > 0 && <p className="mb-4 text-sm text-black/65">{rows.length} in total, {booked} with a booking{trouble > 0 && ` · ${trouble} needs attention`}</p>}
      {filtered.length === 0 && <p className="rounded-2xl border border-black/10 bg-white p-6 text-sm">{selected ? "This inquiry is unavailable." : rows.length ? "No matching activity." : "Nothing here yet."}</p>}
      <ul className="grid gap-4 lg:grid-cols-2">
        {filtered.map((row) => (
          <li key={row.key} id={row.key} className="min-w-0 rounded-2xl border border-[#6b1f1f]/10 bg-white p-5 shadow-sm motion-safe:transition-shadow hover:shadow-md">
            <time className="text-xs text-black/60" dateTime={row.receivedAt}>{workspaceStamp(row.receivedAt, timeZone)}</time>
            <h2 className="mt-1 break-words text-xl">{row.name}</h2>
            <p className="mt-1 text-sm text-black/65">{row.interest}</p>
            {row.leadId && <Link href={"/admin/leads/" + row.leadId + (row.kind === "inquiry" ? "?inquiry=" + row.id : "")} className="mt-3 inline-flex items-center gap-1 text-sm text-[#6b1f1f] hover:underline">Open contact <ArrowUpRight size={15} aria-hidden /></Link>}
            {row.email && <a href={"mailto:" + row.email} className="mt-1 block break-all text-sm hover:underline">{row.email}</a>}
            <dl className="my-4 grid gap-3 border-t border-black/10 pt-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-black/60">Booking</dt><dd>{row.booking.text}</dd></div>
              <div><dt className="text-xs text-black/60">Notification</dt><dd>{row.contact.text}</dd>{row.contact.detail && <dd className="break-words text-xs text-black/60">{row.contact.detail}</dd>}</div>
            </dl>
            {row.kind === "application" && row.href && <Link href={row.href} className="text-sm text-[#6b1f1f] hover:underline">Open application</Link>}
            {row.kind === "inquiry" && <>
              <details className="mb-4 text-sm">
                <summary className="cursor-pointer text-[#6b1f1f]">Review · {REVIEW_LABELS[isReviewState(row.reviewState) ? row.reviewState : "new"]} <span className="underline">Change</span></summary>
                <RelationshipForm action={reviewInquiry} success="Review status saved." className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={row.id} />
                <label className="grid gap-1 text-xs">Review status
                  <select name="state" defaultValue={isReviewState(row.reviewState) ? row.reviewState : "new"} className="rounded-lg border border-black/20 bg-white p-2 text-sm">
                    {Object.entries(REVIEW_LABELS).map(([state, label]) => <option key={state} value={state}>{label}</option>)}
                  </select>
                </label>
                <button className="rounded-lg border border-[#6b1f1f]/20 px-3 py-2 text-sm text-[#6b1f1f] hover:bg-[#6b1f1f]/5">Save</button>
              </RelationshipForm>
              </details>
              <details className="text-sm">
                <summary className="cursor-pointer text-[#6b1f1f]">Inquiry details</summary>
                <p className="mt-2 whitespace-pre-wrap break-words">{row.messageRemoved ? "Message removed under the retention policy." : row.message}</p>
                <EraseInquiryButton id={row.id} />
              </details>
            </>}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-black/60">{inquiryStoreEnabled() ? "New inquiries are being saved." : "Saving new inquiries is switched off."} Messages are retained for up to {retentionMonths()} months. Showing recent activity.</p>
    </AdminShell>
  );
}
