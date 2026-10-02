import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import RejoinForm from "@/app/components/RejoinForm";
import { getConsentCopy } from "@/app/lib/resources/consent-copy";
import { createPageMetadata } from "@/app/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Rejoin the community | The Modern Business Architect",
  description: "Rejoin the Modern Business Architect community after unsubscribing.",
  path: "/rejoin",
  index: false,
});

export default function RejoinPage() {
  const consent = getConsentCopy("membership-rejoin-v1.0")!;
  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="min-h-[70vh] bg-white px-6 py-24 md:px-12 lg:px-16">
        <div className="max-w-xl">
          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-4">Email preferences</p>
          <h1 className="text-3xl md:text-4xl font-light text-[#1a1816] mb-5">{consent.heading}</h1>
          <RejoinForm consent={{ id: consent.id, intro: consent.benefitIntro ?? "", note: consent.communityNote, buttonLabel: consent.buttonLabel, disclosure: consent.disclosure, privacyLinkText: consent.privacyLinkText }} />
        </div>
      </main>
    </>
  );
}
