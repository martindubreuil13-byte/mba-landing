import { NextResponse } from "next/server";
import { getResourceRequestWithResource } from "@/app/lib/resources/queries";
import { getSignedDownloadUrl } from "@/app/lib/resources/storage";

/**
 * Clean, controlled download route: the public link never contains the
 * real storage path, just an opaque request token. Each hit mints a fresh
 * short-lived signed URL server-side and redirects to it.
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

  const signedUrl = await getSignedDownloadUrl(request.resource.file_path, 300);
  return NextResponse.redirect(signedUrl);
}
