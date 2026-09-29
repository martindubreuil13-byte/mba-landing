import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/app/components/admin/AdminShell";
import NapkinAdminEditor from "@/app/components/admin/NapkinAdminEditor";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getNapkinAdminDetail } from "@/app/lib/napkin/admin-queries";
import { ADMIN_STATUS_LABELS, isSubscribed, isUnsubscribed } from "@/app/lib/napkin/admin-model";
import { generateArchitecturalLevers, generatePersonalizedQuestions } from "@/app/lib/napkin/personalization";
import { INTERPRETATION_LABELS } from "@/app/lib/napkin/config";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-9"><h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">{title}</h2>{children}</section>; }
function Grid({ items }: { items: [string, React.ReactNode][] }) { return <dl className="grid md:grid-cols-2 xl:grid-cols-3 gap-px bg-[#1a1816]/10 border border-[#1a1816]/10">{items.map(([k,v])=><div key={k} className="bg-white p-4 min-w-0"><dt className="text-[11px] uppercase tracking-widest text-[#1a1816]/45">{k}</dt><dd className="text-sm mt-1 break-words">{v ?? "—"}</dd></div>)}</dl>; }
const show = (v: unknown) => v == null || v === "" ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);

export default async function NapkinDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params; const r = await getNapkinAdminDetail(id); if (!r) notFound();
  const i = r.raw_inputs || {}; const c = r.calculation_result || {}; const interpretation = c.interpretation || { weakestAssumption: {} };
  const personalize = { inputs: i, interpretationCategory: r.interpretation_category, gapExpectedVsRequired: c.gapExpectedVsRequired ?? null, gapCapacityVsRequired: c.gapCapacityVsRequired ?? null, weakestAssumptionField: interpretation.weakestAssumption?.field ?? null };
  const questions = generatePersonalizedQuestions(personalize); const levers = generateArchitecturalLevers(personalize);
  return <AdminShell><Link href="/admin/napkin" className="text-xs uppercase tracking-widest text-[#1a1816]/50 hover:text-[#1a1816]">← All submissions</Link>
    <div className="flex justify-between gap-5 flex-wrap my-7"><div><h1 className="text-3xl font-light">{r.business_name || "Untitled business or idea"}</h1><p className="text-sm text-[#1a1816]/55 mt-1">Completed {new Date(r.created_at).toLocaleString()} · {ADMIN_STATUS_LABELS[r.admin?.internal_status || "new"]}</p></div><p className="text-sm text-right">{INTERPRETATION_LABELS[r.interpretation_category]}</p></div>
    {isUnsubscribed(r) && <div className="border-2 border-[#6b1f1f] bg-[#6b1f1f]/5 p-5 mb-8 text-[#6b1f1f] font-semibold">Unsubscribed from marketing. Do not add to community broadcasts.</div>}
    <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-8"><div>
      <Section title="Contact and consent"><Grid items={[["First name",show(r.lead?.first_name)],["Email",show(r.lead?.email)],["Joined community",show(Boolean(r.marketing_consent&&r.lead))],["Currently subscribed",show(isSubscribed(r))],["Consent copy version",show(r.consent_copy_version)],["Consent timestamp",r.consent_at?new Date(r.consent_at).toLocaleString():"—"],["Unsubscribe timestamp",r.lead?.ongoing_content_opt_out_at?new Date(r.lead.ongoing_content_opt_out_at).toLocaleString():"—"]]}/></Section>
      <Section title="Questionnaire answers"><Grid items={[["Business / idea",show(i.businessName)],["Business stage",show(i.businessStage)],["What it sells",show(i.whatItSells)],["Core item singular",show(i.transactionSingular)],["Core item plural",show(i.transactionPlural)],["Currency",show(i.currency)],["Average selling price",show(i.sellingPrice)],["Trading days / month",show(i.tradingDaysPerMonth)],["Opening hours / day",show(i.openingHoursPerDay)],["Capacity units",show(i.capacityUnits)],["Capacity label",show(i.capacityUnitLabel)],["Expected monthly volume",show(i.expectedMonthlyVolume)],["Maximum capacity",show(i.maxMonthlyCapacity)],["Seasonality",show(i.seasonality)],["Customer reachability",show(i.reachability)],["Price confidence",show(i.priceConfidence)],["Direct-cost confidence",show(i.directCostConfidence)],["Monthly-cost confidence",show(i.monthlyCostConfidence)],["Volume evidence",show(i.volumeEvidence)]]}/></Section>
      <Section title="Direct-cost line items"><Grid items={(i.directCostItems||[]).map(x=>[x.label,show(x.amount)])}/></Section>
      <Section title="Monthly-cost line items"><Grid items={(i.monthlyCostItems||[]).map(x=>[x.label,show(x.amount)])}/></Section>
      <Section title="Server-calculated results"><Grid items={[["Total direct cost",show(c.contribution?.totalDirectCost)],["Money remaining / transaction",show(c.contribution?.moneyRemainingPerTransaction)],["Contribution percentage",show(c.contribution?.contributionPercent)],["Monthly operating cost",show(c.survival?.monthlyOperatingCost)],["Survival number (exact)",show(c.survival?.requiredPerMonthExact)],["Required monthly volume",show(c.survival?.requiredPerMonthRounded)],["Required / trading day",show(c.observable?.perTradingDay)],["Required / opening hour",show(c.observable?.perOpeningHour)],["Required / capacity unit",show(c.observable?.perCapacityUnit)],["Expected-volume gap ratio",show(c.gapExpectedVsRequired)],["Capacity gap ratio",show(c.gapCapacityVsRequired)],["Weakest assumption",show(interpretation.weakestAssumption?.label)],["Preliminary interpretation",show(interpretation.summary)]]}/></Section>
      <Section title="Personalized questions"><ul className="list-disc pl-5 space-y-2 text-sm">{questions.map(q=><li key={q}>{q}</li>)}</ul></Section>
      <Section title="Architectural levers"><ul className="list-disc pl-5 space-y-2 text-sm">{levers.map(x=><li key={x}>{x}</li>)}</ul></Section>
      <Section title="Email and CTA activity"><Grid items={[["Email requested",show(Boolean(r.lead?.email))],["Email sent",show(r.email_sent)],["Email sent at",r.email_sent_at?new Date(r.email_sent_at).toLocaleString():"—"],["Email failure",show(r.email_error)],["CTA clicked",show(r.cta_clicked)],["CTA clicked at",r.cta_clicked_at?new Date(r.cta_clicked_at).toLocaleString():"—"]]}/></Section>
      <Section title="Attribution and versions"><Grid items={[["Source",show(r.source)],["Medium",show(r.medium)],["Campaign",show(r.campaign)],["Referrer",show(r.referrer)],["UTM source",show(r.utm_source)],["UTM medium",show(r.utm_medium)],["UTM campaign",show(r.utm_campaign)],["UTM content",show(r.utm_content)],["Form version",show(r.form_version)],["Calculation version",show(r.calculation_version)]]}/><details className="mt-4"><summary className="text-xs underline cursor-pointer">Technical record JSON</summary><pre className="mt-3 p-4 overflow-auto bg-white border text-xs">{JSON.stringify({raw_inputs:r.raw_inputs,calculation_result:r.calculation_result},null,2)}</pre></details></Section>
    </div><aside><NapkinAdminEditor id={r.id} email={r.lead?.email||null} initialStatus={r.admin?.internal_status||"new"} initialNotes={r.admin?.private_notes||""}/></aside></div>
  </AdminShell>;
}

