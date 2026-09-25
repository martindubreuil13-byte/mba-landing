import type { DiscoveryRecord } from "./content";

/**
 * Pick My Brain retrieval: deterministic, field-weighted keyword ranking over
 * the discovery index. No generative AI — it can only surface what's
 * published, and it's deliberately allowed to say "nothing here".
 *
 * Ranking in brief:
 * - Queries and records are reduced to meaningful stems (stopwords removed,
 *   light suffix stripping), so "finding business ideas" and "how do I find
 *   a business idea" become the same terms.
 * - Rarer terms count for more (IDF), so a generic word like "business"
 *   can't carry a match on its own.
 * - Matches in `intents` and `title` outweigh `topics`, which outweigh
 *   `description` and `body`. Synonyms, prefixes and one-letter typos count,
 *   at reduced weight.
 * - A result must cover most of what was asked (by term weight) and clear a
 *   minimum score. Otherwise the search reports no match rather than
 *   padding the list with weak results.
 */

const STOPWORDS = new Set(
  (
    "a an the and or but if then so of to in on at by for with about from into over as is are was were be been being am " +
    "do does did doing done have has had having i me my mine we us our you your yours he she it its they them their this that these those " +
    "what which who whom whose when where why how can could should would will shall may might must " +
    "not yes any some all just very really also too than there here up out get got go going " +
    "want wants wanted need needs needed like know tell please help thing things something anything way ways " +
    "im ive id dont doesnt isnt cant wont whats hows " +
    // Common verbs and adjectives that would otherwise count as specific,
    // unmatched terms and sink an otherwise good match.
    "write writing make making create creating good best better great right proper actually now first"
  ).split(" ")
);

// Words that carry meaning in a phrase but are too common on this site to
// justify a match by themselves.
const GENERIC_WORDS = ["business", "businesses", "start", "starting", "entrepreneur", "founder", "company"];

// Plain words; stemmed at load time so they line up with tokenize().
const SYNONYM_GROUPS: string[][] = [
  ["money", "cash", "capital", "budget", "funding", "finance"],
  ["funding", "fundraising", "investment", "investor", "capital", "raise", "vc", "angel"],
  ["investor", "investment", "fundraising", "funding", "vc", "angel"],
  ["viable", "viability", "validate", "validation", "feasible"],
  ["validate", "validation", "test", "testing", "viable", "evidence"],
  ["app", "software", "saas", "product", "platform"],
  ["idea", "opportunity", "concept"],
  ["customer", "client", "buyer", "icp", "persona", "avatar", "audience"],
  ["quit", "leave", "leaving", "resign"],
  ["job", "career", "corporate", "employee", "employer"],
  ["architect", "architecture"],
  ["mvp", "prototype"],
  ["kill", "abandon"],
  ["price", "pricing", "charge"],
  ["ai", "artificial"],
  ["hire", "services", "consultant", "advisory"],
];

/** Deliberately light suffix stripping; consistency matters more than linguistics. */
export function stem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) w = w.slice(0, -1);
  for (const suffix of ["ingly", "ation", "ing", "ers", "er", "ed", "ly", "ness", "ment", "ity", "ies", "y", "e"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  return w;
}

const GENERIC = new Set(GENERIC_WORDS.map(stem));

const SYNONYMS = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS.map((g) => [...new Set(g.map(stem))])) {
  for (const term of group) {
    const set = SYNONYMS.get(term) ?? new Set<string>();
    group.forEach((other) => other !== term && set.add(other));
    SYNONYMS.set(term, set);
  }
}

// "I have no idea" and "I have an idea but no money" share nearly every
// word; this phrase is what tells them apart, so it becomes a single term.
const NO_IDEA_PHRASE = /\b(?:no|without an?|dont have an?|do not have an?|havent got an?)\s+(?:business\s+)?ideas?\b/g;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(NO_IDEA_PHRASE, " noidea ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem)
    .filter((t) => t.length > 1 || /\d/.test(t));
}

/** Grouping key for analytics: the same meaningful terms, in a stable order. */
export function normalizeQuery(text: string): string {
  return [...new Set(tokenize(text))].sort().join(" ");
}

function editDistanceWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > max) return false;
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length] <= max;
}

const FIELD_WEIGHTS = { intents: 3, title: 3, topics: 2, description: 1, body: 0.5 } as const;
type Field = keyof typeof FIELD_WEIGHTS;

type IndexedRecord = {
  record: DiscoveryRecord;
  fields: Record<Field, Set<string>>;
  intentTerms: Set<string>[];
  allTerms: Set<string>;
};

export type SearchIndex = {
  records: IndexedRecord[];
  idf: Map<string, number>;
  vocabulary: string[];
  maxIdf: number;
};

export function buildIndex(records: DiscoveryRecord[]): SearchIndex {
  const indexed: IndexedRecord[] = records.map((record) => {
    const fields: Record<Field, Set<string>> = {
      intents: new Set(record.intents.flatMap(tokenize)),
      title: new Set(tokenize(record.title)),
      topics: new Set(record.topics.flatMap(tokenize)),
      description: new Set(tokenize(record.description)),
      body: new Set(tokenize(record.body ?? "")),
    };
    const allTerms = new Set(Object.values(fields).flatMap((s) => [...s]));
    return { record, fields, intentTerms: record.intents.map((i) => new Set(tokenize(i))), allTerms };
  });

  const docFreq = new Map<string, number>();
  for (const r of indexed) for (const t of r.allTerms) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);

  const n = indexed.length;
  const idf = new Map<string, number>();
  for (const [t, df] of docFreq) {
    const value = Math.log(1 + n / df);
    idf.set(t, GENERIC.has(t) ? value * 0.35 : value);
  }

  return { records: indexed, idf, vocabulary: [...docFreq.keys()], maxIdf: Math.log(1 + n) };
}

type Expansion = { term: string; weight: number };

/** A query term, plus the index terms it may stand for (synonyms, prefix, typo). */
function expand(term: string, index: SearchIndex): Expansion[] {
  const out: Expansion[] = [];
  if (index.idf.has(term)) out.push({ term, weight: 1 });
  for (const syn of SYNONYMS.get(term) ?? []) if (index.idf.has(syn)) out.push({ term: syn, weight: 0.6 });

  if (out.length === 0 && term.length >= 4) {
    for (const v of index.vocabulary) {
      if (v.length > term.length && v.startsWith(term)) out.push({ term: v, weight: 0.7 });
      else if (editDistanceWithin(term, v, term.length >= 7 ? 2 : 1)) out.push({ term: v, weight: 0.75 });
    }
  }
  return out;
}

export type SearchHit = { record: DiscoveryRecord; score: number };
export type SearchOutcome = { matched: boolean; hits: SearchHit[] };

const MIN_COVERAGE = 0.6;
const MIN_SCORE = 0.3;
const MAX_RESULTS = 6;
// Secondary results must be reasonably close to the best one.
const RELATIVE_CUTOFF = 0.55;

export function search(query: string, index: SearchIndex): SearchOutcome {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0 || terms.every((t) => t === "no")) return { matched: false, hits: [] };

  const expanded = terms.map((t) => ({
    term: t,
    // Unknown terms get the maximum weight: something specific the site
    // has never written about should count heavily against a match.
    weight: index.idf.get(t) ?? index.maxIdf,
    expansions: expand(t, index),
  }));
  const totalWeight = expanded.reduce((sum, e) => sum + e.weight, 0);

  const hits: SearchHit[] = [];
  for (const r of index.records) {
    let fieldScore = 0;
    let covered = 0;

    for (const e of expanded) {
      let best = 0;
      for (const x of e.expansions) {
        for (const field of Object.keys(FIELD_WEIGHTS) as Field[]) {
          if (r.fields[field].has(x.term)) best = Math.max(best, FIELD_WEIGHTS[field] * x.weight);
        }
      }
      if (best > 0) {
        fieldScore += e.weight * best;
        covered += e.weight * Math.min(1, best / FIELD_WEIGHTS.topics);
      }
    }

    const coverage = covered / totalWeight;
    if (coverage < MIN_COVERAGE) continue;

    // How closely the query resembles one of the questions this page answers.
    let intentSimilarity = 0;
    for (const intent of r.intentTerms) {
      let shared = 0;
      let union = 0;
      const seen = new Set<string>();
      for (const e of expanded) {
        const direct = intent.has(e.term) || e.expansions.some((x) => x.weight >= 0.7 && intent.has(x.term));
        const viaSynonym = !direct && e.expansions.some((x) => intent.has(x.term));
        if (direct) shared += e.weight;
        else if (viaSynonym) shared += e.weight * 0.6;
        union += e.weight;
        e.expansions.forEach((x) => seen.add(x.term));
        seen.add(e.term);
      }
      for (const t of intent) if (!seen.has(t)) union += index.idf.get(t) ?? 0;
      if (union > 0) intentSimilarity = Math.max(intentSimilarity, shared / union);
    }

    // Small nudge when the query restates the page's own title, so an
    // exact title wins a tie against pages that merely share its words.
    const titleTerms = r.fields.title;
    const titleOverlap = titleTerms.size
      ? [...titleTerms].filter((t) => terms.includes(t)).length / titleTerms.size
      : 0;

    const normalizedFieldScore = fieldScore / (totalWeight * FIELD_WEIGHTS.intents);
    const score = 0.55 * normalizedFieldScore + 0.45 * intentSimilarity + 0.08 * titleOverlap;
    if (score >= MIN_SCORE) hits.push({ record: r.record, score });
  }

  hits.sort((a, b) => b.score - a.score);
  if (hits.length === 0) return { matched: false, hits: [] };

  const top = hits[0].score;
  const strong = hits.filter((h) => h.score >= top * RELATIVE_CUTOFF).slice(0, MAX_RESULTS);
  return { matched: true, hits: strong };
}
