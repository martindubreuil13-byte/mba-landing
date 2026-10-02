import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getResourceAnalytics } from "@/app/lib/resources/admin-analytics";
import { getResourceConfig } from "@/app/lib/resources/config";
import { CONSENT_STATUS_LABELS } from "@/app/lib/leads/consent";
import { DELIVERY_STATUS_LABELS } from "@/app/lib/resources/delivery-status";
import { resolveDateRange } from "@/app/lib/resources/funnel";
import { getResourceById } from "@/app/lib/resources/queries";
import { resourceFileExists } from "@/app/lib/resources/storage";
import { resourceStatus } from "@/app/lib/resources/types";
import { getServiceClient } from "@/app/lib/supabase/service";
import { SITE_URL } from "@/app/lib/seo";
import AdminShell from "@/app/components/admin/AdminShell";
import { BackLink, CtaTable, DeliveryTable, FunnelTable, IntegrityBanner, RangeFilter, RatesTable, Tile, TrendChart } from "@/app/components/admin/GuideAdminParts";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const value = (p: Params, key: string) => (typeof p[key] === "string" ? (p[key] as string) : undefined);

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default async function AdminGuideDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Params> }) {
  await requireAdmin();
  const { slug } = await params;
  const query = await searchParams;
  const config = getResourceConfig(slug);
  if (!config) notFound();

  const { data: row } = await getServiceClient().from("resources").select("id").eq("slug", slug).maybeSingle();
  const resource = row ? await getResourceById(row.id) : null;
  if (!resource) notFound();

  const range = resolveDateRange({ range: value(query, "range"), from: value(query, "from"), to: value(query, "to") });
  const [{ summary: s, trend, leads }, pdfAvailable] = await Promise.all([
    getResourceAnalytics(resource, range),
    resourceFileExists(resource.file_path),
  ]);

  return (
    <AdminShell>
      <BackLink href="/admin/guides">← All guides</BackLink>

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-light">{resource.title}</h1>
        <dl className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
          <div><dt className="text-xs uppercase tracking-widest text-[#1a1816]/45">Type</dt><dd className="capitalize">{config.kind}</dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-[#1a1816]/45">Publication</dt><dd className="capitalize">{resourceStatus(resource)}</dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-[#1a1816]/45">PDF asset</dt><dd>{pdfAvailable ? `Available (${resource.file_name})` : <span className="text-[#6b1f1f]">Missing from storage</span>}</dd></div>
          <div className="col-span-2 md:col-span-1"><dt className="text-xs uppercase tracking-widest text-[#1a1816]/45">Page</dt><dd><a href={`/resources/${slug}`} className="text-[#6b1f1f] hover:underline break-all">{SITE_URL}/resources/{slug}</a></dd></div>
        </dl>
      </div>

      <RangeFilter range={range} action={`/admin/guides/${slug}`} />

      <IntegrityBanner warnings={s.integrityWarnings} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Tile label="Public views" value={s.pageViews} hint={`${s.sessions} sessions · ${s.readCompletions} completed the guide`} />
        <Tile label="Membership requests" value={s.membershipRequests} hint={`${s.pendingConfirmations} pending · ${s.confirmedMembers} confirmed`} />
        <Tile label={`${config.access.analytics.benefitLabel} unlocked`} value={s.benefitsFulfilled} hint={`${s.fulfilledByConfirmation} at confirmation · ${s.fulfilledExistingMember} members again`} />
        <Tile label="Download starts" value={s.downloadStarts} hint={`${s.requestsDownloaded} requests · ${s.deliveryFailures} delivery failures`} />
      </div>

      <section className="space-y-3 mb-10">
        <h2 className="text-xs uppercase tracking-widest text-[#1a1816]/55">Trend</h2>
        <TrendChart days={trend} />
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="text-xs uppercase tracking-widest text-[#1a1816]/55">Conversion</h2>
        <RatesTable s={s} />
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="text-xs uppercase tracking-widest text-[#1a1816]/55">Funnel</h2>
        <FunnelTable s={s} benefitLabel={config.access.analytics.benefitLabel} />
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="text-xs uppercase tracking-widest text-[#1a1816]/55">CTA performance</h2>
        <CtaTable s={s} />
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="text-xs uppercase tracking-widest text-[#1a1816]/55">Delivery email status</h2>
        <DeliveryTable s={s} />
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="text-xs uppercase tracking-widest text-[#1a1816]/55">People who asked for the {config.access.memberBenefit.label} ({leads.length})</h2>
        <div className="border border-[#1a1816]/10 bg-white overflow-x-auto">
          <table className="w-full min-w-[72rem] text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-[#1a1816]/50 text-left">
                <th scope="col" className="font-normal p-3">Name</th>
                <th scope="col" className="font-normal p-3">Email</th>
                <th scope="col" className="font-normal p-3">Lead status</th>
                <th scope="col" className="font-normal p-3">Consent</th>
                <th scope="col" className="font-normal p-3">Requested</th>
                <th scope="col" className="font-normal p-3">CTA</th>
                <th scope="col" className="font-normal p-3">Source</th>
                <th scope="col" className="font-normal p-3">Benefit</th>
                <th scope="col" className="font-normal p-3">Delivery</th>
                <th scope="col" className="font-normal p-3">Downloads</th>
                <th scope="col" className="font-normal p-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={11} className="p-4 text-[#1a1816]/55">No requests in this range.</td></tr>
              )}
              {leads.slice(0, 200).map((l) => (
                <tr key={l.request_id} className="border-t border-[#1a1816]/8">
                  <td className="p-3">{l.name || <span className="text-[#1a1816]/35">—</span>}</td>
                  <td className="p-3">
                    <Link href={`/admin/leads/${l.lead_id}`} className="text-[#6b1f1f] hover:underline">{l.email}</Link>
                  </td>
                  <td className="p-3 capitalize">{l.lead_status}</td>
                  <td className="p-3">{CONSENT_STATUS_LABELS[l.consent_status]}</td>
                  <td className="p-3 whitespace-nowrap">{fmt(l.requested_at)}</td>
                  <td className="p-3">{l.cta_location ?? "—"}</td>
                  <td className="p-3 whitespace-nowrap">{l.source ? `${l.source}${l.medium ? ` / ${l.medium}` : ""}` : "—"}</td>
                  <td className="p-3">{l.benefit_unlocked ? "Unlocked" : "Locked"}</td>
                  <td className="p-3">{DELIVERY_STATUS_LABELS[l.delivery_status]}</td>
                  <td className="p-3 tabular-nums">{l.download_count}</td>
                  <td className="p-3 whitespace-nowrap">{fmt(l.last_activity_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length > 200 && <p className="text-xs text-[#1a1816]/50">Showing the 200 most recent of {leads.length}. Narrow the date range to see others.</p>}
      </section>
    </AdminShell>
  );
}
