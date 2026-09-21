import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getResourceStats, listLeadsAdmin } from "@/app/lib/resources/queries";
import { getAssessmentSummaryByLead } from "@/app/lib/assessment/queries";
import AdminShell from "@/app/components/admin/AdminShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
      <p className="text-2xl font-light">{value}</p>
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminLeadsPage() {
  await requireAdmin();
  const [leads, stats, assessmentSummary] = await Promise.all([
    listLeadsAdmin(),
    getResourceStats(),
    getAssessmentSummaryByLead(),
  ]);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-light">Leads</h1>
        <div className="flex gap-4">
          <a
            href="/api/admin/leads/export"
            className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1"
          >
            Export CSV
          </a>
          <a
            href="/api/admin/leads/export?subscribersOnly=true"
            className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1"
          >
            Export shortlist subscribers
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatTile label="Requests" value={stats.totalRequests} />
        <StatTile label="Leads" value={stats.totalLeads} />
        <StatTile label="Unique leads" value={stats.uniqueLeads} />
        <StatTile label="Returning leads" value={stats.returningLeads} />
        <StatTile label="Shortlist opt-ins" value={stats.optIns} />
      </div>

      {leads.length === 0 ? (
        <p className="text-[#1a1816]/60">No leads yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Country</th>
                <th className="py-3 pr-4">Shortlist</th>
                <th className="py-3 pr-4">First acquired</th>
                <th className="py-3 pr-4">Last interaction</th>
                <th className="py-3 pr-4">Resources</th>
                <th className="py-3 pr-4">Reality Check</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const summary = assessmentSummary.get(lead.id);
                return (
                <tr key={lead.id} className="border-b border-[#1a1816]/8">
                  <td className="py-3 pr-4">{lead.first_name}</td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{lead.email}</td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{lead.country || "—"}</td>
                  <td className="py-3 pr-4">
                    {lead.ongoing_content_opt_in ? (
                      <span className="text-green-700">Yes</span>
                    ) : (
                      <span className="text-[#1a1816]/40">No</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/60">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/60">
                    {new Date(lead.last_interaction_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">
                    {lead.resource_count} — {lead.resource_titles.join(", ")}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">
                    {summary ? (
                      <Link href="/admin/assessments" className="text-[#6b1f1f] hover:underline">
                        {summary.latestScore}/100 ({summary.count}×)
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
