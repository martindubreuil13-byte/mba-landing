import type { Metadata } from "next";
import { PRINCIPAL_NAME, SITE_NAME, SITE_URL, serializeJsonLd } from "@/app/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Turn your ideas into structured, scalable businesses with clarity, alignment, and execution.",
  authors: [{ name: PRINCIPAL_NAME }],
  creator: PRINCIPAL_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: SITE_NAME,
    description:
      "Turn your ideas into structured, scalable businesses with clarity, alignment, and execution.",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description:
      "Turn your ideas into structured, scalable businesses with clarity, alignment, and execution.",
  },
};

const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description:
        "Business architecture for turning ideas into structured, executable and viable businesses.",
      publisher: { "@id": `${SITE_URL}/#business` },
      inLanguage: "en",
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#martin`,
      name: PRINCIPAL_NAME,
      url: `${SITE_URL}/martin`,
      image: `${SITE_URL}/images/martin-dubreuil-brand-portrait-primary.png`,
      worksFor: { "@id": `${SITE_URL}/#business` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      founder: { "@id": `${SITE_URL}/#martin` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#f5f1ed] text-[#1a1816] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteStructuredData) }}
        />
        {children}
        <noscript>
          <style>{`[data-progressive-reveal] [style*="opacity:0"]:not([data-noscript-ignore]) { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
