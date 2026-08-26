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
  "/thinking",
  "/thinking/your-business-idea-is-worth-nothing",
  "/thinking/an-app-is-not-a-business",
  "/answers",
  "/answers/what-is-business-architecture",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));
}
