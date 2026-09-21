import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import BusinessIdeaRealityCheck from "@/app/components/assessment/BusinessIdeaRealityCheck";
import { createPageMetadata } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "The Business Idea Reality Check | The Modern Business Architect",
  description:
    "13 questions, 4-6 minutes: how much evidence currently exists that there may be a viable business inside your idea.",
  path: "/resources/business-idea-reality-check",
});

export default function BusinessIdeaRealityCheckPage() {
  const paidCtaUrl = process.env.ASSESSMENT_PAID_CTA_URL || null;

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="w-full bg-white text-[#1a1816] min-h-screen">
        <div className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <BusinessIdeaRealityCheck paidCtaUrl={paidCtaUrl} />
        </div>
      </main>
    </>
  );
}
