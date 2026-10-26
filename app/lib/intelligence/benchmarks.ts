import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { ImportRow, ResultInput, StoredResult } from "./benchmarks-model";

export type Question = { id: string; question: string; topic: string | null; active: boolean; created_at: string };
export type ResultRow = StoredResult & {
  id: string; question_id: string; model_label: string | null; method: "manual" | "import"; asked_on: string;
  cited_urls: string[]; excerpt: string | null; notes: string | null; question: string;
};

export async function listQuestions(): Promise<Question[]> {
  const { data, error } = await getServiceClient().from("wi_benchmark_questions").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as Question[];
}

export async function listResults(limit = 300): Promise<ResultRow[]> {
  const { data, error } = await getServiceClient()
    .from("wi_benchmark_results")
    .select("*, q:wi_benchmark_questions(question)")
    .order("asked_on", { ascending: false })
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const { q, ...rest } = r as Record<string, unknown> & { q: { question: string } | { question: string }[] | null };
    return { ...rest, question: (Array.isArray(q) ? q[0]?.question : q?.question) ?? "(deleted question)" } as ResultRow;
  });
}

export async function addQuestion(question: string, topic: string | null) {
  const { error } = await getServiceClient().from("wi_benchmark_questions").insert({ question, topic });
  if (error) throw new Error(error.message);
}

export async function setQuestionActive(id: string, active: boolean) {
  const { error } = await getServiceClient().from("wi_benchmark_questions").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

const toRow = (questionId: string, r: Omit<ResultInput, "question_id">, method: "manual" | "import") => ({
  question_id: questionId, method, platform: r.platform, model_label: r.model_label ?? null, asked_on: r.asked_on,
  mentions_business: r.mentions_business, mentions_martin: r.mentions_martin, cites_site: r.cites_site,
  recommends_business: r.recommends_business, positioning: r.positioning, cited_urls: r.cited_urls,
  excerpt: r.excerpt ?? null, notes: r.notes ?? null,
});

export async function addResult(r: ResultInput) {
  const { error } = await getServiceClient().from("wi_benchmark_results").insert(toRow(r.question_id, r, "manual"));
  if (error) throw new Error(error.message);
}

export async function deleteResult(id: string) {
  const { error } = await getServiceClient().from("wi_benchmark_results").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Stores an already-validated import: finds each question by exact text or creates it, then inserts all results. */
export async function importResults(rows: ImportRow[]): Promise<{ results: number; questionsCreated: number }> {
  const db = getServiceClient();
  const existing = await listQuestions();
  const byText = new Map(existing.map((q) => [q.question, q.id]));
  let created = 0;
  for (const text of new Set(rows.map((r) => r.question))) {
    if (byText.has(text)) continue;
    const { data, error } = await db.from("wi_benchmark_questions").insert({ question: text }).select("id").single();
    if (error) throw new Error(error.message);
    byText.set(text, data.id);
    created += 1;
  }
  const { error } = await db.from("wi_benchmark_results").insert(rows.map((r) => toRow(byText.get(r.question)!, r.result, "import")));
  if (error) throw new Error(error.message);
  return { results: rows.length, questionsCreated: created };
}

export async function getAiDomains(): Promise<{ domain: string; platform: string; active: boolean; note: string | null }[]> {
  const { data, error } = await getServiceClient().from("wi_ai_referral_domains").select("domain, platform, active, note").order("platform").order("domain");
  if (error) throw new Error(error.message);
  return data ?? [];
}
