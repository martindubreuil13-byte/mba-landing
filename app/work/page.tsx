import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { PageStructuredData } from "@/app/components/PageStructuredData";
import ProgramLinks from "@/app/components/service-programs/ProgramLinks";
import ProgramSlider from "@/app/components/service-programs/ProgramSlider";
import { programsStructuredData } from "@/app/components/service-programs/structured-data";
import { createPageMetadata, serializeJsonLd } from "@/app/lib/seo";

const title = "Business Architecture Services for Every Stage of Your Journey";
const description = "Business architecture, coaching and consulting from Martin Dubreuil: eight independent programs for people exploring entrepreneurship, testing an idea, building a business or changing an established company. Start anywhere.";
export const metadata = createPageMetadata({ title, description, path: "/work" });

const APPROACH = [
  { title: "I challenge your assumptions.", body: "Ideas feel certain until someone tests them. I look for what you have not checked yet, before it costs you." },
  { title: "I design how the business works.", body: "Customer, offer, pricing, economics, operations and go-to-market, decided together instead of one piece at a time." },
  { title: "I coach you through the decisions.", body: "The business is yours. You make the calls; I make sure you make them with the full picture." },
  { title: "I help make it happen.", body: "Where it helps, I do the work alongside you, as agreed in writing. Design and implementation are separate engagements." },
];

export default function WorkPage() {
  return (
    <>
      <PageStructuredData name={title} description={description} path="/work" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(programsStructuredData()) }} />
      <Navigation />
      <div className="h-16" />

      <main className="w-full bg-white text-[#1a1816]">
        {/* 1. Opening + selector */}
        <section aria-labelledby="work-heading" className="px-6 pt-8 md:px-12 md:pt-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h1 id="work-heading" className="max-w-4xl text-4xl font-light leading-[1.08] tracking-tight md:text-6xl [text-wrap:balance]">
              Business Architecture.
              <br />
              <span className="text-[#6b1f1f]">Wherever you are in your journey.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#1a1816]/80 md:mt-6 md:text-xl">
              I work with people considering entrepreneurship, founders building businesses, and established companies that need significant change.
            </p>
          </div>
        </section>

        <div className="mt-6 border-y border-[#1a1816]/10 bg-[#f5f1ed] md:mt-8">
          <ProgramSlider />
        </div>

        {/* 2. Why a Business Architect */}
        <section aria-labelledby="why-heading" className="px-6 py-20 md:px-12 md:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h2 id="why-heading" className="max-w-3xl text-3xl font-light leading-tight tracking-tight md:text-5xl">
              Why work with a Business Architect?
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#1a1816]/80">
              Most people don&rsquo;t need more advice. They need someone who will challenge them, design the whole business with them, and stay with them until it exists. That&rsquo;s coaching, consulting and hands-on work in one practice.
            </p>
            <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {APPROACH.map((a) => (
                <div key={a.title} className="border-t border-[#1a1816]/25 pt-5">
                  <h3 className="text-xl font-medium">{a.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-[#1a1816]/80">{a.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-base text-[#1a1816]/80">
              New to the term?{" "}
              <Link href="/answers/what-is-business-architecture" className="underline underline-offset-4 decoration-[#1a1816]/40 hover:decoration-[#6b1f1f] hover:text-[#6b1f1f]">
                What is business architecture?
              </Link>
            </p>
          </div>
        </section>

        {/* 3. Final invitation */}
        <section aria-labelledby="invite-heading" className="bg-[#1a1816] px-6 py-20 text-[#f5f1ed] md:px-12 md:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h2 id="invite-heading" className="max-w-3xl text-3xl font-light leading-tight tracking-tight md:text-5xl">
              Don&rsquo;t see your situation?
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#f5f1ed]/85">
              Tell me where you are and what you&rsquo;re trying to do. We&rsquo;ll work out the right starting point, or whether I&rsquo;m the right person at all.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Link href="/lets-talk" className="inline-flex min-h-14 items-center bg-[#f5f1ed] px-8 text-base font-semibold text-[#1a1816] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5f1ed]">
                Start a conversation
              </Link>
              <Link href="/martin" className="inline-flex min-h-11 items-center text-base text-[#f5f1ed]/90 underline underline-offset-4 hover:text-white">
                Meet Martin
              </Link>
            </div>
            <nav aria-label="Program pages" className="mt-14 border-t border-[#f5f1ed]/20 pt-6">
              <p className="text-sm text-[#f5f1ed]/75">Prefer to read? Each program has its own page.</p>
              <ProgramLinks className="mt-2 text-sm text-[#f5f1ed]" />
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}
