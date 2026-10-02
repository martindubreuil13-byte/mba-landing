import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "Your Next Customer Might Not Visit Your Website | Martin Dubreuil";
const description = "AI agents are becoming a new customer channel. They don't care about your homepage. They want information they can find, understand and trust. What businesses need to re-architect now.";
const path = "/thinking/your-next-customer-might-not-visit-your-website";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = `${SITE_URL}/og/your-next-customer-might-not-visit-your-website.jpg`;
const ogImageAlt = "A quiet, beautifully lit luxury retail store seen through its glass entrance, with no customers inside.";

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
    publishedTime: "2026-10-02",
    modifiedTime: "2026-10-02",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: ogImageAlt,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [{ url: ogImageUrl, alt: ogImageAlt }],
    creator: "@martindubreuil",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}${path}#article`,
    headline: title,
    description: description,
    url: `${SITE_URL}${path}`,
    image: ogImageUrl,
    datePublished: "2026-10-02",
    dateModified: "2026-10-02",
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
