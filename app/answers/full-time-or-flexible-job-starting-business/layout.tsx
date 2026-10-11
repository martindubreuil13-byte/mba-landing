import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";
import { DIRECT_ANSWER } from "./content";

const headline = "Should I Take a Full-Time Job or a Flexible Job While Starting My Own Business?";
const title = "Should I Take a Full-Time Job or a Flexible Job to Start a Business?";
const description = "Should you take a stable full-time job or a flexible, lower-paying role while starting a business? A Business Architect explains how to decide.";
const path = "/answers/full-time-or-flexible-job-starting-business";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = `${SITE_URL}/og/modern-business-architect.png`;
const published = "2026-10-11";

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
    images: [{ url: ogImageUrl, width: 1200, height: 630, type: "image/png" }],
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
    "@id": `${canonicalUrl}#article`,
    headline,
    description,
    abstract: DIRECT_ANSWER,
    url: canonicalUrl,
    image: ogImageUrl,
    datePublished: published,
    dateModified: published,
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
    articleSection: "Answers",
    about: [{ "@type": "Thing", name: "Business Architecture" }, { "@type": "Thing", name: "Transitioning from corporate employment to entrepreneurship" }],
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
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
