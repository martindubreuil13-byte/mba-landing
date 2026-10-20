import { SITE_URL } from "@/app/lib/seo";
import { PROGRAMS, metaDescription, programPath, type ServiceProgram } from "@/app/lib/service-programs/catalog";

/**
 * schema.org nodes for the eight programs, built only from the catalog.
 * - Fixed-fee programs carry an Offer with the catalog price in USD. Bespoke programs (06, 08) carry no Offer or price.
 * - Provider is the existing organization and principal (same @ids as the root layout). No ratings, reviews or availability claims.
 * - The same @id is used wherever a program appears (hub and dedicated page), so the graph cannot conflict.
 */
export function programUrl(p: ServiceProgram) {
  return `${SITE_URL}${programPath(p)}`;
}

export function programServiceNode(p: ServiceProgram) {
  const url = programUrl(p);
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: p.name,
    serviceType: "Business architecture and advisory",
    description: metaDescription(p),
    url,
    provider: [{ "@id": `${SITE_URL}/#business` }, { "@id": `${SITE_URL}/#martin` }],
    ...(p.pricing.kind === "fixed"
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: p.pricing.usd,
            priceCurrency: "USD",
            priceSpecification: { "@type": "PriceSpecification", price: p.pricing.usd, priceCurrency: "USD" },
          },
        }
      : {}),
  };
}

export function programsStructuredData() {
  return { "@context": "https://schema.org", "@graph": PROGRAMS.map(programServiceNode) };
}

export function programPageStructuredData(p: ServiceProgram) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      programServiceNode(p),
      {
        "@type": "BreadcrumbList",
        "@id": `${programUrl(p)}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Work", item: `${SITE_URL}/work` },
          { "@type": "ListItem", position: 3, name: p.name, item: programUrl(p) },
        ],
      },
    ],
  };
}
