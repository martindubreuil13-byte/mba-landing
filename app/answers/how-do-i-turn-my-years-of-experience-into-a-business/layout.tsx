import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";
import { DIRECT_ANSWER, FAQS } from "./content";

const headline = "How Do I Turn My Years of Experience Into a Business?";
const title = `${headline} | Martin Dubreuil`;
const description = "Learn how to turn professional experience into a business by identifying a valuable problem, designing the right offer and testing whether customers will pay.";
const path = "/answers/how-do-i-turn-my-years-of-experience-into-a-business";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = `${SITE_URL}/og/modern-business-architect.png`;
const published = "2026-10-03";

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
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };

  // Built from the same strings the page renders, so it matches visible content.
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faq`,
    url: canonicalUrl,
    inLanguage: "en",
    mainEntity: [
      {
        "@type": "Question",
        name: headline,
        acceptedAnswer: { "@type": "Answer", text: DIRECT_ANSWER },
      },
      ...FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqStructuredData) }}
      />
      <PageStructuredData name={title} description={description} path={path} />
      {children}
    </>
  );
}
