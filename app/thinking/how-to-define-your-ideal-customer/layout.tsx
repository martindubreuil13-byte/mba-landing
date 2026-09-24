import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, PRINCIPAL_NAME, SITE_NAME, serializeJsonLd } from "@/app/lib/seo";
import type { Metadata } from "next";

const title = "How to Define Your Ideal Customer | Martin Dubreuil";
const description = "Most customer avatars describe a person, not a buyer. How to define an ideal customer profile: problem, trigger, psychology, buying reality, journey, reach.";
const socialTitle = "Sarah Is 42 and Drives an Audi. Why Would She Buy From You?";
const socialDescription = "Most customer avatars are fictional biographies. How to understand the customer you are actually building for, with a one-page map and two AI prompts.";
const headline = "How to Define Your Ideal Customer";
const path = "/thinking/how-to-define-your-ideal-customer";
const canonicalUrl = `${SITE_URL}${path}`;
const ogImageUrl = `${SITE_URL}/og/how-to-define-your-ideal-customer.png`;
const ogImageAlt = "A customer avatar description, 'Female. 42. London. Audi. Yoga.', crossed out and replaced by the question: What is she trying to change?";
const published = "2026-09-24";
const modified = "2026-09-24";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  robots: { index: true, follow: true },
  openGraph: {
    title: socialTitle,
    description: socialDescription,
    url: canonicalUrl,
    type: "article",
    siteName: SITE_NAME,
    locale: "en_US",
    authors: [PRINCIPAL_NAME],
    publishedTime: published,
    modifiedTime: modified,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: ogImageAlt,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: socialDescription,
    images: [{ url: ogImageUrl, alt: ogImageAlt }],
    creator: "@martindubreuil",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}${path}#article`,
    headline,
    alternativeHeadline: "And no, giving them a name and an age isn't enough.",
    description,
    url: canonicalUrl,
    image: ogImageUrl,
    datePublished: published,
    dateModified: modified,
    articleSection: "Business Architecture",
    keywords: [
      "ideal customer profile",
      "ICP",
      "customer persona",
      "customer avatar",
      "target customer",
      "customer journey",
      "psychographics",
      "willingness to pay",
      "go-to-market",
      "Business Architecture",
    ],
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
