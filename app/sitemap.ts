import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/seo";
import { listPublishedResources } from "@/app/lib/resources/queries";

const publicRoutes = [
  "/",
  "/work",
  "/work-with-me",
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = publicRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));

  // Resources are DB-driven (unlike the hardcoded arrays above), so the
  // sitemap picks up newly published ones automatically. Fails soft: if
  // Supabase isn't configured (e.g. at build time in a fresh environment),
  // the sitemap still generates with just the static routes.
  try {
    const resources = await listPublishedResources();
    const resourceEntries = resources.map((r) => ({
      url: new URL(`/resources/${r.slug}`, SITE_URL).toString(),
      lastModified: r.updated_at,
    }));
    return [...staticEntries, ...resourceEntries];
  } catch (error) {
    console.error("Sitemap: failed to load resources, falling back to static routes.", error);
    return staticEntries;
  }
}
