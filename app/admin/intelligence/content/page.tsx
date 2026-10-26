import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCollectionStart, getContent } from "@/app/lib/intelligence/reports";
import { formatDuration, isoDay, resolveRange } from "@/app/lib/intelligence/ranges";
import { SOURCE_LABELS, type SourceCategory } from "@/app/lib/intelligence/classify";
import { categoryTotals, MIN_SESSIONS_FOR_RATE, queryRows, SORT_LABELS, SORTS, toRows } from "@/app/lib/intelligence/content-table";
import IntelligenceFrame from "@/app/components/admin/intelligence/IntelligenceFrame";
import { Empty, Panel } from "@/app/components/admin/intelligence/parts";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Content | Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

export default async function IntelligenceContentPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = resolveRange({ range: one(params, "range"), from: one(params, "from"), to: one(params, "to") });
  const [pages, collectionStart] = await Promise.all([getContent(range), getCollectionStart()]);

  const all = toRows(pages);
  const q = { category: one(params, "category"), q: one(params, "q"), sort: one(params, "sort"), dir: one(params, "dir"), page: one(params, "page") };
  const result = queryRows(all, q);
  const totals = categoryTotals(all);
  const label = (k: string) => SOURCE_LABELS[k as SourceCategory] ?? k;

  const keep = (extra: Record<string, string>) => {
    const qs = new URLSearchParams();
    if (range.key === "custom") {
      qs.set("from", isoDay(range.from));
      qs.set("to", isoDay(new Date(range.to.getTime() - 86_400_000)));
    } else qs.set("range", range.key);
    for (const [k, v] of Object.entries({ category: q.category ?? "", q: q.q ?? "", sort: result.sort, dir: result.dir, ...extra })) if (v) qs.set(k, v);
    return `/admin/intelligence/content?${qs}`;
  };

  return (
    <IntelligenceFrame active="content" range={range} collectionStart={collectionStart}>
      {all.length === 0 ? (
        <Empty>No page views were recorded in this range.</Empty>
      ) : (
        <div className="space-y-6">
          <p className="max-w-3xl text-sm text-[#1a1816]/60">
            Read each page left to right: does it <strong>attract</strong> visitors, <strong>engage</strong> them, make them{" "}
            <strong>explore</strong> further, and lead to <strong>action</strong>? Popularity is not effectiveness: sort by “Leads per 100
            sessions” to see which pages are associated with enquiries relative to their reach. Leads are <em>associated</em> with a page
            (the session viewed it and a lead was confirmed in that session), not caused by it. Rates appear only for pages with at least{" "}
            {MIN_SESSIONS_FOR_RATE} sessions.
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            <Link href={keep({ category: "", page: "" })} className={`border px-4 py-3 ${!q.category || q.category === "all" ? "border-[#6b1f1f] bg-white" : "border-[#1a1816]/10 bg-white hover:border-[#1a1816]/30"}`}>
              <p className="text-xs uppercase tracking-widest text-[#1a1816]/50">All pages</p>
              <p className="mt-1 text-xl font-light tabular-nums">{all.length}</p>
            </Link>
            {totals.map((t) => (
              <Link key={t.category} href={keep({ category: t.category, page: "" })} className={`border px-4 py-3 ${q.category === t.category ? "border-[#6b1f1f] bg-white" : "border-[#1a1816]/10 bg-white hover:border-[#1a1816]/30"}`}>
                <p className="text-xs uppercase tracking-widest text-[#1a1816]/50">{t.category}</p>
                <p className="mt-1 text-xl font-light tabular-nums">{t.views} <span className="text-xs text-[#1a1816]/40">views</span></p>
                <p className="text-xs text-[#1a1816]/45">{t.pages} pages · {t.leads} associated leads</p>
              </Link>
            ))}
          </div>

          <form className="flex flex-wrap items-end gap-3 border border-[#1a1816]/10 bg-white p-4 text-sm">
            {range.key === "custom" ? (<><input type="hidden" name="from" value={isoDay(range.from)} /><input type="hidden" name="to" value={isoDay(new Date(range.to.getTime() - 86_400_000))} /></>) : <input type="hidden" name="range" value={range.key} />}
            <label className="text-xs uppercase tracking-widest text-[#1a1816]/50">Search
              <input name="q" defaultValue={q.q ?? ""} placeholder="Title or path" className="mt-1 block w-56 border border-[#1a1816]/15 px-3 py-2 text-sm normal-case tracking-normal" />
            </label>
            <label className="text-xs uppercase tracking-widest text-[#1a1816]/50">Category
              <select name="category" defaultValue={q.category ?? "all"} className="mt-1 block border border-[#1a1816]/15 px-2 py-2 text-sm normal-case tracking-normal">
                <option value="all">All</option>
                {totals.map((t) => <option key={t.category} value={t.category}>{t.category}</option>)}
              </select>
            </label>
            <label className="text-xs uppercase tracking-widest text-[#1a1816]/50">Sort by
              <select name="sort" defaultValue={result.sort} className="mt-1 block border border-[#1a1816]/15 px-2 py-2 text-sm normal-case tracking-normal">
                {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
              </select>
            </label>
            <label className="text-xs uppercase tracking-widest text-[#1a1816]/50">Order
              <select name="dir" defaultValue={result.dir} className="mt-1 block border border-[#1a1816]/15 px-2 py-2 text-sm normal-case tracking-normal">
                <option value="desc">High to low</option><option value="asc">Low to high</option>
              </select>
            </label>
            <button className="border border-[#6b1f1f] bg-[#6b1f1f] px-4 py-2 text-xs uppercase tracking-widest text-white">Apply</button>
          </form>

          <Panel title={`Pages (${result.total})`} note="Sessions that started in the selected range. Time is visible time on that page.">
            {result.rows.length === 0 ? <Empty>No pages match these filters.</Empty> : (
              <div className="overflow-x-auto">
                <p className="mb-2 text-xs text-[#1a1816]/45 lg:hidden">Swipe the table sideways for all columns →</p>
                <table className="w-full min-w-[980px] text-left text-sm tabular-nums">
                  <thead className="text-xs uppercase tracking-widest text-[#1a1816]/50">
                    <tr className="align-bottom">
                      <th className="py-2 pr-4 font-normal">Page</th>
                      <th className="px-2 text-right font-normal">Views</th>
                      <th className="px-2 text-right font-normal">Sessions</th>
                      <th className="px-2 text-right font-normal">Landed</th>
                      <th className="px-2 text-right font-normal">Avg time</th>
                      <th className="px-2 text-right font-normal">Explored on</th>
                      <th className="px-2 text-right font-normal">CTA clicks</th>
                      <th className="px-2 text-right font-normal">Starts</th>
                      <th className="px-2 text-right font-normal">Leads</th>
                      <th className="px-2 text-right font-normal">Per 100</th>
                      <th className="pl-4 font-normal">Main sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r) => (
                      <tr key={r.path} className="border-t border-[#1a1816]/10 align-top">
                        <td className="max-w-[22rem] py-3 pr-4">
                          <p className="truncate font-medium" title={r.displayTitle}>{r.displayTitle}</p>
                          <p className="truncate text-xs text-[#1a1816]/45" title={r.path}>{r.path} · {r.category}</p>
                        </td>
                        <td className="px-2 text-right">{r.views}</td>
                        <td className="px-2 text-right">{r.sessions}</td>
                        <td className="px-2 text-right">{r.landing_sessions}</td>
                        <td className="px-2 text-right">{r.avg_engaged_ms ? formatDuration(r.avg_engaged_ms) : "—"}</td>
                        <td className="px-2 text-right">{r.continueRate === null ? <span title={`Fewer than ${MIN_SESSIONS_FOR_RATE} sessions`} className="text-[#1a1816]/35">n&lt;{MIN_SESSIONS_FOR_RATE}</span> : `${(r.continueRate * 100).toFixed(0)}%`}</td>
                        <td className="px-2 text-right">{r.cta_clicks}</td>
                        <td className="px-2 text-right">{r.starts}</td>
                        <td className="px-2 text-right">{r.assisted_leads}{r.landing_leads ? <span className="text-xs text-[#1a1816]/40"> ({r.landing_leads} landed)</span> : null}</td>
                        <td className="px-2 text-right">{r.leadsPer100 === null ? <span className="text-[#1a1816]/35">n&lt;{MIN_SESSIONS_FOR_RATE}</span> : r.leadsPer100.toFixed(1)}</td>
                        <td className="pl-4 text-xs text-[#1a1816]/60">{r.sources.map((s) => `${label(s.key)} ${s.sessions}`).join(" · ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.pages > 1 ? (
              <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-widest">
                {result.page > 1 ? <Link href={keep({ page: String(result.page - 1) })} className="text-[#6b1f1f]">← Previous</Link> : <span />}
                <span className="text-[#1a1816]/50">Page {result.page} of {result.pages}</span>
                {result.page < result.pages ? <Link href={keep({ page: String(result.page + 1) })} className="text-[#6b1f1f]">Next →</Link> : <span />}
              </div>
            ) : null}
          </Panel>
        </div>
      )}
    </IntelligenceFrame>
  );
}
