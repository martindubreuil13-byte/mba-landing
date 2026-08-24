import { PRINCIPAL_NAME, SITE_NAME, SITE_URL, serializeJsonLd } from "@/app/lib/seo";

type PageStructuredDataProps = {
  name: string;
  description: string;
  path: string;
};

export function PageStructuredData({ name, description, path }: PageStructuredDataProps) {
  const url = new URL(path, SITE_URL).toString();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#business` },
    author: { "@id": `${SITE_URL}/#martin`, name: PRINCIPAL_NAME },
    publisher: { "@id": `${SITE_URL}/#business`, name: SITE_NAME },
    inLanguage: "en",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
