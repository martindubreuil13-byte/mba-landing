import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import NapkinPrinciple from "@/app/components/napkin/NapkinPrinciple";
import { createPageMetadata } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "The Napkin Principle | The Modern Business Architect",
  description:
    "Calculate how many profitable transactions your business needs — and whether that number appears possible in the real world.",
  path: "/resources/napkin-principle",
});

export default function NapkinPrinciplePage() {
  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="w-full bg-white text-[#1a1816] min-h-screen">
        <div className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <NapkinPrinciple />
        </div>
      </main>
    </>
  );
}
