import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { PageStructuredData } from "@/app/components/PageStructuredData";
import PublicationDetail from "@/app/components/publications/PublicationDetail";
import { getPublishedPublicationBySlug } from "@/app/lib/publications/queries";
import { buildBookJsonLd } from "@/app/components/publications/book-structured-data";
import { createPageMetadata, serializeJsonLd } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** Unpublished and unknown slugs are the same thing to the outside world: a 404 with no title, image or tag. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedPublicationBySlug(slug);
  if (!p) notFound();

  return createPageMetadata({
    title: p.subtitle ? `${p.title}: ${p.subtitle}` : p.title,
    description: p.introduction.replace(/\s+/g, " ").slice(0, 200),
    path: `/publications/${p.slug}`,
    openGraphType: "book",
    authors: [p.author],
    image: {
      url: `/publications/${p.slug}/og`,
      width: 1200,
      height: 630,
      alt: p.cover ? p.cover.alt : `${p.title}, by ${p.author}`,
      type: "image/png",
    },
  });
}

export default async function PublicationPage({ params }: Props) {
  const { slug } = await params;
  const publication = await getPublishedPublicationBySlug(slug);
  if (!publication) notFound();

  return (
    <>
      <PageStructuredData
        name={publication.title}
        description={publication.introduction.replace(/\s+/g, " ").slice(0, 200)}
        path={`/publications/${publication.slug}`}
        includeAuthor={false}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBookJsonLd(publication)) }} />
      <Navigation />
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-[#f5f1ed] text-[#1a1816]">
        <PublicationDetail publication={publication} />
        <div className="h-16 md:h-24" />
      </main>
    </>
  );
}
