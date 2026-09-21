import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listAssessmentsAdmin } from "@/app/lib/assessment/queries";
import AdminShell from "@/app/components/admin/AdminShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminAssessmentsPage() {
  await requireAdmin();
  const assessments = await listAssessmentsAdmin();
  const completed = assessments.filter((a) => a.completed_at);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-light">Business Idea Reality Check</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{completed.length}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Completed</p>
        </div>
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{assessments.length - completed.length}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Abandoned before gate</p>
        </div>
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">
            {completed.length ? Math.round(completed.reduce((s, a) => s + a.overall_score, 0) / completed.length) : "—"}
          </p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Average score</p>
        </div>
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{completed.filter((a) => a.material_negative_evidence?.triggered).length}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Material negative evidence</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <p className="text-[#1a1816]/60">No assessments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Idea</th>
                <th className="py-3 pr-4">Stage</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Opt-in</th>
                <th className="py-3 pr-4">Completed</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-[#1a1816]/8">
                  <td className="py-3 pr-4">
                    {a.completed_at ? (
                      <Link href={`/admin/assessments/${a.id}`} className="text-[#6b1f1f] hover:underline">
                        {a.lead_first_name || "—"}
                      </Link>
                    ) : (
                      <span className="text-[#1a1816]/40">Abandoned</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{a.lead_email || "—"}</td>
                  <td className="py-3 pr-4 text-[#1a1816]/70">{a.idea_name || "—"}</td>
                  <td className="py-3 pr-4 text-[#1a1816]/60">{a.business_stage}</td>
                  <td className="py-3 pr-4">
                    <span className={a.material_negative_evidence?.triggered ? "text-[#6b1f1f] font-semibold" : ""}>
                      {a.overall_score}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {a.lead_opt_in ? <span className="text-green-700">Yes</span> : <span className="text-[#1a1816]/40">No</span>}
                  </td>
                  <td className="py-3 pr-4 text-[#1a1816]/60">
                    {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
