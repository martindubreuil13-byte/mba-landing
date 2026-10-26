import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listQuestions, listResults } from "@/app/lib/intelligence/benchmarks";
import { CSV_COLUMNS, KNOWN_PLATFORMS, formatRate, summarize } from "@/app/lib/intelligence/benchmarks-model";
import AdminShell from "@/app/components/admin/AdminShell";
import { Empty, Panel } from "@/app/components/admin/intelligence/parts";
import { addQuestionAction, addResultAction, deleteResultAction, importCsvAction, toggleQuestionAction } from "./actions";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "AI Benchmarks | Website Intelligence" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);
const input = "mt-1 block w-full border border-[#1a1816]/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-[#1a1816]";
const labelCls = "text-xs uppercase tracking-widest text-[#1a1816]/50";
const btn = "border border-[#6b1f1f] bg-[#6b1f1f] px-4 py-2 text-xs uppercase tracking-widest text-white";
const TRI = [["", "Not assessed"], ["yes", "Yes"], ["no", "No"]] as const;

export default async function BenchmarksPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const [questions, results] = await Promise.all([listQuestions(), listResults()]);
  const summary = summarize(results);
  const ok = one(params, "ok");
  const error = one(params, "error");

  return (
    <AdminShell>
      <p className="text-xs uppercase tracking-[0.25em] text-[#6b1f1f]">Website Intelligence · AI Visibility</p>
      <h1 className="mt-2 text-3xl font-light">AI answer benchmarks</h1>
      <Link href="/admin/intelligence/ai-visibility" className="mt-2 inline-block text-xs uppercase tracking-widest text-[#6b1f1f]">← AI Visibility</Link>
      <p className="mt-3 max-w-3xl text-sm text-[#1a1816]/60">
        A manual record of what AI assistants said when asked questions from your question universe. Each result is <strong>one answer you
        observed</strong>, on one date, from one assistant. It does not measure every answer an assistant gives, and nothing here calls an AI
        provider or costs money. Rates are always shown as <em>yes ÷ answers assessed</em>.
      </p>

      {ok ? <p role="status" className="mt-4 border border-[#1a1816]/15 bg-white px-4 py-3 text-sm">{ok}</p> : null}
      {error ? <p role="alert" className="mt-4 border border-[#6b1f1f]/40 bg-[#6b1f1f]/5 px-4 py-3 text-sm text-[#6b1f1f]">{error}</p> : null}

      <div className="mt-8 space-y-6">
        <Panel title="Summary by assistant" note="Counts of recorded answers; not a share of all answers.">
          {summary.length === 0 ? <Empty>No results recorded yet.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
                <thead className="text-xs uppercase tracking-widest text-[#1a1816]/50"><tr><th className="py-2 pr-4 font-normal">Assistant</th><th className="px-2 text-right font-normal">Answers</th><th className="px-2 text-right font-normal">Names the business</th><th className="px-2 text-right font-normal">Names Martin</th><th className="px-2 text-right font-normal">Cites the site</th><th className="px-2 text-right font-normal">Recommends</th><th className="px-2 text-right font-normal">Positioning accurate</th></tr></thead>
                <tbody>{summary.map((s) => (
                  <tr key={s.platform} className="border-t border-[#1a1816]/10"><td className="py-2 pr-4">{s.platform}</td><td className="px-2 text-right">{s.answers}</td><td className="px-2 text-right">{formatRate(s.mentions_business)}</td><td className="px-2 text-right">{formatRate(s.mentions_martin)}</td><td className="px-2 text-right">{formatRate(s.cites_site)}</td><td className="px-2 text-right">{formatRate(s.recommends_business)}</td><td className="px-2 text-right">{formatRate(s.positioning_accurate)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Question universe" note="The questions you ask assistants.">
            <form action={addQuestionAction} className="mb-4 space-y-3">
              <label className={labelCls}>Question<input name="question" required minLength={5} maxLength={500} className={input} placeholder="How do I know if my business idea is viable?" /></label>
              <label className={labelCls}>Topic (optional)<input name="topic" maxLength={80} className={input} /></label>
              <button className={btn}>Add question</button>
            </form>
            {questions.length === 0 ? <Empty>No questions yet.</Empty> : (
              <ul className="space-y-2 text-sm">
                {questions.map((q) => (
                  <li key={q.id} className="flex items-start justify-between gap-3 border-t border-[#1a1816]/10 pt-2">
                    <span className={q.active ? "" : "text-[#1a1816]/40 line-through"}>{q.question}{q.topic ? <span className="text-xs text-[#1a1816]/45"> · {q.topic}</span> : null}</span>
                    <form action={toggleQuestionAction}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="active" value={String(!q.active)} /><button className="shrink-0 text-xs uppercase tracking-widest text-[#1a1816]/50 hover:text-[#1a1816]">{q.active ? "Retire" : "Restore"}</button></form>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Record a result" note="What the assistant actually said, observed by you.">
            {questions.filter((q) => q.active).length === 0 ? <Empty>Add a question first.</Empty> : (
              <form action={addResultAction} className="grid grid-cols-2 gap-3">
                <label className={`${labelCls} col-span-2`}>Question
                  <select name="question_id" required className={input}>{questions.filter((q) => q.active).map((q) => <option key={q.id} value={q.id}>{q.question}</option>)}</select>
                </label>
                <label className={labelCls}>Assistant<input name="platform" required list="platforms" maxLength={60} className={input} /><datalist id="platforms">{KNOWN_PLATFORMS.map((p) => <option key={p} value={p} />)}</datalist></label>
                <label className={labelCls}>Model / mode<input name="model_label" maxLength={80} className={input} placeholder="e.g. web search on" /></label>
                <label className={labelCls}>Asked on<input type="date" name="asked_on" required defaultValue={new Date().toISOString().slice(0, 10)} className={input} /></label>
                <label className={labelCls}>Positioning understood
                  <select name="positioning" className={input}><option value="">Not assessed</option><option value="accurate">Accurate</option><option value="partial">Partly</option><option value="inaccurate">Inaccurate</option></select>
                </label>
                {([["mentions_business", "Names the business"], ["mentions_martin", "Names Martin"], ["cites_site", "Cites the website"], ["recommends_business", "Recommends the business"]] as const).map(([name, text]) => (
                  <label key={name} className={labelCls}>{text}<select name={name} className={input}>{TRI.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
                ))}
                <label className={`${labelCls} col-span-2`}>Cited URLs (space or line separated)<textarea name="cited_urls" rows={2} maxLength={3000} className={input} /></label>
                <label className={`${labelCls} col-span-2`}>Excerpt of the answer (optional)<textarea name="excerpt" rows={3} maxLength={1500} className={input} /></label>
                <label className={`${labelCls} col-span-2`}>Notes<textarea name="notes" rows={2} maxLength={1500} className={input} /></label>
                <div className="col-span-2"><button className={btn}>Record result</button></div>
              </form>
            )}
          </Panel>
        </div>

        <Panel title="Import results (CSV)" note={`Paste a CSV with a header row. Required: question, platform, asked_on (YYYY-MM-DD). Optional: ${CSV_COLUMNS.filter((c) => !["question", "platform", "asked_on"].includes(c)).join(", ")}. Yes/no/blank for the observations. Questions are matched by exact text or created. The whole file is rejected if any row is invalid.`}>
          <form action={importCsvAction} className="space-y-3">
            <textarea name="csv" rows={5} required maxLength={200000} className={`${input} font-mono text-xs`} placeholder={CSV_COLUMNS.join(",")} />
            <button className={btn}>Import</button>
          </form>
        </Panel>

        <Panel title={`Recorded results (${results.length})`} note="Newest first.">
          {results.length === 0 ? <Empty>Nothing recorded yet.</Empty> : (
            <ul className="space-y-4 text-sm">
              {results.map((r) => (
                <li key={r.id} className="border-t border-[#1a1816]/10 pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <p><strong>{r.platform}</strong>{r.model_label ? <span className="text-[#1a1816]/50"> ({r.model_label})</span> : null} <span className="text-xs text-[#1a1816]/45">· {r.asked_on} · {r.method}</span><br /><span className="text-[#1a1816]/70">{r.question}</span></p>
                    <form action={deleteResultAction}><input type="hidden" name="id" value={r.id} /><button className="text-xs uppercase tracking-widest text-[#1a1816]/45 hover:text-[#6b1f1f]">Delete</button></form>
                  </div>
                  <p className="mt-1 text-xs text-[#1a1816]/55">
                    {([["Names business", r.mentions_business], ["Names Martin", r.mentions_martin], ["Cites site", r.cites_site], ["Recommends", r.recommends_business]] as const).map(([t, v]) => `${t}: ${v === null ? "not assessed" : v ? "yes" : "no"}`).join(" · ")}
                    {r.positioning ? ` · positioning ${r.positioning}` : ""}
                  </p>
                  {r.cited_urls.length ? <p className="mt-1 break-words text-xs text-[#1a1816]/45">{r.cited_urls.join(" · ")}</p> : null}
                  {r.notes ? <p className="mt-1 text-xs text-[#1a1816]/60">{r.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
