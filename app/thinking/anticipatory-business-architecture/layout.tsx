import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "Will Your Business Still Be Relevant Tomorrow? | Martin Dubreuil";
const headline = "Will Your Business Still Be Relevant Tomorrow?";
const alternativeHeadline = "Why the next evolution of Business Architecture must include anticipation, adaptability, and continuous intelligence.";
const description = "Anticipatory Business Architecture adds anticipation, adaptability and continuous intelligence so your business stays viable as technology and customers change.";
const path = "/thinking/anticipatory-business-architecture";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = "/og/modern-business-architect.png";
const published = "2026-10-26";

export const metadata: Metadata = {
  title,
  description,
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
    publishedTime: published,
    modifiedTime: published,
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
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline,
    alternativeHeadline,
    description,
    url: canonicalUrl,
    datePublished: published,
    dateModified: published,
    articleSection: "Business Architecture",
    keywords: [
      "Anticipatory Business Architecture",
      "Business Architecture",
      "business relevance",
      "business adaptability",
      "continuous intelligence",
      "business re-architecture",
    ],
    about: {
      "@type": "DefinedTerm",
      name: "Anticipatory Business Architecture",
      description:
        "A way of integrating anticipation, adaptability and continuous intelligence into the architecture and re-architecture of a business, so it can create value today while retaining the capacity to respond to several plausible futures.",
      url: canonicalUrl,
    },
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#martin`,
      name: PRINCIPAL_NAME,
    },
    publisher: {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
    },
    inLanguage: "en",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
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
