import { PRINCIPAL_NAME, SITE_URL } from "@/app/lib/seo";
import type { PublicationEdition, PublicPublication } from "@/app/lib/publications/types";

/**
 * Publications: schema.org Book JSON-LD.
 *
 * Only facts the admin actually entered are emitted. There are no ratings, reviews, endorsements or offers; the
 * publisher is never assumed to be MBA; a publication date is only claimed for a title marked Available; and an
 * ISBN is attached to the format it belongs to, never to the work as a whole.
 */

export const publicationUrl = (slug: string) => `${SITE_URL}/publications/${slug}`;

const FORMAT_TYPES: Array<[RegExp, string]> = [
  [/^(paperback|softcover|trade paperback)\b/i, "https://schema.org/Paperback"],
  [/^(hardcover|hardback)\b/i, "https://schema.org/Hardcover"],
  [/^(e-?book|epub|kindle|digital)\b/i, "https://schema.org/EBook"],
  [/^audio/i, "https://schema.org/AudiobookFormat"],
];

function bookFormat(format: string): string | undefined {
  return FORMAT_TYPES.find(([re]) => re.test(format.trim()))?.[1];
}

function workExample(edition: PublicationEdition, publication: PublicPublication) {
  const format = bookFormat(edition.format);
  if (!format && !edition.isbn) return null;
  return {
    "@type": "Book",
    name: publication.title,
    ...(format ? { bookFormat: format } : {}),
    ...(edition.isbn ? { isbn: edition.isbn } : {}),
  };
}

export function buildBookJsonLd(publication: PublicPublication) {
  const url = publicationUrl(publication.slug);
  const author =
    publication.author.trim().toLowerCase() === PRINCIPAL_NAME.toLowerCase()
      ? { "@id": `${SITE_URL}/#martin` }
      : { "@type": "Person", name: publication.author };
  const examples = publication.editions.map((e) => workExample(e, publication)).filter((e) => e !== null);

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${url}#book`,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    name: publication.title,
    ...(publication.subtitle ? { alternativeName: `${publication.title}: ${publication.subtitle}` } : {}),
    description: publication.introduction,
    author,
    ...(publication.publisher ? { publisher: { "@type": "Organization", name: publication.publisher } } : {}),
    ...(publication.availability === "available" && (publication.publicationDate || publication.publicationYear)
      ? { datePublished: publication.publicationDate ?? String(publication.publicationYear) }
      : {}),
    ...(publication.language ? { inLanguage: publication.language } : {}),
    ...(publication.themes.length ? { keywords: publication.themes.join(", ") } : {}),
    ...(publication.cover ? { image: publication.cover.src } : {}),
    ...(examples.length ? { workExample: examples } : {}),
  };
}
