import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServiceClient } from "@/app/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Daily retention clean-up (see wi_maintenance in the Website Intelligence migration). Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`; Hobby plans allow one run per day (timing within the scheduled hour).
 * Without CRON_SECRET configured the endpoint refuses every call.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await getServiceClient().rpc("wi_maintenance");
  if (error) {
    console.error("Website Intelligence maintenance failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result: data });
}
