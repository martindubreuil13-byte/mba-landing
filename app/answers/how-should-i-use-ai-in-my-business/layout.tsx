import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";
import { DIRECT_ANSWER, SECTIONS, toPlainText } from "./content";

const title = "How Should I Use AI in My Business? | Modern Business Architect";
const headline = "How Should I Use AI in My Business?";
const description = "Learn how to use AI in business by starting with value, process and intelligence—not tools. A Business Architecture approach to human and artificial intelligence.";
const path = "/answers/how-should-i-use-ai-in-my-business";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = "https://modernbusinessarchitect.com/og/how-should-i-use-ai-in-my-business.png";
const published = "2026-09-30";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "how to use AI in business",
    "AI for business",
    "artificial intelligence in business",
    "AI automation",
    "AI agents",
    "Architecting Intelligence",
    "Business Architecture",
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
    keywords: "how to use AI in business, AI for business, artificial intelligence in business, AI automation, AI agents, Architecting Intelligence, Business Architecture",
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
      ...SECTIONS.filter((s) => s.faq).map((s) => ({
        "@type": "Question",
        name: s.heading,
        acceptedAnswer: {
          "@type": "Answer",
          text: toPlainText(s.body).replace(/\n{2,}/g, "\n\n"),
        },
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
