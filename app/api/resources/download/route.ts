import { NextResponse } from "next/server";
import { recordDownloadStart } from "@/app/lib/resources/downloads";
import { getResourceRequestWithResource } from "@/app/lib/resources/queries";
import { getSignedDownloadUrl } from "@/app/lib/resources/storage";

/**
 * Clean, controlled download route: the public link never contains the
 * real storage path, just an opaque request token. Each hit mints a fresh
 * short-lived signed URL server-side and redirects to it.
 *
 * `via` records where the click came from (form | backup | email). A download
 * "start" means this endpoint was hit — it cannot prove the file finished, and
 * email security scanners that pre-fetch links can inflate the email count.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/resources", req.url));
  }

  const request = await getResourceRequestWithResource(token);
  if (!request) {
    return NextResponse.redirect(new URL("/resources", req.url));
  }

  const via = ["form", "backup", "email"].includes(searchParams.get("via") ?? "") ? (searchParams.get("via") as string) : "direct";
  await recordDownloadStart(request, via);

  const signedUrl = await getSignedDownloadUrl(request.resource.file_path, 300, request.resource.file_name);
  return NextResponse.redirect(signedUrl);
}
