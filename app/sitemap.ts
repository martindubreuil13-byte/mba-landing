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
  "/thinking/your-corporate-experience-may-be-working-against-you",
  "/thinking/the-fastest-way-to-build-the-wrong-business",
  "/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts",
  "/thinking/the-brutal-truth-about-startup-fundraising",
  "/answers",
  "/answers/what-is-business-architecture",
  "/answers/what-does-a-business-architect-do",
  "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));
}
