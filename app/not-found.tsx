import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f1ed] text-[#1a1816] px-6 md:px-12 lg:px-16 py-32">
      <div className="max-w-3xl">
        <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">404</p>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
          Page not found.
        </h1>
        <Link
          href="/"
          className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1"
        >
          Back to home →
        </Link>
      </div>
    </main>
  );
}
