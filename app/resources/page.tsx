import Navigation from "@/app/components/Navigation";
import ResourcesIndexList, {
  type ResourceListItem,
} from "@/app/components/resources/ResourcesIndexList";
import FeaturedAssessmentCard from "@/app/components/resources/FeaturedAssessmentCard";
import { listPublishedResources } from "@/app/lib/resources/queries";
import { getResourceCoverUrl } from "@/app/lib/resources/storage";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await listPublishedResources();

  const items: ResourceListItem[] = resources.map((r) => ({
    slug: r.slug,
    title: r.title,
    short_description: r.short_description,
    resource_type: r.resource_type,
    audience: r.audience,
    coverUrl: getResourceCoverUrl(r),
  }));

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* OPENING */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">
                Resources
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                Free Resources
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                Practical guides, tools and field notes for people building businesses.
              </p>
            </div>
          </div>
        </section>

        {/* RESOURCES */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">
            <FeaturedAssessmentCard />
            <ResourcesIndexList resources={items} />
          </div>
        </section>

        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
