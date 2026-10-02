import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import ConfirmOptInForm from "@/app/components/ConfirmOptInForm";
import { verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { getConfirmationContext } from "@/app/lib/resources/confirmation-context";
import { createPageMetadata } from "@/app/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Confirm your email | The Modern Business Architect",
  description: "Confirm your email address to receive community emails.",
  path: "/confirm",
  index: false,
});

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const check = verifyConfirmationToken(token);
  // Read-only lookup: what does confirming unlock for this link (if anything)? Opening the page changes nothing.
  const context = check.ok ? await getConfirmationContext(check.leadId) : null;
  const page = context?.access.confirmationPage;

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="min-h-[70vh] bg-white px-6 py-24 md:px-12 lg:px-16">
        <div className="max-w-xl">
          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-4">Email preferences</p>
          <h1 className="text-3xl md:text-4xl font-light text-[#1a1816] mb-5">{page?.heading ?? "Join the Modern Business Architect community"}</h1>
          {check.ok ? (
            <ConfirmOptInForm
              token={token}
              copy={page ? { button: page.button, doneHeading: page.doneHeading, doneBody: page.doneBody, downloadButton: page.downloadButton } : undefined}
              intro={
                page ? (
                  <div className="mb-8 space-y-3">
                    <p className="text-base leading-relaxed text-[#1a1816]/75">{page.intro}</p>
                    <p className="text-sm leading-relaxed text-[#1a1816]/60">{page.details}</p>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed text-[#1a1816]/70 mb-8">
                    Confirm your email address to receive occasional emails from Martin Dubreuil: practical ideas, new resources, updates and relevant offers. You can unsubscribe at any time, and anything you have already received stays yours either way.
                  </p>
                )
              }
            />
          ) : (
            <p className="text-sm text-[#6b1f1f]" role="alert">
              {check.reason === "expired"
                ? "This confirmation link has expired. Reply to the email you received and Martin will send a new one, or ask for the guide again on its page."
                : "This confirmation link is invalid. Reply to the email and Martin will help."}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
