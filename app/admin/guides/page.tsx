import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listGuideOverview } from "@/app/lib/resources/admin-analytics";
import { formatRate, resolveDateRange } from "@/app/lib/resources/funnel";
import AdminShell from "@/app/components/admin/AdminShell";
import { RangeFilter } from "@/app/components/admin/GuideAdminParts";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const value = (p: Params, key: string) => (typeof p[key] === "string" ? (p[key] as string) : undefined);

export default async function AdminGuidesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveDateRange({ range: value(params, "range"), from: value(params, "from"), to: value(params, "to") });
  const rows = await listGuideOverview(range);

  return (
    <AdminShell>
      <div className="mb-2">
        <h1 className="text-2xl font-light">Guides</h1>
        <p className="text-sm text-[#1a1816]/55 mt-1 max-w-2xl">
          Resources with the read-online + printable-guide experience. Built on the shared resource-event model, so worksheets, surveys and assessments will appear here too.
        </p>
      </div>
      <div className="mt-6">
        <RangeFilter range={range} action="/admin/guides" />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[#1a1816]/60">No resources have the lead-capture experience configured yet.</p>
      ) : (
        <div className="border border-[#1a1816]/10 bg-white overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-[#1a1816]/50 text-left">
                <th scope="col" className="font-normal p-4">Resource</th>
                <th scope="col" className="font-normal p-4">Status</th>
                <th scope="col" className="font-normal p-4">PDF</th>
                <th scope="col" className="font-normal p-4 text-right">Views</th>
                <th scope="col" className="font-normal p-4 text-right">Guide starts</th>
                <th scope="col" className="font-normal p-4 text-right">Completions</th>
                <th scope="col" className="font-normal p-4 text-right">CTA clicks</th>
                <th scope="col" className="font-normal p-4 text-right">Opt-ins</th>
                <th scope="col" className="font-normal p-4 text-right">View → opt-in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ resource, summary: s, status, pdfAvailable }) => (
                <tr key={resource.id} className="border-t border-[#1a1816]/8">
                  <th scope="row" className="p-4 text-left font-normal">
                    <Link href={`/admin/guides/${resource.slug}?range=${range.preset === "custom" ? "custom" : range.preset}&from=${range.from}&to=${range.to}`} className="text-[#6b1f1f] font-semibold hover:underline">
                      {resource.title}
                    </Link>
                    <span className="block text-xs text-[#1a1816]/50">{resource.resource_type}</span>
                  </th>
                  <td className="p-4 capitalize">{status}</td>
                  <td className="p-4">{pdfAvailable ? "Available" : <span className="text-[#6b1f1f]">Missing</span>}</td>
                  <td className="p-4 text-right tabular-nums">{s.pageViews}</td>
                  <td className="p-4 text-right tabular-nums">{s.readStarts}</td>
                  <td className="p-4 text-right tabular-nums">{s.readCompletions}</td>
                  <td className="p-4 text-right tabular-nums">{s.ctaClicks}</td>
                  <td className="p-4 text-right tabular-nums">{s.validOptIns}</td>
                  <td className="p-4 text-right tabular-nums">{formatRate(s.rates.viewToOptIn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
