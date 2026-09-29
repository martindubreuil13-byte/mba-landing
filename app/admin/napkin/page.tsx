import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "@/app/components/admin/AdminShell";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listNapkinAdmin } from "@/app/lib/napkin/admin-queries";
import { DEFAULT_FILTERS, ADMIN_STATUS_LABELS, filterNapkin, paginateNapkin, sortNapkin, sourceLabel, summarizeNapkin, isSubscribed, isUnsubscribed, type NapkinFilters } from "@/app/lib/napkin/admin-model";
import { BUSINESS_STAGES, CURRENCIES, INTERPRETATION_CATEGORIES, INTERPRETATION_LABELS, type InterpretationCategory } from "@/app/lib/napkin/config";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Params = Record<string, string | string[] | undefined>;
const value = (p: Params, key: string) => typeof p[key] === "string" ? p[key] as string : "";
function parseFilters(p: Params): NapkinFilters {
  const direction = value(p, "direction") === "asc" ? "asc" : "desc";
  return { ...DEFAULT_FILTERS, query: value(p,"query"), from: value(p,"from"), to: value(p,"to"), interpretation: value(p,"interpretation"), stage: value(p,"stage"), community: value(p,"community"), subscribed: value(p,"subscribed"), unsubscribed: value(p,"unsubscribed"), email: value(p,"email"), cta: value(p,"cta"), currency: value(p,"currency"), sort: value(p,"sort") || "created_at", direction, page: Math.max(1, Number(value(p,"page")) || 1) };
}
function money(amount: number | null | undefined, currency: string) { return amount == null ? "—" : new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); }
function Stat({ label, value }: { label: string; value: number }) { return <div className="border border-[#1a1816]/10 bg-white px-4 py-3"><p className="text-2xl font-light">{value}</p><p className="text-[11px] uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p></div>; }
function YesNo({ value }: { value: boolean }) { return value ? <span className="text-green-700">Yes</span> : <span className="text-[#1a1816]/40">No</span>; }

export default async function NapkinAdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseFilters(params);
  const all = await listNapkinAdmin();
  const summary = summarizeNapkin(all);
  const filtered = sortNapkin(filterNapkin(all, filters), filters);
  const page = paginateNapkin(filtered, filters.page);
  const qs = new URLSearchParams(Object.entries(filters).filter(([k,v]) => k !== "page" && v !== "").map(([k,v]) => [k,String(v)]));
  const exportQs = new URLSearchParams(Object.entries(filters).filter(([k,v]) => k !== "page" && v !== "").map(([k,v]) => [k,String(v)]));
  exportQs.set("kind", "filtered");
  return <AdminShell>
    <div className="flex items-start justify-between gap-5 flex-wrap mb-8"><div><h1 className="text-2xl font-light">Napkin Principle</h1><p className="text-sm text-[#1a1816]/55 mt-1">Completed exercises and explicitly captured community contacts.</p></div><div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest"><Link className="text-[#6b1f1f] underline" href={`/api/admin/napkin/export?${exportQs}`}>Export filtered</Link><Link className="underline" href="/api/admin/napkin/export?kind=community">Export subscribed community</Link><Link className="underline" href="/api/admin/napkin/export?kind=all">Export all</Link></div></div>
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-8"><Stat label="Completed" value={summary.completed}/><Stat label="Community members" value={summary.communityMembers}/><Stat label="Declined" value={summary.declined}/><Stat label="Subscribed" value={summary.subscribed}/><Stat label="Unsubscribed" value={summary.unsubscribed}/><Stat label="Emails delivered" value={summary.delivered}/><Stat label="Email failures" value={summary.failed}/><Stat label="CTA clicks" value={summary.ctaClicks}/></div>
    <form className="bg-white border border-[#1a1816]/10 p-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-6 text-sm">
      <input name="query" defaultValue={filters.query} placeholder="Search name, email, business…" className="border px-3 py-2 col-span-2"/><input type="date" name="from" defaultValue={filters.from} className="border px-2 py-2" aria-label="From date"/><input type="date" name="to" defaultValue={filters.to} className="border px-2 py-2" aria-label="To date"/>
      <select name="interpretation" defaultValue={filters.interpretation} className="border px-2 py-2"><option value="">All interpretations</option>{INTERPRETATION_CATEGORIES.map(x=><option key={x} value={x}>{INTERPRETATION_LABELS[x]}</option>)}</select>
      <select name="stage" defaultValue={filters.stage} className="border px-2 py-2"><option value="">All stages</option>{BUSINESS_STAGES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
      {[['community','Community member'],['subscribed','Currently subscribed'],['unsubscribed','Unsubscribed'],['cta','CTA clicked']].map(([name,label])=><select key={name} name={name} defaultValue={filters[name as keyof NapkinFilters] as string} className="border px-2 py-2"><option value="">{label}: any</option><option value="yes">{label}: yes</option><option value="no">{label}: no</option></select>)}
      <select name="email" defaultValue={filters.email} className="border px-2 py-2"><option value="">Email: any</option><option value="delivered">Delivered</option><option value="failed">Failed</option></select>
      <select name="currency" defaultValue={filters.currency} className="border px-2 py-2"><option value="">All currencies</option>{CURRENCIES.map(x=><option key={x.code}>{x.code}</option>)}</select>
      <select name="sort" defaultValue={filters.sort} className="border px-2 py-2"><option value="created_at">Completion date</option><option value="business_name">Business name</option><option value="required">Required volume</option><option value="status">Internal status</option></select>
      <select name="direction" defaultValue={filters.direction} className="border px-2 py-2"><option value="desc">Descending</option><option value="asc">Ascending</option></select>
      <button className="bg-[#1a1816] text-white px-4 py-2 uppercase tracking-widest text-xs">Apply filters</button><Link href="/admin/napkin" className="px-4 py-2 underline">Clear</Link>
    </form>
    {all.length === 0 ? <p className="text-[#1a1816]/60">No submissions yet.</p> : page.total === 0 ? <p className="text-[#1a1816]/60">No results match these filters.</p> : <>
      <p className="text-xs text-[#1a1816]/50 mb-3">Showing {page.rows.length} of {page.total} matching submissions</p>
      <div className="overflow-x-auto bg-white border border-[#1a1816]/10"><table className="min-w-[1900px] w-full text-xs"><thead><tr className="text-left border-b uppercase tracking-wider text-[#1a1816]/50">{["Completed","Business / idea","Stage","Core item","Currency","Avg price","Money remaining","Monthly cost","Required volume","Expected volume","Max capacity","Interpretation","Name","Email","Community","Email","Unsubscribed","CTA","Source / campaign","Internal status"].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{page.rows.map(r=>{const i=r.raw_inputs || {}; return <tr key={r.id} className="border-b border-[#1a1816]/8 align-top"><td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td><td className="p-3 max-w-48"><Link className="text-[#6b1f1f] underline" href={`/admin/napkin/${r.id}`}>{r.business_name || "Untitled"}</Link></td><td className="p-3">{i.businessStage || "—"}</td><td className="p-3 max-w-40">{i.transactionSingular || i.whatItSells || "—"}</td><td className="p-3">{r.currency}</td><td className="p-3">{money(r.selling_price,r.currency)}</td><td className="p-3">{money(r.money_remaining_per_transaction,r.currency)}</td><td className="p-3">{money(r.monthly_operating_cost,r.currency)}</td><td className="p-3">{r.required_transactions_per_month ?? "—"}</td><td className="p-3">{i.expectedMonthlyVolume ?? "—"}</td><td className="p-3">{i.maxMonthlyCapacity ?? "—"}</td><td className="p-3 max-w-40">{INTERPRETATION_LABELS[r.interpretation_category as InterpretationCategory] || r.interpretation_category}</td><td className="p-3">{r.lead?.first_name || "—"}</td><td className="p-3">{r.lead?.email || "—"}</td><td className="p-3"><YesNo value={Boolean(r.marketing_consent && r.lead?.email)}/><span className="block text-[10px] text-[#1a1816]/50">{isSubscribed(r)?"subscribed":"not subscribed"}</span></td><td className="p-3">{r.email_sent?"Delivered":r.email_error?"Failed":"Not sent"}</td><td className="p-3"><YesNo value={isUnsubscribed(r)}/></td><td className="p-3">{r.cta_clicked || "—"}</td><td className="p-3">{sourceLabel(r)}</td><td className="p-3">{ADMIN_STATUS_LABELS[r.admin?.internal_status || "new"]}</td></tr>})}</tbody></table></div>
      <div className="flex justify-between mt-5 text-sm"><span>Page {page.currentPage} of {page.totalPages}</span><div className="flex gap-4">{page.currentPage>1&&<Link className="underline" href={`?${qs}&page=${page.currentPage-1}`}>Previous</Link>}{page.currentPage<page.totalPages&&<Link className="underline" href={`?${qs}&page=${page.currentPage+1}`}>Next</Link>}</div></div>
    </>}
  </AdminShell>;
}
