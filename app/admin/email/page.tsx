import { contactTags, recipientCandidates } from "@/app/lib/contact-tags/data";
import { campaignHistory } from "@/app/lib/email-studio/campaign-history";
import AdminShell from "@/app/components/admin/AdminShell";
import EmailComposer from "@/app/components/admin/EmailComposer";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";

export const metadata = { robots: { index: false, follow: false } };

export default async function EmailStudioPage() {
  await requireAdmin();
  const db = getServiceClient();
  const storageOrigin = new URL(db.storage.from("resource-covers").getPublicUrl("newsletter").data.publicUrl).origin;
  const [contacts, tagData, audienceData, history] = await Promise.all([
    recipientCandidates().catch(() => null), contactTags().catch(() => null),
    db.from("email_saved_audiences").select("id,name,search_query,tag_ids").order("name").order("id"), campaignHistory(),
  ]);
  return <AdminShell>
    <h1 className="mb-5 font-serif text-4xl tracking-tight">Email Studio</h1>
    <EmailComposer storageOrigin={storageOrigin} recipients={{ contacts: contacts ?? [], tags: tagData?.tags ?? [], available: contacts !== null, tagsAvailable: tagData !== null, audiences: audienceData.error ? null : audienceData.data }} />
    <section className="mt-6 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5">
      <h2 className="font-serif text-2xl">Campaign history</h2>
      {!history ? <p>Campaign history is unavailable.</p> : !history.length ? <p>No campaigns sent yet.</p> :
        <ul className="divide-y divide-[#e6dcd4]">{history.map((row) => <li key={row.id} className="py-3">
          <strong>{row.subject}</strong> · {row.status}
          <p className="text-sm">{row.total} selected · {row.sent} accepted · {row.failed} failed · {row.excluded} excluded{row.pending > 0 && ` · ${row.pending} unconfirmed or unattempted`}</p>
          <p className="text-sm">Created {new Date(row.created).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} · Started {new Date(row.started).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} (Bangkok)</p>
        </li>)}</ul>}
    </section>
  </AdminShell>;
}
