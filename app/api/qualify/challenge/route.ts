import { NextResponse } from "next/server";
import { inquiryStoreEnabled } from "@/app/lib/inquiries/config";
import { issueFormToken } from "@/app/lib/inquiries/form-token";

export const dynamic = "force-dynamic";

/**
 * GET -> { token }. The inquiry form fetches this when it opens; the signed, personal-data-free token proves to /api/qualify that the form was open
 * for at least a moment (see app/lib/inquiries/form-token.ts). Nothing is stored. Answers 404 while stored inquiries are switched off.
 */
export async function GET() {
  if (!inquiryStoreEnabled()) return new NextResponse(null, { status: 404 });
  try { return NextResponse.json({ token: issueFormToken() }, { headers: { "cache-control": "no-store" } }); }
  catch (e) { console.error("inquiry challenge unavailable:", e instanceof Error ? e.message : e); return new NextResponse(null, { status: 503 }); }
}
