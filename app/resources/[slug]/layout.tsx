import type { Metadata } from "next";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";
import { createPageMetadata, SITE_URL, PRINCIPAL_NAME, serializeJsonLd } from "@/app/lib/seo";
import { PageStructuredData } from "@/app/components/PageStructuredData";
import { getResourceConfig } from "@/app/lib/resources/config";
import { getGuideContent } from "@/app/lib/resources/guides";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${resource.title} | The Modern Business Architect`;
  return createPageMetadata({
    title,
    description: resource.short_description,
    path: `/resources/${resource.slug}`,
  });
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) return <>{children}</>;

  const path = `/resources/${resource.slug}`;
  const title = `${resource.title} | The Modern Business Architect`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${SITE_URL}${path}#resource`,
    name: resource.title,
    description: resource.short_description,
    url: `${SITE_URL}${path}`,
    creator: { "@type": "Person", "@id": `${SITE_URL}/#martin`, name: PRINCIPAL_NAME },
    publisher: { "@type": "ProfessionalService", "@id": `${SITE_URL}/#business` },
    inLanguage: "en",
    isAccessibleForFree: true,
    audience: resource.audience ?? undefined,
    ...onlineGuideStructuredData(resource.slug, path),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <PageStructuredData name={title} description={resource.short_description} path={path} />
      {children}
    </>
  );
}

/** For resources with a full online guide: reading time and the guide's sections. */
function onlineGuideStructuredData(slug: string, path: string) {
  const config = getResourceConfig(slug);
  const content = config ? getGuideContent(slug) : null;
  if (!config || !content) return {};
  return {
    timeRequired: config.timeRequired,
    learningResourceType: config.kind,
    hasPart: content.sections.map((section) => ({
      "@type": "WebPageElement",
      "@id": `${SITE_URL}${path}#${section.id}`,
      url: `${SITE_URL}${path}#${section.id}`,
      name:
        section.kind === "invitation"
          ? section.heading
          : section.kind === "cover"
            ? section.heading.map((p) => (typeof p === "string" ? p : p.em)).join("")
            : section.heading.map((p) => (typeof p === "string" ? p : p.em)).join(""),
    })),
  };
}
