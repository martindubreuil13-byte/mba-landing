import { signAttribution } from "@/app/lib/email-studio/booking-attribution";
import { NextResponse } from "next/server";
import { getServiceClient } from "@/app/lib/supabase/service";
import { isUuid } from "@/app/lib/relationships/model";
import { approvedDestination, attributionCookie, suspectedScanner } from "@/app/lib/email-studio/intelligence";
import { SITE_URL } from "@/app/lib/seo";

async function redirect(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response(null, { status: 404 });
  const db = getServiceClient();
  const { data, error } = await db.from("campaign_links").select("destination,created_at").eq("id", id).maybeSingle();
  if (error) return new Response(null, { status: 503 });
  const destination = data && approvedDestination(data.destination);
  if (!destination) return new Response(null, { status: 404 });
  const response = NextResponse.redirect(destination, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  if (request.method === "HEAD" || Date.now() - Date.parse(data.created_at) > 30 * 86400_000) return response;
  const scanner = suspectedScanner(request.headers);
  const recorded = await db.rpc("record_campaign_click", { link: id, scanner });
  if (!recorded.error && !scanner && destination.origin === new URL(SITE_URL).origin) {
    const attribution = signAttribution(id);
    if (attribution) response.cookies.set(attributionCookie, attribution, { path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 7 * 86400 });
  }
  return response;
}

export const GET = redirect;
export const HEAD = redirect;
