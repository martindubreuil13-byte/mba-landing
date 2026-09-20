import { notFound } from "next/navigation";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";
import { getResourceCoverUrl } from "@/app/lib/resources/storage";
import ResourceDetailView from "@/app/components/resources/ResourceDetailView";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) notFound();

  return (
    <ResourceDetailView
      slug={resource.slug}
      title={resource.title}
      shortDescription={resource.short_description}
      longDescription={resource.long_description}
      resourceType={resource.resource_type}
      audience={resource.audience}
      coverUrl={getResourceCoverUrl(resource)}
    />
  );
}
