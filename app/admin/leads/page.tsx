import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import {
  DEFAULT_LEAD_FILTERS,
  filterUnifiedLeads,
  listUnifiedLeadsAdmin,
  SUBSCRIPTION_STATUS_LABELS,
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
    <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
      <p className="text-2xl font-light">{value}</p>
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [allLeads, insights] = await Promise.all([listUnifiedLeadsAdmin(), getExperienceInsights()]);
  const filtered = filterUnifiedLeads(allLeads, filters);

  const countries = [...new Set(allLeads.map((l) => l.country).filter((c): c is string => Boolean(c)))].sort();

  const activeFilterQs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== "") as [string, string][]
  );
  const filteredExportQs = new URLSearchParams(activeFilterQs);
  filteredExportQs.set("kind", "filtered");

  const stats = {
    total: allLeads.length,
    shortlisted: allLeads.filter((l) => l.shortlisted).length,
    subscribed: allLeads.filter((l) => l.subscription_status === "subscribed").length,
    unsubscribed: allLeads.filter((l) => l.subscription_status === "unsubscribed").length,
  };

  return (
    <AdminShell>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-light">Leads</h1>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest">
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
        <StatTile label="Shortlisted" value={stats.shortlisted} />
        <StatTile label="Subscribed" value={stats.subscribed} />
        <StatTile label="Unsubscribed" value={stats.unsubscribed} />
      </div>

      <form className="bg-white border border-[#1a1816]/10 p-4 mb-8 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            name="query"
            defaultValue={filters.query}
            placeholder="Search name, email, source…"
            className="border border-[#1a1816]/15 px-3 py-2"
          />
          <select name="shortlisted" defaultValue={filters.shortlisted} className="border border-[#1a1816]/15 px-2 py-2">
            <option value="">Shortlisted: any</option>
            <option value="yes">Shortlisted: yes</option>
            <option value="no">Shortlisted: no</option>
          </select>
          <select name="subscription" defaultValue={filters.subscription} className="border border-[#1a1816]/15 px-2 py-2">
            <option value="">Subscription: any</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="never_subscribed">Never subscribed</option>
          </select>
        </div>

        <details className="mb-3">
          <summary className="text-xs uppercase tracking-widest text-[#1a1816]/50 cursor-pointer select-none">
            More filters
          </summary>
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
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Country</th>
                <th className="py-3 pr-4">Acquired through</th>
                <th className="py-3 pr-4">Shortlisted</th>
                <th className="py-3 pr-4">First acquired</th>
                <th className="py-3 pr-4">Last interaction</th>
                <th className="py-3 pr-4">Resources</th>
                <th className="py-3 pr-4">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-[#1a1816]/8 align-top">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/leads/${lead.id}`} className="text-[#6b1f1f] hover:underline">
                      {lead.first_name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{lead.email}</td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{lead.country || "—"}</td>
                  <td className="py-3 pr-4 text-[#1a1816]/70 max-w-xs">{lead.acquired_through}</td>
                  <td className="py-3 pr-4">
                    {lead.shortlisted ? <span className="text-green-700">Yes</span> : <span className="text-[#1a1816]/40">No</span>}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/60 whitespace-nowrap">
                    {new Date(lead.first_acquired_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/60 whitespace-nowrap">
                    {new Date(lead.last_interaction_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">
                    {lead.resource_count}
                    {lead.napkin_count > 0 && ` · Napkin ×${lead.napkin_count}`}
                    {lead.reality_check_count > 0 && ` · Reality ×${lead.reality_check_count}`}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{SUBSCRIPTION_STATUS_LABELS[lead.subscription_status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
