import { notFound } from "next/navigation";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";
import { getResourceCoverUrl } from "@/app/lib/resources/storage";
import ResourceDetailView from "@/app/components/resources/ResourceDetailView";
import OnlineGuideResourcePage from "@/app/components/resources/guide/OnlineGuideResourcePage";
import { getConsentCopy } from "@/app/lib/resources/consent-copy";
import { getResourceConfig } from "@/app/lib/resources/config";
import { getGuideContent } from "@/app/lib/resources/guides";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) notFound();

  // Resources with a configured online guide get the read-online + printable-guide experience.
  const config = getResourceConfig(resource.slug);
  const content = config ? getGuideContent(resource.slug) : null;
  const consent = config ? getConsentCopy(config.access.consentCopyId) : null;
  if (config && content && consent) {
    return (
      <OnlineGuideResourcePage
        slug={resource.slug}
        title={resource.title}
        shortDescription={resource.short_description}
        longDescription={resource.long_description}
        resourceType={resource.resource_type}
        audience={resource.audience}
        coverUrl={getResourceCoverUrl(resource)}
        config={config}
        content={content}
        consent={consent}
      />
    );
  }

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
