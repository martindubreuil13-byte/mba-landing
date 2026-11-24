import { contactTags, recipientCandidates } from "@/app/lib/contact-tags/data";
import Link from "next/link";
import { isUuid } from "@/app/lib/relationships/model";
import { campaignDetails, campaignHistory } from "@/app/lib/email-studio/campaign-history";
import AdminShell from "@/app/components/admin/AdminShell";
import EmailComposer from "@/app/components/admin/EmailComposer";
import EmailStudio from "@/app/components/admin/EmailStudio";
import OutreachComposer from "@/app/components/admin/OutreachComposer";
import { listDrafts } from "@/app/lib/email-outreach/server";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";

export const metadata = { robots: { index: false, follow: false } };

export default async function EmailStudioPage({ searchParams }: { searchParams: Promise<{ duplicate?: string; mode?: string }> }) {
  await requireAdmin();
  const { duplicate, mode } = await searchParams;
  const source = duplicate && isUuid(duplicate) ? await campaignDetails(duplicate) : null;
  const db = getServiceClient();
  const storageOrigin = new URL(db.storage.from("resource-covers").getPublicUrl("newsletter").data.publicUrl).origin;
  const [contacts, tagData, audienceData, history, outreachDrafts] = await Promise.all([
    recipientCandidates().catch(() => null), contactTags().catch(() => null),
    db.from("email_saved_audiences").select("id,name,search_query,tag_ids").order("name").order("id"), campaignHistory(), listDrafts().catch(() => null),
  ]);
  return <AdminShell>
    <h1 className="mb-5 font-serif text-4xl tracking-tight">Email Studio</h1>
    {duplicate && <p className="mb-4 text-sm">{source?.editor_operations ? "Editing a copy. Select a new audience when ready." : "Editable source is unavailable for this campaign."}</p>}
    <EmailStudio initialMode={mode === "outreach" && !duplicate ? "outreach" : "newsletter"}
      newsletter={<EmailComposer key={duplicate ?? "compose"} draft={source?.editor_operations ? { subject: source.subject, previewText: source.preview_text, operations: source.editor_operations } : undefined} storageOrigin={storageOrigin} recipients={{ contacts: contacts ?? [], tags: tagData?.tags ?? [], available: contacts !== null, tagsAvailable: tagData !== null, audiences: audienceData.error ? null : audienceData.data }} />}
      outreach={<OutreachComposer contacts={contacts ?? []} available={contacts !== null} storageOrigin={storageOrigin} initialDrafts={outreachDrafts} />} />
    <section id="campaign-history" className="mt-6 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5">
      <h2 className="font-serif text-2xl">Campaign history</h2>
      {!history ? <p>Campaign history is unavailable.</p> : !history.length ? <p>No campaigns sent yet.</p> :
        <ul className="divide-y divide-[#e6dcd4]">{history.map((row) => <li key={row.id} className="py-3">
          <strong>{row.subject}</strong> · {row.status}{row.kind === "outreach" && <span className="ml-2 rounded-full border border-[#6b1f1f] px-2 py-0.5 text-xs text-[#6b1f1f]">Individual</span>}
          {row.kind === "outreach" && row.recipient && <p className="text-sm">To {row.recipient}</p>}
          <p className="text-sm">{row.kind === "outreach" ? `${row.sent ? "Accepted by provider" : row.failed ? "Failed" : row.excluded ? "Not sent: excluded" : "Unconfirmed"}` : `${row.total} selected · ${row.sent} accepted by provider · ${row.failed} failed · ${row.excluded} excluded${row.pending > 0 ? ` · ${row.pending} unconfirmed or unattempted` : ""}`}</p>
          <p className="text-sm">Created {new Date(row.created).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} · Started {new Date(row.started).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} (Bangkok)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <meter min={0} max={Math.max(row.sent, 1)} value={row.delivered} aria-label="Confirmed delivery out of provider acceptances" />
            <span>{row.delivered ? `${row.delivered} confirmed delivered` : "Delivery unconfirmed"}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#6b1f1f]">
            <Link className="underline" href={`/admin/email/campaigns/${row.id}`}>View Details</Link>
            {row.kind === "outreach" ? null : row.canDuplicate ? <Link className="underline" href={`/admin/email?duplicate=${row.id}`}>Duplicate</Link> : <span className="text-[#655951]">Duplicate unavailable</span>}
          </div>
        </li>)}</ul>}
    </section>
  </AdminShell>;
}
