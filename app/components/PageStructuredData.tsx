import { PRINCIPAL_NAME, SITE_NAME, SITE_URL, serializeJsonLd } from "@/app/lib/seo";

type PageStructuredDataProps = {
  name: string;
  description: string;
  path: string;
  includeAuthor?: boolean;
  emit?: boolean;
};

export function PageStructuredData({
  name,
  description,
  path,
  includeAuthor = true,
  emit = true
}: PageStructuredDataProps) {
  // Do not emit WebPage entity for noindex placeholder pages
  if (!emit) {
    return null;
  }

  const url = new URL(path, SITE_URL).toString();
  const author = includeAuthor
    ? { "@id": `${SITE_URL}/#martin`, name: PRINCIPAL_NAME }
    : undefined;

  const data: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#business` },
    publisher: { "@id": `${SITE_URL}/#business`, name: SITE_NAME },
    inLanguage: "en",
  };

  if (author) {
    data.author = author;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
