/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getApplication } from "@/app/lib/programs/queries";
import { deliverInvitation } from "@/app/lib/programs/invitation";

/**
 * Manual "Resend invitation". Only for an application that is still waiting for a booking: not one already booked, and not one
 * that was declined or marked not-a-fit under the earlier review flow. The attempt is recorded either way; a refusal by the email
 * provider is returned as an error and is never reported as sent.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a: any = await getApplication(id);
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (a.status !== "INVITED" || a.booking_status === "booked") return NextResponse.json({ error: "This application is not waiting for a booking, so there is nothing to resend." }, { status: 409 });
  const r = await deliverInvitation(a);
  if (!r.ok) return NextResponse.json({ error: "The invitation could not be confirmed as sent. Refresh Admin and check the attempt log before retrying." }, { status: 502 });
  return NextResponse.json({ success: true, kind: r.kind });
}
