import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { PMB_STATUSES, updateQuestionStatus, type PmbQuestionStatus } from "@/app/lib/pick-my-brain/queries";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const status = body.status;

  if (typeof status !== "string" || !PMB_STATUSES.includes(status as PmbQuestionStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updateQuestionStatus(id, status as PmbQuestionStatus);
  return NextResponse.json({ success: true });
}
