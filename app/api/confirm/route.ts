import { NextResponse } from "next/server";
import { confirmOptIn } from "@/app/lib/leads/consent";
import { verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { recordResourceEvent } from "@/app/lib/resources/event-store";
import { fulfillMemberBenefit } from "@/app/lib/resources/member-access";
import { getResourceById } from "@/app/lib/resources/queries";
import { getServiceClient } from "@/app/lib/supabase/service";

/**
 * Confirms a community signup (confirmed opt-in). POST only: the /confirm page
 * explains and offers a button, and merely opening the link (a GET, a mail
 * scanner prefetch) never subscribes anyone. The token is signed, expires, and
 * cannot be confused with an unsubscribe token.
 *
 * For a request that came from a member-access resource this is also the moment the member benefit UNLOCKS: the
 * locked requests are unlocked (exactly once, however often the POST is replayed), the durable download link is
 * emailed once, and the response carries the signed link for the confirming browser to start the download.
 */
export async function POST(req: Request) {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    try {
      const body = await req.json();
      token = typeof body?.token === "string" ? body.token : "";
    } catch {
      /* fall through */
    }
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`confirm:${ip}`, 60 * 60, 30))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const check = verifyConfirmationToken(token);
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "expired" ? "This confirmation link has expired. Ask for the guide again on its page and we will send a fresh one." : "This confirmation link is invalid." },
      { status: 400 }
    );
  }

  try {
    const result = await confirmOptIn(check.leadId, { ipHash: hashEvidence(ip), userAgentHash: hashEvidence(req.headers.get("user-agent")) });

    if (result.status === "confirmed" || result.status === "already_confirmed") {
      // Which resource did this lead ask for? A fresh confirmation says so; a replay finds it in the consent history.
      let resourceId: string | null = result.status === "confirmed" ? result.sourceResourceId : null;
      if (result.status === "already_confirmed") {
        const { data: row } = await getServiceClient()
          .from("consent_records")
          .select("source_resource_id")
          .eq("lead_id", check.leadId)
          .eq("action", "opt_in")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        resourceId = row?.source_resource_id ?? null;
      }

      // Unlock first, so the confirmation event can record whether the member's benefit was actually unlocked.
      let benefit: { downloadUrl: string; label: string } | null = null;
      let outcome: "unlocked" | "already_unlocked" | "none" = "none";
      if (resourceId) {
        const fulfilled = await fulfillMemberBenefit(check.leadId, resourceId);
        if (fulfilled?.downloadUrl) {
          benefit = { downloadUrl: fulfilled.downloadUrl, label: fulfilled.label ?? "download" };
          outcome = fulfilled.newlyFulfilled > 0 ? "unlocked" : "already_unlocked";
        }
      }

      if (result.status === "confirmed" && resourceId) {
        const resource = await getResourceById(resourceId);
        if (resource) await recordResourceEvent({ name: "resource_opt_in_confirmed", resource, leadId: check.leadId, metadata: { consent_record_id: result.recordId, benefit: outcome } });
      }
      return NextResponse.json({ success: true, status: result.status, ...(benefit ? { benefit } : {}) });
    }
    if (result.status === "not_pending") {
      return NextResponse.json({ error: "This confirmation is no longer needed or was withdrawn. If you would still like to hear from Martin, you can sign up again." }, { status: 409 });
    }
    // suppressed / not_found: do not reveal why
    return NextResponse.json({ error: "This confirmation link can no longer be used." }, { status: 400 });
  } catch (error) {
    console.error("Confirmation failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
