import HomeHero from "@/app/components/home/HomeHero";
import Navigation from "@/app/components/Navigation";
import { PageStructuredData } from "@/app/components/PageStructuredData";
import FeaturedPublication from "@/app/components/publications/FeaturedPublication";
import { getFeaturedPublication } from "@/app/lib/publications/queries";
import type { PublicPublication } from "@/app/lib/publications/types";

// The featured publication is chosen in the admin, so the page is rendered per request; it never caches a title
// that has since been unpublished.
export const dynamic = "force-dynamic";

async function loadFeatured(): Promise<PublicPublication | null> {
  try {
    return await getFeaturedPublication();
  } catch (error) {
    // The opening must never fail because the database is unavailable: just leave the feature out.
    console.error("Home: could not load the featured publication.", error);
    return null;
  }
}

export default async function Home() {
  const featured = await loadFeatured();

  return (
    <>
      <PageStructuredData
        name="The Modern Business Architect"
        description="Business Architecture for entrepreneurs: test what's worth building, architect how the business will work, and make it exist."
        path="/"
      />
      <Navigation />
      {/* The hero (client component, sticky) and the featured publication share this <main>: the hero stays pinned only
          while this block is on screen, and the feature scrolls up over it. */}
      <main>
        <HomeHero />
        {featured ? <FeaturedPublication publication={featured} /> : null}
      </main>
    </>
  );
}
