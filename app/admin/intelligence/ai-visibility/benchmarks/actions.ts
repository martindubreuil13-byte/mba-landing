"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { addQuestion, addResult, deleteResult, importResults, setQuestionActive } from "@/app/lib/intelligence/benchmarks";
import { parseResultsCsv, questionSchema, resultSchema } from "@/app/lib/intelligence/benchmarks-model";

const BASE = "/admin/intelligence/ai-visibility/benchmarks";
const done = (kind: "ok" | "error", message: string): never => {
  revalidatePath(BASE);
  redirect(`${BASE}?${kind}=${encodeURIComponent(message.slice(0, 300))}`);
};
const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

// Every action re-checks the admin session itself: the route guard in proxy.ts is not the only line of defence.

export async function addQuestionAction(form: FormData) {
  await requireAdmin();
  const parsed = questionSchema.safeParse({ question: str(form, "question"), topic: str(form, "topic") });
  if (!parsed.success) return done("error", "The question must be 5–500 characters.");
  try { await addQuestion(parsed.data.question, parsed.data.topic ?? null); } catch { return done("error", "Could not save the question."); }
  return done("ok", "Question added.");
}

export async function toggleQuestionAction(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return done("error", "Invalid question.");
  try { await setQuestionActive(id, str(form, "active") === "true"); } catch { return done("error", "Could not update the question."); }
  return done("ok", "Question updated.");
}

export async function addResultAction(form: FormData) {
  await requireAdmin();
  const parsed = resultSchema.safeParse(Object.fromEntries(["question_id", "platform", "model_label", "asked_on", "mentions_business", "mentions_martin", "cites_site", "recommends_business", "positioning", "cited_urls", "excerpt", "notes"].map((k) => [k, str(form, k)])));
  if (!parsed.success) return done("error", `Check the form: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}.`);
  try { await addResult(parsed.data); } catch { return done("error", "Could not save the result."); }
  return done("ok", "Result recorded.");
}

export async function deleteResultAction(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return done("error", "Invalid result.");
  try { await deleteResult(id); } catch { return done("error", "Could not delete the result."); }
  return done("ok", "Result deleted.");
}

export async function importCsvAction(form: FormData) {
  await requireAdmin();
  const { rows, errors } = parseResultsCsv(str(form, "csv").slice(0, 200_000));
  if (errors.length) return done("error", `Nothing imported. ${errors.slice(0, 3).join(" ")}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ""}`);
  try {
    const r = await importResults(rows);
    return done("ok", `Imported ${r.results} results (${r.questionsCreated} new questions).`);
  } catch {
    return done("error", "Import failed; nothing was partially applied to the page, check the data and retry.");
  }
}
