import { ImageResponse } from "next/og";
import { buildCoverElement } from "@/app/lib/resources/cover-image";

export const runtime = "edge";

// Visible portrait thumbnail (roughly Letter/A4 aspect) used on /resources
// and the resource detail page when no cover image has been uploaded.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.slice(0, 140) || "Untitled Resource";
  const resourceType = searchParams.get("type")?.slice(0, 40) || "Guide";

  return new ImageResponse(
    buildCoverElement({ title, resourceType, orientation: "portrait" }),
    { width: 1000, height: 1294 }
  );
}
