import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "Your Next Customer Might Not Be Human | Martin Dubreuil";
const headline = "Your Next Customer Might Not Be Human";
const alternativeHeadline = "Why Business-to-Agent commerce could change retail, e-commerce, and the way we architect businesses.";
const description = "Business-to-Agent (B2A) commerce is emerging as AI agents shop on customers' behalf. Why preparing for it is a business architecture question, not a website project.";
const path = "/thinking/your-next-customer-might-not-be-human";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = "/og/modern-business-architect.png";
const published = "2026-11-03";

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
    image: `${SITE_URL}${ogImageUrl}`,
    datePublished: published,
    dateModified: published,
    articleSection: "Business Architecture",
    keywords: [
      "Business-to-Agent",
      "B2A",
      "agentic commerce",
      "AI agents",
      "retail",
      "e-commerce",
      "business architecture",
    ],
    about: [
      { "@type": "Thing", name: "Business-to-Agent (B2A) commerce" },
      { "@type": "Thing", name: "Agentic commerce" },
      { "@type": "Thing", name: "Business architecture" },
    ],
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
