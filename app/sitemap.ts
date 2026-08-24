import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/seo";

const publicRoutes = [
  "/",
  "/work",
  "/martin",
  "/cases",
  "/cases/kill-it",
  "/cases/find-it",
  "/cases/validate-it",
  "/cases/evolve-it",
  "/cases/create-it",
  "/lets-talk",
  // /thinking is excluded while it is a noindex placeholder
  // Restore to publicRoutes only when substantive THINKING content launches and index is restored to true
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));
}
