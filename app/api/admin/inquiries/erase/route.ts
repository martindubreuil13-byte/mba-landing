import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { eraseInquiries } from "@/app/lib/inquiries/store";
import { sameSite } from "@/app/lib/inquiries/same-site";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST { id } or { email } -> { deleted }. Administrator only. Permanently deletes one stored inquiry, or every inquiry of one e-mail address (a
 * data-subject request). The person's lead record and consent history are not touched here. The booking and owner e-mails already sent are not
 * recalled. There is no screen for this yet (Phase 2c); it is available to the signed-in administrator from day one.
 */
export async function POST(req: Request) {
  if (!sameSite(req)) return NextResponse.json({ error: "This request is not allowed." }, { status: 403 });
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: unknown; email?: unknown } | null;
  try {
    if (typeof body?.id === "string" && UUID.test(body.id)) return NextResponse.json(await eraseInquiries({ id: body.id }));
    if (typeof body?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return NextResponse.json(await eraseInquiries({ email: body.email }));
  } catch (e) {
    console.error("Inquiry erase failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not erase." }, { status: 500 });
  }
  return NextResponse.json({ error: "Provide an inquiry id or an email address." }, { status: 400 });
}
