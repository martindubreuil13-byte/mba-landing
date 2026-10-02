import { NextResponse } from "next/server";
import { getResourceConfig } from "@/app/lib/resources/config";
import { isSignedDownloadToken, verifyDownloadToken } from "@/app/lib/resources/download-token";
import { recordDownloadStart } from "@/app/lib/resources/downloads";
import { getResourceRequestWithResource } from "@/app/lib/resources/queries";
import { getSignedDownloadUrl } from "@/app/lib/resources/storage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controlled download route: the public link never contains the real storage path. Each hit mints a fresh
 * short-lived signed URL server-side and redirects to it.
 *
 * Who may download:
 *  - a SIGNED token (`d1.…`): scoped to one request and one resource, expiring; the request must be unlocked.
 *    These only ever reach a confirmed member (their email, or the response to the confirmation POST).
 *  - a LEGACY token (the bare request id, issued before the member-access release): valid under its original rules.
 *    For a member-access resource the request must be unlocked; every request that existed at release was backfilled
 *    as unlocked, so previously issued links keep working. A request still waiting for confirmation is refused.
 * Unsubscribing never revokes an unlocked request.
 *
 * `via` records where the click came from (form | backup | email | confirm). A download "start" means this endpoint
 * was hit — it cannot prove the file finished, and email security scanners that pre-fetch links can inflate the email count.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/resources", req.url));

  let requestId: string | null = null;
  let resourceIdFromToken: string | null = null;
  if (isSignedDownloadToken(token)) {
    const check = verifyDownloadToken(token);
    if (!check.ok) return NextResponse.redirect(new URL("/resources", req.url));
    requestId = check.requestId;
    resourceIdFromToken = check.resourceId;
  } else if (UUID.test(token)) {
    requestId = token;
  }
  if (!requestId) return NextResponse.redirect(new URL("/resources", req.url));

  const request = await getResourceRequestWithResource(requestId);
  if (!request) return NextResponse.redirect(new URL("/resources", req.url));
  if (resourceIdFromToken && request.resource_id !== resourceIdFromToken) return NextResponse.redirect(new URL("/resources", req.url));

  // Member-access resources: locked requests (awaiting confirmation) get nothing, and no hint of why.
  if (getResourceConfig(request.resource.slug) && !request.benefit_fulfilled_at) {
    return NextResponse.redirect(new URL(`/resources/${request.resource.slug}`, req.url));
  }

  const via = ["form", "backup", "email", "confirm"].includes(searchParams.get("via") ?? "") ? (searchParams.get("via") as string) : "direct";
  await recordDownloadStart(request, via);

  const signedUrl = await getSignedDownloadUrl(request.resource.file_path, 300, request.resource.file_name);
  return NextResponse.redirect(signedUrl);
}
