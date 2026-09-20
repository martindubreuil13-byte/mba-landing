import type { Metadata } from "next";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";
import { createPageMetadata, SITE_URL, PRINCIPAL_NAME, serializeJsonLd } from "@/app/lib/seo";
import { PageStructuredData } from "@/app/components/PageStructuredData";

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
