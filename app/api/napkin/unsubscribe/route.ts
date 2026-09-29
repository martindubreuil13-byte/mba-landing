import { NextResponse } from "next/server";
import { unsubscribeNapkinLead } from "@/app/lib/napkin/queries";
import { verifyUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const leadId = verifyUnsubscribeToken(token);
  if (!leadId) return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });

  try {
    const result = await unsubscribeNapkinLead(leadId);
    if (result === "not_found") return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 404 });
    return NextResponse.json({ success: true, alreadyUnsubscribed: result === "already_unsubscribed" });
  } catch (error) {
    console.error("Napkin Principle unsubscribe failed:", error);
    return NextResponse.json({ error: "We could not update your preference. Please try again." }, { status: 500 });
  }
}
