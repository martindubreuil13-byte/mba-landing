import Link from "next/link";
import { notFound } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { PageStructuredData } from "@/app/components/PageStructuredData";
import ProgramLinks from "@/app/components/service-programs/ProgramLinks";
import { BulletList, H4, ProcessList } from "@/app/components/service-programs/ProgramSections";
import { programPageStructuredData } from "@/app/components/service-programs/structured-data";
import { createPageMetadata, serializeJsonLd } from "@/app/lib/seo";
import {
  PROGRAMS,
  bespokeFollowUp,
  ctaExplainer,
  ctaHref,
  formatPrice,
  hashFor,
  metaDescription,
  priceKindLabel,
  programBySlug,
  programPath,
} from "@/app/lib/service-programs/catalog";

/* Dedicated, indexable, fully server-rendered page per program. Everything comes from the catalog. */

export const dynamicParams = false;

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = programBySlug(slug);
  if (!p) return {};
  return createPageMetadata({ title: p.seoTitle, description: metaDescription(p), path: programPath(p) });
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = programBySlug(slug);
  if (!p) notFound();
  const follow = bespokeFollowUp(p);

  return (
    <>
      <PageStructuredData name={p.seoTitle} description={metaDescription(p)} path={programPath(p)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(programPageStructuredData(p)) }} />
      <Navigation />
      <div className="h-16" />

      <main className="w-full bg-white text-[#1a1816]">
        <article className="px-6 pb-20 pt-10 md:px-12 md:pb-28 md:pt-14 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <nav aria-label="Breadcrumb" className="text-sm text-[#1a1816]/75">
              <ol className="flex flex-wrap items-center gap-2">
                <li><Link href="/" className="underline underline-offset-4">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/work" className="underline underline-offset-4">Work</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page">{p.name}</li>
              </ol>
            </nav>

            <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">Program {p.number} · {priceKindLabel(p)}</p>
            <h1 className="mt-4 text-4xl font-light leading-tight tracking-tight md:text-6xl">{p.name}</h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-[#1a1816]/85">{p.help}</p>

            <dl className="mt-10 grid gap-6 border-y border-[#1a1816]/20 py-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#1a1816]/70">Investment</dt>
                <dd className="mt-1 text-3xl font-medium tabular-nums">{formatPrice(p)}</dd>
                {p.priceNote && <dd className="mt-1 text-sm text-[#1a1816]/80">{p.priceNote}</dd>}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#1a1816]/70">Timeline</dt>
                <dd className="mt-1 text-xl leading-snug">{p.duration}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#1a1816]/70">Delivery</dt>
                <dd className="mt-1 text-base leading-snug">{p.delivery}</dd>
              </div>
            </dl>
            {p.durationQualifier && <p className="mt-4 rounded-sm bg-[#f5f1ed] px-4 py-3 text-sm leading-relaxed">{p.durationQualifier}</p>}

            <div className="mt-8">
              <Link href={ctaHref(p)} className="inline-flex min-h-14 w-full items-center justify-center bg-[#6b1f1f] px-8 text-base font-semibold text-white transition-colors hover:bg-[#531818] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f] sm:w-auto">
                {p.cta.label}
              </Link>
              <p className="mt-3 text-sm font-medium">{ctaExplainer()}</p>
            </div>

            <section aria-labelledby="situation" className="mt-16">
              <h2 id="situation" className="text-2xl font-light tracking-tight md:text-3xl">The situation this addresses</h2>
              <p className="mt-4 text-2xl font-normal leading-snug">&ldquo;{p.situation}&rdquo;</p>
              <h3 className={`mt-8 ${H4}`}>Who it&rsquo;s for</h3>
              <p className="mt-2 text-base leading-relaxed text-[#1a1816]/85">{p.fit}</p>
              {p.positioning && <p className="mt-6 border-l-2 border-[#6b1f1f] pl-4 text-lg italic">{p.positioning}</p>}
            </section>

            <section aria-labelledby="receive" className="mt-14">
              <h2 id="receive" className="text-2xl font-light tracking-tight md:text-3xl">What you receive</h2>
              <p className="mt-4 text-lg leading-relaxed">{p.deliverable}</p>
              <p className="mt-3 text-base leading-relaxed text-[#1a1816]/85">{p.outcome}</p>
            </section>

            <section aria-labelledby="how" className="mt-14">
              <h2 id="how" className="text-2xl font-light tracking-tight md:text-3xl">How it works</h2>
              <div className="mt-4"><ProcessList program={p} /></div>
              {p.more && (
                <div className="mt-8">
                  <h3 className={`mb-3 ${H4}`}>{p.more.title}</h3>
                  <BulletList items={p.more.items} />
                </div>
              )}
            </section>

            <section aria-labelledby="scope" className="mt-14">
              <h2 id="scope" className="text-2xl font-light tracking-tight md:text-3xl">What this is not, and what&rsquo;s not included</h2>
              <div className="mt-4"><BulletList items={p.boundaries} /></div>
              {follow && <p className="mt-4 text-base leading-relaxed text-[#1a1816]/85">{follow}</p>}
              {p.note && <p className="mt-4 text-base leading-relaxed text-[#1a1816]/85">{p.note}</p>}
              <p className="mt-6 text-sm text-[#1a1816]/75">Nothing here is a guarantee of business viability, revenue, sales or funding.</p>
            </section>

            <section aria-labelledby="related" className="mt-16 border-t border-[#1a1816]/20 pt-8">
              <h2 id="related" className="text-xl font-medium">Other programs</h2>
              <p className="mt-2 text-sm text-[#1a1816]/80">Each is an independent starting point. You don&rsquo;t need one to take another.</p>
              <ProgramLinks exclude={p.number} className="mt-3 text-base" />
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-base">
                <Link href={`/work${hashFor(p)}`} className="inline-flex min-h-11 items-center font-semibold text-[#6b1f1f] underline underline-offset-4">See it on the selector →</Link>
                <Link href="/answers/what-is-business-architecture" className="inline-flex min-h-11 items-center underline underline-offset-4">What is business architecture?</Link>
                <Link href="/martin" className="inline-flex min-h-11 items-center underline underline-offset-4">About Martin Dubreuil</Link>
              </div>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
