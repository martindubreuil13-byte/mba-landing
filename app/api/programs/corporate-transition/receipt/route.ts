import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { getApplicationByReceipt } from "@/app/lib/programs/queries";
import { buildReceipt } from "@/app/lib/programs/receipt";

export const dynamic = "force-dynamic";

/**
 * Restores the confirmation screen after a refresh. POST with the token in the body, never in a URL, so it cannot end up in
 * history, logs or a shared link. The answer holds no personal data (see Receipt). An unknown token and a malformed one look the same.
 */
export async function POST(req: Request) {
  if (!(await checkRateLimit(`transition-receipt:${getClientIp(req)}`, 3600, 60))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  let token = ""; try { const b = await req.json(); token = typeof b?.token === "string" ? b.token : ""; } catch { /* handled below */ }
  const application = token ? await getApplicationByReceipt(token).catch(() => null) : null;
  if (!application) return NextResponse.json({ error: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ success: true, ...(await buildReceipt(application)) }, { headers: { "Cache-Control": "no-store" } });
}
