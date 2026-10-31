import Link from "next/link";
import type { PublicPublication } from "@/app/lib/publications/types";
import PublicationCover from "./PublicationCover";
import { availabilityLabel } from "./format";

/**
 * Homepage feature. One restrained block that appears after the opening composition; the page renders nothing at
 * all when no published title is featured. Everything shown comes from the selected publication.
 */
export default function FeaturedPublication({ publication: p }: { publication: PublicPublication }) {
  return (
    <section
      aria-labelledby="featured-publication-title"
      // Opaque and stacked above the pinned hero, so it scrolls up over it and stays readable and clickable.
      className="relative z-10 w-full border-t border-[#1a1816]/10 bg-[#f5f1ed] px-6 py-24 text-[#1a1816] md:px-12 md:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-12 text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">
          Publication <span aria-hidden="true" className="mx-2 text-[#1a1816]/30">/</span>
          <span className="text-[#1a1816]/60">{availabilityLabel(p.availability)}</span>
        </p>
        <div className={p.cover ? "grid items-center gap-12 md:grid-cols-12 md:gap-16" : ""}>
          {p.cover ? (
            <Link
              href={`/publications/${p.slug}`}
              aria-label={`${p.title}: view the publication`}
              className="mx-auto block w-full max-w-[13rem] md:col-span-4 md:mx-0 md:max-w-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
            >
              <PublicationCover cover={p.cover} sizes="(min-width: 768px) 20rem, 13rem" />
            </Link>
          ) : null}
          <div className={p.cover ? "md:col-span-8" : "max-w-3xl border-l-2 border-[#6b1f1f] pl-6 md:pl-10"}>
            <h2 id="featured-publication-title" className="font-serif text-3xl leading-tight tracking-tight [overflow-wrap:anywhere] md:text-5xl">
              {p.title}
            </h2>
            {p.subtitle ? <p className="mt-4 font-serif text-lg italic text-[#1a1816]/75 md:text-xl">{p.subtitle}</p> : null}
            <p className="mt-5 text-xs uppercase tracking-widest text-[#1a1816]/70">By {p.author}</p>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-[#1a1816]/85 line-clamp-4 md:text-xl">{p.introduction}</p>
            <Link
              href={`/publications/${p.slug}`}
              className="mt-8 inline-block border-b-2 border-[#6b1f1f] pb-1 text-sm font-semibold uppercase tracking-widest text-[#6b1f1f] hover:border-[#6b1f1f]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
            >
              About the publication →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
