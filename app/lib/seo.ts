import type { Metadata } from "next";

export const SITE_URL = "https://modernbusinessarchitect.com";
export const SITE_NAME = "The Modern Business Architect";
export const PRINCIPAL_NAME = "Martin Dubreuil";

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetadata): Metadata {
  const canonical = path === "/" ? "/" : path.replace(/\/$/, "");

  return {
    title,
    description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/og/modern-business-architect.png",
          width: 1200,
          height: 630,
          alt: "The Modern Business Architect — Ideas are easy. Businesses are architected.",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/modern-business-architect.png"],
    },
  };
}

export function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
