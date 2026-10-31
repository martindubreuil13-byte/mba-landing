import { describe, expect, it } from "vitest";
import { buildBookJsonLd } from "./book-structured-data";
import type { PublicPublication } from "@/app/lib/publications/types";

const base: PublicPublication = {
  slug: "test-title",
  title: "Test Title",
  subtitle: null,
  author: "Jane Example",
  introduction: "Intro.",
  description: "Description.",
  readership: null,
  themes: [],
  availability: "forthcoming",
  publicationYear: null,
  publicationDate: null,
  publisher: null,
  language: null,
  editions: [],
  retailers: [],
  related: [],
  cover: null,
  featured: false,
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("Book JSON-LD", () => {
  it("emits only what is known: no publisher, date, ISBN, image or format for a bare forthcoming title", () => {
    const ld = buildBookJsonLd(base);
    expect(ld).toMatchObject({ "@type": "Book", "@id": "https://modernbusinessarchitect.com/publications/test-title#book", name: "Test Title", author: { "@type": "Person", name: "Jane Example" } });
    for (const key of ["publisher", "datePublished", "isbn", "image", "workExample", "inLanguage", "keywords", "offers", "aggregateRating", "review"]) expect(ld).not.toHaveProperty(key);
  });
  it("never invents reviews, ratings, endorsements, awards or offers, whatever the data", () => {
    const text = JSON.stringify(buildBookJsonLd({
      ...base, availability: "available", publicationYear: 2026, publisher: "P",
      retailers: [{ name: "Shop", url: "https://shop.com/x" }],
      editions: [{ format: "Paperback", isbn: "9780306406157" }],
    }));
    expect(text).not.toMatch(/offers|aggregateRating|review|award|price|endorse|rating/i);
    expect(text).not.toContain("shop.com"); // retailer links are navigation, not structured claims
  });
  it("claims a date only for an available title, preferring the exact date", () => {
    expect(buildBookJsonLd({ ...base, publicationYear: 2027 })).not.toHaveProperty("datePublished");
    expect(buildBookJsonLd({ ...base, availability: "available", publicationYear: 2026 })).toMatchObject({ datePublished: "2026" });
    expect(buildBookJsonLd({ ...base, availability: "available", publicationYear: 2026, publicationDate: "2026-03-04" })).toMatchObject({ datePublished: "2026-03-04" });
  });
  it("attaches each ISBN to its own format, never to the work as a whole", () => {
    const ld = buildBookJsonLd({ ...base, editions: [{ format: "Paperback", isbn: "9780306406157" }, { format: "eBook (EPUB)", isbn: null }, { format: "Signed edition", isbn: null }] }) as { workExample: unknown[] };
    expect(ld).not.toHaveProperty("isbn");
    expect(ld.workExample).toEqual([
      { "@type": "Book", name: "Test Title", bookFormat: "https://schema.org/Paperback", isbn: "9780306406157" },
      { "@type": "Book", name: "Test Title", bookFormat: "https://schema.org/EBook" },
    ]);
  });
  it("uses the publisher only when one was entered, and never assumes MBA", () => {
    expect(buildBookJsonLd({ ...base, publisher: "Acme Press" })).toMatchObject({ publisher: { "@type": "Organization", name: "Acme Press" } });
    expect(JSON.stringify(buildBookJsonLd(base))).not.toMatch(/Modern Business Architect/);
  });
  it("references the existing Martin entity when he is the author", () => {
    expect(buildBookJsonLd({ ...base, author: "Martin Dubreuil" })).toMatchObject({ author: { "@id": "https://modernbusinessarchitect.com/#martin" } });
  });
  it("includes the cover image only when there is one", () => {
    const ld = buildBookJsonLd({ ...base, cover: { src: "https://cdn/x.webp", thumbSrc: "https://cdn/t.webp", width: 10, height: 15, alt: "a" } });
    expect(ld).toMatchObject({ image: "https://cdn/x.webp" });
  });
});
