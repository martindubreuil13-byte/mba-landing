import "server-only";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/app/lib/supabase/service";

export type LoggedResult = { href: string; type: string; title: string; score: number };

export type SearchRow = {
  id: string;
  created_at: string;
  query: string;
  normalized_query: string;
  matched: boolean;
  result_count: number;
  results: LoggedResult[];
  top_href: string | null;
  clicked_href: string | null;
  clicked_at: string | null;
  page_path: string | null;
};

export type QuestionRow = {
  id: string;
  created_at: string;
  question: string;
  name: string;
  email: string;
  search_id: string | null;
  page_path: string | null;
  email_sent: boolean;
};

/**
 * Rate-limit key for a visitor. The IP is hashed so no raw address is ever
 * written anywhere by this feature (the key only lives in api_rate_limits
 * for the length of a window).
 */
export function visitorKey(prefix: string, ip: string) {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return `${prefix}:${createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)}`;
}

/** Keep only a same-site path; never a query string or another origin. */
export function cleanPagePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return value.split(/[?#]/)[0].slice(0, 300);
}

export async function logSearch(input: {
  query: string;
  normalized_query: string;
  matched: boolean;
  results: LoggedResult[];
  page_path: string | null;
}): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("pmb_searches")
    .insert({
      ...input,
      result_count: input.results.length,
      top_href: input.results[0]?.href ?? null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Pick My Brain: failed to log search.", error);
    return null;
  }
  return data.id;
}

/** Records the first result clicked, and only if it was actually offered. */
export async function logClick(searchId: string, href: string) {
  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from("pmb_searches")
    .select("results, clicked_href")
    .eq("id", searchId)
    .maybeSingle();
  if (!row || row.clicked_href) return;
  const offered = (row.results as LoggedResult[]).some((r) => r.href === href);
  if (!offered) return;
  await supabase
    .from("pmb_searches")
    .update({ clicked_href: href, clicked_at: new Date().toISOString() })
    .eq("id", searchId)
    .is("clicked_href", null);
}

export async function createQuestion(input: {
  question: string;
  name: string;
  email: string;
  search_id: string | null;
  page_path: string | null;
}): Promise<QuestionRow> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("pmb_questions").insert(input).select().single();
  if (error) throw new Error(`Failed to save question: ${error.message}`);
  return data;
}

export async function markQuestionEmailed(id: string) {
  const supabase = getServiceClient();
  await supabase.from("pmb_questions").update({ email_sent: true }).eq("id", id);
}

export async function isKnownSearchId(id: string) {
  const supabase = getServiceClient();
  const { data } = await supabase.from("pmb_searches").select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Admin reporting

const REPORT_WINDOW_DAYS = 90;

export type QueryGroup = {
  key: string;
  label: string;
  count: number;
  lastAt: string;
  examples: string[];
};

export type ContentDemand = {
  href: string;
  title: string;
  type: string;
  searches: number;
  clicks: number;
  examples: string[];
};

export type PickMyBrainReport = {
  windowDays: number;
  totals: { searches: number; matched: number; unmatched: number; clicked: number; questions: number };
  unanswered: QueryGroup[];
  asking: ContentDemand[];
  questions: QuestionRow[];
  recent: SearchRow[];
};

function groupQueries(rows: SearchRow[]): QueryGroup[] {
  const groups = new Map<string, QueryGroup>();
  // rows arrive newest first, so the first query seen labels the group
  for (const row of rows) {
    const key = row.normalized_query || row.query.toLowerCase();
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { key, label: row.query, count: 1, lastAt: row.created_at, examples: [row.query] });
    } else {
      group.count += 1;
      if (group.examples.length < 4 && !group.examples.some((e) => e.toLowerCase() === row.query.toLowerCase())) {
        group.examples.push(row.query);
      }
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
}

export async function getPickMyBrainReport(): Promise<PickMyBrainReport> {
  const supabase = getServiceClient();
  const since = new Date(Date.now() - REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: searchData, error: searchError }, { data: questionData, error: questionError }] = await Promise.all([
    supabase.from("pmb_searches").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
    supabase.from("pmb_questions").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  if (searchError) throw new Error(`Failed to load searches: ${searchError.message}`);
  if (questionError) throw new Error(`Failed to load questions: ${questionError.message}`);

  const searches = (searchData ?? []) as SearchRow[];
  const questions = (questionData ?? []) as QuestionRow[];
  const matched = searches.filter((s) => s.matched);

  // What people are asking, grouped by the content that answered them:
  // differently worded searches for the same thing land on the same page.
  const demand = new Map<string, ContentDemand>();
  for (const s of matched) {
    const top = s.results[0];
    if (!top) continue;
    const entry = demand.get(top.href) ?? { href: top.href, title: top.title, type: top.type, searches: 0, clicks: 0, examples: [] };
    entry.searches += 1;
    if (s.clicked_href) entry.clicks += 1;
    if (entry.examples.length < 4 && !entry.examples.some((e) => e.toLowerCase() === s.query.toLowerCase())) {
      entry.examples.push(s.query);
    }
    demand.set(top.href, entry);
  }

  return {
    windowDays: REPORT_WINDOW_DAYS,
    totals: {
      searches: searches.length,
      matched: matched.length,
      unmatched: searches.length - matched.length,
      clicked: searches.filter((s) => s.clicked_href).length,
      questions: questions.length,
    },
    unanswered: groupQueries(searches.filter((s) => !s.matched)),
    asking: [...demand.values()].sort((a, b) => b.searches - a.searches),
    questions,
    recent: searches.slice(0, 50),
  };
}
