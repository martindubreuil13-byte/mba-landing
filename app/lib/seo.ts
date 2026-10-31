import type { Metadata } from "next";
import { isProductionDeployment } from "./deployment";

export const SITE_URL = "https://modernbusinessarchitect.com";
export const SITE_NAME = "The Modern Business Architect";
export const PRINCIPAL_NAME = "Martin Dubreuil";

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  /** Page-specific share image. Defaults to the site-wide image. */
  image?: { url: string; width: number; height: number; alt: string; type?: string };
  /** Open Graph type; "book" also takes the author names. Defaults to "website". */
  openGraphType?: "website" | "book";
  authors?: string[];
};

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
  image,
  openGraphType = "website",
  authors,
}: PageMetadata): Metadata {
  const canonical = path === "/" ? "/" : path.replace(/\/$/, "");
  const shareImage = image ?? {
    url: "/og/modern-business-architect.png",
    width: 1200,
    height: 630,
    alt: "The Modern Business Architect — Ideas are easy. Businesses are architected.",
    type: "image/png",
  };

  return {
    title,
    description,
    alternates: { canonical },
    // Outside production every page is noindex, regardless of what the page asks for.
    robots: index && isProductionDeployment()
      ? { index: true, follow: true }
      : { index: false, follow: isProductionDeployment() }, 
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      ...(openGraphType === "book"
        ? { type: "book" as const, ...(authors?.length ? { authors } : {}) }
        : { type: "website" as const }),
      locale: "en_US",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [{ url: shareImage.url, alt: shareImage.alt }] : [shareImage.url],
    },
  };
}

export function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
