import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Modern Business Architect",
  description:
    "Turn your ideas into structured, scalable businesses with clarity, alignment, and execution.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "The Modern Business Architect",
    description:
      "Turn your ideas into structured, scalable businesses with clarity, alignment, and execution.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#f5f1ed] text-[#1a1816] antialiased">
        {children}
      </body>
    </html>
  );
}