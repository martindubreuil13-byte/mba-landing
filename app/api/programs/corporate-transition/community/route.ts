import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { chooseCommunity } from "@/app/lib/programs/community";
import { getApplicationByReceipt } from "@/app/lib/programs/queries";

export const dynamic = "force-dynamic";

/**
 * The optional community choice made on the confirmation screen. It is its own request, so a failure here can never touch the
 * application or the booking. Only an explicit "join" can create consent; "decline" records the answer and nothing else.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`transition-community:${ip}`, 3600, 30))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  let b: Record<string, unknown> = {}; try { b = await req.json(); } catch { /* handled below */ }
  const choice = b.choice === "join" || b.choice === "decline" ? b.choice : null;
  const token = typeof b.token === "string" ? b.token : "";
  if (!choice) return NextResponse.json({ error: "Choose one of the two options." }, { status: 400 });
  const application = token ? await getApplicationByReceipt(token).catch(() => null) : null;
  if (!application) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    const state = await chooseCommunity(application, choice, { ip, userAgent: req.headers.get("user-agent"), country: req.headers.get("x-vercel-ip-country"), region: req.headers.get("x-vercel-ip-country-region") });
    return NextResponse.json({ success: true, community: state });
  } catch (e) {
    console.error("Transition community choice failed:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "We couldn’t save that just now. Your conversation is not affected." }, { status: 500 });
  }
}
