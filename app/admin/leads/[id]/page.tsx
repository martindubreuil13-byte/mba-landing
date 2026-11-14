import EmailPreferences from "@/app/components/admin/EmailPreferences";
import { ArchiveContact, EditContact } from "@/app/components/admin/ContactProfileActions";
import RelationshipForm from "@/app/components/admin/RelationshipForm";
import { updateContactLifecycle } from "@/app/lib/contact-tags/actions";
import { lifecycleLabel, lifecycleLabels } from "@/app/lib/contact-tags/lifecycle";
import ContactTags from "@/app/components/admin/ContactTags";
import { contactTags } from "@/app/lib/contact-tags/data";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getLeadDetailAdmin, type ActivityEvent } from "@/app/lib/leads/admin-queries";
import { businessTimeZone, listTasks, relationshipEvents } from "@/app/lib/relationships/queries";
import { FollowUpForm, TaskList } from "@/app/components/admin/RelationshipTasks";
import { inquiryHref, isUuid, workspaceStamp, workspaceToday } from "@/app/lib/relationships/model";
import AdminShell from "@/app/components/admin/AdminShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<ActivityEvent["kind"], string> = {
  inquiry: "Inquiry",
  application: "Application",
  booking: "Appointment",
  consent: "Consent",
  resource: "Resource",
  napkin: "Napkin Principle",
  reality_check: "Reality Check",
  pmb: "Pick My Brain",
  opt_in: "Shortlist",
  opt_out: "Shortlist",
};

export default async function AdminLeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ inquiry?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const detail = await getLeadDetailAdmin(id);
  if (!detail) notFound();

  const { lead, row } = detail;
  const profile = { id, firstName: lead.first_name, lastName: lead.last_name ?? "", email: lead.email, archived: Boolean(lead.contact_archived_at) };
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;
  const timeZone = await businessTimeZone();
  const [{ inquiry }, linked, tasks, tagData] = await Promise.all([searchParams, relationshipEvents(id, timeZone), listTasks(id), contactTags(id).catch(() => null)]);
  const selectedInquiry = inquiry && linked.some((event) => event.href === inquiryHref(inquiry)) ? inquiry : undefined;
  const timeline = [...detail.timeline.filter((event) => event.kind !== "pmb" &&
    (!linked.some((item) => item.kind === "consent") || !["opt_in", "opt_out"].includes(event.kind) || event.title === "Lead created")), ...linked]
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <AdminShell>
      <Link href="/admin/leads" className="text-xs tracking-widest uppercase text-[#1a1816]/50 hover:text-[#1a1816]">
        ← All contacts
      </Link>

      <div className="flex items-start justify-between gap-6 flex-wrap mt-6 mb-6 rounded-3xl border border-[#e6dcd4] bg-[#fffcf9] p-6 shadow-sm">
        <div>
          <h1 className="break-words font-serif text-4xl">{name}</h1>
          <p className="text-[#1a1816]/60 text-sm mt-1">
            <a href={`mailto:${lead.email}`} className="hover:text-[#6b1f1f]">
              {lead.email}
            </a>
            {lead.country ? ` — ${lead.country}` : ""}
          </p>
          <EditContact contact={profile} />
          {profile.archived && <p className="mt-2 text-sm text-[#6b1f1f]">Archived</p>}
        </div>
        <div className="text-sm sm:text-right">
          <p>
            <span className="text-[#1a1816]/50">Shortlisted: </span>
            {row.shortlisted ? <span className="text-green-700">Yes</span> : <span className="text-[#1a1816]/40">No</span>}
          </p>
          <p className="mt-1 text-[#1a1816]/50">Acquired via {row.acquired_through}</p>
        </div>
      </div>

      <EmailPreferences id={id} email={lead.email} archived={profile.archived} />

      <section className="mb-5 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-4 shadow-sm">
        <h2 className="font-serif text-xl">Lifecycle · {lifecycleLabel(lead.contact_lifecycle, lead.lead_status)}</h2>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-[#6b1f1f]">Change status</summary>
          <RelationshipForm action={updateContactLifecycle} success="Lifecycle status saved." className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="lead" value={id} />
            <label className="grid gap-1 text-sm">Lifecycle status
              <select name="status" required defaultValue={lead.contact_lifecycle ?? ""} className="rounded-lg border border-[#daccc1] bg-white px-3 py-2">
                <option value="" disabled>Choose a status</option>
                {Object.entries(lifecycleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <button className="rounded-lg bg-[#6b1f1f] px-3 py-2 text-sm text-white">Save status</button>
          </RelationshipForm>
        </details>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{row.resource_count}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Resources</p>
        </div>
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{row.napkin_count}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Napkin Principle</p>
        </div>
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{row.reality_check_count}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Reality Check</p>
        </div>
      </div>

      {tagData ? <ContactTags leadId={id} {...tagData} /> : <p role="status" className="mb-5">Contact tags are unavailable.</p>}

      <section className="mb-10" aria-labelledby="follow-ups">
        <h2 id="follow-ups" className="mb-4 text-xl">Follow-ups</h2>
        <FollowUpForm lead={id} inquiry={selectedInquiry} />
        <TaskList tasks={tasks} today={workspaceToday(timeZone)} />
      </section>

      <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-5">Relationship timeline</h2>
      <ol className="space-y-4">
        {timeline.map((event, i) => (
          <li key={i} className="rounded-2xl border border-[#6b1f1f]/10 bg-white shadow-sm motion-safe:transition-shadow hover:shadow-md">
            <div className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <p className="text-sm font-semibold text-[#1a1816]">{event.title}</p>
                <p className="text-xs text-[#1a1816]/45 whitespace-nowrap">{workspaceStamp(event.at, timeZone)}</p>
              </div>
              <p className="text-xs uppercase tracking-widest text-[#6b1f1f] mt-1">{KIND_LABEL[event.kind]}</p>
              <p className="text-sm text-[#1a1816]/70 mt-2">{event.description}</p>

              {event.card?.type === "napkin" && (
                <details className="mt-3">
                  <summary className="text-xs uppercase tracking-widest text-[#1a1816]/50 cursor-pointer select-none">
                    Expand summary
                  </summary>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[#1a1816]/40 uppercase tracking-widest mb-1">Business</p>
                      <p className="text-[#1a1816]/80">{event.card.businessName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#1a1816]/40 uppercase tracking-widest mb-1">Interpretation</p>
                      <p className="text-[#1a1816]/80">{event.card.interpretationLabel}</p>
                    </div>
                    <div>
                      <p className="text-[#1a1816]/40 uppercase tracking-widest mb-1">Required / month</p>
                      <p className="text-[#1a1816]/80">{event.card.requiredPerMonth ?? "—"}</p>
                    </div>
                  </div>
                </details>
              )}

              {event.card?.type === "reality_check" && (
                <details className="mt-3">
                  <summary className="text-xs uppercase tracking-widest text-[#1a1816]/50 cursor-pointer select-none">
                    Expand summary
                  </summary>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[#1a1816]/40 uppercase tracking-widest mb-1">Idea</p>
                      <p className="text-[#1a1816]/80">{event.card.ideaName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#1a1816]/40 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-[#1a1816]/80">{event.card.overallScore}/100</p>
                    </div>
                    <div>
                      <p className="text-[#1a1816]/40 uppercase tracking-widest mb-1">Band</p>
                      <p className="text-[#1a1816]/80">{event.card.band}</p>
                    </div>
                  </div>
                </details>
              )}

              {event.href && (
                <Link href={event.href} className="inline-block mt-3 text-xs uppercase tracking-widest text-[#6b1f1f] underline">
                  {event.card ? "View full record →" : "View →"}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      <ArchiveContact contact={profile} />
    </AdminShell>
  );
}
