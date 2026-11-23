import { PageStructuredData } from "@/app/components/PageStructuredData";
import { SITE_URL, createPageMetadata, serializeJsonLd } from "@/app/lib/seo";
import { AUDIENCE, FAQS, MARKETS, PAGE_NAME, PAGE_PATH } from "./content";

const title = "Business Re-Architecture for Manufacturing and Retail Businesses";
const description =
  "Discover where AI and smarter ways of working could make your manufacturing or retail business more profitable and productive. Decode, Architect, Make It Exist: one phase at a time.";

export const metadata = createPageMetadata({ title, description, path: PAGE_PATH });

const url = `${SITE_URL}${PAGE_PATH}`;

// The visible facts only: who it is for, where we are working first, and what the service is. No prices, ratings, reviews or results exist to report.
const serviceStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${url}#service`,
  name: PAGE_NAME,
  serviceType: "Business consulting",
  description:
    "A three-phase consulting approach (Decode, Architect, Make It Exist) that helps established manufacturing and retail businesses find where they could become more efficient, profitable, productive and competitive by rethinking how people, processes, decisions, information and technology work together. Each phase is separately scoped.",
  url,
  provider: { "@id": `${SITE_URL}/#business` },
  audience: { "@type": "BusinessAudience", audienceType: AUDIENCE },
  areaServed: [...MARKETS].map((m) => ({ "@type": "Country", name: m.replace(/^the /, "").replace(/^./, (c) => c.toUpperCase()) })),
  isPartOf: { "@id": `${SITE_URL}/#website` },
};

// Built from the same strings the page renders, so the markup always matches what a visitor can read.
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${url}#faq`,
  url,
  inLanguage: "en",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageStructuredData name={PAGE_NAME} description={description} path={PAGE_PATH} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqStructuredData) }} />
      {children}
    </>
  );
}
