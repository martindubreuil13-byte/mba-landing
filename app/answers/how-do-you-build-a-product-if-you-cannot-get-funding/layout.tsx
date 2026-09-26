import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "How to Build a Product Without Funding | FRAME™";
const headline = "How Do You Build a Product If You Cannot Get Funding?";
const description = "Cannot get startup funding? Learn how to validate your idea, build an MVP, create proof of concept, and explore alternatives to investors.";
const path = "/answers/how-do-you-build-a-product-if-you-cannot-get-funding";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = "https://modernbusinessarchitect.com/og/how-do-you-build-a-product-if-you-cannot-get-funding.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "how to build a product without funding",
    "startup funding alternatives",
    "MVP validation",
    "proof of concept",
    "how to get business funding",
    "validate a business idea",
  ],
  alternates: { canonical: path },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    type: "article",
    siteName: SITE_NAME,
    locale: "en_US",
    authors: [PRINCIPAL_NAME],
    publishedTime: "2026-09-26",
    modifiedTime: "2026-09-26",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImageUrl],
    creator: "@martindubreuil",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}${path}#article`,
    headline,
    description: description,
    url: `${SITE_URL}${path}`,
    image: ogImageUrl,
    datePublished: "2026-09-26",
    dateModified: "2026-09-26",
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#martin`,
      name: PRINCIPAL_NAME,
    },
    publisher: {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: "The Modern Business Architect",
    },
    keywords: "how to build a product without funding, startup funding alternatives, MVP validation, proof of concept, validate a business idea",
    articleSection: "Answers",
    inLanguage: "en",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleStructuredData) }}
      />
      <PageStructuredData name={title} description={description} path={path} />
      {children}
    </>
  );
}
