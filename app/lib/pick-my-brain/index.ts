import "server-only";
import { listPublishedResources } from "@/app/lib/resources/queries";
import { STATIC_DISCOVERY_RECORDS, RESOURCE_HINTS, type DiscoveryRecord } from "./content";
import { buildIndex, type SearchIndex } from "./search";

// Free Resources are DB-driven, so the index is rebuilt periodically rather
// than once per deploy: a resource published in Admin becomes searchable
// within a few minutes without a redeploy.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { index: SearchIndex; builtAt: number } | null = null;

async function loadResourceRecords(): Promise<DiscoveryRecord[]> {
  try {
    const resources = await listPublishedResources();
    return resources.map((r) => ({
      href: `/resources/${r.slug}`,
      type: "Free Resource",
      title: r.title,
      description: r.short_description,
      intents: RESOURCE_HINTS[r.slug]?.intents ?? [],
      topics: [r.resource_type, r.audience ?? "", ...(RESOURCE_HINTS[r.slug]?.topics ?? [])].filter(Boolean),
      body: r.long_description ?? undefined,
    }));
  } catch (error) {
    // Fail soft, like the sitemap: search still works over static content.
    console.error("Pick My Brain: failed to load resources for the index.", error);
    return [];
  }
}

export async function getSearchIndex(): Promise<SearchIndex> {
  if (cached && Date.now() - cached.builtAt < CACHE_TTL_MS) return cached.index;
  const resourceRecords = await loadResourceRecords();
  const index = buildIndex([...STATIC_DISCOVERY_RECORDS, ...resourceRecords]);
  cached = { index, builtAt: Date.now() };
  return index;
}
