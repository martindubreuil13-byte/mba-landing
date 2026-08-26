import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "Answers | Martin Dubreuil";
const description = "Clear, authoritative answers about business architecture: what it means, why it matters for entrepreneurs, and how it connects customer, offer, economics and execution.";
const path = "/answers";
const canonicalUrl = `${SITE_URL}${path}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const pageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    name: title,
    description: description,
    url: `${SITE_URL}${path}`,
    inLanguage: "en",
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageStructuredData) }}
      />
      <PageStructuredData name={title} description={description} path={path} />
      {children}
    </>
  );
}
