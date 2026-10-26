import { z } from "zod";

/**
 * AI recommendation / citation benchmark: pure model. Results are MANUALLY recorded observations of single answers an assistant
 * gave. They are never automated here, never claimed to represent every answer, and are kept apart from visitor analytics.
 * Every observation may be "not assessed" (null), and rates are always reported with their denominator.
 */
export const KNOWN_PLATFORMS = ["ChatGPT", "Claude", "Perplexity", "Gemini", "Microsoft Copilot", "Grok", "DeepSeek", "Meta AI"] as const;

const tri = z
  .union([z.literal("yes"), z.literal("no"), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "yes" ? true : v === "no" ? false : null));

/** Up to 10 http(s) URLs, separated by whitespace, commas or "|". Anything else is dropped. */
export function parseUrls(raw: string | null | undefined): string[] {
  return [...new Set((raw ?? "").split(/[\s,|]+/).filter(Boolean))]
    .filter((u) => {
      try {
        const p = new URL(u).protocol;
        return p === "https:" || p === "http:";
      } catch {
        return false;
      }
    })
    .map((u) => u.slice(0, 500))
    .slice(0, 10);
}

const text = (max: number) => z.string().trim().max(max).transform((v) => v || null).nullable().optional();

export const questionSchema = z.object({
  question: z.string().trim().min(5).max(500),
  topic: text(80),
});

export const resultSchema = z.object({
  question_id: z.string().uuid(),
  platform: z.string().trim().min(2).max(60),
  model_label: text(80),
  asked_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mentions_business: tri,
  mentions_martin: tri,
  cites_site: tri,
  recommends_business: tri,
  positioning: z.union([z.enum(["accurate", "partial", "inaccurate"]), z.literal(""), z.null(), z.undefined()]).transform((v) => v || null),
  cited_urls: z.string().max(3000).optional().transform(parseUrls),
  excerpt: text(1500),
  notes: text(1500),
});
export type ResultInput = z.infer<typeof resultSchema>;

export type StoredResult = {
  platform: string;
  mentions_business: boolean | null;
  mentions_martin: boolean | null;
  cites_site: boolean | null;
  recommends_business: boolean | null;
  positioning: "accurate" | "partial" | "inaccurate" | null;
};

export type Rate = { yes: number; assessed: number };
export type PlatformSummary = {
  platform: string;
  answers: number;
  mentions_business: Rate;
  mentions_martin: Rate;
  cites_site: Rate;
  recommends_business: Rate;
  positioning_accurate: Rate;
};

const rate = (): Rate => ({ yes: 0, assessed: 0 });
const add = (r: Rate, v: boolean | null) => {
  if (v === null) return;
  r.assessed += 1;
  if (v) r.yes += 1;
};

/** Per-platform counts. A rate is yes ÷ assessed; unassessed answers never count as "no". */
export function summarize(results: StoredResult[]): PlatformSummary[] {
  const map = new Map<string, PlatformSummary>();
  for (const r of results) {
    const s =
      map.get(r.platform) ??
      { platform: r.platform, answers: 0, mentions_business: rate(), mentions_martin: rate(), cites_site: rate(), recommends_business: rate(), positioning_accurate: rate() };
    s.answers += 1;
    add(s.mentions_business, r.mentions_business);
    add(s.mentions_martin, r.mentions_martin);
    add(s.cites_site, r.cites_site);
    add(s.recommends_business, r.recommends_business);
    add(s.positioning_accurate, r.positioning === null ? null : r.positioning === "accurate");
    map.set(r.platform, s);
  }
  return [...map.values()].sort((a, b) => b.answers - a.answers || a.platform.localeCompare(b.platform));
}

export const formatRate = (r: Rate) => (r.assessed ? `${r.yes}/${r.assessed}` : "—");

// --- CSV import -----------------------------------------------------------------------------------------------------
export const CSV_COLUMNS = ["question", "platform", "model", "asked_on", "mentions_business", "mentions_martin", "cites_site", "recommends_business", "positioning", "cited_urls", "notes"] as const;
export const MAX_IMPORT_ROWS = 200;

/** Minimal RFC-4180 style parser: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const text = input.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export type ImportRow = { question: string; line: number; result: Omit<ResultInput, "question_id"> };
export type ImportParse = { rows: ImportRow[]; errors: string[] };

const importSchema = resultSchema.omit({ question_id: true });

/** Validates a pasted CSV (header row required). Nothing is stored here; the caller stores only if there are no errors. */
export function parseResultsCsv(raw: string): ImportParse {
  const table = parseCsv(raw);
  if (table.length < 2) return { rows: [], errors: ["The CSV needs a header row and at least one result row."] };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const missing = ["question", "platform", "asked_on"].filter((c) => !header.includes(c));
  if (missing.length) return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}.`] };
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], errors: [`At most ${MAX_IMPORT_ROWS} rows can be imported at once.`] };

  const rows: ImportRow[] = [];
  const errors: string[] = [];
  table.slice(1).forEach((cells, i) => {
    const get = (name: string) => cells[header.indexOf(name)]?.trim() ?? "";
    const question = get("question");
    const parsed = importSchema.safeParse({
      platform: get("platform"),
      model_label: get("model"),
      asked_on: get("asked_on"),
      mentions_business: get("mentions_business").toLowerCase(),
      mentions_martin: get("mentions_martin").toLowerCase(),
      cites_site: get("cites_site").toLowerCase(),
      recommends_business: get("recommends_business").toLowerCase(),
      positioning: get("positioning").toLowerCase(),
      cited_urls: get("cited_urls"),
      notes: get("notes"),
    });
    if (question.length < 5 || question.length > 500) errors.push(`Row ${i + 2}: question must be 5–500 characters.`);
    else if (!parsed.success) errors.push(`Row ${i + 2}: ${parsed.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
    else rows.push({ question, line: i + 2, result: parsed.data });
  });
  return { rows, errors };
}
