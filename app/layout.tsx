import type { Metadata } from "next";
import Script from "next/script";
import { PRINCIPAL_NAME, SITE_NAME, SITE_URL, serializeJsonLd } from "@/app/lib/seo";
import Footer from "@/app/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Business Architecture for entrepreneurs: test what's worth building, architect how the business will work, and make it exist.",
  authors: [{ name: PRINCIPAL_NAME }],
  creator: PRINCIPAL_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: SITE_NAME,
    description:
      "Business Architecture for entrepreneurs: test what's worth building, architect how the business will work, and make it exist.",
    url: "/",
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
    title: SITE_NAME,
    description:
      "Business Architecture for entrepreneurs: test what's worth building, architect how the business will work, and make it exist.",
    images: ["/og/modern-business-architect.png"],
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
      sameAs: ["https://www.linkedin.com/in/martin-dubreuil-ba643724/"],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      founder: { "@id": `${SITE_URL}/#martin` },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#business-architecture-service`,
      name: "Business Architecture",
      serviceType: "Business Architecture",
      description: "Validation, structure, and execution support for new business ventures—testing what's worth building, architecting how the business will work, and making it exist.",
      provider: { "@id": `${SITE_URL}/#business` },
      url: `${SITE_URL}/work`,
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VWKDNXD9JD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VWKDNXD9JD');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-[#f5f1ed] text-[#1a1816] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteStructuredData) }}
        />
        {children}
        <Footer />
        <noscript>
          <style>{`[data-progressive-reveal] [style*="opacity:0"]:not([data-noscript-ignore]) { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
