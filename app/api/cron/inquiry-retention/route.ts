import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { inquiryPurgeEnabled, retentionMonths } from "@/app/lib/inquiries/config";
import { purgeExpired } from "@/app/lib/inquiries/store";

export const dynamic = "force-dynamic";

/**
 * Daily retention for inquiry messages. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET` (same scheme as intelligence-maintenance).
 * Without CRON_SECRET it refuses every call. While PROGRAM_INQUIRY_PURGE_ENABLED is off it only REPORTS what is due. `?dryRun=1` always reports only.
 * Messages older than INQUIRY_RETENTION_MONTHS (default and maximum 24) are blanked; the person, program, timestamps and delivery statuses stay.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== wanted.length || !timingSafeEqual(given, wanted)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1" || !inquiryPurgeEnabled();
  try {
    const result = await purgeExpired({ dryRun });
    return NextResponse.json({ ok: true, retentionMonths: retentionMonths(), ...result });
  } catch (e) {
    console.error("Inquiry retention failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
