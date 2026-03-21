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
      <body className="min-h-full flex flex-col bg-[#020617] text-white antialiased">

        {/* 🔥 DEPTH BACKGROUND SYSTEM */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">

          {/* BASE DARK */}
          <div className="absolute inset-0 bg-[#020617]" />

          {/* SOFT TOP LIGHT */}
          <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />

          {/* SIDE ACCENT */}
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />

          {/* BOTTOM DEPTH */}
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[140px]" />

        </div>

        {/* 🧱 MAIN CONTENT */}
        <main className="flex-1 w-full relative z-10">
          {children}
        </main>

      </body>
    </html>
  );
}