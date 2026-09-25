import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { getSearchIndex } from "@/app/lib/pick-my-brain/index";
import { search, normalizeQuery } from "@/app/lib/pick-my-brain/search";
import { cleanPagePath, logSearch, visitorKey } from "@/app/lib/pick-my-brain/queries";

// POST-only and under /api/ (disallowed in robots.txt): visitor queries never
// become URLs, so there's nothing for a crawler to index.
const NO_INDEX = { "X-Robots-Tag": "noindex, nofollow" };

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 30;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: NO_INDEX });
  }

  const query = typeof body.query === "string" ? body.query.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  if (query.length < 2) {
    return NextResponse.json({ error: "Type a question or a topic." }, { status: 400, headers: NO_INDEX });
  }

  const allowed = await checkRateLimit(
    visitorKey("pmb_search", getClientIp(req)),
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS
  );
  if (!allowed) {
    return NextResponse.json({ error: "That's a lot of questions. Give it a minute." }, { status: 429, headers: NO_INDEX });
  }

  const outcome = search(query, await getSearchIndex());
  const results = outcome.hits.map(({ record, score }) => ({
    href: record.href,
    type: record.type,
    title: record.title,
    description: record.description,
    score: Math.round(score * 1000) / 1000,
  }));

  const searchId = await logSearch({
    query,
    normalized_query: normalizeQuery(query),
    matched: outcome.matched,
    results: results.map(({ href, type, title, score }) => ({ href, type, title, score })),
    page_path: cleanPagePath(body.pagePath),
  });

  return NextResponse.json(
    {
      searchId,
      matched: outcome.matched,
      results: results.map(({ href, type, title, description }) => ({ href, type, title, description })),
    },
    { headers: NO_INDEX }
  );
}
