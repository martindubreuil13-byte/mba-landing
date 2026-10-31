import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { PageStructuredData } from "@/app/components/PageStructuredData";
import PublicationCatalogue from "@/app/components/publications/PublicationCatalogue";
import { listPublishedPublications } from "@/app/lib/publications/queries";
import type { PublicPublication } from "@/app/lib/publications/types";
import { createPageMetadata } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

const title = "Publications";
const description = "Books and long-form work from The Modern Business Architect.";

async function load(): Promise<PublicPublication[]> {
  try {
    return await listPublishedPublications();
  } catch (error) {
    console.error("Publications: could not load the catalogue.", error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  // A catalogue with nothing in it is a thin page: keep it out of the index until there is something to list.
  const publications = await load();
  return createPageMetadata({ title, description, path: "/publications", index: publications.length > 0 });
}

export default async function PublicationsPage() {
  const publications = await load();

  return (
    <>
      <PageStructuredData name={title} description={description} path="/publications" emit={publications.length > 0} />
      <Navigation />
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-[#f5f1ed] text-[#1a1816]">
        <section className="w-full px-6 pb-16 pt-28 md:px-12 md:pb-24 md:pt-40 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">The Modern Business Architect</p>
            <h1 className="font-serif text-5xl font-normal leading-tight tracking-tight md:text-7xl">Publications</h1>
          </div>
        </section>

        <section className="w-full px-6 pb-24 md:px-12 md:pb-36 lg:px-16" aria-label="Catalogue">
          <div className="mx-auto max-w-6xl">
            {publications.length > 0 ? (
              <PublicationCatalogue publications={publications} />
            ) : (
              <p className="max-w-xl border-t border-[#1a1816]/10 pt-10 font-serif text-xl leading-relaxed text-[#1a1816]/75">
                There are no publications to show yet.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
