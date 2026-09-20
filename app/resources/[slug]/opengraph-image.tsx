import { ImageResponse } from "next/og";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";
import { getPublicCoverUrl } from "@/app/lib/resources/storage";
import { buildCoverElement } from "@/app/lib/resources/cover-image";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const resource = await getPublishedResourceBySlug(params.slug);

  if (!resource) {
    return new ImageResponse(
      buildCoverElement({ title: "Free Resources", resourceType: "Guide", orientation: "landscape" }),
      size
    );
  }

  // If Martin uploaded a real cover image, use it directly as the share
  // image. Otherwise fall back to the generated typographic cover.
  if (resource.cover_image_path) {
    const coverUrl = getPublicCoverUrl(resource.cover_image_path);
    return new ImageResponse(
      (
        <img
          src={coverUrl}
          alt={resource.title}
          width={size.width}
          height={size.height}
          style={{ objectFit: "cover" }}
        />
      ),
      size
    );
  }

  return new ImageResponse(
    buildCoverElement({
      title: resource.title,
      resourceType: resource.resource_type,
      orientation: "landscape",
    }),
    size
  );
}
