import Link from "next/link";
import type { PublicPublication } from "@/app/lib/publications/types";
import PublicationCover from "./PublicationCover";
import RetailerLinks from "./RetailerLinks";
import { availabilityLabel, paragraphs } from "./format";

/**
 * The catalogue: one substantial presentation for a single title, otherwise editorial rows (a cover beside the
 * title, author and introduction). Rows scale to any number of titles; there is no grid to leave half empty, and
 * no filter or carousel to operate.
 */
export default function PublicationCatalogue({ publications }: { publications: PublicPublication[] }) {
  if (publications.length === 1) return <SingleTitle publication={publications[0]} />;
  return (
    <ol className="divide-y divide-[#1a1816]/10 border-y border-[#1a1816]/10">
      {publications.map((p) => (
        <li key={p.slug}>
          <Row publication={p} />
        </li>
      ))}
    </ol>
  );
}

function SingleTitle({ publication: p }: { publication: PublicPublication }) {
  return (
    <div className={p.cover ? "grid gap-12 border-t border-[#1a1816]/10 pt-16 lg:grid-cols-12 lg:gap-20 lg:pt-24" : "border-t border-[#1a1816]/10 pt-16 lg:pt-24"}>
      {p.cover ? (
        <Link
          href={`/publications/${p.slug}`}
          aria-label={`${p.title}: view the publication`}
          className="mx-auto block w-full max-w-[17rem] sm:max-w-xs lg:col-span-5 lg:mx-0 lg:max-w-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
        >
          <PublicationCover cover={p.cover} priority sizes="(min-width: 1024px) 28rem, 20rem" />
        </Link>
      ) : null}
      <div className={p.cover ? "lg:col-span-7" : "max-w-3xl border-l-2 border-[#6b1f1f] pl-6 md:pl-10"}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">{availabilityLabel(p.availability)}</p>
        <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-tight [overflow-wrap:anywhere] md:text-6xl">
          <Link href={`/publications/${p.slug}`} className="hover:text-[#6b1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]">
            {p.title}
          </Link>
        </h2>
        {p.subtitle ? <p className="mt-5 font-serif text-xl italic leading-snug text-[#1a1816]/75 md:text-2xl">{p.subtitle}</p> : null}
        <p className="mt-6 text-sm uppercase tracking-widest text-[#1a1816]/70">By {p.author}</p>
        <div className="mt-8 space-y-4 font-serif text-lg leading-relaxed text-[#1a1816]/90 md:text-xl">
          {paragraphs(p.introduction).map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
        <Link
          href={`/publications/${p.slug}`}
          className="mt-10 inline-block border-b-2 border-[#6b1f1f] pb-1 text-sm font-semibold uppercase tracking-widest text-[#6b1f1f] hover:border-[#6b1f1f]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
        >
          About the publication →
        </Link>
        {p.retailers.length > 0 ? (
          <div className="mt-12">
            <RetailerLinks retailers={p.retailers} label={p.availability === "available" ? "Where to find it" : "Links"} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ publication: p }: { publication: PublicPublication }) {
  return (
    <div className={p.cover ? "grid gap-8 py-14 sm:grid-cols-[9rem_1fr] md:grid-cols-[12rem_1fr] md:gap-12 md:py-20" : "py-14 md:py-20"}>
      {p.cover ? (
        <Link
          href={`/publications/${p.slug}`}
          aria-label={`${p.title}: view the publication`}
          className="block w-36 sm:w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
        >
          <PublicationCover cover={p.cover} sizes="(min-width: 768px) 12rem, 9rem" />
        </Link>
      ) : null}
      <div className={p.cover ? "" : "max-w-3xl border-l-2 border-[#6b1f1f] pl-6 md:pl-10"}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">{availabilityLabel(p.availability)}</p>
        <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight [overflow-wrap:anywhere] md:text-4xl">
          <Link href={`/publications/${p.slug}`} className="hover:text-[#6b1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]">
            {p.title}
          </Link>
        </h2>
        {p.subtitle ? <p className="mt-3 font-serif text-lg italic text-[#1a1816]/75 md:text-xl">{p.subtitle}</p> : null}
        <p className="mt-4 text-xs uppercase tracking-widest text-[#1a1816]/70">By {p.author}</p>
        <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-[#1a1816]/85 line-clamp-4">{p.introduction}</p>
        <Link
          href={`/publications/${p.slug}`}
          className="mt-6 inline-block border-b border-[#6b1f1f] pb-0.5 text-xs font-semibold uppercase tracking-widest text-[#6b1f1f] hover:border-[#6b1f1f]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
        >
          About the publication →
        </Link>
      </div>
    </div>
  );
}
