import { handleCollect } from "@/app/lib/intelligence/ingest";

export const dynamic = "force-dynamic";

/** Website Intelligence beacon. Public by design, but validated, size-capped, rate-limited and write-only. */
export async function POST(req: Request) {
  const outcome = await handleCollect(req);
  return new Response(null, { status: outcome.status, headers: { "Cache-Control": "no-store" } });
}
