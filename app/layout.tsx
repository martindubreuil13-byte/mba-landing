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
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        
        {/* 🌌 GLOBAL BACKGROUND CONTROL */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(81,163,255,0.12),transparent_40rem)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(30,255,188,0.08),transparent_25rem)]" />
        </div>

        {/* 🧱 MAIN STRUCTURE */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* (optional later) footer */}
        {/* <Footer /> */}

      </body>
    </html>
  );
}