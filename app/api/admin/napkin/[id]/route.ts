import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { ADMIN_STATUSES } from "@/app/lib/napkin/admin-model";
import { updateNapkinAdminMetadata } from "@/app/lib/napkin/admin-queries";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !ADMIN_STATUSES.includes(body.status) || typeof body.notes !== "string" || body.notes.length > 10000) {
    return NextResponse.json({ error: "Invalid status or notes" }, { status: 400 });
  }
  try {
    const { id } = await params;
    const data = await updateNapkinAdminMetadata({ submissionId: id, status: body.status, notes: body.notes, adminEmail: admin.email });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not save admin details" }, { status: 500 });
  }
}
