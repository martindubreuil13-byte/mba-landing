import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getLeadDetailAdmin, SUBSCRIPTION_STATUS_LABELS, type ActivityEvent } from "@/app/lib/leads/admin-queries";
import AdminShell from "@/app/components/admin/AdminShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<ActivityEvent["kind"], string> = {
  resource: "Resource",
  napkin: "Napkin Principle",
  reality_check: "Reality Check",
  pmb: "Pick My Brain",
  opt_in: "Shortlist",
  opt_out: "Shortlist",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getLeadDetailAdmin(id);
  if (!detail) notFound();

  const { lead, row, timeline } = detail;

  return (
    <AdminShell>
      <Link href="/admin/leads" className="text-xs tracking-widest uppercase text-[#1a1816]/50 hover:text-[#1a1816]">
        ← All leads
      </Link>

      <div className="flex items-start justify-between gap-6 flex-wrap mt-6 mb-10">
        <div>
          <h1 className="text-3xl font-light">{lead.first_name}</h1>
          <p className="text-[#1a1816]/60 text-sm mt-1">
            <a href={`mailto:${lead.email}`} className="hover:text-[#6b1f1f]">
              {lead.email}
            </a>
            {lead.country ? ` — ${lead.country}` : ""}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>
            <span className="text-[#1a1816]/50">Shortlisted: </span>
            {row.shortlisted ? <span className="text-green-700">Yes</span> : <span className="text-[#1a1816]/40">No</span>}
          </p>
          <p className="mt-1">
            <span className="text-[#1a1816]/50">Subscription: </span>
            {SUBSCRIPTION_STATUS_LABELS[row.subscription_status]}
          </p>
          <p className="mt-1 text-[#1a1816]/50">Acquired via {row.acquired_through}</p>
        </div>
      </div>

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
        <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
          <p className="text-2xl font-light">{row.pmb_count}</p>
          <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">Pick My Brain</p>
        </div>
      </div>

      <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-5">Activity history</h2>
      <ol className="space-y-4">
        {timeline.map((event, i) => (
          <li key={i} className="border border-[#1a1816]/10 bg-white">
            <div className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <p className="text-sm font-semibold text-[#1a1816]">{event.title}</p>
                <p className="text-xs text-[#1a1816]/45 whitespace-nowrap">{fmt(event.at)}</p>
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
    </AdminShell>
  );
}
