import { contentCategory } from "./content";
import type { ContentPage } from "./reports";

/**
 * Turns the database's per-page rows into what the Content table shows. Pure, so sorting, filtering, small-sample handling and
 * pagination are unit-tested. Titles come from the page's own <title>, with the site-name suffix removed.
 */
export const MIN_SESSIONS_FOR_RATE = 5;
export const PAGE_SIZE = 25;

export const SORTS = ["views", "sessions", "landing", "time", "continue", "ctas", "starts", "leads", "lead_rate"] as const;
export type SortKey = (typeof SORTS)[number];
export const SORT_LABELS: Record<SortKey, string> = {
  views: "Page views",
  sessions: "Sessions",
  landing: "Landing sessions",
  time: "Avg time on page",
  continue: "Continued exploring",
  ctas: "CTA clicks",
  starts: "Assessment starts",
  leads: "Associated leads",
  lead_rate: "Leads per 100 sessions",
};

export type ContentRow = ContentPage & {
  category: string;
  displayTitle: string;
  /** Share of this page's sessions that viewed another page afterwards; null when too few sessions to say. */
  continueRate: number | null;
  /** Associated leads per 100 sessions that viewed the page; null when too few sessions to say. */
  leadsPer100: number | null;
};

export function cleanTitle(title: string | null, path: string): string {
  const t = (title ?? "").replace(/\s*\|\s*(The Modern Business Architect|Martin Dubreuil)\s*$/i, "").trim();
  return t || path;
}

export function toRows(pages: ContentPage[]): ContentRow[] {
  return pages.map((p) => ({
    ...p,
    category: contentCategory(p.path),
    displayTitle: cleanTitle(p.title, p.path),
    continueRate: p.sessions >= MIN_SESSIONS_FOR_RATE ? p.continued_sessions / p.sessions : null,
    leadsPer100: p.sessions >= MIN_SESSIONS_FOR_RATE ? (p.assisted_leads / p.sessions) * 100 : null,
  }));
}

const sortValue = (r: ContentRow, key: SortKey): number => {
  switch (key) {
    case "views": return r.views;
    case "sessions": return r.sessions;
    case "landing": return r.landing_sessions;
    case "time": return r.avg_engaged_ms;
    case "continue": return r.continueRate ?? -1;
    case "ctas": return r.cta_clicks;
    case "starts": return r.starts;
    case "leads": return r.assisted_leads;
    case "lead_rate": return r.leadsPer100 ?? -1;
  }
};

export type ContentQuery = { category?: string; q?: string; sort?: string; dir?: string; page?: string };

export function queryRows(rows: ContentRow[], query: ContentQuery) {
  const sort = (SORTS as readonly string[]).includes(query.sort ?? "") ? (query.sort as SortKey) : "views";
  const dir = query.dir === "asc" ? "asc" : "desc";
  const needle = (query.q ?? "").trim().toLowerCase().slice(0, 100);
  const filtered = rows.filter(
    (r) =>
      (!query.category || query.category === "all" || r.category === query.category) &&
      (!needle || r.path.toLowerCase().includes(needle) || r.displayTitle.toLowerCase().includes(needle))
  );
  const sorted = [...filtered].sort((a, b) => {
    const d = sortValue(a, sort) - sortValue(b, sort);
    return (dir === "asc" ? d : -d) || b.views - a.views || a.path.localeCompare(b.path);
  });
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1), pages);
  return { rows: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: sorted.length, page, pages, sort, dir };
}

/** Totals per category over ALL pages (not just the filtered/paged ones). */
export function categoryTotals(rows: ContentRow[]) {
  const map = new Map<string, { category: string; pages: number; views: number; sessions: number; leads: number }>();
  for (const r of rows) {
    const t = map.get(r.category) ?? { category: r.category, pages: 0, views: 0, sessions: 0, leads: 0 };
    t.pages += 1;
    t.views += r.views;
    t.sessions += r.sessions;
    t.leads += r.assisted_leads;
    map.set(r.category, t);
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}
