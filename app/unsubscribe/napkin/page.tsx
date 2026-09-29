import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import UnsubscribeForm from "@/app/components/napkin/UnsubscribeForm";
import { createPageMetadata } from "@/app/lib/seo";
import { verifyUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

export const metadata: Metadata = createPageMetadata({
  title: "Unsubscribe | The Modern Business Architect",
  description: "Update your email preference.",
  path: "/unsubscribe/napkin",
  index: false,
});

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = Boolean(verifyUnsubscribeToken(token));

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="min-h-[70vh] bg-white px-6 py-24 md:px-12 lg:px-16">
        <div className="max-w-xl">
          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-4">Email preferences</p>
          <h1 className="text-3xl md:text-4xl font-light text-[#1a1816] mb-5">Unsubscribe from community emails</h1>
          <p className="text-base leading-relaxed text-[#1a1816]/70 mb-8">This stops future community and marketing emails. Your Napkin Principle submission is kept as described in the privacy policy.</p>
          {valid ? <UnsubscribeForm token={token} /> : <p className="text-sm text-[#6b1f1f]" role="alert">This unsubscribe link is invalid. Reply to the email and Martin will help.</p>}
        </div>
      </main>
    </>
  );
}
