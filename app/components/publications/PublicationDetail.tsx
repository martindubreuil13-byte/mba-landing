import Link from "next/link";
import type { PublicPublication } from "@/app/lib/publications/types";
import PublicationCover from "./PublicationCover";
import RetailerLinks from "./RetailerLinks";
import { availabilityLabel, languageName, paragraphs, publicationDateLabel, relatedGroups } from "./format";

/**
 * The publication page body. One component renders it for the public site AND for the authenticated admin
 * preview, so what is reviewed is exactly what is published.
 */
export default function PublicationDetail({ publication: p }: { publication: PublicPublication }) {
  const dateLabel = publicationDateLabel(p);
  const groups = relatedGroups(p.related);
  const hasFacts = Boolean(p.publisher || dateLabel || p.language || p.editions.length > 0);
  const retailerLabel = p.availability === "available" ? "Where to find it" : "Links";

  return (
    <article className="w-full">
      <header className="w-full px-6 pb-20 pt-28 md:px-12 md:pb-28 md:pt-36 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-10 text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">
            <Link href="/publications" className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">
              Publications
            </Link>
            <span aria-hidden="true" className="mx-3 text-[#1a1816]/30">/</span>
            <span className="text-[#1a1816]/60">{availabilityLabel(p.availability)}</span>
          </p>

          <div className={p.cover ? "grid gap-14 lg:grid-cols-12 lg:gap-20" : ""}>
            {p.cover ? (
              <div className="mx-auto w-full max-w-[17rem] sm:max-w-xs lg:col-span-5 lg:mx-0 lg:max-w-md">
                <div className="lg:sticky lg:top-28">
                  <PublicationCover cover={p.cover} priority sizes="(min-width: 1024px) 28rem, 20rem" />
                </div>
              </div>
            ) : null}

            <div className={p.cover ? "lg:col-span-7" : "max-w-3xl border-l-2 border-[#6b1f1f] pl-6 md:pl-10"}>
              <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-tight [overflow-wrap:anywhere] md:text-6xl">
                {p.title}
              </h1>
              {p.subtitle ? (
                <p className="mt-6 font-serif text-xl italic leading-snug text-[#1a1816]/75 md:text-2xl">{p.subtitle}</p>
              ) : null}
              <p className="mt-8 text-sm uppercase tracking-widest text-[#1a1816]/70">By {p.author}</p>

              <div className="mt-10 space-y-5 font-serif text-lg leading-relaxed text-[#1a1816]/90 md:text-xl">
                {paragraphs(p.introduction).map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>

              {p.retailers.length > 0 ? (
                <div className="mt-12">
                  <RetailerLinks retailers={p.retailers} label={retailerLabel} />
                </div>
              ) : null}
              {p.availability === "forthcoming" ? (
                <p className="mt-10 border-t border-[#1a1816]/10 pt-6 text-sm text-[#1a1816]/70">
                  Forthcoming{dateLabel ? `, ${dateLabel}` : ""}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="pub-about" className="w-full border-t border-[#1a1816]/10 px-6 py-20 md:px-12 md:py-28 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:gap-20">
          <h2 id="pub-about" className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f] lg:col-span-3">
            About {p.cover ? "the book" : "this title"}
          </h2>
          <div className="space-y-6 text-lg leading-relaxed text-[#1a1816]/85 lg:col-span-7">
            {paragraphs(p.description).map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </div>
      </section>

      {p.themes.length > 0 || p.readership ? (
        <section aria-label="Themes and readership" className="w-full border-t border-[#1a1816]/10 px-6 py-16 md:px-12 md:py-24 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-12 lg:gap-20">
            {p.themes.length > 0 ? (
              <div className="lg:col-span-5 lg:col-start-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">Themes</h2>
                <ul className="mt-5 space-y-2 text-lg text-[#1a1816]/85">
                  {p.themes.map((theme, i) => (
                    <li key={i} className="[overflow-wrap:anywhere]">{theme}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {p.readership ? (
              <div className={p.themes.length > 0 ? "lg:col-span-4" : "lg:col-span-7 lg:col-start-4"}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">Who it is for</h2>
                <div className="mt-5 space-y-4 text-lg leading-relaxed text-[#1a1816]/85">
                  {paragraphs(p.readership).map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasFacts ? (
        <section aria-labelledby="pub-details" className="w-full border-t border-[#1a1816]/10 px-6 py-16 md:px-12 md:py-24 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:gap-20">
            <h2 id="pub-details" className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f] lg:col-span-3">
              Publication details
            </h2>
            <dl className="grid gap-x-10 gap-y-6 text-base sm:grid-cols-2 lg:col-span-7">
              {p.publisher ? <Fact term="Publisher" value={p.publisher} /> : null}
              {dateLabel ? <Fact term={p.publicationDate ? "Publication date" : "Year"} value={dateLabel} /> : null}
              {p.language ? <Fact term="Language" value={languageName(p.language)} /> : null}
              {p.editions.length > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-widest text-[#1a1816]/55">Formats</dt>
                  <dd className="mt-2">
                    <ul className="divide-y divide-[#1a1816]/10 border-y border-[#1a1816]/10">
                      {p.editions.map((edition, i) => (
                        <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                          <span className="[overflow-wrap:anywhere]">{edition.format}</span>
                          {edition.isbn ? (
                            <span className="text-sm tracking-wide text-[#1a1816]/70">
                              ISBN <span className="font-mono">{edition.isbn}</span>
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
      ) : null}

      {groups.length > 0 ? (
        <section aria-labelledby="pub-related" className="w-full border-t border-[#1a1816]/10 px-6 py-16 md:px-12 md:py-24 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:gap-20">
            <h2 id="pub-related" className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f] lg:col-span-3">
              Related reading
            </h2>
            <div className="space-y-10 lg:col-span-7">
              {groups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs uppercase tracking-widest text-[#1a1816]/55">{group.label}</h3>
                  <ul className="mt-3 divide-y divide-[#1a1816]/10 border-y border-[#1a1816]/10">
                    {group.items.map((item) => (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className="block py-4 text-lg leading-snug text-[#1a1816] hover:text-[#6b1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
                        >
                          {item.title} <span aria-hidden="true">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-[#1a1816]/55">{term}</dt>
      <dd className="mt-2 [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}
