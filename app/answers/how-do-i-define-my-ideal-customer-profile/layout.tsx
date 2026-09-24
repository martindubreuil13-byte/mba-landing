import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "How Do I Define My Ideal Customer Profile? | Martin Dubreuil";
const description = "How to define an ideal customer profile that explains why someone would buy: the problem, the trigger, ability to pay, reachability and the evidence behind it.";
const path = "/answers/how-do-i-define-my-ideal-customer-profile";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = "https://modernbusinessarchitect.com/og/how-do-i-define-my-ideal-customer-profile.png";

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
    publishedTime: "2026-09-24",
    modifiedTime: "2026-09-24",
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
    headline: title,
    description: description,
    url: `${SITE_URL}${path}`,
    datePublished: "2026-09-24",
    dateModified: "2026-09-24",
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
