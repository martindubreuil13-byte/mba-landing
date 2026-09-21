import { NextResponse } from "next/server";
import { recordAssessmentCtaClick } from "@/app/lib/assessment/queries";

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const assessmentId = clean(body.assessmentId, 100);
  const cta = clean(body.cta, 100);
  if (!assessmentId || !cta) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    await recordAssessmentCtaClick(assessmentId, cta);
  } catch (error) {
    // Non-critical telemetry — never surface this as an error to the visitor.
    console.error("Failed to record CTA click:", error);
  }

  return NextResponse.json({ success: true });
}
