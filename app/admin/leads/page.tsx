import { isLifecycle, lifecycleLabels, lifecycleLabel } from "@/app/lib/contact-tags/lifecycle";
import { contactTagNames, contactTags, taggedLeadIds } from "@/app/lib/contact-tags/data";
import { isUuid } from "@/app/lib/relationships/model";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import {
  DEFAULT_LEAD_FILTERS,
  filterUnifiedLeads,
  listUnifiedLeadsAdmin,
  type LeadFilters,
} from "@/app/lib/leads/admin-queries";
import { getExperienceInsights } from "@/app/lib/leads/experience-insights";
import AdminShell from "@/app/components/admin/AdminShell";
import ExperiencesPanel from "@/app/components/admin/ExperiencesPanel";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const value = (p: Params, key: string) => (typeof p[key] === "string" ? (p[key] as string) : "");

function parseFilters(p: Params): LeadFilters {
  return {
    ...DEFAULT_LEAD_FILTERS,
    query: value(p, "query"),
    shortlisted: value(p, "shortlisted"),
    subscription: value(p, "subscription"),
    country: value(p, "country"),
    hasNapkin: value(p, "hasNapkin"),
    hasRealityCheck: value(p, "hasRealityCheck"),
    hasPmb: value(p, "hasPmb"),
    from: value(p, "from"),
    to: value(p, "to"),
  };
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] px-5 py-4 shadow-sm">
      <p className="text-2xl font-light">{value}</p>
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [records, insights] = await Promise.all([listUnifiedLeadsAdmin(), getExperienceInsights()]);
  const archived = value(params, "view") === "archived";
  const allLeads = records.filter((lead) => Boolean(lead.contact_archived_at) === archived);
  const tag = value(params, "tag");
  const [tagData, tagNames] = await Promise.all([contactTags().catch(() => null), contactTagNames().catch(() => null)]);
  const requestedStatus = value(params, "status");
  const status = isLifecycle(requestedStatus) ? requestedStatus : "";
  const tagged = isUuid(tag) ? new Set(await taggedLeadIds(tag)) : null;
  const filtered = filterUnifiedLeads(allLeads, filters).filter((row) => (!tagged || tagged.has(row.id)) && (!status || row.contact_lifecycle === status));

  const countries = [...new Set(allLeads.map((l) => l.country).filter((c): c is string => Boolean(c)))].sort();

  const activeFilterQs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== "") as [string, string][]
  );
  const filteredExportQs = new URLSearchParams(activeFilterQs);
  filteredExportQs.set("kind", "filtered");
  if (archived) filteredExportQs.set("view", "archived");
  if (tagged) filteredExportQs.set("tag", tag);
  if (status) filteredExportQs.set("status", status);

  const stats = {
    total: allLeads.length,
    newLeads: allLeads.filter((l) => l.contact_lifecycle === "new").length,
    subscribed: allLeads.filter((l) => l.subscription_status === "subscribed").length,
    unsubscribed: allLeads.filter((l) => l.subscription_status === "unsubscribed").length,
  };

  return (
    <AdminShell>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-serif text-4xl text-[#27211d]">Contacts</h1>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest">
          <Link href={archived ? "/admin/leads" : "/admin/leads?view=archived"} className="text-[#6b1f1f]">{archived ? "Active contacts" : "Archived contacts"}</Link>
          <a href={`/api/admin/leads/export?${filteredExportQs}`} className="text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1">
            Export filtered
          </a>
          <a href="/api/admin/leads/export?kind=shortlisted" className="text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1">
            Export shortlisted
          </a>
          <a href="/api/admin/leads/export?kind=subscribers" className="text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1">
            Export subscribers
          </a>
          <a href="/api/admin/leads/export?kind=all" className="text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1">
            Export all
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Total leads" value={stats.total} />
        <Link href="/admin/leads?status=new" aria-current={status === "new" ? "page" : undefined} className="rounded-2xl outline-[#6b1f1f] hover:outline focus-visible:outline aria-[current=page]:outline"><StatTile label="New Leads →" value={stats.newLeads} /></Link>
        <StatTile label="Subscribed" value={stats.subscribed} />
        <StatTile label="Unsubscribed" value={stats.unsubscribed} />
      </div>

      <form className="rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-4 mb-8 text-sm shadow-sm">
        {archived && <input type="hidden" name="view" value="archived" />}
        <div className="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label className="grid gap-1">Search contacts<input type="search" name="query" defaultValue={filters.query} placeholder="Name or email" className="min-w-0 rounded-lg border border-[#daccc1] bg-white px-3 py-2" /></label>
          <label className="grid gap-1">Lifecycle<select name="status" defaultValue={status} className="min-w-0 rounded-lg border border-[#daccc1] bg-white px-3 py-2">
            <option value="">All statuses</option>
            {Object.entries(lifecycleLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
          </select></label>
          {tagData && <label className="grid gap-1">Tag<select name="tag" defaultValue={tag} className="min-w-0 rounded-lg border border-[#daccc1] bg-white px-3 py-2">
            <option value="">All tags</option>
            {tagData.tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>}
        </div>
        <details className="mb-3">
          <summary className="cursor-pointer text-[#6b1f1f]">More filters</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select name="shortlisted" defaultValue={filters.shortlisted} className="border border-[#1a1816]/15 px-2 py-2">
            <option value="">Shortlisted: any</option>
            <option value="yes">Shortlisted: yes</option>
            <option value="no">Shortlisted: no</option>
          </select>
          <select name="subscription" defaultValue={filters.subscription} className="border border-[#1a1816]/15 px-2 py-2">
            <option value="">Subscription: any</option>
            <option value="subscribed">Subscribed</option>
            <option value="pending_confirmation">Awaiting confirmation</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="suppressed">Suppressed</option>
            <option value="never_subscribed">Never subscribed</option>
          </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-3">
            <select name="country" defaultValue={filters.country} className="border border-[#1a1816]/15 px-2 py-2">
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select name="hasNapkin" defaultValue={filters.hasNapkin} className="border border-[#1a1816]/15 px-2 py-2">
              <option value="">Napkin: any</option>
              <option value="yes">Has Napkin</option>
              <option value="no">No Napkin</option>
            </select>
            <select name="hasRealityCheck" defaultValue={filters.hasRealityCheck} className="border border-[#1a1816]/15 px-2 py-2">
              <option value="">Reality Check: any</option>
              <option value="yes">Has Reality Check</option>
              <option value="no">No Reality Check</option>
            </select>
            <select name="hasPmb" defaultValue={filters.hasPmb} className="border border-[#1a1816]/15 px-2 py-2">
              <option value="">Pick My Brain: any</option>
              <option value="yes">Has question</option>
              <option value="no">No question</option>
            </select>
            <input type="date" name="from" defaultValue={filters.from} aria-label="Acquired from" className="border border-[#1a1816]/15 px-2 py-2" />
            <input type="date" name="to" defaultValue={filters.to} aria-label="Acquired to" className="border border-[#1a1816]/15 px-2 py-2" />
          </div>
        </details>

        <div className="flex gap-4">
          <button className="bg-[#1a1816] text-white px-4 py-2 uppercase tracking-widest text-xs">Apply filters</button>
          <Link href="/admin/leads" className="px-4 py-2 underline text-xs uppercase tracking-widest self-center">
            Clear
          </Link>
        </div>
      </form>

      {allLeads.length === 0 ? (
        <p className="text-[#1a1816]/60">No leads yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-[#1a1816]/60">No leads match these filters.</p>
      ) : (
        <div className="overflow-x-auto mb-10">
          <p className="text-xs text-[#1a1816]/50 mb-3">
            Showing {filtered.length} of {allLeads.length} leads
          </p>
          <ul className="grid gap-2">
            {filtered.map((lead) => <li key={lead.id}>
              <Link href={`/admin/leads/${lead.id}`} className="grid gap-2 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] px-4 py-3 shadow-sm hover:border-[#a96c68] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center">
                <span className="min-w-0 break-words"><strong className="block text-[#6b1f1f]">{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email}</strong><span className="text-sm text-[#655951]">{lead.email}</span></span>
                <span className="flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-[#efdfd8] px-2.5 py-1 text-[#6b1f1f]">{lifecycleLabel(lead.contact_lifecycle, lead.lead_status)}</span>
                  {(tagNames?.get(lead.id) ?? []).map((name) => <span key={name} className="break-all rounded-full bg-[#f5eee8] px-2.5 py-1">{name}</span>)}
                </span>
                <span className="flex items-center gap-3 text-xs text-[#655951]"><time dateTime={lead.last_interaction_at}>Active {new Date(lead.last_interaction_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok" })}</time><span className="text-[#6b1f1f]">Open →</span></span>
              </Link>
            </li>)}
          </ul>
        </div>
      )}

      <details className="border border-[#1a1816]/10 bg-white">
        <summary className="px-5 py-4 cursor-pointer select-none text-sm font-semibold tracking-widest uppercase text-[#1a1816]">
          Experiences &amp; Insights
        </summary>
        <div className="px-5 pb-6 pt-2">
          <ExperiencesPanel insights={insights} />
        </div>
      </details>
    </AdminShell>
  );
}
