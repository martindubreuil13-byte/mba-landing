import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import CommunityVerifyForm from "@/app/components/community/CommunityVerifyForm";
import { verifyCommunityVerificationToken } from "@/app/lib/community/verification";
import { createPageMetadata } from "@/app/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Confirm your email | The Modern Business Architect",
  description: "Confirm your email address to stay in the loop.",
  path: "/community/verify",
  index: false,
});
export const dynamic = "force-dynamic";

export default async function CommunityVerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  // Read-only: opening this page changes nothing. Only the button's POST can activate anything.
  const check = verifyCommunityVerificationToken(token);
  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="min-h-[70vh] bg-white px-6 py-24 md:px-12 lg:px-16">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">Email preferences</p>
          <h1 className="mb-5 text-3xl font-light text-[#1a1816] md:text-4xl">Stay in the loop</h1>
          {check.ok ? (
            <>
              <p className="mb-8 text-base leading-relaxed text-[#1a1816]/70">Confirm that this is your email address and you would like to receive occasional emails from The Modern Business Architect with practical ideas, resources, events and opportunities. You can unsubscribe at any time. Your booking is not affected either way.</p>
              <CommunityVerifyForm token={token} />
            </>
          ) : (
            <p role="alert" className="text-sm text-[#6b1f1f]">
              {check.reason === "expired" ? "This link has expired, and nothing has been activated. You can say yes again the next time you book a conversation." : "This link is not valid."}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
