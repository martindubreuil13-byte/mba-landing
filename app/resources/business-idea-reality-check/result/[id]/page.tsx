import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import ResultView from "@/app/components/assessment/ResultView";
import { getAssessmentById } from "@/app/lib/assessment/queries";
import { assessmentRowToResultView } from "@/app/lib/assessment/present";

export const dynamic = "force-dynamic";

/**
 * Deliberately generic and hardcoded — never build this from the
 * assessment's idea name/description. The URL itself (an unguessable
 * UUID) is the only thing protecting a participant's private result, so
 * title/description/OG must never turn that content into something a
 * crawler, link-preview bot or shared-link card could surface.
 */
export const metadata: Metadata = {
  title: "Your assessment result",
  description: "A private Business Idea Reality Check result.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  openGraph: {
    title: "Your assessment result",
    description: "A private Business Idea Reality Check result.",
    type: "website",
    images: [],
  },
  twitter: { card: "summary", title: "Your assessment result", description: "A private Business Idea Reality Check result." },
};

export default async function AssessmentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessmentById(id);

  // Only ever show a result that actually completed the lead gate — a
  // pending/abandoned assessment (no lead attached yet) isn't a real result.
  if (!assessment || !assessment.completed_at) notFound();

  const data = assessmentRowToResultView(assessment, null);
  const paidCtaUrl = process.env.ASSESSMENT_PAID_CTA_URL || null;

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="w-full bg-white text-[#1a1816] min-h-screen">
        <div className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <ResultView data={data} assessmentId={assessment.id} paidCtaUrl={paidCtaUrl} />
        </div>
      </main>
    </>
  );
}
