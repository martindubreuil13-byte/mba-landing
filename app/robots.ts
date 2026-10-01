import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/seo";
import { isProductionDeployment } from "@/app/lib/deployment";

export default function robots(): MetadataRoute.Robots {
  // Previews and local builds: ask every crawler to stay out and advertise no sitemap.
  if (!isProductionDeployment()) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
