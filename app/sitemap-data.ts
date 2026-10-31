import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/seo";
import { isProductionDeployment } from "@/app/lib/deployment";
import { PROGRAMS, programPath } from "@/app/lib/service-programs/catalog";
import { listPublishedResources } from "@/app/lib/resources/queries";
import { listPublishedForSitemap } from "@/app/lib/publications/queries";


const publicRoutes = [
  "/",
  "/work",
  ...PROGRAMS.map(programPath),
  "/martin",
  "/cases",
  "/cases/kill-it",
  "/cases/find-it",
  "/cases/validate-it",
  "/cases/evolve-it",
  "/cases/create-it",
  "/lets-talk",
  "/resources",
  "/privacy",
  "/thinking",
  "/thinking/your-business-idea-is-worth-nothing",
  "/thinking/an-app-is-not-a-business",
  "/thinking/your-corporate-experience-may-be-working-against-you",
  "/thinking/the-fastest-way-to-build-the-wrong-business",
  "/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts",
  "/thinking/the-brutal-truth-about-startup-fundraising",
  "/thinking/the-being-economy",
  "/thinking/the-business-architects-frame",
  "/thinking/how-to-define-your-ideal-customer",
  "/thinking/your-next-customer-might-not-visit-your-website",
  "/thinking/architecting-intelligence",
  "/thinking/anticipatory-business-architecture",
  "/answers",
  "/answers/what-is-business-architecture",
  "/answers/what-does-a-business-architect-do",
  "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
  "/answers/i-have-a-business-idea-but-no-money-what-should-i-do",
  "/answers/how-do-i-get-investors-for-my-business-idea",
  "/answers/i-built-an-app-how-do-i-turn-it-into-a-business",
  "/answers/the-10-signs-youre-serious-about-starting-a-business",
  "/answers/how-do-i-define-my-ideal-customer-profile",
  "/answers/how-do-i-find-a-business-idea",
  "/answers/how-do-you-build-a-product-if-you-cannot-get-funding",
  "/answers/how-should-i-use-ai-in-my-business",
  "/answers/how-do-i-turn-my-years-of-experience-into-a-business",
  "/answers/what-kind-of-business-can-i-start-with-the-skills-i-already-have",
  "/answers/am-i-too-old-to-start-a-business",
  "/answers/full-time-or-flexible-job-starting-business",
  "/answers/how-to-start-a-restaurant-consulting-business",
  "/answers/can-i-start-a-business-without-risking-my-financial-future",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Non-production deployments publish no URLs (and never read the database for this).
  if (!isProductionDeployment()) return [];

  const staticEntries = publicRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));

  // Resources are DB-driven (unlike the hardcoded arrays above), so the
  // sitemap picks up newly published ones automatically. Fails soft: if
  // Supabase isn't configured (e.g. at build time in a fresh environment),
  // the sitemap still generates with just the static routes.
  let entries: MetadataRoute.Sitemap = staticEntries;
  try {
    const resources = await listPublishedResources();
    const resourceEntries = resources.map((r) => ({
      url: new URL(`/resources/${r.slug}`, SITE_URL).toString(),
      lastModified: r.updated_at,
    }));
    entries = [...entries, ...resourceEntries];
  } catch (error) {
    console.error("Sitemap: failed to load resources, falling back to static routes.", error);
  }

  // Publications are database-driven too: only PUBLISHED titles appear, so a new title needs no code change and a
  // draft or unpublished one is never listed. The catalogue page itself is listed only when it has something in it.
  try {
    const publications = await listPublishedForSitemap();
    if (publications.length > 0) {
      entries = [
        ...entries,
        { url: new URL("/publications", SITE_URL).toString() },
        ...publications.map((p) => ({
          url: new URL(`/publications/${p.slug}`, SITE_URL).toString(),
          lastModified: p.updatedAt,
        })),
      ];
    }
  } catch (error) {
    console.error("Sitemap: failed to load publications.", error);
  }

  return entries;
}
